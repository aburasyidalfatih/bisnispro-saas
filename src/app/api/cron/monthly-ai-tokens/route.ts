import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout for cron job

/**
 * CRON: Monthly AI Token Distribution
 * 
 * Runs on the 1st of every month at 00:00 UTC.
 * Distributes AI token bonus to all active Lite & Pro tenants
 * whose subscription has not expired.
 * 
 * Schedule: 0 0 1 * * (vercel.json)
 */
export async function GET(req: Request) {
  // Verify Vercel CRON secret
  const authHeader = req.headers.get('authorization')
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const monthLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })

    logger.info(`[cron] Monthly AI Token Distribution started for ${monthLabel}`)

    // Find all active tenants with Lite or Pro plan that have valid subscriptions
    const eligibleTenants = await db.tenant.findMany({
      where: {
        isActive: true,
        plan: { in: ["lite", "pro"] },
        planId: { not: null },
        OR: [
          { expiresAt: { gte: now } },  // Not expired
          { expiresAt: null },           // No expiry (lifetime)
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        planId: true,
        aiTokens: true,
        aiAddonTokens: true,
        expiresAt: true,
      },
    })

    if (eligibleTenants.length === 0) {
      logger.info("[cron] No eligible tenants for monthly AI token distribution")
      return NextResponse.json({ 
        success: true, 
        message: "No eligible tenants", 
        distributed: 0 
      })
    }

    // Get all relevant plan configs
    const planIds = [...new Set(eligibleTenants.map(t => t.planId).filter(Boolean))] as string[]
    const plans = await db.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, slug: true, monthlyAiTokens: true },
    })
    const planMap = new Map(plans.map(p => [p.id, p]))

    let distributedCount = 0
    let totalTokensDistributed = 0
    const errors: string[] = []

    for (const tenant of eligibleTenants) {
      try {
        let newAiTokens = tenant.aiTokens
        let newAiAddonTokens = tenant.aiAddonTokens
        let tokensToAdd = plan.monthlyAiTokens

        // Handle negative balance (debt repayment)
        if (newAiAddonTokens < 0) {
          const debt = Math.abs(newAiAddonTokens)
          if (tokensToAdd >= debt) {
            newAiAddonTokens = 0
            tokensToAdd -= debt
            newAiTokens += tokensToAdd
          } else {
            newAiAddonTokens += tokensToAdd
            tokensToAdd = 0
          }
        } else {
          newAiTokens += tokensToAdd
        }

        // Add monthly tokens / pay debt
        await db.tenant.update({
          where: { id: tenant.id },
          data: {
            aiTokens: newAiTokens,
            aiAddonTokens: newAiAddonTokens,
          },
        })

        // Audit log
        await db.auditLog.create({
          data: {
            tenantId: tenant.id,
            action: "MONTHLY_AI_TOKEN_BONUS",
            entity: "Tenant",
            entityId: tenant.id,
            userId: "SYSTEM",
            newData: JSON.stringify({
              plan: tenant.plan,
              tokensAdded: plan.monthlyAiTokens,
              previousBalance: tenant.aiTokens + tenant.aiAddonTokens,
              newBalance: newAiTokens + newAiAddonTokens,
              month: monthLabel,
            }),
          },
        })

        // Notify tenant admin (inform them if debt was paid)
        try {
          const { notifyTenantAdmins } = await import("@/features/notification/services/notification.service")
          
          let title = "Bonus Token AI Bulanan 🤖"
          let message = `Selamat! Anda menerima bonus ${plan.monthlyAiTokens.toLocaleString("id-ID")} Token AI untuk bulan ${monthLabel}. Saldo total: ${(newAiTokens + newAiAddonTokens).toLocaleString("id-ID")} token.`
          
          if (tenant.aiAddonTokens < 0) {
             title = "Pemotongan Token AI (Pelunasan Minus) ⚠️"
             message = `Bonus Token AI bulanan Anda (${plan.monthlyAiTokens.toLocaleString("id-ID")} token) telah digunakan untuk melunasi tunggakan minus sebelumnya. Saldo total saat ini: ${(newAiTokens + newAiAddonTokens).toLocaleString("id-ID")} token. Jika masih belum mencukupi untuk menggunakan AI, silakan top-up Add-on.`
          }

          await notifyTenantAdmins(tenant.id, {
            title,
            message,
            type: tenant.aiAddonTokens < 0 ? "warning" : "info",
          })
        } catch {}

        distributedCount++
        totalTokensDistributed += plan.monthlyAiTokens

        logger.info(`[cron] Distributed ${plan.monthlyAiTokens} AI tokens to ${tenant.slug} (${tenant.plan})`)
      } catch (err: any) {
        errors.push(`${tenant.slug}: ${err.message}`)
        logger.error(`[cron] Failed to distribute AI tokens to ${tenant.slug}`, err)
      }
    }

    const summary = {
      success: true,
      month: monthLabel,
      eligible: eligibleTenants.length,
      distributed: distributedCount,
      totalTokens: totalTokensDistributed,
      errors: errors.length > 0 ? errors : undefined,
    }

    logger.info(`[cron] Monthly AI Token Distribution completed`, summary)

    return NextResponse.json(summary)
  } catch (error) {
    logger.error("Cron monthly-ai-tokens failed", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
