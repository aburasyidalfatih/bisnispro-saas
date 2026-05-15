const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const db = prisma.$extends({
  query: {
    $allModels: {
      async count({ args, query }) {
        console.log("ARGS is:", args);
        return query(args || {});
      }
    }
  }
});

async function main() {
  try {
    await db.subject.count();
  } catch(e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
