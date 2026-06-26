import { PrismaClient } from "@prisma/client";

const db = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        console.log(`Intercepted model: "${model}", operation: "${operation}"`);
        return [];
      }
    }
  }
}) as unknown as PrismaClient;

async function main() {
  await db.staffPermit.findMany({ where: {} });
}

main().catch(console.error);
