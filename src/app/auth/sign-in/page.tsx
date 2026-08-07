'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/schemas/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightPrimary dark:bg-navy-900">
      <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-2xl shadow-3xl p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎁</div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Gift Shop Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Sign in to manage your orders
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-navy-700 dark:text-white mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="admin@giftshop.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-700 dark:text-white mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Default: admin@giftshop.com / admin123
        </p>
      </div>
    </div>
  );
}
