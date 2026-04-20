import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { generateId } from "lucia";

// Validation schema
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

// Function to generate a unique username with random digits
async function generateUniqueUsername(name: string | null, email: string) {
  // Base username from name or email prefix
  let base = name
    ? name.trim().toLowerCase().replace(/\s+/g, "")
    : email.split("@")[0].toLowerCase();

  // Keep only letters, numbers, underscores
  base = base.replace(/[^a-z0-9_]/g, "");
  if (!base) base = "user";

  while (true) {
    // Add random 4-digit suffix
    const suffix = Math.floor(1000 + Math.random() * 9000); // 1000–9999
    const username = `${base}${suffix}`;

    const existing = await prisma.user.findUnique({
      where: { userName: username },
    });

    if (!existing) return username;
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Generate unique username
    const userName = await generateUniqueUsername(name || null, email);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId(10);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        hashedPassword,
        name,
        isArtist: false,
        userName,
      },
    });

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          email: user.email,
          name: user.name,
          isArtist: user.isArtist,
          userName: user.userName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup Error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
