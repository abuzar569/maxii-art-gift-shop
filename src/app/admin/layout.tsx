'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lightPrimary dark:bg-navy-900">
        <div className="text-center">
          <div className="text-4xl mb-4">🎁</div>
          <p className="text-navy-700 dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-full w-full bg-background-100 dark:bg-background-900">
      <AdminSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        pathname={pathname}
      />
      <div className="h-full w-full font-dm dark:bg-navy-900">
        <main className="mx-2.5 flex-none transition-all dark:bg-navy-900 md:pr-2 xl:ml-[280px]">
          <AdminNavbar onOpenSidenav={() => setSidebarOpen(!sidebarOpen)} />
          <div className="mx-auto min-h-screen p-2 !pt-[10px] md:p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
