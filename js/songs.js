// Totes les cançons que el joc sap obrir:
//  · el Llibre de temes ROCKIN (el mateix del joc de teclat; es llegeix el publicat i, si no hi arriba, la còpia local)
//  · les rodes de cançons del joc de teclat («Cançons i estructura»)
//  · les cançons fetes o obertes al joc de teclat en aquest navegador (rockin.play.paths)
//  · la biblioteca compartida del Generador de diagrames (vegeu library.js), que és la mateixa que fan servir els jocs de teclat i bateria
// Totes es tornen com { titol, artista, prog ('[A] C | G | …'), metre, tempo, estil, font }.

import { SONGBOOK as LOCAL_BOOK } from './data/llibre.js';
import { progressionText } from './theory.js';
import { STYLES } from './band.js';

// el joc de teclat es publica al repositori rockin-cat/teclat
const PUBLISHED_BOOK = 'https://rockin-cat.github.io/teclat/js/songbook.js';

/** Estils del joc de teclat → estils d'aquest joc. */
const STYLE_MAP = { rock: 'rock', shuffle: 'shuffle', ballad: 'balada', swing: 'shuffle', bossa: 'pop', funk: 'funk', reggaeton: 'reggaeton', rumba: 'rumba', reggae: 'reggae', ska: 'rumba', cumbia: 'rumba', hiphop: 'funk', vals: 'vals', metronome: 'metronom' };
export function mapStyle(style, metre) {
  const id = STYLE_MAP[style] ?? style;
  if (STYLES[id]?.metres.includes(metre)) return id;
  return { '3/4': 'vals', '6/8': 'balada68', '12/8': 'balada68' }[metre] ?? 'pop';
}

/** Una cançó amb parts i ordre (format del joc de teclat) → progressió amb noms de part. */
function fromParts(parts, order) {
  const names = order?.length ? order : Object.keys(parts ?? {});
  return progressionText(names.filter((n) => parts[n]).map((n) => ({ name: n, bars: String(parts[n]).split('|').map((b) => b.trim()).filter(Boolean) })));
}

let bookCache = null;
export async function songbook() {
  if (bookCache) return bookCache;
  let list = LOCAL_BOOK;
  try {
    const mod = await import(/* @vite-ignore */ `${PUBLISHED_BOOK}?v=${Math.floor(Date.now() / 600000)}`);
    if (Array.isArray(mod.SONGBOOK) && mod.SONGBOOK.length) list = mod.SONGBOOK;
  } catch { /* sense xarxa o en local: la còpia */ }
  bookCache = list.map((s) => ({
    id: s.id, titol: s.name, artista: s.artist, font: 'llibre', nota: s.note ?? '',
    prog: fromParts(s.parts, s.order), metre: '4/4', tempo: s.tempo, estil: mapStyle(s.style, '4/4'),
  }));
  return bookCache;
}

/** Les rodes de cançons del joc de teclat (nivell «Cançons i estructura»). */
export const WHEELS = [
  { id: 'roda-1', titol: 'La m – Fa – Do – Sol', artista: 'Com a «Despacito» o «Hello» d\'Adele', prog: 'Am | F | C | G', estil: 'reggaeton', tempo: 90 },
  { id: 'roda-2', titol: 'Do – La m – Fa – Sol', artista: 'Els anys 50: «Stand By Me», «Perfect»', prog: 'C | Am | F | G', estil: 'balada', tempo: 66 },
  { id: 'roda-3', titol: 'Fa – Sol – Do – La m', artista: 'Com a «Viva la Vida» de Coldplay', prog: 'F | G | C | Am', estil: 'rock', tempo: 80 },
  { id: 'roda-4', titol: 'La m – Sol – Fa – Sol', artista: 'Com a «My Heart Will Go On»', prog: 'Am | G | F | G', estil: 'balada', tempo: 66 },
  { id: 'roda-5', titol: 'Do – Sol – La m – Fa', artista: 'Com a «Poker Face» de Lady Gaga', prog: 'C | G | Am | F', estil: 'funk', tempo: 90 },
  { id: 'roda-6', titol: 'Estrofa i tornada', artista: 'Dues rodes que s\'alternen', prog: '[Estrofa] Am | F | C | G | [Tornada] C | G | Am | F | [Estrofa] Am | F | C | G | [Tornada] C | G | Am | F', estil: 'rock', tempo: 90 },
].map((w) => ({ ...w, metre: '4/4', font: 'teclat' }));

/**
 * Les cançons que s'han fet o obert al joc de teclat en aquest mateix navegador.
 * Només hi són quan els dos jocs s'obren des de la mateixa adreça (rockin-cat.github.io).
 */
export function keyboardSongs() {
  let specs = [];
  try { specs = JSON.parse(localStorage.getItem('rockin.play.paths') ?? '[]'); } catch { specs = []; }
  if (!Array.isArray(specs)) return [];
  return specs.filter((s) => s && (s.progression || s.parts)).map((s) => {
    const metre = ['4/4', '3/4', '2/4', '6/8', '12/8'].includes(s.meter) ? s.meter : '4/4';
    let prog;
    if (s.parts && Object.keys(s.parts).length) prog = fromParts(s.parts, s.order);
    else if (s.chorus) prog = `[Estrofa] ${s.progression} | [Tornada] ${s.chorus}`;
    else prog = s.progression;
    return {
      id: `teclat:${s.id}`, titol: s.name || s.progression, artista: s.artist ?? '', font: String(s.id).startsWith('biblio:') ? 'teclat-biblio' : 'teclat',
      prog, metre, tempo: s.tempo || 90, estil: mapStyle(s.style, metre),
    };
  });
}
