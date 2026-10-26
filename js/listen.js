// L'entrada de la guitarra o el baix: un cable jack → USB (o l'ampli connectat per USB).
// Escolta el senyal, detecta cada atac (quan toques) i analitza què sona (nota o acord).
// Tot el temps va en el rellotge de l'AudioContext, el mateix que la banda.

import { audioContext, resumeAudio, click } from './audio.js';
import { yin, freqToMidi, chroma } from './dsp.js';
import * as store from './store.js';

const WORKLET = `
class RkTap extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(1024); this.n = 0; this.t = 0; }
  process(inputs) {
    const inp = inputs[0];
    if (!inp || !inp.length) return true;
    const L = inp[0].length;
    if (this.n === 0) this.t = currentTime;
    for (let i = 0; i < L; i++) {
      let v = 0;
      for (let c = 0; c < inp.length; c++) v += inp[c][i];
      this.buf[this.n + i] = v / inp.length;
    }
    this.n += L;
    if (this.n >= 1024) { this.port.postMessage({ t: this.t, buf: this.buf.slice(0, this.n) }); this.n = 0; }
    return true;
  }
}
registerProcessor('rk-tap', RkTap);`;

const KEEP = 2.5; // segons de senyal que es guarden
const FRAME = 64; // mostres per finestra de detecció d'atac

let L = null; // { stream, src, node, sink, sr, chunks, ... }
const listeners = new Set();

export const settings = () => (store.settings().listen ??= { on: false, deviceId: '', inLat: 0.02, tol: 'normal' });
export const isOn = () => !!L;
export const sampleRate = () => L?.sr ?? 48000;

/** Les entrades d'àudio (els noms només surten després de donar permís). */
export async function devices() {
  const all = await navigator.mediaDevices.enumerateDevices();
  return all.filter((d) => d.kind === 'audioinput');
}

export async function start(deviceId = settings().deviceId) {
  stop();
  await resumeAudio();
  const ctx = audioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 2 } },
  });
  if (!ctx.__rkTap) {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' }));
    await ctx.audioWorklet.addModule(url);
    ctx.__rkTap = true;
  }
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'rk-tap', { numberOfInputs: 1, numberOfOutputs: 1, channelCountMode: 'max' });
  const sink = ctx.createGain();
  sink.gain.value = 0; // no se sent: només s'analitza (la guitarra ja sona per l'ampli o els auriculars)
  src.connect(node); node.connect(sink); sink.connect(ctx.destination);
  L = {
    stream, src, node, sink, sr: ctx.sampleRate, chunks: [],
    hp: 0, prevX: 0, env: 0, slow: 0, noise: 0.002, lastOnset: -1, level: 0, peakHold: 0,
    label: stream.getAudioTracks()[0]?.label ?? '',
  };
  node.port.onmessage = (e) => ingest(e.data.t, e.data.buf);
  const s = settings();
  if (deviceId) s.deviceId = deviceId;
  store.save();
  return L.label;
}

export function stop() {
  if (!L) return;
  try { L.node.port.onmessage = null; L.src.disconnect(); L.node.disconnect(); L.sink.disconnect(); } catch { /* ja desconnectat */ }
  for (const t of L.stream.getTracks()) t.stop();
  L = null;
}

/** cb({ t }) a cada atac (t = temps del rellotge de l'àudio en què ha entrat el so). Torna la funció per treure'l. */
export function onOnset(cb) { listeners.add(cb); return () => listeners.delete(cb); }

/** Nivell d'entrada (0–1) per al vúmetre. */
export const level = () => (L ? Math.min(1, L.level * 4) : 0);

function ingest(t, buf) {
  const sr = L.sr;
  L.chunks.push({ t, buf });
  while (L.chunks.length && L.chunks[0].t < t - KEEP) L.chunks.shift();
  // detecció d'atacs: energia del senyal (sense greus) en finestres de 64 mostres
  for (let j = 0; j + FRAME <= buf.length; j += FRAME) {
    let s = 0;
    for (let i = j; i < j + FRAME; i++) {
      const x = buf[i];
      L.hp = 0.96 * (L.hp + x - L.prevX); // passa-alts suau (treu el soroll greu i el corrent continu)
      L.prevX = x;
      s += L.hp * L.hp;
    }
    const e = Math.sqrt(s / FRAME);
    const ft = t + j / sr;
    L.level = Math.max(e, L.level * 0.97);
    // el soroll de fons puja a poc a poc i baixa de pressa
    L.noise = e < L.noise ? 0.9 * L.noise + 0.1 * e : 0.9995 * L.noise + 0.0005 * e;
    const thr = Math.max(0.006, L.noise * 5);
    const rising = e > thr && e > L.slow * 1.9 + 0.002;
    if (rising && ft - L.lastOnset > 0.07) {
      L.lastOnset = ft;
      for (const cb of listeners) cb({ t: ft, e });
    }
    L.slow = 0.8 * L.slow + 0.2 * e; // la mitjana dels últims ~7 ms
    L.env = e;
  }
}

/** Les mostres que comencen al temps t (o null si encara no han arribat o ja no hi són). */
export function samplesAt(t, n) {
  if (!L || !L.chunks.length) return null;
  const sr = L.sr;
  const cs = L.chunks;
  let k = cs.findIndex((c) => t < c.t + c.buf.length / sr);
  if (k < 0 || t < cs[0].t) return null;
  const out = new Float32Array(n);
  let got = 0;
  let from = Math.max(0, Math.floor((t - cs[k].t) * sr));
  for (; k < cs.length && got < n; k++, from = 0) {
    const b = cs[k].buf;
    while (from < b.length && got < n) out[got++] = b[from++];
  }
  return got >= n ? out : null;
}

/** Fins quin temps tenim senyal. */
export const availableUntil = () => {
  if (!L || !L.chunks.length) return -Infinity;
  const c = L.chunks[L.chunks.length - 1];
  return c.t + c.buf.length / L.sr;
};

/** Què sona a partir del temps t: { midi, conf, chroma }. Espera que hi hagi prou senyal. */
export function analyzeAt(t, { pitch = true, chord = false } = {}) {
  const sr = sampleRate();
  const nP = 4096 * (sr > 50000 ? 2 : 1);
  const nC = 8192 * (sr > 50000 ? 2 : 1);
  const need = t + (chord ? nC : nP) / sr;
  return new Promise((resolve) => {
    const tryIt = () => {
      if (!L) return resolve(null);
      if (availableUntil() < need) return setTimeout(tryIt, 25);
      const out = {};
      if (pitch) {
        const x = samplesAt(t, nP);
        const r = x ? yin(x, sr) : null;
        out.midi = r ? freqToMidi(r.f0) : null;
        out.conf = r?.conf ?? 0;
      }
      if (chord) {
        const x = samplesAt(t, nC);
        out.chroma = x ? chroma(x, sr) : null;
      }
      resolve(out);
    };
    tryIt();
  });
}

/** La nota que sona ara mateix (per al vúmetre i l'afinador del diàleg). */
export function currentNote() {
  if (!L) return null;
  const sr = L.sr;
  const n = 4096 * (sr > 50000 ? 2 : 1);
  const x = samplesAt(availableUntil() - n / sr, n);
  if (!x) return null;
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  if (Math.sqrt(s / x.length) < 0.004) return null;
  const r = yin(x, sr);
  return r && r.conf > 0.7 ? freqToMidi(r.f0) : null;
}

// ---- Ajust del retard (calibratge) ------------------------------------------------------------------------------

/**
 * Sonen 8 clics i l'alumne toca una corda a cada clic. Torna el retard d'entrada (s) o null.
 * onTick(i) a cada clic, per animar el diàleg.
 */
export async function calibrate(onTick) {
  if (!L) return null;
  const ctx = audioContext();
  const spb = 0.6;
  const t0 = ctx.currentTime + 1.2;
  const N = 10;
  const clicks = Array.from({ length: N }, (_, i) => t0 + i * spb);
  clicks.forEach((t, i) => click(t, i % 4 === 0));
  const outLat = ctx.outputLatency || ctx.baseLatency || 0;
  const hits = [];
  const off = onOnset(({ t }) => hits.push(t));
  const timers = clicks.map((t, i) => setTimeout(() => onTick?.(i), Math.max(0, (t + outLat - ctx.currentTime) * 1000)));
  await new Promise((r) => setTimeout(r, (t0 + N * spb + 0.4 - ctx.currentTime) * 1000));
  off();
  timers.forEach(clearTimeout);
  // per a cada clic (menys els dos primers, d'escalfament), l'atac més proper
  const d = [];
  for (const c of clicks.slice(2)) {
    const heard = c + outLat;
    let best = null;
    for (const h of hits) if (Math.abs(h - heard) < 0.25 && (best == null || Math.abs(h - heard) < Math.abs(best - heard))) best = h;
    if (best != null) d.push(best - heard);
  }
  if (d.length < 4) return null;
  d.sort((a, b) => a - b);
  const med = d[Math.floor(d.length / 2)];
  const v = Math.max(-0.05, Math.min(0.25, med));
  settings().inLat = v;
  store.save();
  return v;
}

// ---- El diàleg «Connecta la guitarra» -------------------------------------------------------------------------

const NOTE_NAMES = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
export const noteName = (m) => `${NOTE_NAMES[((Math.round(m) % 12) + 12) % 12]}`;

/** Obre el diàleg. onChange(on) quan s'encén o s'apaga l'escolta. */
export function openDialog({ onChange } = {}) {
  let dlg = document.getElementById('listen-dlg');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'listen-dlg';
    dlg.className = 'listen-dlg';
    document.body.append(dlg);
  }
  const s = settings();
  dlg.innerHTML = `
    <form method="dialog">
      <h2>Connecta la guitarra</h2>
      <p class="muted small">Amb un cable jack → USB (o l'ampli connectat a l'ordinador per USB), el joc escolta el que toques i et diu si va a temps i si la nota o l'acord són els bons, com al joc de bateria.</p>
      <ol class="ld-steps">
        <li>Connecta el cable a l'ordinador i tria'l aquí:
          <div class="row"><select id="ld-dev"><option value="">Entrada per defecte</option></select><button type="button" class="btn btn-ghost btn-small" id="ld-on">Escolta</button></div></li>
        <li>Toca una corda: la barra s'ha de moure. <div class="ld-meter"><i id="ld-bar"></i></div><span class="ld-note" id="ld-note">—</span></li>
        <li>Ajusta el retard: sonaran clics i toca una corda a cada clic. <div class="row"><button type="button" class="btn btn-ghost btn-small" id="ld-cal">Ajusta el retard</button><span class="muted small" id="ld-cal-out">${s.inLat != null ? `Ara: ${Math.round(s.inLat * 1000)} ms` : ''}</span></div></li>
      </ol>
      <label class="set-row">Com d'exigent
        <select id="ld-tol"><option value="facil">Fàcil (per començar)</option><option value="normal">Normal</option><option value="exigent">Exigent</option></select></label>
      <p class="muted small">Amb auriculars: connecta'ls a l'ordinador (o a l'ampli, si l'ordinador hi envia el so per USB) per sentir la banda i la guitarra alhora. Sense cable, el micròfon de l'ordinador també funciona, però s'equivoca més.</p>
      <div class="row"><button type="button" class="btn btn-ghost" id="ld-off">Deixa d'escoltar</button><button class="btn btn-primary" value="ok">Fet</button></div>
    </form>`;
  const $ = (id) => dlg.querySelector(`#${id}`);
  $('ld-tol').value = s.tol ?? 'normal';
  $('ld-tol').addEventListener('change', (e) => { s.tol = e.target.value; store.save(); });
  const fill = async () => {
    try {
      const list = await devices();
      const sel = $('ld-dev');
      sel.innerHTML = '<option value="">Entrada per defecte</option>' + list.map((d) => `<option value="${d.deviceId}">${(d.label || 'Entrada').replace(/[<>&"]/g, '')}</option>`).join('');
      sel.value = list.some((d) => d.deviceId === s.deviceId) ? s.deviceId : '';
    } catch { /* sense permís encara */ }
  };
  const turnOn = async () => {
    try {
      await start($('ld-dev').value);
      s.on = true; store.save();
      await fill();
      $('ld-on').textContent = 'Escoltant ✓';
      onChange?.(true);
    } catch (err) {
      $('ld-note').textContent = err?.name === 'NotAllowedError' ? 'Cal donar permís al navegador per fer servir l\'entrada d\'àudio.' : 'No s\'ha pogut obrir l\'entrada. Comprova el cable.';
    }
  };
  $('ld-on').addEventListener('click', turnOn);
  $('ld-dev').addEventListener('change', turnOn);
  $('ld-off').addEventListener('click', () => { stop(); s.on = false; store.save(); $('ld-on').textContent = 'Escolta'; onChange?.(false); });
  $('ld-cal').addEventListener('click', async () => {
    if (!isOn()) await turnOn();
    if (!isOn()) return;
    const out = $('ld-cal-out');
    $('ld-cal').disabled = true;
    out.textContent = 'Prepara\'t…';
    const v = await calibrate((i) => { out.textContent = i < 2 ? `Escolta… ${i + 1}` : `Toca! ${i - 1} de 8`; });
    $('ld-cal').disabled = false;
    out.textContent = v == null ? 'No t\'he sentit prou: torna-ho a provar (toca fort i a temps).' : `Fet: ${Math.round(v * 1000)} ms`;
  });
  let raf = 0;
  const meter = () => {
    raf = requestAnimationFrame(meter);
    $('ld-bar').style.width = `${Math.round(level() * 100)}%`;
    const m = currentNote();
    if (m != null) $('ld-note').textContent = `Sento: ${noteName(m)}`;
  };
  dlg.addEventListener('close', () => cancelAnimationFrame(raf), { once: true });
  dlg.showModal();
  meter();
  if (isOn()) { $('ld-on').textContent = 'Escoltant ✓'; fill(); } else turnOn();
}
