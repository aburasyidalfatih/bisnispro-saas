import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        author: { select: { name: true } },
        _count: { select: { modules: true, enrollments: true } },
        enrollments: { where: { userId: '123' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Query 1 OK');

    await prisma.course.findUnique({
      where: { slug: 'test' },
      include: {
        author: { select: { name: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, title: true, duration: true, isPreview: true }
            }
          }
        },
        enrollments: { where: { userId: '123' } }
      }
    });
    console.log('Query 2 OK');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
