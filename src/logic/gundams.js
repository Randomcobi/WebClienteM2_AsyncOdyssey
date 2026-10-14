// Lógica de dominio: limpia los datos crudos de la API y los prepara para la vista.
// Todo son funciones puras (mismas entradas -> mismas salidas, sin tocar el DOM).

import { detectUniverse } from './universes.js';

const NAMED_ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

/** Decodifica entidades HTML (&#8212;, &#x2014;, &amp;...) sin usar el DOM. */
const decodeEntities = (text) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] !== '#') return NAMED_ENTITIES[code.toLowerCase()] ?? match;
    const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return Number.isFinite(point) ? String.fromCodePoint(point) : match;
  });

/** Algunos nombres vienen url-encoded (p. ej. %EF%BC%BB). Si no se puede decodificar, se deja tal cual. */
const safeDecodeURI = (text) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

const cleanText = (value) =>
  typeof value === 'string'
    ? decodeEntities(value)
        .replace(/\[\d+\]/g, '') // referencias de la wiki: [1], [2]...
        .replace(/\s+/g, ' ')
        .trim()
    : '';

/** Separa el código de modelo ("RX-78-2") del nombre ("Gundam"). */
const splitModelCode = (fullName) => {
  const match = fullName.match(/^([A-Z0-9][\w()[\]/.-]*-[\w()[\]/.-]+)\s+(.+)$/);
  return match ? { code: match[1], shortName: match[2] } : { code: '', shortName: fullName };
};

/**
 * Muchas cabeceras empiezan con una cita: “ ... ” —Autor. Texto descriptivo.
 * La separamos para mostrarla aparte. Si el formato no encaja, todo es descripción.
 */
const splitQuote = (header, fullName) => {
  const match = header.match(/^“\s*(.+?)\s*”\s*—\s*(.+)$/);
  if (!match) return { quote: null, description: header };

  const [, text, rest] = match;
  // La descripción suele empezar en "The <modelo>"; lo anterior es la autoría de la cita.
  // Buscamos solo el primer fragmento del nombre porque a veces cambia el tipo de corchetes.
  const firstToken = fullName.match(/^[\w-]+/)?.[0] ?? fullName;
  const theIndex = rest.indexOf(`The ${firstToken}`);
  const start = theIndex > 0 ? theIndex : rest.indexOf(firstToken);

  return start > 0
    ? { quote: { text, author: rest.slice(0, start).trim() }, description: rest.slice(start) }
    : { quote: { text, author: '' }, description: rest };
};

/**
 * El campo "pilots" mezcla nombres con siglas de series ("Amuro Ray, MSG, Sayla Mass").
 * Descartamos las siglas (palabras de 2+ mayúsculas como "MSG") y los duplicados.
 */
const parsePilots = (pilots) => [
  ...new Set(
    cleanText(pilots)
      .split(',')
      .map((pilot) => pilot.trim())
      .filter((pilot) => pilot.length > 2 && /[a-z]/.test(pilot))
      .filter((pilot) => !pilot.split(' ').some((word) => /^[A-Z]{2,}$/.test(word))),
  ),
];

/** Convierte un objeto crudo de la API en un objeto listo para pintar (o null si es inservible). */
export function normalizeGundam(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null) return null;

  const fullName = cleanText(safeDecodeURI(raw.name ?? raw.wikiName ?? '')).replaceAll('_', ' ');
  if (!fullName) return null;

  const header = cleanText(raw.header);
  const { quote, description } = splitQuote(header, fullName);

  return {
    id: Number(raw.id),
    fullName,
    ...splitModelCode(fullName),
    quote,
    description: description || 'Sin descripción disponible.',
    pilots: parsePilots(raw.pilots),
    universe: detectUniverse(header),
    image: typeof raw.imgUrl === 'string' && raw.imgUrl.startsWith('http') ? raw.imgUrl : null,
    wikiUrl: typeof raw.wikiUrl === 'string' ? raw.wikiUrl : null,
  };
}

/** Normaliza la lista completa descartando entradas inválidas y duplicadas por id. */
export const normalizeGundams = (rawList = []) => [
  ...new Map(
    rawList
      .map(normalizeGundam)
      .filter(Boolean)
      .map((gundam) => [gundam.id, gundam]),
  ).values(),
];

const normalizeForSearch = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const SORTERS = {
  id: (a, b) => a.id - b.id,
  'name-asc': (a, b) => a.shortName.localeCompare(b.shortName),
  'name-desc': (a, b) => b.shortName.localeCompare(a.shortName),
  pilots: (a, b) => b.pilots.length - a.pilots.length || a.id - b.id,
};

/** Aplica búsqueda, filtros y orden. No modifica la lista original (toSorted). */
export function applyFilters(gundams, { query = '', universe = 'all', onlyWithImage = false, sort = 'id' } = {}) {
  const needle = normalizeForSearch(query.trim());

  return gundams
    .filter((g) => universe === 'all' || g.universe === universe)
    .filter((g) => !onlyWithImage || g.image)
    .filter(
      (g) =>
        !needle ||
        normalizeForSearch([g.fullName, ...g.pilots].join(' ')).includes(needle),
    )
    .toSorted(SORTERS[sort] ?? SORTERS.id);
}

/** Opciones para el selector de universo: [{ name, count }] ordenadas por número de trajes. */
export const getUniverseOptions = (gundams) =>
  Object.entries(Object.groupBy(gundams, (g) => g.universe))
    .map(([name, list]) => ({ name, count: list.length }))
    .toSorted((a, b) => b.count - a.count);

/** Estadísticas del conjunto de trajes que se está mostrando. */
export function getStats(gundams) {
  const pilotCounts = gundams
    .flatMap((g) => g.pilots)
    .reduce((counts, pilot) => counts.set(pilot, (counts.get(pilot) ?? 0) + 1), new Map());

  const [topPilot = null, topPilotCount = 0] = [...pilotCounts].reduce(
    (best, entry) => (entry[1] > best[1] ? entry : best),
    [null, 0],
  );

  return {
    total: gundams.length,
    universes: new Set(gundams.map((g) => g.universe)).size,
    pilots: pilotCounts.size,
    withImage: gundams.filter((g) => g.image).length,
    topPilot,
    topPilotCount,
  };
}

export const findGundam = (gundams, id) => gundams.find((g) => g.id === Number(id)) ?? null;
