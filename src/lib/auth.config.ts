import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  // Callbacks minimal — hanya untuk membaca token di middleware
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.isSuperAdmin = (user as any).isSuperAdmin || false
        token.isAffiliate = (user as any).isAffiliate || false
        token.tenants = (user as any).tenants || []
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
        session.user.isAffiliate = token.isAffiliate as boolean
        session.user.tenants = token.tenants as any[] || []
      }
      return session
    },
  },
}
