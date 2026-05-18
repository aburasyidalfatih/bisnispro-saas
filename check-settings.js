const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.platformSetting.findMany();
  console.log("Total settings:", settings.length);
  const s3Settings = settings.filter(s => s.key.startsWith('S3_') || s.key === 'STORAGE_PROVIDER');
  console.log("S3 Settings:", s3Settings);
}
main().catch(console.error).finally(() => prisma.$disconnect());
