import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { verifyTwoFactorLogin } from "@/lib/services/two-factor"
import { authConfig } from "@/lib/auth.config"

class CustomAuthError extends CredentialsSignin {
  code: string
  constructor(message: string) {
    super(message)
    this.code = message
  }
}

export const authOptions: any = {
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET 
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
        hostname: { label: "Hostname", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError("Email dan password harus diisi")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenants: { include: { tenant: true } }, affiliateProfile: true },
        })

        if (!user || !user.isActive) {
          throw new CustomAuthError("Email atau password salah")
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) {
          throw new CustomAuthError("Email atau password salah")
        }

        // --- DOMAIN BASED LOGIN RESTRICTION ---
        const hostname = (credentials.hostname as string) || ""
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.my.id"
        // Cek apakah ini domain utama (support port untuk local dev)
        const hostWithoutPort = hostname.split(":")[0]
        const isMainDomain = 
          !hostname ||  // tidak ada hostname = fallback ke main domain
          hostname === rootDomain || 
          hostname === `www.${rootDomain}` || 
          hostWithoutPort === "localhost" ||
          hostWithoutPort === rootDomain ||
          hostWithoutPort === `www.${rootDomain}`

        if (isMainDomain) {
          // Hanya Super Admin dan Afiliasi yang boleh login di domain utama
          const isAffiliate = !!user.affiliateProfile
          if (!user.isSuperAdmin && !isAffiliate) {
            throw new CustomAuthError("Hanya Super Admin atau Mitra Afiliasi yang dapat login di domain utama.")
          }
        } else {
          // Ini adalah subdomain tenant
          const slug = hostWithoutPort.replace(`.${rootDomain}`, "").split('.')[0]
          
          // Super Admin dilarang login langsung di subdomain
          if (user.isSuperAdmin) {
             throw new CustomAuthError("Super Admin harus login melalui domain utama.")
          }

          // Cek apakah user terdaftar di tenant ini
          const belongsToTenant = user.tenants.some(t => t.tenant.slug === slug)
          if (!belongsToTenant) {
            throw new CustomAuthError(`Akses ditolak: Anda tidak terdaftar di sekolah ini.`)
          }
        }
        // --------------------------------------

        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) throw new CustomAuthError("2FA_REQUIRED")
          const is2FAValid = await verifyTwoFactorLogin(user.id, credentials.twoFactorCode as string)
          if (!is2FAValid) throw new CustomAuthError("Kode 2FA tidak valid")
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
      // Handle Google OAuth — auto-create user if not exists
      if (account?.provider === "google" && user.email) {
        const { headers } = await import("next/headers")
        const headersList = await headers()
        const host = headersList.get("host") || ""
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.my.id"
        const isMainDomain = host === rootDomain || host === `www.${rootDomain}` || host.startsWith("localhost:")
        
        let targetTenantSlug: string | null = null
        if (!isMainDomain) {
           targetTenantSlug = host.split('.')[0]
        }

        const existing = await db.user.findUnique({
          where: { email: user.email },
        })
        
        if (!existing) {
          await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                name: user.name || "User",
                email: user.email!,
                password: "", // OAuth user, no password
                avatar: user.image,
                emailVerified: new Date(),
              },
            })

            if (targetTenantSlug) {
              // Daftar ke subdomain tenant sebagai member/user
              const existingTenant = await tx.tenant.findUnique({ where: { slug: targetTenantSlug } })
              if (existingTenant) {
                 await tx.tenantUser.create({
                    data: { tenantId: existingTenant.id, userId: newUser.id, role: "member" },
                 })
              }
            } else {
              // Main domain: Create affiliate profile (bukan super admin)
              const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
              await tx.affiliateProfile.create({
                data: {
                  userId: newUser.id,
                  referralCode,
                }
              })
            }

            // Create default notification settings
            await tx.notificationSetting.createMany({
              data: [
                { userId: newUser.id, channel: "inapp", enabled: true },
                { userId: newUser.id, channel: "email", enabled: true },
                { userId: newUser.id, channel: "whatsapp", enabled: false },
              ],
            })

            // Update the user object id for JWT callback
            user.id = newUser.id
          })
        } else {
          // Jika user sudah ada tapi belum terhubung ke tenant saat ini (dan login dari subdomain)
          if (targetTenantSlug) {
             const existingTenant = await db.tenant.findUnique({ where: { slug: targetTenantSlug } })
              if (existingTenant) {
               const alreadyMember = await db.tenantUser.findUnique({
                 where: { tenantId_userId: { tenantId: existingTenant.id, userId: existing.id } }
               })
               if (!alreadyMember) {
                  await db.tenantUser.create({
                    data: { tenantId: existingTenant.id, userId: existing.id, role: "member" }
                  })
               }
             }
          } else {
             // Jika login dari domain utama, pastikan mereka jadi Affiliate jika bukan Super Admin
             if (!existing.isSuperAdmin) {
                const hasAffiliate = await db.affiliateProfile.findUnique({ where: { userId: existing.id } })
                if (!hasAffiliate) {
                   const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                   await db.affiliateProfile.create({
                     data: { userId: existing.id, referralCode }
                   })
                }
             }
          }
          user.id = existing.id
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!
        token.isSuperAdmin = user.isSuperAdmin || false
        token.twoFactorEnabled = user.twoFactorEnabled || false
        token.isAffiliate = (user as any).isAffiliate || false
        token.tenants = user.tenants || []
      }
      // Re-fetch user + tenant data on session update or if tenants empty (OAuth first login)
      if ((trigger === "update" || (token.id && (!token.tenants || token.tenants.length === 0)))) {
        const freshUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: { tenants: { include: { tenant: true } }, affiliateProfile: true },
        })
        if (freshUser) {
          // Refresh semua data user termasuk name dan avatar
          token.name = freshUser.name
          token.picture = freshUser.avatar  // NextAuth menyimpan image di token.picture
          token.isSuperAdmin = freshUser.isSuperAdmin
          token.twoFactorEnabled = freshUser.twoFactorEnabled
          token.isAffiliate = !!freshUser.affiliateProfile
          token.tenants = freshUser.tenants.map((tu) => ({
            id: tu.tenant.id,
            name: tu.tenant.name,
            slug: tu.tenant.slug,
            role: tu.role,
            theme: tu.tenant.theme || "aurora",
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
        session.user.tenants = token.tenants as any[] || []
        // Sinkronisasi name dan image dari token (di-refresh saat trigger=update)
        if (token.name) session.user.name = token.name as string
        if (token.picture !== undefined) session.user.image = token.picture as string | null

        // Handle Impersonation for Super Admin
        if (session.user.isSuperAdmin) {
          try {
            const { cookies } = await import("next/headers")
            const cookieStore = await cookies()
            const impersonatedSlug = cookieStore.get("impersonate-tenant")?.value
            
            if (impersonatedSlug) {
              const tenant = await db.tenant.findUnique({
                where: { slug: impersonatedSlug },
                select: { id: true, name: true, slug: true, theme: true, logo: true, plan: true, planId: true }
              })
              
              if (tenant) {
                // Prepend impersonated tenant to the list with 'owner' role
                session.user.tenants = [
                  {
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    role: "owner",
                    theme: tenant.theme || "aurora",
                    logo: tenant.logo || null,
                    plan: tenant.plan || "free",
                    planId: tenant.planId || null,
                  },
                  ...session.user.tenants.filter(t => t.slug !== impersonatedSlug)
                ]
              }
            }
          } catch (e) {
            // Ignore cookie read errors in certain edge cases
          }
        }
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
