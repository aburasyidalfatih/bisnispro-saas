export enum PlanType {
  FREE = "free",
  LITE = "lite",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

const PLAN_LEVEL: Record<string, number> = {
  [PlanType.FREE]: 0,
  [PlanType.LITE]: 1,
  [PlanType.PRO]: 2,
  [PlanType.ENTERPRISE]: 3,
};

export const FEATURE_REQUIREMENTS = {
  TEACHER_JOURNAL: PlanType.LITE,
  STUDENT_ATTENDANCE: PlanType.PRO,
  // Tambahkan fitur lainnya di sini
};

/**
 * Memeriksa apakah sebuah plan memiliki level yang cukup untuk mengakses fitur
 * @param tenantPlan String nama plan dari database tenant (contoh: 'free', 'PRO')
 * @param requiredPlan Plan minimum yang dibutuhkan
 */
export function hasFeature(tenantPlan: string | null | undefined, requiredPlan: PlanType): boolean {
  const currentPlan = (tenantPlan || "free").toLowerCase();
  const currentLevel = PLAN_LEVEL[currentPlan] ?? 0;
  const requiredLevel = PLAN_LEVEL[requiredPlan];
  
  return currentLevel >= requiredLevel;
}
