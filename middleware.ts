export { auth as middleware } from '@/auth';

// Run on every route EXCEPT:
//  - /api/auth/* (NextAuth's own routes — must be reachable while unauthenticated)
//  - Next.js static assets
//  - the Busuu logo (so the sign-in page can show it)
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|busuu-logo.png).*)'],
};
