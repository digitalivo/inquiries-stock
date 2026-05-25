# WA Single Redirect Tracker — TikTok → WhatsApp

Landing page + tracking klik dari iklan TikTok ke satu nomor WhatsApp, lengkap dengan dashboard statistik.
Dibuat untuk Vercel serverless + Upstash Redis.

## Nomor tujuan final

Semua klik WhatsApp diarahkan ke:

```txt
https://api.whatsapp.com/send?phone=62811368348
```

Tidak ada roulette / round-robin lagi.

## Yang dilacak

- **Visit**: setiap kali landing page dibuka dari TikTok, termasuk `utm_source`, `utm_campaign`, `utm_id`, `utm_medium`, dan `ttclid`.
- **Klik WA**: setiap kali tombol WhatsApp diklik, lalu user diarahkan ke nomor tujuan.
- **Per hari**, **per campaign/source**, **conversion rate** klik ÷ visit, dan **ttclid unik**.

## Struktur

```txt
api/
  _lib.js          koneksi Redis + util
  track-visit.js   POST → catat kunjungan
  go.js            GET  → catat klik + redirect ke WA 62811368348
  stats.js         GET  → data dashboard, bisa diproteksi password
public/
  index.html       landing page
  dashboard.html   dashboard statistik
vercel.json        routing /dashboard
```

## Environment Variables di Vercel

```txt
DASHBOARD_PASSWORD=isi_password_dashboard
WHATSAPP_PHONE=62811368348
DEFAULT_WA_MESSAGE=Salam, saya ingin mengetahui dengan lebih lanjut mengenai koleksi kebaya Letter of Her. Mohon pencerahan, terima kasih.
```

Setelah Upstash Redis/KV terhubung dari Vercel Marketplace, env berikut akan tersedia otomatis:

```txt
KV_REST_API_URL
KV_REST_API_TOKEN
```

Setup juga mendukung nama env langsung dari Upstash:

```txt
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## URL TikTok Ads

Ganti domain dengan domain Vercel atau custom domain Anda.

```txt
https://nama-proyek.vercel.app/?utm_source=tiktok&utm_id=__CAMPAIGN_ID__&utm_campaign=__CAMPAIGN_NAME__&utm_medium=paid&ttclid=__CLICK_ID__
```

Dashboard:

```txt
https://nama-proyek.vercel.app/dashboard
```

Jika `DASHBOARD_PASSWORD` diisi, dashboard akan meminta password.

## Deploy

```bash
npm install
vercel
vercel --prod
```

Atau import repo ini langsung dari Vercel Dashboard.

## Catatan

Dashboard menghitung kunjungan landing dan klik tombol WhatsApp. Sistem ini belum bisa memastikan user benar-benar mengirim chat di WhatsApp. Untuk tracking chat terkirim, gunakan WhatsApp Business API, CRM, atau kode unik pada pesan.
