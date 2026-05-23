// api/go.js — dipanggil saat user klik tombol WhatsApp.
// Mencatat klik lalu redirect (302) ke api.whatsapp.com.
// Bisa berfungsi sebagai "roulette": server memilih nomor bergiliran (round-robin)
// supaya pembagian klik ke 2 nomor merata, sekaligus tercatat per nomor.
import { redis, todayJakarta, sanitize } from "./_lib.js";

// Daftar nomor tujuan. Tambah/ubah di sini kalau ganti nomor.
const NUMBERS = [
  "62817103303",
  "6281296235758",
];

// Pesan otomatis yang sudah terisi di kolom chat WhatsApp.
// Ubah teks ini sesuai kebutuhan. Bisa juga di-override per-iklan
// dengan menambahkan parameter &text=... di URL landing.
const DEFAULT_MESSAGE = "Halo, saya tertarik dan ingin tahu lebih lanjut.";

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    const day = todayJakarta();
    const source = sanitize(q.utm_source, "direct");
    const campaign = sanitize(q.utm_campaign, "none");
    const ttclid = sanitize(q.ttclid, "none");

    // Tentukan nomor tujuan:
    // - jika ?n=0 / ?n=1 dikirim dari tombol, hormati pilihan itu (tombol manual).
    // - jika tidak, lakukan round-robin di server (roulette) agar merata.
    let idx;
    if (q.n !== undefined && !Number.isNaN(parseInt(q.n, 10))) {
      idx = parseInt(q.n, 10) % NUMBERS.length;
    } else {
      const counter = await redis.incr("roulette:counter");
      idx = (counter - 1) % NUMBERS.length;
    }
    const phone = NUMBERS[idx];

    const p = redis.multi();
    p.incr("stat:clicks:total");
    p.hincrby("stat:clicks:byday", day, 1);
    p.hincrby("stat:clicks:bynumber", phone, 1);
    p.hincrby("stat:clicks:bysource", source, 1);
    p.hincrby("stat:clicks:bycampaign", campaign, 1);
    // klik per nomor per hari (untuk grafik)
    p.hincrby(`stat:clicks:byday:${phone}`, day, 1);
    if (ttclid !== "none") p.sadd("set:ttclid_clicked", ttclid);
    await p.exec();

    // Pesan terisi otomatis: pakai ?text= dari URL kalau ada, jika tidak pakai default.
    const msg = (typeof q.text === "string" && q.text.trim()) ? q.text : DEFAULT_MESSAGE;
    const target =
      `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    res.writeHead(302, { Location: target });
    return res.end();
  } catch (e) {
    // kalau tracking gagal, tetap redirect supaya user tidak nyangkut
    const fallback = `https://api.whatsapp.com/send?phone=${NUMBERS[0]}`;
    res.writeHead(302, { Location: fallback });
    return res.end();
  }
}
