# Kujdestaria

## Dëftesat dhe historiku

Dëftesat gjenerohen si PDF A4 me font shqip të integruar dhe logon e shkollës. ZIP-i përmban të gjithë nxënësit vijues vetëm kur secili ka nota përfundimtare dhe të dhënat e kërkuara. NP e llogaritur vetëm nga një gjysmëvjetor nuk mjafton; një mbishkrim i qartë i NP pranohet. Datëlindja, prindi, komuna, vendlindja, shteti, shtetësia, sjellja dhe numri në amzë kontrollohen. Data, vendi i lëshimit dhe drejtori plotësohen para shkarkimit. Nënshkrimet dhe vula mbeten për plotësim nga institucioni. PDF-të janë fotografi e të dhënave të çastit, nuk janë dokumente me nënshkrim digjital dhe nuk ruhen automatikisht në server.

Emrat janë `emri_mbiemri.pdf`; emrat e dyfishtë marrin prapashtesë me ID. ZIP-i quhet `Deftesa klasa 10-1 2025-2026.zip`, sipas klasës/vitit në databazë. Shenjat e palejuara në emrat e skedarëve zëvendësohen me `-`.

Historiku niset nga klasa aktive e kujdestarit. Lidhja me klasat 10/11 bëhet përmes regjistrimeve të nxënësve në `student_academic_enrollments`, në vite dhe nivele më të hershme. Raporti historik përfshin vetëm nxënësit e klasës aktuale, edhe kur paralelja e vjetër përmbante nxënës të tjerë. Historiku nuk jep leje për ndryshim. Pa regjistrime historike, lista mbetet bosh.

Moduli mbulon funksionet e 16 fletëve të modelit “Statistika 2 Gjysmevjetore Ok Islam Sejdiu.xlsx”, përfshirë dokumentin shpjegues të integruar. Modeli u lexua si referencë funksionale. Të dhënat e shkollës dhe viti 2021/2022 të modelit nuk importohen në databazën e shkollës.

## Burimet dhe ruajtja

- Regjistri përdor nxënësit e regjistruar në klasë për vitin përkatës. Lidhja historike e regjistrimit ka përparësi ndaj klasës aktuale. Të dhënat personale bazë ruhen te nxënësi; të dhënat shtesë dhe statuset e raportimit ruhen te `homeroom_profiles`.
- Ditari, gjysmëvjetorët dhe NP përdorin tabelën ekzistuese `grades`. Notat dymujore nuk bëhen automatikisht nota gjysmëvjetore. Profesori i lëndës vendos T1/T2 te Klasat e mia; kujdestaria i shfaq vetëm për lexim. NP ndjek llogaritjen ekzistuese dhe ruan mbishkrimet.
- Statistikat, raporti, raporti administrativ dhe pasqyrat I/II/III dalin nga një llogaritje në `HomeroomReport`.
- Mungesat mujore përdorin orët e mbajtura. Regjistrimi ditor i vjetër përdoret vetëm në ditë pa evidencë individuale nga orët, për të shmangur numërimin e dyfishtë. Mungesat e orëve të pashqyrtuara mbeten të ndara. Konfirmimi mujor ruan totalin absolut, jo shtesë ndaj automatikut, dhe mund të kthehet në automatik.
- Orët e mbajtura merren nga `lesson_sessions`, me mundësi vendosjeje të totalit historik. Planifikimi = mbajtura + pambajtura, sipas modelit. Fundviti mbledh dy gjysmëvjetorët.
- Ndryshimet e evidencës regjistrohen në `homeroom_changes`. Profesori sheh vetëm kujdestarinë e vitit aktiv, përmes `classes.homeroom_staff_id → staff.user_id`. Administrata mund të lexojë arkivin. Vendosja e notave kontrollon caktimin e profesorit për lëndën dhe klasën; ruajtja e përbashkët verifikon gjithë listën përpara ndryshimit.

## Llogaritjet

Suksesi i plotë kërkon nota për të gjitha lëndët e klasës. Një notë 1 sjell sukses 1 dhe mesatare suksesi 1, si te modeli. Për nota të plota pozitive përdoret mesatarja aritmetike; klasifikimi rrumbullakohet në numrin e plotë më të afërt (0.5 lart). Mesatarja e lëndës përfshin vetëm notat e vendosura, përfshirë notën 1. Mesatarja e klasës është mesatarja e mesatareve të suksesit të nxënësve të vlerësuar plotësisht.

Të çregjistruarit përjashtohen sipas statusit të secilit gjysmëvjetor. Përsëritësi është shënim më vete, nuk shtohet dy herë në total dhe nuk caktohet automatikisht nga numri i notave negative. Gjinia e paplotësuar shfaqet veçmas dhe ruhet në total. Përqindjet e suksesit përdorin vijuesit si emërues; me emërues zero rezultati mbetet i papërcaktuar.

Modeli burimor kishte referenca të zhvendosura, varësi nga notimi i nxënësit të parë dhe formulën `Mungesat!Z4=SUM(N4+P4+X4)` që linte jashtë marsin, prillin e majin. Moduli përdor listën reale të nxënësve/lëndëve dhe të gjithë muajt. Nuk zbatohen kufijtë e modelit prej 40 nxënësish/18 lëndësh.

## Raportet

Printimi përdor raport HTML në A4 horizontal dhe dialogun e shfletuesit për printim ose ruajtje PDF. Pamja paraprake dhe printimi përdorin të njëjtin stil, logon e medreses, tituj të gjelbër, rreshta alternativë dhe hapësirë nënshkrimi. Ditari përdor kolona të ngushta me emra vertikalë të lëndëve. Eksporti Excel përmban 16 fletë me vlerat e çastit dhe shpjegime, logo të integruar në çdo fletë, tituj të fiksuar, formatim numerik dhe faqe A4/A3 horizontale sipas gjerësisë; llogaritjet bëhen në aplikacion. Pas ndryshimeve duhet eksport i ri. Eksporti nuk mbart formula ose lidhje nga skedari burimor dhe nuk është importues i atij skedari.

Datat e gjysmëvjetorëve konfigurohen në muaj të plotë, fillimisht shtator–dhjetor dhe janar–qershor nga etiketa e vitit shkollor. Shkolla, data dhe periudhat e raportit ruhen për klasë. Për të ndryshuar vetë kujdestarin, klasën, lëndët ose vitin përdoren funksionet ekzistuese administrative.

## Verifikimi

`HomeroomTest` kontrollon qasjen, arkivin, notat bosh, gjininë e paplotësuar, statuset sipas periudhave, rrumbullakimin, notat negative, ruajtjen e NP së mbishkruar, mungesat në fund të muajit, muajt mars–maj, dublikimet e prezencës dhe totalet e orëve.
