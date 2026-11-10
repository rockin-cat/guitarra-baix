// Connecta el joc de guitarra i baix amb la classe del portal Rockin: el docent veu el full de ruta i el temps de pràctica.
import { connectaClasse } from '/classe/classe.js';
import * as store from './store.js';
import { summary } from './skills.js';

const NOM = { guitarra: 'Guitarra', baix: 'Baix' };
const ESTAT = { ok: 'ok', gairebe: 'gairebe', no: 'no' };

function resumInstrument(inst) {
  const s = summary(inst);
  let fet = 0, total = 0, intents = 0, darrer = 0;
  const costa = [];
  const blocs = s.levels.map((L) => {
    const items = L.steps.map((pas) => {
      const r = store.stepState(pas.id);
      if (r) { intents += r.attempts ?? 0; darrer = Math.max(darrer, r.last ?? 0); }
      const e = r ? ESTAT[r.best] ?? (r.attempts ? 'no' : null) : null;
      if (r && r.attempts >= 3 && r.best !== 'ok') costa.push(`${pas.titol} (${r.attempts} intents)`);
      return { t: pas.grup ? `${pas.grup} · ${pas.titol}` : pas.titol, e, n: r?.attempts ?? 0, tempo: r?.tempo || null };
    });
    fet += L.doneCount;
    total += L.steps.length;
    return { titol: `${NOM[inst]} · Nivell ${L.level.n} · ${L.level.titol}`, fet: L.doneCount, total: L.steps.length, banda: L.unlocked ? L.banda || null : null, items };
  });
  const nivell = s.levels.reduce((m, L) => (L.unlocked ? L.level.n : m), 0);
  return { fet, total, intents, darrer, costa, blocs, nivell, tocat: intents > 0 };
}

function resum() {
  const p = store.player();
  if (!p) return null;
  const actual = store.instrumentOf();
  const altre = actual === 'guitarra' ? 'baix' : 'guitarra';
  const a = resumInstrument(actual);
  const b = resumInstrument(altre);
  const parts = b.tocat ? [a, b] : [a];
  const ws = store.workSong();
  return {
    v: 1, app: 'guitarra', titol: `Full de ruta de ${b.tocat ? 'guitarra i baix' : NOM[actual].toLowerCase()}`,
    instrument: actual,
    fet: parts.reduce((x, r) => x + r.fet, 0), total: parts.reduce((x, r) => x + r.total, 0),
    nivell: a.nivell, intents: parts.reduce((x, r) => x + r.intents, 0),
    darrer: Math.max(...parts.map((r) => r.darrer)) || null,
    costa: parts.flatMap((r) => r.costa).slice(0, 5),
    extra: ws?.titol ? `Cançó amb què treballa: ${ws.titol}${ws.artista ? ' · ' + ws.artista : ''}` : null,
    blocs: parts.flatMap((r) => r.blocs),
  };
}

connectaClasse({
  app: 'guitarra',
  perfil: () => { const n = store.currentName(); return n ? { id: n, nom: n } : null; },
  resum,
  lloc: { left: '104px' },    // al costat de la barra lateral
});
