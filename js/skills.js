// «Què sé fer»: el que s'ha desbloquejat al joc i què vol dir per a la banda.

import { LEVELS, stepFits } from './levels.js';
import { cardById, cardMetre } from './data/cartes.js';
import * as store from './store.js';
import { reached } from './assoliment.js';

/** Què pots fer a la banda quan tens un nivell (per instrument). */
export const BANDA = {
  guitarra: {
    2: 'Pots canviar el ritme de l\'acompanyament segons la part de la cançó: una estrofa més tranquil·la, una tornada més plena.',
    3: 'Pots fer de guitarra rítmica: el rascat dona el groove a la banda i encaixa amb la bateria.',
    4: 'Pots cantar i tocar alhora: pots fer de cantant-guitarrista o fer cors mentre toques.',
    5: 'Pots fer arpegis: intros, ponts i parts suaus on la guitarra fa melodia amb els acords.',
    6: 'Pots tocar qualsevol acord a qualsevol trast: si la banda canvia de tonalitat, t\'hi adaptes.',
    7: 'Pots afinar la guitarra sense ajuda abans d\'assajar: la banda sona afinada.',
    8: 'Pots adornar riffs i frases amb hammer-on, pull-off, glissando i bending.',
    9: 'Pots proposar una introducció o un solo per a la cançó del grup.',
    10: 'Pots fer un solo: la banda et deixa un espai i hi improvises.',
  },
  baix: {
    1: 'Pots fer la base de la cançó: el baix marca els canvis d\'acord i sosté la banda amb la bateria.',
    2: 'Pots encaixar el baix amb el bombo amb ritmes diferents a cada part.',
    3: 'Pots donar energia a la cançó amb les octaves (rock, disco, funk).',
    4: 'Pots cantar i tocar alhora: pots fer cors mentre toques.',
    5: 'Pots fer línies amb la 1a, la 3a i la 5a: el baix ja camina entre els acords.',
    6: 'Pots fer línies melòdiques: intros i ponts on el baix és protagonista.',
    7: 'Pots afinar el baix sense ajuda abans d\'assajar.',
    8: 'Pots adornar la línia amb hammer-on, glissando i bending.',
    9: 'Pots proposar una introducció o una línia nova per a la cançó.',
    10: 'Pots fer un solo de baix sobre la roda de la cançó.',
  },
};

/** El text del nivell 1 de guitarra depèn de com toques els acords. */
function guitarLevel1(mode) {
  if (typeof mode === 'string') return 'Toques tots els acords amb celleta.';
  if (mode.type === 'power') {
    return [
      'Marques els canvis d\'acord amb una nota a la corda 6: ja pots tocar amb la banda seguint la roda, com un baix greu.',
      'Toques power chords de dues notes (1 i 5): fas la base rítmica d\'un grup de rock.',
      'Toques power chords sencers (1, 5 i 8): fas de guitarra rítmica d\'un grup de rock.',
    ][mode.parts - 1];
  }
  if (mode.cordes >= 6) return 'Toques els acords oberts sencers: fas tot el coixí harmònic de la cançó.';
  return `Toques els acords oberts amb ${mode.cordes === 1 ? 'la corda 1' : `les cordes 1 a ${mode.cordes}`}: acompanyes la cançó amb un so lleuger, per sobre de la resta de la banda.`;
}

/** Resum de tot el que ha desbloquejat qui toca, nivell a nivell. */
export function summary(instId) {
  const ws = store.workSong();
  const metre = ws?.metre ?? '4/4';
  const levels = LEVELS[instId].map((l) => {
    const steps = l.passos.filter((p) => stepFits(p, metre, (id) => cardMetre(cardById(id))));
    const ok = steps.filter((p) => store.stepState(p.id)?.best === 'ok');
    const almost = steps.filter((p) => store.stepState(p.id)?.best === 'gairebe');
    // cartes que surten (passos «Totes les cartes» i cartes dels passos)
    const cards = [];
    for (const p of steps) {
      if (store.stepState(p.id)?.best === 'ok' && p.carta) cards.push(p.carta);
      if (p.kind === 'cards') for (const [k, v] of Object.entries(store.player()?.steps ?? {})) if (k.startsWith(`${p.id}:`) && reached(v)) cards.push(k.split(':')[1]);
    }
    let banda = BANDA[instId][l.n] ?? '';
    if (instId === 'guitarra' && l.n === 1) {
      // el pas més avançat que surt (els passos van en ordre: un dit → power chord → acords oberts)
      const last = [...ok, ...almost].sort((a, b) => steps.indexOf(a) - steps.indexOf(b)).filter((p) => p.chordMode && typeof p.chordMode === 'object').at(-1);
      banda = last ? guitarLevel1(last.chordMode) : '';
    }
    // un pas compta com a fet a partir d'«A prop»; els de «Totes les cartes», quan alguna carta ho és
    const doneSteps = steps.filter((p) => reached(store.stepState(p.id)) || (p.kind === 'cards' && Object.entries(store.player()?.steps ?? {}).some(([k, v]) => k.startsWith(`${p.id}:`) && reached(v))) || (p.grup ?? '').startsWith('Acords oberts'));
    return { level: l, steps, ok, almost, cards: [...new Set(cards)], banda, unlocked: ok.length + almost.length > 0, doneCount: doneSteps.length, done: steps.length && doneSteps.length === steps.length };
  });
  return { levels, song: ws };
}
