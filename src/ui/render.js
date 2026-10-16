// Funciones que generan el HTML

const PLACEHOLDER_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#1b2433"/><text x="60" y="66" font-family="monospace" font-size="12" fill="#7d8aa5" text-anchor="middle">NO DATA</text></svg>',
)}`;

// Evita meter HTML de la API en la página
const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const imageTag = (gundam, className) => `
  <img class="${className}" src="${escapeHtml(gundam.image ?? PLACEHOLDER_IMG)}"
       alt="${escapeHtml(gundam.fullName)}" loading="lazy" referrerpolicy="no-referrer"
       data-fallback="${PLACEHOLDER_IMG}" />`;

// Si falla una imagen, ponemos la de reserva
export function attachImageFallbacks(root) {
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = img.dataset.fallback;
      img.removeAttribute('data-fallback');
    }, { once: true });
  });
}

export const renderLoading = (message = 'Conectando con la base de datos de la Federación…') => `
  <div class="state state--loading" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <p>${escapeHtml(message)}</p>
  </div>`;

export const renderError = (message) => `
  <div class="state state--error" role="alert">
    <p class="state__title">⚠ Error de transmisión</p>
    <p>${escapeHtml(message)}</p>
    <button type="button" class="btn" data-action="retry">Reintentar</button>
  </div>`;

export const renderEmpty = (message = 'Ningún mobile suit coincide con la búsqueda.') => `
  <div class="state state--empty">
    <p>${escapeHtml(message)}</p>
  </div>`;

export const renderUniverseOptions = (options, selected) =>
  [
    `<option value="all">Todos los universos</option>`,
    ...options.map(
      ({ name, count }) =>
        `<option value="${escapeHtml(name)}" ${name === selected ? 'selected' : ''}>${escapeHtml(name)} (${count})</option>`,
    ),
  ].join('');

export const renderStats = ({ total, universes, pilots, withImage, topPilot, topPilotCount }) => `
  <dl class="stats">
    <div><dt>Trajes</dt><dd>${total}</dd></div>
    <div><dt>Universos</dt><dd>${universes}</dd></div>
    <div><dt>Pilotos distintos</dt><dd>${pilots}</dd></div>
    <div><dt>Con imagen</dt><dd>${withImage}</dd></div>
    <div><dt>Piloto más repetido</dt><dd>${topPilot ? `${escapeHtml(topPilot)} (${topPilotCount})` : '—'}</dd></div>
  </dl>`;

const renderCard = (gundam) => `
  <li>
    <a class="card" href="#/gundam/${gundam.id}">
      ${imageTag(gundam, 'card__img')}
      <span class="card__code">${escapeHtml(gundam.code || `#${gundam.id}`)}</span>
      <span class="card__name">${escapeHtml(gundam.shortName)}</span>
      <span class="card__universe">${escapeHtml(gundam.universe)}</span>
    </a>
  </li>`;

export const renderList = (gundams, { shown, total }) => `
  <p class="results-count">Mostrando ${shown} de ${total} trajes</p>
  <ul class="grid">${gundams.map(renderCard).join('')}</ul>
  ${shown < total ? '<button type="button" class="btn btn--more" data-action="more">Cargar más</button>' : ''}`;

export const renderDetail = (gundam) => `
  <article class="detail">
    <a class="back" href="#/">← Volver al hangar</a>
    <header class="detail__header">
      ${gundam.code ? `<p class="detail__code">${escapeHtml(gundam.code)}</p>` : ''}
      <h2>${escapeHtml(gundam.shortName)}</h2>
      <p class="detail__universe">${escapeHtml(gundam.universe)}</p>
    </header>
    <div class="detail__body">
      ${imageTag(gundam, 'detail__img')}
      <div>
        ${
          gundam.quote
            ? `<blockquote class="quote">“${escapeHtml(gundam.quote.text)}”${
                gundam.quote.author ? `<footer>— ${escapeHtml(gundam.quote.author)}</footer>` : ''
              }</blockquote>`
            : ''
        }
        <p>${escapeHtml(gundam.description)}</p>
        <h3>Pilotos</h3>
        ${
          gundam.pilots.length
            ? `<ul class="pilots">${gundam.pilots.map((pilot) => `<li>${escapeHtml(pilot)}</li>`).join('')}</ul>`
            : '<p class="muted">Sin pilotos registrados.</p>'
        }
        <dl class="meta">
          <div><dt>ID</dt><dd>${gundam.id}</dd></div>
          <div><dt>Nombre completo</dt><dd>${escapeHtml(gundam.fullName)}</dd></div>
        </dl>
        ${
          gundam.wikiUrl
            ? `<a class="btn" href="${escapeHtml(gundam.wikiUrl)}" target="_blank" rel="noopener noreferrer">Ver en la Gundam Wiki ↗</a>`
            : ''
        }
      </div>
    </div>
  </article>`;

const formatAge = (ms) => {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.round(minutes / 60)} h`;
};

export const renderSource = ({ fromCache, savedAt }) =>
  fromCache ? `Datos de la caché local (${formatAge(Date.now() - savedAt)})` : 'Datos recién descargados de la API';
