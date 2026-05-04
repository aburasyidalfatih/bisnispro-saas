const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.platformSetting.deleteMany({
    where: {
      key: {
        in: ['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY']
      }
    }
  });
  console.log('Turnstile config disabled successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
