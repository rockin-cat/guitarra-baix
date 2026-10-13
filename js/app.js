// ROCKIN · Guitarra i baix — pantalles: inici, full de ruta, nivell, cartes, la meva cançó i pràctica.

import * as store from './store.js';
import { LEVELS, allSteps } from './levels.js';
import { INSTRUMENTS } from './fretboard.js';
import { openSession, closeSession, openPicker } from './session.js';
import { BINARI, TERNARI, MELODIC, RASCATS, cardById } from './data/cartes.js';
import { METRES, parseProgression } from './theory.js';
import { stylesFor, defaultStyle, STYLES } from './band.js';
import { savedCode, saveCode, listLibrary, loadLibrarySong, songFromLibrary, errorText } from './library.js';
import { songbook, WHEELS, keyboardSongs, mapStyle } from './songs.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const VIEWS = ['home', 'map', 'level', 'cards', 'creator', 'session'];

const inst = () => INSTRUMENTS[store.instrumentOf()];

function show(view) {
  if (view !== 'session') closeSession();
  for (const v of VIEWS) $(`#v-${v}`).hidden = v !== view;
  document.body.dataset.view = view;
  window.scrollTo({ top: 0 });
  applyAccent();
}

function applyAccent() {
  const i = inst();
  document.body.style.setProperty('--accent', i.color);
  document.body.style.setProperty('--accent-soft', i.colorSoft);
  for (const b of document.querySelectorAll('#inst-switch [data-inst]')) b.classList.toggle('on', b.dataset.inst === i.id);
  const chip = $('#player-chip');
  chip.hidden = !store.currentName();
  $('span', chip).textContent = store.currentName() ?? '';
}

// ---- Progrés -----------------------------------------------------------------------------------------------

const icon = (st) => (st?.best === 'ok' ? '✓' : st?.best === 'gairebe' ? '◐' : st?.best === 'no' ? '·' : '○');
function levelProgress(level) {
  const done = level.passos.filter((p) => store.stepState(p.id)?.best === 'ok').length;
  return { done, total: level.passos.length };
}
function nextStep(instId) {
  for (const l of LEVELS[instId]) for (const p of l.passos) if (store.stepState(p.id)?.best !== 'ok') return { level: l, step: p };
  return null;
}

// ---- Inici ------------------------------------------------------------------------------------------------------

function renderHome() {
  const v = $('#v-home');
  const name = store.currentName();
  const i = inst();
  const nx = name ? nextStep(i.id) : null;
  v.innerHTML = `
    <div class="hero">
      <img class="hero-logo" src="assets/brand/rockin-logo.png" alt="ROCKIN · [r]evolucionem la música">
      <div>
        <h1>Guitarra i baix amb els fulls de ruta ROCKIN</h1>
        <p>Primer escoltes com sona. Després la banda continua sense el teu instrument i l'animació del mànec et diu on van els dits i què fa la mà dreta. Al final, tu dius com ha anat.</p>
      </div>
    </div>
    ${name ? `
      <div class="who-short"><span>Hola, <b>${esc(name)}</b>! Què toques avui?</span><button type="button" class="btn btn-ghost" data-go="who">No soc jo · canvia</button></div>
      ${workSongBox()}
      <div class="inst-tiles">
        ${Object.values(INSTRUMENTS).map((x) => `<button type="button" class="inst-tile${x.id === i.id ? ' on' : ''}" data-inst="${x.id}" style="--c:${x.color}"><span class="it-icon">${x.id === 'guitarra' ? guitarSvg(x.color) : bassSvg(x.color)}</span><span><b>${esc(x.nom)}</b><small>${levelLine(x.id)}</small></span></button>`).join('')}
      </div>
      <div class="doors">
        <button type="button" class="door door-main" data-go="continue"><span class="door-icon">▶</span><span class="door-text"><b>Continua</b><small>${nx ? `Nivell ${nx.level.n} · ${esc(nx.step.titol)}` : 'Has fet tot el full de ruta! Tria qualsevol pas.'}</small></span></button>
        <button type="button" class="door" data-go="map"><span class="door-icon">🗺️</span><span class="door-text"><b>Full de ruta</b><small>Els 10 nivells de ${esc(i.curt.toLowerCase())}</small></span></button>
        <button type="button" class="door" data-go="songs"><span class="door-icon">📖</span><span class="door-text"><b>Cançons</b><small>Llibre ROCKIN, joc de teclat i biblioteca compartida</small></span></button>
        <button type="button" class="door" data-go="creator"><span class="door-icon">🎼</span><span class="door-text"><b>La meva cançó</b><small>Escriu acords i compàs: el joc fa la base i l'animació</small></span></button>
      </div>` : `
      <div class="panel who">
        <h2>Qui toca?</h2>
        <p class="muted small">Tria el teu nom o escriu-ne un de nou. El progrés es guarda en aquest navegador.</p>
        <div class="who-list">${store.players().map((p) => `<button type="button" class="who-btn" data-player="${esc(p)}"><b>${esc(p)}</b><small>${esc(INSTRUMENTS[store.player(p).inst]?.curt ?? '')}</small></button>`).join('')}</div>
        <form class="who-form" id="who-form"><input id="who-name" type="text" maxlength="24" placeholder="Escriu el teu nom" autocomplete="off"><button type="submit" class="btn">Som-hi</button></form>
      </div>`}`;
  $('#who-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('#who-name').value.trim();
    if (!n) return;
    store.setCurrent(n);
    renderHome();
    applyAccent();
  });
}

function levelLine(instId) {
  const ls = LEVELS[instId];
  const done = ls.filter((l) => { const p = levelProgress(l); return p.done === p.total; }).length;
  const nx = nextStep(instId);
  return nx ? `Nivell ${nx.level.n} de 10 · ${esc(nx.level.titol)}` : done === 10 ? 'Full de ruta complet' : '';
}

const guitarSvg = (c) => `<svg viewBox="0 0 40 60" width="34" height="50"><rect x="18" y="2" width="4" height="30" fill="#2b3446"/><rect x="16" y="0" width="8" height="8" rx="2" fill="${c}"/><path d="M20 26c-7 0-11 5-9 10-5 2-6 10-2 15 4 6 18 6 22 0 4-5 3-13-2-15 2-5-2-10-9-10z" fill="${c}"/><rect x="18" y="26" width="4" height="22" fill="#2b3446"/></svg>`;
const bassSvg = (c) => `<svg viewBox="0 0 40 60" width="34" height="50"><rect x="18.5" y="2" width="3" height="32" fill="#2b3446"/><rect x="17" y="0" width="6" height="7" rx="2" fill="${c}"/><path d="M20 28c-6 0-9 4-8 9-4 2-5 9-2 14 3 6 17 6 20 0 3-5 2-12-2-14 1-5-2-9-8-9z" fill="${c}"/><rect x="18.5" y="28" width="3" height="20" fill="#2b3446"/></svg>`;

// ---- Full de ruta (com el pòster) ----------------------------------------------------------------------------

const LEVEL_ICONS = ['♫', '⎍', '✋', '🎤', '📈', '≋', '🎚', '⚡', '✒', '✎'];

function renderMap() {
  const i = inst();
  const v = $('#v-map');
  const levels = LEVELS[i.id];
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [w1, w2] = i.id === 'guitarra' ? ['GUITARRA', 'ELÈCTRICA'] : ['BAIX', 'ELÈCTRIC'];
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-go="home">← Inici</button></div>
    <div class="poster" style="--c:${i.color}">
      <div class="poster-head">
        <div class="poster-icon">${i.id === 'guitarra' ? guitarSvg(i.color) : bassSvg(i.color)}</div>
        <div class="poster-w1">${w1}</div>
        <div class="poster-w2">${w2}</div>
        <div class="poster-sub">FULL DE RUTA · NIVELLS</div>
      </div>
      <div class="poster-grid">
        ${order.map((k) => { const l = levels[k]; const p = levelProgress(l); return `
          <button type="button" class="ptile${p.done === p.total ? ' done' : ''}" data-level="${l.n}">
            <span class="pick-badge">${l.n}</span>
            <span class="ptile-text"><b>${esc(l.titol.toUpperCase())}</b><small>${esc(l.sub)}</small>
              <span class="pbar"><i style="width:${(100 * p.done) / p.total}%"></i></span><em>${p.done} de ${p.total} passos</em></span>
            <span class="ptile-icon">${LEVEL_ICONS[k]}</span>
          </button>`; }).join('')}
      </div>
      <div class="poster-foot"><span>ENDIRECTE: MÚSICA ALS INSTITUTS</span><em>Pugem de nivell?</em></div>
    </div>`;
}

// ---- Un nivell -------------------------------------------------------------------------------------------------

let currentLevel = 1;
const MODE_TEXT = (m) => (typeof m === 'string' ? 'amb celleta' : m.type === 'power' ? ['power chord · un dit a la corda 6', 'power chord · 1 i 5', 'power chord sencer (1, 5, 8)'][m.parts - 1] : m.cordes >= 6 ? 'acords oberts · totes les cordes' : `acords oberts · ${m.cordes === 1 ? 'corda 1' : `cordes 1 a ${m.cordes}`}`);

/** La cançó amb què es treballa el full de ruta (i, a la guitarra, com es fan els acords). */
function workSongBox() {
  const ws = store.workSong();
  const i = inst();
  return `<div class="work-song">
      <span style="font-size:26px">🎵</span>
      <div style="flex:1;min-width:200px">${ws ? `<small>La cançó amb què treballes</small><span class="ws-name">${esc(ws.titol)}</span>${ws.artista ? ` <small style="display:inline">· ${esc(ws.artista)}</small>` : ''}` : '<small>Sempre s\'aprèn a partir d\'una cançó</small><span class="ws-name">Tria la cançó amb què treballes</span>'}
        ${i.id === 'guitarra' ? `<small>Acords: ${esc(MODE_TEXT(store.chordMode()))} · es canvia a la pràctica o al nivell 1</small>` : ''}</div>
      <button type="button" class="btn ${ws ? 'btn-ghost' : 'btn-primary'}" data-go="songs">${ws ? 'Canvia de cançó' : 'Tria-la'}</button>
    </div>`;
}

function renderLevel(n = currentLevel) {
  currentLevel = n;
  const i = inst();
  const l = LEVELS[i.id][n - 1];
  const v = $('#v-level');
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-go="map">← Full de ruta</button>
      <div><small class="muted">${esc(i.nom)} · Nivell ${l.n} de 10</small><h2>${esc(l.titol)}</h2><p class="muted">${esc(l.sub)}</p></div></div>
    ${workSongBox()}
    <ol class="steps">
      ${l.passos.map((p, k) => { const s = store.stepState(p.id); const ws = store.workSong(); const usesSong = ws && p.canco !== false && p.kind !== 'tune' && p.part?.type !== 'riff' && !(p.metre && p.metre !== ws.metre); return `
        ${p.grup && p.grup !== l.passos[k - 1]?.grup ? `<li class="step-group">${esc(p.grup)}</li>` : ''}
        <li class="step ${s?.best ?? ''}">
          <span class="step-state" title="${s?.best === 'ok' ? 'Et surt' : s?.best === 'gairebe' ? 'Gairebé' : 'Per fer'}">${icon(s)}</span>
          <div class="step-text"><b>${k + 1}. ${esc(p.titol)}</b><small>${esc(p.text ?? '')}</small>
            ${p.prog ? `<span class="step-meta">${usesSong ? `🎵 ${esc(ws.titol)}` : esc(p.prog)} · ${esc(usesSong ? ws.metre : p.metre ?? '4/4')}${s?.best === 'ok' && s.tempo ? ` · t'ha sortit a ${s.tempo} bpm` : ''}</span>` : ''}</div>
          <button type="button" class="btn ${s?.best === 'ok' ? 'btn-ghost' : 'btn-primary'}" data-step="${p.id}">${p.kind === 'cards' ? 'Tria carta' : p.kind === 'tune' ? 'Afina' : s?.best === 'ok' ? 'Repassa' : 'Practica'}</button>
        </li>`; }).join('')}
    </ol>
    <div class="row">${n > 1 ? `<button type="button" class="btn btn-ghost" data-level="${n - 1}">← Nivell ${n - 1}</button>` : ''}${n < 10 ? `<button type="button" class="btn btn-ghost" data-level="${n + 1}">Nivell ${n + 1} →</button>` : ''}</div>`;
}

function openStep(id) {
  const i = inst();
  const steps = allSteps(i.id);
  const idx = steps.findIndex((s) => s.id === id);
  const step = steps[idx];
  if (!step) return;
  if (step.kind === 'cards') { renderCards(step); show('cards'); return; }
  const level = LEVELS[i.id][step.nivell - 1];
  const k = level.passos.findIndex((p) => p.id === id);
  show('session');
  const next = steps.slice(idx + 1).find(Boolean);
  openSession($('#v-session'), step, {
    inst: i.id,
    backLabel: `Nivell ${step.nivell}`,
    crumb: `Pas ${k + 1} de ${level.passos.length}`,
    onBack: () => { renderLevel(step.nivell); show('level'); },
    onNext: next ? () => openStep(next.id) : null,
    onChooseSong: () => { songTab = 'llibre'; renderCreator(); show('creator'); },
  });
}

// ---- Cartes (triar-ne una) -------------------------------------------------------------------------------------

let cardsStep = null;
function renderCards(step) {
  cardsStep = step;
  const i = inst();
  const v = $('#v-cards');
  const groups = step.deck === 'ritme'
    ? [['Binàries (4/4)', BINARI], ['Ternàries en 3/4', TERNARI.filter((c) => c.metre === '3/4')], ['6/8', TERNARI.filter((c) => c.metre === '6/8')], ['12/8', TERNARI.filter((c) => c.metre === '12/8')]]
    : step.deck === 'rascats' ? [['Rascats de guitarra', RASCATS]] : [['Patrons melòdics', MELODIC]];
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-level="${step.nivell}">← Nivell ${step.nivell}</button>
      <div><small class="muted">${esc(i.nom)} · Nivell ${step.nivell}</small><h2>${esc(step.titol)}</h2><p class="muted">Clica una carta per practicar-la amb la banda.</p></div></div>
    ${groups.filter(([, l]) => l.length).map(([t, list]) => `<h3>${esc(t)}</h3><div class="card-grid">${list.map((c) => { const s = store.stepState(`${step.id}:${c.id}`); return `<button type="button" class="pcard${s?.best === 'ok' ? ' done' : ''}" data-card="${c.id}"><img src="${c.img}" alt="Carta ${c.id}" loading="lazy">${s?.best === 'ok' ? '<i>✓</i>' : ''}</button>`; }).join('')}</div>`).join('')}`;
}

function openCard(cardId) {
  const step = cardsStep;
  const i = inst();
  const c = cardById(cardId);
  const metre = c.metre ?? '4/4';
  let part;
  if (step.deck === 'ritme') part = i.id === 'guitarra' ? { type: 'strum', card: cardId } : { type: 'bass', card: cardId, roles: ['1'] };
  else if (step.deck === 'rascats') part = { type: 'rascat', card: cardId };
  else part = { type: 'arp', card: cardId };
  const progs = { '4/4': step.prog, '3/4': 'C | G | G | C', '6/8': 'D | Bm | G | A', '12/8': 'Am | F | C | G' };
  const s = {
    ...step, kind: 'play', id: `${step.id}:${cardId}`, titol: `Carta ${cardId}`, part, carta: cardId, metre,
    prog: progs[metre] ?? step.prog, estil: metre === '4/4' ? step.estil : defaultStyle(metre), tempo: metre.endsWith('/8') ? 60 : step.tempo,
    text: step.deck === 'melodic' ? 'El contorn de la carta, fet amb les notes de l\'acord (1, 3, 5, 8).' : 'Cada símbol de la carta és un cop. Mira la carta i el mànec alhora.',
    com: [],
  };
  show('session');
  openSession($('#v-session'), s, { inst: i.id, backLabel: 'Cartes', onBack: () => { renderCards(step); show('cards'); } });
}

// ---- La meva cançó ---------------------------------------------------------------------------------------------

const draft = { titol: '', prog: 'C | G | Am | F', metre: '4/4', tempo: 90, estil: 'pop', nivell: 1, opcio: null, id: null };

/** Opcions de cada nivell al creador. */
function levelOptions(instId, n, metreId) {
  const rhythmCards = metreId === '4/4' ? BINARI : TERNARI.filter((c) => c.metre === metreId);
  const R = [['W', 'Rodones (un cop per compàs)'], ['H', 'Blanques'], ['Q', 'Negres (un cop per temps)'], ['E', 'Corxeres']];
  const g = instId === 'guitarra';
  switch (n) {
    case 1: return { label: 'Ritme', items: R };
    case 2: return { label: 'Carta rítmica', cards: rhythmCards };
    case 3: return g ? (metreId === '4/4' ? { label: 'Carta de rascat', cards: RASCATS } : { label: 'Els rascats només van en 4/4', items: [['Q', 'Negres']] })
      : { label: 'Patró d\'octaves', items: [['1-8|Q', '1 · 8 a negres'], ['1-8|E', '1 · 8 a corxeres'], ['1-1-8-1|E', '1 · 1 · 8 · 1 a corxeres']] };
    case 4: return { label: 'Què cantes', items: [['count|W', 'Comptar en veu alta · rodones'], ['count|Q', 'Comptar en veu alta · negres'], ['root|W', 'Cantar la fonamental · rodones'], ['root|Q', 'Cantar la fonamental · negres']] };
    case 5: return g ? { label: 'Carta melòdica', cards: MELODIC } : { label: 'Patró', items: [['1-5|Q', '1 · 5'], ['1-3-5-3|Q', '1 · 3 · 5 · 3'], ['1-3-5-8|Q', '1 · 3 · 5 · 8'], ['1-5-8-5|E', '1 · 5 · 8 · 5 a corxeres']] };
    case 6: return g ? { label: 'Acords', items: [['celleta|Q', 'Tots amb celleta · negres'], ['celleta|W', 'Tots amb celleta · rodones'], ['quinta|E', 'Acords de quinta (power chords) · corxeres']] } : { label: 'Carta melòdica', cards: MELODIC };
    case 8: return { label: 'Recurs', items: [['h', 'Hammer-on'], ['p', 'Pull-off'], ['s', 'Glissando'], ['b', 'Bending']] };
    case 10: return { label: 'Com improvises', items: [['chord', 'Notes de l\'acord'], ['penta', 'Pentatònica'], ['qa', 'Pregunta i resposta'], ['free', 'Lliure amb reptes']] };
    default: return null;
  }
}

/** Del formulari a un pas que la pantalla de pràctica entén. */
function stepFromDraft(instId) {
  const n = Number(draft.nivell);
  const g = instId === 'guitarra';
  const o = draft.opcio;
  const base = { id: draft.id ? `song:${draft.id}` : null, custom: true, titol: draft.titol || 'La meva cançó', prog: draft.prog, metre: draft.metre, tempo: Number(draft.tempo) || 90, estil: draft.estil, text: '', com: [] };
  const L = LEVELS[instId][n - 1];
  base.text = `${L.titol}: ${L.sub.toLowerCase()}.`;
  const [a, b] = String(o ?? '').split('|');
  switch (n) {
    case 1: return { ...base, part: g ? { type: 'strum', rhythm: o || 'Q' } : { type: 'bass', rhythm: o || 'Q', roles: ['1'] } };
    case 2: return { ...base, carta: o, part: g ? { type: 'strum', card: o } : { type: 'bass', card: o, roles: ['1'] } };
    case 3: if (g) return o && o.startsWith('rg') ? { ...base, carta: o, part: { type: 'rascat', card: o } } : { ...base, part: { type: 'strum', rhythm: 'Q' } };
      return { ...base, part: { type: 'bass', rhythm: b || 'Q', roles: (a || '1-8').split('-') } };
    case 4: return { ...base, voice: a || 'count', part: g ? { type: 'strum', rhythm: b || 'W' } : { type: 'bass', rhythm: b || 'W', roles: ['1'] } };
    case 5: if (g) return { ...base, carta: o, part: { type: 'arp', card: o || 'pm14' } };
      return { ...base, part: { type: 'bass', rhythm: b || 'Q', roles: (a || '1-3-5-3').split('-') } };
    case 6: if (g) return { ...base, voicing: a || 'celleta', part: { type: 'strum', rhythm: b || 'Q' } };
      return { ...base, carta: o, part: { type: 'arp', card: o || 'pm14' } };
    case 8: return { ...base, part: { type: 'techroot', tech: o || 'h' } };
    case 9: return { ...base, kind: 'compose', bars: draft.compose ?? null };
    case 10: return { ...base, kind: 'improv', mode: o || 'penta' };
    default: return { ...base, part: g ? { type: 'strum', rhythm: 'Q' } : { type: 'bass', rhythm: 'Q', roles: ['1'] } };
  }
}

function renderCreator(msg = '') {
  const i = inst();
  const v = $('#v-creator');
  const styles = stylesFor(draft.metre);
  if (!styles.find((s) => s.id === draft.estil)) draft.estil = defaultStyle(draft.metre);
  const levels = LEVELS[i.id].filter((l) => l.n !== 7);
  const opts = levelOptions(i.id, Number(draft.nivell), draft.metre);
  if (opts?.cards && !opts.cards.find((c) => c.id === draft.opcio)) draft.opcio = opts.cards[0]?.id ?? null;
  if (opts?.items && !opts.items.find(([k]) => k === draft.opcio)) draft.opcio = opts.items[0][0];
  if (!opts) draft.opcio = null;
  const parsed = parseProgression(draft.prog);
  const mine = store.songs().filter((s) => (s.inst ?? i.id) === i.id);
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-go="home">← Inici</button>
      <div><small class="muted">${esc(i.nom)}</small><h2>La meva cançó</h2><p class="muted">Escriu els acords, tria el compàs, l'estil i el nivell. El joc fa la base i t'ensenya què has de fer.</p></div></div>
    <div class="creator">
      <form class="panel cform" id="cform">
        <label>Títol <input type="text" name="titol" value="${esc(draft.titol)}" placeholder="Com es diu?"></label>
        <label>Acords <small class="muted">un compàs entre barres; dos acords en un compàs, separats per un espai; [Tornada] davant d'un compàs posa nom a la part</small>
          <textarea name="prog" rows="${Math.min(8, 3 + Math.floor(String(draft.prog).length / 70))}" spellcheck="false">${esc(draft.prog)}</textarea></label>
        <div class="prog-preview">${previewHtml(parsed)}</div>
        <div class="cols">
          <label>Compàs <select name="metre">${Object.values(METRES).map((m) => `<option value="${m.id}"${m.id === draft.metre ? ' selected' : ''}>${esc(m.nom)}</option>`).join('')}</select></label>
          <label>Tempo <input type="number" name="tempo" min="40" max="200" value="${esc(draft.tempo)}"></label>
          <label>Estil <select name="estil">${styles.map((s) => `<option value="${s.id}"${s.id === draft.estil ? ' selected' : ''}>${esc(s.nom)}</option>`).join('')}</select></label>
        </div>
        <label>Nivell <select name="nivell">${levels.map((l) => `<option value="${l.n}"${l.n === Number(draft.nivell) ? ' selected' : ''}>${l.n}. ${esc(l.titol)}</option>`).join('')}</select></label>
        ${opts ? `<div class="copts"><span>${esc(opts.label)}</span>${opts.cards ? `<button type="button" class="cpick" data-pickcard="1"><img src="${cardById(draft.opcio)?.img ?? ''}" alt=""><small>Canvia la carta</small></button>` : `<select name="opcio">${opts.items.map(([k, t]) => `<option value="${esc(k)}"${k === draft.opcio ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`}</div>` : ''}
        <div class="row">
          <button type="button" class="btn btn-primary btn-big" data-c="go" ${parsed.bars.length ? '' : 'disabled'}>▶ Fes-me la base i l'animació</button>
          <button type="button" class="btn btn-ghost" data-c="save">💾 Desa</button>
          <button type="button" class="btn btn-ghost" data-c="new">Nova</button>
        </div>
        ${msg ? `<p class="note">${esc(msg)}</p>` : ''}
        ${parsed.bars.length ? `<div class="row"><button type="button" class="btn ${store.workSong()?.prog === draft.prog ? 'btn-ghost' : 'btn-primary'}" data-c="worksong">${store.workSong()?.prog === draft.prog ? '✓ És la cançó amb què treballes el full de ruta' : '🎵 Treballa el full de ruta amb aquesta cançó'}</button></div>` : ''}
      </form>
      <div class="side-col">
        <div class="panel songs-panel">
          <h3>Obre una cançó</h3>
          <div class="tabs" role="tablist">${SONG_TABS.map(([id, t]) => `<button type="button" role="tab" class="tab${id === songTab ? ' on' : ''}" data-tab="${id}">${esc(t)}</button>`).join('')}</div>
          <div id="song-list"></div>
        </div>
      </div>
    </div>`;
  const form = $('#cform');
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (!t.name) return;
    draft[t.name] = t.value;
    if (t.name === 'metre' || t.name === 'nivell') { if (t.name === 'nivell') draft.opcio = null; renderCreator(); }
  });
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'prog') {
      draft.prog = t.value;
      const p = parseProgression(draft.prog);
      $('.prog-preview', v).innerHTML = previewHtml(p);
      $('[data-c="go"]', v).disabled = !p.bars.length;
    } else if (t.name === 'titol' || t.name === 'tempo') draft[t.name] = t.value;
  });
  renderSongTab();
}

const SONG_TABS = [['meves', 'Les meves'], ['llibre', 'Llibre ROCKIN'], ['teclat', 'Joc de teclat'], ['biblio', 'Biblioteca compartida']];
let songTab = 'llibre';

function previewHtml(p) {
  return `${p.bars.map((bar) => `${bar.part ? `<b class="part-tag">${esc(bar.part)}</b>` : ''}<span>${bar.map((x) => esc(x.chord.symbol)).join(' ')}</span>`).join('')}${p.errors.length ? `<em class="err">No entenc: ${p.errors.map(esc).join(', ')}</em>` : ''}`;
}

const songRow = (attr, id, title, sub, extra = '') => `<li><button type="button" class="link" ${attr}="${esc(id)}"><b>${esc(title)}</b><small>${esc(sub)}</small></button>${extra}</li>`;
let songIndex = new Map(); // id → cançó (llibre i joc de teclat)

async function renderSongTab() {
  const box = $('#song-list');
  if (!box) return;
  const i = inst();
  if (songTab === 'meves') {
    const mine = store.songs().filter((s) => (s.inst ?? i.id) === i.id);
    box.innerHTML = mine.length ? `<ul class="songs">${mine.map((s) => songRow('data-song', s.id, s.titol || 'Sense títol', `${s.prog} · ${s.metre} · nivell ${s.nivell}`, `<button type="button" class="icon-btn" data-del="${s.id}" title="Esborra">🗑</button>`)).join('')}</ul>` : '<p class="muted small">Encara no n\'has desat cap. Escriu-ne una i prem «Desa».</p>';
  } else if (songTab === 'llibre') {
    box.innerHTML = '<p class="muted small">Carregant…</p>';
    const list = await songbook();
    if (songTab !== 'llibre') return;
    for (const s of list) songIndex.set(s.id, s);
    box.innerHTML = `<p class="muted small">Les cançons del Llibre de temes ROCKIN, amb la seva estructura (les mateixes del joc de teclat).</p><ul class="songs">${list.map((s) => songRow('data-ksong', s.id, s.titol, `${s.artista} · ${s.tempo} bpm`)).join('')}</ul>`;
  } else if (songTab === 'teclat') {
    const own = keyboardSongs();
    for (const s of [...WHEELS, ...own]) songIndex.set(s.id, s);
    box.innerHTML = `${own.length ? `<h4>Fetes o obertes al joc de teclat</h4><ul class="songs">${own.map((s) => songRow('data-ksong', s.id, s.titol, `${s.font === 'teclat-biblio' ? 'de la biblioteca · ' : ''}${s.prog.replace(/\[[^\]]*\]\s*/g, '').split('|').slice(0, 4).join('|')} · ${s.metre}`)).join('')}</ul>`
      : '<p class="muted small">Les cançons que hagis fet o obert al joc de teclat surten aquí quan els dos jocs s\'obren des de la mateixa adreça (rockin-cat.github.io) i al mateix navegador.</p>'}
      <h4>Rodes de cançons del joc de teclat</h4><ul class="songs">${WHEELS.map((s) => songRow('data-ksong', s.id, s.titol, s.artista)).join('')}</ul>`;
  } else {
    box.innerHTML = `<p class="muted small">La biblioteca del Generador de diagrames: és la mateixa que obren els jocs de teclat i de bateria, amb el mateix codi del professorat.</p>
      <form class="row" id="lib-form"><input type="text" id="lib-code" placeholder="Codi del professorat" value="${esc(savedCode())}"><button class="btn btn-ghost">Obre</button></form><div id="lib-list"></div>`;
    $('#lib-form').addEventListener('submit', (e) => { e.preventDefault(); openLibrary($('#lib-code').value.trim()); });
    if (savedCode()) openLibrary(savedCode(), true);
  }
}

function loadSong(s, from) {
  const metre = s.metre ?? '4/4';
  Object.assign(draft, { titol: s.titol, artista: s.artista ?? '', prog: s.prog, metre, tempo: s.tempo ?? 90, estil: STYLES[s.estil]?.metres.includes(metre) ? s.estil : mapStyle(s.estil, metre), id: null, compose: null });
  renderCreator(`«${s.titol}» oberta${from ? ` ${from}` : ''}${s.nota ? `. ${s.nota}` : ''}. Tria el nivell i prem «Fes-me la base».`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function creatorClick(b) {
  const i = inst();
  if (b.dataset.c === 'go') {
    const step = stepFromDraft(i.id);
    show('session');
    openSession($('#v-session'), step, { inst: i.id, backLabel: 'La meva cançó', onBack: () => { renderCreator(); show('creator'); } });
  } else if (b.dataset.c === 'save') {
    const s = store.saveSong({ ...draft, inst: i.id, titol: draft.titol || 'La meva cançó' });
    draft.id = s.id;
    songTab = 'meves';
    renderCreator('Desada a «Les meves».');
  } else if (b.dataset.c === 'worksong') {
    store.setWorkSong({ ...draft, titol: draft.titol || 'La meva cançó' });
    renderCreator(`Ara tots els passos del full de ruta es practiquen amb «${draft.titol || 'La meva cançó'}».`);
  } else if (b.dataset.c === 'new') {
    Object.assign(draft, { titol: '', artista: '', prog: '', id: null, compose: null });
    renderCreator();
  } else if (b.dataset.pickcard) {
    const opts = levelOptions(i.id, Number(draft.nivell), draft.metre);
    openPicker(opts.cards, draft.opcio, (id) => { draft.opcio = id; renderCreator(); });
  } else if (b.dataset.song) {
    const s = store.songs().find((x) => x.id === b.dataset.song);
    if (s) { Object.assign(draft, { titol: s.titol, prog: s.prog, metre: s.metre, tempo: s.tempo, estil: s.estil, nivell: s.nivell, opcio: s.opcio ?? null, id: s.id, compose: s.compose ?? null }); renderCreator(); }
  } else if (b.dataset.del) {
    store.deleteSong(b.dataset.del);
    renderCreator();
  } else if (b.dataset.lib) {
    loadFromLibrary(b.dataset.lib);
  } else if (b.dataset.tab) {
    songTab = b.dataset.tab;
    for (const t of document.querySelectorAll('.songs-panel .tab')) t.classList.toggle('on', t.dataset.tab === songTab);
    renderSongTab();
  } else if (b.dataset.ksong) {
    const s = songIndex.get(b.dataset.ksong);
    if (s) loadSong(s, s.font === 'llibre' ? 'del Llibre ROCKIN' : 'del joc de teclat');
  }
}

let libEntries = [];
async function openLibrary(code, quiet = false) {
  const box = $('#lib-list');
  if (!code) return;
  box.innerHTML = '<p class="muted small">Carregant…</p>';
  try {
    libEntries = await listLibrary(code);
    saveCode(code);
    box.innerHTML = libEntries.length ? `<ul class="songs">${libEntries.slice(0, 60).map((s) => `<li><button type="button" class="link" data-lib="${esc(s.id)}"><b>${esc(s.titol || s.nom)}</b><small>${esc(s.artista || '')}</small></button></li>`).join('')}</ul>` : '<p class="muted small">La biblioteca és buida.</p>';
  } catch (e) {
    box.innerHTML = quiet ? '' : `<p class="err">${esc(errorText(e))}</p>`;
  }
}
async function loadFromLibrary(id) {
  const box = $('#lib-list');
  try {
    const entry = libEntries.find((x) => x.id === id);
    const s = songFromLibrary(await loadLibrarySong(savedCode(), id), entry);
    loadSong({ ...s, estil: s.estil ?? defaultStyle(s.metre) }, 'de la biblioteca compartida');
  } catch (e) {
    box.insertAdjacentHTML('afterbegin', `<p class="err">${esc(errorText(e))}</p>`);
  }
}

// ---- Navegació -------------------------------------------------------------------------------------------------

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('button, a');
  if (!b) return;
  if (b.id === 'home-link') { ev.preventDefault(); renderHome(); show('home'); return; }
  if (b.id === 'player-chip') { store.setCurrent(null); renderHome(); show('home'); return; }
  if (b.id === 'settings-btn') { $('#set-thick').checked = store.settings().thickTop !== false; $('#settings').showModal(); return; }
  if (b.dataset.inst && b.closest('#inst-switch, .inst-tiles')) {
    if (!store.currentName()) return;
    store.setInstrument(b.dataset.inst);
    applyAccent();
    const view = document.body.dataset.view;
    if (view === 'map') renderMap();
    else if (view === 'creator') renderCreator();
    else if (view === 'home') renderHome();
    else { renderMap(); show('map'); }
    return;
  }
  if (b.dataset.player) { store.setCurrent(b.dataset.player); renderHome(); applyAccent(); return; }
  const go = b.dataset.go;
  if (go === 'who') { store.setCurrent(null); renderHome(); applyAccent(); return; }
  if (go === 'home') { renderHome(); show('home'); return; }
  if (go === 'map') { renderMap(); show('map'); return; }
  if (go === 'creator') { renderCreator(); show('creator'); return; }
  if (go === 'songs') { songTab = 'llibre'; renderCreator(); show('creator'); document.querySelector('.songs-panel')?.scrollIntoView({ block: 'start' }); return; }
  if (go === 'continue') {
    const nx = nextStep(inst().id);
    if (nx) openStep(nx.step.id); else { renderMap(); show('map'); }
    return;
  }
  if (b.dataset.level && !b.closest('.session')) { renderLevel(Number(b.dataset.level)); show('level'); return; }
  if (b.dataset.step) { openStep(b.dataset.step); return; }
  if (b.dataset.card && b.closest('#v-cards')) { openCard(b.dataset.card); return; }
  if (b.closest('#v-creator') && (b.dataset.c || b.dataset.song || b.dataset.del || b.dataset.lib || b.dataset.pickcard || b.dataset.tab || b.dataset.ksong)) { creatorClick(b); }
});

$('#settings').addEventListener('close', () => {
  store.settings().thickTop = $('#set-thick').checked;
  store.save();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.dataset.view === 'session' && !document.querySelector('dialog[open]')) {
    document.querySelector('#v-session [data-act="back"]')?.click();
  }
  if (e.key === ' ' && document.body.dataset.view === 'session' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) {
    e.preventDefault();
    const stop = document.querySelector('#v-session [data-act="stop"]');
    if (stop && !stop.disabled) stop.click(); else document.querySelector('#v-session [data-act="full"]')?.click();
  }
});

renderHome();
show('home');
window.__rockinReady = true;
window.rockinGB = { store, openStep, LEVELS };
