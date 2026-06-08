import { db } from "./lib/db";

async function main() {
  const setting = await db.platformSetting.findUnique({
    where: { key: "PLAN_FEATURE_ACCESS" }
  });
  console.log("====================================");
  console.log("PLAN_FEATURE_ACCESS VALUE:");
  console.log(setting?.value);
  console.log("====================================");
}

main().catch(console.error);
