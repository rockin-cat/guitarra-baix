// Els fulls de ruta de guitarra elèctrica i baix elèctric (10 nivells cadascun).
// Cada nivell té passos. Un pas és una petita missió: escoltes, toques amb la banda i marques com ha anat.
//
// Camps d'un pas:
//   id, titol, text (què aprens), com: [consells], prog ('C | G | Am | F'), metre, tempo, estil,
//   part (vegeu parts.js), voicing ('obert' | 'celleta' | 'quinta'), voice ('count' | 'count8' | 'root' | melodia),
//   carta (id de carta ROCKIN que es mostra), kind: 'play' (per defecte) | 'cards' | 'tune' | 'compose' | 'improv'

const MELODIA_LA = [
  [[0, 1, 64, 'la'], [1, 1, 64, 'la'], [2, 1, 67, 'la'], [3, 1, 64, 'la']],
  [[0, 1, 62, 'la'], [1, 1, 62, 'la'], [2, 2, 67, 'laaa']],
  [[0, 1, 60, 'la'], [1, 1, 64, 'la'], [2, 1, 69, 'la'], [3, 1, 67, 'la']],
  [[0, 2, 65, 'laaa'], [2, 2, 60, 'laaa']],
];

export const LEVELS = {
  guitarra: [
    {
      n: 1, titol: "Roda d'acords", sub: "Tocar una roda d'acords", icona: '♫',
      passos: [
        { id: 'g1a', grup: 'Power chords', titol: 'Un dit a la corda 6', text: 'Cada acord de la cançó és una sola nota a la corda 6 (la més gruixuda): la fonamental. El dit va recorrent el mànec.', com: ['Fes servir el dit 1 i toca només la corda 6.', 'Mira a quin trast cau cada acord: el punt es mou per tot el mànec.', 'Un cop per compàs i deixa que soni.'], prog: 'G | D | Em | C', tempo: 70, estil: 'rock', part: { type: 'strum', rhythm: 'W' }, chordMode: { type: 'power', parts: 1 } },
        { id: 'g1b', grup: 'Power chords', titol: 'Un dit a la corda 6, a negres', text: 'La mateixa nota a cada temps, i saltes al trast de l\'acord següent.', com: ['Comença a moure el dit just abans del canvi: el contorn t\'avisa.'], prog: 'G | D | Em | C', tempo: 75, estil: 'rock', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'power', parts: 1 } },
        { id: 'g1c', grup: 'Power chords', titol: 'Afegeix la quinta', text: 'Amb el dit 3, dos trasts més amunt a la corda 5. Ara sonen dues notes: 1 i 5.', com: ['Els dos dits van junts: quan canvies d\'acord, es mouen com una peça.', 'Toca només les cordes 6 i 5.'], prog: 'G | D | Em | C', tempo: 70, estil: 'rock', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'power', parts: 2 } },
        { id: 'g1d', grup: 'Power chords', titol: 'Afegeix l\'octava: el power chord', text: 'Amb el dit 4, al mateix trast que el 3 però a la corda 4. És el power chord sencer: 1, 5 i 8.', com: ['Tres cordes: 6, 5 i 4. Les altres no han de sonar.', 'La forma no canvia: només es mou per tot el mànec.'], prog: 'G | D | Em | C', tempo: 70, estil: 'rock', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'power', parts: 3 } },
        { id: 'g1e', grup: 'Power chords', titol: 'Power chords a corxeres', text: 'El so del rock: dos cops per temps, tot avall.', com: ['Mà dreta curta i relaxada.', 'Si cansa, apaga una mica les cordes amb el palmell (palm mute).'], prog: 'G | D | Em | C', tempo: 80, estil: 'rock', part: { type: 'strum', rhythm: 'E' }, chordMode: { type: 'power', parts: 3 } },
        { id: 'g1o1', grup: 'Acords oberts · quan el profe t\'ho digui', titol: 'Acords oberts amb la corda 1', text: 'La forma dels acords oberts, però només toques la corda 1 (la més prima). Les altres cordes estan tapades.', com: ['Posa tota la forma de l\'acord, encara que només en toquis una corda.', 'Així els dits aprenen el camí i l\'orella sent la nota de dalt.'], prog: 'G | D | Em | C', tempo: 70, estil: 'balada', part: { type: 'strum', rhythm: 'W' }, chordMode: { type: 'obert', cordes: 1 } },
        { id: 'g1o2', grup: 'Acords oberts · quan el profe t\'ho digui', titol: 'Desbloqueja la corda 2', text: 'Ara les cordes 1 i 2.', com: ['Comprova amb 🔍 Corda a corda que les dues sonen netes.'], prog: 'G | D | Em | C', tempo: 70, estil: 'balada', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'obert', cordes: 2 } },
        { id: 'g1o3', grup: 'Acords oberts · quan el profe t\'ho digui', titol: 'Desbloqueja la corda 3', text: 'Tres cordes: ja sona com un acord.', com: ['Arqueja els dits perquè no toquin la corda del costat.'], prog: 'G | D | Em | C', tempo: 70, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'obert', cordes: 3 } },
        { id: 'g1o4', grup: 'Acords oberts · quan el profe t\'ho digui', titol: 'Desbloqueja la corda 4', text: 'Quatre cordes.', com: ['Mira les × : algun acord no fa servir totes les cordes.'], prog: 'G | D | Em | C', tempo: 70, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'obert', cordes: 4 } },
        { id: 'g1o5', grup: 'Acords oberts · quan el profe t\'ho digui', titol: 'Desbloqueja la corda 5', text: 'Cinc cordes.', com: ['Ja queda poc!'], prog: 'G | D | Em | C', tempo: 70, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'obert', cordes: 5 } },
        { id: 'g1o6', grup: 'Acords oberts · quan el profe t\'ho digui', titol: 'Totes les cordes', text: 'L\'acord sencer, amb les sis cordes (menys les que porten ×).', com: ['Quan et surti, la resta de nivells faran servir els acords oberts.'], prog: 'G | D | Em | C', tempo: 70, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'obert', cordes: 6 } },
      ],
    },
    {
      n: 2, titol: 'Patrons rítmics', sub: 'Tocar amb patrons rítmics diferents', icona: '⎍',
      passos: [
        { id: 'g2a', titol: 'Carta rítmica: negra, negra, silenci, negra', text: 'Cada rodona de la carta és un cop. On no hi ha rodona, la mà calla.', com: ['El silenci també es compta: la mà es mou però no toca.'], prog: 'G | C | G | D', tempo: 80, estil: 'pop', part: { type: 'strum', card: 'mb2' }, carta: 'mb2' },
        { id: 'g2b', titol: 'Carta rítmica amb una blanca', text: 'La blanca dura dos temps: un cop i deixes sonar.', com: ['No tornis a tocar a la blanca: compta-la per dins.'], prog: 'Am | F | C | G', tempo: 80, estil: 'balada', part: { type: 'strum', card: 'mb6' }, carta: 'mb6' },
        { id: 'g2c', titol: 'Corxeres: avall i amunt', text: 'Dues notes a cada temps: avall al temps i amunt a la «i».', com: ['La púa fa de pèndol: avall, amunt, avall, amunt.'], prog: 'Em | C | G | D', tempo: 75, estil: 'pop', part: { type: 'strum', card: 'mb13' }, carta: 'mb13' },
        { id: 'g2d', titol: 'Contratemps', text: 'Ara els cops cauen a la «i», entre temps i temps.', com: ['La mà baixa al temps sense tocar i toca quan puja.'], prog: 'Am | Am | G | G', tempo: 75, estil: 'reggae', part: { type: 'strum', card: 'mb12' }, carta: 'mb12' },
        { id: 'g2e', titol: 'En tres temps: un vals', text: 'Les cartes ternàries de 3/4: tres temps per compàs.', com: ['Compta u-dos-tres, u-dos-tres. El primer pesa més.'], prog: 'C | G | G | C', metre: '3/4', tempo: 90, estil: 'vals', part: { type: 'strum', card: 'mt1' }, carta: 'mt1' },
        { id: 'g2f', titol: 'En 6/8: dues pulsacions de tres', text: 'Cada cercle es parteix en tres: avall, amunt, avall.', com: ['Sents dues pulsacions per compàs, cadascuna en tres.'], prog: 'D | Bm | G | A', metre: '6/8', tempo: 60, estil: 'balada68', part: { type: 'strum', card: 'mt34' }, carta: 'mt34' },
        { id: 'g2g', kind: 'cards', deck: 'ritme', titol: 'Totes les cartes rítmiques', text: 'Tria qualsevol carta rítmica i practica-la amb la teva cançó.', prog: 'C | G | Am | F', tempo: 80, estil: 'pop' },
      ],
    },
    {
      n: 3, titol: 'Rascats mà dreta', sub: 'Tocar amb diferents rascats', icona: '✋',
      passos: [
        { id: 'g3a', titol: 'La mà que no s\'atura', text: 'Rascat: avall als temps. Entremig la mà puja sense tocar (fletxa grisa).', com: ['La mà va amunt i avall tota l\'estona, com un pèndol.', 'Les fletxes grises són moviments a l\'aire.'], prog: 'G | D | Em | C', tempo: 70, estil: 'pop', part: { type: 'rascat', card: 'rg6' }, carta: 'rg6' },
        { id: 'g3b', titol: 'Totes les corxeres', text: 'Ara la mà toca quan baixa i quan puja.', com: ['Amunt, toca només les cordes de dalt de l\'acord.'], prog: 'G | D | Em | C', tempo: 70, estil: 'pop', part: { type: 'rascat', card: 'rg1' }, carta: 'rg1' },
        { id: 'g3c', titol: 'El rascat del pop', text: 'Avall, (amunt), avall, amunt, (avall), amunt, avall, amunt.', com: ['Les fletxes grises: la mà passa però no toca.', 'Digues-ho en veu alta mentre toques: «a, i, a, i…».'], prog: 'C | G | Am | F', tempo: 75, estil: 'pop', part: { type: 'rascat', card: 'rg2' }, carta: 'rg2' },
        { id: 'g3d', titol: 'Un altre rascat', text: 'Canvia on cau el moviment a l\'aire.', com: ['Mira la carta i la púa alhora.'], prog: 'Am | F | C | G', tempo: 75, estil: 'pop', part: { type: 'rascat', card: 'rg9' }, carta: 'rg9' },
        { id: 'g3e', titol: 'Rascat amb molts aires', text: 'Menys cops que sonen: el ritme és als silencis.', com: ['La mà continua igual; només canvia quan toca.'], prog: 'G | D | Em | C', tempo: 75, estil: 'rock', part: { type: 'rascat', card: 'rg15' }, carta: 'rg15' },
        { id: 'g3f', titol: 'Rascat en semicorxeres', text: 'Setze moviments per compàs: la mà va el doble de ràpid.', com: ['Comença molt lent.', 'Pensa «u-i-a-i, dos-i-a-i…».'], prog: 'Am | Am | G | G', tempo: 60, estil: 'funk', part: { type: 'rascat', card: 'rg18' }, carta: 'rg18' },
        { id: 'g3g', kind: 'cards', deck: 'rascats', titol: 'Totes les cartes de rascats', text: 'Tria qualsevol carta de rascat i practica-la amb la teva cançó.', prog: 'C | G | Am | F', tempo: 75, estil: 'pop' },
      ],
    },
    {
      n: 4, titol: 'Cantar i tocar', sub: 'Coordinació de veu i guitarra', icona: '🎤',
      passos: [
        { id: 'g4a', titol: 'Compta en veu alta', text: 'Toca a negres i compta en veu alta: u, dos, tres, quatre.', com: ['La veu i la mà van juntes: cada número, un cop.'], prog: 'Em | Em | G | G', tempo: 75, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, voice: 'count' },
        { id: 'g4b', titol: 'Compta les corxeres', text: 'Rascat de corxeres comptant «u i dos i tres i quatre i».', com: ['Avall amb el número, amunt amb la «i».'], prog: 'G | C | G | D', tempo: 70, estil: 'pop', part: { type: 'rascat', card: 'rg1' }, voice: 'count8', carta: 'rg1' },
        { id: 'g4c', titol: 'Canta la fonamental', text: 'Toca un cop per compàs i canta la nota que dona nom a l\'acord. A la demostració la sents.', com: ['Tanca la boca i fes «uuu»: és més fàcil trobar la nota.', 'Si la veu va més greu o més aguda, cap problema: la mateixa nota a una altra altura també val.'], prog: 'C | G | Am | F', tempo: 70, estil: 'balada', part: { type: 'strum', rhythm: 'W' }, voice: 'root' },
        { id: 'g4d', titol: 'Canta una melodia', text: 'Una melodia senzilla amb «la». Primer només rodones a la guitarra.', com: ['Escolta-la unes quantes vegades abans de tocar.'], prog: 'C | G | Am | F', tempo: 75, estil: 'balada', part: { type: 'strum', rhythm: 'W' }, voice: MELODIA_LA, canco: false },
        { id: 'g4e', titol: 'Melodia amb negres', text: 'La mateixa melodia, ara amb negres a la guitarra.', com: ['Si es descontrola, torna a les rodones.'], prog: 'C | G | Am | F', tempo: 75, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, voice: MELODIA_LA, canco: false },
      ],
    },
    {
      n: 5, titol: 'Patrons melòdics', sub: 'Tocar amb patrons melòdics diferents', icona: '📈',
      passos: [
        { id: 'g5a', titol: 'Dues notes de l\'acord', text: 'Amb la forma de l\'acord posada, toques notes soltes seguint la carta: la més greu i la següent.', com: ['Mantén l\'acord posat: les notes ja hi són sota els dits.', 'Els números del mànec diuen quina nota de l\'acord és (1, 3, 5, 8).'], prog: 'C | Am | F | G', tempo: 70, estil: 'balada', part: { type: 'arp', card: 'pm10' }, carta: 'pm10' },
        { id: 'g5b', titol: 'Cap amunt', text: 'De la nota més greu a la més aguda.', com: ['Una nota per corda.'], prog: 'C | G | Am | F', tempo: 70, estil: 'balada', part: { type: 'arp', card: 'pm14' }, carta: 'pm14' },
        { id: 'g5c', titol: 'Cap avall', text: 'De la més aguda a la més greu.', com: ['La púa pot anar amunt a les notes que baixen.'], prog: 'Am | F | C | G', tempo: 70, estil: 'balada', part: { type: 'arp', card: 'pm17' }, carta: 'pm17' },
        { id: 'g5d', titol: 'Amunt i avall', text: 'Greu, aguda, mitjana, aguda.', com: ['És el patró de moltes balades.'], prog: 'G | Em | C | D', tempo: 75, estil: 'balada', part: { type: 'arp', card: 'pm20' }, carta: 'pm20' },
        { id: 'g5e', kind: 'cards', deck: 'melodic', titol: 'Totes les cartes melòdiques', text: 'Tria qualsevol carta de patró melòdic.', prog: 'C | G | Am | F', tempo: 70, estil: 'balada' },
      ],
    },
    {
      n: 6, titol: 'Acords amb celleta', sub: 'Tocar acords amb celleta', icona: '≋',
      passos: [
        { id: 'g6a', titol: 'Fa amb celleta (forma de Mi)', text: 'El dit 1 aguanta totes les cordes al trast 1. Damunt, la forma del Mi major.', com: ['Posa el dit 1 just darrere del trast, no a sobre.', 'Fes força amb el braç cap enrere, no només amb el polze.', 'Toca corda a corda (botó 🔍) per trobar la que no sona.'], prog: 'F | F | C | C', tempo: 65, estil: 'balada', part: { type: 'strum', rhythm: 'W' }, chordMode: 'celleta', canco: false },
        { id: 'g6b', titol: 'Si menor (forma de La menor)', text: 'Celleta al trast 2 i a sobre la forma del La menor.', com: ['Mira la carta de diagrama: és la mateixa forma.'], prog: 'D | Bm | G | A', tempo: 70, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, chordMode: { type: 'obert', cordes: 6 }, canco: false },
        { id: 'g6c', titol: 'La mateixa forma, a tot arreu', text: 'Amb la celleta, una sola forma serveix per a molts acords: només canvia el trast. Com els power chords!', com: ['Mou la mà sencera sense deixar anar la forma.'], prog: 'F#m | D | A | E', tempo: 70, estil: 'pop', part: { type: 'strum', rhythm: 'Q' }, chordMode: 'celleta' },
        { id: 'g6d', titol: 'La teva cançó, tota amb celletes', text: 'Tots els acords amb celleta, amb el rascat de corxeres.', com: ['Si cansa, afluixa la pressió entre cop i cop.'], prog: 'Am | F | C | G', tempo: 70, estil: 'pop', part: { type: 'rascat', card: 'rg2' }, chordMode: 'celleta', carta: 'rg2' },
      ],
    },
    {
      n: 7, titol: 'Afinar la guitarra', sub: "Mantenir l'afinació correcta", icona: '🎚',
      passos: [
        { id: 'g7a', kind: 'tune', mode: 'strings', titol: 'Les sis cordes', text: 'Escolta la nota de cada corda i gira la clavilla fins que soni igual.', com: ['Si la teva corda sona més greu, apreta (puja). Si sona més aguda, afluixa una mica i torna a pujar.', 'Afina sempre pujant cap a la nota.'] },
        { id: 'g7b', kind: 'tune', mode: 'relative', titol: 'Afinar d\'oïda amb el trast 5', text: 'La corda de sota, al trast 5, sona igual que la corda següent a l\'aire (menys la 3a corda, que va al trast 4).', com: ['Escolta les dues notes una darrere l\'altra fins que no hi hagi «batec».'] },
        { id: 'g7c', kind: 'tune', mode: 'check', titol: 'Comprova amb un acord', text: 'Toca el Mi major corda a corda i compara-ho amb el que sona aquí.', com: ['Si una sola nota grinyola, aquella corda està desafinada.'] },
      ],
    },
    {
      n: 8, titol: 'Recursos tècnics', sub: 'Hammer-on, glissando, bending', icona: '⚡',
      passos: [
        { id: 'g8a', titol: 'Hammer-on', text: 'Toques una nota i, sense tornar a tocar, «martelleges» un dit més amunt. Sonen dues notes amb un sol cop de púa.', com: ['Deixa caure el dit amb força, de punta.', 'A la pista surt com «0h2».'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 1, 5, 0, 'h', 2], [1, 1, 4, 0, 'h', 2], [2, 1, 3, 0, 'h', 2], [3, 1, 4, 2]] } },
        { id: 'g8b', titol: 'Pull-off', text: 'El contrari: amb dos dits posats, estires el de dalt cap avall i sona la nota de sota.', com: ['Estira el dit com si pessiguessis la corda.'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 1, 4, 2, 'p', 0], [1, 1, 5, 2, 'p', 0], [2, 1, 4, 2, 'p', 0], [3, 1, 6, 0]] } },
        { id: 'g8c', titol: 'Glissando', text: 'Toques una nota i, sense aixecar el dit, el llisques fins a un altre trast.', com: ['No deixis de fer pressió mentre llisques.', 'A la pista surt com «2/4».'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 2, 3, 2, 's', 4], [2, 1, 3, 4], [3, 1, 3, 2]] } },
        { id: 'g8d', titol: 'Bending', text: 'Toques una nota i empenys la corda cap amunt perquè pugi d\'afinació.', com: ['Empeny amb tres dits junts, no només amb un.', 'Puja fins que soni com dos trasts més amunt.'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 2, 2, 3, 'b'], [2, 1, 1, 0], [3, 1, 2, 0]] } },
        { id: 'g8e', titol: 'Tot junt', text: 'Un riff amb hammer-on, pull-off, glissando i bending.', com: ['Primer lent: cada recurs al seu lloc.'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 1, 5, 0, 'h', 2], [1, 1, 4, 2, 'p', 0], [2, 1, 3, 2, 's', 4], [3, 1, 2, 3, 'b']] } },
      ],
    },
    {
      n: 9, titol: 'Composició', sub: 'Compondre introduccions o solos', icona: '✒',
      passos: [
        { id: 'g9a', kind: 'compose', titol: 'Una introducció amb cartes', text: 'Tria una carta rítmica i una de melòdica per a cada compàs. El joc les converteix en notes de l\'acord i te les ensenya al mànec.', com: ['Comença amb «Sorprèn-me» i canvia el que no t\'agradi.', 'Les introduccions solen repetir una idea dues vegades.'], prog: 'C | G | Am | F', metre: '4/4', tempo: 80, estil: 'pop' },
        { id: 'g9b', kind: 'compose', titol: 'Un solo de quatre compassos', text: 'El mateix, amb ritmes més moguts i sobre una roda de rock.', com: ['Acaba el solo a la fonamental (1).'], prog: 'Am | F | C | G', metre: '4/4', tempo: 90, estil: 'rock' },
      ],
    },
    {
      n: 10, titol: 'Improvisació', sub: "Improvisar dins d'una roda d'acords", icona: '✎',
      passos: [
        { id: 'g10a', kind: 'improv', mode: 'chord', titol: 'Notes de l\'acord', text: 'El mànec t\'ensenya les notes de l\'acord que sona. Tria\'n qualsevol: sempre encaixa.', com: ['Quan canvia l\'acord, canvien les notes marcades.', 'Poques notes i ben col·locades valen més que moltes.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 80, estil: 'pop' },
        { id: 'g10b', kind: 'improv', mode: 'penta', titol: 'La pentatònica', text: 'Cinc notes que funcionen sobre tota la roda. Les marcades en fort són les de l\'acord que sona.', com: ['Comença i acaba les frases a la nota de casa (la més gran).'], prog: 'Am | F | C | G', metre: '4/4', tempo: 85, estil: 'rock' },
        { id: 'g10c', kind: 'improv', mode: 'qa', titol: 'Pregunta i resposta', text: 'La guitarra del joc fa una pregunta de dos compassos; tu hi respons els dos següents.', com: ['La resposta pot repetir el ritme de la pregunta amb altres notes.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 80, estil: 'pop' },
        { id: 'g10d', kind: 'improv', mode: 'free', titol: 'Lliure, amb reptes', text: 'La banda no s\'atura. Cada quatre compassos surt un repte nou.', com: ['Prou quan vulguis: botó Atura.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 90, estil: 'rock' },
      ],
    },
  ],

  baix: [
    {
      n: 1, titol: 'Línia de baix', sub: 'Tocant notes fonamentals', icona: '♫',
      passos: [
        { id: 'b1a', titol: 'La fonamental, una per compàs', text: 'El baix toca la nota que dona nom a l\'acord. Un cop per compàs i deixes que soni.', com: ['El número 1 del mànec és la fonamental.', 'Pulsa amb els dits índex i mig alternant.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 70, estil: 'balada', part: { type: 'bass', rhythm: 'W', roles: ['1'] } },
        { id: 'b1b', titol: 'Fonamentals a negres', text: 'Ara la fonamental a cada temps, amb la bateria.', com: ['Escolta el bombo: el baix i el bombo són un equip.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 80, estil: 'pop', part: { type: 'bass', rhythm: 'Q', roles: ['1'] } },
        { id: 'b1c', titol: 'Fonamentals a corxeres', text: 'Dues notes per temps: el so del rock.', com: ['Alterna els dits: índex, mig, índex, mig.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 80, estil: 'rock', part: { type: 'bass', rhythm: 'E', roles: ['1'] } },
        { id: 'b1d', titol: 'Corxeres amb canvis ràpids', text: 'Fonamentals a corxeres, amb més tempo.', com: ['Mira on cau la fonamental següent abans del canvi.'], prog: 'C | G | Am | F', metre: '4/4', tempo: 85, estil: 'rock', part: { type: 'bass', rhythm: 'E', roles: ['1'] } },
      ],
    },
    {
      n: 2, titol: 'Patrons rítmics', sub: 'Amb patrons rítmics diferents', icona: '⎍',
      passos: [
        { id: 'b2a', titol: 'Negra, negra, silenci, negra', text: 'Les cartes rítmiques ROCKIN, tocant la fonamental.', com: ['Al silenci, apaga la corda posant-hi un dit a sobre.'], prog: 'G | C | G | D', metre: '4/4', tempo: 80, estil: 'pop', part: { type: 'bass', card: 'mb2', roles: ['1'] }, carta: 'mb2' },
        { id: 'b2b', titol: 'Una corxera al final', text: 'Un cop de més just abans del compàs següent: empeny la cançó.', com: ['Aquella última nota porta cap a l\'acord nou.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 80, estil: 'pop', part: { type: 'bass', card: 'mb11', roles: ['1'] }, carta: 'mb11' },
        { id: 'b2c', titol: 'Corxeres i negres', text: 'Una combinació que no para.', com: ['Mira la carta i la pista alhora.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 80, estil: 'rock', part: { type: 'bass', card: 'mb17', roles: ['1'] }, carta: 'mb17' },
        { id: 'b2d', titol: 'Contratemps', text: 'Els cops cauen a la «i».', com: ['Compta els temps per dins.'], prog: 'Am | Am | G | G', metre: '4/4', tempo: 75, estil: 'reggae', part: { type: 'bass', card: 'mb12', roles: ['1'] }, carta: 'mb12' },
        { id: 'b2e', titol: 'En tres temps', text: 'Un vals: la fonamental al primer temps.', com: ['U-dos-tres, u-dos-tres.'], prog: 'C | G | G | C', metre: '3/4', tempo: 90, estil: 'vals', part: { type: 'bass', card: 'mt5', roles: ['1'] }, carta: 'mt5' },
        { id: 'b2f', kind: 'cards', deck: 'ritme', titol: 'Totes les cartes rítmiques', text: 'Tria qualsevol carta rítmica.', prog: 'C | G | Am | F', metre: '4/4', tempo: 80, estil: 'pop' },
      ],
    },
    {
      n: 3, titol: 'Afegir octaves', sub: 'A la línia de baix', icona: '≋',
      passos: [
        { id: 'b3a', titol: 'Fonamental i octava', text: 'L\'octava és la mateixa nota més aguda: dues cordes amunt i dos trasts endavant.', com: ['Dit 1 a la fonamental, dit 4 (o 3) a l\'octava.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 75, estil: 'pop', part: { type: 'bass', rhythm: 'Q', roles: ['1', '8'] } },
        { id: 'b3b', titol: 'Octaves a corxeres', text: 'Avall-amunt, avall-amunt: el baix de la música disco.', com: ['Deixa els dits posats i només mou la mà dreta.'], prog: 'Am | Am | Dm | Dm', metre: '4/4', tempo: 90, estil: 'funk', part: { type: 'bass', rhythm: 'E', roles: ['1', '8'] } },
        { id: 'b3c', titol: 'Fonamental, fonamental, octava', text: 'Un patró que deixa respirar.', com: ['La fonamental marca, l\'octava respon.'], prog: 'C | G | Am | F', metre: '4/4', tempo: 85, estil: 'rock', part: { type: 'bass', rhythm: 'E', roles: ['1', '1', '8', '1'] } },
        { id: 'b3d', titol: 'Octava amb carta rítmica', text: 'La carta diu quan; els números del mànec diuen quina nota.', com: ['Els papers 1 i 8 es van alternant.'], prog: 'G | D | Em | C', metre: '4/4', tempo: 80, estil: 'pop', part: { type: 'bass', card: 'mb16', roles: ['1', '8'] }, carta: 'mb16' },
      ],
    },
    {
      n: 4, titol: 'Cantar i tocar', sub: 'Coordinació de veu i instrument', icona: '🎤',
      passos: [
        { id: 'b4a', titol: 'Compta en veu alta', text: 'Fonamentals a negres i compta en veu alta.', com: ['Cada número, una nota.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 75, estil: 'pop', part: { type: 'bass', rhythm: 'Q', roles: ['1'] }, voice: 'count' },
        { id: 'b4b', titol: 'Canta la nota que toques', text: 'Toca la fonamental i canta-la alhora amb «uuu».', com: ['El baix sona molt greu: canta la mateixa nota a la teva altura.'], prog: 'C | G | Am | F', metre: '4/4', tempo: 70, estil: 'balada', part: { type: 'bass', rhythm: 'W', roles: ['1'] }, voice: 'root' },
        { id: 'b4c', titol: 'Canta una melodia', text: 'Una melodia senzilla amb «la» mentre toques rodones.', com: ['Escolta-la abans de tocar.'], prog: 'C | G | Am | F', metre: '4/4', tempo: 75, estil: 'balada', part: { type: 'bass', rhythm: 'W', roles: ['1'] }, voice: MELODIA_LA },
        { id: 'b4d', titol: 'Melodia amb negres', text: 'La melodia, ara amb el baix a negres.', com: ['Si es descontrola, torna a les rodones.'], prog: 'C | G | Am | F', metre: '4/4', tempo: 75, estil: 'pop', part: { type: 'bass', rhythm: 'Q', roles: ['1'] }, voice: MELODIA_LA },
      ],
    },
    {
      n: 5, titol: 'Terceres i quintes', sub: 'Afegir-les a la línia de baix', icona: '+',
      passos: [
        { id: 'b5a', titol: 'Fonamental i quinta', text: 'La quinta és a la corda de sobre, dos trasts endavant.', com: ['1 i 5: la base de mil cançons country i rock.'], prog: 'G | C | G | D', metre: '4/4', tempo: 80, estil: 'pop', part: { type: 'bass', rhythm: 'Q', roles: ['1', '5'] } },
        { id: 'b5b', titol: '1, 3, 5, 3', text: 'Afegim la tercera: és la que diu si l\'acord és major o menor.', com: ['Acord major: tercera un trast enrere a la corda de sobre. Menor: dos trasts enrere.'], prog: 'C | F | G | C', metre: '4/4', tempo: 75, estil: 'pop', part: { type: 'bass', rhythm: 'Q', roles: ['1', '3', '5', '3'] } },
        { id: 'b5c', titol: '1, 3, 5, 8', text: 'L\'arpegi complet, cap amunt.', com: ['Una nota per dit sempre que puguis.'], prog: 'C | Am | F | G', metre: '4/4', tempo: 75, estil: 'balada', part: { type: 'bass', rhythm: 'Q', roles: ['1', '3', '5', '8'] } },
        { id: 'b5d', titol: 'Majors i menors', text: 'La mateixa forma 1-3-5-3, alternant acords majors i menors.', com: ['Mira com es mou el número 3.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 80, estil: 'pop', part: { type: 'bass', rhythm: 'Q', roles: ['1', '3', '5', '3'] } },
      ],
    },
    {
      n: 6, titol: 'Patrons melòdics', sub: 'Incorporar a les línies de baix', icona: '📈',
      passos: [
        { id: 'b6a', titol: 'Fonamental i tercera', text: 'Les cartes de patró melòdic: 0 = fonamental, 1 = tercera, 2 = quinta, 3 = octava.', com: ['La carta dibuixa si la nota puja o baixa.'], prog: 'C | Am | F | G', metre: '4/4', tempo: 75, estil: 'pop', part: { type: 'arp', card: 'pm9' }, carta: 'pm9' },
        { id: 'b6b', titol: 'Cap amunt', text: '1, 3, 5, 8 dues vegades per compàs.', com: ['Prepara la mà abans que arribi l\'acord.'], prog: 'C | G | Am | F', metre: '4/4', tempo: 70, estil: 'balada', part: { type: 'arp', card: 'pm14' }, carta: 'pm14' },
        { id: 'b6c', titol: 'Cap avall', text: '8, 5, 3, 1.', com: ['Comença dalt i baixa a casa.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 70, estil: 'balada', part: { type: 'arp', card: 'pm17' }, carta: 'pm17' },
        { id: 'b6d', titol: 'Salts', text: 'Fonamental i quinta saltant.', com: ['El salt fa ballar la línia.'], prog: 'G | Em | C | D', metre: '4/4', tempo: 80, estil: 'pop', part: { type: 'arp', card: 'pm12' }, carta: 'pm12' },
        { id: 'b6e', kind: 'cards', deck: 'melodic', titol: 'Totes les cartes melòdiques', text: 'Tria qualsevol carta de patró melòdic.', prog: 'C | G | Am | F', metre: '4/4', tempo: 70, estil: 'balada' },
      ],
    },
    {
      n: 7, titol: 'Afinar el baix', sub: "Mantenir l'afinació correcta", icona: '🎚',
      passos: [
        { id: 'b7a', kind: 'tune', mode: 'strings', titol: 'Les quatre cordes', text: 'Escolta la nota de cada corda i gira la clavilla fins que soni igual.', com: ['Afina sempre pujant cap a la nota.'] },
        { id: 'b7b', kind: 'tune', mode: 'relative', titol: 'Afinar d\'oïda amb el trast 5', text: 'La corda de sota, al trast 5, sona igual que la corda següent a l\'aire.', com: ['Escolta-les una darrere l\'altra.'] },
      ],
    },
    {
      n: 8, titol: 'Recursos tècnics', sub: 'Hammer-on, glissando, bending', icona: '⚡',
      passos: [
        { id: 'b8a', titol: 'Hammer-on', text: 'Una nota pulsada i una altra «martellejada» amb un dit de la mà esquerra.', com: ['Deixa caure el dit amb força.'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 1, 4, 0, 'h', 3], [1, 1, 3, 0, 'h', 2], [2, 1, 2, 0, 'h', 2], [3, 1, 3, 2]] } },
        { id: 'b8b', titol: 'Glissando', text: 'Llisques el dit d\'un trast a un altre sense deixar de fer pressió.', com: ['Arribar lliscant a la fonamental és un clàssic del baix.'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 2, 3, 5, 's', 7], [2, 1, 3, 7], [3, 1, 4, 7]] } },
        { id: 'b8c', titol: 'Bending', text: 'Empenys la corda perquè pugi d\'afinació. Al baix costa més: fes-ho a les cordes primes.', com: ['Puja a poc a poc fins que soni dos trasts amunt.'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 2, 2, 2, 'b'], [2, 1, 2, 2], [3, 1, 3, 2]] } },
        { id: 'b8d', titol: 'Tot junt', text: 'Un riff amb hammer-on, pull-off, glissando i bending.', com: ['Primer lent.'], prog: 'Em | Em | Em | Em', metre: '4/4', tempo: 70, estil: 'rock', part: { type: 'riff', notes: [[0, 1, 4, 0, 'h', 3], [1, 1, 3, 2, 'p', 0], [2, 1, 3, 5, 's', 7], [3, 1, 2, 2, 'b']] } },
      ],
    },
    {
      n: 9, titol: 'Composició', sub: 'Compondre introduccions o solos', icona: '✒',
      passos: [
        { id: 'b9a', kind: 'compose', titol: 'Una línia de baix amb cartes', text: 'Tria una carta rítmica i una de melòdica per a cada compàs i el joc les converteix en notes de l\'acord.', com: ['Comença amb «Sorprèn-me».'], prog: 'C | G | Am | F', metre: '4/4', tempo: 80, estil: 'pop' },
        { id: 'b9b', kind: 'compose', titol: 'Una introducció de baix', text: 'Quatre compassos de baix sol que obren la cançó.', com: ['Una idea repetida dues vegades funciona.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 85, estil: 'rock' },
      ],
    },
    {
      n: 10, titol: 'Improvisació', sub: "Improvisar dins d'una roda d'acords", icona: '✎',
      passos: [
        { id: 'b10a', kind: 'improv', mode: 'chord', titol: 'Notes de l\'acord', text: 'El mànec t\'ensenya les notes de l\'acord que sona. Tria-les tu.', com: ['Comença cada compàs amb la fonamental.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 80, estil: 'pop' },
        { id: 'b10b', kind: 'improv', mode: 'penta', titol: 'La pentatònica', text: 'Cinc notes per passar d\'un acord a l\'altre.', com: ['Fes servir les notes de pas per arribar a la fonamental següent.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 85, estil: 'rock' },
        { id: 'b10c', kind: 'improv', mode: 'qa', titol: 'Pregunta i resposta', text: 'El baix del joc pregunta dos compassos; tu respons.', com: ['Repeteix el ritme amb altres notes.'], prog: 'Am | F | C | G', metre: '4/4', tempo: 80, estil: 'pop' },
        { id: 'b10d', kind: 'improv', mode: 'free', titol: 'Lliure, amb reptes', text: 'La banda no s\'atura. Cada quatre compassos surt un repte nou.', com: ['Prou quan vulguis: botó Atura.'], prog: 'Em | C | G | D', metre: '4/4', tempo: 90, estil: 'rock' },
      ],
    },
  ],
};

export const allSteps = (inst) => LEVELS[inst].flatMap((l) => l.passos.map((p) => ({ ...p, nivell: l.n })));
export const stepById = (inst, id) => allSteps(inst).find((s) => s.id === id) ?? null;

/** Reptes de la improvisació lliure. */
export const REPTES = [
  'Només tres notes',
  'Frases curtes amb silencis',
  'Acaba cada frase a la fonamental',
  'Toca només als contratemps',
  'Repeteix una idea i canvia-li el final',
  'Notes llargues: deixa-les sonar',
  'Fes servir només dues cordes',
  'Imita el ritme de la bateria',
];
