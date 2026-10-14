// Capa de acceso a la Gundam API (https://gundam-api.pages.dev).
// Solo sabe hacer peticiones y devolver datos crudos: no transforma ni pinta nada.

import { readCache, writeCache } from './cache.js';

const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';
const TIMEOUT_MS = 10_000;
// La API acepta un `limit` alto: con una sola petición traemos el catálogo entero
// y así la búsqueda y los filtros funcionan sobre todos los trajes.
const ALL_LIMIT = 1000;

export class ApiError extends Error {
  constructor(message, { status = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
  } catch (error) {
    const message =
      error.name === 'AbortError'
        ? 'La API ha tardado demasiado en responder.'
        : 'No se pudo conectar con la API. Revisa tu conexión.';
    throw new ApiError(message, { cause: error });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ApiError(`La API respondió con un error (${response.status}).`, {
      status: response.status,
    });
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('La API devolvió una respuesta que no es JSON válido.', { cause: error });
  }
}

/**
 * Devuelve el listado completo de trajes en crudo.
 * Usa la caché de localStorage salvo que se pida `force`.
 * @returns {Promise<{ results: object[], fromCache: boolean, savedAt: number }>}
 */
export async function getAllGundams({ force = false } = {}) {
  const cacheKey = `gundams?limit=${ALL_LIMIT}`;

  if (!force) {
    const cached = readCache(cacheKey);
    if (cached) return { results: cached.data, fromCache: true, savedAt: cached.savedAt };
  }

  const json = await fetchJson(`/gundams?limit=${ALL_LIMIT}`);
  // Si la respuesta tiene una forma inesperada, devolvemos lista vacía en lugar de explotar.
  const results = Array.isArray(json?.results) ? json.results : [];

  if (results.length > 0) writeCache(cacheKey, results);
  return { results, fromCache: false, savedAt: Date.now() };
}
