// Caché en localStorage que caduca a las 24 h

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
    // Si no se puede guardar, seguimos sin caché
    return false;
  }
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Nada que borrar
  }
}
