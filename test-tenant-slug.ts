import { db } from "./src/lib/db"

async function run() {
  const ids = ["cmqbp4iwe0dijpl0vtahs6o2q", "cmpt4citw04fzps017x5k81np", "cmptte3pl00asll012m7og3x4"]
  const tenants = await db.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
  console.log("Found:", tenants)
}
run()
