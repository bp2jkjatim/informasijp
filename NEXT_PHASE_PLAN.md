# Next Phase Plan

## Tujuan Fase Berikutnya

Membangun ulang aplikasi dari dashboard statis berbasis JSON menjadi aplikasi operasional dengan:

- database MySQL/MariaDB via Docker
- login dan otorisasi berbasis role
- input diklat dan upload sertifikat
- dashboard capaian per pegawai dan seluruh pegawai
- import data dasar dari `Data SDM BP2JK Jatim-2.xlsx`
- export rekap ke Excel
- UI dashboard dan panel input berbasis TanStack

## Kondisi Project Saat Ini

- Frontend masih React + Vite sederhana.
- Data saat ini masih dibaca dari `public/data/jp-data.json`.
- Belum ada backend, auth, database, upload file, atau role access.
- File Excel terbaru yang perlu dijadikan acuan adalah `Data SDM BP2JK Jatim-2.xlsx`.

## Arah Arsitektur

### Backend

- Tambahkan backend API terpisah atau fullstack dalam satu repo.
- Gunakan MariaDB `10.4.27` di Docker sesuai permintaan.
- Simpan file sertifikat ke local storage project terlebih dahulu, dengan path file disimpan di database.
- Backend bertanggung jawab untuk:
  - autentikasi login
  - otorisasi role
  - CRUD pegawai dan diklat
  - agregasi dashboard
  - import awal dari Excel
  - export Excel

### Frontend

- Tetap gunakan React + Vite.
- Tambahkan TanStack untuk fondasi aplikasi:
  - `@tanstack/react-router` untuk routing panel
  - `@tanstack/react-query` untuk data fetching dan cache
  - `@tanstack/react-table` untuk tabel pegawai dan diklat
  - opsional `@tanstack/form` bila ingin form konsisten

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

### 3. Basic User

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
- `Total JP` adalah penjumlahan seluruh `jumlah_jp` milik pegawai
- `Pemenuhan JP` adalah status summary hasil perhitungan, bukan field input manual

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

Schema ini mengikuti data pada sheet `Diklat 2025 dan evaluasi` dan kebutuhan aplikasi.

### `users`

- `id`
- `username`
- `password_hash`
- `role` enum: `admin`, `leader`, `kepala_balai`, `ktu`, `user`
- `employee_id` nullable untuk admin non-pegawai bila diperlukan
- `is_active`
- `created_at`
- `updated_at`

### `employees`

- `id`
- `nip` unique
- `name`
- `phone`
- `employee_status` enum: `PNS`, `P3K`, `LAINNYA`
- `position_level` atau `jenjang`
- `rank_group` atau `pangkat_gol`
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

- view atau materialized summary di level query, bukan tabel input
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

Dipakai untuk aturan seperti target JP per status pegawai bila nantinya perlu berubah tanpa ubah kode.

## Mapping Excel ke Database

### Sheet `DataPegawai`

Bisa jadi sumber data master pegawai:

- `Nama` -> `employees.name`
- `NIP` -> `employees.nip`

Catatan:

- Jika data pegawai lain belum tersedia di sheet ini, kolom lain seperti phone, jenjang, pangkat, dan TMT diisi bertahap atau dari sumber lain.
- Relasi pegawai pada sheet diklat dicocokkan berdasarkan nama setelah normalisasi format penulisan.

### Sheet `Diklat 2025 dan evaluasi`

Sumber data transaksi diklat:

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
- `Total JP` dan `Pemenuhan JP` tidak disimpan sebagai field input utama karena merupakan hasil summary

## Fitur yang Akan Dibangun

### 1. Infrastruktur Database dan Backend

- setup `docker-compose` untuk MariaDB `10.4.27`
- backend API
- migration dan seeding
- koneksi DB per environment lokal

### 2. Authentication dan Authorization

- halaman login
- seed akun awal:
  - `admin` / `admin`
  - `nip` / `nip`
- session login
- proteksi route berdasarkan role

### 3. Master Data Pegawai

- import awal dari Excel
- list pegawai
- pencarian berdasarkan nama/NIP
- sinkronisasi relation user ke pegawai

### 4. Input Diklat

- form input diklat
- upload sertifikat
- pilihan pegawai untuk admin/pimpinan
- pembatasan agar basic user hanya bisa input miliknya

### 5. Dashboard Basic User

- total JP pribadi
- target JP sesuai status pegawai
- sisa JP
- status pemenuhan total
- status 3 kriteria checkbox
- daftar riwayat diklat pribadi

### 6. Dashboard Admin/Pimpinan

- statistik seluruh pegawai
- filter berdasarkan nama, status pegawai, role, capaian
- tabel ringkasan seluruh pegawai
- drill-down ke detail pegawai

### 7. Export Excel

- export seluruh pegawai
- export per nama pegawai
- kolom export memuat:
  - identitas pegawai
  - daftar diklat
  - total JP
  - status pemenuhan JP
  - status pemenuhan 3 kriteria

## Rencana Implementasi Bertahap

### Phase 1: Fondasi Teknis

- pilih stack backend
- tambah Docker MariaDB `10.4.27`
- definisikan schema awal
- buat migration
- buat seed user default

Deliverable:

- aplikasi bisa terkoneksi ke DB
- tabel inti sudah tersedia
- login seed sudah siap dipakai

### Phase 2: Import Data Awal

- parser Excel terbaru
- import master pegawai dari sheet `DataPegawai`
- import data diklat 2025 dari sheet `Diklat 2025 dan evaluasi`
- handle data kotor:
  - NIP dalam scientific notation
  - tanggal campuran Excel serial dan teks
  - baris pegawai yang punya banyak baris diklat

Deliverable:

- database terisi data awal yang konsisten
- summary JP dapat dihitung dari data transaksi

### Phase 3: Auth, Role, dan Route Protection

- form login
- session storage/cookie
- guard per role
- relasi user ke employee

Deliverable:

- user hanya melihat fitur sesuai hak akses

### Phase 4: Panel Input Diklat

- form tambah/edit diklat
- upload sertifikat
- validasi field wajib
- role restriction per user

Deliverable:

- basic user dapat input diklat miliknya
- admin/pimpinan dapat input milik siapa pun

### Phase 5: Dashboard TanStack

- routing aplikasi dengan TanStack Router
- query state dengan TanStack Query
- tabel pegawai dan diklat dengan TanStack Table
- dashboard personal
- dashboard seluruh pegawai

Deliverable:

- UI operasional, bukan lagi dashboard statis

### Phase 6: Export dan Penyempurnaan

- export Excel semua pegawai
- export Excel per pegawai
- audit validasi summary
- hardening auth dan upload

Deliverable:

- fitur rekap siap dipakai operasional

## Keputusan Teknis yang Direkomendasikan

### Backend

Pilihan paling lurus untuk repo ini:

- `Node.js + Express/Fastify`
- ORM `Prisma` atau `Drizzle`

Alasan:

- cocok dengan frontend React/Vite yang sudah ada
- mudah sharing tipe data
- cukup cepat untuk CRUD, upload, import, dan export

### Upload File

- simpan ke folder lokal seperti `uploads/certificates`
- nama file dibuat unik
- metadata disimpan di DB
- nanti bisa dipindah ke object storage bila diperlukan

### Export Excel

- generate file `.xlsx` dari backend
- endpoint khusus untuk export seluruh pegawai atau per pegawai

## Risiko dan Catatan

- Perlu konfirmasi aturan JP untuk `P3K`, karena requirement belum eksplisit.
- Perlu konfirmasi apakah role `leader`, `kepala balai`, dan `KTU` dibedakan hak aksesnya atau sama.
- NIP di Excel ada yang tampil dalam scientific notation, jadi import harus memaksa format string.
- Tanggal pelaksanaan pada Excel tidak seragam, jadi penyimpanan awal sebaiknya simpan versi teks dan versi parsed bila berhasil.
- `Total JP` dan `Pemenuhan JP` harus dihitung ulang oleh sistem agar tidak tergantung isi manual Excel.

## Open Questions Sebelum Implementasi

- Backend ingin tetap satu repo atau dipisah folder `server/`?
- Auth cukup session lokal dulu atau perlu JWT?
- File sertifikat cukup disimpan lokal atau harus siap untuk cloud storage?
- Pimpinan boleh edit data user/pegawai atau hanya input dan lihat dashboard?
- Basic user boleh edit/hapus diklat yang sudah diinput atau hanya tambah?

## Urutan Kerja Praktis Berikutnya

1. Tentukan stack backend yang akan dipakai.
2. Tambahkan Docker MariaDB `10.4.27`.
3. Buat schema migration awal.
4. Buat importer Excel ke database.
5. Implement login dan role guard.
6. Bangun dashboard dan panel input dengan TanStack.
7. Tambahkan upload sertifikat dan export Excel.

## Catatan Resume

Saat lanjut kerja nanti, mulai dari:

1. setup backend + docker database
2. finalisasi schema berdasar file Excel
3. import data awal

File ini menjadi referensi fase implementasi berikutnya.
