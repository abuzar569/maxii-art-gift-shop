import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { authenticateRequest } from '@/lib/auth';
import { orderSchema } from '@/schemas/order';

interface Params {
  params: Promise<{ id: string }>;
}

const OrderModel = Order as any;

export async function GET(req: NextRequest, { params }: Params) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const order = await OrderModel.findById(id).lean();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
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

    const parsed = orderSchema.safeParse({
      ...body,
      quantity: body.quantity ? Number(body.quantity) : 1,
      totalAmount: body.totalAmount ? Number(body.totalAmount) : 0,
      advanceAmount: body.advanceAmount ? Number(body.advanceAmount) : 0,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const order = await OrderModel.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    Object.assign(order, {
      ...parsed.data,
      orderDate: new Date(parsed.data.orderDate),
      completionDate: parsed.data.completionDate
        ? new Date(parsed.data.completionDate)
        : undefined,
    });

    await order.save();
    return NextResponse.json(order);
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
    const order = await OrderModel.findByIdAndDelete(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
