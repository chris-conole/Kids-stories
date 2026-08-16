import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { sendMagicLink } from "./email";

/**
 * Passwordless auth via email magic links (Auth.js v5). No passwords to store,
 * which is the right default for a consumer product parents sign up to once.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: { signIn: "/login", verifyRequest: "/login?check=1" },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      // Use our branded email rather than the default plaintext link.
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLink(identifier, url);
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
