'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderSchema, OrderInput } from '@/schemas/order';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MdClose } from 'react-icons/md';

interface OrderRow {
  _id: string;
  sequenceNo?: string;
  orderDate?: string | Date;
  completionDate?: string | Date;
  customerName?: string;
  phone?: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  advanceAmount?: number;
  remainingAmount?: number;
  paymentMethod?: string;
  status?: string;
  address?: string;
  notes?: string;
}

interface Props {
  order: OrderRow | null;
  onClose: () => void;
  onSaved: () => void;
}

type PM = 'Cash' | 'UPI' | 'Bank Transfer';
type OS = 'Pending' | 'In Progress' | 'Completed' | 'Delivered' | 'Cancelled';

function fmt(d: Date | string | undefined): string {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
}

function buildDefaults(order: OrderRow | null): OrderInput {
  return {
    orderDate: fmt(order?.orderDate) || fmt(new Date()),
    completionDate: fmt(order?.completionDate) || '',
    customerName: order?.customerName || '',
    phone: order?.phone || '',
    productName: order?.productName || '',
    quantity: order?.quantity ?? 1,
    totalAmount: order?.totalAmount ?? 0,
    advanceAmount: order?.advanceAmount ?? 0,
    paymentMethod: (order?.paymentMethod as PM) || 'Cash',
    status: (order?.status as OS) || 'Pending',
    address: order?.address || '',
    notes: order?.notes || '',
  };
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-gray-300 dark:placeholder-gray-500';
const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide';

export default function OrderModal({ order, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: buildDefaults(order),
  });

  const totalAmount = watch('totalAmount');
  const advanceAmount = watch('advanceAmount');

  useEffect(() => {
    setRemaining((Number(totalAmount) || 0) - (Number(advanceAmount) || 0));
  }, [totalAmount, advanceAmount]);

  useEffect(() => { reset(buildDefaults(order)); }, [order, reset]);

  const onSubmit = async (data: OrderInput) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        quantity: Number(data.quantity) || 1,
        totalAmount: Number(data.totalAmount) || 0,
        advanceAmount: Number(data.advanceAmount) || 0,
      };
      if (order?._id) {
        await api.put(`/orders/${order._id}`, payload);
        toast.success('Order updated');
      } else {
        await api.post('/orders', payload);
        toast.success('Order created');
      }
      onSaved();
    } catch (err: unknown) {
      const details = (err as { response?: { data?: { details?: Record<string, string[]> } } })?.response?.data?.details;
      if (details) {
        toast.error(Object.values(details).flat()[0] || 'Validation error');
      } else {
        toast.error('Failed to save order');
      }
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    Pending: 'text-yellow-600',
    'In Progress': 'text-blue-600',
    Completed: 'text-green-600',
    Delivered: 'text-teal-600',
    Cancelled: 'text-red-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-navy-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col">

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 dark:bg-navy-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">
              {order ? '✎' : '+'}
            </div>
            <div>
              <h2 className="font-bold text-navy-900 dark:text-white text-base">
                {order ? `Edit ${order.sequenceNo || 'Order'}` : 'New Order'}
              </h2>
              <p className="text-xs text-gray-400">Fill in the details below</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-400 transition">
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-5 py-4" noValidate>

          {/* Section: Customer */}
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Customer Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label className={labelCls}>Customer Name <span className="text-red-400 normal-case">*</span></label>
              <input type="text" {...register('customerName')} placeholder="Priya Sharma" className={inputCls} />
              {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input type="tel" {...register('phone')} placeholder="9876543210" className={inputCls} />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <input type="text" {...register('address')} placeholder="Delivery address..." className={inputCls} />
            </div>
          </div>

          {/* Section: Product */}
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Product Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label className={labelCls}>Product Name <span className="text-red-400 normal-case">*</span></label>
              <input type="text" {...register('productName')} placeholder="Custom Gift Hamper" className={inputCls} />
              {errors.productName && <p className="text-red-400 text-xs mt-1">{errors.productName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" {...register('quantity', { valueAsNumber: true })} min={1} placeholder="1" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Order Date</label>
              <input type="date" {...register('orderDate')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expected Completion</label>
              <input type="date" {...register('completionDate')} className={inputCls} />
            </div>
          </div>

          {/* Section: Payment */}
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Payment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label className={labelCls}>Total Amount (₹)</label>
              <input type="number" {...register('totalAmount', { valueAsNumber: true })} min={0} step="0.01" placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Advance Received (₹)</label>
              <input type="number" {...register('advanceAmount', { valueAsNumber: true })} min={0} step="0.01" placeholder="0" className={inputCls} />
              {errors.advanceAmount && <p className="text-red-400 text-xs mt-1">{errors.advanceAmount.message}</p>}
            </div>

            {/* Remaining — read only */}
            <div>
              <label className={labelCls}>Remaining (₹)</label>
              <div className={`${inputCls} ${remaining > 0 ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500 font-bold border-orange-200 dark:border-orange-500/30' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-bold border-green-200 dark:border-green-500/30'} cursor-default`}>
                ₹{remaining.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <label className={labelCls}>Payment Method</label>
              <select {...register('paymentMethod')} className={inputCls}>
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 UPI</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Section: Status & Notes */}
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Status & Notes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Order Status</label>
              <select {...register('status')} className={`${inputCls} ${STATUS_COLORS[watch('status') || 'Pending']} font-semibold`}>
                <option value="Pending">⏳ Pending</option>
                <option value="In Progress">🔧 In Progress</option>
                <option value="Completed">✅ Completed</option>
                <option value="Delivered">🚚 Delivered</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea {...register('notes')} rows={2} placeholder="Any special instructions..." className={`${inputCls} resize-none`} />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-navy-700">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Saving...</>
            ) : (
              order ? '✓ Update Order' : '+ Create Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
