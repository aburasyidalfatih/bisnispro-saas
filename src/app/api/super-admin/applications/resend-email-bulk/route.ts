import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendApplicationNotification } from "@/features/tenant/services/application.service";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });
    }

    const apps = await db.tenantApplication.findMany({ 
      where: { 
        id: { in: ids },
        status: "APPROVED" 
      } 
    });

    if (apps.length === 0) {
      return NextResponse.json({ error: "Tidak ada pengajuan valid (harus APPROVED) untuk dikirim ulang" }, { status: 400 });
    }

    let successCount = 0;

    for (const app of apps) {
      const user = await db.user.findUnique({ where: { email: app.adminEmail.toLowerCase() } });
      if (!user) continue;

      if (!app.hashedPassword) {
        const tempPassword = crypto.randomBytes(8).toString("base64url");
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
      }

      // Send in background
      sendApplicationNotification(app.id).catch(e => logger.error("Async bulk notification resend failed", e));
      
      successCount++;
    }

    return NextResponse.json({ message: `Email notifikasi sedang dikirim ulang ke ${successCount} pengajuan.` });
  } catch (error) {
    logger.error("Bulk resend application email failed", error);
    return NextResponse.json({ error: "Gagal mengirim ulang email masal" }, { status: 500 });
  }
}
