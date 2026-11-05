// El rellotge: programa compàs a compàs la banda, la teva part (a la demostració)
// i el metrònom, i diu a l'animació on som.

import { audioContext, resumeAudio, loadSet, setsReady, drum, click, tone, stopAll, busGain } from './audio.js';
import { bandBar, stylesFor, clicksBar, BAND_SETS, finalHit, FILLS, bassRoot } from './band.js';
import { partBar, voiceBar } from './parts.js';
import { INSTRUMENTS } from './fretboard.js';
import { metre, guessKey, parseChord, pcName, mod } from './theory.js';
import { settings } from './store.js';

/**
 * Una cançó per tocar.
 *  { inst, bars (de parseProgression), metre, tempo, estil, part (spec), voice, extra(k) }
 * `content(k)` torna el compàs k de la progressió (amb repetició) ja calculat.
 */
/**
 * La base que va canviant (perquè la pràctica no sigui sempre igual):
 *  volta 1 només bateria i baix, volta 2 s'hi afegeix el teclat, volta 3 tota la banda;
 *  al final de cada volta la bateria fa un redoble; a partir de la volta 5 l'estil canvia cada dues voltes.
 * Amb `o.dynamic === false` la base és sempre la mateixa.
 */
function dynamicBand(o, k, bar, M, without) {
  const L = Math.max(1, o.bars.length);
  const round = Math.floor(Math.max(0, k) / L);
  const inBar = ((k % L) + L) % L;
  let style = o.estil;
  if (o.dynamic !== false && round >= 4 && style !== 'metronom') {
    const pool = stylesFor(M.id).map((s) => s.id).filter((id) => id !== 'metronom' && id !== 'balada68' && id !== 'rock68' || M.id.endsWith('/8'));
    if (pool.length > 1) { const i = pool.indexOf(style); style = pool[(Math.max(0, i) + Math.floor((round - 2) / 2)) % pool.length]; }
  }
  let out = bandBar(style, bar, M, without);
  if (style === 'metronom') return out;
  const B = M.beats;
  // charles amb accents (fort al temps, fluix a contratemps)
  out = out.map((e) => (e.inst === 'drum' && e.piece === 'hh' ? { ...e, vel: (e.vel ?? 1) * (Math.abs(e.beat % M.pulseLen) < 1e-6 ? 1 : 0.7) } : e));
  // el baix s'acosta a l'acord que ve (nota d'aproximació a l'última corxera) quan canvia
  const nextBar = o.bars[((k + 1) % L + L) % L];
  const cur = bar.at(-1).chord; const nxt = nextBar?.[0]?.chord;
  if (without !== 'bass' && nxt && mod(nxt.root - cur.root, 12) !== 0 && round > 0) {
    const target = bassRoot(nxt);
    const from = bassRoot(cur);
    const appr = target > from ? target - 1 : target + 2;
    const i = out.findIndex((e) => e.fam === 'bass' && e.beat >= B - 0.5 - 1e-6);
    const ev = { inst: 'baix', beat: B - 0.5, dur: 0.45, notes: [appr], gain: 0.5, fam: 'bass' };
    if (i >= 0) out[i] = { ...out[i], notes: [appr], dur: Math.min(out[i].dur, B - out[i].beat) }; else out.push(ev);
  }
  if (o.dynamic === false) return out;
  if (round === 0) out = out.filter((e) => e.fam !== 'keys' && e.fam !== 'gtr');
  else if (round === 1) out = out.filter((e) => e.fam !== 'gtr');
  // a partir de la tercera volta, el charles obre a l'últim contratemps; a la quarta, ride en comptes de charles
  if (round >= 2) out = out.map((e) => (e.inst === 'drum' && e.piece === 'hh' && Math.abs(e.beat - (B - 0.5)) < 1e-6 ? { ...e, piece: 'oh' } : e));
  if (round >= 3 && round % 2 === 1) out = out.map((e) => (e.inst === 'drum' && e.piece === 'hh' ? { ...e, piece: 'ride', vel: (e.vel ?? 1) * 1.1 } : e));
  // plat als canvis de part de la cançó
  if (bar.part && k > 0 && inBar !== 0) out.push({ inst: 'drum', piece: 'crash', beat: 0, vel: 0.7 });
  if (inBar === L - 1 && L > 1) {
    // redoble al final de la volta
    const fill = FILLS[round % FILLS.length](B);
    const from = Math.min(...fill.map(([b]) => b));
    out = out.filter((e) => !(e.inst === 'drum' && e.beat >= from - 1e-6));
    out.push(...fill.map(([b, piece, vel]) => ({ inst: 'drum', piece, beat: b, vel })));
  }
  if (inBar === 0 && round > 0) out.push({ inst: 'drum', piece: 'crash', beat: 0, vel: 0.8 });
  return out;
}

export function makeSong(o) {
  const M = metre(o.metre);
  const cache = new Map();
  const song = {
    ...o, M,
    family: o.inst === 'baix' ? 'bass' : 'gtr',
    content(k) {
      if (cache.has(k)) return cache.get(k);
      const bar = o.bars[((k % o.bars.length) + o.bars.length) % o.bars.length];
      const c = {
        bar,
        band: dynamicBand(o, k, bar, M, song.family),
        part: o.part ? partBar(o.part, o.inst, bar, M, k) : [],
        voice: voiceBar({ voice: o.voice }, bar, M, k),
      };
      if (o.extra) Object.assign(c, o.extra(k, bar, M));
      cache.set(k, c);
      return c;
    },
  };
  return song;
}

export const SETS_FOR = (inst) => [...new Set([...BAND_SETS, INSTRUMENTS[inst].sound])];

export async function prepare(inst) {
  await resumeAudio();
  await Promise.all(SETS_FOR(inst).map(loadSet));
}

// ---- Transport ------------------------------------------------------------------------------------------------

let run = null;

export const isPlaying = () => !!run;

/**
 * Comença a tocar.
 *  plan(i) → { mode: 'count' | 'demo' | 'play' | 'question' | 'answer', k } o null quan s'acaba.
 *  opts: { metronome, guide (0–1: volum de la teva part quan toques tu), onEnd, onBar }
 */
export function start(song, plan, opts = {}) {
  stop();
  const ctx = audioContext();
  const spq = 60 / song.tempo / song.M.pulseLen; // segons per negra
  const barDur = song.M.beats * spq;
  const t0 = ctx.currentTime + 0.15;
  run = { song, plan, opts, spq, barDur, t0, next: 0, bars: [], ended: null, timer: null };
  const r = run;
  const tick = () => {
    if (run !== r) return;
    const horizon = ctx.currentTime + 0.35;
    while (r.ended == null && r.t0 + r.next * r.barDur < horizon) {
      const seg = plan(r.next);
      if (!seg) { r.ended = r.next; scheduleEnd(r, r.next); break; }
      scheduleBar(r, r.next, seg);
      r.next++;
    }
    if (r.ended != null && ctx.currentTime > r.t0 + r.ended * r.barDur + (r.bars[r.ended] ? 1.6 : 0.25)) {
      const cb = r.opts.onEnd;
      stop();
      cb?.();
    }
  };
  r.timer = setInterval(tick, 25);
  tick();
  return r;
}

/** Pausa: el rellotge d'àudio s'atura (i amb ell la música i l'animació); reprèn on era. */
export async function pause() {
  if (!run || run.paused) return;
  run.paused = true;
  try { await audioContext().suspend(); } catch { /* res */ }
}
export async function resume() {
  if (!run?.paused) return;
  run.paused = false;
  try { await audioContext().resume(); } catch { /* res */ }
}
export const isPaused = () => !!run?.paused;

export function stop() {
  if (!run) return;
  if (run.paused) { run.paused = false; audioContext().resume().catch(() => {}); }
  clearInterval(run.timer);
  run = null;
  stopAll();
}

/** L'acabament: al temps fort del compàs següent, tota la banda fa un cop i el deixa sonar. */
function scheduleEnd(r, i) {
  const { song, spq } = r;
  let last = null;
  for (let j = i - 1; j >= 0 && !last; j--) if (r.bars[j]?.content) last = r.bars[j];
  if (!last || song.estil === 'metronom') return;
  // s'acaba a la tònica (I, o i si és menor), no a l'últim acord del tros
  const key = song.key ?? guessKey(song.bars);
  const tonicSym = `${pcName(key.root)}${key.minor ? 'm' : ''}`;
  const chord = song.bars.flatMap((b) => b.map((sg) => sg.chord)).find((c) => mod(c.root, 12) === key.root && !!c.minor === key.minor) ?? parseChord(tonicSym);
  const t = r.t0 + i * r.barDur;
  const at = (beat) => t + beat * spq;
  r.bars[i] = { i, t, seg: { mode: 'end', k: last.seg.k }, content: { bar: [{ chord, start: 0, len: 1 }], band: [], part: [], voice: [] } };
  for (const e of finalHit(chord, song.M, song.family)) playBand(e, at, spq);
  // la teva part també hi és (a l'exemple, forta; quan toques tu, com la guia)
  const partGain = last.seg.mode === 'demo' ? 1 : (r.opts.guide ?? 0);
  // la teva part: un cop de la tònica (es busca a tota la roda; si no hi és, una nota de la fonamental)
  let ev = null;
  for (let k = 0; k < song.bars.length && !ev; k++) ev = song.content(k).part.find((e) => e.chord === chord.symbol && (e.kind === 'strum' ? !e.ghost : e.notes?.length));
  if (ev?.kind === 'note' && ev.pos?.[0]?.role && ev.pos[0].role !== '1') { const root = song.content(0).part.find((e) => e.chord === chord.symbol && e.pos?.[0]?.role === '1'); if (root) ev = root; }
  if (partGain > 0 && ev) playPart(song, { ...ev, beat: 0, dur: Math.max(2, song.M.beats), legato: false, legatoNext: false, tech: null }, at, spq, partGain, last.seg.mode === 'play' ? -0.75 : 0);
  r.opts.onBar?.(r.bars[i]);
}

function scheduleBar(r, i, seg) {
  const { song, spq } = r;
  const t = r.t0 + i * r.barDur;
  const content = seg.mode === 'count' ? null : song.content(seg.k);
  r.bars[i] = { i, t, seg, content };
  const at = (beat) => t + beat * spq;
  // mescla: a l'exemple, la banda (sobretot la bateria) baixa perquè es senti bé la guitarra o el baix
  const demo = seg.mode === 'demo' || seg.mode === 'question';
  const vol = r.opts.bandVol ?? 1;
  const gd = busGain('drums'); const gb = busGain('band');
  if (gd && gb) { gd.setTargetAtTime((demo ? 0.3 : 0.85) * vol, Math.max(t - 0.05, audioContext().currentTime), 0.05); gb.setTargetAtTime((demo ? 0.45 : 0.8) * vol, Math.max(t - 0.05, audioContext().currentTime), 0.05); }
  // metrònom: al compte, o sempre si està encès
  if (seg.mode === 'count') {
    // l'entrada la fa el bateria amb les baquetes (i el clic de fons), com en una banda de debò
    for (const c of clicksBar(song.M)) { click(at(c.beat), c.accent); drum('stick', at(c.beat), { vel: c.accent ? 1 : 0.8 }); }
  } else if (r.opts.metronome || song.estil === 'metronom') {
    for (const c of clicksBar(song.M)) click(at(c.beat), c.accent);
  }
  if (!content) return;
  for (const e of content.band) playBand(e, at, spq);
  const partGain = seg.mode === 'demo' || seg.mode === 'question' ? 1 : seg.mode === 'play' ? (r.opts.guide ?? 0) : 0;
  // la guia sonora (la teva part, fluixa, mentre toques tu) va a l'esquerra perquè es distingeixi de la banda
  const pan = seg.mode === 'play' ? -0.75 : 0;
  if (partGain > 0) for (const e of content.part) playPart(song, e, at, spq, partGain, pan);
  const voiceGain = seg.mode === 'demo' ? 1 : seg.mode === 'play' ? Math.max(r.opts.guide ?? 0, r.opts.voiceGuide ? 0.6 : 0) : 0;
  if (voiceGain > 0) for (const v of content.voice) if (v.sing && v.midi) tone('rhodes', v.midi, at(v.beat), v.dur * spq, { gain: 0.32 * voiceGain, dest: 'me' });
  r.opts.onBar?.(r.bars[i]);
}

// mescla de la banda per famílies (el baix nou té molt de cos: una mica enrere)
const BAND_MIX = { bass: 0.62, keys: 1, gtr: 1 };
const BAND_PAN = { gtr: 0.35, keys: -0.3 };
// una mica d'imprecisió humana: la banda no sona com una màquina
const jitter = (ms) => (Math.random() * 2 - 1) * ms / 1000;
function playBand(e, at, spq) {
  if (e.inst === 'drum') { drum(e.piece, at(e.beat) + (e.beat === 0 ? 0 : jitter(4)), { vel: (e.vel ?? 1) * (0.93 + Math.random() * 0.07) }); return; }
  const t = at(e.beat) + jitter(6);
  const g = e.gain * (BAND_MIX[e.fam] ?? 1) * (0.92 + Math.random() * 0.1);
  // la banda en estèreo: guitarres una mica a la dreta, teclat a l'esquerra (el baix i la bateria al mig)
  const pan = BAND_PAN[e.fam] ?? 0;
  e.notes.forEach((m, j) => tone(e.inst, m, t + (e.strum ? j * e.strum : 0), e.dur * spq, { gain: g, pan }));
}

/** Fa sonar un esdeveniment de la teva part (també el fa servir «corda a corda»). */
export function playPart(song, e, at, spq, gain = 1, pan = 0) {
  const inst = INSTRUMENTS[song.inst];
  const t = at(e.beat);
  const dur = Math.max(0.12, e.dur * spq);
  if (e.kind === 'strum') {
    if (e.ghost) return;
    const n = e.notes.length;
    e.notes.forEach((m, j) => tone(inst.sound, m, t + j * 0.011, dur, { gain: (0.34 - (e.dir === 'U' ? 0.08 : 0)) * gain * (1 - j / (n * 4)), dest: 'me', pan }));
    return;
  }
  if (e.kind !== 'note') return;
  const m = e.notes[0];
  const g = (song.inst === 'baix' ? 0.75 : 0.55) * gain;
  const tech = e.tech;
  // nota lligada (hammer-on / pull-off): sense atac de púa i una mica més fluixa
  // nota lligada (hammer-on / pull-off): sense l'atac de la púa (se salta el principi de la mostra i entra suau)
  if (e.legato) { tone(inst.sound, m, t, dur, { gain: g * 0.7, dest: 'me', pan, attack: 0.02, skip: 0.04 }); return; }
  if (e.legatoNext) { tone(inst.sound, m, t, Math.max(0.06, e.dur * spq), { gain: g, dest: 'me', pan, release: 0.015 }); return; }
  if (!tech) { tone(inst.sound, m, t, dur, { gain: g, dest: 'me', pan }); return; }
  const half = dur / 2;
  const m2 = inst.tuning[e.pos[0].s] + tech.to;
  if (tech.type === 'h' || tech.type === 'p') {
    tone(inst.sound, m, t, half, { gain: g, dest: 'me', pan, release: 0.02 });
    tone(inst.sound, m2, t + half, half, { gain: g * 0.68, dest: 'me', pan, attack: 0.02, skip: 0.04 });
  } else if (tech.type === 's') {
    tone(inst.sound, m, t, dur, { gain: g, dest: 'me', pan, glideTo: [{ at: half * 0.7, midi: m2, dur: half * 0.45 }] });
  } else if (tech.type === 'b') {
    tone(inst.sound, m, t, dur, { gain: g, dest: 'me', pan, glideTo: [{ at: dur * 0.25, midi: m + (tech.semis ?? 2), dur: dur * 0.3 }] });
  }
}

/**
 * On som ara (el que se sent pels altaveus): { i (compàs del pla), beat (dins del compàs),
 * bar (informació del compàs), abs (negres des de l'inici), time }.
 */
export function position() {
  if (!run) return null;
  const ctx = audioContext();
  // el que se sent ara: el rellotge menys el retard de sortida (i el dels auriculars sense fil, a Configuració)
  const heard = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0) - (settings().outLat ?? 0);
  const x = (heard - run.t0) / run.barDur;
  const i = Math.floor(x);
  return { i, beat: (x - i) * run.song.M.beats, abs: x * run.song.M.beats, bar: run.bars[i] ?? null, bars: run.bars, time: heard, spq: run.spq, song: run.song, barDur: run.barDur, t0: run.t0 };
}

export function setGuide(v) { if (run) run.opts.guide = v; }
export function setMetronome(v) { if (run) run.opts.metronome = v; }
/** Fa sonar un esdeveniment ara mateix (l'animació muda d'abans de començar, que així no és muda). */
export function playNow(song, e, gain = 0.7) {
  const ctx = audioContext();
  if (ctx.state !== 'running' || !setsReady(SETS_FOR(song.inst))) return;
  const spq = 60 / song.tempo / song.M.pulseLen;
  const t = ctx.currentTime + 0.01;
  playPart(song, { ...e, beat: 0 }, () => t, spq, gain);
}

export const bandVolume = (v) => { if (run) run.opts.bandVol = v; const g = busGain('band'); const d = busGain('drums'); if (g) g.value = 0.8 * v; if (d) d.value = 0.85 * v; };
