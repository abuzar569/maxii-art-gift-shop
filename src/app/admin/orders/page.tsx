'use client';
import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdSearch,
  MdEdit,
  MdDelete,
  MdFileDownload,
  MdPrint,
  MdFilterList,
  MdUploadFile,
} from 'react-icons/md';
import OrderModal from '@/components/admin/OrderModal';
import DeleteModal from '@/components/admin/DeleteModal';
import BulkUploadModal from '@/components/admin/BulkUploadModal';
import { IOrder } from '@/models/Order';

// Using a plain interface to avoid Mongoose Document type complexity
interface OrderRow {
  _id: string;
  sequenceNo: string;
  orderDate: string | Date;
  completionDate?: string | Date;
  customerName: string;
  phone: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  status: string;
  address?: string;
  notes?: string;
}

// Keep IOrder imported to avoid unused import warning
type _IOrder = IOrder;

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  Delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const STATUSES = ['All', 'Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter === 'All' ? '' : statusFilter,
        sort,
        page: String(page),
        limit: '20',
      });
      const res = await api.get(`/orders?${params}`);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sort]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/orders/${deleteId}`);
      toast.success('Order deleted');
      setDeleteId(null);
      fetchOrders();
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter === 'All' ? '' : statusFilter,
        sort,
        limit: '10000',
      });
      const res = await api.get(`/orders?${params}`);
      const rows: OrderRow[] = res.data.orders;

      const headers = [
        'Seq No', 'Order Date', 'Completion Date', 'Customer', 'Phone',
        'Product', 'Qty', 'Total', 'Advance', 'Remaining',
        'Payment', 'Status', 'Address',
      ];
      const csv = [
        headers.join(','),
        ...rows.map((o) =>
          [
            o.sequenceNo,
            o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : '',
            o.completionDate ? new Date(o.completionDate).toLocaleDateString('en-IN') : '',
            `"${o.customerName}"`,
            o.phone,
            `"${o.productName}"`,
            o.quantity,
            o.totalAmount,
            o.advanceAmount,
            o.remainingAmount,
            o.paymentMethod,
            o.status,
            `"${o.address || ''}"`,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handlePrintInvoice = (order: OrderRow) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Invoice ${order.sequenceNo}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1B2559; }
        h1 { color: #422AFB; margin-bottom: 4px; }
        .label { font-weight: bold; min-width: 160px; display: inline-block; }
        .row { margin: 8px 0; }
        hr { border: 1px solid #E0E5F2; margin: 20px 0; }
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; }
      </style></head><body>
      <h1>🎁 Maxii Art</h1><p>Invoice / Order Receipt</p><hr>
      <div class="row"><span class="label">Sequence No:</span> ${order.sequenceNo}</div>
      <div class="row"><span class="label">Customer Name:</span> ${order.customerName}</div>
      <div class="row"><span class="label">Phone:</span> ${order.phone}</div>
      <div class="row"><span class="label">Product:</span> ${order.productName}</div>
      <div class="row"><span class="label">Quantity:</span> ${order.quantity}</div>
      <div class="row"><span class="label">Order Date:</span> ${order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : '-'}</div>
      <div class="row"><span class="label">Completion Date:</span> ${order.completionDate ? new Date(order.completionDate).toLocaleDateString('en-IN') : '-'}</div>
      <hr>
      <div class="row"><span class="label">Total Amount:</span> ₹${order.totalAmount.toLocaleString('en-IN')}</div>
      <div class="row"><span class="label">Advance Received:</span> ₹${order.advanceAmount.toLocaleString('en-IN')}</div>
      <div class="row"><span class="label">Remaining:</span> ₹${order.remainingAmount.toLocaleString('en-IN')}</div>
      <div class="row"><span class="label">Payment Method:</span> ${order.paymentMethod}</div>
      <div class="row"><span class="label">Status:</span> ${order.status}</div>
      ${order.address ? `<div class="row"><span class="label">Address:</span> ${order.address}</div>` : ''}
      <hr><p style="color:#aaa;font-size:12px">Printed on ${new Date().toLocaleString('en-IN')}</p>
      <script>window.print();window.close();</script>
      </body></html>
    `);
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage all customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-2 px-4 py-2 border border-brand-500 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl font-medium text-sm transition"
          >
            <MdUploadFile className="text-lg" /> Bulk Upload
          </button>
          <button
            onClick={() => { setEditOrder(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-sm transition"
          >
            <MdAdd className="text-lg" /> New Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by name, seq no, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-navy-900 dark:text-white text-sm focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition"
          >
            <MdFileDownload className="text-lg" /> Export CSV
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <MdFilterList className="text-gray-400" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-400">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <span className="text-4xl mb-3">📦</span>
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-navy-700 text-left">
                  {['Seq No', 'Order Date', 'Customer', 'Product', 'Total', 'Advance', 'Remaining', 'Payment', 'Status', 'Due Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-navy-700">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition"
                  >
                    <td className="px-4 py-3 font-mono text-brand-500 font-semibold whitespace-nowrap">
                      {order.sequenceNo}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy-900 dark:text-white whitespace-nowrap">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-400">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="max-w-[150px] truncate">{order.productName}</div>
                      <span className="text-xs text-gray-400">Qty: {order.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-navy-900 dark:text-white font-medium whitespace-nowrap">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400 whitespace-nowrap">
                      ₹{order.advanceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-medium whitespace-nowrap">
                      ₹{order.remainingAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {order.paymentMethod}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                      {order.completionDate ? new Date(order.completionDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-500 dark:text-gray-400 transition"
                          title="Print Invoice"
                        >
                          <MdPrint className="text-lg" />
                        </button>
                        <button
                          onClick={() => { setEditOrder(order); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition"
                          title="Edit"
                        >
                          <MdEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() => setDeleteId(order._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition"
                          title="Delete"
                        >
                          <MdDelete className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-navy-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-navy-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-navy-700 transition"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-navy-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-navy-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Form Modal */}
      {showModal && (
        <OrderModal
          order={editOrder}
          onClose={() => { setShowModal(false); setEditOrder(null); }}
          onSaved={() => { setShowModal(false); setEditOrder(null); fetchOrders(); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <DeleteModal
          message="Are you sure you want to delete this order? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onUploaded={() => { fetchOrders(); }}
        />
      )}
    </div>
  );
}
