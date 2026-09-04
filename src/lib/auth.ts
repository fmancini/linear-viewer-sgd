import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAllowedEmail, verifiedGoogleEmail } from "./auth-policy";
import { logAccess } from "./access-log";

export function isAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.NEXTAUTH_URL &&
    (process.env.NEXTAUTH_SECRET?.length ?? 0) >= 32 &&
    process.env.AUTH_ALLOWED_DOMAINS?.trim()
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: { params: { scope: "openid email profile", prompt: "select_account" } },
      checks: ["pkce", "state"],
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      const email = verifiedGoogleEmail(account?.provider, profile);
      if (email === null) return false;
      await logAccess(email);
      return true;
    },
    jwt({ token, account, profile }) {
      if (account) {
        const email = verifiedGoogleEmail(account.provider, profile);
        token.email = email;
        token.googleVerified = email !== null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.googleVerified === true && isAllowedEmail(token.email)
          ? token.email
          : null;
      }
      return session;
    },
    redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  logger: {
    error(code) { console.error("Authentication error:", code); },
    warn(code) { console.warn("Authentication warning:", code); },
    debug() {},
  },
};

export async function getAuthorizedSession() {
  if (!isAuthConfigured()) return null;
  const session = await getServerSession(authOptions);
  return isAllowedEmail(session?.user?.email) ? session : null;
}
