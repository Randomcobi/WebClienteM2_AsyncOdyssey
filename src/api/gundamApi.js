// Peticiones a la Gundam API

import { readCache, writeCache } from './cache.js';

const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';
const TIMEOUT_MS = 10_000;
// Pedimos todos los trajes de una vez
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

// Devuelve todos los trajes (de la caché si los hay)
export async function getAllGundams({ force = false } = {}) {
  const cacheKey = `gundams?limit=${ALL_LIMIT}`;

  if (!force) {
    const cached = readCache(cacheKey);
    if (cached) return { results: cached.data, fromCache: true, savedAt: cached.savedAt };
  }

  const json = await fetchJson(`/gundams?limit=${ALL_LIMIT}`);
  // Si la respuesta es rara, devolvemos una lista vacía
  const results = Array.isArray(json?.results) ? json.results : [];

  if (results.length > 0) writeCache(cacheKey, results);
  return { results, fromCache: false, savedAt: Date.now() };
}
