import NextAuth, { type NextAuthOptions, type User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authenticateUser } from "@/server/services/auth.server"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction } from "@/generated/prisma"

interface ExtendedUser extends Omit<User, "role"> {
  fullName: string
  employeeId: string
  role: string
  orgId: string
  designation?: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) return null

        const user = await authenticateUser(
          credentials.email,
          credentials.password
        )

        if (!user) return null

        // Log login
        await logAudit({
          orgId: user.orgId,
          userId: user.id,
          userName: user.fullName,
          userRole: user.role,
          action: AuditAction.LOGIN,
          tableName: "users",
          recordId: user.id,
        })

        const extended: ExtendedUser = {
          id: user.id,
          email: user.email,
          name: user.fullName,
          fullName: user.fullName,
          employeeId: user.employeeId,
          role: user.role,
          orgId: user.orgId,
          designation: user.designation ?? undefined,
        }
        return extended as unknown as User
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const u = user as unknown as ExtendedUser
        token.role = u.role
        token.orgId = u.orgId
        token.employeeId = u.employeeId
        token.fullName = u.fullName
        token.designation = u.designation
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.orgId = token.orgId as string
        session.user.employeeId = token.employeeId as string
        session.user.fullName = token.fullName as string
        session.user.designation = token.designation as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
