# Handoff: School Management System Refactor

## Qëllimi
Për të vazhduar projektin në mënyrë të qartë, agjenti tjetër duhet të dijë se baza e projektit është Laravel + React, dhe që fokusi i ardhshëm është të riorganizohet databaza për një sistem profesional të menaxhimit të shkollës.

## Statusi aktual
- Backend: Laravel
- Frontend: React + Vite
- Database: MySQL/MariaDB (përmes Laravel migrations)
- Ka migracione ekzistuese të mëdha dhe modele të shumta

## Problemet kryesore të databazës
1. Klasa dhe studentët janë lidhur shumë ngushtë me një kolonë `class_id` në tabelën `students`.
   - Kjo nuk mbështet historinë akademike të studentit.
   - Nuk lejon që studenti të kalojë nga një klasë në tjetrën pa humbur historikun.

2. Nuk ekziston një strukturë për vite shkollore të pavarura.
   - Ka një tabelë `academic_years`, por nuk përdoret plotësisht si model bazë për vitet shkollore.
   - Duhet të ketë një model të qartë për `school_years` dhe logjikë për vetëm një vit aktiv.

3. Notat, mungesat dhe oraret nuk janë të lidhura në mënyrë të plotë me vitin, klasën, studentin, lëndën dhe mësimdhënësin.
   - Kjo do të thotë se historiku i nxënësit nuk do të jetë i qëndrueshëm.

4. Nuk ekziston një tabelë e veçantë për lidhjen e klasës me lëndën dhe mësimdhënësin.
   - Kjo e bën sistemin të paqartë për të ditur se cili mësues jep cilën lëndë në cilën klasë.

5. Studentët mbahen aktualisht direkt në klasë.
   - Duhet të kalohen në një strukturë me tabelë histori: `student_class_history`.

## Struktura që duhet implementuar

### 1. Tabela e re: school_years
Fushat e sugjeruara:
- id
- name (p.sh. 2025/2026)
- start_date
- end_date
- status (active, archived)
- timestamps

### 2. Tabela e re: student_class_history
Fushat e sugjeruara:
- id
- student_id
- class_id
- school_year_id
- status (ACTIVE, PROMOTED, REPEATED, TRANSFERRED, GRADUATED)
- timestamps

Rregulla:
- Një student mund të ketë shumë rekorde.
- Vetëm një rekord mund të jetë ACTIVE në çdo moment.

### 3. Riorganizimi i classes
Tabela `classes` duhet të ketë:
- school_year_id
- grade (10, 11, 12)
- parallel (1, 2, 3...)
- name (p.sh. 10/1)
- guardian_id (foreign key te users)
- capacity (opsionale)
- status

### 4. Riorganizimi i notave, mungesave dhe orarit
Këto tabela duhet të kenë lidhje të qarta me:
- school_year_id
- class_id
- student_id
- subject_id
- teacher_id

### 5. Tabela e re: class_subject_teacher
Për të lidhur:
- class
- subject
- teacher

Kjo do të ndihmojë sistemin të dijë automatikisht cilin profesor ka cila lëndë në cilën klasë.

## Modelet dhe relacionet që duhet rishikuar

### Models që duhen riorganizuar
- Student
- ClassModel
- AcademicYear
- AttendanceRecord
- TimetableSlot
- Assignment
- Grade (nëse ekziston ose do të shtohet)

### Relacionet që duhet të shfaqen në mënyrë të qartë
- Student -> hasMany(student_class_history)
- ClassModel -> hasMany(student_class_history)
- SchoolYear -> hasMany(classes)
- SchoolYear -> hasMany(attendance_records)
- SchoolYear -> hasMany(grades)
- ClassModel -> hasMany(class_subject_teacher)
- Teacher/User -> hasMany(class_subject_teacher)
- Subject -> hasMany(class_subject_teacher)

## Controllers që duhet rishikuar
- StudentsController
- ClassController
- AttendanceController
- AcademicController
- SettingsController

## Seeders që duhen përmirësuar
Pas implementimit të skemës së re, duhet të krijohen seeders të vërtetë me:
- 2 vite shkollore
- 20+ profesorë
- administrator
- drejtor
- sekretari
- 12–15 klasa
- 200+ nxënës
- lëndët
- kujdestarët
- orarin
- class_subject_teacher
- nota
- mungesa
- tema mësimore

## Praktika të rekomanduara
- Përdor Eloquent relationships në vend të logjikës manuale
- Përdor foreign keys të sakta dhe constraint-e
- Përdor transactions për operacione komplekse si promovimi i klasave
- Përdor soft deletes vetëm kur ka kuptim real
- Shto indekse për kolonat e përdorura shpesh
- Përdor composite unique constraints kur është e nevojshme

## Prioriteti i parë
Prioriteti është të zëvendësohet modeli i tanishëm i klasës direkte te studentët me një model historik për klasat, në mënyrë që aplikacioni të jetë i aftë të mbajë historikun akademik të plotë.

## Udhëzimet për agjentin tjetër
- Mos prish funksionalitetet ekzistuese pa pasur një plan të qartë
- Ruaj strukturën ekzistuese sa më shumë që të jetë e mundur
- Implemento gradualisht
- Së pari krijo skemën e re, pastaj modeli, pastaj controller-et, pastaj seeders
- Testo çdo hap me migrimet dhe seeders
