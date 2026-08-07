import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import { changePasswordSchema } from '@/schemas/auth';

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await connectDB();
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Use native driver to avoid Mongoose type issues
    const collection = db.connection.db?.collection('users');
    if (!collection) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const { ObjectId } = await import('bson');
    const userDoc = await collection.findOne({ _id: new ObjectId(auth.userId) });
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, userDoc.password as string);
    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await collection.updateOne(
      { _id: new ObjectId(auth.userId) },
      { $set: { password: hashed } }
    );

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
