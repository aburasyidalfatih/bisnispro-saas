import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })

const db = new PrismaClient()

async function main() {
  try {
    const tenants = await db.tenant.findMany({
      include: {
        auditLogs: {
          where: {
            action: {
              contains: "login",
              mode: "insensitive"
            }
          }
        }
      }
    });

    let neverLoggedIn = 0;
    let totalSchools = tenants.length;

    for (const tenant of tenants) {
      // Periksa apakah ada audit log login
      const hasLoginLog = tenant.auditLogs.length > 0;
      
      if (!hasLoginLog) {
        neverLoggedIn++;
        console.log(`- Sekolah: ${tenant.name} (${tenant.slug}) - Belum Pernah Login`);
      }
    }

    console.log(`\n=================================`);
    console.log(`TOTAL SEKOLAH: ${totalSchools}`);
    console.log(`BELUM PERNAH LOGIN: ${neverLoggedIn}`);
    console.log(`=================================`);
  } catch (e) {
    console.error(e)
  } finally {
    await db.$disconnect()
  }
}

main()
