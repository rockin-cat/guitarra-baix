// El mapa (v26): res no es desplaça.
//  · A dalt, la roda: tots els compassos del tros de la cançó on ets, amb el compàs d'ara encès
//    i omplint-se a mesura que avança (el general).
//  · A sota, el compàs d'ara, quiet: el patró sencer (fletxes o notes) i un cursor que el recorre
//    (el concret). Com que el patró es repeteix, el dibuix no canvia: només avança el cursor.

const MODE_TEXT = { count: 'Compte', demo: 'Escolta', play: 'Ara tu', question: 'Escolta', answer: 'Ara tu', preview: 'Mira' };

/** El tros de la roda que es veu: la part de la cançó (A, B…) o blocs de 8 compassos. */
export function wheelWindow(prog, k) {
  const L = prog.length;
  const j = ((k % L) + L) % L;
  const starts = [0];
  prog.forEach((b, i) => { if (i > 0 && b.part) starts.push(i); });
  let a = 0;
  for (const s0 of starts) if (s0 <= j) a = s0;
  let b = starts.find((s0) => s0 > j) ?? L;
  if (b - a > 8) { a += Math.floor((j - a) / 8) * 8; b = Math.min(b, a + 8); }
  return { a, b, j };
}

export function createLane(canvas, { color = '#f97316' } = {}) {
  const ctx2 = canvas.getContext('2d');
  let dpr = 1;
  let w = 0;
  let h = 0;
  function fit() {
    dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    w = Math.max(200, r.width);
    h = Math.max(100, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  function draw(pos, { voice = false, marks = null, prog = null } = {}) {
    const c = ctx2;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#fbfaf7';
    c.fillRect(0, 0, w, h);
    if (!pos) return;
    const { M } = pos.song;
    const B = M.beats;
    const bar = pos.bars[pos.i];
    const mode = bar?.seg?.mode;
    const content = bar?.content;
    // en el compte enrere, el compàs que ve
    let shown = content;
    let k = bar?.seg?.k;
    let countIn = false;
    if (!content) {
      countIn = true;
      for (let j = pos.i + 1; j <= pos.i + 2; j++) {
        const nb = pos.bars[j];
        if (nb?.content) { shown = nb.content; k = nb.seg.k; break; }
      }
    }
    const frac = countIn ? 0 : Math.max(0, Math.min(1, pos.beat / B));

    // ---- la roda --------------------------------------------------------------
    const wheelH = prog ? 40 : 0;
    if (prog && k != null) {
      const { a, b, j } = wheelWindow(prog, k);
      const n = b - a;
      const gap = 6;
      const left = 8;
      const cw = (w - left * 2 - gap * (n - 1)) / n;
      for (let t = 0; t < n; t++) {
        const idx = a + t;
        const x = left + t * (cw + gap);
        const cur = idx === j;
        const past = idx < j;
        c.fillStyle = cur ? 'rgba(31,30,28,0.14)' : 'rgba(31,30,28,0.05)';
        rr(c, x, 6, cw, 28, 7); c.fill();
        if (cur && !countIn) {
          c.fillStyle = color;
          c.globalAlpha = 0.85;
          rr(c, x, 6, Math.max(8, cw * frac), 28, 7); c.fill();
          c.globalAlpha = 1;
        }
        if (cur) { c.strokeStyle = countIn ? '#e0a800' : color; c.lineWidth = 2; rr(c, x, 6, cw, 28, 7); c.stroke(); }
        const names = prog[idx].map((sg) => sg.chord.symbol).join(' ');
        c.fillStyle = cur ? '#1f1e1c' : past ? 'rgba(31,30,28,0.4)' : 'rgba(31,30,28,0.75)';
        c.font = `700 ${cw < 60 ? 12 : 15}px Ubuntu, sans-serif`;
        c.textAlign = 'center';
        c.fillText(names, x + cw / 2, 25.5, cw - 8);
        c.textAlign = 'left';
        if (prog[idx].part && t === 0 && cw > 70) {
          c.fillStyle = '#e0a800';
          c.font = '700 10px Ubuntu, sans-serif';
          c.fillText(prog[idx].part.toUpperCase().slice(0, 10), x + 7, 24);
        }
      }
    }

    // ---- el compàs d'ara, quiet ---------------------------------------------------
    const top = wheelH + 6;
    const left = 16;
    const right = w - 16;
    const ppb = (right - left) / B;
    const X = (beat) => left + beat * ppb;
    const rowEv = voice ? top + (h - top) * 0.4 : top + (h - top) * 0.52;
    const rowVoice = h - 12;
    c.fillStyle = mode === 'play' || mode === 'answer' ? 'rgba(31,30,28,0.035)' : 'rgba(0,0,0,0)';
    c.fillRect(left, top, right - left, h - top);
    for (let b = 0; b <= B + 1e-6; b += M.pulseLen / M.sub) {
      const x = X(b);
      const strong = Math.abs(b % M.pulseLen) < 1e-6;
      c.strokeStyle = b === 0 || b >= B - 1e-6 ? 'rgba(31,30,28,0.45)' : strong ? 'rgba(31,30,28,0.16)' : 'rgba(31,30,28,0.06)';
      c.lineWidth = b === 0 || b >= B - 1e-6 ? 2 : 1;
      c.beginPath(); c.moveTo(x, top); c.lineTo(x, h); c.stroke();
      if (strong && b < B - 1e-6) {
        const p = Math.round(b / M.pulseLen);
        const on = !countIn ? Math.floor(pos.beat / M.pulseLen) === p : false;
        c.fillStyle = on ? '#e0a800' : 'rgba(31,30,28,0.3)';
        c.font = '700 12px Ubuntu, sans-serif';
        c.fillText(String(p + 1), x + 4, top + 13);
      }
    }
    if (mode && MODE_TEXT[mode]) {
      c.fillStyle = mode === 'play' || mode === 'answer' ? color : 'rgba(31,30,28,0.45)';
      c.font = '700 11px Ubuntu, sans-serif';
      c.textAlign = 'right';
      c.fillText(MODE_TEXT[mode], right - 4, top + 13);
      c.textAlign = 'left';
    }
    if (countIn) {
      // compte enrere: els números grossos i, transparent, el patró que ve
      const pulse = Math.floor(pos.beat / M.pulseLen);
      for (let p = 0; p < M.pulses; p++) {
        c.fillStyle = p === pulse ? '#e0a800' : 'rgba(253,190,16,0.35)';
        c.font = `700 ${p === pulse ? 30 : 22}px Ubuntu, sans-serif`;
        c.fillText(String(p + 1), X(p * M.pulseLen) + ppb * M.pulseLen * 0.4, rowEv + 10);
      }
    }
    if (shown) {
      c.globalAlpha = countIn ? 0.22 : 1;
      // acords dins del compàs (si n'hi ha més d'un)
      if (shown.bar.length > 1) {
        for (const sg of shown.bar) {
          c.fillStyle = '#1f1e1c';
          c.font = '700 13px Ubuntu, sans-serif';
          c.fillText(sg.chord.symbol, X(sg.start * B) + 22, top + 13);
        }
      }
      for (const e of shown.part) {
        const x = X(e.beat);
        const len = Math.max(6, e.dur * ppb - 4);
        const done = !countIn && e.beat + e.dur <= pos.beat + 0.02;
        const now = !countIn && e.beat <= pos.beat + 0.02 && pos.beat < e.beat + e.dur;
        if (!countIn) c.globalAlpha = done ? 0.4 : 1;
        if (now) { c.fillStyle = 'rgba(253,190,16,0.16)'; c.fillRect(x, top + 18, Math.max(18, e.dur * ppb), h - top - 18); }
        if (e.kind === 'strum') arrow(c, x, rowEv, e.dir, e.ghost, color, len);
        else bubble(c, x, rowEv, e.label, color, len);
      }
      c.globalAlpha = countIn ? 0.22 : 1;
      if (voice) {
        for (const v of shown.voice) {
          const x = X(v.beat);
          c.fillStyle = v.speak ? '#e0a800' : '#2f86c9';
          c.font = `${v.speak ? 700 : 600} 15px Ubuntu, sans-serif`;
          c.fillText(v.text, x + 2, rowVoice);
          if (v.sing) { c.fillStyle = 'rgba(154,209,255,0.25)'; c.fillRect(x, rowVoice + 4, Math.max(4, v.dur * ppb - 4), 3); }
        }
      }
      c.globalAlpha = 1;
    }
    // el que ha sentit el joc en aquest compàs
    if (marks?.length && !countIn) {
      const COL = { ok: '#1f9d55', mid: '#f08c00', bad: '#d64545' };
      const a0 = pos.i * B;
      for (const m of marks) {
        if (m.abs < a0 - 0.05 || m.abs > a0 + B) continue;
        const x = X(m.abs - a0);
        c.strokeStyle = c.fillStyle = COL[m.cls] ?? '#1f1e1c';
        if (m.ring) {
          c.lineWidth = 3;
          c.beginPath(); c.arc(x + 8, rowEv, 21, 0, Math.PI * 2); c.stroke();
        } else {
          c.beginPath(); c.arc(x, rowEv + 30, 5, 0, Math.PI * 2); c.fill();
        }
      }
    }
    // el cursor
    if (!countIn) {
      const x = X(pos.beat);
      c.strokeStyle = '#e0a800';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, top + 18); c.lineTo(x, h); c.stroke();
      c.fillStyle = '#e0a800';
      c.beginPath(); c.moveTo(x - 7, top + 16); c.lineTo(x + 7, top + 16); c.lineTo(x, top + 24); c.fill();
    }
  }

  return { draw, fit, destroy: () => ro.disconnect() };
}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function arrow(c, x, y, dir, ghost, color, len) {
  const hgt = 34;
  c.strokeStyle = ghost ? 'rgba(31,30,28,0.28)' : color;
  c.fillStyle = c.strokeStyle;
  c.lineWidth = ghost ? 2 : 4;
  const a = dir === 'D' ? y - hgt / 2 : y + hgt / 2;
  const b = dir === 'D' ? y + hgt / 2 : y - hgt / 2;
  c.beginPath(); c.moveTo(x + 8, a); c.lineTo(x + 8, b); c.stroke();
  const s = dir === 'D' ? 1 : -1;
  c.beginPath(); c.moveTo(x + 1, b - 9 * s); c.lineTo(x + 15, b - 9 * s); c.lineTo(x + 8, b + 2 * s); c.fill();
  if (!ghost && len > 24) {
    c.fillStyle = 'rgba(31,30,28,0.08)';
    c.fillRect(x + 16, y - 3, len - 16, 6);
  }
}

function bubble(c, x, y, label, color, len) {
  const r = 14;
  c.fillStyle = 'rgba(31,30,28,0.1)';
  c.fillRect(x + r, y - 4, Math.max(0, len - r), 8);
  c.fillStyle = color;
  c.beginPath(); c.arc(x + r, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#111';
  c.font = `700 ${String(label).length > 2 ? 10 : 13}px Ubuntu, sans-serif`;
  c.textAlign = 'center';
  c.fillText(label, x + r, y + 4.5);
  c.textAlign = 'left';
}
