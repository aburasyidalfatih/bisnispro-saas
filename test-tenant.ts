import { getTenantsForSuperAdmin } from "./src/features/super-admin/services/super-admin.service"

async function run() {
  try {
    const res = await getTenantsForSuperAdmin({
      page: 1, limit: 10, search: "", sort: "createdAt", order: "desc"
    })
    console.log(JSON.stringify(res, null, 2))
  } catch (e: any) {
    console.error("ERROR:")
    console.error(e.message)
    console.error(e.stack)
  }
}
run()
