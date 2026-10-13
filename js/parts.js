// La part de l'alumnat: què ha de tocar a cada compàs (i què ensenya l'animació).
//
// Un esdeveniment: { beat, dur, kind: 'strum' | 'note', dir: 'D' | 'U', ghost, chord, voicing,
//                    notes: [midi], pos: [{ s, f, finger, role }], tech, label }
// Les especificacions de part (spec) les fan servir els nivells i el creador de cançons:
//   { type: 'strum', rhythm: 'W' | 'H' | 'Q' | 'E' | 'S', card: 'mb2', voicing: 'obert' | 'celleta' | 'quinta' }
//   { type: 'rascat', card: 'rg1', voicing }
//   { type: 'arp', card: 'pm10', voicing }                 contorn melòdic sobre les notes de l'acord
//   { type: 'bass', rhythm | card, roles: ['1', '8'] }      els papers es reparteixen per ordre
//   { type: 'riff', notes: [[beat, dur, corda, trast, tècnica?, trastFinal?]] }   (corda: 1 = la més aguda)
//   { type: 'compose', bars: [{ rhythm: 'mb2', melodic: 'pm10' }] }
//   { type: 'improv' }                                       sense notes: el mànec ensenya l'escala

import { chordAt, mod } from './theory.js';
import { cardById, cardOnsets } from './data/cartes.js';
import { INSTRUMENTS, guitarVoicing, bassRole, guitarLadder, soundingLadder } from './fretboard.js';

const EPS = 1e-6;

/** Les notes (inici, durada) d'un ritme dins d'un compàs de `M`. */
export function rhythmOnsets(spec, M) {
  if (spec.card) {
    const c = cardById(spec.card);
    if (c?.notes) return cardOnsets(c).filter(([a]) => a < M.beats - EPS);
  }
  const B = M.beats;
  const every = (step) => Array.from({ length: Math.round(B / step) }, (_, i) => [i * step, step]);
  switch (spec.rhythm) {
    case 'W': return [[0, B]];
    case 'H': return M.pulseLen > 1 ? every(M.pulseLen * (M.pulses % 2 ? 1 : 2)) : B % 2 ? [[0, 2], [2, 1]].filter(([a]) => a < B) : every(2);
    case 'E': return every(0.5);
    case 'S': return every(0.25);
    case 'Q': default: return every(M.pulseLen);
  }
}

/** Direcció de la púa per a cada nota d'un ritme (avall als temps, amunt als contratemps). */
function strumDirs(onsets, M) {
  const fine = onsets.some(([a]) => Math.abs((a * 4) % 2 - 1) < EPS); // hi ha semicorxeres a contratemps
  return onsets.map(([a]) => {
    if (M.sub === 3) {
      const k = Math.round(mod(a, M.pulseLen) / 0.5);
      return k % 2 ? 'U' : 'D';
    }
    const frac = mod(a, 1);
    if (fine) return Math.abs(frac) < EPS || Math.abs(frac - 0.5) < EPS ? 'D' : 'U';
    return frac < EPS ? 'D' : 'U';
  });
}

function strumNotes(v, dir) {
  const notes = v.midi.filter((m) => m != null);
  if (dir === 'D') return notes;
  return notes.slice(-4).reverse();
}

function strumEvent(chord, v, beat, dur, dir, extra = {}) {
  return {
    beat, dur, kind: 'strum', dir, chord: chord.symbol, voicing: v,
    notes: extra.ghost ? [] : strumNotes(v, dir),
    pos: v.frets.map((f, s) => ({ s, f, finger: v.fingers[s] })).filter((p) => p.f >= 0),
    label: dir === 'D' ? '↓' : '↑', ...extra,
  };
}

function noteEvent(inst, p, beat, dur, chord, extra = {}) {
  if (!p) return null;
  return { beat, dur, kind: 'note', chord: chord?.symbol, notes: [inst.tuning[p.s] + p.f], pos: [{ s: p.s, f: p.f, role: p.role }], label: extra.label ?? (p.role ? roleLabel(p.role) : `${p.f}`), ...extra };
}

export const roleLabel = (r) => ({ 1: '1', 3: '3', 5: '5', 8: '8', b7: '7', 7: '7', 10: '3', 12: '5', '-5': '5', '-8': '1' }[r] ?? String(r));
// (a la guitarra, el paper «1» d'una nota aguda es diu igualment 1: és la mateixa nota)

const segChord = (bar, beat, M) => chordAt(bar, beat / M.beats);

/** La part d'un compàs. `k` és el número de compàs (per repartir papers que continuen). */
export function partBar(spec, instId, bar, M, k = 0) {
  const inst = INSTRUMENTS[instId];
  const out = [];
  const vmode = spec.voicing ?? 'obert';
  const voicingOf = (chord) => guitarVoicing(chord, vmode);

  if (spec.type === 'strum' || spec.type === 'bass' || (spec.type === 'voice' && spec.play)) {
    const s = spec.type === 'voice' ? spec.play : spec;
    const onsets = rhythmOnsets(s, M);
    if (instId === 'guitarra') {
      const dirs = strumDirs(onsets, M);
      onsets.forEach(([a, d], i) => {
        const chord = segChord(bar, a, M);
        out.push(strumEvent(chord, voicingOf(chord), a, d, dirs[i]));
      });
    } else {
      const roles = s.roles ?? ['1'];
      onsets.forEach(([a, d], i) => {
        const chord = segChord(bar, a, M);
        out.push(noteEvent(inst, bassRole(chord, roles[i % roles.length]), a, d, chord));
      });
    }
  } else if (spec.type === 'rascat') {
    const card = cardById(spec.card);
    const moves = card?.strum ?? 'DUDUDUDU';
    const step = M.beats / moves.length;
    [...moves].forEach((m, i) => {
      const a = i * step;
      const chord = segChord(bar, a, M);
      const ghost = m === m.toLowerCase();
      // la nota dura fins al següent cop que sona
      let next = i + 1;
      while (next < moves.length && moves[next] === moves[next].toLowerCase()) next++;
      out.push(strumEvent(chord, voicingOf(chord), a, ghost ? step : (next - i) * step, m.toUpperCase(), { ghost }));
    });
  } else if (spec.type === 'arp' || spec.type === 'compose') {
    let ranks;
    let onsets;
    if (spec.type === 'arp') {
      const card = cardById(spec.card);
      const frases = card?.contour ?? [[0, 1, 2, 3]];
      const slot = M.beats / frases.length;
      onsets = [];
      ranks = [];
      frases.forEach((fr, j) => fr.forEach((r, i) => { onsets.push([j * slot + (i * slot) / fr.length, slot / fr.length]); ranks.push(r); }));
    } else {
      const b = spec.bars[k % spec.bars.length];
      onsets = rhythmOnsets({ card: b.rhythm, rhythm: 'Q' }, M);
      const contour = (cardById(b.melodic)?.contour ?? [[0, 1, 2, 1]]).flat();
      ranks = onsets.map((_, i) => contour[i % contour.length]);
    }
    onsets.forEach(([a, d], i) => {
      const chord = segChord(bar, a, M);
      if (instId === 'guitarra') {
        const v = voicingOf(chord);
        if (v.power || v.covered) {
          // amb power chords o cordes tapades, el contorn va per les notes que sonen
          const ladder = soundingLadder(chord, v);
          const p = ladder[ranks[i] % ladder.length];
          out.push(noteEvent(inst, p, a, d, chord, { voicing: v }));
        } else {
          const ladder = guitarLadder(chord, v, 5);
          const p = ladder[Math.min(ranks[i], ladder.length - 1)];
          const role = ['1', '3', '5', '8', '10', '12'][ranks[i]] ?? '1';
          out.push(noteEvent(inst, p && { ...p, role }, a, d, chord, { voicing: v }));
        }
      } else {
        const role = ['1', '3', '5', '8', '10', '12'][ranks[i]] ?? '1';
        out.push(noteEvent(inst, bassRole(chord, role), a, d, chord));
      }
    });
  } else if (spec.type === 'techroot') {
    // per al creador: un recurs tècnic que arriba a la fonamental de cada acord, i després 1 i 5
    for (const seg of bar) {
      const a0 = seg.start * M.beats;
      const len = seg.len * M.beats;
      const chord = seg.chord;
      let root;
      if (instId === 'guitarra') {
        const pc = guitarVoicing(chord, 'quinta');
        const s0 = pc.frets.findIndex((f) => f >= 0);
        root = { s: s0, f: pc.frets[s0] };
      } else root = bassRole(chord, '1');
      const t = spec.tech ?? 'h';
      const from = root.f >= 2 ? root.f - 2 : root.f;
      const to = root.f >= 2 ? root.f : root.f + 2;
      const first = t === 'b' ? { s: root.s, f: from } : { s: root.s, f: from };
      const d1 = Math.min(len, len >= 4 ? 2 : len / 2);
      const e = noteEvent(inst, first, a0, d1, chord, {});
      e.tech = { type: t, to: t === 'b' ? from : to, semis: to - from || 2 };
      e.label = { h: `${from}h${to}`, s: `${from}/${to}`, b: `${from}↗`, p: `${to}p${from}` }[t];
      if (t === 'p') { e.pos = [{ s: root.s, f: to }]; e.notes = [inst.tuning[root.s] + to]; e.tech.to = from; }
      out.push(e);
      if (len > d1) {
        const r2 = { ...root, role: '1' };
        out.push(noteEvent(inst, r2, a0 + d1, Math.min(1, len - d1), chord));
        if (len - d1 > 1) out.push(noteEvent(inst, { s: Math.min(root.s + 1, inst.tuning.length - 1), f: root.f + 2, role: '5' }, a0 + d1 + 1, len - d1 - 1, chord));
      }
    }
  } else if (spec.type === 'riff') {
    const n = inst.tuning.length;
    for (const [a, d, str, f, tech, f2] of spec.notes) {
      if (a >= M.beats - EPS) continue;
      const s = n - str;
      const chord = segChord(bar, a, M);
      const e = noteEvent(inst, { s, f }, a, d, chord, { label: String(f) });
      if (tech) {
        e.tech = { type: tech, to: f2 ?? (tech === 'b' ? f : f + 2) };
        e.label = { h: `${f}h${e.tech.to}`, p: `${f}p${e.tech.to}`, s: `${f}/${e.tech.to}`, b: `${f}↗` }[tech];
        if (tech === 'b') e.tech.semis = spec.bend ?? (instId === 'baix' ? 1 : 2);
      }
      out.push(e);
    }
  }
  return out.filter(Boolean).sort((x, y) => x.beat - y.beat);
}

/** La línia de veu (per als nivells de cantar i tocar). */
export function voiceBar(spec, bar, M, k = 0) {
  if (!spec?.voice) return [];
  const v = spec.voice;
  if (v === 'count' || v === 'count8') {
    const names = ['u', 'dos', 'tres', 'quatre', 'cinc', 'sis'];
    const out = [];
    for (let p = 0; p < M.pulses; p++) {
      out.push({ beat: p * M.pulseLen, dur: M.pulseLen / 2, text: names[p], speak: true });
      if (v === 'count8') out.push({ beat: p * M.pulseLen + M.pulseLen / 2, dur: M.pulseLen / 2, text: 'i', speak: true });
    }
    return out;
  }
  if (v === 'root') {
    return bar.map((seg) => {
      const midi = 57 + mod(seg.chord.root - 57, 12);
      return { beat: seg.start * M.beats, dur: seg.len * M.beats - 0.1, text: 'uuu', midi, sing: true };
    });
  }
  if (Array.isArray(v)) {
    // melodia escrita per compassos: [[beat, dur, midi, síl·laba], …] per a cada compàs
    const line = v[k % v.length] ?? [];
    return line.map(([beat, dur, midi, text]) => ({ beat, dur, midi, text, sing: true }));
  }
  return [];
}
