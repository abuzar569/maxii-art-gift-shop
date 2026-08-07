'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  MdShoppingCart,
  MdPendingActions,
  MdCheckCircle,
  MdAttachMoney,
  MdAccountBalanceWallet,
  MdInventory,
  MdPayments,
} from 'react-icons/md';
import Link from 'next/link';

interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalAdvanceReceived: number;
  remainingBalance: number;
  availableProducts: number;
  recentOrders: RecentOrder[];
  todaysOrders: RecentOrder[];
  dueToday: RecentOrder[];
}

interface RecentOrder {
  _id: string;
  sequenceNo: string;
  customerName: string;
  productName: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  completionDate?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  Delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  prefix = '',
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="text-xl text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-navy-900 dark:text-white">
        {prefix}
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
    </div>
  );
}

function OrderBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || ''}`}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">🎁</div>
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={data.totalOrders}
          icon={MdShoppingCart}
          color="bg-brand-500"
        />
        <StatCard
          label="Pending Orders"
          value={data.pendingOrders}
          icon={MdPendingActions}
          color="bg-yellow-500"
        />
        <StatCard
          label="Completed Orders"
          value={data.completedOrders}
          icon={MdCheckCircle}
          color="bg-green-500"
        />
        <StatCard
          label="Total Revenue"
          value={data.totalRevenue}
          icon={MdAttachMoney}
          color="bg-teal-500"
          prefix="₹"
        />
        <StatCard
          label="Advance Received"
          value={data.totalAdvanceReceived}
          icon={MdPayments}
          color="bg-blue-500"
          prefix="₹"
        />
        <StatCard
          label="Remaining Balance"
          value={data.remainingBalance}
          icon={MdAccountBalanceWallet}
          color="bg-orange-500"
          prefix="₹"
        />
        <StatCard
          label="Available Items"
          value={data.availableProducts}
          icon={MdInventory}
          color="bg-purple-500"
        />
      </div>

      {/* Grid: Recent Orders + Due Today */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-700">
            <h2 className="font-semibold text-navy-900 dark:text-white">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs text-brand-500 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-navy-700">
            {data.recentOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No orders yet</p>
            ) : (
              data.recentOrders.map((o) => (
                <div
                  key={o._id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-navy-700/50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-navy-900 dark:text-white">
                      {o.customerName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {o.sequenceNo} · {o.productName}
                    </p>
                  </div>
                  <div className="text-right">
                    <OrderBadge status={o.status} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-navy-700">
            <h2 className="font-semibold text-navy-900 dark:text-white">
              Due for Completion Today
            </h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-navy-700">
            {data.dueToday.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No orders due today 🎉
              </p>
            ) : (
              data.dueToday.map((o) => (
                <div
                  key={o._id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-navy-700/50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-navy-900 dark:text-white">
                      {o.customerName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {o.sequenceNo} · {o.productName}
                    </p>
                  </div>
                  <OrderBadge status={o.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Today's Orders */}
      {data.todaysOrders.length > 0 && (
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-navy-700">
            <h2 className="font-semibold text-navy-900 dark:text-white">
              Today&apos;s Orders
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-navy-700">
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Seq No</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Product</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-navy-700">
                {data.todaysOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                    <td className="px-5 py-3 font-mono text-brand-500 font-medium">{o.sequenceNo}</td>
                    <td className="px-5 py-3 text-navy-900 dark:text-white">{o.customerName}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{o.productName}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3"><OrderBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
