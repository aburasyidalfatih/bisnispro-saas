"use server";

import { db } from "@/lib/db";
import { generateRegistrationNumber } from "../lib/ppdb-identifiers";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function submitRegistration(formData: {
  tenantId: string;
  userId: string;
  periodeId: string;
  namaLengkap: string;
  nominalPendaftaran: number;
}) {
  try {
    const { tenantId, userId, periodeId, namaLengkap, nominalPendaftaran } = formData;

    // 1. Generate registration number
    const noPendaftaran = await generateRegistrationNumber(tenantId);

    // 2. Create Pendaftar and Tagihan in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create pendaftar
      const pendaftar = await tx.pendaftarPpdb.create({
        data: {
          tenantId,
          userId,
          periodeId,
          noPendaftaran,
          namaLengkap,
          status: "MENUNGGU",
        },
      });

      // Create initial tagihan for registration
      const tagihan = await tx.tagihanPpdb.create({
        data: {
          pendaftarId: pendaftar.id,
          jenis: "PENDAFTARAN",
          nominal: nominalPendaftaran,
          status: "BELUM_LUNAS",
        },
      });

      return { pendaftar, tagihan };
    });

    revalidatePath("/admin/ppdb");
    return { success: true, data: result };
  } catch (error) {
    logger.error("PPDB Registration Error", error, { action: "submitRegistration" });
    return { success: false, error: "Gagal mendaftar. Silakan coba lagi." };
  }
}

export async function confirmPayment(data: {
  tagihanId: string;
  nominal: number;
  buktiUrl: string;
}) {
  try {
    const { tagihanId, nominal, buktiUrl } = data;

    const pembayaran = await db.pembayaranPpdb.create({
      data: {
        tagihanId,
        nominal,
        buktiUrl,
        status: "PENDING",
        paidAt: new Date(),
      },
    });

    revalidatePath("/admin/ppdb");
    return { success: true, data: pembayaran };
  } catch (error) {
    logger.error("PPDB Payment Error", error, { action: "confirmPayment" });
    return { success: false, error: "Gagal mengirim pembayaran. Silakan coba lagi." };
  }
}
