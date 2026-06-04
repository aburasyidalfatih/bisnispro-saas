import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { verifyTwoFactorLogin } from "@/features/auth/services/two-factor.service"
import { authConfig } from "@/lib/auth.config"
import { NextAuthConfig } from "next-auth"

class CustomAuthError extends CredentialsSignin {
  code: string
  constructor(message: string) {
    super(message)
    this.code = message
  }
}

export const authOptions: NextAuthConfig = {
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // NOTE: Google provider is NOT listed here intentionally.
    // It is injected dynamically per-request in /api/auth/[...nextauth]/route.ts
    // based on hostname (platform settings for main domain, tenant settings for subdomains).
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
        hostname: { label: "Hostname", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError("Email dan password harus diisi")
        }

        // --- CLOUDFLARE TURNSTILE VERIFICATION ---
        const turnstileToken = credentials.turnstileToken as string | undefined
        const turnstileEnabled = await db.platformSetting.findUnique({
          where: { key: "TURNSTILE_ENABLED" },
        })
        const isTurnstileActive = turnstileEnabled?.value === "true"

        if (isTurnstileActive) {
          const turnstileSetting = await db.platformSetting.findUnique({
            where: { key: "TURNSTILE_SECRET_KEY" },
          })
          const secretKey = process.env.TURNSTILE_SECRET_KEY || turnstileSetting?.value

          if (secretKey) {
            if (!turnstileToken) {
              throw new CustomAuthError("Token keamanan tidak ditemukan")
            }
            const formData = new URLSearchParams()
            formData.append("secret", secretKey)
            formData.append("response", turnstileToken)
            const result = await fetch(
              "https://challenges.cloudflare.com/turnstile/v0/siteverify",
              { body: formData, method: "POST" }
            )
            const outcome = await result.json()
            if (!outcome.success) {
              throw new CustomAuthError("Verifikasi keamanan gagal, silakan coba lagi")
            }
          }
        }
        // -----------------------------------------

        const email = (credentials.email as string).toLowerCase().trim()
        const password = (credentials.password as string)

        const user = await db.user.findUnique({
          where: { email },
          include: { tenants: { include: { tenant: true } }, affiliateProfile: true },
        })

        if (!user || !user.isActive) {
          console.error(`[AUTH DEBUG] Login failed: user not found or inactive. email=${email}, found=${!!user}, isActive=${user?.isActive}`)
          throw new CustomAuthError("Email atau password salah")
        }

        if (!user.password || user.password.length === 0) {
          console.error(`[AUTH DEBUG] Login failed: empty password in DB. email=${email}, userId=${user.id}`)
          throw new CustomAuthError("Email atau password salah")
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
          console.error(`[AUTH DEBUG] Login failed: bcrypt.compare returned false. email=${email}, userId=${user.id}, passwordInputLength=${password.length}, hashPrefix=${user.password.substring(0, 7)}, hashLength=${user.password.length}`)
          throw new CustomAuthError("Email atau password salah")
        }

        // --- DOMAIN BASED LOGIN RESTRICTION ---
        const hostname = (credentials.hostname as string) || ""
        const rootDomain = process.env.AUTH_URL ? process.env.AUTH_URL.replace("https://", "").replace("http://", "") : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id")
        const hostWithoutPort = hostname.split(":")[0]
        const isMainDomain =
          !hostname ||
          hostname === rootDomain ||
          hostname === `www.${rootDomain}` ||
          hostWithoutPort === "localhost" ||
          hostWithoutPort === rootDomain ||
          hostWithoutPort === `www.${rootDomain}`

        if (isMainDomain) {
          // Main domain /login is EXCLUSIVELY for Super Admin (form-based)
          // Affiliates must use /mitra-afiliasi with Google OAuth
          if (!user.isSuperAdmin) {
            throw new CustomAuthError(
              "Akses ditolak. Mitra Afiliasi harus masuk melalui portal /mitra-afiliasi."
            )
          }
        } else {
          // Subdomain or Custom Domain: Check if user belongs to this tenant
          let slug = hostWithoutPort.replace(`.${rootDomain}`, "").split(".")[0]
          const isSubdomain = hostWithoutPort.endsWith(`.${rootDomain}`)
          
          if (!isSubdomain) {
            const tenantByDomain = await db.tenant.findUnique({ where: { domain: hostWithoutPort }, select: { slug: true } })
            if (tenantByDomain) {
              slug = tenantByDomain.slug
            } else {
              throw new CustomAuthError("Sekolah tidak ditemukan untuk domain ini.")
            }
          }

          const belongsToTenant = user.tenants.some((t) => t.tenant.slug === slug)
          if (!belongsToTenant) {
            throw new CustomAuthError("Akses ditolak: Anda tidak terdaftar di sekolah ini.")
          }
        }

        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) throw new CustomAuthError("2FA_REQUIRED")
          const is2FAValid = await verifyTwoFactorLogin(
            user.id,
            credentials.twoFactorCode as string
          )
          if (!is2FAValid.success) throw new CustomAuthError("Kode 2FA tidak valid")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          isSuperAdmin: user.isSuperAdmin,
          twoFactorEnabled: user.twoFactorEnabled,
          isAffiliate: !!user.affiliateProfile,
          tenants: user.tenants.map((tu) => ({
            id: tu.tenant.id,
            name: tu.tenant.name,
            slug: tu.tenant.slug,
            role: tu.role,
            theme: tu.tenant.theme || "aurora",
            template: (tu.tenant as any).template || "default",
            logo: tu.tenant.logo || null,
            plan: tu.tenant.plan || "free",
            planId: tu.tenant.planId || null,
          })),
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth — auto-provision user if first time login
      if (account?.provider === "google" && user.email) {
        const { headers } = await import("next/headers")
        const headersList = await headers()
        const host = headersList.get("host") || ""
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
        const hostWithoutPort = host.split(":")[0]
        const isMainDomain =
          hostWithoutPort === "localhost" ||
          hostWithoutPort === rootDomain ||
          hostWithoutPort === `www.${rootDomain}`

        let targetTenantSlug: string | null = null
        if (!isMainDomain) {
          const isSubdomain = hostWithoutPort.endsWith(`.${rootDomain}`)
          if (isSubdomain) {
            targetTenantSlug = hostWithoutPort.replace(`.${rootDomain}`, "").split(".")[0]
          } else {
            const tenantByDomain = await db.tenant.findUnique({ where: { domain: hostWithoutPort }, select: { slug: true } })
            if (tenantByDomain) {
              targetTenantSlug = tenantByDomain.slug
            }
          }
        }

        const { cookies } = await import("next/headers")
        const cookieStore = await cookies()
        const cb = cookieStore.get("next-auth.callback-url")?.value || cookieStore.get("__Secure-next-auth.callback-url")?.value || cookieStore.get("authjs.callback-url")?.value || cookieStore.get("__Secure-authjs.callback-url")?.value || ""
        const isAffiliateFlow = cb.includes("/affiliate") || cb.includes("/mitra")

        const existing = await db.user.findUnique({
          where: { email: user.email },
          include: { affiliateProfile: true },
        })

        // Restriksi di domain utama:
        // Jika login BUKAN dari halaman mitra afiliasi, maka wajib Super Admin
        if (isMainDomain && !isAffiliateFlow) {
          if (!existing || !existing.isSuperAdmin) {
            return "/login?error=" + encodeURIComponent("Akun tidak ditemukan")
          }
          user.id = existing.id
          return true
        }

        if (!existing) {
          // --- NEW USER: provision based on context ---
          if (targetTenantSlug) {
            // STRICT MODE: Jika user belum ada sama sekali, tolak!
            return "/login?error=" + encodeURIComponent("Email Anda belum terdaftar di sistem. Silakan hubungi Admin sekolah atau daftar terlebih dahulu.")
          }

          // Main domain: create Affiliate profile
          let newUserId = ""
          await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                name: user.name || "User",
                email: user.email!,
                password: "", // OAuth user — no password
                avatar: user.image,
                emailVerified: new Date(),
              },
            })

            const referralCode = Math.random().toString(36).substring(2, 8).toLowerCase()
            const newAffiliate = await tx.affiliateProfile.create({
              data: { userId: newUser.id, referralCode },
            })
            
            const settingsDoc = await tx.platformSetting.findUnique({ where: { key: "AFFILIATE_DEFAULT_CASHBACK" } })
            const defaultCashbackAmount = settingsDoc ? parseInt(settingsDoc.value) : 400000;
            
            // Auto-generate Cashback Coupon
            await tx.discountCode.create({
              data: {
                code: referralCode,
                description: `Kupon Cashback Otomatis untuk ${newUser.name}`,
                type: "CASHBACK",
                cashbackAmount: defaultCashbackAmount,
                percentage: 0,
                affiliateId: newAffiliate.id,
                isActive: true
              }
            })

            await tx.notificationSetting.createMany({
              data: [
                { userId: newUser.id, channel: "inapp", enabled: true },
                { userId: newUser.id, channel: "email", enabled: true },
                { userId: newUser.id, channel: "whatsapp", enabled: false },
              ],
            })

            newUserId = newUser.id
          })
          user.id = newUserId
        } else {
          // --- EXISTING USER ---

          // SECURITY: Super Admin must never be modified via Google OAuth flow
          if (existing.isSuperAdmin) {
            user.id = existing.id
            return true
          }

          if (targetTenantSlug) {
            // STRICT MODE: Subdomain - reject if not already a member
            const tenant = await db.tenant.findUnique({ where: { slug: targetTenantSlug } })
            if (tenant) {
              const alreadyMember = await db.tenantUser.findUnique({
                where: { tenantId_userId: { tenantId: tenant.id, userId: existing.id } },
              })
              if (!alreadyMember) {
                return "/login?error=" + encodeURIComponent("Akses ditolak. Email Anda tidak terdaftar sebagai anggota di sekolah ini.")
              }
            } else {
              return "/login?error=" + encodeURIComponent("Sekolah tidak ditemukan.")
            }
          } else {
            // Main domain: ensure Affiliate profile exists (non-super-admin only)
            if (!existing.affiliateProfile) {
              const referralCode = Math.random().toString(36).substring(2, 8).toLowerCase()
              const newAffiliate = await db.affiliateProfile.create({
                data: { userId: existing.id, referralCode },
              })
              
              // Auto-generate Cashback Coupon
              await db.discountCode.create({
                data: {
                  code: referralCode,
                  description: `Kupon Cashback Otomatis untuk ${existing.name || 'User'}`,
                  type: "CASHBACK",
                  cashbackAmount: 400000,
                  percentage: 0,
                  affiliateId: newAffiliate.id,
                  isActive: true
                }
              })
            }
          }

          user.id = existing.id
        }
      }
      // --- NEW: AUDIT LOG USER LOGIN ---
      try {
        const { headers } = await import("next/headers")
        const headersList = await headers()
        const host = headersList.get("host") || ""
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
        const hostWithoutPort = host.split(":")[0]
        const isMainDomain =
          hostWithoutPort === "localhost" ||
          hostWithoutPort === rootDomain ||
          hostWithoutPort === `www.${rootDomain}`

        let targetTenantSlug: string | null = null
        if (!isMainDomain) {
          const isSubdomain = hostWithoutPort.endsWith(`.${rootDomain}`)
          if (isSubdomain) {
            targetTenantSlug = hostWithoutPort.replace(`.${rootDomain}`, "").split(".")[0]
          } else {
            const tenantByDomain = await db.tenant.findUnique({ where: { domain: hostWithoutPort }, select: { slug: true } })
            if (tenantByDomain) {
              targetTenantSlug = tenantByDomain.slug
            }
          }
        }
        
        let tenantId = null;
        if (targetTenantSlug) {
            const tenant = await db.tenant.findUnique({ where: { slug: targetTenantSlug }, select: { id: true } })
            if (tenant) tenantId = tenant.id;
        }

        if (user?.id) {
            await db.auditLog.create({
                data: {
                    action: "USER_LOGIN",
                    entity: "User",
                    entityId: user.id,
                    userId: user.id,
                    tenantId: tenantId,
                    ipAddress: headersList.get("x-forwarded-for") || undefined,
                    userAgent: headersList.get("user-agent") || undefined,
                }
            })

            // TRIGGER GAMIFICATION LOGIN POINTS (Direct DB call)
            if (tenantId) {
                const { addGamificationPoints } = await import("@/features/gamification/services/gamification.service")
                await addGamificationPoints({
                  tenantId,
                  userId: user.id,
                  type: "LOGIN",
                  points: 10,
                  description: "Login sistem (Daily Activity)"
                })
            }
        }
      } catch (error) {
        console.error("Failed to log user login", error)
      }

      return true
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!
        token.isSuperAdmin = (user as any).isSuperAdmin || false
        token.twoFactorEnabled = (user as any).twoFactorEnabled || false
        token.isAffiliate = (user as any).isAffiliate || false
        token.tenants = (user as any).tenants || []
      }
      // Re-fetch on update or when tenants are empty (OAuth first login)
      if (trigger === "update" || (token.id && (!token.tenants || (token.tenants as any[]).length === 0))) {
        const freshUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: { tenants: { include: { tenant: true } }, affiliateProfile: true },
        })
        if (freshUser) {
          token.name = freshUser.name
          token.picture = freshUser.avatar
          token.isSuperAdmin = freshUser.isSuperAdmin
          token.twoFactorEnabled = freshUser.twoFactorEnabled
          token.isAffiliate = !!freshUser.affiliateProfile
          token.tenants = freshUser.tenants.map((tu) => ({
            id: tu.tenant.id,
            name: tu.tenant.name,
            slug: tu.tenant.slug,
            role: tu.role,
            theme: tu.tenant.theme || "aurora",
            template: (tu.tenant as any).template || "default",
            logo: tu.tenant.logo || null,
            plan: tu.tenant.plan || "free",
            planId: tu.tenant.planId || null,
          }))
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.isAffiliate = token.isAffiliate as boolean
        session.user.tenants = (token.tenants as any[]) || []
        if (token.name) session.user.name = token.name as string
        if (token.picture !== undefined) session.user.image = token.picture as string | null

        // Handle Super Admin impersonation
        if (session.user.isSuperAdmin) {
          try {
            const { cookies } = await import("next/headers")
            const cookieStore = await cookies()
            const impersonatedSlug = cookieStore.get("impersonate-tenant")?.value

            if (impersonatedSlug) {
              const tenant = await db.tenant.findUnique({
                where: { slug: impersonatedSlug },
                select: { id: true, name: true, slug: true, theme: true, template: true, logo: true, plan: true, planId: true },
              })

              if (tenant) {
                session.user.tenants = [
                  {
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    role: "owner",
                    theme: tenant.theme || "aurora",
                    template: (tenant as any).template || "default",
                    logo: tenant.logo || null,
                    plan: tenant.plan || "free",
                    planId: tenant.planId || null,
                  },
                  ...session.user.tenants.filter((t) => t.slug !== impersonatedSlug),
                ]
              }
            }
          } catch {
            // Ignore cookie read errors in edge cases
          }
        }
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
