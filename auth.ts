import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Lock the dashboard to Chegg Google accounts only.
// Set ALLOWED_EMAIL_DOMAIN in env to override (e.g. for staging or partners).
const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'chegg.com';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    // Runs after Google returns the user. Block anyone whose email isn't
    // on the allowed domain — they won't get a session and won't see the app.
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase() ?? '';
      return email.endsWith('@' + ALLOWED_DOMAIN);
    },
    // Used by the middleware to gate every request. Anything without an
    // active session is redirected to the sign-in page by Auth.js.
    authorized({ auth }) {
      return !!auth;
    },
  },
  pages: {
    error: '/api/auth/signin', // bounce blocked users back to sign-in
  },
});
