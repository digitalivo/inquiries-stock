# WA Roulette Tracker — TikTok → WhatsApp

Landing page + tracking klik dari iklan TikTok ke WhatsApp (2 nomor, sistem "roulette"
round-robin agar pembagian merata), lengkap dengan dashboard statistik.
Dibuat untuk Vercel (serverless) + Upstash Redis.

## Yang dilacak
- **Visit**: setiap kali landing page dibuka dari TikTok (beserta `utm_source`, `utm_campaign`, `ttclid`).
- **Klik WA**: setiap kali tombol "Chat via WhatsApp" diklik → dicatat lalu redirect ke `api.whatsapp.com`.
- **Per nomor**: berapa klik masuk ke `62817103303` vs `6281296235758`.
- **Per campaign / source**, **per hari**, **conversion rate** (klik ÷ visit),
  dan **ttclid unik** (perkiraan klik unik dari TikTok).

## Struktur
```
api/
  _lib.js         koneksi Redis + util
  track-visit.js  POST  → catat kunjungan
  go.js           GET   → catat klik + roulette + redirect ke WA
  stats.js        GET   → data untuk dashboard (diproteksi password)
public/
  index.html      landing page (dibuka dari TikTok)
  dashboard.html  dashboard statistik
vercel.json       routing (/dashboard)
```

---

## CARA DEPLOY (langkah demi langkah)

### 1. Upload ke GitHub (atau pakai Vercel CLI)
- Buat repo baru di GitHub, upload semua file folder ini.
  (Atau dari komputer: `npm i -g vercel` lalu `vercel` di dalam folder ini.)

### 2. Import ke Vercel
- Buka https://vercel.com → **Add New → Project** → pilih repo Anda → **Deploy**.
- Tunggu sampai dapat URL seperti `https://nama-proyek.vercel.app`.

### 3. Tambah database Upstash Redis (gratis)
- Di project Vercel → tab **Storage** → **Create Database** → pilih **Upstash → Redis**.
- Ikuti wizard. Vercel otomatis menambahkan env var:
  `KV_REST_API_URL` dan `KV_REST_API_TOKEN` ke project Anda.

### 4. Set password dashboard
- Project Vercel → **Settings → Environment Variables** → tambah:
  - Name: `DASHBOARD_PASSWORD`  Value: (password pilihan Anda)
  - (Kosongkan/ jangan set kalau ingin dashboard tanpa password.)

### 5. Redeploy
- Tab **Deployments** → titik tiga deployment terakhir → **Redeploy**
  (wajib agar env var terbaca).

Setelah ini selesai, project langsung jalan di domain Vercel
(misalnya `https://nama-proyek.vercel.app`). Tidak perlu domain khusus.

---

## URL yang dipakai

Ganti `nama-proyek.vercel.app` dengan URL project Anda dari Vercel.

**Landing (dipasang di iklan TikTok)** — pakai apa adanya, parameter random tetap jalan:
```
https://nama-proyek.vercel.app/?utm_source=tiktok&utm_id=__CAMPAIGN_ID__&utm_campaign=__CAMPAIGN_NAME__&utm_medium=paid&ttclid=...
```

**Dashboard:**
```
https://nama-proyek.vercel.app/dashboard
```
(masukkan password bila di-set)

## Pesan WhatsApp otomatis
Saat user diarahkan ke WhatsApp, kolom chat sudah terisi pesan default:
"Halo, saya tertarik dan ingin tahu lebih lanjut."
- Ubah teks default di `api/go.js` (konstanta `DEFAULT_MESSAGE`).
- Atau override per-iklan: tambahkan `&text=Pesan%20Anda` di URL landing TikTok.

## Ekspor CSV
Di dashboard ada tombol **⬇ Ekspor CSV** untuk mengunduh ringkasan
(harian, per nomor, per campaign) — bisa dibuka di Excel/Google Sheets.

## Ganti / tambah nomor WhatsApp
Edit array `NUMBERS` di `api/go.js`, lalu redeploy.

## Catatan
- Roulette default = round-robin di server (bergiliran 50/50). Kalau ingin acak,
  ganti pemilihan index di `go.js` dengan `Math.floor(Math.random()*NUMBERS.length)`.
- `ttclid` unik dihitung pakai Redis Set (akurat untuk volume normal).
- Data tidak pernah hilang selama database Upstash aktif.
