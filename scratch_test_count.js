const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const db = prisma.$extends({
  query: {
    $allModels: {
      async count({ args, query, model }) {
        args = args || {};
        args.where = { ...args.where, tenantId: "test-id" }
        console.log("ARGS passed to query:", args);
        return query(args);
      }
    }
  }
});

async function main() {
  try {
    const c = await db.subject.count();
    console.log("Count:", c);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
