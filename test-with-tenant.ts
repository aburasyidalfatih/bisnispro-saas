import { withTenant } from "./src/lib/db"

async function run() {
  try {
    const tenantDb = withTenant("cmqmhqndw000lqk0u1pv4c1oj") // maspersis12jakut tenant ID
    const res = await tenantDb.websiteMenu.findMany({
      where: { parentId: null, isActive: true },
    })
    console.log("Success:", res.length)
  } catch (error) {
    console.error("Error:", error)
  }
}
run()
