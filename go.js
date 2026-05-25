// api/go.js — dipanggil saat user klik tombol WhatsApp.
// Mencatat klik lalu redirect (302) ke satu nomor WhatsApp tujuan.
import { redis, todayJakarta, sanitize } from "./_lib.js";

// Nomor tujuan final. Tidak ada roulette / round-robin lagi.
const WHATSAPP_PHONE = process.env.WHATSAPP_PHONE || "62811368348";

// Pesan otomatis yang sudah terisi di kolom chat WhatsApp.
// Bisa di-override per iklan dengan menambahkan parameter &text=... di URL landing.
const DEFAULT_MESSAGE = process.env.DEFAULT_WA_MESSAGE ||
  "Salam, saya ingin mengetahui dengan lebih lanjut mengenai koleksi kebaya Letter of Her. Mohon pencerahan, terima kasih.";

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    const day = todayJakarta();
    const source = sanitize(q.utm_source, "direct");
    const campaign = sanitize(q.utm_campaign, "none");
    const campaignId = sanitize(q.utm_id, "none");
    const medium = sanitize(q.utm_medium, "none");
    const ttclid = sanitize(q.ttclid, "none");
    const phone = WHATSAPP_PHONE;

    const p = redis.multi();
    p.incr("stat:clicks:total");
    p.hincrby("stat:clicks:byday", day, 1);
    p.hincrby("stat:clicks:bynumber", phone, 1);
    p.hincrby("stat:clicks:bysource", source, 1);
    p.hincrby("stat:clicks:bycampaign", campaign, 1);
    p.hincrby("stat:clicks:bycampaignid", campaignId, 1);
    p.hincrby("stat:clicks:bymedium", medium, 1);
    p.hincrby(`stat:clicks:byday:${phone}`, day, 1);
    if (ttclid !== "none") p.sadd("set:ttclid_clicked", ttclid);
    await p.exec();

    const msg = (typeof q.text === "string" && q.text.trim()) ? q.text : DEFAULT_MESSAGE;
    const target = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    res.writeHead(302, { Location: target });
    return res.end();
  } catch (e) {
    // Jika tracking gagal, user tetap diarahkan ke nomor tujuan utama.
    const fallback = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}`;
    res.writeHead(302, { Location: fallback });
    return res.end();
  }
}
