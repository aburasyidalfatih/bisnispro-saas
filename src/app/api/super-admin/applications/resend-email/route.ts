import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendApplicationNotification } from "@/lib/services/application";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });

    const app = await db.tenantApplication.findUnique({ where: { id } });
    if (!app) return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    if (app.status !== "APPROVED") return NextResponse.json({ error: "Hanya bisa kirim ulang untuk status APPROVED" }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: app.adminEmail.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "User admin belum dibuat" }, { status: 404 });

    // Generate new temporary password
    const tempPassword = crypto.randomBytes(8).toString("base64url");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Temporarily save temp password in adminMessage so notification service can use it
    await db.tenantApplication.update({
      where: { id },
      data: { adminMessage: `temp_pwd:${tempPassword}` }
    });

    // Send notification in background
    sendApplicationNotification(id).then(async () => {
      // Clear temp password after sending
      await db.tenantApplication.update({
        where: { id },
        data: { adminMessage: null }
      }).catch(e => logger.error("Failed to clear temp password after resend", e));
    }).catch(e => logger.error("Async notification resend failed", e));

    return NextResponse.json({ message: "Email notifikasi sedang dikirim ulang." });
  } catch (error) {
    logger.error("Resend application email failed", error);
    return NextResponse.json({ error: "Gagal mengirim ulang email" }, { status: 500 });
  }
}
