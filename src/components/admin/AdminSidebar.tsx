'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  MdDashboard,
  MdShoppingCart,
  MdInventory,
  MdSettings,
  MdLogout,
  MdClose,
} from 'react-icons/md';

const navItems = [
  { href: '/admin/default', label: 'Dashboard', icon: MdDashboard },
  { href: '/admin/orders', label: 'Orders', icon: MdShoppingCart },
  { href: '/admin/inventory', label: 'Inventory', icon: MdInventory },
  { href: '/admin/settings', label: 'Settings', icon: MdSettings },
];

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  pathname: string;
}

export default function AdminSidebar({ open, setOpen, pathname }: Props) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    toast.success('Logged out successfully');
    await logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-navy-700">
        <span className="text-3xl">🎁</span>
        <div>
          <p className="font-bold text-navy-900 dark:text-white text-sm leading-tight">
            Maxii Art
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <Icon className="text-xl flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 pb-6 border-t border-gray-200 dark:border-navy-700 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
        >
          <MdLogout className="text-xl" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden xl:block fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-navy-800 shadow-xl z-40">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="xl:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`xl:hidden fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-navy-800 shadow-xl z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          onClick={() => setOpen(false)}
        >
          <MdClose className="text-2xl" />
        </button>
        <SidebarContent />
      </div>
    </>
  );
}
