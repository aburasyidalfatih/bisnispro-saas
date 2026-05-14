import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

/**
 * ONE-TIME FIX: Normalize all user emails to lowercase.
 * This fixes the root cause of "wrong password" errors where emails
 * were stored with mixed case (e.g., "Djaha.Ferry@Gmail.com")
 * but login queries use lowercase ("djaha.ferry@gmail.com").
 *
 * After running once in production, this endpoint can be removed.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Find all users with uppercase characters in their email
    const allUsers = await db.user.findMany({
      select: { id: true, email: true }
    })

    let fixedCount = 0
    const errors: string[] = []

    for (const user of allUsers) {
      const lowered = user.email.toLowerCase()
      if (lowered !== user.email) {
        // Check if a lowercase version already exists (duplicate)
        const existing = await db.user.findUnique({ where: { email: lowered } })
        if (existing && existing.id !== user.id) {
          errors.push(`SKIP: ${user.email} -> ${lowered} (duplicate exists: ${existing.id})`)
          continue
        }

        await db.user.update({
          where: { id: user.id },
          data: { email: lowered }
        })
        fixedCount++
      }
    }

    logger.info(`Email normalization complete: ${fixedCount} fixed, ${errors.length} skipped`, { fixedCount, errors })

    return NextResponse.json({
      message: `Email berhasil dinormalisasi`,
      fixed: fixedCount,
      total: allUsers.length,
      errors
    })
  } catch (error) {
    logger.error("Email normalization failed", error)
    return NextResponse.json({ error: "Gagal menormalisasi email" }, { status: 500 })
  }
}
