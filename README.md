# Dokumentimi i Projektit — Medreseja Alauddin School Management System

> **Sistem i integruar për menaxhimin e shkollave të mesme fetare (medrese)**
> Backend: Laravel 11 · Frontend: React 19 · Database: MySQL

---

## 1. Përshkrimi i Projektit

| Fusha | Vlera |
|-------|-------|
| **Emri i projektit** | Medreseja Alauddin — School Management System |
| **Qëllimi** | Sistem i integruar për menaxhimin e shkollave të mesme fetare (medrese), duke përfshirë regjistrimin e nxënësve, menaxhimin akademik, financat, konviktin, disiplinën dhe njoftimet. |
| **Problemi që zgjidh** | Medresetë kanë nevojë për një sistem të unifikuar që zëvendëson proceset manuale me regjistrime dixhitale, duke mundësuar gjurmueshmëri, raportim dhe menaxhim të centralizuar për drejtorinë, sekretarinë, mësuesit, edukatorët dhe nxënësit. |
| **Lloji i sistemit** | Web Application (SPA) me REST API backend |

---

## 2. Teknologjitë

### Backend

| Teknologjia | Versioni | Përdorimi |
|-------------|----------|-----------|
| PHP | ^8.2 | Gjuha e programimit |
| Laravel Framework | ^11.0 | KORNIZA E BACKEND-it |
| Laravel Sanctum | ^4.0 | Autentifikimi API (token-based) |
| Laravel Tinker | ^2.9 | REPL për debug |

### Frontend

| Teknologjia | Përdorimi |
|-------------|-----------|
| React 19 | KORNIZA E FRONTEND-it |
| React Router DOM 7 | Routing client-side |
| TanStack React Query 5 | Gjendja e serverit dhe caching |
| Vite 6 | Build tool dhe dev server |
| Tailwind CSS 4 | Stilizimi utility-first |

### Database

| Teknologjia | Përdorimi |
|-------------|-----------|
| MySQL | Database relacional (prod) |
| SQLite | Database për development/test |

### Authentication

| Teknologjia | Përdorimi |
|-------------|-----------|
| Laravel Sanctum | Token-based API authentication |
| RoleMiddleware | Custom middleware për kontrollin e roleve |

### Packages kryesore — Frontend

| Package | Përdorimi |
|---------|-----------|
| `recharts` | Grafikët dhe vizualizimi (bar, line, pie charts) |
| `lucide-react` | Ikonat |
| `class-variance-authority` | Variantet e komponentëve |
| `clsx` + `tailwind-merge` | Menaxhimi i klasave CSS |
| `html2canvas`, `jspdf`, `xlsx` | Eksportimi i raporteve (PDF, Excel) |
| `react-hook-form`, `zod` | Validimi i formave |
| `@radix-ui/react-*` | Komponentë aksesueshmërie |

---

## 3. Arkitektura

### Frontend Folder Structure

```
frontend/src/
├── assets/               # Imazhe statike (logo)
├── components/
│   ├── charts/           # Recharts komponentë
│   ├── layout/           # AppShell, Sidebar, TopBar
│   └── ui/               # Button, Card, Input, Badge, DataTable, etj.
├── context/
│   └── AuthContext.jsx   # Autentifikimi, tema, gjendja e përdoruesit
├── data/
│   ├── mockData.js       # Demo data dhe ROLE konstante
│   └── navigation.js     # Navigimi sipas roleve (NAV_BY_ROLE)
├── i18n/
│   └── index.js          # Internacionalizimi (sq)
├── lib/
│   ├── api.js            # HTTP client për API Laravel
│   └── utils.js          # Funksione ndihmëse
├── locales/
│   └── sq.json           # Fjalët në gjuhën shqipe
├── pages/
│   ├── auth/             # LoginPage
│   ├── dashboard/        # Dashboard-et sipas roleve
│   ├── finance/          # Pagesat, faturat, borxhet, raportet
│   ├── modules/          # ModulePages + AcademicModules
│   │   └── AcademicModules/
│   │       ├── Attendance/
│   │       ├── Subject/
│   │       ├── classes/
│   │       ├── AcademicYearsPage.jsx
│   │       ├── GradesPage.jsx
│   │       └── Timetable.jsx
│   ├── students/         # Lista, detajet, forma, importi
│   └── users/            # Menaxhimi i përdoruesve
├── routes/
│   └── ProtectedRoute.jsx
├── App.jsx
├── main.jsx
└── index.css
```

### Backend Folder Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/         # 17 controller-a
│   │   └── Middleware/
│   │       └── RoleMiddleware.php
│   ├── Models/                  # 30+ modele Eloquent
│   ├── Providers/
│   └── Services/
│       ├── FeeService.php
│       └── StudentService.php
├── config/
│   └── medrese.php
├── database/
│   ├── migrations/              # ~30 migrime
│   └── seeders/
├── routes/
│   └── api.php                  # Të gjitha rrugët API (v1)
├── tests/
│   ├── Feature/
│   └── TestCase.php
└── composer.json
```

### Authentication Flow

1. Përdoruesi dërgon `POST /api/v1/auth/login` me email dhe password
2. Backend-i verifikon kredencialet dhe kthen një token Sanctum
3. Token-i ruhet në `localStorage` me çelës `medrese-token`
4. Çdo kërkesë pasuese përfshin `Authorization: Bearer {token}` në headers
5. `AuthContext.jsx` menaxhon gjendjen globale të autentifikimit
6. `ProtectedRoute.jsx` ridrejton përdoruesit e paautentikuar në `/login`

---

## 4. Modulet

| Moduli | Qëllimi | Statusi |
|--------|---------|---------|
| **Autentifikimi** | Login, logout, profile recovery |  Implementuar |
| **Dashboard-i i Drejtorit** | Përmbledhje me statistika, grafikë dhe aktivitet të fundit |  Implementuar |
| **Dashboard-i i Sekretarit** | Statistika të nxënësve, regjistrime, njoftime | Implementuar |
| **Dashboard-i i Arkatarit** | Përmbledhje financiare, pagesa të fundit |  Implementuar |
| **Dashboard-i i Mësuesit** | Orari i sotëm, orari javor, veprime të shpejta |  Implementuar |
| **Dashboard-i i Edukatorit** | Përmbledhje e konviktit, kontrolle të fundit | Implementuar |
| **Dashboard-i i Nxënësit** | Notat, prezenca, bilanci, dhoma (nëse konviktor) |  Implementuar |
| **Regjistrimi i Nxënësve** | Shto, edito, fshi, shiko detajet e nxënësve |  Implementuar |
| **Import masiv CSV** | Importo nxënës përmes skedarëve CSV | Implementuar |
| **Klasat** | Menaxhimi i klasave, kujdestarëve, nxënësve |  Implementuar |
| **Lëndët** | CRUD i lëndëve, kategorizimi sipas niveleve 10/11/12 |  Implementuar |
| **Orari Mësimor** | Orari javor me slot-et kohore dhe kujdestarët e ditës |  Implementuar |
| **Vitet Shkollore** | Menaxhimi i viteve akademike, aktivizimi, promovimi i klasave |  Implementuar |
| **Prezenca** | Regjistrimi i prezencës ditore, Fajr, study hours, raporte |  Implementuar |
| **Miratimi i Mungesave** | Shqyrtimi dhe miratimi i mungesave nga kujdestarët |  Implementuar |
| **Notat** | Vendosja dhe shikimi i notave sipas klasës |  Pjesërisht |
| **Financat** | Pasqyra financiare, pagesat, faturat, borxhet, tarifat |  Implementuar |
| **Konvikti** | Përmbledhje e dhomave, kapaciteti, zënia |  Implementuar |
| **Dhomat** | Menaxhimi i dhomave dhe caktimet |  Implementuar |
| **Kontrollet e Dhomave** | Inspektimi i dhomave me checklist, rezultate, pastërti |  Implementuar |
| **Rënditja e Dhomave** | Leaderboard i dhomave sipas rezultateve javore/mujore/vjetore |  Implementuar |
| **Disiplina** | Regjistrimi i vërejtjeve, kategoritë, historiku |  Implementuar |
| **Disiplina e Nxënësit** | Shikimi i të dhënave disiplinore të vetes |  Implementuar |
| **Aktivitetet** | Listimi i aktiviteteve jashtëshkollore dhe hifz |  Implementuar |
| **Njoftimet** | Shikimi i njoftimeve të shkollës |  Implementuar |
| **Stafi** | Listimi dhe filtrimi i stafit sipas roleve |  Implementuar |
| **Dokumentet** | Shikimi i dokumenteve të mia (për nxënës) |  Implementuar |
| **Cilësimet** | Ndryshimi i temës (light/dark) |  Implementuar |
| **Profili** | Shikimi i të dhënave të llogarisë |  Implementuar |
| **Përdoruesit** | Menaxhimi i përdoruesve (nxënës dhe staf) |  Implementuar |

---

## 5. Rolet e Përdoruesve

### 🟣 Drejtor (director)

| Mundësitë | Modulet që përdor |
|-----------|-------------------|
| Paneli i përgjithshëm me statistika | Dashboard, Akademike, Stafi, Financat, Konvikti, Disiplina, Aktivitetet, Raportet, Njoftimet, Cilësimet |
| Menaxhim i viteve shkollore dhe promovimi | Vitet Shkollore, Klasat |
| Akses i plotë në të gjitha modulet | Të gjitha |
| Menaxhim i stafit dhe nxënësve | Stafi, Nxënësit |

### 🔵 Sekretar (secretary)

| Mundësitë | Modulet që përdor |
|-----------|-------------------|
| Regjistrimi i nxënësve të rinj | Regjistrimi (formular + import) |
| Menaxhimi i dosjeve të nxënësve | Dosjet e Nxënësve, Caktimet në Klasa |
| Shikimi i dokumenteve | Dokumentet |
| Shikimi i raporteve financiare (vetëm lexim) | Raportet Financiare |
| Menaxhimi i njoftimeve | Njoftimet |

### 🟢 Arkatar (cashier)

| Mundësitë | Modulet që përdor |
|-----------|-------------------|
| Regjistrimi i pagesave | Pagesat |
| Shikimi i historikut të pagesave | Historiku i Pagesave |
| Menaxhimi i faturave | Faturat |
| Shikimi i borxheve | Borxhet |
| Menaxhimi i tarifave | Tarifat |

### 🟡 Mësues (teacher)

| Mundësitë | Modulet që përdor |
|-----------|-------------------|
| Paneli me orarin e sotëm dhe javor | Dashboard, Klasat e Mia |
| Regjistrimi i prezencës | Prezenca (përmes klasave) |
| Vendosja e notave | Notat (përmes klasave) |
| Shikimi i nxënësve | Nxënësit |
| Mbikëqyrja e disiplinës | Disiplina |

### 🟠 Edukator (educator)

| Mundësitë | Modulet që përdor |
|-----------|-------------------|
| Paneli i konviktit | Dashboard, Nxënësit Konviktorë |
| Menaxhimi i dhomave | Dhomat |
| Kryerja e kontrolleve të dhomave | Kontrollet |
| Regjistrimi i vërejtjeve | Disiplina |
| Regjistrimi i prezencës (Fajr, study hours) | Prezenca |

### 🔴 Nxënës (student) / Konviktor (boarding)

| Mundësitë | Modulet që përdor |
|-----------|-------------------|
| Paneli personal me notat dhe prezencën | Dashboard |
| Shikimi i orarit | Orari |
| Shikimi i faturave dhe pagesave | Gjendja e Pagesave |
| Shikimi i njoftimeve | Njoftimet |
| Shikimi i dokumenteve | Dokumentet |
| Shikimi i të dhënave disiplinore | Disiplina |
| (Vetëm konviktorët) Menaxhimi i dhomës | Dhoma ime, Raportet e Pastërtisë |

---

## 6. Database

### Tabelat kryesore

| Tabela | Qëllimi | Relationship kryesore |
|--------|---------|----------------------|
| `users` | Përdoruesit e sistemit (staff + student accounts) | — |
| `academic_years` | Vitet shkollore | hasMany: classes, fee_structures |
| `classes` | Klasat | belongsTo: academic_year, staff; hasMany: students |
| `subjects` | Lëndët mësimore | belongsToMany: classes (pivot: class_subject) |
| `class_subject` | Lidhja klasë-lëndë | Pivot: classes ↔ subjects |
| `students` | Të dhënat e nxënësve | belongsTo: class |
| `timetable_slots` | Orari mësimor | belongsTo: class, subject, staff |
| `grades` | Notat e nxënësve | belongsTo: student, subject, class |
| `attendance_records` | Prezenca ditore | belongsTo: student, class |
| `study_hours` | Orët e studimit në konvikt | belongsTo: student |
| `fee_types` | Llojet e tarifave | hasMany: fee_structures |
| `fee_structures` | Struktura e tarifave | belongsTo: fee_type, academic_year |
| `payments` | Pagesat e kryera | belongsTo: student, fee_type |
| `invoices` | Faturat | belongsTo: student |
| `dorm_rooms` | Dhomat e konviktit | hasMany: dorm_assignments, dorm_inspections |
| `dorm_assignments` | Caktimi i nxënësve në dhoma | belongsTo: dorm_room, student |
| `dorm_inspections` | Kontrollet e dhomave | belongsTo: dorm_room; hasMany: dorm_inspection_items |
| `discipline_categories` | Kategoritë disiplinore | hasMany: discipline_records |
| `discipline_records` | Vërejtjet disiplinore | belongsTo: student, category |
| `announcements` | Njoftimet | belongsTo: user (author) |
| `documents` | Dokumentet | belongsToMany: students (pivot: student_documents) |
| `extracurricular_activities` | Aktivitetet jashtëshkollore | belongsToMany: students (pivot: activity_enrollments) |
| `assignments` | Detyrat | belongsTo: subject, class |
| `assignment_submissions` | Dorëzimi i detyrave | belongsTo: assignment, student |
| `staff` | Stafi i shkollës | belongsTo: user |
| `approvals` | Kërkesat për miratim | morphTo: approvable |
| `day_supervisors` | Kujdestarët e ditës | belongsTo: staff |
| `attendance_audits` | Auditimi i prezencës | belongsTo: attendance_record |
| `room_weekly_scores` | Rezultatet javore të dhomave | belongsTo: dorm_room |

---

## 7. API Endpoint-et Kryesore

### Autentifikimi

| Metoda | Endpoint | Qëllimi |
|--------|----------|---------|
| POST | `/auth/login` | Hyrje në sistem |
| POST | `/auth/logout` | Dalje nga sistemi |
| GET | `/auth/me` | Profili i përdoruesit aktual |

### Nxënësit

| Metoda | Endpoint | Qëllimi |
|--------|----------|---------|
| GET | `/students` | Lista e nxënësve (me pagination, filtra) |
| GET | `/students/{id}` | Detajet e nxënësit |
| POST | `/students` | Regjistrimi i nxënësit të ri |
| PUT | `/students/{id}` | Përditësimi i nxënësit |
| DELETE | `/students/{id}` | Fshirja e nxënësit |
| POST | `/students/import` | Import masiv CSV |

### Klasat

| Metoda | Endpoint | Qëllimi |
|--------|----------|---------|
| GET | `/classes` | Lista e klasave (filtruar sipas vitit) |
| GET | `/classes/{id}` | Detajet e klasës |
| POST | `/classes` | Krijimi i klasës |
| PUT | `/classes/{id}` | Përditësimi i klasës |
| DELETE | `/classes/{id}` | Fshirja e klasës |
| POST | `/classes/{class}/assign-homeroom` | Caktimi i kujdestarit |

### Akademike

| Metoda | Endpoint | Qëllimi |
|--------|----------|---------|
| GET | `/academic/subjects` | Lista e lëndëve |
| GET | `/academic/timetable` | Orari mësimor |
| GET | `/academic-years` | Lista e viteve shkollore |
| POST | `/academic-years` | Krijimi i vitit të ri |
| PUT | `/academic-years/{id}/activate` | Aktivizimi i vitit |
| POST | `/academic-years/{id}/promote` | Promovimi i klasave për vitin e ri |

### Financat

| Metoda | Endpoint | Qëllimi |
|--------|----------|---------|
| GET | `/finance/overview` | Përmbledhja financiare |
| GET | `/payments` | Lista e pagesave |
| POST | `/payments` | Regjistrimi i pagesës |
| GET | `/outstanding` | Borxhet |
| GET | `/fee-structures` | Tarifat |
| GET | `/invoices` | Faturat |

### Konvikti

| Metoda | Endpoint | Qëllimi |
|--------|----------|---------|
| GET | `/dormitory` | Përmbledhja e konviktit |
| GET | `/dormitory/rooms` | Lista e dhomave |
| GET | `/dormitory/inspections` | Kontrollet e dhomave |
| POST | `/dormitory/inspections` | Regjistrimi i kontrollit |

### Disiplina

| Metoda | Endpoint | Qëllimi |
|--------|----------|---------|
| GET | `/discipline/history` | Historiku i vërejtjeve |
| POST | `/discipline/record` | Regjistrimi i vërejtjes |

---

## 8. Funksionalitetet Kryesore të Implementuara

1. **Autentifikimi me role** — Hyrje e sigurt me token Sanctum, role-based authorization
2. **Regjistrimi i nxënësve** — Formular i plotë me validim, import CSV, editim, fshirje
3. **Menaxhimi i klasave** — Krijo, edito, fshi klasa, cakto kujdestarë
4. **Menaxhimi i lëndëve** — CRUD i lëndëve të kategorizuara sipas nivelit (10, 11, 12)
5. **Orari mësimor** — Shfaqja e orarit javor me slot-et kohore
6. **Vitet shkollore** — Krijo, aktivizo, promovo klasat automatikisht (10→11, 11→12, 12→diplomim)
7. **Prezenca ditore** — Regjistro prezencë (prezent/mungon/vonesë) për çdo klasë
8. **Prezenca e Fajr-it** — Regjistro prezencën e namazit të sabahut për konviktorët
9. **Miratimi i mungesave** — Shqyrto dhe mirato/refuzo mungesat në grup
10. **Menaxhimi financiar** — Pasqyra financiare, regjistrimi i pagesave, borxhet, faturat
11. **Konvikti** — Shiko kapacitetin dhe zënien e dhomave
12. **Kontrollet e dhomave** — Inspektimi me checklist, rezultate automatike
13. **Rënditja e dhomave** — Leaderboard javor/mujor/vjetor
14. **Disiplina** — Regjistro vërejtje, kategorizo, shiko historikun
15. **Njoftimet** — Shfaq njoftimet e shkollës me prioritete
16. **Dashboard-et e personalizuara** — 6 role me panele të ndryshme
17. **Tema dark/light** — Ndrysho pamjen e aplikacionit
18. **Eksportimi i raporteve** — Excel dhe PDF për prezencë
19. **Stafi** — Listimi dhe grupimi i stafit sipas roleve
20. **Shikimi i dokumenteve** — Nxënësit mund të shohin dokumentet e tyre

---

## 9. Screens që Ekzistojnë (React Pages)

| Path | Page/Component | Roli |
|------|---------------|------|
| `/login` | LoginPage | Publik |
| `/dashboard` | DirectorDashboard / SecretaryDashboard / CashierDashboard / TeacherDashboard / EducatorDashboard / StudentDashboard | Të gjithë |
| `/profile` | ProfilePage | Të gjithë |
| `/students` | AllStudentsPage | Drejtor, Sekretar, Mësues |
| `/students/new` | StudentFormPage (create) | Drejtor, Sekretar |
| `/students/:id` | StudentDetailPage | Drejtor, Sekretar |
| `/students/:id/edit` | StudentFormPage (edit) | Drejtor, Sekretar |
| `/students/import` | StudentImportPage | Drejtor, Sekretar |
| `/staff` | GenericListPage (staff) | Drejtor |
| `/timetable` | TimetablePage | Drejtor, Student, Boarding |
| `/subjects` | SubjectsPage | Drejtor |
| `/subjects/:id` | SubjectDetailPage | Drejtor |
| `/subjects/:subjectId/class/:classId` | ClassSubjectReportPage | Drejtor |
| `/academic-years` | AcademicYearsPage | Drejtor, Sekretar |
| `/classes` | ClassesPage | Të gjithë (përveç student) |
| `/classes/:id` | ClassDetailPage | Të gjithë (përveç student) |
| `/classes/new` | ClassFormPage (create) | Drejtor, Sekretar |
| `/classes/:id/edit` | ClassFormPage (edit) | Drejtor, Sekretar |
| `/classes/:classId/students` | ClassStudentsPage | Drejtor, Sekretar, Mësues |
| `/classes/:classId/students/:id` | StudentDetailPage | Drejtor, Sekretar |
| `/classes/:id/attendance` | AttendancePage | Mësues, Edukator |
| `/classes/:id/attendance/take` | AttendancePage | Mësues, Edukator |
| `/classes/:id/attendance/fajr` | FajrAttendancePage | Edukator |
| `/classes/:id/attendance/study-hours` | StudyHoursPage | Edukator |
| `/classes/:id/attendance/reports` | AttendanceReportsPage | Të gjithë |
| `/classes/:id/grades` | GradesPage | Mësues, Drejtor |
| `/attendance/approval` | AbsenceApprovalPage | Mësues, Edukator |
| `/finance` | FinanceOverviewPage | Drejtor, Arkatar |
| `/finance/payments` | PaymentsPage | Drejtor, Arkatar |
| `/finance/payments/new` | RecordPaymentPage | Drejtor, Arkatar |
| `/finance/invoices` | InvoicesPage | Arkatar |
| `/finance/outstanding` | OutstandingPage | Drejtor, Arkatar |
| `/finance/reports` | FinanceReportsPage | Të gjithë (me role) |
| `/finance/pay` | StudentPayPage | Student, Boarding |
| `/settings/fee-structure` | FeeStructurePage | Arkatar |
| `/dormitory` | DormitoryPage | Drejtor, Edukator |
| `/dormitory/rooms` | RoomsPage | Drejtor, Edukator |
| `/dormitory/inspections` | InspectionsPage | Drejtor, Edukator |
| `/dormitory/inspections/new` | InspectionFormPage | Edukator |
| `/dormitory/inspections/:id/edit` | InspectionFormPage | Edukator |
| `/dormitory/my-room` | MyRoomPage | Student (boarding) |
| `/dormitory/leaderboard` | LeaderboardPage | Edukator, Student (boarding) |
| `/discipline` | DisciplinePage | Drejtor, Mësues |
| `/discipline/record` | DisciplineRecordPage | Edukator |
| `/discipline/history` | DisciplinePage | Edukator |
| `/discipline/my-record` | MyDisciplinePage | Student, Boarding |
| `/extracurricular` | ExtracurricularPage | Drejtor |
| `/announcements` | AnnouncementsPage | Të gjithë |
| `/documents/my-documents` | GenericListPage (documents) | Student, Boarding |
| `/settings` | SettingsPage | Drejtor |
| `/users` | UsersManagementPage | Drejtor |
| `/reports` | FinanceReportsPage | Të gjithë |

---

## 10. Çfarë Nuk Është Implementuar Ende

- **Detyrat (Assignments)** — Faqja e listimit dhe dorëzimit të detyrave nuk është e gatshme
- **Klubet (Clubs)** — Nuk ka funksionalitet për klube shkollore
- **Dokumentet (Documents)** — Faqja e përgjithshme e dokumenteve (jo vetëm ato të nxënësve)
- **Raportet specifike** — Raportet akademike, të prezencës dhe disiplinës nuk kanë faqe të dedikuara
- **Modulet e klasës** — Lëndët, orari, pagesat dhe dokumentet për klasa specifike nuk kanë route të dedikuara
- **Njoftim i ri** — Shtimi i njoftimeve të reja në UI nuk është i implementuar
- **Gjenerimi i faturave** — Gjenerimi i faturave nga UI nuk është i implementuar
- **Pagesa online** — Funksionaliteti i pagesës online nuk është i integruar

---

## 11. Pikat më të forta të Projektit

1. **Arkitekturë role-based** — 6 role të përcaktuara qartë me pamje dhe funksionalitete të ndryshme
2. **UI/UX modern** — Dizajn i errët profesional me Tailwind CSS, animacione dhe mikrovizuale
3. **Dashboard-e të personalizuara** — Çdo rol ka panelin e vet informativ me statistika relevante
4. **Menaxhimi i vitit shkollor** — Promovimi automatik i klasave 10→11→12 me diplomim
5. **Sistemi i konviktit** — Menaxhim i plotë nga dhomat te kontrollet dhe leaderboard-i
6. **Moduli financiar** — Nga regjistrimi i pagesave te faturat dhe raportet
7. **Import masiv CSV** — Regjistrim i shpejtë i nxënësve përmes skedarëve CSV
8. **Prezenca fleksibël** — Regjistro prezencë të rregullt, Fajr, dhe orë studimi
9. **Miratimi i mungesave** — Proces i kompletuar i shqyrtimit dhe miratimit në grup
10. **Shkallëzueshmëri** — Arkitektura Laravel + React lejon shtimin e lehtë të moduleve të reja

---

## 12. Përmbledhje

**Medreseja Alauddin School Management System** është një aplikacion web i plotë i ndërtuar me Laravel 11 dhe React 19, i projektuar për të dixhitalizuar dhe centralizuar menaxhimin e shkollave të mesme fetare. Sistemi trajton të gjitha aspektet kryesore të administratës shkollore: regjistrimin dhe menaxhimin e nxënësve, organizimin e klasave dhe lëndëve, orarin mësimor, prezencën, notat, financat, konviktin, disiplinën dhe njoftimet.

Arkitektura e sistemit është e ndarë në një backend API të ndërtuar me Laravel Sanctum për autentifikim token-based dhe një frontend Single Page Application të ndërtuar me React. Autentifikimi mbështet gjashtë role të ndryshme përdoruesish — drejtor, sekretar, arkatar, mësues, edukator dhe nxënës — secili me pamje dhe funksionalitete të përshtatura sipas nevojave të tyre.

Backend-i ofron mbi 50 endpoint-e API të organizuara sipas moduleve, me middleware të personalizuar për autorizimin e roleve. Database përfshin mbi 25 tabela të lidhura në mënyrë efikase përmes Eloquent ORM. Frontend-i përmban mbi 40 faqe dhe komponentë të ndryshëm, duke përfshirë dashboard-e të personalizuara, tabela interaktive, grafikë (recharts), dhe formularë me validim.

Modulet më të fuqishme përfshijnë menaxhimin e viteve shkollore me promovim automatik të klasave (10→11, 11→12, 12→diplomim), sistemin e konviktit me kontrolle dhe leaderboard, modulin financiar me pagesa dhe fatura, si dhe procesin e plotë të prezencës nga regjistrimi te miratimi i mungesave. Projekti është në fazën përfundimtare të zhvillimit dhe është gati për demonstrim, me disa module dytësore që priten të implementohen në përditësimet e ardhshme.

---

## Demo Credentials

Të gjitha llogaritë demo përdorin password: **demo123**

| Roli | Email |
|------|-------|
| Drejtor | director@medrese.edu |
| Sekretar | secretary@medrese.edu |
| Arkatar | cashier@medrese.edu |
| Mësues | teacher@medrese.edu |
| Edukator | educator@medrese.edu |
| Nxënës | student@medrese.edu |
| Konviktor | boarding@medrese.edu |

## Setup i Shpejtë

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve   # → http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev         # → http://localhost:5173
```

---

> **Teknologjitë**: Laravel 11 · React 19 · Tailwind CSS 4 · MySQL
> **Versioni i dokumentit**: 1.0.0
> **Data**: Korrik 2026
