// L'animació del mànec: on van els dits, què ve després i què fa la mà dreta (la púa).
// SVG fet a mà. Per defecte la corda més gruixuda va a dalt, com la veus quan mires la guitarra:
// així una fletxa avall és una púa que baixa.

import { stringNumber } from './fretboard.js';
import { pcName } from './theory.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent = null) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};

const W = 1100;
const NUT = 96;
const LAST = 960; // trast 12
const PICK_X = 1035;

/** x del centre d'un trast (0 = a l'aire, davant de la celleta). */
function fretX(f, frets) {
  if (f <= 0) return NUT - 26;
  return (wireX(f - 1, frets) + wireX(f, frets)) / 2;
}
function wireX(f, frets) {
  if (f <= 0) return NUT;
  // separacions reals, una mica suavitzades perquè els trasts alts siguin llegibles
  const k = (1 - Math.pow(2, -f / 17)) / (1 - Math.pow(2, -frets / 17));
  return NUT + (LAST - NUT) * k;
}

export function createNeck(host, inst, { thickTop = true } = {}) {
  host.innerHTML = '';
  const n = inst.tuning.length;
  const gap = n === 6 ? 30 : 40;
  const top = 34;
  const H = top * 2 + gap * (n - 1) + 10;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'neck', role: 'img', 'aria-label': `Mànec de ${inst.curt.toLowerCase()}` }, host);
  svg.style.setProperty('--accent', inst.color);
  const y = (s) => top + (thickTop ? s : n - 1 - s) * gap;
  const frets = inst.frets;

  // fusta, trasts i punts
  el('rect', { x: NUT, y: top - gap * 0.55, width: LAST - NUT + 8, height: gap * (n - 1) + gap * 1.1, rx: 6, class: 'wood' }, svg);
  el('rect', { x: LAST + 30, y: top - gap * 0.9, width: W - LAST - 40, height: gap * (n - 1) + gap * 1.8, rx: 18, class: 'body' }, svg);
  for (const f of [3, 5, 7, 9]) el('circle', { cx: fretX(f, frets), cy: top + (gap * (n - 1)) / 2, r: 7, class: 'inlay' }, svg);
  for (const off of [-1, 1]) el('circle', { cx: fretX(12, frets), cy: top + (gap * (n - 1)) / 2 + off * gap * (n === 6 ? 1 : 0.9), r: 7, class: 'inlay' }, svg);
  el('rect', { x: NUT - 5, y: top - gap * 0.55, width: 9, height: gap * (n - 1) + gap * 1.1, class: 'nut' }, svg);
  for (let f = 1; f <= frets; f++) el('line', { x1: wireX(f, frets), x2: wireX(f, frets), y1: top - gap * 0.55, y2: top + gap * (n - 1) + gap * 0.55, class: 'fret' }, svg);
  const numbers = el('g', { class: 'fret-numbers' }, svg);
  for (const f of [1, 3, 5, 7, 9, 12]) el('text', { x: fretX(f, frets), y: H - 4, 'text-anchor': 'middle' }, numbers).textContent = f;

  // cordes
  const strings = [];
  for (let s = 0; s < n; s++) {
    const thick = n === 6 ? 1 + (n - 1 - s) * 0.45 : 1.8 + (n - 1 - s) * 0.7;
    const g = el('g', { class: 'string' }, svg);
    const line = el('line', { x1: NUT - 40, x2: W - 30, y1: y(s), y2: y(s), 'stroke-width': thick }, g);
    strings.push({ g, line });
    const lab = el('text', { x: 8, y: y(s) + 5, class: 'string-label' }, svg);
    lab.textContent = `${stringNumber(inst, s)} ${inst.stringNames[s]}`;
  }

  const layerBarre = el('g', {}, svg);
  const layerNext = el('g', { class: 'next' }, svg);
  const layerCtx = el('g', { class: 'ctx' }, svg);
  const layerNow = el('g', { class: 'now' }, svg);
  const layerTech = el('g', { class: 'tech' }, svg);
  const nextLabel = el('text', { x: LAST - 4, y: 18, 'text-anchor': 'end', class: 'next-label' }, svg);
  const chordLabel = el('text', { x: NUT + 6, y: 18, class: 'chord-label' }, svg);

  // la púa
  const pickG = el('g', { class: 'pick' }, svg);
  el('path', { d: 'M -14 -12 Q 0 -20 14 -12 Q 14 4 0 18 Q -14 4 -14 -12 Z' }, pickG);
  const arrow = el('text', { x: 26, y: 8, class: 'pick-arrow' }, pickG);
  pickG.setAttribute('transform', `translate(${PICK_X} ${y(0) - gap * 0.6})`);

  const yTop = Math.min(y(0), y(n - 1)) - gap * 0.7;
  const yBot = Math.max(y(0), y(n - 1)) + gap * 0.7;
  const down = thickTop ? [yTop, yBot] : [yBot, yTop];

  function dot(layer, s, f, text, cls = '') {
    const x = fretX(f, frets);
    const g = el('g', { class: `dot ${cls}`, transform: `translate(${x} ${y(s)})` }, layer);
    if (f === 0 && !/ring|active|tone|faint/.test(cls)) {
      el('circle', { r: 10, class: 'open' }, g);
    } else {
      el('circle', { r: n === 6 ? 13 : 15 }, g);
    }
    if (text != null && text !== '') el('text', { y: 5, 'text-anchor': 'middle' }, g).textContent = text;
    return g;
  }
  function muted(s) {
    const t = el('text', { x: NUT - 26, y: y(s) + 6, 'text-anchor': 'middle', class: 'muted' }, layerNow);
    t.textContent = '×';
  }
  function clear(...layers) { for (const l of layers) l.replaceChildren(); }

  function drawVoicing(layer, v, { ring = false } = {}) {
    const cov = new Set(v.covered ?? []);
    if (v.barre && !ring) {
      const x = fretX(v.barre.fret, frets);
      const ya = y(v.barre.from); const yb = y(v.barre.to);
      el('rect', { x: x - 11, y: Math.min(ya, yb) - 12, width: 22, height: Math.abs(yb - ya) + 24, rx: 11, class: 'barre' }, layerBarre);
    }
    v.frets.forEach((f, s) => {
      if (f < 0) { if (!ring && !cov.has(s)) muted(s); return; }
      if (v.barre && !ring && f === v.barre.fret && v.fingers[s] === 1 && !cov.has(s)) return; // ja ho fa la celleta
      dot(layer, s, f, f === 0 ? '' : v.fingers[s] || '', ring ? 'ring' : cov.has(s) ? 'covered' : '');
    });
    if (cov.size && !ring) {
      // cordes tapades, com al Generador de diagrames: es veu la forma, però en gris
      const ys = [...cov].map(y);
      const y0 = Math.min(...ys) - gap / 2;
      const y1 = Math.max(...ys) + gap / 2;
      el('rect', { x: NUT - 44, y: y0, width: LAST - NUT + 52, height: y1 - y0, class: 'cover' }, layerTech);
      el('text', { x: NUT + 10, y: (y0 + y1) / 2 + 5, class: 'cover-text' }, layerTech).textContent = `${cov.size === 1 ? 'corda tapada' : `${cov.size} cordes tapades`} · toca només ${6 - cov.size === 1 ? 'la corda' : `les ${6 - cov.size} cordes`} de ${thickTop ? 'sota' : 'dalt'}`;
    }
  }

  let shownKey = '';
  const vib = new Map();
  let lastTrig = null;

  const api = {
    svg, inst,
    /**
     * view = { mode: 'chord' | 'notes' | 'scale', cur, next, ctx: [{s,f,label,cls}], chord }
     */
    show(view) {
      const key = JSON.stringify([view.mode, view.cur?.id, view.next?.id, view.showNext, view.ctxKey, view.label]);
      if (key === shownKey) return;
      shownKey = key;
      clear(layerBarre, layerNext, layerCtx, layerNow, layerTech);
      chordLabel.textContent = view.label ?? '';
      nextLabel.textContent = '';
      if (view.ctx) for (const p of view.ctx) dot(layerCtx, p.s, p.f, p.label ?? '', p.cls ?? '');
      const cur = view.cur;
      if (view.mode === 'chord' && cur?.voicing) {
        drawVoicing(layerNow, cur.voicing);
        if (view.showNext && view.next?.voicing && view.next.chord !== cur.chord) {
          drawVoicing(layerNext, view.next.voicing, { ring: true });
          nextLabel.textContent = `Ara ve: ${view.next.chord}`;
        }
      } else if (view.mode === 'notes' && cur) {
        if (cur.voicing && inst.tuning.length === 6) {
          // l'acord, fluix, de fons
          cur.voicing.frets.forEach((f, s) => { if (f >= 0) dot(layerCtx, s, f, '', 'faint'); });
        }
        for (const p of cur.pos) dot(layerNow, p.s, p.f, cur.tech ? p.f : cur.label, 'active');
        if (cur.tech) drawTech(cur);
        if (view.next && view.showNext) for (const p of view.next.pos) dot(layerNext, p.s, p.f, '', 'ring');
      }
    },
    /** Moviment de la púa i vibració de les cordes. Es crida a cada fotograma. */
    animate({ pick, now }) {
      if (pick) {
        const { p, ghost, dir, s } = pick;
        let py;
        if (s != null) py = y(s) - 2 - Math.sin(Math.min(1, p) * Math.PI) * 10;
        else { const [a, b] = dir === 'D' ? down : [down[1], down[0]]; py = a + (b - a) * ease(p); }
        pickG.setAttribute('transform', `translate(${PICK_X} ${py.toFixed(1)})`);
        pickG.classList.toggle('ghost', !!ghost);
        arrow.textContent = s != null ? '' : dir === 'D' ? '↓' : '↑';
        if (pick.id !== lastTrig && p >= 0 && !ghost) {
          lastTrig = pick.id;
          const which = pick.strings ?? [];
          for (const st of which) shake(st);
        }
      }
      for (const [st, t0] of vib) {
        const age = now - t0;
        if (age > 0.45) { strings[st].line.removeAttribute('transform'); vib.delete(st); continue; }
        const amp = 2.2 * (1 - age / 0.45);
        strings[st].line.setAttribute('transform', `translate(0 ${(Math.sin(age * 90) * amp).toFixed(2)})`);
      }
    },
    /** Ressalta una corda (afinar, corda a corda). */
    highlightString(s, text) {
      clear(layerNow, layerNext, layerCtx, layerBarre, layerTech);
      shownKey = '';
      strings.forEach((x, i) => x.g.classList.toggle('lit', i === s));
      if (s != null && text) dot(layerNow, s, 0, '', 'active');
      chordLabel.textContent = text ?? '';
    },
    shake,
    clear() { shownKey = ''; clear(layerBarre, layerNext, layerCtx, layerNow, layerTech); chordLabel.textContent = ''; nextLabel.textContent = ''; strings.forEach((x) => x.g.classList.remove('lit')); },
    dotsFor(list) { // per a «corda a corda» i afinar: punts lliures
      shownKey = '';
      clear(layerNow, layerNext, layerTech);
      for (const p of list) dot(layerNow, p.s, p.f, p.label ?? '', p.cls ?? 'active');
    },
  };
  function shake(s) { if (strings[s]) vib.set(s, performance.now() / 1000); }
  // fem servir el rellotge de la pàgina per a la vibració
  const baseAnimate = api.animate;
  api.animate = (o) => baseAnimate({ ...o, now: performance.now() / 1000 });

  function drawTech(e) {
    const p = e.pos[0];
    const t = e.tech;
    const x1 = fretX(p.f, frets);
    const yy = y(p.s);
    if (t.type === 'b') {
      el('path', { d: `M ${x1 + 16} ${yy} q 18 0 18 ${thickTop ? 22 : -22}`, class: 'tech-line', 'marker-end': '' }, layerTech);
      el('text', { x: x1 + 40, y: yy + (thickTop ? 34 : -26), class: 'tech-text' }, layerTech).textContent = `bend +${t.semis ?? 2}`;
      return;
    }
    const x2 = fretX(t.to, frets);
    el('line', { x1, x2, y1: yy, y2: yy, class: `tech-line ${t.type}` }, layerTech);
    dot(layerTech, p.s, t.to, t.to, 'ring target');
    const word = { h: 'hammer-on', p: 'pull-off', s: 'glissando' }[t.type];
    el('text', { x: (x1 + x2) / 2, y: yy - 18, 'text-anchor': 'middle', class: 'tech-text' }, layerTech).textContent = word;
  }

  /** Mou el punt actiu segons el recurs tècnic (fase 0–1 dins de la nota). */
  api.techPhase = (e, phase) => {
    if (!e?.tech) return;
    const g = layerNow.querySelector('.dot.active');
    if (!g) return;
    const p = e.pos[0];
    const x1 = fretX(p.f, frets);
    let x = x1;
    let yy = y(p.s);
    const t = e.tech;
    if (t.type === 'h' || t.type === 'p') { if (phase >= 0.5) x = fretX(t.to, frets); }
    else if (t.type === 's') x = x1 + (fretX(t.to, frets) - x1) * clamp((phase - 0.35) / 0.25);
    else if (t.type === 'b') yy += (thickTop ? 1 : -1) * gap * 0.75 * clamp((phase - 0.25) / 0.3);
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${yy.toFixed(1)})`);
    const txt = g.querySelector('text');
    if (txt) txt.textContent = (t.type === 'h' || t.type === 'p') && phase >= 0.5 ? t.to : t.type === 's' && phase > 0.6 ? t.to : p.f;
  };

  api.pcName = pcName;
  return api;
}

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (p) => { const x = clamp(p); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };

// ---- Diagrama d'acord vertical (com les cartes de diagrames ROCKIN) -------------------------------------------

export function chordBox(v, { title = '', color = '#f97316', small = false } = {}) {
  const w = small ? 92 : 140;
  const fretsShown = 5;
  const pad = small ? 14 : 20;
  const gx = (w - pad * 2) / 5;
  const gy = small ? 16 : 24;
  const h = pad * 2 + gy * fretsShown + (small ? 18 : 26);
  const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, class: 'chordbox', width: w, height: h });
  if (!v) return svg;
  const played = v.frets.filter((f) => f > 0);
  const lo = played.length ? Math.min(...played) : 1;
  const hi = played.length ? Math.max(...played) : 1;
  const base = hi <= 5 ? 1 : lo;
  const top = pad + (small ? 18 : 26);
  el('text', { x: w / 2, y: small ? 13 : 18, 'text-anchor': 'middle', class: 'cb-title' }, svg).textContent = title || v.name;
  if (base === 1) el('rect', { x: pad, y: top - 4, width: gx * 5, height: 4, fill: '#221f20' }, svg);
  else el('text', { x: pad - 4, y: top + gy * 0.65, 'text-anchor': 'end', class: 'cb-fret' }, svg).textContent = base;
  for (let i = 0; i <= fretsShown; i++) el('line', { x1: pad, x2: pad + gx * 5, y1: top + i * gy, y2: top + i * gy, stroke: '#9b9590' }, svg);
  for (let s = 0; s < 6; s++) el('line', { x1: pad + s * gx, x2: pad + s * gx, y1: top, y2: top + gy * fretsShown, stroke: '#4b4542', 'stroke-width': 1 + (5 - s) * 0.25 }, svg);
  if (v.barre) {
    const fy = top + (v.barre.fret - base + 0.5) * gy;
    el('rect', { x: pad + v.barre.from * gx - 6, y: fy - 6, width: (v.barre.to - v.barre.from) * gx + 12, height: 12, rx: 6, fill: color }, svg);
  }
  const cov = v.covered ?? [];
  v.frets.forEach((f, s) => {
    const x = pad + s * gx;
    if (f < 0) { el('text', { x, y: top - 7, 'text-anchor': 'middle', class: 'cb-mark' }, svg).textContent = '×'; return; }
    if (f === 0) { el('circle', { cx: x, cy: top - 11, r: small ? 3.5 : 5, fill: 'none', stroke: '#221f20', 'stroke-width': 1.5 }, svg); return; }
    if (v.barre && f === v.barre.fret && v.fingers[s] === 1) return;
    const cy = top + (f - base + 0.5) * gy;
    el('circle', { cx: x, cy, r: small ? 6 : 9, fill: color }, svg);
    if (!small && v.fingers[s]) el('text', { x, y: cy + 4, 'text-anchor': 'middle', class: 'cb-finger' }, svg).textContent = v.fingers[s];
  });
  if (cov.length) el('rect', { x: pad - gx / 2, y: top - 20, width: gx * cov.length, height: gy * fretsShown + 22, fill: '#4a4a4a', 'fill-opacity': 0.85 }, svg);
  return svg;
}
