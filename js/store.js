// Què es guarda al navegador: qui toca, com li ha anat cada pas, les seves cançons i la configuració.
// Si el navegador no deixa guardar (mode privat), el joc funciona igual i només s'oblida en tancar.

const KEY = 'rockin.guitarrabaix.v1';
const blank = () => ({ players: {}, current: null, settings: { thickTop: true, metronome: false, guide: 0, chordBox: true } });

let data = blank();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) data = { ...blank(), ...JSON.parse(raw) };
  data.settings = { ...blank().settings, ...(data.settings ?? {}) };
} catch {
  data = blank();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sense lloc on guardar */ }
}

export const settings = () => data.settings;
export const players = () => Object.keys(data.players).sort((a, b) => a.localeCompare(b, 'ca'));
export const currentName = () => data.current;

export function player(name = data.current) {
  if (!name) return null;
  const p = (data.players[name] ??= { inst: 'guitarra', steps: {}, songs: [], created: Date.now() });
  p.steps ??= {}; p.songs ??= []; p.inst ??= 'guitarra';
  return p;
}

export function setCurrent(name) { data.current = name; player(name); save(); }
export function removePlayer(name) { delete data.players[name]; if (data.current === name) data.current = null; save(); }
export function setInstrument(inst) { const p = player(); if (p) { p.inst = inst; save(); } }
export const instrumentOf = () => player()?.inst ?? 'guitarra';

/** status: 'no' (encara no), 'gairebe', 'ok' */
export function markStep(id, status, tempo) {
  const p = player();
  if (!p) return null;
  const s = (p.steps[id] ??= { status: null, tempo: 0, attempts: 0, best: null });
  s.attempts++;
  s.status = status;
  const rank = { no: 0, gairebe: 1, ok: 2 };
  if (s.best == null || rank[status] > rank[s.best] || (status === s.best && tempo > s.tempo)) { s.best = status; s.tempo = tempo; }
  s.last = Date.now();
  save();
  return s;
}
export const stepState = (id) => player()?.steps[id] ?? null;

export const songs = () => player()?.songs ?? [];
export function saveSong(song) {
  const p = player();
  if (!p) return;
  song.id ??= `s${Date.now().toString(36)}`;
  const i = p.songs.findIndex((s) => s.id === song.id);
  if (i >= 0) p.songs[i] = song; else p.songs.unshift(song);
  save();
  return song;
}
export function deleteSong(id) { const p = player(); if (!p) return; p.songs = p.songs.filter((s) => s.id !== id); save(); }
