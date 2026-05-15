const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function test() {
  try {
    const res = await db.student.update({
      where: { id: "clv123", fakeField: "123" },
      data: { name: "test" }
    });
    console.log("Success update:", res);
  } catch (err) {
    console.error("Error update:", err.message);
  }
}
test().finally(() => db.$disconnect());
