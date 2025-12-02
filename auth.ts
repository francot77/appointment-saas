/* eslint-disable @typescript-eslint/no-explicit-any */
// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        await dbConnect();
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await User.findOne({ email }).lean();
        if (!user) return null;

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) return null;

        return { id: String(user._id), email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
});
