// api/track-visit.js — dipanggil saat landing page dibuka (visit dari TikTok)
import { redis, todayJakarta, sanitize, clientIp } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const source = sanitize(body.utm_source, "direct");
    const campaign = sanitize(body.utm_campaign, "none");
    const campaignId = sanitize(body.utm_id, "none");
    const medium = sanitize(body.utm_medium, "none");
    const ttclid = sanitize(body.ttclid, "none");
    const day = todayJakarta();
    const ip = clientIp(req);

    const p = redis.multi();
    // total visit keseluruhan
    p.incr("stat:visits:total");
    // visit per hari
    p.hincrby("stat:visits:byday", day, 1);
    // visit per source
    p.hincrby("stat:visits:bysource", source, 1);
    // visit per campaign
    p.hincrby("stat:visits:bycampaign", campaign, 1);
    // visit per campaign id
    p.hincrby("stat:visits:bycampaignid", campaignId, 1);
    // simpan ttclid unik (set) — supaya bisa hitung perkiraan klik unik dari tiktok
    if (ttclid !== "none") p.sadd("set:ttclid", ttclid);
    // perkiraan pengunjung unik per hari berdasarkan IP (kasar)
    p.pfadd(`hll:visitors:${day}`, ip);
    await p.exec();

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "track-visit failed", detail: String(e) });
  }
}
