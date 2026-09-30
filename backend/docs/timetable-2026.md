# Orari 2026/27

Burimi: fotografia `codex-clipboard-98096ddd-d48b-466e-a634-2acab4f7483f.png` e dhënë nga përdoruesi. Transkriptimi ruhet te `database/data/timetable-2026-reference.json`.

- 31 profesorë, 13 klasa, 429 orë: 397 orë lëndësh dhe 32 aktivitete pa notë.
- 184 lidhje klasë–lëndë–profesor. Numri javor llogaritet nga orët e lëndës në orar.
- Kuran, gjuhë arabe dhe gjuhë amtare: nga 3 orë për secilën klasë, sipas sqarimit të përdoruesit.
- Fotografia ka 7 orë nga e hëna deri të enjten dhe 6 të premten. Nuk janë shpikur orare fillimi/mbarimi.
- Për profesorët me disa lëndë, përdoruesi autorizoi shprehimisht ndarje demonstrimi për korrigjim më vonë. Këto orë shënohen `is_provisional`. Ndarja e Psikologjisë/Sociologjisë sipas nivelit dhe orët e kujdestarisë/përsëritjes janë gjithashtu propozime.
- Kujdestaria dhe përsëritja ruhen me `activity_label`, pa `subject_id`. Nuk krijojnë lëndë për nota apo të drejta për vendosje notash.
- Qelizat e lexuara për Driton Arifin janë 22, për Hatixhe Jashanicën 20, megjithëse kolona e totalit shënon 20+1 për secilin. U ruajtën qelizat, pa zhvendosur orë për t'iu përshtatur totalit të shtypur.

## Importi

Migrimi `2026_09_30_000001_support_timetable_activities.php` lejon aktivitetet pa lëndë. `ReferenceTimetable2026Seeder` ekzekutohet vetëm shprehimisht, jo nga seed-i i përgjithshëm. Krijon backup privat për tabelat e prekura, zëvendëson orarin vetëm të vitit aktiv 2026-2027 dhe krijon lidhjet përkatëse. Ndryshimet bëhen në një transaksion. Konfliktet e profesorëve të caktuar në lëndë e anulojnë importin.

`ReferenceTimetableImporter` si parazgjedhje ruan orët ekzistuese dhe refuzon përplasjet. Modaliteti `replaceSlots` përdoret vetëm nga importi i shprehur i fotografisë.

## Verifikimi

`ReferenceTimetableTest` kontrollon importin pa duplikime, frekuencat javore, lidhjen e çdo ore me profesorin e lëndës, shfaqjen në hapësirën e profesorit dhe anulimin e importit kur një lëndë ka profesor tjetër.
