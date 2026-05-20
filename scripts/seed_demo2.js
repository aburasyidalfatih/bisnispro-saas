const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'cmoldjliw000511osn4ixzc7k';
  const dummyHash = '$2a$10$X8O.U/wSgHqA52ZqC2R3M.hX6uU8z9/hX6uU8z9/hX6uU8z9'; // dummy hash for "password123"

  // 1. Find the staff we just created
  const staff1 = await prisma.staff.findFirst({ where: { email: 'budi@demo.schoolpro.id' } });
  const staff2 = await prisma.staff.findFirst({ where: { email: 'siti@demo.schoolpro.id' } });

  if (staff1 && !staff1.userId) {
    const user1 = await prisma.user.create({
      data: {
        name: staff1.name,
        email: staff1.email,
        password: dummyHash,
      }
    });
    await prisma.staff.update({ where: { id: staff1.id }, data: { userId: user1.id } });
    await prisma.tenantUser.create({ data: { tenantId, userId: user1.id, role: 'guru' } });
    console.log('Created User for Guru 1');
  }

  if (staff2 && !staff2.userId) {
    const user2 = await prisma.user.create({
      data: {
        name: staff2.name,
        email: staff2.email,
        password: dummyHash,
      }
    });
    await prisma.staff.update({ where: { id: staff2.id }, data: { userId: user2.id } });
    await prisma.tenantUser.create({ data: { tenantId, userId: user2.id, role: 'guru' } });
    console.log('Created User for Guru 2');
  }

  // 2. Add Student users (since we created students, but no student login user)
  const student1 = await prisma.student.findFirst({ where: { name: 'Andi Pratama' } });
  const student2 = await prisma.student.findFirst({ where: { name: 'Rina Wijaya' } });

  if (student1 && !student1.userId) {
    const user1 = await prisma.user.create({
      data: {
        name: student1.name,
        email: 'andi@demo.schoolpro.id',
        password: dummyHash,
      }
    });
    await prisma.student.update({ where: { id: student1.id }, data: { userId: user1.id, email: 'andi@demo.schoolpro.id' } });
    await prisma.tenantUser.create({ data: { tenantId, userId: user1.id, role: 'siswa' } });
    console.log('Created User for Siswa 1');
  }

  if (student2 && !student2.userId) {
    const user2 = await prisma.user.create({
      data: {
        name: student2.name,
        email: 'rina@demo.schoolpro.id',
        password: dummyHash,
      }
    });
    await prisma.student.update({ where: { id: student2.id }, data: { userId: user2.id, email: 'rina@demo.schoolpro.id' } });
    await prisma.tenantUser.create({ data: { tenantId, userId: user2.id, role: 'siswa' } });
    console.log('Created User for Siswa 2');
  }

  console.log('Updated teachers and students with login accounts.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
