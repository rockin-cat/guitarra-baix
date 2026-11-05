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

## Versió 25 · menys lletra
- Botons només amb símbol: 👂 Escolta, ▶ Toca, ■ Para; marcador amb ⏱ 👂 🎸 TU 👀.
- Triar un nivell al full de ruta porta directament a tocar el primer pas pendent; els subnivells són punts a la capçalera de la mateixa pantalla (sense menú intermedi).
- Abans de tocar, el pas es veu animat en silenci (👀) com a exemple.
- «Aprèn a llegir la pantalla»: animacions i etiquetes curtes en lloc de paràgrafs.

## Versió 26 · res no es desplaça
- La pista que corria de dreta a esquerra ara és un mapa quiet: a dalt, **la roda** (els compassos de la part on ets, amb el d'ara omplint-se); a sota, **el compàs d'ara**, fix, amb el patró sencer i una línia groga que el recorre.
- Al lateral, **totes les posicions de la cançó** (🖐 X): l'actual encesa, la que ve marcada amb línia discontínua.
- Cap pantalla té barra de desplaçament: les llistes de cançons van per pàgines (‹ 1/3 ›) i per nivell (0 · 1 · 2 · 3 · +); «Què sé fer» fa servir punts en lloc de llistes.

## Versió 27 · acords com al joc de teclat
- Als passos d'acords de guitarra (power chords, oberts, celletes) el mànec deixa pas a **les fitxes de la roda**: cada compàs és una fitxa gran amb l'acord. Power chords: només el **número del trast** de la fonamental (i la corda). Oberts i celletes: el **diagrama vertical**, com el del Generador.
- A sota, **la carta i el patró** de la mà dreta (fletxes; la barra vol dir «deixa que soni», el buit és silenci) que s'encenen amb el pols. Ni pista ni línia.
- La fitxa d'ara s'omple a mesura que avança el compàs; la que ve es marca amb línia discontínua.
- A ⚙ Opcions, «🎸 Mànec» torna a la vista del mànec.

## Versió 28 · la pilota que bota
- Com als jocs de teclat i bateria: **la carta del patró amb una pilota** que hi bota i cau a cada cop, i al costat **què toques** (el trast als power chords, el diagrama als oberts), amb el que ve en petit. A dalt, xips petits de la roda.
- Mana l'element nou: si el pas porta carta (patró rítmic, rascat), la carta és gran; si no, l'acord.
- Rascat: les fletxes animades només surten mentre escoltes (👂); quan toques tu, només la carta i la pilota.
- Al diàleg de la guitarra, **🔊 Sortida**: amb el cable USB connectat, l'ordinador pot enviar-hi el so i no se sent la banda. Aquí es tria per on ha de sortir, amb un botó de prova.

## Versió 29 · mínims elements
- Una sola fila: la roda és l'única que diu què toques (el trast als power chords, el diagrama als oberts). La fitxa d'ara s'il·lumina; les altres queden apagades. Fora el bloc «què toques» duplicat i els números de pols.
- La carta i la pilota es mouen com al joc de teclat: la pilota cau al centre de cada rodona, un cop per pols, amb la mateixa geometria de cartes (`js/data/layouts.js`, copiada de `data/cards.json` del joc de teclat). Si el joc t'escolta, sota cada rodona surt un punt verd, taronja o vermell.

## Versió 30
- Fora la barra de progrés sota els números: el temps ja el marca la pilota.
- L'últim temps de la carta: la pilota vola de tornada a la primera rodona i hi cau just al primer temps del compàs següent (com al joc de teclat, on vola a la carta següent).

## Versió 31 · directe al pòster
- En entrar (o triar qui toca), el joc va directament al **pòster del full de ruta**.
- Si encara no hi ha cançó, en tocar un nivell es tria **la cançó o la progressió d'acords** i s'entra de seguida al nivell (un sol clic a la llista).
- Per canviar-la: el botó «🎵 cançó ✎» del pòster o la píndola de la barra de dalt; després es torna on eres.
- **Escoltar és veure com es fa a la guitarra**: a 👂 (i a l'animació muda abans de començar) surt el mànec amb la púa, i al rascat les fletxes. Quan toques tu (▶), la roda i la carta amb la pilota.

## Versió 32 · so, base que canvia i patrons melòdics
- **Les animacions sonen**: a «Aprèn a llegir la pantalla» cada corda, trast, acord, cop de púa i rodona de carta sona (🔊/🔇 a la capçalera). La primera vegada que entres en un pas, l'exemple sona i es veu sol.
- **Base que canvia** (⚙ Opcions): a cada volta la banda canvia: bateria i baix → amb teclat → tota la banda; redoble al final de cada volta i plat al començar-ne una; a partir de la 5a volta l'estil va rotant.
- **Patrons melòdics (guitarra)**: amb power chords el dibuix es fa amb la forma (fonamental, quinta, octava). Amb acords oberts es trien tantes **cordes** com alçades té el dibuix (botons 6…1 al costat de ▶; per defecte 4·3 o 4·3·2) i el dibuix va per aquestes cordes; si en un acord una corda no sona, s'agafa la veïna. A l'escolta es veu el mànec amb les cordes triades il·luminades i la carta amb la pilota. La pilota segueix els punts de la carta melòdica (geometria del joc de teclat, `MELODIC_LAYOUT`).
- Cartes de rascat: la pilota cau a cada fletxa que toca (posicions mesurades a les imatges). «Només mà dreta» ja no és el mode per defecte.
- Diàleg de la guitarra: 🔊 tria de la sortida de so.

## Versió 33 · final al temps fort, redobles que canvien, l'animació sona
- **Acabament**: quan s'acaba la lliçó, al temps fort del compàs següent tota la banda fa un cop (plat, bombo, baix, teclat, guitarra) i el deixa sonar; la teva part també hi és (🏁 al marcador).
- **Redobles diferents** a cada volta (sis patrons que van rotant).
- **L'animació d'abans de començar sona** (la teva part, fluixa, sense banda), i la guia sonora mentre toques tu va **a l'esquerra** i una mica més forta, perquè es distingeixi de la banda.
- Patrons melòdics amb power chords: sempre amb la forma sencera (1 · 5 · 8), encara que al nivell només se'n toqui una part.
- Diagrames amb celleta més amunt del 5è trast: el número de trast es veu (més gran i amb lloc propi).

## Versió 34
- **L'estil de la banda canvia d'un exercici a l'altre**: cada pas té el seu (pop, rock, balada, funk, reggaeton, reggae, rumba, shuffle…), rotant a partir de l'estil de la cançó; es veu a dalt de l'escenari («♪ Funk»). Es desactiva amb «Base que canvia».

## Versió 35
- **S'acaba a la tònica**: el cop final és l'acord I de la tonalitat (o i, si és menor), no l'últim acord del tros. La tonalitat s'endevina mirant quins acords són de cada tonalitat candidata (`guessKey`).
- **Power chords i celletes llisquen pel mànec** fins al trast nou en comptes de desaparèixer i tornar a sortir (més lent com més lluny).

## Versió 36 · demostració que porta a l'exercici, pausa, base millor
- **👂 = l'exemple i, tot seguit, l'exercici** (l'últim compàs de l'exemple fa de compte: «👂 → 🎸»). Fora el botó «Escolta i toca seguit».
- **⏸ Pausa** mentre sona (barra d'espai = pausa/continua).
- **Mescla de l'exemple**: la bateria i la banda baixen mentre sona la mostra de guitarra o baix.
- **Lliscament en anacrusa**: els power chords i les celletes llisquen després de l'últim cop i al temps 1 ja són al trast nou.
- **Hammer-on / pull-off**: la segona nota ja no té atac de púa (se salta l'atac de la mostra i entra suau).
- **Base millor**: charles amb accents, charles obert a l'últim contratemps (3a volta), ride (4a), nota d'aproximació del baix abans de cada canvi d'acord, plat als canvis de part, teclat amb un petit cop a l'«i» de 2 al pop, i una mica d'imprecisió humana als temps i les forces.

## Versió 37
- **Entrada entre l'exemple i l'exercici**: després de la demostració hi ha un compàs de compte (⏱) abans de tocar.
- **Mànec de 15 trasts**: els power chords i les celletes dels trasts alts (Eb a l'11, amb la quinta al 13) es veuen sencers. Marques als trasts 12 i 15.

## Versió 38
- **La demostració fa tota la roda** (abans, amb la cançó sencera, només la primera part o 8 compassos) i en tocar es comença des del principi de la roda.
- **A la demostració també es veu la carta** amb la pilota, sota el mànec.

## Versió 39 · mostres noves de bateria i baix
- **Bateria: SM Drums** (domini públic): bombo, caixa, aro, sidestick, charles tancat/obert/peu, ride, crash i tres toms, amb **3 capes de força i 2 variants** per peça (72 mp3, 1,5 MB).
- **Baix: Swagbass** de Karoryfer (CC0): capes p, f (2 variants) i fff de La1 a Do5 (56 mp3, 1,6 MB).
- El motor tria la capa segons la força del cop o el volum de la nota i va alternant les variants (`pickLayer` a `audio.js`); els noms de fitxer «peça_vN_rM» i «nota_capa_rM» ho indiquen. Crèdits a `assets/sons/LLICENCIA.txt`.

## Versió 40
- Baix: els noms de les mostres de Swagbass van una octava per sobre de la notació habitual (el seu «a2» sona a 55 Hz, La1); reanomenades una octava avall perquè l'afinació sigui la correcta.
