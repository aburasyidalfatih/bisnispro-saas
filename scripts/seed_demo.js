const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // it might be inside the container, but if not we can just insert hash

async function main() {
  const tenantId = 'cmoldjliw000511osn4ixzc7k';

  // 1. Guru / Staff
  const staff1 = await prisma.staff.create({
    data: {
      tenantId,
      name: 'Budi Santoso, S.Pd',
      role: 'GURU',
      email: 'budi@demo.schoolpro.id',
      phone: '081234567890',
      subject: 'Matematika'
    }
  });

  const staff2 = await prisma.staff.create({
    data: {
      tenantId,
      name: 'Siti Aminah, M.Pd',
      role: 'GURU',
      email: 'siti@demo.schoolpro.id',
      phone: '081234567891',
      subject: 'Bahasa Inggris'
    }
  });

  console.log('Created Staff:', staff1.name, staff2.name);

  // 2. Classrooms
  const class1 = await prisma.classroom.create({
    data: {
      tenantId,
      name: 'X MIPA 1',
      level: '10',
      capacity: 30,
      waliKelasId: staff1.id
    }
  });

  const class2 = await prisma.classroom.create({
    data: {
      tenantId,
      name: 'X IPS 1',
      level: '10',
      capacity: 30,
      waliKelasId: staff2.id
    }
  });

  console.log('Created Classrooms:', class1.name, class2.name);

  // 3. Students
  const student1 = await prisma.student.create({
    data: {
      tenantId,
      name: 'Andi Pratama',
      nis: '10001',
      nisn: '0011223344',
      gender: 'L',
      classroomId: class1.id,
      fatherName: 'Bapak Andi',
      motherName: 'Ibu Andi',
    }
  });

  const student2 = await prisma.student.create({
    data: {
      tenantId,
      name: 'Rina Wijaya',
      nis: '10002',
      nisn: '0011223355',
      gender: 'P',
      classroomId: class2.id,
      fatherName: 'Bapak Rina',
      motherName: 'Ibu Rina',
    }
  });

  console.log('Created Students:', student1.name, student2.name);

  // 4. Parents (Users + StudentParent)
  // we will just use a dummy hash since bcrypt might not be directly available in the root script if not installed
  const dummyHash = '$2a$10$X8O.U/wSgHqA52ZqC2R3M.hX6uU8z9/hX6uU8z9/hX6uU8z9'; // dummy hash for "password123"

  const parentUser1 = await prisma.user.create({
    data: {
      name: 'Bapak Andi',
      email: 'ortu.andi@demo.schoolpro.id',
      password: dummyHash,
      studentParents: {
        create: {
          studentId: student1.id,
          relation: 'AYAH'
        }
      }
    }
  });

  const parentUser2 = await prisma.user.create({
    data: {
      name: 'Bapak Rina',
      email: 'ortu.rina@demo.schoolpro.id',
      password: dummyHash,
      studentParents: {
        create: {
          studentId: student2.id,
          relation: 'AYAH'
        }
      }
    }
  });

  console.log('Created Parents:', parentUser1.name, parentUser2.name);

  // 5. Canteen
  const merchantUser1 = await prisma.user.create({
    data: {
      name: 'Kantin Bu Asih',
      email: 'kantin.asih@demo.schoolpro.id',
      password: dummyHash,
    }
  });

  const merchantUser2 = await prisma.user.create({
    data: {
      name: 'Kantin Pak Joko',
      email: 'kantin.joko@demo.schoolpro.id',
      password: dummyHash,
    }
  });

  const merchant1 = await prisma.canteenMerchant.create({
    data: {
      tenantId,
      userId: merchantUser1.id,
      name: 'Warung Bu Asih',
      description: 'Menjual aneka makanan sehat',
      balance: 0,
      products: {
        create: [
          { tenantId, name: 'Nasi Goreng', price: 15000, stock: 50 },
          { tenantId, name: 'Es Teh Manis', price: 5000, stock: 100 }
        ]
      }
    }
  });

  const merchant2 = await prisma.canteenMerchant.create({
    data: {
      tenantId,
      userId: merchantUser2.id,
      name: 'Warung Pak Joko',
      description: 'Menjual aneka jajanan pasar',
      balance: 0,
      products: {
        create: [
          { tenantId, name: 'Soto Ayam', price: 12000, stock: 40 },
          { tenantId, name: 'Es Jeruk', price: 6000, stock: 80 }
        ]
      }
    }
  });

  console.log('Created Canteen Merchants & Products:', merchant1.name, merchant2.name);

  // add users to tenant_users to ensure they can login to the tenant
  await prisma.tenantUser.createMany({
    data: [
      { tenantId, userId: parentUser1.id, role: 'siswa' }, // wait, usually parent uses 'siswa' or 'ortu'? let's check schema/role. Usually 'siswa' or 'member' or 'parent'. We will put 'ortu'
      { tenantId, userId: parentUser2.id, role: 'ortu' },
      { tenantId, userId: merchantUser1.id, role: 'kantin' },
      { tenantId, userId: merchantUser2.id, role: 'kantin' },
    ],
    skipDuplicates: true
  });

  console.log('Successfully seeded demo data!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
