// Canvas drawing shared by the lock screen / CarPlay artwork and the
// Instagram story image, so both look like the in-app cover.
// Logos are same-origin (/cabiplay/assets/logos), so the canvas never taints.

const BASE = import.meta.env.BASE_URL;
const BG = '#0b0f16';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Mix a station colour into the app background (like CSS color-mix).
export function mix(hex, amount, base = BG) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(/^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#1a2430');
  const b = p(base);
  return `rgb(${a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount))).join(',')})`;
}

const fontsReady = () =>
  Promise.all([
    document.fonts?.load('800 80px "Host Grotesk"'),
    document.fonts?.load('800 80px Archivo'),
  ]).catch(() => {});

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The cover: the station logo (cover or contain, as in the app), or the
// generated dial artwork when a station has no logo.
async function drawCover(ctx, station, x, y, size, radius) {
  ctx.save();
  roundRect(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.fillStyle = '#131a24';
  ctx.fillRect(x, y, size, size);

  const src = station.logo_hires || station.logo_local || station.logo;
  let img = null;
  if (src) img = await loadImage(`${BASE}${src}`).catch(() => null);

  if (img) {
    const contain = station.logo_fit === 'contain';
    const s = contain
      ? Math.min(size / img.width, size / img.height)
      : Math.max(size / img.width, size / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
  } else {
    const g = ctx.createRadialGradient(x + size / 2, y + size * 0.38, 0, x + size / 2, y + size * 0.38, size * 0.62);
    g.addColorStop(0, mix(station.theme_color, 0.55, '#131a24'));
    g.addColorStop(1, '#131a24');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
    const dial = station.dial || (station.frequency || '').replace(/[^\d.]/g, '');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2f6fa';
    ctx.font = `800 ${Math.round(size * 0.26)}px "Host Grotesk", Inter, sans-serif`;
    ctx.fillText(dial || 'WEB', x + size / 2, y + size * 0.56);
    ctx.fillStyle = '#ffb703';
    ctx.font = `800 ${Math.round(size * 0.07)}px "Host Grotesk", Inter, sans-serif`;
    ctx.fillText(dial ? 'FM' : 'ONLINE', x + size / 2, y + size * 0.7);
  }
  ctx.restore();
}

// Square PNG for navigator.mediaSession (lock screen, CarPlay, Android Auto).
export async function coverDataURL(station, size = 512) {
  await fontsReady();
  const c = document.createElement('canvas');
  c.width = c.height = size;
  await drawCover(c.getContext('2d'), station, 0, 0, size, 0);
  return c.toDataURL('image/png');
}

// Shrink a line until it fits, then ellipsize as a last resort.
function fitText(ctx, text, maxWidth, size, minSize, weight) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px "Host Grotesk", Inter, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return text;
    s -= 4;
  } while (s >= minSize);
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

// 1080x1920 Instagram story. Content stays inside the middle band: Instagram
// draws its own UI over roughly the top 250px and bottom 250px.
export async function storyBlob(station) {
  await fontsReady();
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, mix(station.theme_color, 0.7));
  bg.addColorStop(0.62, mix(station.theme_color, 0.22));
  bg.addColorStop(1, BG);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Wordmark: "cabi" white + "play" celeste, as in the app logo.
  ctx.font = '800 64px Archivo, "Host Grotesk", sans-serif';
  const cabi = ctx.measureText('cabi').width;
  const play = ctx.measureText('play').width;
  const left = (W - cabi - play) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2f6fa';
  ctx.fillText('cabi', left, 330);
  ctx.fillStyle = '#00a8e8';
  ctx.fillText('play', left + cabi, 330);
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(242,246,250,0.72)';
  ctx.font = '600 28px "Host Grotesk", Inter, sans-serif';
  ctx.fillText('RADIO EN VIVO DE CABIMAS', W / 2, 382);

  const size = 680;
  const ax = (W - size) / 2;
  const ay = 450;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 30;
  ctx.fillStyle = '#131a24';
  roundRect(ctx, ax, ay, size, size, 28);
  ctx.fill();
  ctx.restore();
  await drawCover(ctx, station, ax, ay, size, 28);

  ctx.fillStyle = '#f2f6fa';
  const name = fitText(ctx, station.name, 920, 76, 52, 800);
  ctx.fillText(name, W / 2, 1250);

  ctx.fillStyle = 'rgba(242,246,250,0.75)';
  const sub = fitText(ctx, `${station.frequency || 'Señal online'} · Cabimas`, 920, 40, 30, 500);
  ctx.fillText(sub, W / 2, 1312);

  // "EN VIVO" pill in the Cabimas sun colour.
  ctx.font = '800 34px "Host Grotesk", Inter, sans-serif';
  const label = 'EN VIVO';
  const lw = ctx.measureText(label).width + 104;
  roundRect(ctx, (W - lw) / 2, 1374, lw, 72, 36);
  ctx.fillStyle = '#ffb703';
  ctx.fill();
  ctx.fillStyle = '#0b0f16';
  ctx.beginPath();
  ctx.arc((W - lw) / 2 + 40, 1410, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(label, W / 2 + 14, 1422);

  ctx.fillStyle = 'rgba(242,246,250,0.72)';
  ctx.font = '500 32px "Host Grotesk", Inter, sans-serif';
  ctx.fillText('Escúchala en', W / 2, 1560);
  ctx.fillStyle = '#f2f6fa';
  ctx.font = '700 42px "Host Grotesk", Inter, sans-serif';
  ctx.fillText('yenderfonseca.com/cabiplay', W / 2, 1618);

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}
