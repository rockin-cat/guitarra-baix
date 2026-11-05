// La carta amb la pilota que hi bota (compartit per la sessió i les introduccions dels nivells).
//  · cardGeometry: on cau la pilota a cada carta (rítmica, de rascat o melòdica)
//  · ballAt: on és la pilota en un moment del compàs
//  · drawnCard: una carta dibuixada quan el pas no en té

import { CARD_LAYOUT, MELODIC_LAYOUT } from './data/layouts.js';

/** On cau la pilota a cada pols de la carta (fraccions de l'amplada i l'alçada). */
export function cardGeometry(card, M, drawnR) {
  const P = M.pulses;
  // cartes de rascat: 8 o 16 fletxes entre el 11 % i el 89 % de l'amplada (mesurat a les imatges); la pilota cau a cada fletxa que toca
  if (card?.strum) {
    const n = card.strum.length;
    const xs = [...card.strum].map((_, i) => 0.111 + (0.783 * i) / (n - 1));
    return { strumCard: true, top: 0.43, landings: [...card.strum].map((m, i) => ({ m, i })).filter(({ m }) => m !== m.toLowerCase()).map(({ i }) => ({ f: i / n, x: xs[i] })) };
  }
  if (card?.contour && MELODIC_LAYOUT[card.id]) {
    const pts = MELODIC_LAYOUT[card.id];
    return { melodic: true, landings: pts.map(([x, y], i) => ({ f: i / pts.length, x, y })) };
  }
  const L = card ? CARD_LAYOUT[card.id] : null;
  const g = L && L.c.length === P ? { y: L.y, r: L.r, cells: L.c } : { y: 0.5, r: drawnR ?? 0.07, cells: Array.from({ length: P }, (_, p) => [0.04 + (p * 0.92) / P, 0.04 + ((p + 1) * 0.92) / P]) };
  g.landings = g.cells.map(([x0, x1], p) => ({ f: p / P, x: (x0 + x1) / 2 }));
  return g;
}

/** Si no hi ha carta, se'n dibuixa una: rodona blava = toques, línia = deixa sonar, rodona blanca = silenci. */
export function drawnCard(moves) {
  const n = moves.length;
  const W = 170; const H = 240; const x0 = W * 0.04; const step = (W * 0.92) / n;
  let g = '';
  [...moves].forEach((m, i) => {
    const cx = x0 + step * (i + 0.5);
    if (m === 'D' || m === 'U') g += `<circle cx="${cx}" cy="${H / 2}" r="${Math.min(13, step * 0.42)}" fill="#3db8f5"/>`;
    else if (m === '=') g += `<rect x="${cx - step / 2}" y="${H / 2 - 3}" width="${step}" height="6" fill="#3db8f5" opacity=".45"/>`;
    else if (m === '_') g += `<circle cx="${cx}" cy="${H / 2}" r="${Math.min(13, step * 0.42)}" fill="#fff" stroke="#cfc8bf"/>`;
  });
  return { html: `<svg class="wv-svgcard" viewBox="0 0 ${W} ${H}"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="#f4f1ec"/>${g}</svg>`, r: Math.min(13, step * 0.42) / W };
}

/**
 * On és la pilota: { x, y, ground, R } en píxels.
 *  beat: temps dins del compàs; countIn: bota al lloc del primer cop; end: s'hi queda.
 */
export function ballAt(g, W, H, M, beat, { countIn = false, end = false } = {}) {
  const R = Math.max(7, W * 0.055);
  const cy = g.strumCard ? g.top * H : g.melodic ? 0 : g.y * H; const r = g.strumCard || g.melodic ? 0 : g.r * W;
  const ring = g.melodic ? W * 0.022 : 0;
  const ground0 = g.melodic ? 0 : cy - r - R - 4;
  const land = g.landings.map((l) => ({ f: l.f, x: l.x * W, y: g.melodic ? l.y * H - ring - R - 2 : ground0 }));
  let ground = ground0;
  const P = M.pulses;
  const maxHop = Math.max(4, Math.min(W * 0.1, (g.melodic ? Math.min(...land.map((l) => l.y)) : ground0) - R - 1));
  const hop = (df) => maxHop * Math.min(1, 0.35 + df * P * 0.45);
  let x; let y;
  if (end) {
    ground = land[0].y; x = land[0].x; y = ground;
  } else if (countIn) {
    const ph = (beat % M.pulseLen) / M.pulseLen;
    ground = land[0].y; x = land[0].x; y = ground - maxHop * 0.6 * Math.sin(Math.PI * ph);
  } else {
    const f = Math.max(0, Math.min(1, beat / M.beats));
    const first = land[0]; const last = land.at(-1);
    if (land.length === 1 || f >= last.f || f < first.f) {
      // de l'últim cop torna volant al primer (la carta es repeteix), com al joc de teclat
      const span = (1 - last.f) + first.f || 1;
      const sP = Math.min(1, (((f - last.f) % 1) + 1) % 1 / span);
      const dist = Math.abs(first.x - last.x);
      const lift = Math.min(H * 0.35, Math.max(maxHop * 1.3, dist * 0.3));
      ground = last.y + (first.y - last.y) * sP;
      x = last.x + (first.x - last.x) * sP; y = ground - (land.length === 1 ? hop(1) : lift) * Math.sin(Math.PI * sP);
    } else {
      let i = 0;
      while (i < land.length - 2 && land[i + 1].f <= f) i++;
      const A = land[i]; const Bq = land[i + 1];
      const sP = Math.min(1, Math.max(0, (f - A.f) / (Bq.f - A.f)));
      ground = A.y + (Bq.y - A.y) * sP;
      x = A.x + (Bq.x - A.x) * sP; y = ground - hop(Bq.f - A.f) * Math.sin(Math.PI * sP);
    }
  }
  return { x, y, ground, R, cy, r };
}

/** Dibuixa la pilota (i l'ombra) en un canvas. */
export function paintBall(c, b, color = '#ffb400') {
  c.fillStyle = 'rgba(0,0,0,.14)';
  c.beginPath(); c.ellipse(b.x, b.ground + b.R, b.R, b.R * 0.35, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(b.x, b.y, b.R, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill(); c.lineWidth = 2; c.strokeStyle = '#1d1d1f'; c.stroke();
}

/** Prepara un canvas sobre la carta per dibuixar-hi; torna { c, W, H } o null si encara no té mida. */
export function canvasCtx(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = cv.clientWidth; const H = cv.clientHeight;
  if (!W) return null;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  return { c, W, H };
}
