const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.platformSetting.findUnique({ where: { key: "AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE" } });
  const defaultCashbackPct = settings ? parseInt(settings.value) : 30;

  const res = await prisma.discountCode.updateMany({
    where: { 
      type: 'CASHBACK',
      cashbackAmount: 400000 
    },
    data: {
      cashbackAmount: 0,
      percentage: defaultCashbackPct
    }
  });
  console.log(`Updated ${res.count} discount codes.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
