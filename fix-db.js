const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE attendance_records SET "academicYear" = '2025/2026' WHERE "academicYear" IS NULL`);
  console.log("Fixed attendance_records null values");
}

main().catch(console.error).finally(() => prisma.$disconnect());
