import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import { authenticateRequest } from '@/lib/auth';
import { inventorySchema } from '@/schemas/inventory';

interface Params {
  params: Promise<{ id: string }>;
}

const InventoryModel = Inventory as any;

export async function GET(req: NextRequest, { params }: Params) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const item = await InventoryModel.findById(id).lean();
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
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

    const item = await InventoryModel.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const item = await InventoryModel.findByIdAndDelete(id);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
