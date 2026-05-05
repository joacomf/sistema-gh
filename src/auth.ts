import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// Definir la whitelist directamente en el código
const WHITELIST_EMAILS = [
  "joaquinamf@gmail.com",
  // Agregar más emails aquí
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (user.email && WHITELIST_EMAILS.includes(user.email)) {
          return true
        } else {
          // Si retorna false o un string, se deniega el acceso
          // Retornar un string con la URL redirige a esa ruta
          return "/unauthorized"
        }
      }
      return false
    },
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
})
