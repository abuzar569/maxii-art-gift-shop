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

function formatDate(d: Date | string | undefined): string {
  if (!d) return '';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function buildDefaults(order: OrderRow | null): OrderInput {
  return {
    orderDate: formatDate(order?.orderDate) || formatDate(new Date()),
    completionDate: formatDate(order?.completionDate) || '',
    customerName: order?.customerName || '',
    phone: order?.phone || '',
    productName: order?.productName || '',
    quantity: order?.quantity || 1,
    totalAmount: order?.totalAmount || 0,
    advanceAmount: order?.advanceAmount || 0,
    paymentMethod: (order?.paymentMethod as PM) || 'Cash',
    status: (order?.status as OS) || 'Pending',
    address: order?.address || '',
    notes: order?.notes || '',
  };
}

export default function OrderModal({ order, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: buildDefaults(order),
  });

  const totalAmount = watch('totalAmount');
  const advanceAmount = watch('advanceAmount');

  useEffect(() => {
    const t = Number(totalAmount) || 0;
    const a = Number(advanceAmount) || 0;
    setRemaining(t - a);
  }, [totalAmount, advanceAmount]);

  useEffect(() => {
    reset(buildDefaults(order));
  }, [order, reset]);

  const onSubmit = async (data: OrderInput) => {
    setLoading(true);
    try {
      // Ensure numbers are sent as numbers, not strings
      const payload = {
        ...data,
        quantity: Number(data.quantity),
        totalAmount: Number(data.totalAmount),
        advanceAmount: Number(data.advanceAmount),
      };
      if (order?._id) {
        await api.put(`/orders/${order._id}`, payload);
        toast.success('Order updated successfully');
      } else {
        await api.post('/orders', payload);
        toast.success('Order created successfully');
      }
      onSaved();
    } catch (err: unknown) {
      const details = (
        err as { response?: { data?: { details?: Record<string, string[]> } } }
      )?.response?.data?.details;
      if (details) {
        const msgs = Object.values(details).flat();
        toast.error(msgs[0] || 'Validation error');
      } else {
        toast.error('Failed to save order');
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    error,
    children,
    required,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-700">
          <h2 className="text-lg font-bold text-navy-900 dark:text-white">
            {order ? 'Edit Order' : 'New Order'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-500 transition"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-6 py-4"
          noValidate
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Order Date" error={errors.orderDate?.message} required>
              <input type="date" {...register('orderDate')} className={inputCls} />
            </Field>
            <Field
              label="Expected Completion Date"
              error={errors.completionDate?.message}
            >
              <input
                type="date"
                {...register('completionDate')}
                className={inputCls}
              />
            </Field>
            <Field
              label="Customer Name"
              error={errors.customerName?.message}
              required
            >
              <input
                type="text"
                {...register('customerName')}
                placeholder="Priya Sharma"
                className={inputCls}
              />
            </Field>
            <Field label="Phone Number" error={errors.phone?.message} required>
              <input
                type="tel"
                {...register('phone')}
                placeholder="9876543210"
                className={inputCls}
              />
            </Field>
            <Field
              label="Product Name"
              error={errors.productName?.message}
              required
            >
              <input
                type="text"
                {...register('productName')}
                placeholder="Custom Gift Hamper"
                className={inputCls}
              />
            </Field>
            <Field label="Quantity" error={errors.quantity?.message} required>
              <input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                min={1}
                className={inputCls}
              />
            </Field>
            <Field
              label="Total Amount (₹)"
              error={errors.totalAmount?.message}
              required
            >
              <input
                type="number"
                {...register('totalAmount', { valueAsNumber: true })}
                min={0}
                step="0.01"
                className={inputCls}
              />
            </Field>
            <Field
              label="Advance Amount Received (₹)"
              error={errors.advanceAmount?.message}
              required
            >
              <input
                type="number"
                {...register('advanceAmount', { valueAsNumber: true })}
                min={0}
                step="0.01"
                className={inputCls}
              />
            </Field>

            {/* Remaining (read-only) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Remaining Amount (₹)
              </label>
              <div
                className={`${inputCls} bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold cursor-default`}
              >
                ₹{remaining.toLocaleString('en-IN')}
              </div>
            </div>

            <Field
              label="Payment Method"
              error={errors.paymentMethod?.message}
              required
            >
              <select {...register('paymentMethod')} className={inputCls}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </Field>
            <Field label="Order Status" error={errors.status?.message} required>
              <select {...register('status')} className={inputCls}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address" error={errors.address?.message}>
                <textarea
                  {...register('address')}
                  rows={2}
                  placeholder="Delivery address..."
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes" error={errors.notes?.message}>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Any special instructions..."
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-navy-700">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-200 dark:border-navy-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition disabled:opacity-60"
          >
            {loading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
