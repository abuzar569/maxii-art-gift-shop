import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Inventory from '@/models/Inventory';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      statsAgg,
      recentOrders,
      todaysOrders,
      dueToday,
      monthlyStats,
      inventoryCount,
    ] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
            },
            completedOrders: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['Completed', 'Delivered']] },
                  1,
                  0,
                ],
              },
            },
            totalRevenue: {
              $sum: {
                $cond: [{ $ne: ['$status', 'Cancelled'] }, '$totalAmount', 0],
              },
            },
            totalAdvance: {
              $sum: {
                $cond: [{ $ne: ['$status', 'Cancelled'] }, '$advanceAmount', 0],
              },
            },
          },
        },
      ]),
      (Order as any)
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('sequenceNo customerName productName status totalAmount createdAt')
        .lean(),
      (Order as any)
        .find({ orderDate: { $gte: today, $lt: tomorrow } })
        .sort({ createdAt: -1 })
        .lean(),
      (Order as any)
        .find({
          completionDate: { $gte: today, $lt: tomorrow },
          status: { $nin: ['Completed', 'Delivered', 'Cancelled'] },
        })
        .sort({ completionDate: 1 })
        .lean(),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            },
            status: { $ne: 'Cancelled' },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      (Inventory as any).countDocuments({ quantity: { $gt: 0 } }),
    ]);

    const stats = statsAgg[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      totalAdvance: 0,
    };

    return NextResponse.json({
      totalOrders: stats.totalOrders,
      pendingOrders: stats.pendingOrders,
      completedOrders: stats.completedOrders,
      totalRevenue: stats.totalRevenue,
      totalAdvanceReceived: stats.totalAdvance,
      remainingBalance: stats.totalRevenue - stats.totalAdvance,
      availableProducts: inventoryCount,
      recentOrders,
      todaysOrders,
      dueToday,
      monthlyStats,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
