import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { requireTenantMembership } from "@/lib/api-utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const applicant = await db.pendaftarPpdb.findUnique({
      where: { id },
      include: {
        periode: true,
        tagihan: {
          include: {
            pembayaran: { orderBy: { createdAt: "desc" } }
          },
          orderBy: { createdAt: "asc" }
        },
        berkas: { include: { requirement: true } },
        user: { select: { name: true, email: true, phone: true } }
      },
    });

    if (!applicant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error: tenantError } = await requireTenantMembership(applicant.tenantId);
    if (tenantError) return tenantError;

    // SELF HEALING: Jika status DITERIMA tapi belum ada tagihan DAFTAR_ULANG, buatkan otomatis
    if (applicant.status === "DITERIMA") {
      const hasDaftarUlang = applicant.tagihan.some(t => t.jenis === "DAFTAR_ULANG");
      if (!hasDaftarUlang) {
        const pengaturan = applicant.periode.pengaturan as any;
        const itemDaftarUlang: { nama: string; nominal: number }[] = pengaturan?.itemDaftarUlang ?? [];
        if (itemDaftarUlang.length > 0) {
          const totalDaftarUlang = itemDaftarUlang.reduce((sum, item) => sum + item.nominal, 0);
          await db.tagihanPpdb.create({
            data: {
              pendaftarId: id,
              jenis: "DAFTAR_ULANG",
              nominal: totalDaftarUlang,
              items: itemDaftarUlang,
              status: "BELUM_LUNAS",
            }
          });
          // Refresh applicant data after creation
          const refreshedApplicant = await db.pendaftarPpdb.findUnique({
            where: { id },
            include: {
              periode: true,
              tagihan: {
                include: { pembayaran: { orderBy: { createdAt: "desc" } } },
                orderBy: { createdAt: "asc" }
              },
              berkas: { include: { requirement: true } },
              user: { select: { name: true, email: true, phone: true } }
            },
          });
          return NextResponse.json(refreshedApplicant);
        }
      }
    }

    return NextResponse.json(applicant);
  } catch (error) {
    logger.error("GET Pendaftar Detail Error", error, { path: "/api/ppdb/pendaftar/[id]" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, dataFormulir, dataOrangtua } = body;

    const applicant = await db.pendaftarPpdb.findUnique({ where: { id } });
    if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { error: tenantError } = await requireTenantMembership(applicant.tenantId);
    if (tenantError) return tenantError;

    const result = await db.$transaction(async (tx) => {
      // Update status pendaftar
      const updated = await tx.pendaftarPpdb.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(dataFormulir && { dataFormulir }),
          ...(dataOrangtua && { dataOrangtua }),
        },
        include: { periode: true }
      });

      // Jika status diubah menjadi DITERIMA, buat tagihan daftar ulang otomatis
      if (status === "DITERIMA") {
        // Cek apakah tagihan daftar ulang sudah ada
        const existingTagihan = await tx.tagihanPpdb.findFirst({
          where: { pendaftarId: id, jenis: "DAFTAR_ULANG" }
        });

        if (!existingTagihan) {
          // Ambil item daftar ulang dari pengaturan periode
          const periode = updated.periode as any;
          const pengaturan = periode?.pengaturan as any;
          const itemDaftarUlang: { nama: string; nominal: number }[] = pengaturan?.itemDaftarUlang ?? [];

          if (itemDaftarUlang.length > 0) {
            const totalDaftarUlang = itemDaftarUlang.reduce((sum, item) => sum + item.nominal, 0);

            await tx.tagihanPpdb.create({
              data: {
                pendaftarId: id,
                jenis: "DAFTAR_ULANG",
                nominal: totalDaftarUlang,
                items: itemDaftarUlang, // breakdown item
                status: "BELUM_LUNAS",
              }
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("PATCH Pendaftar Detail Error", error, { path: "/api/ppdb/pendaftar/[id]" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Optional: check if pendaftar exists and belongs to the correct tenant
    const pendaftar = await db.pendaftarPpdb.findUnique({
      where: { id }
    });

    if (!pendaftar) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error: tenantError } = await requireTenantMembership(pendaftar.tenantId);
    if (tenantError) return tenantError;

    await db.pendaftarPpdb.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("DELETE Pendaftar Error", error, { path: "/api/ppdb/pendaftar/[id]" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
