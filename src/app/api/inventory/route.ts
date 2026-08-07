import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import { authenticateRequest } from '@/lib/auth';
import { inventorySchema } from '@/schemas/inventory';

const InventoryModel = Inventory as any;

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await InventoryModel.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const body = await req.json();

    const parsed = inventorySchema.safeParse({
      ...body,
      quantity: Number(body.quantity),
      minimumStock: Number(body.minimumStock),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const item = await InventoryModel.create(parsed.data);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
