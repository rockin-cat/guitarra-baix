// Anàlisi del senyal de la guitarra o el baix (funcions pures, es poden provar fora del navegador).
//  · yin(x, sr): l'altura d'una nota sola (algorisme YIN)
//  · chroma(x, sr): quanta energia hi ha a cada una de les 12 notes (per als acords)
//  · chordScore(chroma, midis): s'assembla a l'acord que tocava?

/** Freqüència fonamental d'una finestra. Torna { f0, conf } (conf de 0 a 1) o null. */
export function yin(x, sr, { fmin = 38, fmax = 1100, thr = 0.15 } = {}) {
  const maxTau = Math.min(Math.floor(sr / fmin), Math.floor(x.length / 2));
  const minTau = Math.max(2, Math.floor(sr / fmax));
  const W = x.length - maxTau;
  if (W < 64) return null;
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) { const v = x[i] - x[i + tau]; s += v * v; }
    d[tau] = s;
  }
  // diferència normalitzada acumulada
  const c = new Float32Array(maxTau + 1);
  c[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= maxTau; tau++) { run += d[tau]; c[tau] = run > 0 ? (d[tau] * tau) / run : 1; }
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (c[t] < thr) { while (t + 1 <= maxTau && c[t + 1] < c[t]) t++; tau = t; break; }
  }
  if (tau < 0) {
    // cap mínim clar: el més baix, si és prou bo
    let best = minTau;
    for (let t = minTau; t <= maxTau; t++) if (c[t] < c[best]) best = t;
    if (c[best] > 0.35) return null;
    tau = best;
  }
  // interpolació parabòlica
  let t = tau;
  if (tau > 1 && tau < maxTau) {
    const a = c[tau - 1]; const b = c[tau]; const g = c[tau + 1];
    const den = a + g - 2 * b;
    if (den) t = tau + (a - g) / (2 * den);
  }
  return { f0: sr / t, conf: Math.max(0, Math.min(1, 1 - c[tau])) };
}

export const freqToMidi = (f) => 69 + 12 * Math.log2(f / 440);

/** Potència (RMS) d'una finestra. */
export function rms(x, from = 0, to = x.length) {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
}

// ---- FFT (radix 2, in situ) ------------------------------------------------------------------------------------

export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang); const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1; let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar; im[i + k] += ai;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

/** Croma: l'energia de cada classe de nota (0 = Do) entre 70 i 2500 Hz, normalitzada. */
export function chroma(x, sr) {
  let n = 1;
  while (n < x.length) n <<= 1;
  n = Math.min(n, 16384);
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  const L = Math.min(x.length, n);
  for (let i = 0; i < L; i++) re[i] = x[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (L - 1)));
  fft(re, im);
  const out = new Float32Array(12);
  const lo = Math.ceil((70 * n) / sr);
  const hi = Math.min(n / 2 - 1, Math.floor((2500 * n) / sr));
  for (let k = lo; k <= hi; k++) {
    const mag = Math.hypot(re[k], im[k]);
    // només els pics (així el soroll entre notes compta menys)
    if (mag < Math.hypot(re[k - 1], im[k - 1]) || mag < Math.hypot(re[k + 1], im[k + 1])) continue;
    const m = freqToMidi((k * sr) / n);
    const pc = ((Math.round(m) % 12) + 12) % 12;
    const off = Math.abs(m - Math.round(m));
    if (off > 0.35) continue;
    out[pc] += Math.sqrt(mag) * (1 - off);
  }
  const s = out.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < 12; i++) out[i] /= s;
  return out;
}

/** La plantilla d'unes notes, amb els harmònics que sonen de debò a una corda (8a, 5a, 3a…). */
export function template(midis) {
  const t = new Float32Array(12);
  const H = [[0, 1], [12, 0.75], [19, 0.55], [24, 0.4], [28, 0.3], [31, 0.25]];
  for (const m of midis) for (const [d, w] of H) t[((m + d) % 12 + 12) % 12] += w;
  return t;
}
const cos = (a, b) => {
  let ab = 0; let aa = 0; let bb = 0;
  for (let i = 0; i < 12; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
};

const CANDIDATES = (() => {
  const out = [];
  for (let r = 0; r < 12; r++) {
    out.push([48 + r, 52 + r, 55 + r]); // major
    out.push([48 + r, 51 + r, 55 + r]); // menor
    out.push([48 + r, 55 + r]); // power chord
    out.push([48 + r]); // una nota
  }
  return out.map(template);
})();

/**
 * S'assembla el croma a l'acord esperat?
 * Torna { sim (0–1), rel (sim respecte del millor acord possible) }.
 */
export function chordScore(chr, midis) {
  const sim = cos(chr, template(midis));
  let best = sim;
  for (const c of CANDIDATES) best = Math.max(best, cos(chr, c));
  return { sim, rel: best ? sim / best : 0 };
}
