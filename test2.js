const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const popup = await prisma.popup.findFirst({
      where: { tenantId: "cmomv6fxu0005ge5vli8g62f1", isActive: true },
    });
    console.log("Success! popup:", popup);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
