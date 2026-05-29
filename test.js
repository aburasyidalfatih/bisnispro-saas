const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: "demo" },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        about: true,
        heroImage: true,
        gallery: true,
        phone: true,
        whatsapp: true,
        address: true,
        email: true,
        logo: true,
        seoTitle: true,
        seoDesc: true,
        theme: true,
        template: true,
        customThemeId: true,
        customTheme: true,
        isActive: true,
        instagram: true,
        facebook: true,
        youtube: true,
        tiktok: true,
        staff: { orderBy: { sortOrder: 'asc' }, take: 100 },
        alumni: { orderBy: [{ sortOrder: 'asc' }, { graduationYear: 'desc' }], take: 15 },
        programs: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 10 },
        extracurriculars: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 15 },
        facilities: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 15 },
        achievements: { orderBy: [{ order: 'asc' }, { date: 'desc' }], take: 10 },
        websiteMenus: { 
          where: { isActive: true, parentId: null },
          orderBy: { order: 'asc' },
          include: { children: { where: { isActive: true }, orderBy: { order: 'asc' } } }
        },
        posts: { 
          where: { 
            status: "PUBLISHED",
            type: { notIn: ["PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"] }
          }, 
          orderBy: { createdAt: 'desc' }, 
          take: 20,
          include: { author: { select: { name: true, avatar: true } } }
        },
        events: { orderBy: { createdAt: 'desc' }, take: 6 },
        documents: { orderBy: { createdAt: 'desc' }, take: 10 },
        sliders: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 5 },
        partnerships: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 20 },
        settings: true,
        createdAt: true,
        _count: {
          select: {
            staff: true,
            programs: true,
            achievements: true,
          }
        }
      },
    });
    console.log("Success! Tenant name:", tenant.name);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
