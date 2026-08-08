import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import { loginSchema } from '@/schemas/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 2. Validate
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;

    // 3. Connect DB
    const db = await connectDB();

    const collection = db.connection.db?.collection('users');
    if (!collection) {
      return NextResponse.json({ error: 'Database collection unavailable' }, { status: 500 });
    }

    // 4. Seed admin on first run
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

    // 5. Find user
    const user = await collection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 6. Check password
    const valid = await bcrypt.compare(password, user.password as string);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 7. Sign token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email as string,
      role: (user.role as string) || 'admin',
    });

    const response = NextResponse.json({
      token,
      user: { email: user.email, role: user.role || 'admin' },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    // Log full error for debugging
    console.error('Login error full:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    );
  }
}
