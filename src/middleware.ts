import { withAuth, type NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    if (!token) {
      if (pathname === "/") return NextResponse.next()
      if (pathname.startsWith("/api/invitations/accept")) return NextResponse.next()
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const role = token.role as string

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (pathname.startsWith("/platform") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (pathname.startsWith("/ontology") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (pathname.startsWith("/settings") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (
      pathname.startsWith("/audit-trail") &&
      !["admin", "qa_head", "qa_reviewer"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Allow unauthenticated access to the root landing page
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        if (pathname === "/") return true
        if (pathname.startsWith("/invitations")) return true
        if (pathname.startsWith("/api/invitations/accept")) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!login|register|forgot-password|invitations|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
