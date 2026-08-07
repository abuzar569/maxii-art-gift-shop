'use client';
import React, { useEffect, useState } from 'react';
import { MdMenu, MdDarkMode, MdLightMode } from 'react-icons/md';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onOpenSidenav: () => void;
}

export default function AdminNavbar({ onOpenSidenav }: Props) {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'true' : prefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between bg-white/80 dark:bg-navy-800/80 backdrop-blur-md shadow-sm px-4 py-3 rounded-2xl mx-2 mt-2">
      <div className="flex items-center gap-3">
        <button
          className="xl:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-600 dark:text-gray-400"
          onClick={onOpenSidenav}
        >
          <MdMenu className="text-2xl" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleDark}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-600 dark:text-yellow-400 transition"
          title="Toggle dark mode"
        >
          {darkMode ? (
            <MdLightMode className="text-xl" />
          ) : (
            <MdDarkMode className="text-xl" />
          )}
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-lightPrimary dark:bg-navy-700 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-navy-700 dark:text-white hidden sm:block">
            {user?.email}
          </span>
        </div>
      </div>
    </nav>
  );
}
