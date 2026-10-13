// La biblioteca compartida del Generador de diagrames (https://rockin-cat.github.io/Generador-diagrames/):
// les cançons que el professorat hi comparteix. El mateix codi que els jocs de teclat i bateria.

import { parseChord, progressionText } from './theory.js';

export const LIBRARY_URL = 'https://script.google.com/macros/s/AKfycbw2lhxNhxvT2EJGhQhpFlOAhT3M_RIrqN_tDQS0oChLULzyeX5dOP_HZLehm6SfXeWS/exec';
const CODE_KEY = 'rockin.play.biblio.codi';

export function savedCode() { try { return localStorage.getItem(CODE_KEY) ?? ''; } catch { return ''; } }
export function saveCode(code) { try { if (code) localStorage.setItem(CODE_KEY, code); else localStorage.removeItem(CODE_KEY); } catch { /* */ } }

async function ask(params) {
  let json;
  try {
    const res = await fetch(`${LIBRARY_URL}?${new URLSearchParams(params)}`);
    json = await res.json();
  } catch { throw new Error('xarxa'); }
  if (!json.ok) { if (json.error === 'codi') saveCode(''); throw new Error(json.error || 'error'); }
  return json;
}

export async function listLibrary(code) {
  const json = await ask({ codi: code });
  return (json.llista ?? []).slice().sort((a, b) => String(b.data).localeCompare(String(a.data)));
}
export async function loadLibrarySong(code, id) { return (await ask({ codi: code, id })).canco; }

export function errorText(error) {
  return {
    codi: 'El codi del professorat no és correcte.',
    'no-trobada': 'Aquesta cançó ja no és a la biblioteca.',
    format: 'Aquesta cançó no té acords que el joc pugui tocar.',
    xarxa: 'No s\'ha pogut connectar amb la biblioteca. Comprova la connexió a internet.',
  }[error?.message] ?? 'No s\'ha pogut obrir la biblioteca.';
}

const ok = (t) => { const c = parseChord(String(t ?? '').trim()); return c ? c.symbol : null; };

/** Un compàs del Generador ({ div, cells }) → «C» o «C G» (si canvia a mig compàs). */
function barText(bar) {
  const cells = (Array.isArray(bar?.cells) ? bar.cells : []).map(ok);
  if (!cells.some(Boolean)) return null;
  // omplim els buits amb l'acord anterior
  let last = null;
  const filled = cells.map((c) => (last = c ?? last));
  const half = Math.ceil(filled.length / 2);
  const a = filled.slice(0, half).find(Boolean) ?? filled.find(Boolean);
  const b = filled.slice(half).reverse().find(Boolean) ?? a;
  const firstHalf = new Set(filled.slice(0, half).filter(Boolean));
  const secondHalf = new Set(filled.slice(half).filter(Boolean));
  if (firstHalf.size <= 1 && secondHalf.size <= 1 && a !== b && filled.length > 1) return `${a} ${filled.slice(half).find(Boolean)}`;
  return filled.find(Boolean);
}

/** Una cançó del Generador → { titol, prog, metre, tempo, estil }. */
export function songFromLibrary(song, entry) {
  const est = song?.estructura ?? {};
  const parts = [];
  for (const part of est.parts ?? []) {
    let bars = Array.isArray(part.compassos) && part.compassos.length ? part.compassos.map(barText).filter(Boolean) : [];
    if (!bars.length) bars = String(part.acords ?? '').split('|').map((ch) => ch.split(/[\s,]+/).map(ok).filter(Boolean)[0]).filter(Boolean);
    if (bars.length) parts.push({ name: String(part.nom ?? '').replace(/^PART\s+/i, '').trim() || 'A', bars });
  }
  let order = [];
  const wanted = String(est.ordre ?? '').split(/[–\-—>,]+/).map((s) => s.trim()).filter(Boolean);
  for (const w of wanted) {
    const hit = parts.find((p) => p.name.toLowerCase() === w.toLowerCase()) ?? parts.find((p) => p.name.toLowerCase().startsWith(w.toLowerCase()));
    if (hit) order.push(hit);
  }
  if (!order.length) order = parts;
  let prog = order.length > 1 || (order[0] && order[0].name !== 'A') ? progressionText(order.map((p) => ({ name: p.name, bars: p.bars.slice(0, 64) }))) : order.flatMap((p) => p.bars).join(' | ');
  if (!prog) prog = String(song?.acords ?? '').split(/[\s,|]+/).map(ok).filter(Boolean).join(' | ');
  if (!prog) throw new Error('format');
  const temps = String(est.temps ?? '4');
  const metre = { 3: '3/4', 2: '2/4', 6: '6/8' }[temps] ?? '4/4';
  const text = String(est.estil ?? '').toLowerCase();
  const words = [['reggaeton', 'reggaeton'], ['funk', 'funk'], ['reggae', 'reggae'], ['rumba', 'rumba'], ['blues', 'shuffle'], ['shuffle', 'shuffle'], ['balada', 'balada'], ['rock', 'rock'], ['pop', 'pop'], ['vals', 'vals']];
  let estil = null;
  for (const [w, id] of words) if (text.includes(w)) { estil = id; break; }
  return {
    titol: song?.titol || entry?.titol || entry?.nom || 'Cançó de la biblioteca',
    artista: song?.artista || entry?.artista || '',
    prog,
    metre,
    tempo: Math.max(40, Math.min(200, parseInt(est.tempo, 10) || 90)),
    estil,
  };
}
