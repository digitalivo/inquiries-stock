// api/_lib.js — helper bersama untuk semua serverless function
import { Redis } from "@upstash/redis";

// Integrasi Upstash via Vercel Marketplace menyuntikkan KV_REST_API_URL & KV_REST_API_TOKEN.
// Sebagian setup Upstash langsung memakai UPSTASH_REDIS_REST_URL/TOKEN.
// Kita dukung keduanya agar aman.
const REDIS_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

// Tanggal format YYY-MM-DD dalam zona Asia/Jakarta (WIB) untuk bucket harian
export function todayJakarta() {
  const now = new Date();
  // konversi ke WIB (UTC+7)
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Bersihkan string supaya aman jadi bagian key Redis (hindari spasi/karakter aneh)
export function sanitize(v, fallback = "unknown") {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  if (!s || s === "__CAMPAIGN_ID__" || s === "__CAMPAIGN_NAME__") return fallback;
  // batasi panjang & ganti karakter pemisah key
  return s.replace(/[:\s]+/g, "_").slice(0, 120);
}

// Ambil IP klien (untuk perkiraan unik kasar, opsional)
export function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.headers["x-real-ip"] || "0.0.0.0";
}
