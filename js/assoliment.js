// Nivell d'assoliment: En procés / A prop / Ja ho tens!, què t'ha faltat i què pots fer.
// Els valors desats continuen sent 'no' | 'gairebe' | 'ok' (compatibles amb el progrés que ja hi havia).

export const NIVELLS = { no: 'En procés', gairebe: 'A prop', ok: 'Ja ho tens!' };
const RANK = { no: 0, gairebe: 1, ok: 2 };

/** Un pas compta com a fet a partir d'«A prop». */
export const reached = (s) => RANK[s?.best] >= 1;

const escH = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const pill = (status, extra = '') => (status && NIVELLS[status] ? `<span class="lvl-pill lvl-${status}${extra ? ` ${extra}` : ''}">${escH(NIVELLS[status])}</span>` : '<span class="lvl-pill lvl-none">Per fer</span>');

/**
 * Les coses que poden haver fallat. `base`: el pas (per instrument) que treballa aquella habilitat.
 * Els consells reaprofiten els que ja surten als passos.
 */
export const GAPS = {
  canvi: {
    t: 'Canviar d\'acord a temps',
    tips: ['Comença a moure la mà just abans del canvi: el contorn del mànec t\'avisa de l\'acord següent.', 'Practica només el pas d\'un acord a l\'altre, sense ritme, fins que els dits hi vagin sols.'],
    base: { guitarra: 'g1b', baix: 'b1b' },
  },
  forma: {
    t: 'Posar l\'acord i que soni net',
    tips: ['Comprova-ho amb «Corda a corda»: trobaràs la corda que no sona.', 'Arqueja els dits i prem just darrere del trast, no a sobre.'],
    base: { guitarra: 'g1d' },
  },
  notes: {
    t: 'Trobar les notes / el traste',
    tips: ['Abans de tocar, mira al mànec on cau la primera nota de cada acord.', 'Els números del mànec diuen quina nota de l\'acord és: l\'1 és la fonamental.'],
    base: { guitarra: 'g1a', baix: 'b1a' },
  },
  ritme: {
    t: 'Mantenir el ritme de la carta',
    tips: ['Digues el ritme en veu alta abans de tocar-lo («ta, ta, silenci, ta…»).', 'Mira la carta i la pista alhora: cada símbol és un cop; on no n\'hi ha, la mà calla.'],
    base: { guitarra: 'g2a', baix: 'b2a' },
  },
  pols: {
    t: 'Mantenir el pols',
    tips: ['Encén el metrònom i compta els temps per dins.', 'Escolta el bombo de la bateria: és el teu punt de referència.'],
    base: { guitarra: 'g4a', baix: 'b1b' },
  },
  banda: {
    t: 'Seguir la banda sense perdre\'m',
    tips: ['Si et perds, no t\'aturis: espera el primer temps del compàs següent i torna a entrar.', 'Escolta primer la banda sense tocar («Només escolta») i fixa\'t en la bateria.'],
    base: { guitarra: 'g1b', baix: 'b1b' },
  },
  dreta: {
    t: 'La mà dreta (púa / ritme)',
    tips: ['La mà va amunt i avall tota l\'estona, com un pèndol; només canvia quan toca la corda.', 'Prova «Només mà dreta»: la carta i les fletxes en gran, sense el mànec.'],
    base: { guitarra: 'g3a' },
  },
  dits: {
    t: 'La mà dreta (alternar els dits)',
    tips: ['Alterna índex i mig sense pensar-hi: índex, mig, índex, mig.', 'Fes-ho primer a una corda a l\'aire, sense la mà esquerra.'],
    base: { baix: 'b1c' },
  },
  on: {
    t: 'Saber on som de la cançó',
    tips: ['Mira l\'estructura de la cançó a la pantalla d\'inici: quantes vegades es repeteix cada part.', 'Compta els compassos de cada part en veu alta mentre escoltes.'],
  },
  veu: {
    t: 'Cantar i tocar alhora',
    tips: ['Torna a les rodones a l\'instrument: quan la veu vagi sola, afegeix-hi més cops.', 'Escolta la demostració unes quantes vegades abans de tocar.'],
    base: { guitarra: 'g4a', baix: 'b4a' },
  },
  tecnica: {
    t: 'El recurs tècnic (hammer-on, glissando…)',
    tips: ['Fes el recurs sol, molt lent, abans de posar-lo dins la cançó.', 'Hammer-on: deixa caure el dit amb força, de punta. Glissando: no deixis de fer pressió.'],
    base: { guitarra: 'g8a', baix: 'b8a' },
  },
  encaixa: {
    t: 'Trobar notes que encaixin',
    tips: ['Torna a les notes de l\'acord: les marcades al mànec sempre encaixen.', 'Comença i acaba les frases a la fonamental.'],
    base: { guitarra: 'g10a', baix: 'b10a' },
  },
  espai: {
    t: 'Deixar espais (frases i silencis)',
    tips: ['Poques notes i ben col·locades valen més que moltes.', 'Toca dos compassos i calla dos: la banda omple l\'espai.'],
  },
  resposta: {
    t: 'Respondre a la pregunta',
    tips: ['La resposta pot repetir el ritme de la pregunta amb altres notes.', 'Escolta la pregunta sencera abans de començar a respondre.'],
    base: { guitarra: 'g10c', baix: 'b10c' },
  },
};

/** Què pot haver fallat, segons el tipus de pas. */
export function gapsFor(step, instId) {
  const kind = step.kind ?? 'play';
  const t = step.part?.type;
  const out = [];
  if (kind === 'improv') {
    out.push('encaixa', 'espai');
    if (step.mode === 'qa') out.push('resposta');
    out.push('banda', 'pols');
    if (step.mode === 'free') out.push('on');
    return out;
  }
  const chords = new Set(String(step.prog ?? '').replace(/\[[^\]]*\]/g, ' ').split(/[|\s]+/).filter(Boolean)).size;
  const card = step.carta ?? step.part?.card;
  if (chords > 1 && t !== 'riff') out.push('canvi');
  if (instId === 'guitarra' && (t === 'strum' || t === 'rascat')) out.push('forma');
  if (instId === 'baix' || t === 'arp' || t === 'riff' || t === 'techroot' || t === 'linia' || kind === 'compose') out.push('notes');
  if (t === 'riff' || t === 'techroot') out.push('tecnica');
  if (step.voice) out.push('veu');
  out.push(card || kind === 'compose' || t === 'rascat' ? 'ritme' : 'pols');
  if (instId === 'guitarra' && t !== 'riff' && t !== 'techroot') out.push('dreta');
  if (instId === 'baix') out.push('dits');
  out.push('banda');
  if (step.usesSong) out.push('on');
  return out;
}

/** Els consells, a partir del que ha fallat (màxim dos per cosa, sense repetir). */
export function tipsFor(gaps) {
  const seen = new Set();
  const out = [];
  for (const g of gaps) for (const tip of (GAPS[g]?.tips ?? []).slice(0, gaps.length > 2 ? 1 : 2)) if (!seen.has(tip)) { seen.add(tip); out.push(tip); }
  return out;
}

export const gapText = (g) => GAPS[g]?.t ?? g;
