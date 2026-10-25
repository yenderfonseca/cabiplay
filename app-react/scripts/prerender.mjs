/**
 * Prerender real content into every route's HTML at build time.
 *
 * The app renders client side, so without this a crawler receives an empty
 * <div id="root"> — no text, no heading, nothing to index. Social scrapers
 * (WhatsApp, X, Facebook) never execute JS at all, so they would show a bare
 * link. This writes genuine markup into each file: it is what Google indexes,
 * and React hydrates over it for anyone with JS.
 *
 * Deliberately hand-rolled rather than pulling in a prerender framework: the
 * site is 23 routes of mostly static facts, so a build-time string template has
 * no runtime cost and nothing to keep in sync with a renderer version.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://yenderfonseca.com';
const BASE = '/cabiplay';

const stations = JSON.parse(readFileSync(join(dist, 'data/stations.json'), 'utf8'));
const shell = readFileSync(join(dist, 'index.html'), 'utf8');

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const GENRE_LABEL = {
  urbano: 'Urbano', gaitas: 'Gaitas y tradición', tropical: 'Salsa y tropical',
  pop: 'Pop y variada', recuerdos: 'Recuerdos', noticias: 'Noticias y opinión',
  cristiana: 'Cristiana',
};

function page({ title, description, path, image, jsonLd, body }) {
  const url = `${SITE}${BASE}${path}`;
  let html = shell;

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="cabiplay" />`,
    `<meta property="og:locale" content="es_VE" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '',
  ].filter(Boolean).join('\n    ');

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, '§TITLE§')
    .replace(/\s*<meta name="description"[^>]*>/g, '')
    .replace(/\s*<meta property="og:[^>]*>/g, '')
    .replace(/\s*<meta name="twitter:[^>]*>/g, '')
    .replace('§TITLE§', head);

  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

const siteLogo = `${SITE}${BASE}/brand/share.png`;

const byGenre = {};
for (const s of stations) (byGenre[s.genre] ||= []).push(s);

const homeBody = `
<main class="page">
  <h1>cabiplay · radio en vivo de Cabimas</h1>
  <p>Directorio de ${stations.length} emisoras de radio de Cabimas y la Costa Oriental del Lago,
  estado Zulia, Venezuela. Se escuchan en vivo desde el navegador, sin instalar nada.</p>
  ${Object.entries(byGenre).map(([g, list]) => `
  <section>
    <h2>${esc(GENRE_LABEL[g] || g)}</h2>
    <ul>${list.map((s) => `<li><a href="${BASE}/estacion/${s.slug}">${esc(s.name)}</a>${
      s.frequency && s.frequency !== 'WEB' ? ` — ${esc(s.frequency)}` : ' — señal online'
    }</li>`).join('')}</ul>
  </section>`).join('')}
  <p><a href="${BASE}/creditos">Cómo se hizo y aviso legal</a></p>
</main>`.trim();

writeFileSync(join(dist, 'index.html'), page({
  title: 'cabiplay · Radio en vivo de Cabimas y la Costa Oriental del Lago',
  description: `Escucha en vivo ${stations.length} emisoras de Cabimas y la Costa Oriental del Lago (Zulia, Venezuela). FM y online, gratis y sin instalar nada.`,
  path: '', image: siteLogo, body: homeBody,
  jsonLd: {
    '@context': 'https://schema.org', '@type': 'WebSite', name: 'cabiplay',
    url: `${SITE}${BASE}`, inLanguage: 'es-VE',
    description: 'Directorio de radio en vivo de Cabimas y la Costa Oriental del Lago.',
    publisher: { '@type': 'Person', name: 'Yender Fonseca', url: SITE },
  },
}));

mkdirSync(join(dist, 'estacion'), { recursive: true });
for (const s of stations) {
  const isFm = s.frequency && s.frequency !== 'WEB';
  const art = s.logo_local || s.logo;
  const image = art ? `${SITE}${BASE}/${art}` : siteLogo;
  const desc = s.description || `Escucha ${s.name} en vivo desde Cabimas, Zulia.`;
  const socials = Object.values(s.socials || {}).filter((v) => typeof v === 'string' && v.startsWith('http'));

  const body = `
<main class="page">
  <h1>${esc(s.name)}</h1>
  <p>${isFm ? `${esc(s.frequency)} · ` : 'Señal online · '}Cabimas, estado Zulia, Venezuela</p>
  <p>${esc(desc)}</p>
  <p>Escucha ${esc(s.name)} en vivo desde el navegador, sin instalar nada.</p>
  <p><a href="${BASE}/">Ver las ${stations.length} emisoras del directorio</a></p>
</main>`.trim();

  writeFileSync(join(dist, 'estacion', `${s.slug}.html`), page({
    title: `${s.name} en vivo · ${isFm ? s.frequency + ' · ' : ''}Cabimas · cabiplay`,
    description: `${desc} Escúchala en vivo desde Cabimas, Zulia.`.slice(0, 180),
    path: `/estacion/${s.slug}`, image, body,
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'RadioStation',
      name: s.name, url: `${SITE}${BASE}/estacion/${s.slug}`,
      description: desc, image,
      ...(isFm ? { broadcastFrequency: s.frequency } : {}),
      areaServed: { '@type': 'City', name: 'Cabimas', containedInPlace:
        { '@type': 'AdministrativeArea', name: 'Zulia, Venezuela' } },
      ...(socials.length ? { sameAs: socials } : {}),
    },
  }));
}

// App tabs. Real files, so a direct visit or a reload of /cabiplay/buscar is
// served by cleanUrls instead of depending on a rewrite rule.
for (const [file, title, description] of [
  ['buscar', 'Buscar emisoras · cabiplay', 'Busca emisoras de Cabimas por nombre, frecuencia, sector o género.'],
  ['biblioteca', 'Tu biblioteca · cabiplay', 'Tus emisoras favoritas y las que escuchaste hace poco.'],
]) {
  writeFileSync(join(dist, `${file}.html`), page({
    title, description, path: `/${file}`, image: siteLogo,
    body: `<main class="page"><h1>${esc(title.split(' · ')[0])}</h1><p>${esc(description)}</p></main>`,
  }));
}

writeFileSync(join(dist, 'creditos.html'), page({
  title: 'Cómo se hizo y aviso legal · cabiplay',
  description: 'Cómo se construyó cabiplay, de dónde salen los datos de las emisoras, y el aviso legal: es un directorio, no una emisora.',
  path: '/creditos', image: siteLogo,
  body: `
<main class="page">
  <h1>Cómo se hizo</h1>
  <p>cabiplay es un directorio abierto de la radio de Cabimas y la Costa Oriental
  del Lago. Reúne las señales que ya transmiten por internet y las pone en un solo lugar.</p>
  <h2>Aviso legal</h2>
  <p>cabiplay es un directorio, no una emisora. No transmite, no retransmite y no
  almacena audio. Cada ficha enlaza a la dirección pública que la propia emisora ya
  difunde en internet. Los nombres, logotipos y frecuencias pertenecen a cada emisora.</p>
  <p><a href="${BASE}/">Volver al directorio</a></p>
</main>`.trim(),
}));

const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${SITE}${BASE}`, pri: '1.0' },
  { loc: `${SITE}${BASE}/creditos`, pri: '0.4' },
  ...stations.map((s) => ({ loc: `${SITE}${BASE}/estacion/${s.slug}`, pri: '0.8' })),
];
writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n') +
  `\n</urlset>\n`);

console.log(`prerendered: 1 home + ${stations.length} stations + 1 credits, sitemap ${urls.length} urls`);
