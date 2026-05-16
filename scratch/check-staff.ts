import { db } from "../src/lib/db";
import { getRedisClient } from "../src/lib/redis";

async function run() {
  const tenants = await db.tenant.findMany({
    select: { slug: true, staff: true, settings: true }
  });
  
  for (const tenant of tenants) {
    if (tenant.staff.length > 0) {
      console.log("Checking DB for slug:", tenant.slug);
      console.log("DB Staff:");
      tenant.staff.forEach((s: any) => console.log(`- ${s.name} (${s.role}) - Image: ${s.imageUrl ? "YES" : "NO"}`));
      console.log("Settings PrincipalName:", (tenant.settings as any)?.principalName);

      console.log("\nChecking Redis:");
      const redis = await getRedisClient();
      const cachedStr = await redis.get(`smp:tenant:public:${tenant.slug}`);
      if (cachedStr) {
        const cached = typeof cachedStr === 'string' ? JSON.parse(cachedStr as string) : cachedStr;
        console.log("Redis Staff:");
        cached.staff.forEach((s: any) => console.log(`- ${s.name} (${s.role}) - Image: ${s.imageUrl ? "YES" : "NO"}`));
      } else {
        console.log("No Redis Cache");
      }
      console.log("-------------------");
    }
  }
}
run().catch(console.error).finally(() => process.exit(0));
