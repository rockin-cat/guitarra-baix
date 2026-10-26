# ROCKIN · Guitarra i baix

Tutor d'estudi de **guitarra elèctrica** i **baix elèctric** amb els fulls de ruta ROCKIN (10 nivells per instrument) i les cartes ROCKIN. No escolta l'instrument: cada pas és

1. **Escolta**: sona la banda i la teva part, i l'animació ensenya què es fa.
2. **Ara tu**: la banda continua sense el teu instrument; el mànec, la púa i la pista et guien.
3. **Com t'ha anat?**: tu marques el nivell (**En procés**, **A prop** o **Ja ho tens!**) i el joc et diu què pots fer (vegeu «Nivell d'assoliment», a sota).

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
- El que surt («Ja ho tens!») en aquests camins és com es toquen els acords a la resta de nivells; també es pot canviar a la pràctica (selector «Acords»).
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

## Res d'impossible (versió 15)

- Recursos tècnics sobre la cançó: el bending i el glissando ja no surten mai des d'una corda a l'aire, ni un hammer-on que no arribi a la fonamental. Si la fonamental és a l'aire o massa avall, es busca la mateixa nota (o l'octava) on hi hagi trasts per sota. Al baix, el bending és d'un semitò. El pull-off ara acaba a la fonamental.
- Baix: la línia del Generador només substitueix els passos de fonamentals (sense carta). Els passos d'octaves, arpegis i cartes fan el seu patró, que sempre parteix de la fonamental a la 4a o 3a corda (així l'octava sempre hi cap). La desena i la dotzena, si queden fora de la mà, es fan una octava avall.

## Nivell d'assoliment (versió 16)

- En acabar de tocar marques **En procés**, **A prop** o **Ja ho tens!** (es desen com abans: `no`, `gairebe`, `ok`). Un pas compta com a fet a partir d'«A prop»; els de «Totes les cartes», quan alguna carta ho és.
- Si no és «Ja ho tens!», **Què t'ha faltat?**: tries una o més coses concretes segons el tipus de pas (canviar d'acord a temps, trobar les notes, mantenir el ritme de la carta, seguir la banda, la mà dreta, saber on som de la cançó…). Es desa al pas (`gaps`) i surt la propera vegada, a la pràctica i a la llista del nivell.
- **Què creus que necessites ara?**: l'eina no recomana, pregunta. Opcions en ordre fix i sense destacar-ne cap: baixar (o pujar) el tempo, posar o treure la guia sonora, practicar només el que falla quan es pot aïllar (acord corda a corda, només mà dreta), tornar a un pas anterior que treballa el que has marcat, repetir igual, passar al pas següent i, si ja ho tenies, «Ja no cal: ho porto al grup». Cada tria es desa (`choices` del jugador, màx. 300) amb la que hauria proposat l'eina i el nivell del següent intent relacionat.
- **Com tries el teu camí** (a «Què sé fer», a partir de 5 decisions): frases sobre si les tries t'han funcionat i les teves últimes decisions; només aquí es veu què hauria proposat l'eina.
- Quan tot el camí és a «A prop» o més: «Has acabat el camí. Ja pots portar-ho al teu grup…», a l'inici, al full de ruta i a «Què sé fer».
- Ja no surt el tempo màxim de cada pas ni de cada nivell. La improvisació lliure («Lliure, amb reptes») no puntua.

## «Ara ve» abans i pantalla completa (versió 18)

- L'acord següent («Ara ve», l'anell discontinu al mànec) surt 2 temps abans del canvi per defecte. A ⚙︎ Configuració es pot posar 1 temps o 1 compàs abans.
- Botó de pantalla completa a la barra de dalt i a la pantalla de pràctica. A la pràctica, en pantalla completa s'amaguen la barra de dalt i el menú lateral i la pista es fa més alta.

## El joc t'escolta (versió 19, prova)

Amb un cable jack → USB (o l'ampli connectat per USB), el joc escolta la guitarra o el baix i corregeix com el de bateria.

- **🎸 Connecta la guitarra** (a la pràctica): tries l'entrada, veus el nivell i la nota que sent, ajustes el retard (sonen clics i toques una corda a cada clic) i tries com d'exigent (fàcil, normal, exigent). Es recorda.
- Mentre toques tu («Ara tu»): a cada cop surt «Perfecte!», «Una mica aviat/tard», «Era Re (corda 4, trast 0)», «Era G», «L'acord no sona net», «Cop de més», «Aquí la mà no toca» (fletxa grisa) o «No ha sonat». Els hammer-on, pull-off, bendings i glissandos es comproven per la nota a què arriben. La barra «aviat — tard» ensenya si vas avançat o endarrerit.
- En acabar: «El joc t'ha escoltat: 86 %», a temps, notes/acords bons, consells, i marca el nivell (Ja ho tens! ≥ 90 %, A prop ≥ 75 %) i el que ha faltat. L'alumne ho pot canviar.
- Al nivell 7 (afinar), un afinador amb agulla.
- Fitxers: `js/dsp.js` (altura amb YIN, croma dels acords), `js/listen.js` (entrada, atacs, diàleg i calibratge), `js/gjudge.js` (el jutge).
- Limitacions: amb distorsió forta els acords s'avaluen pitjor; no distingeix si el rascat va amunt o avall; amb el micròfon de l'ordinador s'equivoca més que amb cable.

## Sentir la guitarra, afinador i senyals a la pantalla (versions 20–22)

- Botó **🎸 Connecta la guitarra** també a la barra de dalt (verd quan escolta).
- Al diàleg: **afinador** (corda més propera, agulla, «apreta / afluixa la clavilla», i les cordes que ja estan afinades es marquen en verd) i **sentir la guitarra per l'ordinador** amb so d'ampli: Net, Net amb reverb, Una mica de distorsió, Distorsió, i volum (amb auriculars; si ja sona per l'ampli, apagat). Al baix, menys distorsió i reverb.
- Quan toques endollat: a la pista, un anell verd/taronja/vermell al cop que tocava i un punt on has tocat tu; l'escenari fa un llampec del mateix color; al mode mà dreta, la fletxa s'encén del color.

## Versió 23

- Botó **Afinador** a la barra de dalt (obre el quadre de la guitarra directament a l'afinador). El quadre ara es diu «La teva guitarra»: connectar, afinador, so d'ampli i retard.
- **Sense fitxers vells**: `index.html` porta un mapa d'importació amb la versió a cada mòdul (`?v=23`), així el navegador no barreja versions. Per pujar de versió: `python3 tools/versio.py 24 "dd-mm-aaaa"`.

## Pràctica més senzilla (versió 24)

- Dos botons grans: **👂 Escolta** (t'ho ensenya) i **▶ Toca** (et toca a tu, amb la banda). Mentre sona, només hi ha **■ Atura**. Barra d'espai = Toca / Atura.
- **L'ajuda es retira sola**, pas a pas: amb guia sonora → sense guia → l'ajuda de la pantalla s'esvaeix → més ràpid fins al tempo de la cançó. Puja quan et surt i baixa quan no («La propera vegada, …»). Els punts al costat de Toca diuen on ets. Es desa per a cada pas i alumne.
- Tota la resta (tempo, voltes, metrònom, guia sonora, retirar l'ajuda a mà, només mà dreta, corda a corda, escolta i toca seguit, acords, cançó sencera, connectar la guitarra) és a **⚙ Opcions**, tancat. Si l'alumne hi toca la guia o l'ajuda, l'ajuda automàtica s'atura en aquell pas.
- **«Com t'ha anat?»** surt al mig de l'escenari en acabar (ja no al lateral), amb el que canviarà la propera vegada i les opcions (▶ Torna-hi, pas següent…).
