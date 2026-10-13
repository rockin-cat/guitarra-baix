// ROCKIN · Guitarra i baix — pantalles: inici, la teva cançó, full de ruta, nivell, cartes, què sé fer i pràctica.
// Sempre es treballa a partir d'una cançó: tots els nivells fan servir la mateixa roda d'acords.

import * as store from './store.js';
import { LEVELS, allSteps, stepFits } from './levels.js';
import { INSTRUMENTS } from './fretboard.js';
import { openSession, closeSession } from './session.js';
import { BINARI, TERNARI, MELODIC, RASCATS, cardById, cardMetre } from './data/cartes.js';
import { METRES, parseProgression } from './theory.js';
import { stylesFor, defaultStyle, STYLES } from './band.js';
import { savedCode, saveCode, listLibrary, loadLibrarySong, songFromLibrary, errorText } from './library.js';
import { songbook, WHEELS, keyboardSongs, mapStyle } from './songs.js';
import { structureHtml } from './songview.js';
import { summary } from './skills.js';
import { renderGuide, closeGuide } from './guide.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const VIEWS = ['home', 'song', 'map', 'level', 'cards', 'skills', 'guide', 'session'];

const inst = () => INSTRUMENTS[store.instrumentOf()];

function show(view) {
  if (view !== 'session') closeSession();
  if (view !== 'guide') closeGuide();
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

// ---- Progrés (només els passos que quadren amb el compàs de la cançó) ---------------------------------------------

const metreNow = () => store.workSong()?.metre ?? '4/4';
const fits = (p) => stepFits(p, metreNow(), (id) => cardMetre(cardById(id)));
const visibleSteps = (l) => l.passos.filter(fits);
const icon = (st) => (st?.best === 'ok' ? '✓' : st?.best === 'gairebe' ? '◐' : st?.best === 'no' ? '·' : '○');
function levelProgress(level) {
  const steps = visibleSteps(level);
  return { done: steps.filter((p) => store.stepState(p.id)?.best === 'ok').length, total: steps.length };
}
function nextStep(instId) {
  for (const l of LEVELS[instId]) for (const p of visibleSteps(l)) if (store.stepState(p.id)?.best !== 'ok' && !(p.grup ?? '').startsWith('Acords oberts')) return { level: l, step: p };
  return null;
}

const guitarSvg = (c) => `<svg viewBox="0 0 40 60" width="34" height="50"><rect x="18" y="2" width="4" height="30" fill="#2b3446"/><rect x="16" y="0" width="8" height="8" rx="2" fill="${c}"/><path d="M20 26c-7 0-11 5-9 10-5 2-6 10-2 15 4 6 18 6 22 0 4-5 3-13-2-15 2-5-2-10-9-10z" fill="${c}"/><rect x="18" y="26" width="4" height="22" fill="#2b3446"/></svg>`;
const bassSvg = (c) => `<svg viewBox="0 0 40 60" width="34" height="50"><rect x="18.5" y="2" width="3" height="32" fill="#2b3446"/><rect x="17" y="0" width="6" height="7" rx="2" fill="${c}"/><path d="M20 28c-6 0-9 4-8 9-4 2-5 9-2 14 3 6 17 6 20 0 3-5 2-12-2-14 1-5-2-9-8-9z" fill="${c}"/><rect x="18.5" y="28" width="3" height="20" fill="#2b3446"/></svg>`;

const MODE_TEXT = (m) => (typeof m === 'string' ? 'amb celleta' : m.type === 'power' ? ['power chord · un dit a la corda 6', 'power chord · 1 i 5', 'power chord sencer (1, 5, 8)'][m.parts - 1] : m.cordes >= 6 ? 'acords oberts · totes les cordes' : `acords oberts · ${m.cordes === 1 ? 'corda 1' : `cordes 1 a ${m.cordes}`}`);

/** La cançó amb què es treballa (amb l'estructura en petit). */
function workSongBox({ full = false } = {}) {
  const ws = store.workSong();
  const i = inst();
  if (!ws) {
    return `<div class="work-song empty"><span class="ws-icon">🎵</span><div class="ws-main"><small>Sempre s'aprèn a partir d'una cançó</small><span class="ws-name">Tria la cançó amb què treballes</span>
      <small>Del Llibre ROCKIN, de la biblioteca del Generador o escrivint-ne els acords. Després, tots els nivells es fan sobre aquesta roda.</small></div>
      <button type="button" class="btn btn-primary btn-big" data-go="song">Tria la cançó</button></div>`;
  }
  return `<div class="work-song">
      <div class="ws-top"><span class="ws-icon">🎵</span>
        <div class="ws-main"><small>La cançó amb què treballes</small><span class="ws-name">${esc(ws.titol)}</span>${ws.artista ? ` <small class="ws-art">· ${esc(ws.artista)}</small>` : ''}
          <small>${esc(ws.metre)} · ${ws.tempo} bpm${i.id === 'guitarra' ? ` · acords: ${esc(MODE_TEXT(store.chordMode()))}` : ''}${i.id === 'baix' && ws.baix?.length ? ` · 🎸 ${ws.baix.length === 1 ? 'una línia' : `${ws.baix.length} línies`} de baix del Generador` : ''}</small></div>
        <button type="button" class="btn btn-ghost" data-go="song">Canvia de cançó</button></div>
      ${full ? `<div class="ws-struct">${structureHtml(ws, { compact: true })}</div>` : ''}
    </div>`;
}

// ---- Inici ------------------------------------------------------------------------------------------------------

function renderHome() {
  const v = $('#v-home');
  const name = store.currentName();
  const i = inst();
  const ws = store.workSong();
  const nx = name && ws ? nextStep(i.id) : null;
  v.innerHTML = `
    <div class="hero">
      <img class="hero-logo" src="assets/brand/rockin-logo.png" alt="ROCKIN · [r]evolucionem la música">
      <div>
        <h1>Guitarra i baix amb els fulls de ruta ROCKIN</h1>
        <p>Tries una cançó i la treballes nivell a nivell: primer escoltes, després la banda continua sense el teu instrument i l'animació del mànec et guia. Tot es va sumant sobre la mateixa roda d'acords.</p>
      </div>
    </div>
    ${name ? `
      ${updatedNote ? `<p class="note">🔄 ${esc(updatedNote)}</p>` : ''}
      <div class="who-short"><span>Hola, <b>${esc(name)}</b>! Què toques avui?</span><button type="button" class="btn btn-ghost" data-go="who">No soc jo · canvia</button></div>
      <div class="inst-tiles">
        ${Object.values(INSTRUMENTS).map((x) => `<button type="button" class="inst-tile${x.id === i.id ? ' on' : ''}" data-inst="${x.id}" style="--c:${x.color}"><span class="it-icon">${x.id === 'guitarra' ? guitarSvg(x.color) : bassSvg(x.color)}</span><span><b>${esc(x.nom)}</b><small>${ws ? levelLine(x.id) : ''}</small></span></button>`).join('')}
      </div>
      ${!store.player()?.guideDone ? `<button type="button" class="door door-guide" data-go="guide"><span class="door-icon">👀</span><span class="door-text"><b>Comences de zero? Aprèn a llegir la pantalla</b><small>Què vol dir cada cosa del mànec, la púa, la pista i les cartes, i com trobar-ho ${i.id === 'guitarra' ? 'a la guitarra' : 'al baix'}</small></span></button>` : ''}
      ${workSongBox({ full: true })}
      ${ws ? `<div class="doors">
        <button type="button" class="door door-main" data-go="continue"><span class="door-icon">▶</span><span class="door-text"><b>Continua</b><small>${nx ? `Nivell ${nx.level.n} · ${esc(nx.step.titol)}` : 'Has fet tot el full de ruta! Tria qualsevol pas.'}</small></span></button>
        <button type="button" class="door" data-go="map"><span class="door-icon">🗺️</span><span class="door-text"><b>Full de ruta</b><small>Els 10 nivells de ${esc(i.curt.toLowerCase())}, sobre «${esc(ws.titol)}»</small></span></button>
        <button type="button" class="door" data-go="skills"><span class="door-icon">🎒</span><span class="door-text"><b>Què sé fer</b><small>El que has desbloquejat i què pots fer a la banda</small></span></button>
        ${store.player()?.guideDone ? `<button type="button" class="door" data-go="guide"><span class="door-icon">👀</span><span class="door-text"><b>Aprèn a llegir la pantalla</b><small>Què vol dir cada cosa i com trobar-ho a l'instrument</small></span></button>` : ''}
      </div>` : ''}` : `
      <div class="panel who">
        <h2>Qui toca?</h2>
        <p class="muted small">Tria el teu nom o escriu-ne un de nou. El progrés es guarda en aquest navegador.</p>
        <div class="who-list">${store.players().map((p) => `<button type="button" class="who-btn" data-player="${esc(p)}"><b>${esc(p)}</b><small>${esc(INSTRUMENTS[store.player(p).inst]?.curt ?? '')}${store.player(p).song ? ` · ${esc(store.player(p).song.titol)}` : ''}</small></button>`).join('')}</div>
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
  let nx = null;
  for (const l of LEVELS[instId]) { for (const p of visibleSteps(l)) if (store.stepState(p.id)?.best !== 'ok') { nx = l; break; } if (nx) break; }
  return nx ? `Nivell ${nx.n} de 10 · ${esc(nx.titol)}` : 'Full de ruta complet';
}

// ---- Full de ruta (com el pòster) ----------------------------------------------------------------------------

const LEVEL_ICONS = ['♫', '⎍', '✋', '🎤', '📈', '≋', '🎚', '⚡', '✒', '✎'];

function renderMap() {
  const i = inst();
  const v = $('#v-map');
  const levels = LEVELS[i.id];
  const [w1, w2] = i.id === 'guitarra' ? ['GUITARRA', 'ELÈCTRICA'] : ['BAIX', 'ELÈCTRIC'];
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-go="home">← Inici</button></div>
    ${workSongBox()}
    <div class="poster" style="--c:${i.color}">
      <div class="poster-head">
        <div class="poster-icon">${i.id === 'guitarra' ? guitarSvg(i.color) : bassSvg(i.color)}</div>
        <div class="poster-w1">${w1}</div>
        <div class="poster-w2">${w2}</div>
        <div class="poster-sub">FULL DE RUTA · NIVELLS</div>
      </div>
      <div class="poster-grid">
        ${levels.map((l, k) => { const p = levelProgress(l); return `
          <button type="button" class="ptile${p.total && p.done === p.total ? ' done' : ''}" data-level="${l.n}">
            <span class="pick-badge">${l.n}</span>
            <span class="ptile-text"><b>${esc(l.titol.toUpperCase())}</b><small>${esc(l.sub)}</small>
              <span class="pbar"><i style="width:${p.total ? (100 * p.done) / p.total : 0}%"></i></span><em>${p.done} de ${p.total} passos</em></span>
            <span class="ptile-icon">${LEVEL_ICONS[k]}</span>
          </button>`; }).join('')}
      </div>
      <div class="poster-foot"><span>ENDIRECTE: MÚSICA ALS INSTITUTS</span><em>Pugem de nivell?</em></div>
    </div>`;
}

// ---- Un nivell -------------------------------------------------------------------------------------------------

let currentLevel = 1;
function renderLevel(n = currentLevel) {
  currentLevel = n;
  const i = inst();
  const l = LEVELS[i.id][n - 1];
  const v = $('#v-level');
  const steps = visibleSteps(l);
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-go="map">← Full de ruta</button>
      <div><small class="muted">${esc(i.nom)} · Nivell ${l.n} de 10</small><h2>${esc(l.titol)}</h2><p class="muted">${esc(l.sub)}</p></div></div>
    ${workSongBox()}
    <ol class="steps">
      ${steps.map((p, k) => { const s = store.stepState(p.id); return `
        ${p.grup && p.grup !== steps[k - 1]?.grup ? `<li class="step-group">${esc(p.grup)}</li>` : ''}
        <li class="step ${s?.best ?? ''}">
          <span class="step-state" title="${s?.best === 'ok' ? 'Et surt' : s?.best === 'gairebe' ? 'Gairebé' : 'Per fer'}">${icon(s)}</span>
          <div class="step-text"><b>${k + 1}. ${esc(p.titol)}</b><small>${esc(p.text ?? '')}</small>
            ${s?.best === 'ok' && s.tempo ? `<span class="step-meta">t'ha sortit a ${s.tempo} bpm</span>` : ''}</div>
          <button type="button" class="btn ${s?.best === 'ok' ? 'btn-ghost' : 'btn-primary'}" data-step="${p.id}">${p.kind === 'cards' ? 'Tria carta' : p.kind === 'tune' ? 'Afina' : s?.best === 'ok' ? 'Repassa' : 'Practica'}</button>
        </li>`; }).join('')}
    </ol>
    <div class="row">${n > 1 ? `<button type="button" class="btn btn-ghost" data-level="${n - 1}">← Nivell ${n - 1}</button>` : ''}${n < 10 ? `<button type="button" class="btn btn-ghost" data-level="${n + 1}">Nivell ${n + 1} →</button>` : ''}</div>`;
}

function openStep(id) {
  const i = inst();
  const steps = allSteps(i.id).filter(fits);
  const idx = steps.findIndex((s) => s.id === id);
  const step = steps[idx];
  if (!step) return;
  if (!store.workSong() && step.kind !== 'tune') { renderSong('Primer tria la cançó: tots els passos es fan sobre la seva roda d\'acords.'); show('song'); return; }
  if (step.kind === 'cards') { renderCards(step); show('cards'); return; }
  const level = LEVELS[i.id][step.nivell - 1];
  const lsteps = visibleSteps(level);
  const k = lsteps.findIndex((p) => p.id === id);
  show('session');
  const next = steps[idx + 1];
  openSession($('#v-session'), step, {
    inst: i.id,
    backLabel: `Nivell ${step.nivell}`,
    crumb: `Pas ${k + 1} de ${lsteps.length}`,
    onBack: () => { renderLevel(step.nivell); show('level'); },
    onNext: next ? () => openStep(next.id) : null,
    onChooseSong: () => { renderSong(); show('song'); },
  });
}

// ---- Cartes (triar-ne una) -------------------------------------------------------------------------------------

let cardsStep = null;
function renderCards(step) {
  cardsStep = step;
  const i = inst();
  const v = $('#v-cards');
  const m = metreNow();
  const ok = (c) => { const cm = cardMetre(c); return !cm || cm === m || (cm === '4/4' && m === '2/4'); };
  const groups = step.deck === 'ritme'
    ? [['Cartes rítmiques', [...BINARI, ...TERNARI].filter(ok)]]
    : step.deck === 'rascats' ? [['Rascats de guitarra', RASCATS.filter(ok)]] : [['Patrons melòdics', MELODIC]];
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-level="${step.nivell}">← Nivell ${step.nivell}</button>
      <div><small class="muted">${esc(i.nom)} · Nivell ${step.nivell}</small><h2>${esc(step.titol)}</h2><p class="muted">Les cartes que van amb el compàs de la cançó (${esc(m)}). Clica'n una per practicar-la sobre «${esc(store.workSong()?.titol ?? '')}».</p></div></div>
    ${groups.map(([t, list]) => `<h3>${esc(t)}</h3>${list.length ? `<div class="card-grid">${list.map((c) => { const s = store.stepState(`${step.id}:${c.id}`); return `<button type="button" class="pcard${s?.best === 'ok' ? ' done' : ''}" data-card="${c.id}"><img src="${c.img}" alt="Carta ${c.id}" loading="lazy">${s?.best === 'ok' ? '<i>✓</i>' : ''}</button>`; }).join('')}</div>` : '<p class="muted">No hi ha cartes d\'aquest tipus per a aquest compàs.</p>'}`).join('')}`;
}

function openCard(cardId) {
  const step = cardsStep;
  const i = inst();
  let part;
  if (step.deck === 'ritme') part = i.id === 'guitarra' ? { type: 'strum', card: cardId } : { type: 'bass', card: cardId, roles: ['1'] };
  else if (step.deck === 'rascats') part = { type: 'rascat', card: cardId };
  else part = { type: 'arp', card: cardId };
  const s = {
    ...step, kind: 'play', id: `${step.id}:${cardId}`, titol: `Carta ${cardId}`, part, carta: cardId,
    text: step.deck === 'melodic' ? 'El contorn de la carta, fet amb les notes de l\'acord (1, 3, 5, 8).' : 'Cada símbol de la carta és un cop. Mira la carta i el mànec alhora.',
    com: [],
  };
  show('session');
  openSession($('#v-session'), s, { inst: i.id, backLabel: 'Cartes', onBack: () => { renderCards(step); show('cards'); } });
}

// ---- La teva cançó: triar-la (o escriure'n els acords) i veure'n l'estructura -----------------------------------

const draft = { titol: '', artista: '', prog: '', metre: '4/4', tempo: 90, estil: 'pop', baix: null, font: null };
let editing = false;
let songTab = 'llibre';

const SONG_TABS = [['llibre', 'Llibre ROCKIN'], ['biblio', 'Biblioteca compartida'], ['teclat', 'Joc de teclat'], ['meves', 'Les meves']];
const sameSong = (a, b) => a && b && a.prog === b.prog && a.titol === b.titol;

function renderSong(msg = '') {
  const v = $('#v-song');
  const ws = store.workSong();
  if (!draft.prog && ws && !editing) Object.assign(draft, { ...ws, font: 'treball' });
  const has = parseProgression(draft.prog).bars.length > 0;
  const styles = stylesFor(draft.metre);
  if (!styles.find((s) => s.id === draft.estil)) draft.estil = defaultStyle(draft.metre);
  const isWork = sameSong(ws, draft);
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-go="home">← Inici</button>
      <div><small class="muted">${esc(inst().nom)}</small><h2>La teva cançó</h2><p class="muted">Tria la cançó amb què treballaràs tot el full de ruta. Si no és a cap llista, escriu-ne els acords.</p></div></div>
    ${msg ? `<p class="note">${esc(msg)}</p>` : ''}
    <div class="creator">
      <div class="song-col">
        ${has && !editing ? `
        <div class="panel song-card">
          <div class="song-head"><div><h2>${esc(draft.titol || 'Sense títol')}</h2>${draft.artista ? `<p class="muted">${esc(draft.artista)}</p>` : ''}
            <p class="song-meta">${esc(draft.metre)} · ${esc(draft.tempo)} bpm · ${esc(STYLES[draft.estil]?.nom ?? '')}${draft.baix?.length ? ` · 🎸 ${draft.baix.length === 1 ? 'una línia' : `${draft.baix.length} línies`} de baix del Generador` : ''}</p></div>
            <button type="button" class="btn btn-ghost btn-small" data-c="edit">✎ Edita</button></div>
          ${structureHtml(draft)}
          <div class="row">
            ${isWork ? '<span class="song-ok">✓ És la cançó amb què treballes</span><button type="button" class="btn btn-primary btn-big" data-go="map">Ves al full de ruta →</button>'
              : '<button type="button" class="btn btn-primary btn-big" data-c="worksong">🎵 Treballa el full de ruta amb aquesta cançó</button>'}
          </div>
        </div>` : `
        <form class="panel cform" id="cform">
          <h3>${has ? 'Edita la cançó' : 'Una altra cançó: escriu-ne els acords'}</h3>
          <div class="cols2"><label>Títol <input type="text" name="titol" value="${esc(draft.titol)}" placeholder="Com es diu?"></label>
          <label>Artista <input type="text" name="artista" value="${esc(draft.artista)}" placeholder="(opcional)"></label></div>
          <label>Acords <small class="muted">un compàs entre barres; dos acords en un compàs, separats per un espai; [Tornada] davant d'un compàs posa nom a la part</small>
            <textarea name="prog" rows="${Math.min(8, 3 + Math.floor(String(draft.prog).length / 70))}" spellcheck="false" placeholder="[Intro] Am | F | C | G | [Estrofa] Am | F | C | G | [Tornada] F | G | Am | Am">${esc(draft.prog)}</textarea></label>
          <div class="cols">
            <label>Compàs <select name="metre">${Object.values(METRES).map((m) => `<option value="${m.id}"${m.id === draft.metre ? ' selected' : ''}>${esc(m.nom)}</option>`).join('')}</select></label>
            <label>Tempo <input type="number" name="tempo" min="40" max="200" value="${esc(draft.tempo)}"></label>
            <label>Estil <select name="estil">${styles.map((s) => `<option value="${s.id}"${s.id === draft.estil ? ' selected' : ''}>${esc(s.nom)}</option>`).join('')}</select></label>
          </div>
          <div class="struct-preview" id="struct-preview">${has ? structureHtml(draft) : ''}</div>
          <p class="err" id="prog-err"></p>
          <div class="row"><button type="button" class="btn btn-primary btn-big" data-c="done" ${has ? '' : 'disabled'}>Fet</button>${has ? '<button type="button" class="btn btn-ghost" data-c="cancel">Cancel·la</button>' : ''}</div>
        </form>`}
      </div>
      <div class="side-col">
        <div class="panel songs-panel">
          <h3>Tria una cançó</h3>
          <button type="button" class="btn btn-ghost new-song" data-c="new">✎ No hi és? Escriu-ne els acords</button>
          <div class="tabs" role="tablist">${SONG_TABS.map(([id, t]) => `<button type="button" role="tab" class="tab${id === songTab ? ' on' : ''}" data-tab="${id}">${esc(t)}</button>`).join('')}</div>
          <div id="song-list"></div>
        </div>
      </div>
    </div>`;
  const form = $('#cform');
  if (form) {
    const update = () => {
      const p = parseProgression(draft.prog);
      $('#struct-preview').innerHTML = p.bars.length ? structureHtml(draft) : '';
      $('#prog-err').textContent = p.errors.length ? `No entenc: ${p.errors.join(', ')}` : '';
      $('[data-c="done"]', v).disabled = !p.bars.length;
    };
    form.addEventListener('input', (e) => { const t = e.target; if (t.name) { draft[t.name] = t.value; if (t.name === 'prog') update(); } });
    form.addEventListener('change', (e) => { const t = e.target; if (!t.name) return; draft[t.name] = t.value; if (t.name === 'metre') { renderSong(); } });
  }
  renderSongTab();
}

const songRow = (attr, id, title, sub, extra = '') => `<li><button type="button" class="link" ${attr}="${esc(id)}"><b>${esc(title)}</b><small>${esc(sub)}</small></button>${extra}</li>`;
const songIndex = new Map();

async function renderSongTab() {
  const box = $('#song-list');
  if (!box) return;
  if (songTab === 'meves') {
    const mine = store.songs();
    for (const s of mine) songIndex.set(s.id, { ...s, font: 'meves' });
    box.innerHTML = mine.length ? `<ul class="songs">${mine.map((s) => songRow('data-ksong', s.id, s.titol || 'Sense títol', `${s.metre} · ${s.prog.replace(/\[[^\]]*\]\s*/g, '').split('|').slice(0, 4).join('|')}`, `<button type="button" class="icon-btn" data-del="${s.id}" title="Esborra">🗑</button>`)).join('')}</ul>` : '<p class="muted small">Les cançons que escriguis surten aquí.</p>';
  } else if (songTab === 'llibre') {
    box.innerHTML = '<p class="muted small">Carregant…</p>';
    const list = await songbook();
    if (songTab !== 'llibre') return;
    for (const s of list) songIndex.set(s.id, s);
    box.innerHTML = `<p class="muted small">El Llibre de temes ROCKIN, amb l'estructura de cada cançó (el mateix del joc de teclat).</p><ul class="songs">${list.map((s) => songRow('data-ksong', s.id, s.titol, `${s.artista} · ${s.tempo} bpm`)).join('')}</ul>`;
  } else if (songTab === 'teclat') {
    const own = keyboardSongs();
    for (const s of [...WHEELS, ...own]) songIndex.set(s.id, s);
    box.innerHTML = `${own.length ? `<h4>Fetes o obertes al joc de teclat</h4><ul class="songs">${own.map((s) => songRow('data-ksong', s.id, s.titol, `${s.font === 'teclat-biblio' ? 'de la biblioteca · ' : ''}${s.metre}`)).join('')}</ul>`
      : '<p class="muted small">Les cançons que hagis fet o obert al joc de teclat surten aquí quan els dos jocs s\'obren des de rockin-cat.github.io i al mateix navegador.</p>'}
      <h4>Rodes de cançons del joc de teclat</h4><ul class="songs">${WHEELS.map((s) => songRow('data-ksong', s.id, s.titol, s.artista)).join('')}</ul>`;
  } else {
    box.innerHTML = `<p class="muted small">La biblioteca del Generador de diagrames: la mateixa que obren els jocs de teclat i de bateria, amb el codi del professorat. Si la cançó porta línia de baix, el joc de baix la fa servir.</p>
      <form class="row" id="lib-form"><input type="text" id="lib-code" placeholder="Codi del professorat" value="${esc(savedCode())}"><button class="btn btn-ghost">Obre</button></form><div id="lib-list"></div>`;
    $('#lib-form').addEventListener('submit', (e) => { e.preventDefault(); openLibrary($('#lib-code').value.trim()); });
    if (savedCode()) openLibrary(savedCode(), true);
  }
}

function loadSong(s, from) {
  const metre = s.metre ?? '4/4';
  editing = false;
  Object.assign(draft, { titol: s.titol, artista: s.artista ?? '', baix: s.baix ?? null, prog: s.prog, metre, tempo: s.tempo ?? 90, estil: STYLES[s.estil]?.metres.includes(metre) ? s.estil : mapStyle(s.estil, metre), font: from, ref: s.ref ?? s.id ?? null });
  renderSong();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let libEntries = [];
async function openLibrary(code, quiet = false) {
  const box = $('#lib-list');
  if (!code || !box) return;
  box.innerHTML = '<p class="muted small">Carregant…</p>';
  try {
    libEntries = await listLibrary(code);
    saveCode(code);
    box.innerHTML = libEntries.length ? `<ul class="songs">${libEntries.slice(0, 80).map((s) => `<li><button type="button" class="link" data-lib="${esc(s.id)}"><b>${esc(s.titol || s.nom)}</b><small>${esc(s.artista || '')}${(s.instruments ?? []).includes('baix') ? ' · 🎸 baix' : ''}</small></button></li>`).join('')}</ul>` : '<p class="muted small">La biblioteca és buida.</p>';
  } catch (e) {
    box.innerHTML = quiet ? '' : `<p class="err">${esc(errorText(e))}</p>`;
  }
}
async function loadFromLibrary(id) {
  const box = $('#lib-list');
  try {
    const entry = libEntries.find((x) => x.id === id);
    const s = songFromLibrary(await loadLibrarySong(savedCode(), id), entry);
    loadSong({ ...s, estil: s.estil ?? defaultStyle(s.metre), ref: id }, 'biblio');
  } catch (e) {
    box?.insertAdjacentHTML('afterbegin', `<p class="err">${esc(errorText(e))}</p>`);
  }
}

function songClick(b) {
  const c = b.dataset.c;
  if (c === 'worksong') {
    const song = { ...draft, titol: draft.titol || 'La meva cançó' };
    if (draft.font === 'manual') store.saveSong({ ...song, id: undefined });
    store.setWorkSong(song);
    renderSong(`Fet! Tot el full de ruta es treballa ara sobre «${song.titol}».`);
  } else if (c === 'edit') { editing = true; renderSong(); }
  else if (c === 'new') { editing = true; Object.assign(draft, { titol: '', artista: '', prog: '', baix: null, font: 'manual', metre: '4/4', tempo: 90, estil: 'pop' }); renderSong(); }
  else if (c === 'done') { editing = false; if (!draft.font || draft.font === 'treball') draft.font = 'manual'; renderSong(); }
  else if (c === 'cancel') { editing = false; renderSong(); }
  else if (b.dataset.tab) { songTab = b.dataset.tab; for (const t of document.querySelectorAll('.songs-panel .tab')) t.classList.toggle('on', t.dataset.tab === songTab); renderSongTab(); }
  else if (b.dataset.ksong) { const s = songIndex.get(b.dataset.ksong); if (s) loadSong(s, s.font); }
  else if (b.dataset.del) { store.deleteSong(b.dataset.del); renderSongTab(); }
  else if (b.dataset.lib) loadFromLibrary(b.dataset.lib);
}

// ---- Què sé fer ----------------------------------------------------------------------------------------------------

function renderSkills() {
  const i = inst();
  const v = $('#v-skills');
  const { levels, song } = summary(i.id);
  const unlocked = levels.filter((x) => x.unlocked);
  const nx = nextStep(i.id);
  v.innerHTML = `
    <div class="view-head"><button type="button" class="btn-back" data-go="home">← Inici</button>
      <div><small class="muted">${esc(i.nom)} · ${esc(store.currentName() ?? '')}</small><h2>Què sé fer</h2><p class="muted">El que has desbloquejat al joc i què vol dir quan toques amb la teva banda.</p></div>
      <button type="button" class="btn btn-ghost" data-c="print" style="margin-left:auto">🖨 Imprimeix</button></div>
    <div class="skills-top panel" style="--c:${i.color}">
      <div><small class="muted">Cançó</small><b>${esc(song?.titol ?? '—')}</b></div>
      ${i.id === 'guitarra' ? `<div><small class="muted">Acords</small><b>${esc(MODE_TEXT(store.chordMode()))}</b></div>` : ''}
      <div><small class="muted">Nivells desbloquejats</small><b>${unlocked.length} de 10</b></div>
      <div><small class="muted">Ara treballes</small><b>${nx ? `Nivell ${nx.level.n} · ${esc(nx.step.titol)}` : 'Tot fet!'}</b></div>
    </div>
    <div class="panel banda">
      <h3>🎸 A la banda ja pots…</h3>
      ${unlocked.length ? `<ul>${unlocked.map((x) => `<li><span class="pick-mini" style="--c:${i.color}">${x.level.n}</span>${esc(x.banda)}</li>`).join('')}</ul>` : '<p class="muted">Encara res: comença pel nivell 1 i, quan et surti un pas, marca «Em surt!».</p>'}
    </div>
    <div class="skills-grid">
      ${levels.map((x) => `
        <div class="skill ${x.done ? 'done' : x.unlocked ? 'on' : ''}" style="--c:${i.color}">
          <div class="skill-head"><span class="pick-badge">${x.level.n}</span><div><b>${esc(x.level.titol)}</b><small>${x.ok.length} de ${x.steps.length} passos${x.tempo ? ` · fins a ${x.tempo} bpm` : ''}</small></div><span class="skill-state">${x.done ? '✓' : x.unlocked ? '◐' : '🔒'}</span></div>
          ${x.ok.length ? `<ul class="skill-steps">${x.ok.map((p) => `<li>✓ ${esc(p.titol)}</li>`).join('')}${x.almost.map((p) => `<li class="almost">◐ ${esc(p.titol)}</li>`).join('')}</ul>` : x.almost.length ? `<ul class="skill-steps">${x.almost.map((p) => `<li class="almost">◐ ${esc(p.titol)}</li>`).join('')}</ul>` : ''}
          ${x.cards.length ? `<div class="skill-cards">${x.cards.map((id) => `<img src="${cardById(id)?.img}" alt="Carta ${esc(id)}" title="Carta ${esc(id)}">`).join('')}</div>` : ''}
          <p class="skill-banda">${esc(x.banda)}</p>
        </div>`).join('')}
    </div>`;
}

// ---- Navegació -------------------------------------------------------------------------------------------------

function needSong() {
  if (store.workSong()) return false;
  renderSong();
  show('song');
  return true;
}

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('button, a');
  if (!b) return;
  if (b.id === 'home-link') { ev.preventDefault(); renderHome(); show('home'); return; }
  if (b.id === 'player-chip') { store.setCurrent(null); renderHome(); show('home'); return; }
  if (b.id === 'settings-btn') { $('#set-thick').checked = store.settings().thickTop === true; $('#settings').showModal(); return; }
  if (b.dataset.inst && b.closest('#inst-switch, .inst-tiles')) {
    if (!store.currentName()) return;
    store.setInstrument(b.dataset.inst);
    applyAccent();
    const view = document.body.dataset.view;
    if (view === 'map') renderMap();
    else if (view === 'song') renderSong();
    else if (view === 'skills') renderSkills();
    else if (view === 'guide') renderGuide($('#v-guide'), inst().id, {});
    else if (view === 'home') renderHome();
    else { renderMap(); show('map'); }
    return;
  }
  if (b.dataset.player) { store.setCurrent(b.dataset.player); Object.assign(draft, { prog: '' }); updatedNote = ''; renderHome(); applyAccent(); refreshWorkSong(); return; }
  if (b.dataset.c === 'print') { window.print(); return; }
  const go = b.dataset.go;
  if (go === 'who') { store.setCurrent(null); renderHome(); applyAccent(); return; }
  if (go === 'home') { renderHome(); show('home'); return; }
  if (go === 'song') { editing = false; Object.assign(draft, { prog: '' }); renderSong(); show('song'); return; }
  if (go === 'map') { if (needSong()) return; renderMap(); show('map'); return; }
  if (go === 'skills') { renderSkills(); show('skills'); return; }
  if (go === 'guide') {
    show('guide');
    renderGuide($('#v-guide'), inst().id, { onDone: () => { const p = store.player(); if (p) { p.guideDone = true; store.save(); } if (store.workSong()) { renderMap(); show('map'); } else { renderSong(); show('song'); } } });
    return;
  }
  if (go === 'continue') {
    if (needSong()) return;
    const nx = nextStep(inst().id);
    if (nx) openStep(nx.step.id); else { renderMap(); show('map'); }
    return;
  }
  if (b.dataset.level && !b.closest('.session')) { if (needSong()) return; renderLevel(Number(b.dataset.level)); show('level'); return; }
  if (b.dataset.step) { openStep(b.dataset.step); return; }
  if (b.dataset.card && b.closest('#v-cards')) { openCard(b.dataset.card); return; }
  if (b.closest('#v-song') && (b.dataset.c || b.dataset.del || b.dataset.lib || b.dataset.tab || b.dataset.ksong)) songClick(b);
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

// ---- La cançó de treball s'actualitza sola si ha canviat al Llibre o a la biblioteca -------------------------------

async function refreshWorkSong() {
  const ws = store.workSong();
  if (!ws?.ref) return;
  let fresh = null;
  try {
    if (ws.font === 'llibre') fresh = (await songbook()).find((s) => s.id === ws.ref) ?? null;
    else if (ws.font === 'biblio' && savedCode()) {
      const s = songFromLibrary(await loadLibrarySong(savedCode(), ws.ref), { id: ws.ref });
      fresh = { ...s, estil: s.estil ?? ws.estil };
    }
  } catch { return; } // sense xarxa o la cançó ja no hi és: ens quedem amb la còpia
  if (!fresh) return;
  const changed = fresh.prog !== ws.prog || fresh.titol !== ws.titol || JSON.stringify(fresh.baix ?? null) !== JSON.stringify(ws.baix ?? null) || String(fresh.metre) !== String(ws.metre);
  if (!changed || store.workSong()?.ref !== ws.ref) return;
  store.setWorkSong({ ...ws, ...fresh, estil: STYLES[fresh.estil]?.metres.includes(fresh.metre) ? fresh.estil : ws.estil, font: ws.font, ref: ws.ref });
  updatedNote = `«${fresh.titol}» s'ha actualitzat amb els canvis ${ws.font === 'llibre' ? 'del Llibre de temes' : 'de la biblioteca compartida'}.`;
  if (document.body.dataset.view === 'home') renderHome();
}
let updatedNote = '';

renderHome();
show('home');
refreshWorkSong();
window.__rockinReady = true;
window.rockinGB = { store, openStep, LEVELS };
