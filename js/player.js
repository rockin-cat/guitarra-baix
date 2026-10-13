// El rellotge: programa compàs a compàs la banda, la teva part (a la demostració)
// i el metrònom, i diu a l'animació on som.

import { audioContext, resumeAudio, loadSet, drum, click, tone, stopAll, busGain } from './audio.js';
import { bandBar, clicksBar, BAND_SETS } from './band.js';
import { partBar, voiceBar } from './parts.js';
import { INSTRUMENTS } from './fretboard.js';
import { metre } from './theory.js';

/**
 * Una cançó per tocar.
 *  { inst, bars (de parseProgression), metre, tempo, estil, part (spec), voice, extra(k) }
 * `content(k)` torna el compàs k de la progressió (amb repetició) ja calculat.
 */
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
        band: bandBar(o.estil, bar, M, song.family),
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
      if (!seg) { r.ended = r.next; break; }
      scheduleBar(r, r.next, seg);
      r.next++;
    }
    if (r.ended != null && ctx.currentTime > r.t0 + r.ended * r.barDur + 0.25) {
      const cb = r.opts.onEnd;
      stop();
      cb?.();
    }
  };
  r.timer = setInterval(tick, 25);
  tick();
  return r;
}

export function stop() {
  if (!run) return;
  clearInterval(run.timer);
  run = null;
  stopAll();
}

function scheduleBar(r, i, seg) {
  const { song, spq } = r;
  const t = r.t0 + i * r.barDur;
  const content = seg.mode === 'count' ? null : song.content(seg.k);
  r.bars[i] = { i, t, seg, content };
  const at = (beat) => t + beat * spq;
  // metrònom: al compte, o sempre si està encès
  if (seg.mode === 'count' || r.opts.metronome || song.estil === 'metronom') {
    for (const c of clicksBar(song.M)) click(at(c.beat), c.accent);
  }
  if (!content) return;
  for (const e of content.band) playBand(e, at, spq);
  const partGain = seg.mode === 'demo' || seg.mode === 'question' ? 1 : seg.mode === 'play' ? (r.opts.guide ?? 0) : 0;
  if (partGain > 0) for (const e of content.part) playPart(song, e, at, spq, partGain);
  const voiceGain = seg.mode === 'demo' ? 1 : seg.mode === 'play' ? Math.max(r.opts.guide ?? 0, r.opts.voiceGuide ? 0.6 : 0) : 0;
  if (voiceGain > 0) for (const v of content.voice) if (v.sing && v.midi) tone('rhodes', v.midi, at(v.beat), v.dur * spq, { gain: 0.32 * voiceGain, dest: 'me' });
  r.opts.onBar?.(r.bars[i]);
}

function playBand(e, at, spq) {
  if (e.inst === 'drum') { drum(e.piece, at(e.beat), { vel: e.vel ?? 1 }); return; }
  const t = at(e.beat);
  e.notes.forEach((m, j) => tone(e.inst, m, t + (e.strum ? j * e.strum : 0), e.dur * spq, { gain: e.gain }));
}

/** Fa sonar un esdeveniment de la teva part (també el fa servir «corda a corda»). */
export function playPart(song, e, at, spq, gain = 1) {
  const inst = INSTRUMENTS[song.inst];
  const t = at(e.beat);
  const dur = Math.max(0.12, e.dur * spq);
  if (e.kind === 'strum') {
    if (e.ghost) return;
    const n = e.notes.length;
    e.notes.forEach((m, j) => tone(inst.sound, m, t + j * 0.011, dur, { gain: (0.34 - (e.dir === 'U' ? 0.08 : 0)) * gain * (1 - j / (n * 4)), dest: 'me' }));
    return;
  }
  if (e.kind !== 'note') return;
  const m = e.notes[0];
  const g = (song.inst === 'baix' ? 0.75 : 0.55) * gain;
  const tech = e.tech;
  if (!tech) { tone(inst.sound, m, t, dur, { gain: g, dest: 'me' }); return; }
  const half = dur / 2;
  const m2 = inst.tuning[e.pos[0].s] + tech.to;
  if (tech.type === 'h' || tech.type === 'p') {
    tone(inst.sound, m, t, half, { gain: g, dest: 'me', release: 0.02 });
    tone(inst.sound, m2, t + half, half, { gain: g * 0.75, dest: 'me', attack: 0.012 });
  } else if (tech.type === 's') {
    tone(inst.sound, m, t, dur, { gain: g, dest: 'me', glideTo: [{ at: half * 0.7, midi: m2, dur: half * 0.45 }] });
  } else if (tech.type === 'b') {
    tone(inst.sound, m, t, dur, { gain: g, dest: 'me', glideTo: [{ at: dur * 0.25, midi: m + (tech.semis ?? 2), dur: dur * 0.3 }] });
  }
}

/**
 * On som ara (el que se sent pels altaveus): { i (compàs del pla), beat (dins del compàs),
 * bar (informació del compàs), abs (negres des de l'inici), time }.
 */
export function position() {
  if (!run) return null;
  const ctx = audioContext();
  const heard = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
  const x = (heard - run.t0) / run.barDur;
  const i = Math.floor(x);
  return { i, beat: (x - i) * run.song.M.beats, abs: x * run.song.M.beats, bar: run.bars[i] ?? null, bars: run.bars, time: heard, spq: run.spq, song: run.song, barDur: run.barDur, t0: run.t0 };
}

export function setGuide(v) { if (run) run.opts.guide = v; }
export function setMetronome(v) { if (run) run.opts.metronome = v; }
export const bandVolume = (v) => { const g = busGain('band'); const d = busGain('drums'); if (g) g.value = 0.8 * v; if (d) d.value = 0.85 * v; };
