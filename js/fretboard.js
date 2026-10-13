// El mànec: afinacions, posicions dels acords de guitarra i de les notes del baix.
// Les cordes es compten de la més greu (índex 0) a la més aguda.

import { mod } from './theory.js';

export const INSTRUMENTS = {
  guitarra: {
    id: 'guitarra', nom: 'Guitarra elèctrica', curt: 'Guitarra',
    tuning: [40, 45, 50, 55, 59, 64], // Mi2 La2 Re3 Sol3 Si3 Mi4
    stringNames: ['Mi', 'La', 'Re', 'Sol', 'Si', 'Mi'],
    frets: 12, sound: 'guitarra', color: '#f97316', colorSoft: '#fdba74', icon: '🎸',
  },
  baix: {
    id: 'baix', nom: 'Baix elèctric', curt: 'Baix',
    tuning: [28, 33, 38, 43], // Mi1 La1 Re2 Sol2
    stringNames: ['Mi', 'La', 'Re', 'Sol'],
    frets: 12, sound: 'baix', color: '#a855f7', colorSoft: '#d8b4fe', icon: '🎸',
  },
};
export const instrument = (id) => INSTRUMENTS[id] ?? INSTRUMENTS.guitarra;
/** Número de corda com es diu a classe: la 1 és la més aguda. */
export const stringNumber = (inst, s) => inst.tuning.length - s;

// ---- Acords oberts de guitarra -----------------------------------------------------------------------------
// [trasts de la 6a a la 1a (-1 = no es toca), dits (0 = a l'aire)]
const OPEN = {
  'C': [[-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]],
  'G': [[3, 2, 0, 0, 0, 3], [2, 1, 0, 0, 0, 3]],
  'D': [[-1, -1, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2]],
  'A': [[-1, 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0]],
  'E': [[0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0]],
  'F': [[-1, -1, 3, 2, 1, 1], [0, 0, 3, 2, 1, 1]],
  'Am': [[-1, 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0]],
  'Em': [[0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0]],
  'Dm': [[-1, -1, 0, 2, 3, 1], [0, 0, 0, 2, 3, 1]],
  'A7': [[-1, 0, 2, 0, 2, 0], [0, 0, 2, 0, 3, 0]],
  'D7': [[-1, -1, 0, 2, 1, 2], [0, 0, 0, 2, 1, 3]],
  'E7': [[0, 2, 0, 1, 0, 0], [0, 2, 0, 1, 0, 0]],
  'G7': [[3, 2, 0, 0, 0, 1], [3, 2, 0, 0, 0, 1]],
  'C7': [[-1, 3, 2, 3, 1, 0], [0, 3, 2, 4, 1, 0]],
  'B7': [[-1, 2, 1, 2, 0, 2], [0, 2, 1, 3, 0, 4]],
  'Am7': [[-1, 0, 2, 0, 1, 0], [0, 0, 2, 0, 1, 0]],
  'Em7': [[0, 2, 0, 0, 0, 0], [0, 2, 0, 0, 0, 0]],
  'Dm7': [[-1, -1, 0, 2, 1, 1], [0, 0, 0, 2, 1, 1]],
  'Cmaj7': [[-1, 3, 2, 0, 0, 0], [0, 3, 2, 0, 0, 0]],
  'Fmaj7': [[-1, -1, 3, 2, 1, 0], [0, 0, 3, 2, 1, 0]],
  'Asus2': [[-1, 0, 2, 2, 0, 0], [0, 0, 1, 2, 0, 0]],
  'Asus4': [[-1, 0, 2, 2, 3, 0], [0, 0, 1, 2, 3, 0]],
  'Dsus2': [[-1, -1, 0, 2, 3, 0], [0, 0, 0, 1, 3, 0]],
  'Dsus4': [[-1, -1, 0, 2, 3, 3], [0, 0, 0, 1, 3, 4]],
  'Esus4': [[0, 2, 2, 2, 0, 0], [0, 2, 3, 4, 0, 0]],
};

// Les digitacions de les cartes de diagrames ROCKIN (Generador de diagrames): manen per als acords majors i menors.
// [trasts de la 6a a la 1a, dits]
const ROCKIN_SHAPES = {
  'Am': [[0, 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0]], 'A': [[0, 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0]],
  'Bb': [[6, 8, 8, 7, 6, 6], [1, 3, 4, 2, 1, 1]], 'Bbm': [[6, 8, 8, 6, 6, 6], [1, 3, 4, 1, 1, 1]],
  'Bm': [[2, 2, 4, 4, 3, 2], [1, 1, 3, 4, 2, 1]], 'B': [[2, 2, 4, 4, 4, 2], [1, 1, 2, 3, 4, 1]],
  'Cm': [[3, 3, 5, 5, 4, 3], [1, 1, 3, 4, 2, 1]], 'C': [[0, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]],
  'C#': [[4, 4, 6, 6, 6, 4], [1, 1, 2, 3, 4, 1]], 'C#m': [[4, 4, 6, 6, 5, 4], [1, 1, 3, 4, 2, 1]],
  'Dm': [[-1, 0, 0, 2, 3, 1], [0, 0, 0, 2, 3, 1]], 'D': [[-1, 0, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2]],
  'Eb': [[6, 6, 8, 8, 8, 6], [1, 1, 2, 3, 4, 1]], 'Ebm': [[6, 6, 8, 8, 7, 6], [1, 1, 3, 4, 2, 1]],
  'Em': [[0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0]], 'E': [[0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0]],
  'Fm': [[1, 3, 3, 1, 1, 1], [1, 3, 4, 1, 1, 1]], 'F': [[1, 3, 3, 2, 1, 1], [1, 3, 4, 2, 1, 1]],
  'F#': [[2, 4, 4, 3, 2, 2], [1, 3, 4, 2, 1, 1]], 'F#m': [[2, 4, 4, 2, 2, 2], [1, 3, 4, 1, 1, 1]],
  'Gm': [[3, 5, 5, 3, 3, 3], [1, 3, 4, 1, 1, 1]], 'G': [[3, 2, 0, 0, 3, 3], [2, 1, 0, 0, 3, 4]],
  'Ab': [[4, 6, 6, 5, 4, 4], [1, 3, 4, 2, 1, 1]], 'Abm': [[4, 6, 6, 4, 4, 4], [1, 3, 4, 1, 1, 1]],
};
const ENHARMONIC = { 'A#': 'Bb', Db: 'C#', 'D#': 'Eb', Gb: 'F#', 'G#': 'Ab' };

// Formes amb celleta: desplaçament de trast des de la celleta (null = no es toca) i dits.
const E_FORM = {
  '': [[0, 2, 2, 1, 0, 0], [1, 3, 4, 2, 1, 1]],
  m: [[0, 2, 2, 0, 0, 0], [1, 3, 4, 1, 1, 1]],
  7: [[0, 2, 0, 1, 0, 0], [1, 3, 1, 2, 1, 1]],
  m7: [[0, 2, 0, 0, 0, 0], [1, 3, 1, 1, 1, 1]],
  sus4: [[0, 2, 2, 2, 0, 0], [1, 2, 3, 4, 1, 1]],
  '7sus4': [[0, 2, 0, 2, 0, 0], [1, 3, 1, 4, 1, 1]],
};
const A_FORM = {
  '': [[null, 0, 2, 2, 2, 0], [0, 1, 2, 3, 4, 1]],
  m: [[null, 0, 2, 2, 1, 0], [0, 1, 3, 4, 2, 1]],
  7: [[null, 0, 2, 0, 2, 0], [0, 1, 3, 1, 4, 1]],
  m7: [[null, 0, 2, 0, 1, 0], [0, 1, 3, 1, 2, 1]],
  maj7: [[null, 0, 2, 1, 2, 0], [0, 1, 3, 2, 4, 1]],
  sus2: [[null, 0, 2, 2, 0, 0], [0, 1, 3, 4, 1, 1]],
  sus4: [[null, 0, 2, 2, 3, 0], [0, 1, 2, 3, 4, 1]],
  dim: [[null, 0, 1, 2, 1, null], [0, 1, 2, 4, 3, 0]],
  m7b5: [[null, 0, 1, 0, 1, null], [0, 1, 2, 1, 3, 0]],
};
// Tipus d'acord que no tenen forma pròpia: fem servir el més proper.
const FALLBACK = { aug: '', 6: '', m6: 'm', add9: '', '7sus4': '7', maj7: '', dim: 'm', m7b5: 'm7' };

const GUITAR = INSTRUMENTS.guitarra.tuning;

function build(frets, fingers, name, form = null) {
  const midi = frets.map((f, s) => (f == null || f < 0 ? null : GUITAR[s] + f));
  let barre = null;
  if (form) {
    const at = Math.min(...frets.filter((f) => f != null && f >= 0));
    const strings = frets.map((f, s) => (fingers[s] === 1 && f === at ? s : null)).filter((s) => s != null);
    if (strings.length > 1 && at > 0) barre = { fret: at, from: strings[0], to: strings.at(-1) };
  } else {
    // celleta petita dels acords oberts (F fàcil, Dm7…)
    const ones = frets.map((f, s) => (fingers[s] === 1 ? s : null)).filter((s) => s != null);
    if (ones.length > 1 && new Set(ones.map((s) => frets[s])).size === 1) barre = { fret: frets[ones[0]], from: ones[0], to: ones.at(-1) };
  }
  return { frets: frets.map((f) => (f == null ? -1 : f)), fingers, midi, barre, name, form };
}

function barreShape(chord, which) {
  const forms = which === 'E' ? E_FORM : A_FORM;
  let q = chord.q;
  if (!forms[q]) q = FALLBACK[q] ?? '';
  if (!forms[q]) return null;
  const [offs, fingers] = forms[q];
  const base = which === 'E' ? 40 : 45;
  let at = mod(chord.root - base, 12);
  if (at === 0) at = 12;
  if (at > 9) return null;
  const frets = offs.map((o) => (o == null ? null : at + o));
  return build(frets, fingers, chord.symbol, which);
}

/** Acord de quinta (power chord) amb la fonamental a la 6a o a la 5a corda. */
export function powerChord(chord) {
  const e = mod(chord.root - 40, 12);
  const a = mod(chord.root - 45, 12);
  const onE = e <= a;
  const s = onE ? 0 : 1;
  const f = onE ? e : a;
  const frets = [-1, -1, -1, -1, -1, -1];
  const fingers = [0, 0, 0, 0, 0, 0];
  frets[s] = f; frets[s + 1] = f + 2; frets[s + 2] = f + 2;
  fingers[s] = f ? 1 : 0; fingers[s + 1] = f ? 3 : 1; fingers[s + 2] = f ? 4 : 2;
  return build(frets, fingers, `${chord.symbol.replace(/m.*|7.*|sus.*/, '')}5`);
}

/** Power chord amb la fonamental a la 6a corda (es mou per tot el mànec). parts: 1 = només la fonamental, 2 = + la 5a, 3 = + l'8a. */
export function powerRoot6(chord, parts = 3) {
  const f = mod(chord.root - 40, 12);
  const frets = [f, -1, -1, -1, -1, -1];
  const fingers = [f ? 1 : 0, 0, 0, 0, 0, 0];
  if (parts >= 2) { frets[1] = f + 2; fingers[1] = 3; }
  if (parts >= 3) { frets[2] = f + 2; fingers[2] = 4; }
  const v = build(frets, fingers, parts === 1 ? chord.symbol : `${chord.symbol.replace(/m(?!aj).*|7.*|sus.*|dim.*/, '')}5`);
  v.power = parts;
  return v;
}

/** Tapa les cordes greus: només sonen (i es veuen) les `n` cordes més agudes. */
export function coverStrings(v, n) {
  if (!v || n >= 6) return v;
  const covered = [0, 1, 2, 3, 4, 5].filter((s) => s < 6 - n);
  return { ...v, covered, midi: v.midi.map((m, s) => (covered.includes(s) ? null : m)) };
}

/**
 * Com tocar un acord a la guitarra.
 * mode: 'obert' (forma de les cartes ROCKIN si n'hi ha), 'celleta', 'quinta' (power chord),
 *       o bé un objecte { type: 'power', parts: 1–3 } | { type: 'obert', cordes: 1–6 }.
 */
export function guitarVoicing(chord, mode = 'obert') {
  if (!chord) return null;
  if (mode && typeof mode === 'object') {
    if (mode.type === 'power') return powerRoot6(chord, mode.parts ?? 3);
    return coverStrings(guitarVoicing(chord, 'obert'), mode.cordes ?? 6);
  }
  if (mode === 'quinta' || chord.q === '5') return powerChord(chord);
  const key = chord.symbol.replace(/\/.*/, '');
  const root = /^[A-G][#b]?/.exec(key)[0];
  const names = [key, (ENHARMONIC[root] ?? root) + key.slice(root.length)];
  if (mode !== 'celleta') {
    for (const n of names) if (ROCKIN_SHAPES[n]) return build(...ROCKIN_SHAPES[n], chord.symbol, ROCKIN_SHAPES[n][0].some((f) => f > 3) ? 'R' : null);
    for (const n of names) if (OPEN[n]) return build(...OPEN[n], chord.symbol);
  }
  const e = E_FORM[chord.q] || !A_FORM[chord.q] ? barreShape(chord, 'E') : null;
  const a = barreShape(chord, 'A');
  const options = [e, a].filter(Boolean).sort((x, y) => x.barre.fret - y.barre.fret);
  return options[0] ?? powerChord(chord);
}

/** Les notes que sonen d'un acord, de greu a agut, amb el seu paper (1, 3, 5, 8…). */
export function soundingLadder(chord, v) {
  const seen = new Set();
  const out = [];
  v.frets.forEach((f, s) => {
    const m = v.midi[s];
    if (m == null || seen.has(m)) return;
    seen.add(m);
    out.push({ s, f, midi: m, role: roleOf(chord, m) });
  });
  out.sort((a, b) => a.midi - b.midi);
  // la fonamental que no és la més greu és l'octava (8)
  const low = out.find((p) => p.role === '1');
  for (const p of out) if (p.role === '1' && low && p.midi > low.midi) p.role = '8';
  return out;
}
export function roleOf(chord, midi) {
  const i = mod(midi - chord.root, 12);
  return { 0: '1', 3: '3', 4: '3', 7: '5', 6: '5', 8: '5', 10: '7', 11: '7', 2: '9', 5: '4', 9: '6' }[i] ?? '';
}

/** Totes les posicions (corda, trast) d'una nota MIDI. */
export function positionsOf(inst, midi, maxFret = inst.frets) {
  const out = [];
  inst.tuning.forEach((open, s) => {
    const f = midi - open;
    if (f >= 0 && f <= maxFret) out.push({ s, f, midi });
  });
  return out;
}

/** La posició més còmoda d'una nota prop d'un trast de referència (i d'una corda si es vol). */
export function nearestPos(inst, midi, aroundFret = 3, aroundString = null) {
  const all = positionsOf(inst, midi);
  if (!all.length) return null;
  const cost = (p) => Math.abs(p.f - aroundFret) * 1.2 + (p.f === 0 ? -0.4 : 0) + (aroundString == null ? 0 : Math.abs(p.s - aroundString) * 0.6);
  return all.sort((a, b) => cost(a) - cost(b))[0];
}

// ---- Baix ----------------------------------------------------------------------------------------------------

/** On es toca la fonamental d'un acord al baix: a la 4a (Mi) o 3a (La) corda, el més avall possible. */
export function bassRoot(chord) {
  const e = mod(chord.root - 28, 12);
  const a = mod(chord.root - 33, 12);
  const cand = [{ s: 0, f: e }, { s: 1, f: a }].filter((p) => p.f <= 7);
  cand.sort((x, y) => (x.f === 0 ? -1 : 0) - (y.f === 0 ? -1 : 0) || x.f - y.f);
  const p = cand[0] ?? { s: 1, f: a };
  return { ...p, midi: INSTRUMENTS.baix.tuning[p.s] + p.f };
}

/** Semitons de cada paper respecte de la fonamental. */
export function roleSemis(chord, role) {
  return {
    1: 0, 3: chord.third ?? 4, 5: chord.fifth ?? 7, 8: 12, b7: 10, 7: chord.intervals.includes(11) ? 11 : 10,
    6: 9, 2: 2, 4: 5, '-5': -5, '-8': -12, 10: 12 + (chord.third ?? 4), 12: 19,
  }[role] ?? 0;
}

/** La posició d'un paper (1, 3, 5, 8…) a la mateixa «caixa» de la fonamental del baix. */
export function bassRole(chord, role) {
  const inst = INSTRUMENTS.baix;
  const r = bassRoot(chord);
  const midi = r.midi + roleSemis(chord, role);
  const all = positionsOf(inst, midi);
  if (!all.length) return { ...r, role: String(role) };
  const ref = r.f === 0 ? 1 : r.f;
  const cost = (p) => (p.s < r.s && role !== '-5' ? 3 : 0) + Math.abs(p.f - ref) + (p.f === 0 && r.f === 0 ? -1 : 0) + (p.f - ref > 3 ? 4 : 0) + (ref - p.f > 2 && p.f !== 0 ? 4 : 0);
  const p = all.sort((a, b) => cost(a) - cost(b))[0];
  return { ...p, role: String(role) };
}

/** Escala de notes de l'acord (1, 3, 5, 8, 10…) a la guitarra, a prop de la posició de l'acord. */
export function guitarLadder(chord, voicing, count = 4) {
  const inst = INSTRUMENTS.guitarra;
  const played = voicing.frets.filter((f) => f > 0);
  const lo = played.length ? Math.min(...played) : 0;
  const hi = played.length ? Math.max(...played) : 3;
  // la fonamental més greu que hi ha a l'acord; si no n'hi ha, la de la 5a o 6a corda
  let rootMidi = voicing.midi.filter((m) => m != null && mod(m - chord.root, 12) === 0).sort((a, b) => a - b)[0];
  if (rootMidi == null) rootMidi = 45 + mod(chord.root - 45, 12);
  // amb la fonamental molt greu (Mi, Fa a la 6a corda) els arpegis queden foscos: comencem a l'octava
  if (rootMidi < 43 && voicing.midi.includes(rootMidi + 12)) rootMidi += 12;
  const tones = [...new Set(chord.intervals.filter((i) => i < 12).concat(12))].sort((a, b) => a - b);
  const ladder = [];
  for (let k = 0; ladder.length < count + 2; k++) {
    const oct = Math.floor(k / (tones.length - 1));
    const i = tones[k % (tones.length - 1)];
    ladder.push(rootMidi + i + 12 * oct);
  }
  let prevS = null;
  return ladder.slice(0, count + 2).map((m) => {
    // si la nota és a l'acord, a la mateixa corda; si no, la més propera
    const inChord = voicing.midi.findIndex((x, s) => x === m && (prevS == null || s >= prevS));
    const p = inChord >= 0 ? { s: inChord, f: voicing.frets[inChord], midi: m } : nearestPos(inst, m, (lo + hi) / 2, prevS == null ? null : prevS + 1);
    prevS = p?.s ?? prevS;
    return p;
  });
}

/** Les posicions d'una escala (llista de classes de nota) en una caixa de 4 trasts. */
export function scaleBox(inst, pcs, rootPc) {
  let start = mod(rootPc - inst.tuning[0], 12);
  if (start > 9) start -= 12;
  const lo = Math.max(0, start - (start === 0 ? 0 : 1));
  const hi = lo + (start === 0 ? 3 : 4);
  const out = [];
  inst.tuning.forEach((open, s) => {
    for (let f = lo; f <= hi; f++) if (pcs.includes(mod(open + f, 12))) out.push({ s, f, midi: open + f, root: mod(open + f, 12) === rootPc });
  });
  return out;
}
