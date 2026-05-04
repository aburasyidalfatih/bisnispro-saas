const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
    include: {
      users: {
        include: { user: true }
      }
    }
  });

  if (!tenant) {
    console.log("Tenant demo not found!");
    return;
  }

  console.log("Tenant found:", tenant.name, "Active:", tenant.isActive);
  
  for (const tu of tenant.users) {
    console.log(`User: ${tu.user.email} | Role: ${tu.role} | Active: ${tu.user.isActive}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
