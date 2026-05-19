import { db } from "@/lib/db";
import { CreateSampleInput } from "../validations";

export async function createSampleRecord(tenantId: string, data: CreateSampleInput) {
  // Logic database khusus untuk fitur ini (diisolasi)
  // return await db.sample.create({ data: { ...data, tenantId } })
  return { success: true, data };
}
