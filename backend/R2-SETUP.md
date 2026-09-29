# Cloudflare R2

## Aktivizimi

1. Krijo llogari te https://dash.cloudflare.com/sign-up dhe aktivizo R2 te Storage & databases → R2 → Overview. Plotëso personalisht hapat e pagesës dhe kushtet.
2. Krijo bucket `medrese-materiale`, me storage class **Standard**. Mbaje privat: mos aktivizo Public Development URL ose domain publik.
3. Te R2 → Account Details → API Tokens → Manage, krijo token me **Object Read & Write**, vetëm për këtë bucket.
4. Kopjo `.env.r2.example` në `.env.r2`. Plotëso Access Key ID, Secret Access Key, emrin e bucket-it dhe S3 API endpoint nga paneli. Mos dërgo çelësat në bisedë. `.env.r2` përjashtohet nga Git; skedari ekzistues `.env` është i gjurmuar dhe nuk duhet përdorur për këta çelësa.
5. Nga backend ekzekuto `php artisan config:clear`, pastaj `php artisan medrese:check-r2 --write`. Kontrolli ngarkon, lexon dhe fshin vetëm një skedar prove unik.

Në serverin e publikimit duhet vendosur veçmas `.env.r2` ose variablat R2 të mjedisit. Kufizo leximin e skedarit te përdoruesi i serverit.

## Gjendja e integrimit

Disku Laravel `r2` është përgatitur. Konfigurimi nuk zhvendos dokumente ekzistuese dhe nuk e ndryshon diskun e parazgjedhur. Ngarkimet nga portali dhe shkarkimet pas kontrollit të lejeve duhet të lidhen me këtë disk pasi të verifikohet llogaria. Bucket privat vetë nuk zëvendëson kontrollin e lejeve të nxënësve në aplikacion.

10 GB-month falas vlejnë për Standard; tejkalimet dhe operacionet mbi kuotat tarifohen. Kuota falas nuk është kufi automatik shpenzimi.

Burime: https://developers.cloudflare.com/r2/get-started/ • https://developers.cloudflare.com/r2/api/tokens/ • https://developers.cloudflare.com/r2/pricing/
