// Caché sencilla sobre localStorage con caducidad (TTL).
// Todas las operaciones van envueltas en try/catch: en modo privado, con el
// almacenamiento lleno o con datos corruptos, la app sigue funcionando sin caché.

const PREFIX = 'gundam-wiki:';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24 h

export function readCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const { savedAt, ttl, data } = JSON.parse(raw);
    const expired = Date.now() - savedAt > ttl;
    if (expired) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return { data, savedAt };
  } catch {
    return null;
  }
}

export function writeCache(key, data, ttl = DEFAULT_TTL_MS) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), ttl, data }));
    return true;
  } catch {
    // QuotaExceededError o almacenamiento deshabilitado: seguimos sin caché.
    return false;
  }
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    /* nada que limpiar */
  }
}
