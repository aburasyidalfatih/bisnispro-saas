import { db } from "./src/lib/db"

async function run() {
  const count = await db.tenantScore.count()
  console.log("Total TenantScores:", count)
  
  const allScores = await db.tenantScore.findMany({
    orderBy: { totalScore: "desc" },
    take: 10,
    include: { tenant: { select: { name: true } } }
  })
  allScores.forEach(s => console.log(s.tenant?.name, s.totalScore))
}
run()
