/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).lean();
        if (!user) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
        };
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
