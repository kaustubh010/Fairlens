import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { prisma } from "./prisma";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => ({
    id: attributes.id,
    googleId: attributes.googleId,
    name: attributes.name,
    email: attributes.email,
    picture: attributes.picture,
    isArtist: attributes.isArtist,
    userName: attributes.userName,
  }),
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      id: string;
      googleId: string | null;
      name: string | null;
      email: string;
      picture: string | null;
      isArtist: boolean;
      userName: string | null;
    };
  }
}
