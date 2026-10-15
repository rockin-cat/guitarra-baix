// «Aprèn a llegir la pantalla»: per a qui comença de zero. Cada pantalla ensenya una part del que es veu
// al joc (el mànec, els trasts, els dits, la púa, la pista, les cartes, el marcador) i com trobar-ho a l'instrument.

import { createNeck, chordBox } from './neck.js';
import { createLane } from './lane.js';
import { INSTRUMENTS, guitarVoicing, powerRoot6, coverStrings, bassRole, stringNumber } from './fretboard.js';
import { parseChord, parseProgression, metre, solfa, mod } from './theory.js';
import { partBar } from './parts.js';
import { tone, resumeAudio, loadSet } from './audio.js';
import { cardById } from './data/cartes.js';
import { settings } from './store.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

let cleanup = [];
export function closeGuide() { for (const f of cleanup) f(); cleanup = []; }

async function sound(inst) { await resumeAudio(); await loadSet(inst.sound); }
function play(inst, midi, dur = 1.4) { sound(inst).then(() => tone(inst.sound, midi, 0, dur, { gain: 0.6, dest: 'me' })); }

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
    { t: 'La pista', build: pageLane },
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
        <div class="guide-tabs">${PAGES.map((x, i) => `<button type="button" class="gtab${i === page ? ' on' : ''}${i < page ? ' seen' : ''}" data-gp="${i}" title="${esc(x.t)}">${i + 1}</button>`).join('')}</div></div>
      <div class="guide-body"></div>
      <div class="row guide-nav">
        ${page > 0 ? '<button type="button" class="btn btn-ghost" data-gnav="-1">← Enrere</button>' : ''}
        ${page < PAGES.length - 1 ? '<button type="button" class="btn btn-primary" data-gnav="1">Següent →</button>' : '<button type="button" class="btn btn-primary btn-big" data-gdone="1">Ja ho sé llegir! Som-hi →</button>'}
      </div></div>`);
    host.append(root);
    p.build(root.querySelector('.guide-body'));
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-gp],[data-gnav],[data-gdone]');
      if (!b) return;
      if (b.dataset.gp) page = Number(b.dataset.gp);
      else if (b.dataset.gnav) page += Number(b.dataset.gnav);
      else { closeGuide(); onDone?.(); return; }
      render();
      host.scrollTop = 0;
    });
  }

  const box = (title, html) => `<div class="gbox"><h3>${esc(title)}</h3>${html}</div>`;
  const tryIt = (html) => `<div class="gtry"><b>🎸 Prova-ho a l'instrument</b>${html}</div>`;
  const stage = (el) => { const s = h('<div class="stage gstage"><div class="neck-host"></div></div>'); el.append(s); return s.querySelector('.neck-host'); };

  // 1 · intro
  function pageIntro(el) {
    el.innerHTML = `<div class="gcols"><div>
      <p class="glead">El mànec de la pantalla es llegeix com una <b>tabulatura</b>: la línia de dalt és la <b>corda 1</b>, la més prima (la més aguda), i la de baix és la <b>corda ${n}</b>, la més gruixuda (la més greu). És com trobaràs les cançons escrites en tabulatura a tot arreu.</p>
      ${box('Què hi ha', `<ul><li>A l'esquerra, el <b>clavillater</b> (on afines) i la <b>celleta</b> (la peça blanca).</li><li>Les línies verticals són els <b>trasts</b>: els fils de metall del mànec.</li><li>Els punts grisos són les <b>marques</b> que la teva ${g ? 'guitarra' : 'baix'} també té (trasts 3, 5, 7, 9 i 12).</li><li>A la dreta, el <b>cos</b>: on la mà dreta toca les cordes.</li></ul>`)}
      ${tryIt(g ? '<p>Posa la guitarra estirada a la falda, de cara amunt, amb el mànec cap a l\'esquerra. La corda gruixuda queda a prop teu (a baix) i la prima, lluny (a dalt): així és com la veus a la pantalla. Busca les marques dels trasts 3, 5 i 7: són al mateix lloc.</p><p>Quan la tornis a posar per tocar, la corda gruixuda queda a dalt: la pantalla és com si la miressis estirada.</p>'
        : '<p>Posa el baix estirat a la falda, de cara amunt, amb el mànec cap a l\'esquerra. La corda gruixuda queda a prop teu (a baix) i la prima, lluny (a dalt): així és com el veus a la pantalla. Busca les marques dels trasts 3, 5 i 7: són al mateix lloc.</p><p>Quan el tornis a posar per tocar, la corda gruixuda queda a dalt: la pantalla és com si el miressis estirat.</p>')}
      </div><div class="gside"><p class="muted small">A ⚙︎ Configuració es pot canviar a la «vista de jugador» (la corda gruixuda a dalt, com Rocksmith).</p></div></div>`;
    const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
    neck.clear();
  }

  // 2 · les cordes
  function pageStrings(el) {
    el.innerHTML = `<p class="glead">${g ? 'La guitarra té sis cordes' : 'El baix té quatre cordes'}. Es numeren de la més prima (<b>1</b>, la de dalt de la pantalla) a la més gruixuda (<b>${n}</b>, la de baix), i cadascuna té el nom de la nota que fa a l'aire.</p>`;
    const neckHost = stage(el);
    const neck = createNeck(neckHost, inst, { thickTop: settings().thickTop === true });
    const row = h(`<div class="string-btns">${[...inst.tuning.keys()].map((s) => `<button type="button" class="tune-btn" data-s="${s}"><b>${stringNumber(inst, s)}</b><span>${inst.stringNames[s]}</span></button>`).join('')}</div>`);
    el.append(row);
    el.insertAdjacentHTML('beforeend', tryIt(`<p>Clica una corda: s'il·lumina i sona. Toca la mateixa corda al teu instrument, sense posar cap dit a l'esquerra (<b>a l'aire</b>). Ha de sonar igual (si no, potser cal afinar: és el nivell 7).</p><p class="gq" data-q></p>`));
    const q = el.querySelector('[data-q]');
    let target = null;
    const ask = () => { target = Math.floor(Math.random() * n); q.innerHTML = `Repte: troba la <b>corda ${stringNumber(inst, target)}</b> a la pantalla i clica-la.`; };
    ask();
    row.addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      const s = Number(b.dataset.s);
      neck.highlightString(s, `Corda ${stringNumber(inst, s)} · ${inst.stringNames[s]}`);
      neck.shake(s);
      play(inst, inst.tuning[s]);
      if (s === target) { q.innerHTML = `✓ Molt bé! Ara toca-la al teu instrument. <button type="button" class="btn btn-ghost btn-small" data-again>Un altre repte</button>`; }
    });
    el.addEventListener('click', (e) => { if (e.target.closest('[data-again]')) ask(); });
    const raf = () => { neck.animate({}); id = requestAnimationFrame(raf); };
    let id = requestAnimationFrame(raf);
    cleanup.push(() => cancelAnimationFrame(id));
  }

  // 3 · els trasts
  function pageFrets(el) {
    el.innerHTML = `<p class="glead">Els <b>trasts</b> són els espais entre els fils de metall. El número de sota diu quin trast és. El <b>0</b> vol dir <b>a l'aire</b>: no poses cap dit.</p>`;
    const neckHost = stage(el);
    const neck = createNeck(neckHost, inst, { thickTop: settings().thickTop === true });
    const info = h('<p class="gq">Clica qualsevol lloc del mànec.</p>');
    el.append(info);
    el.insertAdjacentHTML('beforeend', `<div class="gcols">${box('Com es posa el dit', '<ul><li>El dit va <b>just darrere</b> del fil de metall, no a sobre.</li><li>Prem amb la punta del dit, com si fos un martell petit.</li><li>Cada trast més cap al cos, la nota puja una mica.</li></ul>')}${tryIt('<p>Clica un punt de la pantalla, posa el dit al mateix trast i la mateixa corda, i toca. Ha de sonar igual.</p>')}</div>`);
    const NOMS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
    neck.svg.addEventListener('click', (e) => {
      const p = neck.hit(e.clientX, e.clientY);
      if (!p) return;
      neck.dotsFor([{ s: p.s, f: p.f, label: p.f, cls: 'active' }]);
      neck.shake(p.s);
      const m = inst.tuning[p.s] + p.f;
      play(inst, m);
      info.innerHTML = `<b>Corda ${stringNumber(inst, p.s)}</b> (${inst.stringNames[p.s]}) · <b>${p.f === 0 ? 'a l\'aire' : `trast ${p.f}`}</b> → nota <b>${NOMS[mod(m, 12)]}</b>`;
    });
    neck.svg.style.cursor = 'pointer';
    const raf = () => { neck.animate({}); id = requestAnimationFrame(raf); };
    let id = requestAnimationFrame(raf);
    cleanup.push(() => cancelAnimationFrame(id));
  }

  // 4 · els dits / els números
  function pageFingers(el) {
    if (g) {
      el.innerHTML = `<div class="gcols"><div>
        <p class="glead">Els <b>números dels punts</b> són els dits de la mà esquerra.</p>${handSvg(inst.color)}</div>
        <div>${box('Els símbols', `<ul class="legend">
          <li><span class="lg dot">2</span> Posa aquest dit en aquesta corda i aquest trast.</li>
          <li><span class="lg open"></span> Corda <b>a l'aire</b>: sona sense dit.</li>
          <li><span class="lg x">×</span> Aquesta corda <b>no</b> es toca.</li>
          <li><span class="lg barre"></span> <b>Celleta</b>: el dit 1 aguanta diverses cordes alhora.</li>
          <li><span class="lg ring"></span> Contorn discontinu: l'<b>acord que ve</b>. Ves preparant els dits.</li>
          <li><span class="lg cover"></span> Franja grisa: <b>cordes tapades</b>. No es toquen encara.</li></ul>`)}</div></div>`;
      const opts = h(`<div class="row gopts">${[['G', 'obert', 'Acord obert: Sol'], ['F', 'celleta', 'Amb celleta: Fa'], ['G', 'p3', 'Power chord: Sol5'], ['G', 'o3', 'Cordes tapades: Sol amb 3 cordes'], ['next', 'next', 'Acord que ve: Do → Sol']].map(([c, m, t], i) => `<button type="button" class="tab${i === 0 ? ' on' : ''}" data-c="${c}" data-m="${m}">${esc(t)}</button>`).join('')}</div>`);
      el.append(opts);
      const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
      const show = (c, m) => {
        if (m === 'next') {
          const a = guitarVoicing(parseChord('C'));
          const b = guitarVoicing(parseChord('G'));
          neck.show({ mode: 'chord', cur: { id: 'n1', chord: 'C', voicing: a }, next: { id: 'n2', chord: 'G', voicing: b }, showNext: true, label: 'C' });
          return;
        }
        const ch = parseChord(c);
        const v = m === 'p3' ? powerRoot6(ch, 3) : m === 'o3' ? coverStrings(guitarVoicing(ch), 3) : guitarVoicing(ch, m);
        neck.show({ mode: 'chord', cur: { id: `${c}${m}`, chord: v.name, voicing: v }, label: v.name });
      };
      show('G', 'obert');
      opts.addEventListener('click', (e) => {
        const b = e.target.closest('[data-m]');
        if (!b) return;
        for (const x of opts.children) x.classList.toggle('on', x === b);
        show(b.dataset.c, b.dataset.m);
      });
      el.insertAdjacentHTML('beforeend', tryIt('<p>Tria un exemple, posa els dits on diu la pantalla i toca només les cordes que no tenen ×.</p>'));
    } else {
      el.innerHTML = `<div class="gcols"><div>
        <p class="glead">Al baix, el número de dins del punt diu <b>quina nota de l'acord</b> toques:</p>
        <ul class="legend big"><li><span class="lg dot">1</span> la <b>fonamental</b>: la nota que dona nom a l'acord</li><li><span class="lg dot">3</span> la <b>tercera</b></li><li><span class="lg dot">5</span> la <b>quinta</b></li><li><span class="lg dot">8</span> l'<b>octava</b>: la mateixa fonamental, més aguda</li></ul>
        <p>Quan toques una línia del Generador, el número és el <b>trast</b>, com a una tabulatura.</p></div><div>${handSvg(inst.color)}<p class="muted small">Per tocar, cada dit s'ocupa d'un trast: dit 1 al primer, dit 2 al següent…</p></div></div>`;
      const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
      const ch = parseChord('C');
      neck.dotsFor(['1', '3', '5', '8'].map((r) => { const p = bassRole(ch, r); return { s: p.s, f: p.f, label: r, cls: r === '1' ? 'active' : 'tone' }; }));
      el.insertAdjacentHTML('beforeend', tryIt('<p>Són les notes de l\'acord de <b>Do</b>. Toca-les en ordre (1, 3, 5, 8) i escolta com pugen.</p>'));
    }
  }

  // 5 · la púa
  function pagePick(el) {
    el.innerHTML = `<div class="gcols"><div><p class="glead">${g ? 'La <b>púa</b> groga és la teva mà dreta. La fletxa diu cap on va:' : 'La forma groga és el dit (o la púa) que pulsa: salta a la corda que toca.'}</p>
      ${g ? `<ul class="legend big"><li><span class="lg arrow">↓</span> <b>Avall</b>: la mà baixa, de la corda gruixuda a la prima. Com que a la tabulatura la gruixuda és a baix, <b>a la pantalla la púa puja</b>.</li><li><span class="lg arrow">↑</span> <b>Amunt</b>: la mà puja, de la prima a la gruixuda (normalment només les primes). A la pantalla, la púa baixa.</li><li><span class="lg arrow ghost">↕</span> <b>Gris</b>: la mà es mou però <b>no toca</b> (com a les cartes de rascat).</li></ul>` : ''}</div>
      <div>${tryIt(g ? '<p>Segueix la <b>fletxa</b>: ↓ vol dir que la teva mà baixa, encara que la púa de la pantalla pugi. Primer mou la mà sense tocar i després toca només quan la púa és groga.</p>' : '<p>Pulsa la corda que s\'il·lumina, alternant els dits índex i mig.</p>')}</div></div>`;
    const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
    const v = g ? guitarVoicing(parseChord('Em')) : null;
    if (g) neck.show({ mode: 'chord', cur: { id: 'em', chord: 'Em', voicing: v }, label: 'Em · avall, (amunt), avall, amunt…' });
    const moves = g ? 'DuDUdUDU' : '';
    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
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
      id = requestAnimationFrame(loop);
    };
    let id = requestAnimationFrame(loop);
    cleanup.push(() => cancelAnimationFrame(id));
  }

  // 6 · la pista
  function pageLane(el) {
    el.innerHTML = `<p class="glead">La <b>pista</b> és com un tren: el que has de tocar ve de la dreta i <b>es toca quan arriba a la línia groga</b>.</p>`;
    const st = h('<div class="stage gstage"><canvas class="lane"></canvas></div>');
    el.append(st);
    el.insertAdjacentHTML('beforeend', `<div class="gcols">${box('Què hi ha', `<ul class="legend">
      <li><span class="lg line"></span> <b>Línia groga</b>: ara.</li>
      <li><span class="lg num">1 2 3 4</span> Els <b>temps</b> de cada compàs. La línia gruixuda és el començament del compàs.</li>
      <li><span class="lg chord">G</span> El nom de l'<b>acord</b> que comença.</li>
      <li><span class="lg tag">A</span> La <b>part</b> de la cançó (intro, A, tornada…).</li>
      ${g ? '<li><span class="lg arrow">↓</span> Un cop de púa; la barra de darrere diu quant dura.</li>' : ''}
      <li><span class="lg dot">5</span> Una nota sola: el número és el de l'acord (1, 3, 5, 8) o el trast.</li>
      <li><span class="lg dot sm">h2</span> Recursos: <b>h</b> hammer-on, <b>p</b> pull-off, <b>/</b> glissando, <b>↗</b> bending.</li></ul>`)}
      ${tryIt('<p>Diu en veu alta «u, dos, tres, quatre» seguint els números de la pista. Quan una fletxa toca la línia groga, fes el cop.</p>')}</div>`);
    const lane = createLane(st.querySelector('canvas'), { color: inst.color });
    const M = metre('4/4');
    const { bars } = parseProgression('[A] G | D | Em | C');
    const song = { M };
    const spec = g ? { type: 'strum', rhythm: 'E', voicing: 'obert' } : { type: 'bass', rhythm: 'Q', roles: ['1', '5'] };
    const content = bars.map((bar, k) => ({ bar, part: partBar(spec, instId, bar, M, k), voice: [] }));
    const t0 = performance.now();
    const loop = () => {
      const abs = (((performance.now() - t0) / 1000) * 1.5) % 16;
      const i = Math.floor(abs / 4);
      const bs = [];
      for (let j = 0; j < 7; j++) bs[j] = { seg: { mode: 'demo', k: j % 4 }, content: content[j % 4] };
      lane.draw({ i, abs, beat: abs % 4, bars: bs, song });
      id = requestAnimationFrame(loop);
    };
    let id = requestAnimationFrame(loop);
    cleanup.push(() => { cancelAnimationFrame(id); lane.destroy(); });
  }

  // 7 · cartes i diagrama
  function pageCards(el) {
    const cards = g ? [['mb2', 'Carta rítmica: cada rodona és un cop. On no n\'hi ha, silenci.'], ['rg2', 'Carta de rascat: fletxes negres = toques; grises = la mà es mou sense tocar. El punt de sota marca el temps.'], ['pm14', 'Carta melòdica: les notes pugen o baixen per les notes de l\'acord.']]
      : [['mb2', 'Carta rítmica: cada rodona és una nota. On no n\'hi ha, silenci.'], ['pm14', 'Carta melòdica: les notes pugen o baixen per les notes de l\'acord (1, 3, 5, 8).']];
    el.innerHTML = `<p class="glead">Les <b>cartes ROCKIN</b> del joc són les mateixes que teniu a classe. Una <b>línia de color</b> hi passa per sobre i diu per on vas.</p>
      <div class="gcards">${cards.map(([id, t]) => `<div class="gcard"><div class="rcard"><img src="${cardById(id)?.img}" alt=""><i class="sweep" style="left:40%"></i></div><p>${esc(t)}</p></div>`).join('')}</div>`;
    if (g) {
      const v = guitarVoicing(parseChord('C'));
      const wrap = h(`<div class="gcols"><div>${box('El diagrama d\'acord', '<p>És el mateix acord que el mànec, però <b>dret</b>, com les cartes de diagrames: les línies verticals són les cordes (la gruixuda a l\'<b>esquerra</b>) i les horitzontals, els trasts. A dalt: ○ a l\'aire, × no es toca.</p>')}${tryIt('<p>Posa la guitarra dreta davant teu, mirant-la de cara: el diagrama és igual que el que veus.</p>')}</div><div class="gbox-diagram"></div></div>`);
      wrap.querySelector('.gbox-diagram').append(chordBox(v, { title: 'C (Do)', color: inst.color }));
      el.append(wrap);
      const neck = createNeck(stage(el), inst, { thickTop: settings().thickTop === true });
      neck.show({ mode: 'chord', cur: { id: 'c', chord: 'C', voicing: v }, label: 'C (Do): el mateix acord, al mànec' });
    }
  }

  // 8 · el marcador
  function pageBadge(el) {
    el.innerHTML = `<p class="glead">A dalt de l'escenari, el <b>marcador</b> diu què passa:</p>
      <div class="gbadges">
        <div class="stage-top"><div class="mode-badge" data-mode="count">COMPTE</div><div class="pulses"><span class="on">1</span><span>2</span><span>3</span><span>4</span></div></div><p>El metrònom compta un compàs abans de començar.</p>
        <div class="stage-top"><div class="mode-badge" data-mode="demo">ESCOLTA</div><div class="pulses"><span>1</span><span class="on">2</span><span>3</span><span>4</span></div></div><p>Sona la teva part: escolta i mira. L'últim compàs compta enrere: «3, 2, 1».</p>
        <div class="stage-top"><div class="mode-badge" data-mode="play">ARA TU</div><div class="pulses"><span>1</span><span>2</span><span class="on">3</span><span>4</span></div></div><p>La banda continua <b>sense el teu instrument</b>: ara toques tu.</p>
      </div>
      ${tryIt('<p>Les rodones del marcador són els temps. La primera, la groga, és l\'inici del compàs: és on solen canviar els acords.</p>')}
      ${box('I al final…', '<p>El joc no t\'escolta: <b>tu dius com ha anat</b> («Encara no», «Gairebé», «Em surt!»). Si encara no surt, el joc baixa el tempo i t\'ho torna a ensenyar.</p>')}`;
    for (const s of el.querySelectorAll('.stage-top')) s.style.cssText = 'background:#111827;border-radius:10px;padding:8px 12px;color:#fff;margin-top:10px';
  }

  render();
  return { close: closeGuide };
}

export { solfa };
