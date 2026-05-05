import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * Ensures the currently authenticated user has access to the specified tenant.
 * SuperAdmins bypass this check automatically.
 * 
 * @param tenantId - The ID of the tenant to check against
 * @param allowedRoles - The roles permitted to perform the action
 * @returns The user session object if authorized
 * @throws Error if unauthorized or forbidden
 */
export async function requireTenantAccess(
  tenantId: string, 
  allowedRoles = ["owner", "admin", "operator"]
) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  if (session.user.isSuperAdmin) {
    return session.user
  }

  const tu = await db.tenantUser.findUnique({
    where: { 
      tenantId_userId: { 
        tenantId, 
        userId: session.user.id 
      } 
    },
  })
  
  if (!tu || !allowedRoles.includes(tu.role)) {
    throw new Error("Forbidden: Insufficient privileges for this tenant")
  }
  
  return session.user
}
