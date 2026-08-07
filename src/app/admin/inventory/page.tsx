'use client';
import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdWarning } from 'react-icons/md';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inventorySchema, InventoryInput } from '@/schemas/inventory';
import DeleteModal from '@/components/admin/DeleteModal';
import { IInventory } from '@/models/Inventory';

interface InventoryRow {
  _id: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit?: string;
  minimumStock: number;
  description?: string;
}

type _IInventory = IInventory;

interface InventoryModalProps {
  item: InventoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}

function InventoryModal({ item, onClose, onSaved }: InventoryModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryInput>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemName: item?.itemName || '',
      category: item?.category || '',
      quantity: item?.quantity || 0,
      unit: item?.unit || 'pcs',
      minimumStock: item?.minimumStock || 0,
      description: item?.description || '',
    },
  });

  useEffect(() => {
    reset({
      itemName: item?.itemName || '',
      category: item?.category || '',
      quantity: item?.quantity ?? 0,
      unit: item?.unit || 'pcs',
      minimumStock: item?.minimumStock ?? 0,
      description: item?.description || '',
    });
  }, [item, reset]);

  const onSubmit = async (data: InventoryInput) => {
    setLoading(true);
    try {
      if (item?._id) {
        await api.put(`/inventory/${item._id}`, data);
        toast.success('Item updated');
      } else {
        await api.post('/inventory', data);
        toast.success('Item added');
      }
      onSaved();
    } catch {
      toast.error('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-navy-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-700">
          <h2 className="font-bold text-navy-900 dark:text-white">
            {item ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input type="text" {...register('itemName')} placeholder="Gift Box Ribbon" className={inputCls} />
            {errors.itemName && <p className="text-red-500 text-xs mt-1">{errors.itemName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
              <input type="text" {...register('category')} placeholder="Decoration" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Unit</label>
              <input type="text" {...register('unit')} placeholder="pcs, metres..." className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                min={0}
                className={inputCls}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                {...register('minimumStock', { valueAsNumber: true })}
                min={0}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 text-sm hover:bg-gray-50 dark:hover:bg-navy-700 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition disabled:opacity-60">
              {loading ? 'Saving...' : item ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory?search=${encodeURIComponent(search)}`);
      setItems(res.data);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/inventory/${deleteId}`);
      toast.success('Item deleted');
      setDeleteId(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const lowStockCount = items.filter((i) => i.quantity < i.minimumStock).length;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your available items and stock levels
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-sm transition"
        >
          <MdAdd className="text-lg" /> Add Item
        </button>
      </div>

      {/* Low stock warning banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
          <MdWarning className="text-red-500 text-xl flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">{lowStockCount} item{lowStockCount > 1 ? 's' : ''}</span>{' '}
            {lowStockCount > 1 ? 'are' : 'is'} running low on stock. Restock soon!
          </p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search by item name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-400">Loading inventory...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <span className="text-4xl mb-3">📦</span>
            <p className="text-gray-400">No items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-navy-700 text-left">
                  {['Item Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-navy-700">
                {items.map((item) => {
                  const isLow = item.quantity < item.minimumStock;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition">
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy-900 dark:text-white">{item.itemName}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {item.category || '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${isLow ? 'text-red-500' : 'text-navy-900 dark:text-white'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {item.unit || 'pcs'}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {item.minimumStock}
                      </td>
                      <td className="px-5 py-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditItem(item); setShowModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition"
                          >
                            <MdEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => setDeleteId(item._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition"
                          >
                            <MdDelete className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <InventoryModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={() => { setShowModal(false); setEditItem(null); fetchItems(); }}
        />
      )}

      {deleteId && (
        <DeleteModal
          message="Are you sure you want to delete this inventory item? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
