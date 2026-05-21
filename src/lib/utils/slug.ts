import { generateSlug } from "@/lib/utils"

export async function generateUniqueSlug(
  modelDelegate: any, 
  tenantId: string, 
  baseText: string
): Promise<string> {
  let baseSlug = generateSlug(baseText)
  if (!baseSlug) baseSlug = "item"
  
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const exists = await modelDelegate.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug
        }
      }
    })
    
    if (!exists) break
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}
