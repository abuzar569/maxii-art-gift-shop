import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import { loginSchema } from '@/schemas/auth';

export async function POST(req: NextRequest) {
  try {
    const db = await connectDB();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;

    // Use native driver to avoid Mongoose generic type issues
    const collection = db.connection.db?.collection('users');
    if (!collection) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // Seed admin if none exists
    const count = await collection.countDocuments();
    if (count === 0) {
      const hashed = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'admin123',
        12
      );
      await collection.insertOne({
        email: (process.env.ADMIN_EMAIL || 'admin@giftshop.com').toLowerCase(),
        password: hashed,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const user = await collection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password as string);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email as string,
      role: user.role as string,
    });

    const response = NextResponse.json({
      token,
      user: { email: user.email, role: user.role },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
