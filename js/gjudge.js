// El jutge de la guitarra i el baix (com el del joc de bateria): compara el que entra pel cable amb el que tocava.
//
// Cada cop esperat té una finestra de temps (el 45 % de la distància fins al cop veí, entre 70 i 140 ms).
// Quan arriba un atac dins la finestra:
//   perfect  a menys de 40 ms           good   més lluny però dins (aviat / tard)
//   i a més, si és una nota: la nota és la bona? Si és un acord: s'assembla a l'acord?
//   wrongnote / wrongchord   la nota o l'acord no són els bons     dirty   l'acord no sona net
// Fora de tota finestra: extra (cop de més). A una fletxa grisa (la mà passa sense tocar): air.
// Les notes lligades (hammer-on, pull-off) i el final dels bendings i glissandos no tenen atac: es mira si la nota hi és.
// Quan un cop passa sense atac: missed.

import { analyzeAt, onOnset, settings } from './listen.js';
import { chordScore } from './dsp.js';
import { INSTRUMENTS, stringNumber } from './fretboard.js';

const TOL = {
  facil: { win: 1.35, perfect: 0.06, ok: 0.8, near: 0.65, pitch: 0.7 },
  normal: { win: 1, perfect: 0.04, ok: 0.88, near: 0.75, pitch: 0.5 },
  exigent: { win: 0.8, perfect: 0.03, ok: 0.93, near: 0.82, pitch: 0.4 },
};
const NOTE_NAMES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const nn = (m) => NOTE_NAMES[((Math.round(m) % 12) + 12) % 12];

/**
 * instId: 'guitarra' | 'baix'. onVerdict(v) per a cada veredicte (per ensenyar-lo a la pantalla).
 */
export function createJudge(instId, { onVerdict } = {}) {
  const inst = INSTRUMENTS[instId];
  const T = TOL[settings().tol] ?? TOL.normal;
  const expected = [];
  const hits = [];
  const registered = new Set();
  let lastAccepted = -1;
  let prevChord = null;
  let alive = true;
  const inLat = () => settings().inLat ?? 0.02;

  /** Registra els cops d'un compàs. events: part del compàs; at(beat) → temps (rellotge de l'àudio, ja «sentit»). */
  function addBar(key, events, at, spq, abs0 = null) {
    if (registered.has(key)) return;
    registered.add(key);
    const list = [];
    for (const e of events) {
      if (!e) continue;
      const time = at(e.beat);
      const dur = (e.dur ?? 0.5) * spq;
      if (e.kind === 'strum') {
        // tot l'acord (també als cops amunt, que toquen menys cordes: les altres encara ressonen)
        const midis = (e.voicing?.midi?.length ? e.voicing.midi : e.notes ?? []).filter((m) => m != null);
        const change = prevChord != null && e.chord !== prevChord;
        if (!e.ghost) prevChord = e.chord;
        list.push({ type: e.ghost ? 'air' : 'strum', time, midis, chord: e.chord, change, bar: key });
      } else if (e.kind === 'note') {
        const midi = e.notes?.[0];
        const p = e.pos?.[0];
        const where = p ? `corda ${stringNumber(inst, p.s)}, trast ${p.f}` : '';
        const change = prevChord != null && e.chord && e.chord !== prevChord;
        if (e.chord) prevChord = e.chord;
        if (e.legato) list.push({ type: 'legato', time, midi, where, bar: key });
        else list.push({ type: 'note', time, midi, where, change, bar: key });
        if (e.tech && p) {
          const to = inst.tuning[p.s] + e.tech.to;
          if (e.tech.type === 'b') list.push({ type: 'legato', tech: 'b', time: time + dur * 0.6, midi: midi + (e.tech.semis ?? 2), where: 'el bending', bar: key });
          else if (e.tech.type === 's') list.push({ type: 'legato', tech: 's', time: time + dur * 0.75, midi: to, where: `trast ${e.tech.to}`, bar: key });
          else if ((e.tech.type === 'h' || e.tech.type === 'p') && !e.legatoNext) list.push({ type: 'legato', tech: e.tech.type, time: time + dur / 2, midi: to, where: `trast ${e.tech.to}`, bar: key });
        }
      }
    }
    // finestres segons la distància amb el cop veí
    const onsets = list.filter((x) => x.type !== 'legato').sort((a, b) => a.time - b.time);
    onsets.forEach((x, i) => {
      const gap = Math.min(onsets[i + 1] ? onsets[i + 1].time - x.time : 1, i ? x.time - onsets[i - 1].time : 1);
      x.win = Math.max(0.07, Math.min(0.14, gap * 0.45)) * T.win;
    });
    const t0 = at(0);
    for (const x of list) expected.push({ ...x, status: 'pending', win: x.win ?? 0.12, abs: abs0 == null ? null : abs0 + (x.time - t0) / spq, spq });
  }

  const offOnset = onOnset(({ t: tin }) => {
    if (!alive) return;
    const t = tin - inLat();
    let best = null;
    for (const e of expected) {
      if (e.status !== 'pending' || e.type === 'legato') continue;
      const dt = t - e.time;
      if (Math.abs(dt) > e.win) continue;
      if (!best || Math.abs(dt) < Math.abs(best.dt)) best = { e, dt };
    }
    if (!best) {
      // els rascats i les notes fan més d'un pic: just després d'un cop bo no és un cop de més
      if (t - lastAccepted < 0.12) return;
      // un hammer-on o un pull-off també pot sonar com un atac: no és un cop de més
      if (expected.some((e) => e.type === 'legato' && Math.abs(t - e.time) < 0.12)) return;
      if (!expected.some((e) => Math.abs(e.time - t) < 1.5)) return; // fora de la part que es jutja
      hits.push({ kind: 'extra', time: t });
      onVerdict?.({ kind: 'extra' });
      return;
    }
    const { e, dt } = best;
    lastAccepted = t;
    if (e.type === 'air') {
      e.status = 'air';
      hits.push({ kind: 'air', time: t });
      onVerdict?.({ kind: 'air', dt });
      return;
    }
    e.status = 'analysing';
    e.dt = dt;
    const timing = Math.abs(dt) <= T.perfect ? 'perfect' : 'good';
    analyzeAt(tin + 0.012, { pitch: e.type === 'note', chord: e.type === 'strum' }).then((res) => {
      if (!alive) return;
      let kind = timing;
      if (e.type === 'note' && res?.midi != null && res.conf >= 0.6) {
        const d = res.midi - e.midi;
        const oct = Math.abs(d - 12 * Math.round(d / 12));
        e.got = res.midi;
        if (oct > T.pitch) kind = 'wrongnote';
      } else if (e.type === 'strum' && res?.chroma && e.midis.length) {
        const { rel } = chordScore(res.chroma, e.midis);
        e.sim = rel;
        if (rel < T.near) kind = 'wrongchord';
        else if (rel < T.ok) kind = 'dirty';
      }
      e.status = kind;
      hits.push({ kind, time: t, dt });
      onVerdict?.({ kind, dt, exp: e, got: e.got });
    });
  });

  /** A cada fotograma: els cops que ja han passat sense atac, i les notes lligades. `now` = temps sentit. */
  function tick(now) {
    for (const e of expected) {
      if (e.status !== 'pending') continue;
      if (e.type === 'legato') {
        if (now > e.time + 0.2) {
          e.status = 'analysing';
          analyzeAt(e.time + inLat() + 0.02, { pitch: true }).then((res) => {
            if (!alive) return;
            const ok = res?.midi != null && res.conf >= 0.5 && Math.abs((res.midi - e.midi) - 12 * Math.round((res.midi - e.midi) / 12)) <= T.pitch + 0.2;
            e.status = ok ? 'good' : 'missed';
            e.got = res?.midi;
            onVerdict?.({ kind: ok ? 'legato-ok' : 'legato-miss', exp: e });
          });
        }
        continue;
      }
      if (now > e.time + e.win + 0.03) {
        if (e.type === 'air') { e.status = 'skip'; continue; }
        e.status = 'missed';
        onVerdict?.({ kind: 'missed', exp: e });
      }
    }
  }

  function summary() {
    const done = expected.filter((e) => e.type !== 'air' && !['pending', 'analysing', 'skip'].includes(e.status));
    const n = done.length;
    const c = (s) => done.filter((e) => e.status === s).length;
    const perfect = c('perfect');
    const good = c('good');
    const dirty = c('dirty');
    const wrongnote = c('wrongnote');
    const wrongchord = c('wrongchord');
    const missed = c('missed');
    const extras = hits.filter((h) => h.kind === 'extra').length;
    const air = hits.filter((h) => h.kind === 'air').length;
    const score = n ? Math.max(0, Math.min(1, (perfect + 0.85 * good + 0.5 * dirty + 0.25 * (wrongnote + wrongchord) - 0.4 * extras - 0.3 * air) / n)) : 0;
    const level = score >= 0.9 ? 'ok' : score >= 0.75 ? 'gairebe' : 'no';
    const dts = done.filter((e) => e.dt != null).map((e) => e.dt * 1000);
    const mean = dts.length ? dts.reduce((a, b) => a + b, 0) / dts.length : 0;
    const sd = dts.length > 1 ? Math.sqrt(dts.reduce((a, b) => a + (b - mean) ** 2, 0) / (dts.length - 1)) : 0;
    const onTime = done.filter((e) => e.status !== 'missed' && e.dt != null && Math.abs(e.dt) <= 0.06).length;
    const timed = done.filter((e) => e.type !== 'legato').length;
    const pitched = done.filter((e) => e.type === 'note' || e.type === 'strum');
    const right = pitched.filter((e) => ['perfect', 'good'].includes(e.status)).length;
    // on falla: als canvis d'acord?
    const changes = done.filter((e) => e.change);
    const badAtChange = changes.filter((e) => !['perfect', 'good'].includes(e.status)).length;
    const others = done.filter((e) => !e.change);
    const badOther = others.filter((e) => !['perfect', 'good'].includes(e.status)).length;
    const tech = done.filter((e) => e.type === 'legato');
    const techBad = tech.filter((e) => e.status === 'missed').length;

    const gaps = [];
    const tips = [];
    if (n && missed > n * 0.3) { gaps.push('banda'); tips.push('Molts cops han passat sense sonar: baixa el tempo i torna-hi.'); }
    if (dts.length >= 6 && Math.abs(mean) > 25) { gaps.push('pols'); tips.push(mean < 0 ? 'Vas una mica avançat: escolta la bateria i deixa que el cop caigui amb ella.' : 'Vas una mica endarrerit: prepara la mà abans del cop.'); }
    else if (dts.length >= 6 && sd > 45) { gaps.push('ritme'); tips.push('El temps va i ve: compta en veu alta o encén el metrònom.'); }
    else if (dts.length >= 6 && sd < 22) tips.push('El temps és molt regular. Molt bé!');
    if (changes.length >= 2 && badAtChange / changes.length >= 0.5 && (others.length ? badOther / others.length : 0) <= 0.25) { gaps.push('canvi'); tips.push('El que més falla és el primer cop després de cada canvi d\'acord: mou la mà una mica abans.'); }
    if (instId === 'guitarra' && (dirty + wrongchord) > Math.max(1, n * 0.25)) { gaps.push('forma'); tips.push('Hi ha acords que no sonen nets: comprova\'ls amb «Corda a corda».'); }
    if (wrongnote > Math.max(1, n * 0.2)) { gaps.push('notes'); tips.push('Algunes notes no eren les bones: mira al mànec on cau cada nota abans de tocar.'); }
    if (air >= 2) { gaps.push(instId === 'guitarra' ? 'dreta' : 'ritme'); tips.push('Has tocat on la mà havia de passar sense tocar (fletxes grises): la mà es mou, però no toca la corda.'); }
    if (extras > Math.max(2, n * 0.15)) tips.push('Hi ha cops de més: toca només on la carta o la pista ho diuen.');
    if (tech.length >= 2 && techBad / tech.length > 0.4) { gaps.push('tecnica'); tips.push('El recurs tècnic no sempre arriba a la nota: fes-lo sol, molt lent.'); }

    return { n, timed, strums: pitched.filter((e) => e.type === 'strum').length, perfect, good, dirty, wrongnote, wrongchord, missed, extras, air, score, level, meanMs: mean, sdMs: sd, onTime, right, pitched: pitched.length, gaps: [...new Set(gaps)], tips };
  }

  function destroy() { alive = false; offOnset(); }

  return { addBar, tick, summary, destroy, expected, hits, noteName: nn };
}

/** El text curt de cada veredicte (sobre l'escenari). */
export function verdictText(v, instId) {
  switch (v.kind) {
    case 'perfect': return 'Perfecte!';
    case 'good': return v.dt < 0 ? 'Una mica aviat' : 'Una mica tard';
    case 'dirty': return 'L\'acord no sona net';
    case 'wrongchord': return `Era ${v.exp?.chord ?? 'un altre acord'}`;
    case 'wrongnote': return `Era ${nn(v.exp.midi)}${v.exp.where ? ` (${v.exp.where})` : ''}`;
    case 'missed': return instId === 'baix' || v.exp?.type === 'note' ? 'No ha sonat' : 'No ha sonat';
    case 'extra': return 'Cop de més';
    case 'air': return 'Aquí la mà no toca';
    case 'legato-ok': return v.exp?.tech === 'b' ? 'Bending!' : v.exp?.tech === 's' ? 'Glissando!' : 'Lligat!';
    case 'legato-miss': return `No arriba a ${nn(v.exp.midi)}`;
    default: return '';
  }
}
export const verdictClass = (k) => ({ perfect: 'ok', good: 'ok', 'legato-ok': 'ok', dirty: 'mid', missed: 'bad', wrongnote: 'bad', wrongchord: 'bad', extra: 'bad', air: 'bad', 'legato-miss': 'bad' }[k] ?? '');
