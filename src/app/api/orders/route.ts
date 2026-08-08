import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { authenticateRequest } from '@/lib/auth';
import { orderSchema } from '@/schemas/order';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { sequenceNo: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;

    const OrderModel = Order as any;
    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(query),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
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

    const OrderModel = Order as any;
    const order = new OrderModel({
      ...parsed.data,
      orderDate: new Date(parsed.data.orderDate),
      completionDate: parsed.data.completionDate
        ? new Date(parsed.data.completionDate)
        : undefined,
    });

    await order.save();
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
