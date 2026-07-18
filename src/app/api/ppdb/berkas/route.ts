import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET: Ambil berkas yang sudah diupload oleh pendaftar
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pendaftarId = searchParams.get("pendaftarId");

    if (!pendaftarId) {
      return NextResponse.json({ error: "pendaftarId required" }, { status: 400 });
    }

    const pendaftar = await db.pendaftarPpdb.findUnique({ where: { id: pendaftarId } });
    if (!pendaftar || pendaftar.userId !== session.user.id) {
      // For simplicity, we just enforce that the logged-in user is the owner
      return NextResponse.json({ error: "Unauthorized access to pendaftar data" }, { status: 403 });
    }

    const berkas = await db.berkasPpdb.findMany({
      where: { pendaftarId },
      include: { requirement: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(berkas);
  } catch (error) {
    logger.error("GET Berkas Error", error, { path: "/api/ppdb/berkas" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Upload/simpan berkas baru
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }
    const { pendaftarId, requirementId, fileUrl } = body;

    if (!pendaftarId || !requirementId || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pendaftar = await db.pendaftarPpdb.findUnique({ where: { id: pendaftarId } });
    if (!pendaftar || pendaftar.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to pendaftar data" }, { status: 403 });
    }

    // Upsert: update jika sudah ada, insert jika belum
    const existing = await db.berkasPpdb.findFirst({
      where: { pendaftarId, requirementId },
    });

    let berkas;
    if (existing) {
      berkas = await db.berkasPpdb.update({
        where: { id: existing.id },
        data: { fileUrl, status: "MENUNGGU" }, // reset status saat file diperbarui
      });
    } else {
      berkas = await db.berkasPpdb.create({
        data: { pendaftarId, requirementId, fileUrl, status: "MENUNGGU" },
      });
    }

    return NextResponse.json(berkas);
  } catch (error) {
    logger.error("POST Berkas Error", error, { path: "/api/ppdb/berkas" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Hapus berkas
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const existingBerkas = await db.berkasPpdb.findUnique({
      where: { id },
      include: { pendaftar: true }
    });

    if (!existingBerkas || existingBerkas.pendaftar.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 });
    }

    await db.berkasPpdb.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("DELETE Berkas Error", error, { path: "/api/ppdb/berkas" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
