// api/stats.js — mengembalikan semua data untuk dashboard (JSON).
// Diproteksi password sederhana via header / query token = env DASHBOARD_PASSWORD.
import { redis, todayJakarta } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const required = process.env.DASHBOARD_PASSWORD;
  if (required) {
    const given = (req.query && req.query.pw) || req.headers["x-dashboard-pw"];
    if (given !== required) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }

  try {
    const [
      visitsTotal,
      clicksTotal,
      visitsByDay,
      clicksByDay,
      clicksByNumber,
      visitsBySource,
      clicksBySource,
      visitsByCampaign,
      clicksByCampaign,
      ttclidVisited,
      ttclidClicked,
    ] = await Promise.all([
      redis.get("stat:visits:total"),
      redis.get("stat:clicks:total"),
      redis.hgetall("stat:visits:byday"),
      redis.hgetall("stat:clicks:byday"),
      redis.hgetall("stat:clicks:bynumber"),
      redis.hgetall("stat:visits:bysource"),
      redis.hgetall("stat:clicks:bysource"),
      redis.hgetall("stat:visits:bycampaign"),
      redis.hgetall("stat:clicks:bycampaign"),
      redis.scard("set:ttclid"),
      redis.scard("set:ttclid_clicked"),
    ]);

    const v = Number(visitsTotal || 0);
    const c = Number(clicksTotal || 0);
    const ctr = v > 0 ? (c / v) * 100 : 0;

    return res.status(200).json({
      ok: true,
      today: todayJakarta(),
      totals: {
        visits: v,
        clicks: c,
        ctr: Number(ctr.toFixed(2)),
        uniqueTtclidVisited: Number(ttclidVisited || 0),
        uniqueTtclidClicked: Number(ttclidClicked || 0),
      },
      visitsByDay: visitsByDay || {},
      clicksByDay: clicksByDay || {},
      clicksByNumber: clicksByNumber || {},
      visitsBySource: visitsBySource || {},
      clicksBySource: clicksBySource || {},
      visitsByCampaign: visitsByCampaign || {},
      clicksByCampaign: clicksByCampaign || {},
    });
  } catch (e) {
    return res.status(500).json({ error: "stats failed", detail: String(e) });
  }
}
