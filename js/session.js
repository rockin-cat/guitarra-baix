// La pantalla de pràctica: escolta → la banda continua sense el teu instrument i l'animació et guia → com ha anat.
// També fa d'afinador (nivell 7), de compositor (nivell 9) i d'improvisació (nivell 10).

import * as player from './player.js';
import { createNeck, chordBox } from './neck.js';
import { createLane } from './lane.js';
import { INSTRUMENTS, guitarVoicing, scaleBox, bassRole } from './fretboard.js';
import { parseProgression, guessKey, pentatonic, mod, pcName, metre as metreOf, midiName, practicePart } from './theory.js';
import { stylesFor, defaultStyle, STYLES } from './band.js';
import { BINARI, TERNARI, MELODIC, cardById, cardMetre } from './data/cartes.js';
import { tone, audioContext } from './audio.js';
import { REPTES } from './levels.js';
import * as store from './store.js';

const $ = (sel, root = document) => root.querySelector(sel);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let current = null; // la sessió oberta

export function closeSession() {
  if (!current) return;
  player.stop();
  cancelAnimationFrame(current.raf);
  current.lane?.destroy();
  clearTimeout(current.tuneTimer);
  current = null;
}

/**
 * Obre un pas. `step` com a levels.js (o fet pel creador). ctx: { inst, onBack, onNext, backLabel, crumb }
 */
const CHORD_MODES = [
  ['p1', { type: 'power', parts: 1 }, 'Power chord · un dit (corda 6)'],
  ['p2', { type: 'power', parts: 2 }, 'Power chord · 1 i 5'],
  ['p3', { type: 'power', parts: 3 }, 'Power chord sencer (1, 5, 8)'],
  ...[1, 2, 3, 4, 5].map((n) => [`o${n}`, { type: 'obert', cordes: n }, `Acords oberts · ${n === 1 ? 'corda 1' : `cordes 1 a ${n}`}`]),
  ['o6', { type: 'obert', cordes: 6 }, 'Acords oberts · totes les cordes'],
  ['celleta', 'celleta', 'Tots amb celleta'],
];
const modeKey = (m) => (typeof m === 'string' ? m : m?.type === 'power' ? `p${m.parts}` : `o${m?.cordes ?? 6}`);

/** El pas tal com es toca: amb la cançó de treball i la manera de fer els acords de qui toca. */
function effectiveStep(base, instId, opts = {}) {
  const s = { ...base };
  if (instId === 'guitarra' && base.kind !== 'tune') s.voicing = base.chordMode ?? opts.chordMode ?? base.voicing ?? store.chordMode();
  const song = store.workSong();
  const kind = base.kind ?? 'play';
  const cardId = base.carta ?? base.part?.card;
  const cm = cardId ? cardMetre(cardById(cardId)) : null;
  const usable = song && base.canco !== false && !base.custom && kind !== 'tune' && (!cm || cm === song.metre);
  s.songNote = song && !usable && base.canco !== false && kind !== 'tune' && !base.custom ? (cm && cm !== song.metre ? `Aquesta carta és de ${cm}: es practica amb una roda pròpia.` : '') : '';
  if (usable) {
    // tot és acumulatiu sobre la mateixa roda: els recursos tècnics arriben a cada acord de la cançó,
    // i la melodia per cantar surt de les notes dels acords
    if (base.part?.type === 'riff') s.part = { type: 'techroot', tech: base.part.tech ?? 'h' };
    if (Array.isArray(base.voice)) s.voice = 'melody';
    // baix: la línia que el professorat ha escrit al Generador per a aquesta cançó
    const lines = song.baix ?? [];
    if (instId === 'baix' && lines.length && ['bass', 'arp'].includes(base.part?.type) && store.useGenBass()) {
      const li = Math.min(opts.lineIdx ?? 0, lines.length - 1);
      s.part = { type: 'linia', line: lines[li] };
      s.genLine = lines[li].nom;
      s.carta = null;
    }
    s.prog = opts.whole ? song.prog : practicePart(song.prog);
    s.metre = song.metre;
    s.estil = STYLES[song.estil]?.metres.includes(song.metre) ? song.estil : STYLES[base.estil]?.metres.includes(song.metre) ? base.estil : defaultStyle(song.metre);
    s.tempo = Math.min(base.tempo ?? 90, song.tempo ?? 90);
    s.usesSong = song.titol;
  }
  return s;
}

export function openSession(host, baseStep, ctx) {
  closeSession();
  const inst = INSTRUMENTS[ctx.inst];
  const step = effectiveStep(baseStep, ctx.inst);
  const S = store.settings();
  const kind = step.kind ?? 'play';
  const st = {
    step, baseStep, inst, kind, host, ctx, whole: false,
    tempo: step.tempo ?? 80,
    rounds: 0, // 0 = automàtic
    guide: S.guide ?? 0,
    metronome: !!S.metronome,
    plan: null, mode: 'idle', ranPlay: false, raf: 0,
    compose: kind === 'compose' ? (step.bars ? step.bars.map((b) => ({ ...b })) : null) : null,
  };
  current = st;
  document.body.style.setProperty('--accent', inst.color);
  document.body.style.setProperty('--accent-soft', inst.colorSoft);

  const levelText = step.nivell ? `Nivell ${step.nivell}` : step.custom ? 'La meva cançó' : '';
  host.innerHTML = '';
  const root = h(`
    <div class="session" data-kind="${kind}">
      <div class="view-head">
        <button type="button" class="btn-back" data-act="back">← ${esc(ctx.backLabel ?? 'Torna')}</button>
        <button type="button" class="btn btn-ghost btn-small help-btn" data-go="guide" title="Què vol dir cada cosa de la pantalla">👀 Com es llegeix?</button>
        <div class="sess-title">
          <small>${esc([inst.nom, levelText, ctx.crumb].filter(Boolean).join(' · '))}</small>
          <h2>${esc(step.titol)}</h2>
        </div>
      </div>
      <div class="sess-grid">
        <div class="stage">
          <div class="stage-top">
            <div class="mode-badge" data-el="badge">PREPARA'T</div>
            <div class="pulses" data-el="pulses"></div>
            <div class="bigcount" data-el="big"></div>
          </div>
          <div class="neck-host" data-el="neck"></div>
          <canvas class="lane" data-el="lane"></canvas>
        </div>
        <aside class="side">
          <div class="card-host" data-el="card"></div>
          <div class="explain">
            <p>${esc(step.text ?? '')}</p>
            ${step.com?.length ? `<ul>${step.com.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
          </div>
        </aside>
      </div>
      <div class="composer" data-el="composer" hidden></div>
      <div class="tuner" data-el="tuner" hidden></div>
      <div class="controls" data-el="controls">
        <div class="ctrl-main">
          <button type="button" class="btn btn-primary btn-big" data-act="full">▶ Escolta i toca</button>
          <button type="button" class="btn btn-ghost" data-act="listen">👂 Només escolta</button>
          <button type="button" class="btn btn-ghost" data-act="play">${inst.id === 'baix' ? '🎸' : '🎸'} Només toca</button>
          <button type="button" class="btn" data-act="stop" disabled>■ Atura</button>
        </div>
        <div class="ctrl-opts">
          <span class="tempo">Tempo <button type="button" class="icon-btn" data-act="slower" title="Més lent">−</button> <b data-el="tempo"></b> <button type="button" class="icon-btn" data-act="faster" title="Més ràpid">+</button></span>
          <label>Voltes <select data-el="rounds"><option value="0">auto</option><option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="-1">sense parar</option></select></label>
          <label class="toggle"><input type="checkbox" data-el="metro"> Metrònom</label>
          <label class="toggle" title="Mentre toques tu, sona fluixa la part que has de fer"><input type="checkbox" data-el="guide"> Guia sonora</label>
          <button type="button" class="btn btn-ghost btn-small" data-act="strings" hidden>🔍 Corda a corda</button>
        </div>
        <div class="ctrl-opts ctrl-song" data-el="songbar"></div>
      </div>
      <div class="assess" data-el="assess" hidden>
        <h3>Com t'ha anat?</h3>
        <div class="row">
          <button type="button" class="btn btn-ghost" data-rate="no">Encara no em surt</button>
          <button type="button" class="btn btn-ghost" data-rate="gairebe">Gairebé</button>
          <button type="button" class="btn btn-primary" data-rate="ok">Em surt!</button>
        </div>
        <p class="feedback" data-el="feedback"></p>
        <div class="row" data-el="after"></div>
      </div>
    </div>`);
  host.appendChild(root);
  st.root = root;
  st.el = (name) => $(`[data-el="${name}"]`, root);

  st.neck = createNeck(st.el('neck'), inst, { thickTop: S.thickTop === true });
  st.lane = createLane(st.el('lane'), { color: inst.color });
  st.el('tempo').textContent = st.tempo;
  st.el('metro').checked = st.metronome;
  st.el('guide').checked = st.guide > 0;

  if (kind === 'tune') return setupTuner(st);

  buildSong(st);
  if (kind === 'compose') setupComposer(st);
  if (kind === 'improv') {
    st.el('rounds').value = '-1';
    st.el('rounds').disabled = true;
    $('[data-act="listen"]', root).hidden = true;
    $('[data-act="full"]', root).textContent = '▶ Comença';
    $('[data-act="play"]', root).hidden = true;
  }
  if (inst.id === 'guitarra' && (st.step.part?.type === 'strum' || st.step.part?.type === 'rascat')) $('[data-act="strings"]', root).hidden = false;

  renderSongBar(st);
  root.addEventListener('click', (ev) => onClick(st, ev));
  root.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.el === 'cmode') {
      const m = CHORD_MODES.find(([k]) => k === t.value)?.[1];
      if (m) { store.setChordMode(m); rebuildStep(st); }
    } else if (t.dataset.el === 'whole') { st.whole = t.checked; rebuildStep(st); }
    else if (t.dataset.el === 'gline') {
      const v = Number(t.value);
      store.setUseGenBass(v >= 0);
      st.lineIdx = Math.max(0, v);
      rebuildStep(st);
    }
  });
  st.el('rounds').addEventListener('change', (e) => { st.rounds = Number(e.target.value); });
  st.el('metro').addEventListener('change', (e) => { st.metronome = e.target.checked; S.metronome = st.metronome; store.save(); player.setMetronome(st.metronome); });
  st.el('guide').addEventListener('change', (e) => { st.guide = e.target.checked ? 0.3 : 0; S.guide = st.guide; store.save(); player.setGuide(st.guide); });

  renderPulses(st);
  showIdle(st);
  st.raf = requestAnimationFrame(() => frame(st));
  return st;
}

function renderSongBar(st) {
  const bar = st.el('songbar');
  const b = st.baseStep;
  const parts = [];
  if (st.inst.id === 'guitarra' && !b.chordMode && st.kind !== 'tune') {
    const cur = modeKey(store.chordMode());
    parts.push(`<label>Acords <select data-el="cmode">${CHORD_MODES.map(([k, , t]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`);
  }
  const lines = store.workSong()?.baix ?? [];
  if (st.inst.id === 'baix' && st.step.usesSong && lines.length && ['bass', 'arp'].includes(b.part?.type)) {
    const on = store.useGenBass();
    parts.push(`<label>Línia de baix <select data-el="gline"><option value="-1"${on ? '' : ' selected'}>la del nivell</option>${lines.map((l, i) => `<option value="${i}"${on && (st.lineIdx ?? 0) === i ? ' selected' : ''}>del Generador: ${esc(l.nom)}</option>`).join('')}</select></label>`);
  }
  if (st.step.usesSong) {
    parts.push(`<span class="song-chip">🎵 ${esc(st.step.usesSong)}</span><label class="toggle"><input type="checkbox" data-el="whole"${st.whole ? ' checked' : ''}> Cançó sencera</label>`);
  } else if (st.step.songNote) parts.push(`<span class="muted small">${esc(st.step.songNote)}</span>`);
  else if (!store.workSong() && b.canco !== false && !b.custom && st.kind !== 'tune' && st.ctx.onChooseSong) {
    parts.push('<button type="button" class="btn btn-ghost btn-small" data-act="choose-song">🎵 Tria la cançó amb què treballes</button>');
  }
  bar.innerHTML = parts.join('');
  bar.hidden = !parts.length;
}

function rebuildStep(st) {
  player.stop();
  st.step = effectiveStep(st.baseStep, st.inst.id, { lineIdx: st.lineIdx, whole: st.whole });
  setTempo(st, st.step.tempo ?? st.tempo);
  buildSong(st);
  renderPulses(st);
  setButtons(st, false);
  showIdle(st);
}

// ---- La cançó del pas --------------------------------------------------------------------------------------

function buildSong(st) {
  const { step, inst } = st;
  const { bars } = parseProgression(step.prog || 'C');
  st.bars = bars.length ? bars : parseProgression('C').bars;
  st.key = guessKey(st.bars);
  let part = step.part ? { ...step.part } : null;
  if (part && step.voicing) part.voicing = step.voicing;
  if (st.kind === 'compose') {
    st.compose ??= randomCompose(st, st.bars.length);
    part = { type: 'compose', bars: st.compose, voicing: step.voicing };
  }
  const extra = st.kind === 'improv' && step.mode === 'qa' ? (k, bar, M) => (k % 4 < 2 ? { part: questionBar(st, bar, M, k) } : { part: [] }) : null;
  st.song = player.makeSong({ inst: inst.id, bars: st.bars, metre: step.metre ?? '4/4', tempo: st.tempo, estil: step.estil ?? defaultStyle(step.metre), part: st.kind === 'improv' ? null : part, voice: step.voice, extra });
  st.M = st.song.M;
}

/** Una frase-pregunta de dos compassos amb notes de la pentatònica. */
function questionBar(st, bar, M, k) {
  const inst = st.inst;
  const pcs = pentatonic(st.key);
  const box = scaleBox(inst, pcs, st.key.minor ? st.key.root : mod(st.key.root - 3, 12)).sort((a, b) => a.midi - b.midi);
  const rnd = mulberry(k * 7 + 3);
  const rhythms = M.beats === 4 ? ['mb2', 'mb17', 'mb18', 'mb16', 'mb11', 'mb19'] : ['mt1', 'mt18', 'mt21'];
  const card = cardById(rhythms[Math.floor(rnd() * rhythms.length)]);
  const on = card ? card.notes.map(([a, d]) => [a, d]) : [[0, 1], [1, 1], [2, 1]];
  let idx = Math.floor(box.length / 3);
  const out = [];
  on.forEach(([a, d], j) => {
    if (k % 4 === 1 && j === on.length - 1) idx = box.findIndex((p) => p.root) >= 0 ? box.findIndex((p) => p.root) : idx;
    else idx = Math.max(0, Math.min(box.length - 1, idx + Math.floor(rnd() * 5) - 2));
    const p = box[idx];
    out.push({ beat: a, dur: d, kind: 'note', notes: [inst.tuning[p.s] + p.f], pos: [{ s: p.s, f: p.f }], label: String(p.f) });
  });
  return out;
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function rhythmDeck(M) {
  if (M.id === '4/4') return BINARI;
  return TERNARI.filter((c) => c.metre === M.id);
}

function randomCompose(st, n) {
  const M = metreOf(st.step.metre ?? '4/4');
  const deck = rhythmDeck(M).filter((c) => c.notes.length >= 2);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const a = { rhythm: pick(deck).id, melodic: pick(MELODIC).id };
  const b = { rhythm: pick(deck).id, melodic: pick(MELODIC).id };
  // una idea repetida i una resposta: A A B A'
  return Array.from({ length: Math.max(1, Math.min(8, n)) }, (_, i) => (i % 4 === 2 ? { ...b } : { ...a }));
}

// ---- Plans --------------------------------------------------------------------------------------------------

function roundsFor(st) {
  if (st.rounds === -1) return Infinity;
  if (st.rounds > 0) return st.rounds;
  return Math.max(1, Math.ceil(8 / st.bars.length));
}

function makePlan(st, what) {
  const L = st.bars.length;
  // cançons llargues: la demostració és la primera part (o 8 compassos) i després es toca des del principi
  let demoBars = L >= 4 ? L : L * Math.ceil(4 / L);
  if (L > 8) {
    const nextPart = st.bars.findIndex((b, j) => j > 0 && b.part);
    demoBars = nextPart > 0 && nextPart <= 12 ? nextPart : 8;
  }
  const playOffset = demoBars % L === 0 ? 0 : demoBars;
  const playBars = roundsFor(st) * L;
  if (st.kind === 'improv') {
    const qa = st.step.mode === 'qa';
    return (i) => (i === 0 ? { mode: 'count' } : { mode: qa ? ((i - 1) % 4 < 2 ? 'question' : 'answer') : 'play', k: i - 1 });
  }
  const listenBars = Math.max(demoBars, L);
  if (what === 'listen') return (i) => (i === 0 ? { mode: 'count' } : i <= listenBars ? { mode: 'demo', k: i - 1 } : null);
  if (what === 'play') return (i) => (i === 0 ? { mode: 'count' } : i <= playBars ? { mode: 'play', k: i - 1 } : null);
  // escolta i toca: compte, demostració, i la banda continua (l'últim compàs de l'exemple ja fa de compte)
  return (i) => {
    if (i === 0) return { mode: 'count' };
    if (i <= demoBars) return { mode: 'demo', k: i - 1 };
    if (i <= demoBars + playBars) return { mode: 'play', k: i - 1 - playOffset };
    return null;
  };
}

async function go(st, what) {
  hideAssess(st);
  setButtons(st, true);
  st.el('badge').textContent = 'Carregant sons…';
  try {
    await player.prepare(st.inst.id);
  } catch { /* sense so, l'animació funciona igual */ }
  if (current !== st) return;
  st.song.tempo = st.tempo;
  st.plan = makePlan(st, what);
  st.what = what;
  st.ranPlay = false;
  st.reptes = shuffle([...REPTES]);
  player.start(st.song, st.plan, {
    metronome: st.metronome,
    guide: st.guide,
    voiceGuide: !!st.step.voice && st.guide > 0,
    onEnd: () => finished(st, true),
  });
}

function stopRun(st) {
  player.stop();
  finished(st, false);
}

function finished(st, natural) {
  if (current !== st) return;
  setButtons(st, false);
  showIdle(st);
  if (st.kind !== 'improv' && (st.what === 'full' || st.what === 'play') && (natural || st.ranPlay)) showAssess(st);
  if (st.kind === 'improv' && st.ranPlay) showAssess(st);
}

function setButtons(st, playing) {
  for (const b of st.root.querySelectorAll('[data-act="full"],[data-act="listen"],[data-act="play"],[data-act="strings"],[data-act="slower"],[data-act="faster"]')) b.disabled = playing;
  $('[data-act="stop"]', st.root).disabled = !playing;
  st.root.classList.toggle('playing', playing);
  for (const x of st.root.querySelectorAll('.composer select, .composer button')) x.disabled = playing;
}

// ---- Clics -------------------------------------------------------------------------------------------------

function onClick(st, ev) {
  const b = ev.target.closest('[data-act],[data-rate]');
  if (!b) return;
  const act = b.dataset.act;
  if (b.dataset.rate) return rate(st, b.dataset.rate);
  if (act === 'back') { closeSession(); st.ctx.onBack?.(); return; }
  if (act === 'full' || act === 'listen' || act === 'play') return go(st, act);
  if (act === 'stop') return stopRun(st);
  if (act === 'slower' || act === 'faster') return setTempo(st, st.tempo + (act === 'faster' ? 5 : -5));
  if (act === 'strings') return stringByString(st);
  if (act === 'next') { closeSession(); st.ctx.onNext?.(); return; }
  if (act === 'choose-song') { closeSession(); st.ctx.onChooseSong?.(); return; }
  if (act === 'up10') { setTempo(st, st.tempo + 10); hideAssess(st); return go(st, 'play'); }
  if (act === 'again') { hideAssess(st); return go(st, 'full'); }
  if (act === 'again-play') { hideAssess(st); return go(st, 'play'); }
}

function setTempo(st, t) {
  st.tempo = Math.max(40, Math.min(200, t));
  st.el('tempo').textContent = st.tempo;
}

function rate(st, r) {
  const id = st.step.id;
  if (id) store.markStep(id, r, st.tempo);
  // el que surt al camí de power chords o d'acords oberts és com es toquen els acords a la resta de nivells
  if (r === 'ok' && st.inst.id === 'guitarra' && st.baseStep.chordMode && typeof st.baseStep.chordMode === 'object' && st.baseStep.nivell === 1) store.setChordMode(st.baseStep.chordMode);
  const fb = st.el('feedback');
  const after = st.el('after');
  after.innerHTML = '';
  for (const x of st.root.querySelectorAll('[data-rate]')) x.classList.toggle('chosen', x.dataset.rate === r);
  if (r === 'no') {
    const slower = Math.max(40, st.tempo - 10);
    setTempo(st, slower);
    if (!st.guide) { st.guide = 0.3; st.el('guide').checked = true; }
    fb.textContent = `Cap problema: és qüestió de repetir. Baixem el tempo a ${slower} i encenem la guia sonora (sentiràs fluixa la teva part mentre toques).`;
    after.append(h('<button type="button" class="btn btn-primary" data-act="again">♪ T\'ho ensenyo i tornem-hi</button>'));
  } else if (r === 'gairebe') {
    fb.textContent = 'Ja hi ets a prop. Una altra volta al mateix tempo; si vols, apaga la guia sonora.';
    after.append(h('<button type="button" class="btn btn-primary" data-act="again-play">▶ Torna-hi</button>'), h('<button type="button" class="btn btn-ghost" data-act="again">👂 Escolta-ho un altre cop</button>'));
  } else {
    const orig = st.step.tempo ?? st.tempo;
    fb.textContent = st.tempo < orig ? `Molt bé! Ara prova d'acostar-te al tempo original (${orig}).` : 'Molt bé! Pots pujar el tempo o passar al pas següent.';
    after.append(h('<button type="button" class="btn btn-ghost" data-act="up10">⏩ Més ràpid (+10)</button>'));
    if (st.ctx.onNext) after.append(h('<button type="button" class="btn btn-primary" data-act="next">Pas següent →</button>'));
  }
  st.ctx.onRated?.();
}

function showAssess(st) {
  const a = st.el('assess');
  a.hidden = false;
  st.el('feedback').textContent = st.step.id ? 'Tu saps millor que ningú com ha sonat. Marca-ho i el joc et proposa què fer.' : 'Marca com ha anat i el joc et proposa què fer.';
  st.el('after').innerHTML = '';
  for (const x of st.root.querySelectorAll('[data-rate]')) x.classList.remove('chosen');
  a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAssess(st) { st.el('assess').hidden = true; }

// ---- Cada fotograma ----------------------------------------------------------------------------------------

function renderPulses(st) {
  const M = st.M ?? metreOf('4/4');
  st.el('pulses').innerHTML = Array.from({ length: M.pulses }, (_, i) => `<span>${i + 1}</span>`).join('');
}

function eventsAround(st, pos) {
  // esdeveniment actual i següent, mirant també el compàs anterior i el següent
  const bar = pos.bar;
  const list = [];
  const add = (i) => {
    if (i < 0) return;
    const b = pos.bars[i];
    let content = b?.content;
    let seg = b?.seg;
    if (!b) { seg = st.plan?.(i); content = seg && seg.mode !== 'count' ? st.song.content(seg.k) : null; }
    if (!content) return;
    for (const e of content.part) list.push({ ...e, abs: i * st.M.beats + e.beat, id: `${i}:${e.beat}`, mode: seg?.mode });
  };
  add(pos.i - 1); add(pos.i); add(pos.i + 1); add(pos.i + 2);
  let cur = null;
  let next = null;
  for (const e of list) {
    if (e.abs <= pos.abs + 0.02) cur = e;
    else if (!next) next = e;
  }
  void bar;
  return { cur, next, list };
}

function frame(st) {
  if (current !== st) return;
  st.raf = requestAnimationFrame(() => frame(st));
  if (st.kind === 'tune') return;
  const pos = player.position();
  if (!pos || pos.i < 0) { if (pos) drawIdleLane(st, pos); return; }
  const seg = pos.bar?.seg ?? st.plan?.(pos.i);
  const mode = seg?.mode ?? 'count';
  if (mode === 'play' || mode === 'answer') st.ranPlay = true;
  const M = st.M;
  const pulse = Math.floor(pos.beat / M.pulseLen);

  // marcador superior
  const badge = st.el('badge');
  const big = st.el('big');
  const nextSeg = st.plan?.(pos.i + 1);
  let label = { count: 'COMPTE', demo: 'ESCOLTA', play: 'ARA TU', question: 'ESCOLTA LA PREGUNTA', answer: 'RESPON TU' }[mode] ?? '';
  let bigText = '';
  if (mode === 'count') bigText = String(pulse + 1);
  if (mode === 'demo' && nextSeg?.mode === 'play') { label = 'ARA TU…'; bigText = String(M.pulses - pulse); }
  if (mode === 'demo' && !nextSeg) label = 'ESCOLTA (últim compàs)';
  if (st.kind === 'improv' && st.step.mode === 'free' && seg?.k != null) {
    big.classList.add('repte');
    bigText = st.reptes[Math.floor(seg.k / 4) % st.reptes.length];
  } else big.classList.remove('repte');
  badge.textContent = label;
  badge.dataset.mode = mode;
  if (big.textContent !== bigText) big.textContent = bigText;
  const pulses = st.el('pulses').children;
  for (let p = 0; p < pulses.length; p++) pulses[p].classList.toggle('on', p === pulse);

  // mànec
  const content = seg && seg.mode !== 'count' ? st.song.content(seg.k) : null;
  const { cur, next } = eventsAround(st, pos);
  const chordNow = content ? chordAtBeat(content.bar, pos.beat, M) : firstChord(st);
  if (st.kind === 'improv' && !(mode === 'question' && cur && cur.abs >= pos.i * M.beats)) {
    st.neck.show(improvView(st, chordNow));
  } else if (cur || next) {
    const e = cur ?? next;
    if (e.kind === 'strum') {
      const change = next && next.chord !== e.chord ? next.abs - pos.abs : Infinity;
      st.neck.show({ mode: 'chord', cur: e, next, showNext: change <= Math.max(1, M.pulseLen), label: e.chord });
    } else {
      st.neck.show({ mode: 'notes', cur: e, next, showNext: true, label: e.chord ?? '' });
      if (cur?.tech) st.neck.techPhase(cur, (pos.abs - cur.abs) / cur.dur);
    }
  }
  // la púa
  if (cur) {
    const spb = pos.spq;
    const gap = next ? (next.abs - cur.abs) * spb : 0.3;
    const lead = 0.04;
    const dur = Math.max(0.05, Math.min(0.16, gap * 0.7));
    const p = ((pos.abs - cur.abs) * spb + lead) / dur;
    if (cur.kind === 'strum') {
      const strings = cur.voicing ? cur.voicing.midi.map((m, s) => (m != null ? s : -1)).filter((s) => s >= 0) : [];
      st.neck.animate({ pick: { id: cur.id, p, dir: cur.dir, ghost: cur.ghost, strings: cur.dir === 'U' ? strings.slice(-4) : strings } });
    } else {
      if (cur.legato) {
        // hammer-on / pull-off: la púa no es mou, però la corda torna a sonar
        if (st.lastLegato !== cur.id && p >= 0) { st.lastLegato = cur.id; st.neck.shake(cur.pos[0].s); }
        st.neck.animate({});
      } else st.neck.animate({ pick: { id: cur.id, p, s: cur.pos[0].s, strings: [cur.pos[0].s] } });
    }
  } else st.neck.animate({});
  // carta i diagrames
  updateSide(st, content, pos, cur ?? next);
  // la pista també ensenya els compassos que encara no s'han programat
  const bars = pos.bars.slice();
  for (let j = Math.max(0, pos.i); j <= pos.i + 3; j++) {
    if (bars[j]) continue;
    const sg = st.plan?.(j);
    if (sg) bars[j] = { seg: sg, content: sg.mode === 'count' ? null : st.song.content(sg.k) };
  }
  st.lane.draw({ ...pos, bars }, { voice: !!st.step.voice });
}

function chordAtBeat(bar, beat, M) {
  const x = beat / M.beats;
  return (bar.find((s) => x >= s.start - 1e-6 && x < s.start + s.len - 1e-6) ?? bar.at(-1)).chord;
}
const firstChord = (st) => st.bars[0][0].chord;

function improvView(st, chord) {
  const inst = st.inst;
  const minorRoot = st.key.minor ? st.key.root : mod(st.key.root - 3, 12);
  const box = scaleBox(inst, pentatonic(st.key), minorRoot);
  const roles = new Map(chord.pcs.map((pc, i) => [pc, ['1', '3', '5', '7'][i] ?? '']));
  let ctx;
  if (st.step.mode === 'chord') {
    // les notes de l'acord a la mateixa zona del mànec
    const lo = Math.max(0, Math.min(...box.map((p) => p.f)) - 1);
    const hi = lo + 5;
    ctx = [];
    inst.tuning.forEach((open, s) => { for (let f = lo; f <= hi; f++) { const pc = mod(open + f, 12); if (roles.has(pc)) ctx.push({ s, f, label: roles.get(pc), cls: roles.get(pc) === '1' ? 'active' : 'tone' }); } });
  } else {
    ctx = box.map((p) => {
      const pc = mod(p.midi, 12);
      const r = roles.get(pc);
      return { s: p.s, f: p.f, label: r ?? '', cls: r === '1' ? 'active' : r ? 'tone' : 'faint' };
    });
  }
  return { mode: 'scale', ctx, ctxKey: `${chord.symbol}:${st.step.mode}`, label: `${chord.symbol} · ${st.step.mode === 'chord' ? 'notes de l\'acord' : `pentatònica de ${pcName(st.key.root)}${st.key.minor ? ' menor' : ' major'}`}` };
}

function updateSide(st, content, pos, ev) {
  const host = st.el('card');
  const M = st.M;
  const step = st.step;
  let key;
  let cards = [];
  if (st.kind === 'compose' && content) {
    const b = st.compose[(pos.bar?.seg?.k ?? 0) % st.compose.length];
    cards = [b.rhythm, b.melodic];
  } else if (step.carta) cards = [step.carta];
  const showBoxes = st.inst.id === 'guitarra' && ev?.voicing && st.kind !== 'improv';
  key = JSON.stringify([cards, showBoxes ? ev.chord : null, step.genLine]);
  if (host.dataset.key !== key) {
    host.dataset.key = key;
    host.innerHTML = '';
    if (step.genLine) host.append(h(`<div class="genline">🎸 Línia de baix del Generador<b>${esc(step.genLine)}</b><small>La que ha escrit el professorat per a aquesta cançó. Els números del mànec són els trasts.</small></div>`));
    for (const id of cards) {
      const c = cardById(id);
      if (!c) continue;
      host.append(h(`<div class="rcard"><img src="${c.img}" alt="Carta ${esc(id)}"><i class="sweep"></i></div>`));
    }
    if (showBoxes) {
      const wrap = h('<div class="boxes"></div>');
      wrap.append(chordBox(ev.voicing, { title: ev.chord, color: st.inst.color }));
      host.append(wrap);
    }
  }
  const x = content ? 7 + 86 * (pos.beat / M.beats) : -10;
  for (const s of host.querySelectorAll('.sweep')) s.style.left = `${x}%`;
}

function showIdle(st) {
  st.el('badge').textContent = 'PREPARA\'T';
  st.el('badge').dataset.mode = 'idle';
  st.el('big').textContent = '';
  st.el('big').classList.remove('repte');
  for (const p of st.el('pulses').children) p.classList.remove('on');
  if (st.kind === 'tune') return;
  // ensenya com comença
  const c0 = st.song.content(0);
  const e = c0.part[0];
  if (st.kind === 'improv') st.neck.show(improvView(st, firstChord(st)));
  else if (e?.kind === 'strum') st.neck.show({ mode: 'chord', cur: { ...e, id: 'idle' }, label: `Comença amb: ${e.chord}` });
  else if (e) st.neck.show({ mode: 'notes', cur: { ...e, id: 'idle' }, label: `Primera nota: ${e.chord ?? ''}` });
  updateSide(st, null, { beat: 0 }, e);
  drawIdleLane(st);
}

function drawIdleLane(st, pos) {
  // la pista quieta, ensenyant els dos primers compassos
  const plan = (i) => (i === 0 ? { mode: 'count' } : { mode: 'demo', k: i - 1 });
  const bars = [];
  for (let i = 0; i < 4; i++) { const seg = plan(i); bars[i] = { seg, content: seg.mode === 'count' ? null : st.song.content(seg.k) }; }
  st.lane.draw({ i: pos?.i ?? 0, abs: pos ? pos.abs : 0.6 * st.M.beats, beat: 0, bars, song: st.song }, { voice: !!st.step.voice });
}

// ---- Corda a corda (comprovar un acord) -----------------------------------------------------------------

async function stringByString(st) {
  await player.prepare(st.inst.id);
  const c0 = st.song.content(0);
  const chords = [];
  for (const e of c0.part) if (e.voicing && !chords.find((x) => x.chord === e.chord)) chords.push(e);
  for (let k = 1; k < st.bars.length; k++) for (const e of st.song.content(k).part) if (e.voicing && !chords.find((x) => x.chord === e.chord)) chords.push(e);
  const ctx = audioContext();
  let t = ctx.currentTime + 0.1;
  setButtons(st, true);
  const timers = [];
  for (const e of chords) {
    const v = e.voicing;
    timers.push([t, () => st.neck.show({ mode: 'chord', cur: { ...e, id: `cc${e.chord}` }, label: `${e.chord} · corda a corda` })]);
    v.frets.forEach((f, s) => {
      if (f < 0 || v.midi[s] == null) return;
      const at = t;
      tone(st.inst.sound, v.midi[s], at, 0.9, { gain: 0.5, dest: 'me' });
      timers.push([at, () => st.neck.shake(s)]);
      t += 0.55;
    });
    // i tot l'acord
    v.midi.filter((m) => m != null).forEach((m, j) => tone(st.inst.sound, m, t + j * 0.012, 1.2, { gain: 0.32, dest: 'me' }));
    t += 1.6;
  }
  const start = ctx.currentTime;
  const t0 = performance.now();
  for (const [at, fn] of timers) setTimeout(() => { if (current === st) fn(); }, (at - start) * 1000);
  setTimeout(() => { if (current === st) { setButtons(st, false); showIdle(st); } }, (t - start) * 1000 + 100);
  void t0;
}

// ---- Compositor (nivell 9) -----------------------------------------------------------------------------------

function setupComposer(st) {
  const box = st.el('composer');
  box.hidden = false;
  const M = st.M;
  const deck = rhythmDeck(M);
  const render = () => {
    box.innerHTML = `<div class="composer-head"><h3>La teva composició</h3>
      <button type="button" class="btn btn-ghost btn-small" data-c="random">🎲 Sorprèn-me</button>
      <button type="button" class="btn btn-ghost btn-small" data-c="save">💾 Desa-la a les meves cançons</button></div>
      <div class="composer-bars">${st.compose.map((b, i) => `
        <div class="cbar">
          <div class="cbar-chord">${esc(st.bars[i % st.bars.length].map((s) => s.chord.symbol).join(' '))}</div>
          <button type="button" class="cpick" data-c="rhythm" data-i="${i}" title="Canvia la carta rítmica"><img src="${cardById(b.rhythm)?.img}" alt=""><small>Ritme</small></button>
          <button type="button" class="cpick" data-c="melodic" data-i="${i}" title="Canvia la carta melòdica"><img src="${cardById(b.melodic)?.img}" alt=""><small>Melodia</small></button>
        </div>`).join('')}</div>
      <p class="muted small">Clica una carta per canviar-la. La carta rítmica diu quan toques; la melòdica, si puja o baixa per les notes de l'acord.</p>`;
  };
  render();
  box.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-c]');
    if (!b || st.root.classList.contains('playing')) return;
    const c = b.dataset.c;
    if (c === 'random') { st.compose = randomCompose(st, st.compose.length); rebuild(); return; }
    if (c === 'save') {
      store.saveSong({ titol: `${st.step.titol} (${new Date().toLocaleDateString('ca')})`, prog: st.step.prog, metre: M.id, tempo: st.tempo, estil: st.step.estil, nivell: 9, compose: st.compose, inst: st.inst.id });
      b.textContent = '✓ Desada';
      return;
    }
    const i = Number(b.dataset.i);
    const list = c === 'rhythm' ? deck : MELODIC;
    openPicker(list, st.compose[i][c], (id) => { st.compose[i][c] = id; rebuild(); });
  });
  function rebuild() {
    buildSong(st);
    render();
    showIdle(st);
  }
}

function openPicker(list, selected, onPick) {
  const dlg = h(`<dialog class="picker"><form method="dialog"><div class="picker-head"><h3>Tria una carta</h3><button class="btn btn-ghost btn-small" value="x">Tanca</button></div>
    <div class="picker-grid">${list.map((c) => `<button type="button" class="pcard${c.id === selected ? ' on' : ''}" data-id="${c.id}"><img src="${c.img}" alt="${c.id}" loading="lazy"></button>`).join('')}</div></form></dialog>`);
  document.body.append(dlg);
  dlg.addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) { onPick(b.dataset.id); dlg.close(); } });
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
}
export { openPicker };

// ---- Afinador (nivell 7) ---------------------------------------------------------------------------------------

function setupTuner(st) {
  const { inst, step } = st;
  st.el('controls').hidden = true;
  st.el('lane').hidden = true;
  st.el('card').innerHTML = '';
  const box = st.el('tuner');
  box.hidden = false;
  const n = inst.tuning.length;
  const strings = inst.tuning.map((m, s) => ({ s, m, num: n - s, name: inst.stringNames[s] }));
  let html = '';
  if (step.mode === 'strings') {
    html = `<p class="muted">Clica una corda: la nota sona fins que en cliquis una altra o premis Atura.</p><div class="tune-row">${strings.map((x) => `<button type="button" class="tune-btn" data-t="str" data-s="${x.s}"><b>${x.num}</b><span>${x.name}</span><small>${midiName(x.m)}</small></button>`).join('')}</div>`;
  } else if (step.mode === 'relative') {
    const pairs = [];
    for (let s = 0; s < n - 1; s++) { const f = inst.tuning[s + 1] - inst.tuning[s]; pairs.push({ s, f }); }
    html = `<p class="muted">Primer sona la corda més gruixuda al trast marcat, després la següent (més prima) a l'aire. Han de sonar igual.</p><div class="tune-row">${pairs.map((p) => `<button type="button" class="tune-btn wide" data-t="rel" data-s="${p.s}" data-f="${p.f}"><b>${n - p.s} → ${n - p.s - 1}</b><small>${inst.stringNames[p.s]} al trast ${p.f} = ${inst.stringNames[p.s + 1]} a l'aire</small></button>`).join('')}</div>`;
  } else {
    html = `<p class="muted">El Mi major, corda a corda i després sencer. Toca\'l alhora i compara.</p><div class="tune-row"><button type="button" class="tune-btn wide" data-t="chk"><b>▶ Mi major</b><small>corda a corda</small></button></div>`;
  }
  box.innerHTML = `${html}<div class="row"><button type="button" class="btn" data-t="stop">■ Atura</button></div>`;
  const stopTune = () => { clearTimeout(st.tuneTimer); st.tuneTimer = null; player.stop(); st.neck.clear(); for (const b of box.querySelectorAll('.tune-btn')) b.classList.remove('on'); };
  box.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-t]');
    if (!b) return;
    stopTune();
    if (b.dataset.t === 'stop') return;
    await player.prepare(inst.id);
    b.classList.add('on');
    const ctx = audioContext();
    if (b.dataset.t === 'str') {
      const s = Number(b.dataset.s);
      const loop = () => {
        tone(inst.sound, inst.tuning[s], ctx.currentTime + 0.02, 2.2, { gain: 0.6, dest: 'me' });
        st.neck.highlightString(s, `Corda ${n - s} · ${inst.stringNames[s]} (${midiName(inst.tuning[s])})`);
        st.neck.shake(s);
        st.tuneTimer = setTimeout(loop, 2400);
      };
      loop();
    } else if (b.dataset.t === 'rel') {
      const s = Number(b.dataset.s);
      const f = Number(b.dataset.f);
      let k = 0;
      const loop = () => {
        const lower = k % 2 === 0;
        const ss = lower ? s : s + 1;
        tone(inst.sound, inst.tuning[s] + f, ctx.currentTime + 0.02, 1.3, { gain: 0.6, dest: 'me' });
        st.neck.dotsFor(lower ? [{ s, f, label: f }] : [{ s: s + 1, f: 0 }]);
        st.neck.shake(ss);
        k++;
        if (k < 8) st.tuneTimer = setTimeout(loop, 1500);
        else b.classList.remove('on');
      };
      loop();
    } else {
      const e = guitarVoicing({ symbol: 'E', root: 4, q: '', intervals: [0, 4, 7], pcs: [4, 8, 11], third: 4 }, 'obert');
      st.neck.show({ mode: 'chord', cur: { voicing: e, chord: 'E', id: 'chk' }, label: 'Mi major' });
      let t = ctx.currentTime + 0.1;
      e.frets.forEach((fr, s) => { tone(inst.sound, e.midi[s], t, 1, { gain: 0.5, dest: 'me' }); const d = (t - ctx.currentTime) * 1000; setTimeout(() => current === st && st.neck.shake(s), d); t += 0.7; });
      e.midi.forEach((m, j) => tone(inst.sound, m, t + j * 0.012, 2, { gain: 0.3, dest: 'me' }));
      st.tuneTimer = setTimeout(() => b.classList.remove('on'), (t - ctx.currentTime + 2) * 1000);
    }
  });
  const tunedRow = h(`<div class="assess"><h3>Ja ho tens?</h3><div class="row"><button type="button" class="btn btn-primary" data-rate2="ok">Ja està afinada</button>${st.ctx.onNext ? '<button type="button" class="btn btn-ghost" data-rate2="next">Pas següent →</button>' : ''}</div></div>`);
  box.append(tunedRow);
  tunedRow.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rate2]');
    if (!b) return;
    if (b.dataset.rate2 === 'ok') { store.markStep(step.id, 'ok', 0); b.textContent = '✓ Marcat'; st.ctx.onRated?.(); }
    else { stopTune(); closeSession(); st.ctx.onNext?.(); }
  });
  st.root.addEventListener('click', (ev) => { const b = ev.target.closest('[data-act="back"]'); if (b) { stopTune(); closeSession(); st.ctx.onBack?.(); } });
  st.neck.clear();
  st.el('badge').textContent = 'AFINA';
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export { STYLES, stylesFor, bassRole };
