# Ruang Katalog — Next.js + MySQL (Aiven) + Vercel

Aplikasi inventaris produk dengan alur CRUD (Create, Read, Update, Delete),
dibangun menggunakan Next.js App Router dan MySQL. Antarmuka Ruang Katalog
menggunakan layout workspace yang ringkas, terinspirasi pola aplikasi
[Linear](https://linear.app/features), dengan warna alami dan tipografi yang
mudah dibaca.

## Struktur Project

```
app/
  api/products/route.js         -> GET (list), POST (create)
  api/products/[id]/route.js    -> GET (detail), PUT (update), DELETE
  page.js                       -> Dashboard, modal produk, panel detail, pencarian, dan CRUD
  layout.js
  globals.css
lib/
  db.js                         -> Koneksi pool MySQL (support SSL Aiven)
schema.sql                      -> Skema tabel `products`
.env.local.example              -> Contoh environment variables
```

## 1. Buat Database di Aiven

1. Login ke https://aiven.io lalu buat service baru → pilih **MySQL** → plan **Free**.
2. Pilih region terdekat, tunggu status menjadi "Running".
3. Buka tab **Overview**, catat: `Host`, `Port`, `User` (biasanya `avnadmin`), `Password`, `Database name` (default `defaultdb`).
4. Download **CA Certificate** (`ca.pem`) dari halaman yang sama.
5. Buat tabelnya. Bisa lewat Aiven Console (query editor) atau CLI MySQL:
   ```bash
   mysql --host=<HOST> --port=<PORT> --user=<USER> --password=<PASSWORD> \
     --database=<DBNAME> --ssl-mode=REQUIRED < schema.sql
   ```

## 2. Setup Project Secara Lokal

```bash
npm install
cp .env.local.example .env.local
```

Isi `.env.local` dengan kredensial Aiven kamu:

```
DB_HOST=your-service.aivencloud.com
DB_PORT=xxxxx
DB_USER=avnadmin
DB_PASSWORD=xxxxx
DB_NAME=defaultdb
DB_CA_CERT=<base64 dari ca.pem>
```

Generate nilai `DB_CA_CERT` dari file `ca.pem` yang tadi didownload:

```bash
base64 -i ca.pem | tr -d '\n'
```

Copy hasilnya (satu baris panjang) ke `.env.local`.

Jalankan secara lokal:

```bash
npm run dev
```

Buka http://localhost:3000 — kamu akan melihat dashboard katalog, ringkasan
inventaris, pencarian, dan daftar produk. Gunakan tombol "Produk baru" untuk
membuka form modal, atau pilih satu produk untuk membuka panel detail dan
mengedit atau menghapusnya.

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: CRUD produk Next.js + MySQL"
git branch -M main
git remote add origin https://github.com/username/nama-repo.git
git push -u origin main
```

Pastikan `.env.local` **tidak** ikut ter-commit (sudah otomatis diabaikan lewat `.gitignore`).

## 4. Deploy ke Vercel

1. Login ke https://vercel.com dengan akun GitHub.
2. Klik **Add New → Project**, pilih repo yang baru saja di-push.
3. Di bagian **Environment Variables**, tambahkan variabel yang sama persis seperti di `.env.local`:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_CA_CERT`
4. Klik **Deploy**.
5. Setelah selesai, buka URL yang diberikan Vercel (`https://nama-project.vercel.app`) — aplikasi CRUD sudah bisa dipakai.

## Fitur

- **Create**: tambah produk baru lewat modal (nama, deskripsi, harga)
- **Read**: daftar semua produk otomatis dimuat saat halaman dibuka
- **Search**: cari produk berdasarkan nama atau deskripsi
- **Detail produk**: klik item katalog untuk membuka panel detail di sisi kanan
- **Update**: edit produk dari panel detail dengan form modal yang sama seperti Create
- **Delete**: hapus produk dari panel detail setelah konfirmasi
- **Ringkasan**: hitung jumlah produk, nilai katalog, dan rata-rata harga

## Catatan

- Free tier Aiven MySQL bisa nonaktif otomatis setelah periode idle tertentu — kamu akan mendapat notifikasi email sebelum itu terjadi.
- Kalau ingin menambah kolom atau tabel baru, cukup ubah `schema.sql` dan sesuaikan query di `app/api/products/`.
- Untuk validasi input yang lebih ketat atau autentikasi (login admin), beri tahu saya — bisa ditambahkan.
