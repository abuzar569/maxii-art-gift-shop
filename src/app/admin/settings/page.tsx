'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordInput } from '@/schemas/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MdLock, MdInfo } from 'react-icons/md';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setLoading(true);
    try {
      await api.post('/auth/change-password', data);
      toast.success('Password changed successfully');
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to change password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="space-y-6 pb-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account</p>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl">
            <MdInfo className="text-xl text-brand-500" />
          </div>
          <h2 className="font-semibold text-navy-900 dark:text-white">Account Info</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-navy-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
            <span className="text-sm font-medium text-navy-900 dark:text-white">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
            <span className="px-3 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-500 text-xs font-medium rounded-full capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
            <MdLock className="text-xl text-orange-500" />
          </div>
          <h2 className="font-semibold text-navy-900 dark:text-white">Change Password</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Current Password
            </label>
            <input
              type="password"
              {...register('currentPassword')}
              placeholder="Enter current password"
              className={inputCls}
            />
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              New Password
            </label>
            <input
              type="password"
              {...register('newPassword')}
              placeholder="Min 8 characters"
              className={inputCls}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* App info */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-navy-900 dark:text-white mb-3">About</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          🎁 Gift Shop Admin Panel — v1.0.0
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Built for managing orders and inventory for your Instagram gift business.
        </p>
      </div>
    </div>
  );
}
