import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { logger } from "@/lib/logger"

/**
 * DIAGNOSTIC & FIX ENDPOINT
 * 
 * GET: Diagnosa masalah password untuk email tertentu
 * POST: Fix semua masalah sekaligus (normalize email + test password)
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const email = url.searchParams.get("email")
  const testPassword = url.searchParams.get("password")

  if (!email) {
    return NextResponse.json({ error: "Parameter 'email' diperlukan. Contoh: ?email=user@gmail.com&password=test123" }, { status: 400 })
  }

  const emailLower = email.toLowerCase()

  // 1. Cari user dengan email exact dan lowercase
  const userExact = await db.user.findUnique({ where: { email } })
  const userLower = email !== emailLower ? await db.user.findUnique({ where: { email: emailLower } }) : null

  const targetUser = userExact || userLower

  if (!targetUser) {
    return NextResponse.json({
      status: "USER_NOT_FOUND",
      message: `Tidak ada user dengan email '${email}' maupun '${emailLower}' di database`,
      searchedExact: email,
      searchedLower: emailLower,
    })
  }

  // 2. Cek kondisi password
  const hasPassword = !!targetUser.password && targetUser.password.length > 0
  const isBcryptHash = hasPassword && targetUser.password.startsWith("$2")
  const passwordLength = targetUser.password?.length || 0

  // 3. Test password jika diberikan
  let passwordTestResult = null
  if (testPassword && hasPassword) {
    try {
      const isValid = await bcrypt.compare(testPassword, targetUser.password)
      passwordTestResult = {
        tested: testPassword,
        isValid,
        hashPrefix: targetUser.password.substring(0, 20) + "...",
      }
    } catch (e: any) {
      passwordTestResult = {
        tested: testPassword,
        isValid: false,
        error: e.message,
      }
    }
  }

  // 4. Cek tenant membership
  const tenantUsers = await db.tenantUser.findMany({
    where: { userId: targetUser.id },
    include: { tenant: { select: { id: true, name: true, slug: true } } }
  })

  // 5. Cek masalah case
  const emailCaseIssue = targetUser.email !== emailLower

  return NextResponse.json({
    status: "FOUND",
    user: {
      id: targetUser.id,
      email: targetUser.email,
      emailLower: emailLower,
      name: targetUser.name,
      isActive: targetUser.isActive,
      isSuperAdmin: targetUser.isSuperAdmin,
    },
    password: {
      hasPassword,
      isBcryptHash,
      passwordLength,
      hashPrefix: hasPassword ? targetUser.password.substring(0, 20) + "..." : null,
    },
    issues: {
      emailCaseMismatch: emailCaseIssue,
      emptyPassword: !hasPassword,
      notBcryptHash: hasPassword && !isBcryptHash,
      userInactive: !targetUser.isActive,
    },
    tenants: tenantUsers.map(tu => ({
      tenantName: tu.tenant.name,
      tenantSlug: tu.tenant.slug,
      role: tu.role,
    })),
    passwordTest: passwordTestResult,
  })
}

/**
 * POST: Perbaiki masalah password secara komprehensif
 * 
 * Body: { action: "fix-all" } → Normalize semua email + lapor statistik
 * Body: { action: "reset-password", email: "...", newPassword: "..." } → Reset password spesifik user
 * Body: { action: "diagnose-all" } → Diagnosa semua user yang bermasalah
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === "fix-all") {
      // === FIX 1: Normalize all emails to lowercase ===
      const allUsers = await db.user.findMany({ select: { id: true, email: true } })
      let emailsFixed = 0
      const emailErrors: string[] = []

      for (const user of allUsers) {
        const lowered = user.email.toLowerCase()
        if (lowered !== user.email) {
          const existing = await db.user.findUnique({ where: { email: lowered } })
          if (existing && existing.id !== user.id) {
            emailErrors.push(`DUPLICATE: ${user.email} -> ${lowered} (conflict with user ${existing.id})`)
            continue
          }
          await db.user.update({ where: { id: user.id }, data: { email: lowered } })
          emailsFixed++
        }
      }

      // === FIX 2: Find users with empty/invalid passwords ===
      const emptyPasswordUsers = allUsers.filter(u => false) // Will be checked separately
      const allUsersWithPwd = await db.user.findMany({
        select: { id: true, email: true, password: true, isSuperAdmin: true },
      })
      
      const problemUsers = allUsersWithPwd.filter(u => {
        if (u.isSuperAdmin) return false
        return !u.password || u.password.length === 0 || !u.password.startsWith("$2")
      })

      return NextResponse.json({
        message: "Perbaikan selesai",
        emailsFixed,
        emailErrors,
        totalUsers: allUsers.length,
        problemPasswords: problemUsers.map(u => ({
          id: u.id,
          email: u.email,
          issue: !u.password || u.password.length === 0 
            ? "EMPTY_PASSWORD (OAuth user?)" 
            : "NOT_BCRYPT_HASH"
        })),
      })
    }

    if (action === "reset-password") {
      const { email, newPassword } = body
      if (!email || !newPassword) {
        return NextResponse.json({ error: "email dan newPassword diperlukan" }, { status: 400 })
      }

      const emailLower = email.toLowerCase()
      const user = await db.user.findUnique({ where: { email: emailLower } })
      if (!user) {
        return NextResponse.json({ error: `User ${emailLower} tidak ditemukan` }, { status: 404 })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)
      
      // Verify hash immediately
      const verifyOk = await bcrypt.compare(newPassword, hashedPassword)
      
      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })

      // Double-check: re-read from DB and verify
      const updatedUser = await db.user.findUnique({ where: { id: user.id }, select: { password: true } })
      const dbVerifyOk = updatedUser ? await bcrypt.compare(newPassword, updatedUser.password) : false

      logger.info(`Password reset via fix-emails endpoint`, { 
        email: emailLower, 
        userId: user.id,
        hashVerified: verifyOk,
        dbVerified: dbVerifyOk 
      })

      return NextResponse.json({
        message: `Password untuk ${emailLower} berhasil direset`,
        userId: user.id,
        hashVerified: verifyOk,
        dbVerified: dbVerifyOk,
      })
    }

    if (action === "diagnose-all") {
      const allUsers = await db.user.findMany({
        select: { id: true, email: true, password: true, isActive: true, isSuperAdmin: true },
      })

      const issues = []
      for (const u of allUsers) {
        const problems: string[] = []
        if (u.email !== u.email.toLowerCase()) problems.push("EMAIL_CASE_MISMATCH")
        if (!u.password || u.password.length === 0) problems.push("EMPTY_PASSWORD")
        else if (!u.password.startsWith("$2")) problems.push("NOT_BCRYPT_HASH")
        if (!u.isActive) problems.push("USER_INACTIVE")
        
        if (problems.length > 0) {
          issues.push({ id: u.id, email: u.email, problems })
        }
      }

      return NextResponse.json({
        totalUsers: allUsers.length,
        usersWithIssues: issues.length,
        issues,
      })
    }

    return NextResponse.json({ error: "Action tidak dikenal. Gunakan: fix-all, reset-password, diagnose-all" }, { status: 400 })
  } catch (error) {
    logger.error("Fix-emails endpoint error", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
