const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating TenantUser roles...');
  const tuResult = await prisma.tenantUser.updateMany({
    where: { role: 'member' },
    data: { role: 'orangtua' },
  });
  console.log(`Updated ${tuResult.count} TenantUsers.`);

  console.log('Updating Invitation roles...');
  const inviteResult = await prisma.invitation.updateMany({
    where: { role: 'member' },
    data: { role: 'orangtua' },
  });
  console.log(`Updated ${inviteResult.count} Invitations.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
