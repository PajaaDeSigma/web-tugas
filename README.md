# Website Pembelajaran Kabel UTP

Website edukasi kabel UTP (Unshielded Twisted Pair): penjelasan, urutan warna standar
T568A/T568B, tata cara crimping, dashboard unggah/unduh materi (PPT & video) yang tersimpan
permanen di **Vercel Blob**, dan profil mahasiswa serta dosen pengampu. Dibangun dengan
Next.js, tampilan responsif dengan gaya "liquid glass" bertema biru.

## 1. Menghubungkan Vercel Blob (wajib untuk fitur unggah)

Fitur unggah/unduh materi memakai **Vercel Blob Storage** agar file benar-benar tersimpan
permanen (tidak hilang saat proyek di-deploy ulang), karena server Vercel bersifat serverless
dan tidak menyimpan file secara lokal.

Langkah setup di dashboard Vercel:

1. Buka proyek Anda di https://vercel.com/dashboard.
2. Masuk ke tab **Storage** → **Create Database** → pilih **Blob**.
3. Beri nama store, lalu klik **Create**, kemudian **Connect** ke proyek ini.
4. Vercel otomatis menambahkan environment variable `BLOB_READ_WRITE_TOKEN` ke proyek Anda —
   tidak perlu diisi manual.

## 2. Menjalankan di komputer lokal

Pastikan Node.js versi 18 ke atas sudah terpasang.

```bash
npm install
```

Agar fitur unggah berfungsi saat `npm run dev`, tarik environment variable dari Vercel
(setelah proyek terhubung ke Blob Store pada langkah 1):

```bash
npm install -g vercel   # jika CLI belum terpasang
vercel link             # hubungkan folder ini ke proyek Vercel Anda
vercel env pull .env.local
```

Lalu jalankan:

```bash
npm run dev
```

Buka http://localhost:3000 di browser.

> Tanpa `BLOB_READ_WRITE_TOKEN`, tombol unggah akan menampilkan pesan bahwa Blob belum terhubung.

## 3. Deploy ke Vercel

1. Push folder ini ke repository GitHub/GitLab/Bitbucket.
2. Di dashboard Vercel, **New Project** → impor repository tersebut.
3. Pastikan Blob Store sudah **Connect** ke proyek ini (lihat langkah 1) sebelum deploy,
   supaya `BLOB_READ_WRITE_TOKEN` otomatis tersedia di production.
4. Klik **Deploy**.

Atau lewat CLI:

```bash
vercel --prod
```

## Menyunting konten

- **Profil mahasiswa & dosen**: edit objek `PROFIL` di bagian atas `pages/index.js`.
- **Urutan warna / standar**: objek `WIRE` dan `STANDARDS` di `pages/index.js`.
- **Tabel kategori kabel & langkah crimping**: objek `KATEGORI_KABEL` dan `LANGKAH`.
- **Warna & tema**: variabel di baris atas `styles/globals.css` (`:root { ... }`).
- **Batas ukuran file**: konstanta `MAX_MB` di `pages/index.js` dan `MAX_SIZE` di
  `pages/api/upload.js` (harus diubah bersamaan).

## Bagaimana penyimpanan file bekerja

- Saat mengunggah, `pages/api/upload.js` mengirim file ke Vercel Blob lewat fungsi `put()`,
  disimpan dengan path `ppt/namafile` atau `video/namafile`.
- Daftar file diambil lewat `pages/api/files.js` menggunakan `list()` — metadata (nama, ukuran,
  tanggal) diambil langsung dari Blob, tanpa database tambahan.
- Tombol unduh memakai `downloadUrl` bawaan Vercel Blob yang otomatis memicu unduhan dengan
  nama file asli.
- Menghapus file memanggil `del()` berdasarkan URL blob tersebut.

## Struktur proyek

```
pages/
  _app.js          -> pembungkus global (memuat CSS)
  index.js         -> seluruh halaman (hero, materi, dashboard, profil)
  api/
    upload.js      -> menerima unggahan PPT/video, dikirim ke Vercel Blob
    files.js       -> daftar & hapus berkas dari Vercel Blob
styles/
  globals.css      -> tema liquid glass biru, responsif
index.html         -> versi statis satu-file (tanpa Next.js), penyimpanan pakai IndexedDB browser
```
