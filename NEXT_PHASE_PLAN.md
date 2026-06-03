# Next Phase Plan

## Tujuan Fase Berikutnya

Membangun fase lanjutan aplikasi dengan arah transisi yang aman:

- existing code tetap dibiarkan ada dan tidak dipaksa dirombak langsung
- data frontend existing yang masih statis nantinya diganti agar diambil dari backend, bukan lagi JSON statis
- tambahkan folder baru `/app` sebagai aplikasi utama berikutnya
- `/app` akan memakai Next.js agar frontend dan backend dapat berjalan dalam satu app
- UI `/app` akan mengikuti fondasi Tremor untuk Next.js, lalu disesuaikan ke warna biru dasar logo Kementerian PU dan putih
- `/app` akan melayani kebutuhan admin dan pegawai untuk input data, melihat dashboard, dan mengelola data sesuai role

## Kondisi Project Saat Ini

- Branch dan code existing masih berbasis React + Vite.
- Sebagian UI dashboard sudah ada, tetapi sebelumnya masih mengarah ke pola data statis.
- Existing code jangan dibuang karena masih berguna sebagai referensi alur, field, dan kebutuhan layar.
- `NEXT_PHASE_PLAN.md` sebelumnya ada di branch `feat-v1`, tetapi pada branch `v2` perlu dibuat ulang dengan arah arsitektur yang lebih jelas.
- Seluruh kebutuhan inti dari plan sebelumnya tetap dibawa ke plan ini, hanya arah implementasinya dipindah ke `/app`.

## Prinsip Perubahan

- Jangan rusak alur existing lebih dulu.
- Jangan migrasikan semua sekaligus.
- Perlakukan code existing sebagai baseline referensi UI dan kebutuhan bisnis.
- Pusat pengembangan fase berikutnya dipindah ke `/app`.
- Peralihan dari JSON statis ke backend dilakukan bertahap per halaman atau per modul.

## Arah Arsitektur Baru

### Aplikasi Utama di `/app`

- Buat folder `/app` sebagai proyek Next.js terpisah di dalam repo ini.
- `/app` menjadi tempat pengembangan utama untuk fase berikutnya.
- `/app` menangani:
  - frontend admin
  - frontend pegawai/basic user
  - backend API internal Next.js
  - autentikasi dan otorisasi
  - akses database
  - upload file sertifikat
  - export data
- Arsitektur baru ini menggantikan pendekatan "backend terpisah atau fullstack opsional" menjadi fullstack utama di `/app`.

### Posisi Existing App

- Existing app React + Vite tetap dibiarkan ada.
- Existing app tidak menjadi target utama pengembangan fitur baru.
- Existing app dipakai sebagai:
  - referensi tampilan
  - referensi field data
  - referensi flow dashboard
  - fallback sementara selama migrasi belum selesai

### Strategy Penggantian Data

- Data yang sebelumnya statis atau berasal dari file JSON tidak lagi menjadi source of truth.
- Source of truth dipindahkan ke database dan backend di `/app`.
- Frontend baru di `/app` wajib mengambil data dari backend.
- Bila existing app nanti masih dipakai sementara, endpoint backend yang sama dapat dipakai untuk mengurangi duplikasi logika.
- Kebutuhan dashboard, input data, import Excel, dan export tetap sama seperti plan lama, hanya source datanya berubah menjadi backend-driven.

## Template UI dan Visual Direction

### Fondasi UI

- Gunakan setup Tremor untuk Next.js sebagai titik awal implementasi di `/app`.
- Gunakan struktur Next.js app router dengan pendekatan yang dianjurkan Tremor.
- Gunakan Tremor terutama untuk:
  - dashboard cards
  - charts
  - tables
  - form primitives yang relevan
  - layout admin/dashboard

### Penyesuaian Branding

- Tema default tidak dipakai mentah.
- Ubah warna utama menjadi:
  - biru sebagai warna dasar utama, mengikuti nuansa logo Kementerian PU
  - putih sebagai warna latar utama
  - teks dominan biru
- Arah visual:
  - background utama putih atau biru sangat muda
  - card putih dengan border biru muda
  - heading dan body text dominan biru gelap
  - CTA utama biru
  - state hover/focus memakai turunan biru, bukan ungu atau warna default lain

### Catatan Implementasi Tema

- Buat token warna global sejak awal.
- Jangan sebar hardcoded color class ke semua komponen tanpa sistem.
- Prioritaskan theme layer yang konsisten agar admin dan pegawai memakai visual language yang sama.

## Stack Teknis yang Direkomendasikan

### Untuk `/app`

- `Next.js` dengan app router
- `React`
- `TypeScript`
- `Tailwind CSS`
- `Tremor`
- `@remixicon/react`
- `Next.js Route Handlers` atau server-side layer yang setara untuk backend internal
- `MariaDB 10.4.27`
- ORM: `Prisma` atau `Drizzle`
- auth berbasis session
- `docker-compose` tetap dipakai untuk menjalankan database lokal

### Catatan Penting

- Karena `/app` akan menangani frontend dan backend sekaligus, stack ini lebih lurus dibanding mempertahankan frontend Vite terpisah lalu menambah backend terpisah lagi.
- Existing frontend tetap boleh ada, tetapi fase aktif development berpindah ke Next.js di `/app`.
- Keputusan Docker dan versi database tidak berubah dari plan sebelumnya.

## Komponen Plan Lama yang Tetap Dipertahankan

Walau arsitektur berubah ke `/app`, bagian-bagian berikut tetap menjadi ruang lingkup fase implementasi:

- database di Docker
- MariaDB `10.4.27`
- login dan role-based access
- input diklat dan upload sertifikat
- dashboard capaian pegawai dan seluruh pegawai
- import data dasar dari `Data SDM BP2JK Jatim-2.xlsx`
- export rekap ke Excel
- aturan bisnis JP dan 3 kriteria diklat
- schema `users`, `employees`, `trainings`, `employee_yearly_summary`, dan `system_settings`

Artinya, perubahan utama bukan pada requirement bisnisnya, tetapi pada wadah implementasinya:

- sebelumnya: cenderung menambah backend ke struktur yang ada
- sekarang: membangun `/app` sebagai aplikasi fullstack utama

## Struktur Folder yang Diinginkan

Contoh arah struktur:

```text
/app
  /src
    /app
      /(public)
      /(auth)
      /(admin)
      /(employee)
      /api
    /components
    /features
    /lib
    /server
    /styles
  /public
```

Makna utamanya:

- `(public)` untuk halaman umum seperti landing atau login bila dipisah
- `(auth)` untuk login flow
- `(admin)` untuk panel admin dan pimpinan
- `(employee)` untuk panel pegawai/basic user
- `/api` untuk endpoint backend
- `/server` untuk domain logic, query DB, auth, import, export, upload

## Role dan Hak Akses

### 1. Admin

- Login default: `admin` / `admin`
- Dapat input diklat dirinya sendiri
- Dapat input diklat pegawai lain
- Dapat upload sertifikat
- Dapat melihat dashboard seluruh pegawai
- Dapat export seluruh data atau per pegawai
- Dapat kelola user dan role

### 2. Pimpinan

- Role gabungan kebutuhan: `leader`, `kepala_balai`, `ktu`
- Dapat input diklat dirinya sendiri
- Dapat input diklat pegawai lain
- Dapat melihat dashboard seluruh pegawai
- Dapat export seluruh data atau per pegawai
- Tidak wajib punya akses penuh manajemen user

### 3. Basic User / Pegawai

- Login awal: `nip` / `nip` untuk seed user contoh
- Hanya dapat input diklat miliknya sendiri
- Hanya dapat upload sertifikat miliknya sendiri
- Tidak dapat edit data pegawai lain
- Dashboard hanya untuk dirinya sendiri

## Aturan Bisnis

### Pemenuhan JP

- PNS: target minimal `20 JP` per tahun
- P3K: requirement perlu dikonfirmasi
  - sementara gunakan rule yang dapat dikonfigurasi di database
- `Total JP` adalah hasil penjumlahan seluruh `jumlah_jp` milik pegawai
- `Pemenuhan JP` adalah hasil perhitungan sistem, bukan field input manual

### Kriteria Diklat

Setiap diklat punya 3 checkbox:

- `is_pbj`
- `is_jabatan`
- `is_integritas`

Dashboard pegawai dinyatakan lengkap bila:

- total JP memenuhi requirement status pegawai
- punya minimal 1 diklat kategori PBJ
- punya minimal 1 diklat kategori sesuai jabatan
- punya minimal 1 diklat kategori integritas

## Draft Schema Database

### `users`

- `id`
- `username`
- `password_hash`
- `role` enum: `admin`, `leader`, `kepala_balai`, `ktu`, `user`
- `employee_id` nullable
- `is_active`
- `created_at`
- `updated_at`

### `employees`

- `id`
- `nip` unique
- `name`
- `phone`
- `employee_status` enum: `PNS`, `P3K`, `LAINNYA`
- `position_level`
- `rank_group`
- `tmt_rank`
- `tmt_position`
- `akumulasi_ak_2025` nullable
- `notes`
- `jp_target`
- `created_at`
- `updated_at`

### `trainings`

- `id`
- `employee_id`
- `proposed_training` nullable
- `training_name`
- `training_date_text`
- `training_provider`
- `certificate_number`
- `certificate_file_path`
- `certificate_link` nullable
- `is_pbj`
- `is_jabatan`
- `is_integritas`
- `jumlah_jp`
- `year`
- `created_by_user_id`
- `created_at`
- `updated_at`

### `employee_yearly_summary`

- view atau summary query
- isi summary:
  - `employee_id`
  - `year`
  - `total_jp`
  - `jp_target`
  - `jp_fulfilled`
  - `has_pbj`
  - `has_jabatan`
  - `has_integritas`
  - `criteria_completed`
  - `overall_completed`

### `system_settings`

- `key`
- `value`

## Mapping Excel ke Database

### Sheet `DataPegawai`

- `Nama` -> `employees.name`
- `NIP` -> `employees.nip`

Catatan:

- Kolom detail lain dapat diisi bertahap atau dari sumber lain.
- Relasi pegawai pada sheet diklat dicocokkan berdasarkan nama setelah normalisasi.

### Sheet `Diklat 2025 dan evaluasi`

- `Nama` -> relasi ke `employees`
- `Rencana/ Usulan Diklat...` -> `trainings.proposed_training`
- `Nama Diklat` -> `trainings.training_name`
- `Tanggal Pelaksanaan` -> `trainings.training_date_text`
- `Pelaksana Diklat` -> `trainings.training_provider`
- `Nomor Sertifikat` -> `trainings.certificate_number`
- `Diklat berkaitan dengan PBJ` -> `trainings.is_pbj`
- `Diklat berkaitan dengan Jabatan` -> `trainings.is_jabatan`
- `Diklat berkaitan dengan Integritas` -> `trainings.is_integritas`
- `Jumlah JP` -> `trainings.jumlah_jp`
- `Link Bukti Dukung Sertifikat` -> `trainings.certificate_link`
- `Total JP` dan `Pemenuhan JP` dihitung sistem

## Fitur yang Akan Dibangun di `/app`

### 1. Fondasi Next.js + Tremor

- scaffold Next.js app router di `/app`
- setup Tremor sesuai fondasi Next.js
- siapkan theme biru-putih khas Kementerian PU
- siapkan shell layout admin dan pegawai

Deliverable:

- `/app` bisa jalan lokal
- layout dasar dan theme dasar sudah konsisten

### 2. Infrastruktur Database dan Backend

- setup koneksi DB
- setup `docker-compose` untuk MariaDB `10.4.27`
- migration dan seeding
- backend API internal di `/app`
- siapkan layer service/query agar frontend tidak langsung bercampur dengan SQL

Deliverable:

- `/app` bisa terkoneksi ke DB
- tabel inti tersedia

### 3. Authentication dan Authorization

- halaman login
- seed akun awal
- session login
- proteksi route berdasarkan role

Deliverable:

- admin, pimpinan, dan basic user hanya melihat fitur yang sesuai

### 4. Import Data Awal

- parser Excel terbaru
- import master pegawai
- import data diklat
- normalisasi data kotor

Deliverable:

- database terisi data awal yang konsisten

### 5. Penggantian JSON Statis ke Backend

- identifikasi semua layar atau komponen yang masih tergantung JSON statis
- ganti data source ke endpoint backend
- hitung summary dan dashboard dari database

Deliverable:

- data aplikasi tidak lagi statis
- backend menjadi source of truth

### 6. Panel Input Admin dan Pegawai

- form input diklat
- upload sertifikat
- pembatasan akses berdasar role
- admin bisa input untuk siapa pun
- pegawai hanya untuk datanya sendiri

Deliverable:

- alur input operasional siap dipakai

### 7. Dashboard Operasional

- dashboard personal pegawai
- dashboard agregat admin/pimpinan
- filter, tabel, chart, dan detail pegawai

Deliverable:

- dashboard memakai data real dari backend

### 8. Export dan Hardening

- export Excel semua pegawai
- export per pegawai
- audit validasi summary
- hardening auth, upload, dan access control

Deliverable:

- sistem siap dipakai lebih stabil

## Rencana Implementasi Bertahap

### Phase 1: Setup `/app` dan Design System

- buat Next.js app di `/app`
- pasang Tremor foundation
- siapkan theme biru-putih
- buat layout dasar admin dan pegawai

### Phase 2: Backend Internal dan Schema

- pilih ORM
- definisikan schema
- siapkan `docker-compose` MariaDB `10.4.27`
- siapkan koneksi DB
- buat migration awal
- buat seed user default

### Phase 3: Import dan Normalisasi Data

- import file Excel terbaru
- petakan data ke tabel inti
- validasi parsing NIP, tanggal, dan relasi nama

### Phase 4: Auth dan Role Guard

- login
- session auth
- route guard
- pemetaan user ke employee

### Phase 5: Migrasi dari JSON ke Data Backend

- ganti dataset statis dengan fetch ke backend
- bangun query summary
- sambungkan dashboard ke data real

### Phase 6: Form Input Operasional

- input diklat
- edit/hapus sesuai aturan
- upload sertifikat
- validasi form

### Phase 7: Export dan Finishing

- export Excel
- audit role access
- cleanup technical debt
- dokumentasi operasional

## Keputusan Teknis yang Direkomendasikan

- Fokus pengembangan baru ke `/app`, bukan menambal terus app lama.
- Existing code tetap dipertahankan sampai fitur kritis di `/app` stabil.
- Gunakan Next.js fullstack agar frontend dan backend satu alur deployment.
- Gunakan Tremor sebagai fondasi komponen dashboard, bukan template final yang dipakai mentah.
- Warna wajib disesuaikan ke identitas biru-putih, bukan warna default demo.
- Docker dan `MariaDB 10.4.27` tetap dipertahankan sesuai keputusan sebelumnya.

## Risiko dan Catatan

- Perlu konfirmasi aturan JP untuk `P3K`.
- Perlu konfirmasi apakah hak akses `leader`, `kepala_balai`, dan `ktu` sama persis.
- Migrasi bertahap berarti untuk sementara akan ada dua aplikasi dalam satu repo.
- Perlu disiplin agar logic bisnis tidak terpecah antara app lama dan `/app`.
- Import Excel harus memaksa NIP sebagai string.
- Tanggal Excel tidak seragam, jadi parsing harus defensif.

## Open Questions Sebelum Implementasi

- ORM final ingin `Prisma` atau `Drizzle`?
- Auth cukup session lokal dulu atau perlu integrasi yang lebih lanjut?
- Upload sertifikat cukup local storage dulu atau harus langsung siap cloud storage?
- Pimpinan boleh edit master data atau hanya melihat dan input?
- Existing app nantinya akan dipensiunkan penuh atau tetap dijaga sebagai fallback sementara?

## Urutan Kerja Praktis Berikutnya

1. Buat `/app` berbasis Next.js.
2. Pasang fondasi Tremor dan theme biru-putih.
3. Tambahkan `docker-compose` untuk MariaDB `10.4.27` bila belum ada pada struktur `/app`.
4. Definisikan schema dan koneksi database.
5. Implement auth dan role guard.
6. Import data Excel ke database.
7. Ganti dashboard dari JSON statis ke data backend.
8. Bangun form input admin dan pegawai.
9. Tambahkan upload sertifikat dan export Excel.

## Catatan Resume

Saat lanjut kerja nanti, mulai dari:

1. scaffold `/app` dengan Next.js + Tremor
2. definisikan theme biru-putih Kementerian PU
3. setup backend internal, schema, dan DB
4. migrasikan data dari JSON statis ke backend

File ini menjadi referensi utama untuk fase implementasi berikutnya di branch `v2`.
