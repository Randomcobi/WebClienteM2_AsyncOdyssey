// Punto de entrada: orquesta API, lógica y render. Mantiene el estado de la vista
// y conecta los eventos del usuario con las funciones puras de los otros módulos.

import './style.css';
import { getAllGundams } from './api/gundamApi.js';
import { clearCache } from './api/cache.js';
import { normalizeGundams, applyFilters, getUniverseOptions, getStats, findGundam } from './logic/gundams.js';
import {
  renderLoading,
  renderError,
  renderEmpty,
  renderList,
  renderDetail,
  renderStats,
  renderUniverseOptions,
  renderSource,
  attachImageFallbacks,
} from './ui/render.js';

const PAGE_SIZE = 24;

const dom = {
  view: document.querySelector('#view'),
  controls: document.querySelector('#controls'),
  search: document.querySelector('#search'),
  universe: document.querySelector('#universe'),
  sort: document.querySelector('#sort'),
  onlyImage: document.querySelector('#only-image'),
  stats: document.querySelector('#stats'),
  source: document.querySelector('#source'),
  refresh: document.querySelector('#refresh'),
};

const state = {
  status: 'idle', // idle | loading | error | ready
  error: null,
  gundams: [],
  filters: { query: '', universe: 'all', onlyWithImage: false, sort: 'id' },
  visible: PAGE_SIZE,
};

const setView = (html) => {
  dom.view.innerHTML = html;
  attachImageFallbacks(dom.view);
};

// ---- Vistas ----

function renderListView() {
  const filtered = applyFilters(state.gundams, state.filters);
  dom.stats.innerHTML = renderStats(getStats(filtered));

  if (filtered.length === 0) return setView(renderEmpty());

  const shown = filtered.slice(0, state.visible);
  setView(renderList(shown, { shown: shown.length, total: filtered.length }));
}

function renderDetailView(id) {
  const gundam = findGundam(state.gundams, id);
  setView(gundam ? renderDetail(gundam) : renderEmpty(`No existe ningún traje con el registro #${id}.`));
  window.scrollTo({ top: 0 });
}

function render() {
  if (state.status === 'loading') return setView(renderLoading());
  if (state.status === 'error') return setView(renderError(state.error));
  if (state.status !== 'ready') return;

  const detailId = location.hash.match(/^#\/gundam\/(\d+)$/)?.[1];
  dom.controls.hidden = Boolean(detailId);
  detailId ? renderDetailView(detailId) : renderListView();
}

// ---- Carga de datos ----

async function loadGundams({ force = false } = {}) {
  state.status = 'loading';
  dom.controls.hidden = true;
  dom.refresh.disabled = true;
  render();

  try {
    const { results, fromCache, savedAt } = await getAllGundams({ force });
    state.gundams = normalizeGundams(results);

    if (state.gundams.length === 0) {
      throw new Error('La API no ha devuelto ningún mobile suit utilizable.');
    }

    dom.universe.innerHTML = renderUniverseOptions(getUniverseOptions(state.gundams), state.filters.universe);
    dom.source.textContent = renderSource({ fromCache, savedAt });
    state.status = 'ready';
  } catch (error) {
    console.error(error);
    state.status = 'error';
    state.error = error.message || 'Error desconocido al cargar los datos.';
  } finally {
    dom.refresh.disabled = false;
    render();
  }
}

// ---- Eventos ----

const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

const updateFilters = (changes) => {
  state.filters = { ...state.filters, ...changes };
  state.visible = PAGE_SIZE;
  render();
};

dom.search.addEventListener('input', debounce((e) => updateFilters({ query: e.target.value }), 250));
dom.universe.addEventListener('change', (e) => updateFilters({ universe: e.target.value }));
dom.sort.addEventListener('change', (e) => updateFilters({ sort: e.target.value }));
dom.onlyImage.addEventListener('change', (e) => updateFilters({ onlyWithImage: e.target.checked }));

dom.view.addEventListener('click', ({ target }) => {
  const action = target.closest('[data-action]')?.dataset.action;
  if (action === 'retry') loadGundams({ force: true });
  if (action === 'more') {
    state.visible += PAGE_SIZE;
    render();
  }
});

dom.refresh.addEventListener('click', () => {
  clearCache();
  loadGundams({ force: true });
});

window.addEventListener('hashchange', render);

loadGundams();
