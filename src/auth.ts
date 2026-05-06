import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

// Definir la whitelist directamente en el código
const WHITELIST_EMAILS = [
  "joaquinamf@gmail.com",
  // Agregar más emails aquí
]

const providers: any[] = [Google]

// Agregar un proveedor de credenciales (mock) SOLO para testing con Playwright
if (process.env.PLAYWRIGHT_TEST === "true") {
  providers.push(
    Credentials({
      credentials: { email: { type: "text" } },
      async authorize(credentials) {
        if (credentials?.email === "test@playwright.com") {
          return { id: "1", name: "Test User", email: "test@playwright.com" }
        }
        return null
      }
    })
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials" && process.env.PLAYWRIGHT_TEST === "true") {
        return true
      }

      if (account?.provider === "google") {
        if (user.email && WHITELIST_EMAILS.includes(user.email)) {
          return true
        } else {
          return "/unauthorized"
        }
      }
      return false
    },
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
})
