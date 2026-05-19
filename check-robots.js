const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "block_search_indexing" }
  });
  console.log("block_search_indexing:", setting);
}

main().catch(console.error).finally(() => prisma.$disconnect());
