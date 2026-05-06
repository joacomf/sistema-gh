import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/unauthorized')

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL('/', req.nextUrl))
  }
})

// Opcionalmente, configura en qué rutas se debe ejecutar el middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|img/).*)'],
}
