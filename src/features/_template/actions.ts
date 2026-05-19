"use server";

import { createSampleSchema } from "./schemas/sample.schema";
import { createSampleRecord } from "./services/sample.service";
import { revalidatePath } from "next/cache";

export async function submitSampleAction(tenantId: string, formData: FormData) {
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
  };

  const parsed = createSampleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await createSampleRecord(tenantId, parsed.data);
    revalidatePath("/admin/sample-page");
    return { success: true, result };
  } catch (error) {
    return { error: "Terjadi kesalahan sistem." };
  }
}
