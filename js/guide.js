// «Aprèn a llegir la pantalla»: per a qui comença de zero. Cada pantalla ensenya una part del que es veu
// al joc (el mànec, els trasts, els dits, la púa, la pista, les cartes, el marcador) i com trobar-ho a l'instrument.

import { createNeck, chordBox } from './neck.js';
import { createLane } from './lane.js';
import { INSTRUMENTS, guitarVoicing, powerRoot6, coverStrings, bassRole, stringNumber } from './fretboard.js';
import { parseChord, parseProgression, metre, solfa, mod } from './theory.js';
import { partBar } from './parts.js';
import { tone, resumeAudio, loadSet, audioContext, click } from './audio.js';
import { cardById } from './data/cartes.js';
import { settings } from './store.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

let cleanup = [];
export function closeGuide() { for (const f of cleanup) f(); cleanup = []; }

async function sound(inst) { await resumeAudio(); await loadSet(inst.sound); }
let muted = false;
function play(inst, midi, dur = 1.4) { if (muted) return; sound(inst).then(() => tone(inst.sound, midi, 0, dur, { gain: 0.6, dest: 'me' })); }
/** Un cop de púa: les notes una darrere l'altra, molt juntes (avall de la greu a l'aguda; amunt, al revés). */
function strum(inst, midis, { dir = 'D', dur = 1.2, gain = 0.45 } = {}) {
  if (muted) return;
  const list = midis.filter((m) => m != null);
  if (dir === 'U') list.reverse();
  sound(inst).then(() => { const t = audioContext().currentTime + 0.01; list.forEach((m, i) => tone(inst.sound, m, t + i * 0.012, dur, { gain, dest: 'me' })); });
}
function tick(accent = false) { if (muted) return; resumeAudio().then(() => click(audioContext().currentTime + 0.01, accent)); }

/** La mà esquerra amb els dits numerats (1 índex, 2 mig, 3 anular, 4 petit). */
const handSvg = (color) => `
  <svg viewBox="0 0 200 190" class="hand" role="img" aria-label="Mà esquerra amb els dits numerats">
    <rect x="40" y="100" width="120" height="80" rx="34" fill="#f2d3b3" stroke="#c9a27c"/>
    <rect x="8" y="112" width="40" height="22" rx="11" transform="rotate(-35 28 123)" fill="#f2d3b3" stroke="#c9a27c"/>
    <text x="22" y="132" font-size="13" font-weight="700" fill="#8a6b4f">P</text>
    ${[[52, 34, 1], [82, 18, 2], [112, 24, 3], [140, 44, 4]].map(([x, y, n]) => `
      <rect x="${x}" y="${y}" width="26" height="${118 - y}" rx="13" fill="#f2d3b3" stroke="#c9a27c"/>
      <circle cx="${x + 13}" cy="${y + 16}" r="12" fill="${color}" stroke="#111"/>
      <text x="${x + 13}" y="${y + 21}" text-anchor="middle" font-size="14" font-weight="800" fill="#111">${n}</text>`).join('')}
  </svg>`;

export function renderGuide(host, instId, { onDone } = {}) {
  closeGuide();
  const inst = INSTRUMENTS[instId];
  const g = instId === 'guitarra';
  const n = inst.tuning.length;
  let page = 0;

  const PAGES = [
    { t: 'La pantalla és el teu instrument', build: pageIntro },
    { t: 'Les cordes', build: pageStrings },
    { t: 'Els trasts', build: pageFrets },
    { t: g ? 'Els dits i els acords' : 'Els números del baix', build: pageFingers },
    { t: g ? 'La mà dreta: la púa' : 'La mà dreta', build: pagePick },
    { t: 'La roda i el compàs', build: pageLane },
    { t: 'Les cartes i el diagrama', build: pageCards },
    { t: 'El marcador: quan toques', build: pageBadge },
  ];

  function render() {
    closeGuide();
    host.innerHTML = '';
    const p = PAGES[page];
    const root = h(`<div class="guide">
      <div class="view-head">
        <div class="vh-text"><small class="muted">Aprèn a llegir la pantalla · ${page + 1} de ${PAGES.length}</small><h2>${esc(p.t)}</h2></div>
        <button type="button" class="btn btn-ghost btn-small gsound" data-gmute title="So de les animacions">${muted ? '🔇' : '🔊'}</button>
        <div class="guide-tabs">${PAGES.map((x, i) => `<button type="button" class="gtab${i === page ? ' on' : ''}${i < page ? ' seen' : ''}" data-gp="${i}" title="${esc(x.t)}">${i + 1}</button>`).join('')}</div></div>
      <div class="guide-body"></div>
      <div class="row guide-nav">
        ${page > 0 ? '<button type="button" class="btn btn-ghost" data-gnav="-1" aria-label="Enrere">←</button>' : ''}
        ${page < PAGES.length - 1 ? '<button type="button" class="btn btn-primary" data-gnav="1" aria-label="Següent">→</button>' : '<button type="button" class="btn btn-primary btn-big" data-gdone="1">🤘 Som-hi</button>'}
      </div></div>`);
    host.append(root);
    p.build(root.querySelector('.guide-body'));
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-gmute]')) { muted = !muted; e.target.closest('[data-gmute]').textContent = muted ? '🔇' : '🔊'; return; }
      const b = e.target.closest('[data-gp],[data-gnav],[data-gdone]');
      if (!b) return;
      if (b.dataset.gp) page = Number(b.dataset.gp);
      else if (b.dataset.gnav) page += Number(b.dataset.gnav);
      else { closeGuide(); onDone?.(); return; }
      render();
      host.scrollTop = 0;
    });
  }

  const stage = (el) => { const s = h('<div class="stage gstage"><div class="neck-host"></div></div>'); el.append(s); return s.querySelector('.neck-host'); };

  const loopFn = (fn) => { const t0 = performance.now(); let id = 0; const f = () => { fn((performance.now() - t0) / 1000); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); cleanup.push(() => cancelAnimationFrame(id)); };
  const lead = (html) => `<p class="glead">${html}</p>`;
  const tags = (list) => `<div class="gtags">${list.map(([sym, t]) => `<span class="gtag">${sym}<small>${t}</small></span>`).join('')}</div>`;

  // 1 · intro: la guitarra estirada; la corda 1 dalt i la gruixuda baix (s'il·luminen soles)
  function pageIntro(el) {
    el.innerHTML = lead(`${g ? 'La guitarra' : 'El baix'} estirat a la falda: així es veu a la pantalla.`) + tags([['⬆', `corda 1 · prima`], ['⬇', `corda ${n} · gruixuda`], ['▮', 'trasts'], ['●', 'marques 3 · 5 · 7']]);
    const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
    let last = -1;
    loopFn((t) => {
      const k = Math.floor(t / 1.6) % 2;
      if (k !== last) {
        last = k;
        const s = k === 0 ? n - 1 : 0;
        neck.highlightString(s, `Corda ${stringNumber(inst, s)} · ${inst.stringNames[s]}`);
        neck.shake(s);
        play(inst, inst.tuning[s]);
      }
      neck.animate({});
    });
  }

  // 2 · les cordes: clica i sona
  function pageStrings(el) {
    el.innerHTML = lead('Clica una corda: s\'il·lumina i sona. Toca-la tu, a l\'aire.');
    const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
    const row = h(`<div class="string-btns">${[...inst.tuning.keys()].map((s) => `<button type="button" class="tune-btn" data-s="${s}"><b>${stringNumber(inst, s)}</b><span>${inst.stringNames[s]}</span></button>`).join('')}</div>`).cloneNode(true);
    // de la 1 a la més gruixuda, com a la pantalla
    row.replaceChildren(...[...row.children].reverse());
    el.append(row);
    const q = h('<p class="gq" data-q></p>');
    el.append(q);
    let target = null;
    const ask = () => { target = Math.floor(Math.random() * n); q.innerHTML = `🎯 Corda <b>${stringNumber(inst, target)}</b>?`; };
    ask();
    row.addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      const s = Number(b.dataset.s);
      neck.highlightString(s, `Corda ${stringNumber(inst, s)} · ${inst.stringNames[s]}`);
      neck.shake(s);
      play(inst, inst.tuning[s]);
      if (s === target) { q.innerHTML = '✓ 🎸 <button type="button" class="btn btn-ghost btn-small" data-again>🎯 Una altra</button>'; }
    });
    el.addEventListener('click', (e) => { if (e.target.closest('[data-again]')) ask(); });
    loopFn(() => neck.animate({}));
  }

  // 3 · els trasts: un punt que va pujant de trast (0 = a l'aire); clica per provar-ho
  function pageFrets(el) {
    el.innerHTML = lead('0 = a l\'aire · 1, 2, 3… = el trast on poses el dit.');
    const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
    const info = h('<p class="gq">👆 Clica el mànec.</p>');
    el.append(info);
    const NOMS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
    let auto = true;
    let lastF = -1;
    const s0 = n - 1; // la corda 1
    neck.svg.addEventListener('click', (e) => {
      const p = neck.hit(e.clientX, e.clientY);
      if (!p) return;
      auto = false;
      neck.dotsFor([{ s: p.s, f: p.f, label: p.f, cls: 'active' }]);
      neck.shake(p.s);
      const m = inst.tuning[p.s] + p.f;
      play(inst, m);
      info.innerHTML = `Corda <b>${stringNumber(inst, p.s)}</b> · ${p.f === 0 ? '<b>a l\'aire</b>' : `trast <b>${p.f}</b>`} → <b>${NOMS[mod(m, 12)]}</b>`;
    });
    neck.svg.style.cursor = 'pointer';
    loopFn((t) => {
      if (auto) {
        const f = Math.floor(t / 0.9) % 6;
        if (f !== lastF) { lastF = f; neck.dotsFor([{ s: s0, f, label: f, cls: 'active' }]); neck.shake(s0); play(inst, inst.tuning[s0] + f, 0.8); }
      }
      neck.animate({});
    });
  }

  // 4 · els dits (guitarra) o els números (baix): els exemples van passant sols
  function pageFingers(el) {
    if (g) {
      el.innerHTML = `<div class="gcols"><div>${lead('El número del punt = el dit.')}${handSvg(inst.color)}</div><div>${tags([['<span class="lg dot">2</span>', 'dit 2'], ['<span class="lg open"></span>', 'a l\'aire'], ['<span class="lg x">×</span>', 'no es toca'], ['<span class="lg barre"></span>', 'celleta'], ['<span class="lg ring"></span>', 'el que ve'], ['<span class="lg cover"></span>', 'tapada']])}</div></div>`;
      const EX = [['G', 'obert', 'Sol'], ['F', 'celleta', 'Fa · celleta'], ['G', 'p3', 'Sol5 · power chord'], ['G', 'o3', 'Sol · 3 cordes'], ['next', 'next', 'Do → Sol']];
      const opts = h(`<div class="row gopts">${EX.map(([c, m, t], i) => `<button type="button" class="chip${i ? '' : ' on'}" data-c="${c}" data-m="${m}">${esc(t)}</button>`).join('')}</div>`);
      el.append(opts);
      const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
      const show = (c, m) => {
        if (m === 'next') {
          const vc = guitarVoicing(parseChord('C'));
          neck.show({ mode: 'chord', cur: { id: 'n1', chord: 'C', voicing: vc }, next: { id: 'n2', chord: 'G', voicing: guitarVoicing(parseChord('G')) }, showNext: true, label: 'C' });
          strum(inst, vc.midi);
          return;
        }
        const ch = parseChord(c);
        const v = m === 'p3' ? powerRoot6(ch, 3) : m === 'o3' ? coverStrings(guitarVoicing(ch), 3) : guitarVoicing(ch, m);
        neck.show({ mode: 'chord', cur: { id: `${c}${m}`, chord: v.name, voicing: v }, label: v.name });
        strum(inst, v.midi);
      };
      let k = 0;
      let auto = true;
      const pick = (i) => { k = i; for (const [j, x] of [...opts.children].entries()) x.classList.toggle('on', j === i); show(EX[i][0], EX[i][1]); };
      pick(0);
      opts.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; auto = false; pick([...opts.children].indexOf(b)); });
      let last = 0;
      loopFn((t) => { const i = Math.floor(t / 3) % EX.length; if (auto && i !== last) { last = i; pick(i); } neck.animate({}); });
      void k;
    } else {
      el.innerHTML = `<div class="gcols"><div>${lead('El número = quina nota de l\'acord.')}${tags([['<span class="lg dot">1</span>', 'fonamental'], ['<span class="lg dot">3</span>', 'tercera'], ['<span class="lg dot">5</span>', 'quinta'], ['<span class="lg dot">8</span>', 'octava']])}</div><div>${handSvg(inst.color)}</div></div>`;
      const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
      const ch = parseChord('C');
      const roles = ['1', '3', '5', '8'];
      let last = -1;
      loopFn((t) => {
        const i = Math.floor(t / 0.8) % (roles.length + 1);
        if (i !== last) {
          last = i;
          neck.dotsFor(roles.slice(0, i).map((r) => { const p = bassRole(ch, r); return { s: p.s, f: p.f, label: r, cls: r === '1' ? 'active' : 'tone' }; }));
          if (i > 0) { const p = bassRole(ch, roles[i - 1]); play(inst, inst.tuning[p.s] + p.f, 0.7); }
        }
        neck.animate({});
      });
    }
  }

  // 5 · la púa (ja era una animació)
  function pagePick(el) {
    el.innerHTML = lead(g ? 'La púa groga és la teva mà dreta.' : 'El groc és el dit que pulsa.') + (g ? tags([['<span class="lg arrow">↓</span>', 'avall'], ['<span class="lg arrow">↑</span>', 'amunt'], ['<span class="lg arrow ghost">↓</span>', 'a l\'aire']]) : '');
    const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
    const v = g ? guitarVoicing(parseChord('Em')) : null;
    if (g) neck.show({ mode: 'chord', cur: { id: 'em', chord: 'Em', voicing: v }, label: 'Em' });
    const moves = g ? 'DuDUdUDU' : '';
    let lastK = -1;
    loopFn((t) => {
      const kk = Math.floor(t / (g ? 0.45 : 0.6));
      if (kk !== lastK) {
        lastK = kk;
        if (g) { const m = moves[kk % moves.length]; if (m !== m.toLowerCase()) strum(inst, m === 'U' ? v.midi.slice(2) : v.midi, { dir: m, dur: 0.5, gain: 0.35 }); }
        else play(inst, inst.tuning[[0, 1, 2, 1][kk % 4]], 0.6);
      }
      if (g) {
        const k = Math.floor(t / 0.45) % moves.length;
        const p = (t % 0.45) / 0.16;
        const m = moves[k];
        neck.animate({ pick: { id: `m${Math.floor(t / 0.45)}`, p, dir: m.toUpperCase(), ghost: m === m.toLowerCase(), strings: m.toUpperCase() === 'U' ? [2, 3, 4, 5] : [0, 1, 2, 3, 4, 5] } });
      } else {
        const seq = [0, 1, 2, 1];
        const k = Math.floor(t / 0.6);
        const s = seq[k % seq.length];
        neck.dotsFor([{ s, f: 0, label: '', cls: 'active' }]);
        neck.animate({ pick: { id: `b${k}`, p: (t % 0.6) / 0.2, s, strings: [s] } });
      }
    });
  }

  // 6 · la pista
  function pageLane(el) {
    el.innerHTML = lead('La roda: on ets. El compàs: quiet, avança la línia groga.');
    const st = h('<div class="stage gstage"><canvas class="lane"></canvas></div>');
    el.append(st);
    el.insertAdjacentHTML('beforeend', tags([['<span class="lg chord">G D Em C</span>', 'la roda'], ['<span class="lg line"></span>', 'ara'], ['<span class="lg num">1 2 3 4</span>', 'temps'], ['<span class="lg tag">A</span>', 'part'], ...(g ? [['<span class="lg arrow">↓</span>', 'cop'], ['<span class="lg arrow ghost">↓</span>', 'a l\'aire']] : []), ['<span class="lg dot">5</span>', g ? 'nota' : 'nota de l\'acord'], ['<span class="lg dot sm">h2</span>', 'h · p · / · ↗']]));
    const lane = createLane(st.querySelector('canvas'), { color: inst.color });
    const M = metre('4/4');
    const { bars } = parseProgression('[A] G | D | Em | C');
    const song = { M };
    const spec = g ? { type: 'rascat', card: 'rg2', voicing: 'obert' } : { type: 'bass', rhythm: 'Q', roles: ['1', '5'] };
    const content = bars.map((bar, k) => ({ bar, part: partBar(spec, instId, bar, M, k), voice: [] }));
    let lastHit = '';
    loopFn((sec) => {
      const abs = (sec * 1.5) % 16;
      const ci = Math.floor(abs / 4) % 4;
      const e = content[ci].part.filter((x) => x.beat <= abs % 4 + 1e-6).at(-1);
      const id = e ? `${Math.floor(sec * 1.5 / 16)}:${ci}:${e.beat}` : '';
      if (id && id !== lastHit) { lastHit = id; if (!e.ghost) { if (e.voicing) strum(inst, e.voicing.midi, { dir: e.dir, dur: 0.5, gain: 0.35 }); else if (e.notes) play(inst, e.notes[0], 0.6); } }
      const i = Math.floor(abs / 4);
      const bs = [];
      for (let j = 0; j < 7; j++) bs[j] = { seg: { mode: 'demo', k: j % 4 }, content: content[j % 4] };
      lane.draw({ i, abs, beat: abs % 4, bars: bs, song }, { prog: bars });
    });
    cleanup.push(() => lane.destroy());
  }

  // 7 · cartes i diagrama: la línia de color recorre la carta
  function pageCards(el) {
    const cards = g ? [['mb2', '● = cop'], ['rg2', '↓↑ negre = toca · gris = aire'], ['pm14', 'power: 1 · 5 · 8 — obert: les cordes que triïs']] : [['mb2', '● = nota'], ['pm14', '1 3 5 8']];
    el.innerHTML = lead('Les cartes de classe. La línia diu per on vas.') + `<div class="gcards">${cards.map(([id, t]) => `<div class="gcard"><div class="rcard"><img src="${cardById(id)?.img}" alt=""><i class="sweep"></i></div><p>${esc(t)}</p></div>`).join('')}</div>`;
    const sweeps = [...el.querySelectorAll('.sweep')];
    let lastB = -1;
    const vC = g ? guitarVoicing(parseChord('C')).midi : null;
    loopFn((t) => {
      const x = 7 + 86 * ((t / 2.4) % 1); for (const sw of sweeps) sw.style.left = `${x}%`;
      const bt = Math.floor(t / 0.6);
      if (bt !== lastB) { lastB = bt; if (bt % 4 !== 2) { if (g) strum(inst, vC, { dur: 0.5, gain: 0.35 }); else play(inst, inst.tuning[1] + 3, 0.5); } }
    });
    if (g) {
      const v = guitarVoicing(parseChord('C'));
      const wrap = h(`<div class="gcols"><div class="gbox-diagram"></div><div>${lead('El diagrama és el mateix acord, dret.')}</div></div>`);
      wrap.querySelector('.gbox-diagram').append(chordBox(v, { title: 'C', color: inst.color }));
      el.append(wrap);
    }
  }

  // 8 · el marcador: va passant sol (compte → escolta → tu)
  function pageBadge(el) {
    el.innerHTML = lead('A dalt, el marcador diu què toca ara.') + `<div class="stage-top gbadge-demo"><div class="mode-badge" data-mode="count">⏱</div><div class="pulses"><span>1</span><span>2</span><span>3</span><span>4</span></div><b class="gbadge-txt"></b></div>`
      + tags([['⏱', 'compte'], ['👂', 'escolta'], ['🎸 TU', 'toques tu'], ['👀', 'mira']]);
    const bar = el.querySelector('.gbadge-demo');
    bar.style.cssText = 'background:#111827;border-radius:10px;padding:10px 14px;color:#fff;margin-top:10px';
    const badge = bar.querySelector('.mode-badge');
    const txt = bar.querySelector('.gbadge-txt');
    const pul = [...bar.querySelectorAll('.pulses span')];
    const SEQ = [['count', '⏱', 'compte'], ['demo', '👂', 'escolta'], ['play', '🎸 TU', 'ara tu']];
    loopFn((t) => {
      const beat = Math.floor(t / 0.55);
      const [mode, sym, w] = SEQ[Math.floor(beat / 4) % SEQ.length];
      if (beat !== pageBadge.last) { pageBadge.last = beat; if (mode === 'count') tick(beat % 4 === 0); else if (mode === 'demo') { if (g) strum(inst, guitarVoicing(parseChord('G')).midi, { dur: 0.5, gain: 0.35 }); else play(inst, inst.tuning[0] + 3, 0.5); } else tick(false); }
      if (badge.dataset.mode !== mode) { badge.dataset.mode = mode; badge.textContent = sym; txt.textContent = w; }
      pul.forEach((p, i) => p.classList.toggle('on', i === beat % 4));
    });
  }

  render();
  return { close: closeGuide };
}

export { solfa };
