// La mini explicació de cada nivell: en entrar-hi per primera vegada, una animació curta (amb so)
// ensenya a llegir les cartes o la pantalla d'aquell nivell. Es pot tornar a veure amb el botó ⓘ.

import { createNeck, chordBox } from './neck.js';
import { INSTRUMENTS, guitarVoicing, powerRoot6, bassRole, scaleBox } from './fretboard.js';
import { parseChord, metre, pentatonic, mod } from './theory.js';
import { tone, resumeAudio, loadSet, audioContext, click, drum } from './audio.js';
import { cardById } from './data/cartes.js';
import { cardGeometry, ballAt, paintBall, canvasCtx } from './cardball.js';
import { settings, chordMode } from './store.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const M4 = metre('4/4');

// ---- so --------------------------------------------------------------------------------------------------------
async function ready(inst) { await resumeAudio(); await loadSet(inst.sound); }
function note(inst, midi, dur = 0.8, gain = 0.6) { ready(inst).then(() => tone(inst.sound, midi, 0, dur, { gain, dest: 'me' })); }
function strum(inst, midis, { dir = 'D', dur = 1, gain = 0.45 } = {}) {
  const list = midis.filter((m) => m != null);
  if (dir === 'U') list.reverse();
  ready(inst).then(() => { const t = audioContext().currentTime + 0.01; list.forEach((m, i) => tone(inst.sound, m, t + i * 0.012, dur, { gain, dest: 'me' })); });
}
function tick(accent) { resumeAudio().then(() => { click(audioContext().currentTime + 0.01, accent); drum('stick', audioContext().currentTime + 0.01, { vel: accent ? 1 : 0.8 }); }); }

// ---- peces ------------------------------------------------------------------------------------------------------
const lead = (t) => `<p class="in-lead">${t}</p>`;
const tags = (list) => `<div class="gtags">${list.map(([sym, t]) => `<span class="gtag">${sym}<small>${t}</small></span>`).join('')}</div>`;

/** Una carta amb la pilota que hi bota; `onHit(i)` a cada cop. Torna { el, start }. */
function cardBall(card, moves, { onHit, bpm = 84 } = {}) {
  const el = h(`<div class="in-card"><div class="wv-cardbox">${card ? `<img src="${card.img}" alt="">` : ''}<canvas class="wv-ph"></canvas></div></div>`);
  const g = cardGeometry(card, M4);
  const cv = el.querySelector('canvas');
  const spb = 60 / bpm;
  const hits = (card?.strum ? [...card.strum].map((m, i) => (m !== m.toLowerCase() ? (i * 4) / card.strum.length : null)).filter((x) => x != null)
    : card?.contour ? card.contour.flat().map((_, i, a) => (i * 4) / a.length)
      : card?.notes ? card.notes.map(([a]) => a) : [0, 1, 2, 3]);
  let last = -1;
  const frame = (sec) => {
    const beat = (sec / spb) % 4;
    const cc = canvasCtx(cv);
    if (!cc) return;
    paintBall(cc.c, ballAt(g, cc.W, cc.H, M4, beat));
    const k = Math.floor(sec / spb / 4) * 100 + hits.filter((b) => b <= beat + 1e-3).length;
    if (k !== last) { const idx = hits.filter((b) => b <= beat + 1e-3).length - 1; if (idx >= 0 && k > last) onHit?.(idx); last = k; }
  };
  return { el, frame };
}

export const INTROS = {
  guitarra: {
    1: {
      t: 'La roda d\'acords',
      build(el, inst, loop) {
        const power = typeof chordMode() === 'object' && chordMode()?.type === 'power' || chordMode() == null;
        el.innerHTML = lead(power ? 'Cada fitxa, un acord: <b>el número és el trast</b> a la corda 6.' : 'Cada fitxa, un acord: <b>el diagrama són els dits</b>.');
        const chords = ['G', 'D', 'Em', 'C'].map((c) => parseChord(c));
        const vs = chords.map((c) => (power ? powerRoot6(c, 3) : guitarVoicing(c)));
        const row = h(`<div class="wv-row" style="--n:4">${chords.map((c, i) => `<div class="tile"><div class="t-chord"><b>${esc(c.symbol)}</b><div class="t-body">${power ? `<span class="t-fret">${vs[i].frets.find((f) => f >= 0)}</span><small class="t-str">corda 6</small>` : chordBox(vs[i], { title: ' ', color: inst.color }).outerHTML}</div></div></div>`).join('')}</div>`);
        el.append(row);
        let last = -1;
        loop((t) => { const i = Math.floor(t / 1.4) % 4; if (i !== last) { last = i; [...row.children].forEach((x, j) => x.classList.toggle('cur', j === i)); strum(inst, vs[i].midi); } });
      },
    },
    2: {
      t: 'Les cartes rítmiques',
      build(el, inst, loop) {
        el.innerHTML = lead('<b>● = un cop</b>. ○ = silenci. La pilota et diu quan.') + tags([['●', 'cop'], ['○', 'silenci']]);
        const v = guitarVoicing(parseChord('G'));
        const cb = cardBall(cardById('mb2'), null, { onHit: () => strum(inst, v.midi, { dur: 0.6 }) });
        el.append(cb.el);
        loop(cb.frame);
      },
    },
    3: {
      t: 'Les cartes de rascat',
      build(el, inst, loop) {
        el.innerHTML = lead('<b>Fletxa negra = toques</b> (avall o amunt). Grisa = la mà passa sense tocar.') + tags([['<span class="lg arrow">↓</span>', 'avall'], ['<span class="lg arrow">↑</span>', 'amunt'], ['<span class="lg arrow ghost">↓</span>', 'a l\'aire']]);
        const v = guitarVoicing(parseChord('G'));
        const card = cardById('rg2');
        const dirs = [...card.strum].filter((m) => m !== m.toLowerCase());
        const cb = cardBall(card, null, { onHit: (i) => strum(inst, dirs[i] === 'U' ? v.midi.slice(2) : v.midi, { dir: dirs[i], dur: 0.5, gain: 0.4 }) });
        el.append(cb.el);
        loop(cb.frame);
      },
    },
    4: {
      t: 'Cantar i tocar',
      build(el, inst, loop) {
        el.innerHTML = lead('Toques i, a sobre, <b>cantes la lletra blava</b>. A l\'exemple la sents.') + tags([['🎸', 'toques'], ['🎤', 'cantes']]);
        const v = guitarVoicing(parseChord('C'));
        const cb = cardBall(cardById('mb1'), null, { onHit: (i) => { strum(inst, v.midi, { dur: 0.6, gain: 0.35 }); if (i % 2 === 0) note({ sound: 'rhodes' }, 64 + (i ? 3 : 0), 0.9, 0.25); } });
        el.append(cb.el);
        loop(cb.frame);
      },
    },
    5: {
      t: 'Les cartes melòdiques',
      build(el, inst, loop) {
        const power = typeof chordMode() === 'object' && chordMode()?.type === 'power';
        el.innerHTML = lead(power ? 'El dibuix puja i baixa per <b>la forma: 1 · 5 · 8</b>.' : 'El dibuix puja i baixa per <b>les cordes que tries</b> (aquí, 4 i 3).');
        const c = parseChord('G');
        const v = power ? powerRoot6(c, 3) : guitarVoicing(c);
        const strings = power ? v.frets.map((f, s) => (f >= 0 ? s : -1)).filter((s) => s >= 0) : [2, 3];
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        const card = cardById('pm10');
        const heights = [...new Set(card.contour.flat())].sort((a, b) => a - b);
        const seq = card.contour.flat().map((r) => strings[Math.min(strings.length - 1, Math.round((heights.indexOf(r) * (strings.length - 1)) / Math.max(1, heights.length - 1)))]);
        const cb = cardBall(card, null, { onHit: (i) => { const s = seq[i]; note(inst, inst.tuning[s] + v.frets[s], 0.7); neck.show({ mode: 'notes', cur: { id: `n${i}${Date.now()}`, pos: [{ s, f: v.frets[s] }], label: '', voicing: v, chord: 'G' }, label: 'G', lit: strings }); neck.shake(s); } });
        const cols = h('<div class="in-cols"></div>');
        cols.append(cb.el, neckHost);
        el.append(cols);
        loop((t) => { cb.frame(t); neck.animate({}); });
      },
    },
    6: {
      t: 'Els acords amb celleta',
      build(el, inst, loop) {
        el.innerHTML = lead('<b>La barra = el dit 1</b> a totes les cordes. El número de l\'esquerra = el trast. La mateixa forma, a tot arreu.') + tags([['<span class="lg barre"></span>', 'celleta'], ['5', 'trast']]);
        const chords = ['F', 'G', 'A'].map((c) => guitarVoicing(parseChord(c), 'celleta'));
        const boxes = h(`<div class="in-boxes">${chords.map((v) => `<div class="in-box">${chordBox(v, { title: v.name, color: inst.color }).outerHTML}</div>`).join('')}</div>`);
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        el.append(boxes, neckHost);
        let last = -1;
        loop((t) => { const i = Math.floor(t / 1.6) % 3; if (i !== last) { last = i; [...boxes.children].forEach((x, j) => x.classList.toggle('cur', j === i)); neck.show({ mode: 'chord', cur: { id: `c${i}`, chord: chords[i].name, voicing: chords[i] }, label: chords[i].name }); strum(inst, chords[i].midi); } neck.animate({}); });
      },
    },
    7: {
      t: 'Afinar',
      build(el, inst, loop) {
        el.innerHTML = lead('Toca una corda a l\'aire: <b>l\'agulla al mig = afinada</b>. Esquerra = baixa; dreta = alta.') + '<div class="tl-body in-tuner"><span class="tl-note">E</span><div class="tl-scale"><i class="tl-zero"></i><i class="tl-needle"></i></div><span class="tl-cents"></span></div>';
        const needle = el.querySelector('.tl-needle'); const cents = el.querySelector('.tl-cents');
        loop((t) => { const c = Math.round(35 * Math.cos(t * 1.1) * Math.exp(-((t % 6) / 6))); needle.style.left = `${50 + c}%`; cents.textContent = c === 0 ? '✓' : `${c > 0 ? '+' : ''}${c}`; cents.classList.toggle('ok', Math.abs(c) < 4); });
        note(inst, inst.tuning[0], 2);
      },
    },
    8: {
      t: 'Els recursos tècnics',
      build(el, inst, loop) {
        el.innerHTML = lead('Lletres al punt: <b>h</b> hammer-on, <b>p</b> pull-off, <b>/</b> glissando, <b>↗</b> bending.') + tags([['h', 'lliga pujant'], ['p', 'lliga baixant'], ['/', 'llisca'], ['↗', 'estira']]);
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        el.append(neckHost);
        const EX = [{ type: 'h', from: 5, to: 7 }, { type: 'p', from: 7, to: 5 }, { type: 's', from: 5, to: 7 }, { type: 'b', from: 7, to: 7, semis: 2 }];
        let last = -1;
        loop((t) => {
          const i = Math.floor(t / 1.8) % 4; const ph = (t % 1.8) / 1.8;
          const ex = EX[i];
          const e = { id: `t${i}`, pos: [{ s: 2, f: ex.from }], label: `${ex.type === 's' ? '/' : ex.type === 'b' ? '↗' : ex.type}${ex.to}`, tech: { type: ex.type, to: ex.to, semis: ex.semis }, chord: '' };
          if (i !== last) { last = i; neck.show({ mode: 'notes', cur: e, label: '' }); const m = inst.tuning[2] + ex.from; note(inst, m, 0.8); if (ex.type !== 'b') setTimeout(() => note(inst, inst.tuning[2] + ex.to, 0.7, 0.45), 500); }
          neck.techPhase?.(e, ph); neck.animate({});
        });
      },
    },
    9: {
      t: 'Composició',
      build(el, inst, loop) {
        el.innerHTML = lead('<b>Carta rítmica + carta melòdica</b> = la teva frase. Tu tries quines.') + '<div class="in-cols"></div>';
        const v = guitarVoicing(parseChord('G'));
        const ladder = [v.midi[2], v.midi[3], v.midi[4]].filter((m) => m != null);
        const seq = cardById('pm5').contour.flat();
        const rhythm = cardBall(cardById('mb2'), null, { onHit: (i) => note(inst, ladder[seq[i % seq.length] % ladder.length], 0.6) });
        const mel = cardBall(cardById('pm5'));
        el.querySelector('.in-cols').append(rhythm.el, mel.el);
        loop((t) => { rhythm.frame(t); mel.frame(t); });
      },
    },
    10: {
      t: 'Improvisació',
      build(el, inst, loop) {
        el.innerHTML = lead('Les notes marcades al mànec són <b>la pentatònica</b>: toca la que vulguis, totes sonen bé. L\'1 és casa.');
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        el.append(neckHost);
        const key = { root: 9, minor: true };
        const box = scaleBox(inst, pentatonic(key), key.root).sort((a, b) => a.midi - b.midi);
        neck.show({ mode: 'scale', ctx: box.map((p) => ({ s: p.s, f: p.f, label: mod(p.midi, 12) === key.root ? '1' : '', cls: mod(p.midi, 12) === key.root ? 'active' : 'tone' })), ctxKey: 'pent', label: 'Pentatònica de La menor' });
        const order = [0, 2, 4, 5, 7, 5, 4, 2, 1, 3, 0];
        let last = -1;
        loop((t) => { const i = Math.floor(t / 0.5) % order.length; if (i !== last) { last = i; const p = box[order[i] % box.length]; note(inst, p.midi, 0.45); neck.shake(p.s); } neck.animate({}); });
      },
    },
  },
  baix: {
    1: {
      t: 'La línia de baix',
      build(el, inst, loop) {
        el.innerHTML = lead('El baix toca <b>la nota que dona nom a l\'acord</b> (la fonamental, 1). Un acord, una nota.') + tags([['<span class="lg dot">1</span>', 'fonamental']]);
        const chords = ['Em', 'C', 'G', 'D'].map((c) => parseChord(c));
        const row = h(`<div class="wv-row" style="--n:4">${chords.map((c) => `<div class="tile"><div class="t-chord"><b>${esc(c.symbol)}</b><div class="t-body"><span class="t-fret">1</span></div></div></div>`).join('')}</div>`);
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        el.append(row, neckHost);
        let last = -1;
        loop((t) => { const i = Math.floor(t / 1.4) % 4; if (i !== last) { last = i; [...row.children].forEach((x, j) => x.classList.toggle('cur', j === i)); const p = bassRole(chords[i], '1'); neck.dotsFor([{ s: p.s, f: p.f, label: '1', cls: 'active' }]); neck.shake(p.s); note(inst, inst.tuning[p.s] + p.f, 1.2); } neck.animate({}); });
      },
    },
    2: {
      t: 'Les cartes rítmiques',
      build(el, inst, loop) {
        el.innerHTML = lead('<b>● = una nota</b>. ○ = silenci. La pilota et diu quan.') + tags([['●', 'nota'], ['○', 'silenci']]);
        const p = bassRole(parseChord('G'), '1');
        const cb = cardBall(cardById('mb2'), null, { onHit: () => note(inst, inst.tuning[p.s] + p.f, 0.5) });
        el.append(cb.el);
        loop(cb.frame);
      },
    },
    3: {
      t: 'Les octaves',
      build(el, inst, loop) {
        el.innerHTML = lead('<b>8 = la mateixa nota, més aguda</b>: dues cordes més amunt i dos trasts més enllà.') + tags([['<span class="lg dot">1</span>', 'fonamental'], ['<span class="lg dot">8</span>', 'octava']]);
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        el.append(neckHost);
        const c = parseChord('G'); const p1 = bassRole(c, '1'); const p8 = bassRole(c, '8');
        neck.dotsFor([{ s: p1.s, f: p1.f, label: '1', cls: 'active' }, { s: p8.s, f: p8.f, label: '8', cls: 'tone' }]);
        let last = -1;
        loop((t) => { const i = Math.floor(t / 0.8) % 2; if (i !== last) { last = i; const p = i ? p8 : p1; note(inst, inst.tuning[p.s] + p.f, 0.7); neck.shake(p.s); } neck.animate({}); });
      },
    },
    4: {
      t: 'Cantar i tocar',
      build(el, inst, loop) {
        el.innerHTML = lead('Toques la fonamental i, a sobre, <b>la cantes</b> («uuu»). A l\'exemple la sents.') + tags([['🎸', 'toques'], ['🎤', 'cantes']]);
        const p = bassRole(parseChord('C'), '1');
        const cb = cardBall(cardById('mb5'), null, { onHit: () => { note(inst, inst.tuning[p.s] + p.f, 2); note({ sound: 'rhodes' }, 60, 1.6, 0.25); } });
        el.append(cb.el);
        loop(cb.frame);
      },
    },
    5: {
      t: 'Terceres i quintes',
      build(el, inst, loop) {
        el.innerHTML = lead('Els números són <b>les notes de l\'acord</b>: 1 fonamental, 3 tercera, 5 quinta, 8 octava.') + tags([['1', 'fonamental'], ['3', 'tercera'], ['5', 'quinta'], ['8', 'octava']]);
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        el.append(neckHost);
        const c = parseChord('C'); const roles = ['1', '3', '5', '8'];
        let last = -1;
        loop((t) => { const i = Math.floor(t / 0.8) % (roles.length + 1); if (i !== last) { last = i; neck.dotsFor(roles.slice(0, i).map((r) => { const p = bassRole(c, r); return { s: p.s, f: p.f, label: r, cls: r === '1' ? 'active' : 'tone' }; })); if (i > 0) { const p = bassRole(c, roles[i - 1]); note(inst, inst.tuning[p.s] + p.f, 0.7); neck.shake(p.s); } } neck.animate({}); });
      },
    },
    6: {
      t: 'Les cartes melòdiques',
      build(el, inst, loop) {
        el.innerHTML = lead('El dibuix puja i baixa per <b>les notes de l\'acord: 1 · 3 · 5 · 8</b>.');
        const neckHost = h('<div class="stage gstage in-neck"><div class="neck-host"></div></div>');
        const neck = createNeck(neckHost.querySelector('.neck-host'), inst, { thickTop: settings().thickTop === true });
        const c = parseChord('C'); const card = cardById('pm14');
        const seq = card.contour.flat().map((r) => ['1', '3', '5', '8'][r] ?? '1');
        const cb = cardBall(card, null, { onHit: (i) => { const p = bassRole(c, seq[i]); neck.dotsFor([{ s: p.s, f: p.f, label: seq[i], cls: 'active' }]); neck.shake(p.s); note(inst, inst.tuning[p.s] + p.f, 0.6); } });
        const cols = h('<div class="in-cols"></div>'); cols.append(cb.el, neckHost); el.append(cols);
        loop((t) => { cb.frame(t); neck.animate({}); });
      },
    },
  },
};
// els nivells del baix que són iguals que els de la guitarra
INTROS.baix[7] = { ...INTROS.guitarra[7] };
INTROS.baix[8] = { ...INTROS.guitarra[8] };
INTROS.baix[9] = { t: 'Composició', build(el, inst, loop) { el.innerHTML = lead('<b>Carta rítmica + carta melòdica</b> = la teva línia. Tu tries quines.') + '<div class="in-cols"></div>'; const c = parseChord('G'); const seq = cardById('pm5').contour.flat(); const roles = ['1', '3', '5', '8']; const rhythm = cardBall(cardById('mb2'), null, { onHit: (i) => { const p = bassRole(c, roles[seq[i % seq.length]] ?? '1'); note(inst, inst.tuning[p.s] + p.f, 0.6); } }); const mel = cardBall(cardById('pm5')); el.querySelector('.in-cols').append(rhythm.el, mel.el); loop((t) => { rhythm.frame(t); mel.frame(t); }); } };
INTROS.baix[10] = { ...INTROS.guitarra[10] };

/** Hi ha introducció per a aquest nivell? */
export const hasIntro = (instId, n) => !!INTROS[instId]?.[n];

/**
 * Mostra la introducció del nivell dins de `host` (per sobre de l'escenari). onDone quan es tanca.
 * Torna una funció per tancar-la.
 */
export function showIntro(host, instId, n, { onDone } = {}) {
  const def = INTROS[instId]?.[n];
  if (!def) { onDone?.(); return () => {}; }
  const inst = INSTRUMENTS[instId];
  const ov = h(`<div class="intro-ov"><div class="intro-box">
    <div class="intro-head"><span class="pick-badge" style="--c:${inst.color}">${n}</span><h3>${esc(def.t)}</h3><button type="button" class="btn btn-ghost btn-small" data-in="skip" title="Tanca">×</button></div>
    <div class="intro-body"></div>
    <div class="row intro-foot"><button type="button" class="btn btn-primary btn-big" data-in="go">🤘 Som-hi</button></div>
  </div></div>`);
  host.append(ov);
  let raf = 0;
  const fns = [];
  const loop = (fn) => fns.push(fn);
  const t0 = performance.now();
  const frame = () => { const t = (performance.now() - t0) / 1000; for (const f of fns) f(t); raf = requestAnimationFrame(frame); };
  try { def.build(ov.querySelector('.intro-body'), inst, loop); } catch (e) { console.warn('[intro]', e); }
  raf = requestAnimationFrame(frame);
  const close = () => { cancelAnimationFrame(raf); fns.length = 0; ov.remove(); onDone?.(); };
  ov.addEventListener('click', (e) => { if (e.target.closest('[data-in]')) close(); });
  return close;
}
