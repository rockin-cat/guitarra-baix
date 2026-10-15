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

## Pantalla (versió 13)

Barra de navegació a l'esquerra (a baix al mòbil) i cada pantalla cap a la finestra: si un bloc és llarg, només es desplaça aquell bloc. L'instrument només es canvia a la barra de dalt.

## Cançons (versió 2)

«Cançons» obre, des d'un mateix lloc:
- el **Llibre de temes ROCKIN** (el mateix del joc de teclat: es llegeix el publicat a `rockin-cat.github.io/teclat/js/songbook.js` i, si no hi arriba, la còpia `js/data/llibre.js`);
- les **rodes de cançons** del joc de teclat i les cançons **fetes o obertes al joc de teclat** en aquest navegador (`rockin.play.paths`; només quan els dos jocs s'obren des de rockin-cat.github.io);
- la **biblioteca compartida** del Generador de diagrames, que és la mateixa que fan servir els jocs de teclat i de bateria (mateix codi del professorat).

Les cançons porten l'estructura: `[Tornada] C | G | …` posa nom a la part, i surt a la pista.

## Sempre a partir d'una cançó (versió 3)

- Qui toca tria **la cançó amb què treballa** (botó «Treballa el full de ruta amb aquesta cançó» a Cançons). Tots els passos es practiquen amb el tros principal de la cançó (o sencera), menys les cartes d'un altre compàs, els riffs tècnics i l'afinador.
- **Guitarra, nivell 1**: camí dels **power chords** (un dit a la corda 6 per tot el mànec → + 5a → + 8a) i, quan el profe ho decideix, **acords oberts desbloquejant cordes** (només la corda 1, després 1–2… fins a totes), amb les cordes tapades en gris com al Generador de diagrames.
- El que surt («Em surt!») en aquests camins és com es toquen els acords a la resta de nivells; també es pot canviar a la pràctica (selector «Acords»).
- Les formes dels acords oberts són les de les cartes de diagrames ROCKIN.
- **Tot és acumulatiu sobre la mateixa roda** (versió 4): també els recursos tècnics (nivell 8: el hammer-on, el glissando… arriben a la fonamental de cada acord de la cançó), la melodia per cantar (nivell 4: surt de les notes dels acords) i les celletes (nivell 6). Només queden fora les cartes d'un altre compàs i l'afinador.
- **Baix del Generador** (versió 5): si la cançó de treball ve de la biblioteca i el professorat hi ha escrit una línia de baix (escriptor de baix o tabulatura), els passos de línia de baix (tipus `bass` i `arp`) toquen aquesta línia, amb els trasts al mànec. El selector «Línia de baix» de la pràctica permet tornar a «la del nivell» (es recorda per alumne).

## Versió 6: tot comença per la cançó

- Només es juga a partir d'una cançó: **La teva cançó** (Llibre ROCKIN, biblioteca compartida, joc de teclat, les meves) o, si no hi és, escrivint-ne els acords. La cançó es mostra com a la pestanya Estructura del Generador (graus amb els colors del llibre, parts amb capçalera taronja i compassos de quatre en quatre).
- Els nivells no canvien mai la progressió: els passos que no quadren amb el compàs de la cançó no surten, i n'hi ha de propis per a 3/4, 6/8 i 12/8 (cartes ternàries i rascats).
- **Què sé fer** (`js/skills.js`): el que s'ha desbloquejat a cada nivell (passos, tempo, cartes) i què vol dir per a la banda. Es pot imprimir.

## Llibre ROCKIN obert (versió 12)

`js/data/llibre-obert.js` és una còpia de les cançons de la biblioteca compartida del Generador (acords amb l'estructura, compàs, tempo, estil i línia de baix; sense lletres), perquè l'alumnat les obri sense el codi del professorat. És una foto del 13-10-2026: les cançons noves o els canvis a la biblioteca no hi arriben fins que es torna a generar el fitxer. Al «Llibre ROCKIN» surten per nivells i, a sota, les del Llibre de temes del joc de teclat que no hi són.

## Només mà dreta i ajuda que es retira (versió 14)

- Als passos de rascat (i a les cartes de rascat), «Només mà dreta» amaga el mànec i la pista: surt la carta i les fletxes del rascat en gran, que s'encenen amb el pols (fletxa plena: toques; puntejada: la mà passa sense tocar). Està encès per defecte i es recorda.
- «Retira l'ajuda a poc a poc» (a tots els passos): mentre toques tu, l'ajuda visual s'esvaeix en quatre trams (tota → la pista s'apaga → gairebé res → només el pols). Amb voltes automàtiques es fan prou compassos per arribar al final.
