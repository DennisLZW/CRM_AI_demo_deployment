import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user.id = token.id;
      (session as any).user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return null;
  return session as any;
}

export async function requireAuth(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return null;
  const id = (token as any).id ?? token.sub;
  const role = (token as any).role;
  if (!id || !role) return null;
  return { id: String(id), role: String(role) as "ADMIN" | "STAFF" };
}

