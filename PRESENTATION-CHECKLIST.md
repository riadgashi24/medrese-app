# Kontrolli para prezantimit

Aplikacioni shërben si ndihmë për punën me ditarin fizik. Rregullat e vlerësimit dhe raportet zyrtare duhen konfirmuar me drejtorinë.

## Verifikuar

- Backend: 15 teste, 56 kontrolle kalojnë, përfshirë ruajtjen e notave, kufizimin sipas mësimdhënësit dhe ndarjen e viteve shkollore.
- Frontend: ndërtimi për prodhim kalon.
- Në shfletues: klasa 11/1 dhe pasqyra e notave shfaqen në temën e çelët dhe të errët.
- Panelet ngarkohen veçmas sipas rolit; ruajtja e një note nuk kërkon ringarkimin e gjithë tabelës.

## Para demonstrimit

- Provoni hyrjen me secilën llogari që do të prezantohet dhe kontrolloni klasën/lëndët e saj.
- Provoni ruajtjen e një note në një nxënës të posaçëm testues dhe rikthimin e saj pas ringarkimit.
- Shkarkoni dhe hapni Excel/PDF në shfletuesin e prezantimit. Testimi automatik nuk konfirmoi ngjarjen e shkarkimit; pamja e skedarëve të eksportuar ende nuk është verifikuar.
- Provoni faqet e përzgjedhura në telefon dhe në ekranin/projektorin e prezantimit.
- Konfirmoni vitin shkollor të demonstrimit: të dhënat e inspektuara tregojnë 2025–2026.

## Të dhënat që kërkojnë rishikim

Kontrolli vetëm për lexim `php artisan medrese:check-demo`, nga dosja backend, gjeti 198 nxënës aktivë, asnjë pa klasë, por 195 pa gjini. Vlerat që mungojnë shfaqen si të panjohura. Nuk janë plotësuar me hamendje.

Tre profile kanë tipin Boarding, ndërsa nuk ka përdorues me rolin boarding. Qasja dhe paraqitja e konviktit duhen harmonizuar para demonstrimit të atij roli.

Nuk është zbrazur apo rimbushur baza ekzistuese. Mos ekzekutoni `migrate:fresh` ose të gjithë seeders mbi të dhënat që dëshironi t'i ruani. Disa seeders të tjerë ende përditësojnë llogaritë ekzistuese.

Nuk është kryer test ngarkese me shumë përdorues apo audit i plotë i çdo moduli. Rezultatet e testeve mbulojnë rrjedhat e testuara, jo garanci se i gjithë aplikacioni është pa gabime.
