import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendWhatsApp } from "@/features/notification/services/notification.service";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-internal-secret");
    if (authHeader !== INTERNAL_SECRET && INTERNAL_SECRET !== "") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { ipAddress, path, payload, attackType, userAgent, tenantId } = body;

    // 1. Catat ke Database
    await db.securityLog.create({
      data: {
        ipAddress: ipAddress || "Unknown",
        path: path || "/",
        payload: payload || "",
        attackType: attackType || "UNKNOWN",
        severity: "CRITICAL",
        userAgent: userAgent || "",
        tenantId: tenantId || null,
      },
    });

    // 2. OTOMATIS BLOKIR IP (WAF Auto-Ban)
    if (ipAddress && ipAddress !== "Unknown" && ipAddress !== "127.0.0.1" && !ipAddress.startsWith("::1")) {
      await db.bannedIp.upsert({
        where: { ipAddress },
        update: { reason: `Auto-banned oleh WAF karena serangan ${attackType}` },
        create: { ipAddress, reason: `Auto-banned oleh WAF karena serangan ${attackType}` },
      });

      // Simpan ke Edge Redis untuk pemblokiran instan
      const { Redis } = await import("@upstash/redis");
      const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
      if (redis) {
        await redis.set(`banned_ip:${ipAddress}`, "true");
      }
    }

    logger.warn(`[WAF] Blocked and Banned ${attackType} from ${ipAddress} on ${path}`);

    // 2. Notifikasi ke Super Admin (Ambil dari PlatformSettings)
    const platformSettings = await db.platformSetting.findMany({
      where: { key: { in: ["SUPPORT_WA_NUMBERS"] } },
    });
    
    const waNumbersSetting = platformSettings.find(s => s.key === "SUPPORT_WA_NUMBERS");
    if (waNumbersSetting && waNumbersSetting.value) {
      const numbers = waNumbersSetting.value.split(",").map(n => n.trim()).filter(n => n);
      
      const message = `🚨 *SECURITY ALERT - BISNISPRO WAF* 🚨\n\n` +
        `Terdeteksi serangan siber ke sistem:\n` +
        `- *Jenis*: ${attackType}\n` +
        `- *IP*: ${ipAddress}\n` +
        `- *Path*: ${path}\n` +
        `- *Payload*: ${payload?.substring(0, 100)}\n\n` +
        `Sistem telah memblokir *request* ini.`;

      for (const num of numbers) {
         // Kirim tanpa tenant ID agar menggunakan WA Gateway Platform (Super Admin)
         await sendWhatsApp(num, message, null).catch(e => {
           logger.error(`Failed to send WAF alert WA to ${num}`, e);
         });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in security-alert endpoint", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
