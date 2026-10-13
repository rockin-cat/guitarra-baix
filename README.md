# ROCKIN · Guitarra i baix

Tutor d'estudi de **guitarra elèctrica** i **baix elèctric** amb els fulls de ruta ROCKIN (10 nivells per instrument) i les cartes ROCKIN. No escolta l'instrument: cada pas és

1. **Escolta**: sona la banda i la teva part, i l'animació ensenya què es fa.
2. **Ara tu**: la banda continua sense el teu instrument; el mànec, la púa i la pista et guien.
3. **Com t'ha anat?**: «Encara no» baixa el tempo, encén la guia sonora i torna a ensenyar-ho; «Em surt» proposa pujar el tempo o passar al pas següent.

A més, **La meva cançó**: escrius acords (`C | G | Am | F`, dos acords en un compàs separats per un espai), compàs, tempo, estil i nivell, i el joc fa la base i l'animació. Es poden desar i carregar de la biblioteca del Generador de diagrames (mateix codi del professorat).

## Com obrir-lo en local

```
cd ~/Documents/GitHub/guitarra-baix
python3 tools/serve.py
```

(Amb doble clic a `index.html` no funciona: el navegador no carrega els mòduls des de `file://`.)

## Fitxers

| Fitxer | Què fa |
|---|---|
| `js/levels.js` | **Els fulls de ruta**: nivells i passos (acords, compàs, tempo, estil, què es toca, consells). Per afegir o canviar passos, només cal editar aquest fitxer. |
| `js/parts.js` | La part de l'alumnat: rasgueigs (amb direcció de la púa), rascats, arpegis amb cartes melòdiques, baix per papers (1, 3, 5, 8), riffs amb hammer-on / pull-off / glissando / bending. |
| `js/band.js` | La banda (bateria, baix, teclat, guitarra) per estils i compassos (4/4, 3/4, 2/4, 6/8, 12/8). Calla l'instrument que toques. |
| `js/fretboard.js` | Afinacions, acords oberts, celletes (formes de Mi i de La), power chords, posicions del baix. |
| `js/neck.js` | L'animació del mànec (dits, celleta, acord següent, púa amunt/avall, cordes que vibren) i el diagrama vertical d'acord. |
| `js/lane.js` | La pista que avança: fletxes, notes, acords i línia de veu. |
| `js/session.js` | La pantalla de pràctica, l'afinador (nivell 7), el compositor (nivell 9) i la improvisació (nivell 10). |
| `js/player.js`, `js/audio.js` | Rellotge i so (Web Audio amb mostres). |
| `js/data/cartes.js` | Les cartes ROCKIN (de `Cartes-rockin/dades.js`). Imatges reduïdes a `assets/cartes/`. |
| `js/library.js` | Biblioteca compartida del Generador. |
| `js/store.js` | Progrés al navegador (`rockin.guitarrabaix.v1`): diversos alumnes al mateix ordinador. |

Sons: mostres lliures amb llicència MIT (vegeu `assets/sons/LLICENCIA.txt`).

## Cançons (versió 2)

«Cançons» obre, des d'un mateix lloc:
- el **Llibre de temes ROCKIN** (el mateix del joc de teclat: es llegeix el publicat a `rockin-cat.github.io/rockin/js/songbook.js` i, si no hi arriba, la còpia `js/data/llibre.js`);
- les **rodes de cançons** del joc de teclat i les cançons **fetes o obertes al joc de teclat** en aquest navegador (`rockin.play.paths`; només quan els dos jocs s'obren des de rockin-cat.github.io);
- la **biblioteca compartida** del Generador de diagrames, que és la mateixa que fan servir els jocs de teclat i de bateria (mateix codi del professorat).

Les cançons porten l'estructura: `[Tornada] C | G | …` posa nom a la part, i surt a la pista.
