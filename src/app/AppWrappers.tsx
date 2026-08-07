'use client';
import React, { ReactNode } from 'react';
import 'styles/App.css';
import 'styles/Contact.css';
import 'styles/MiniCalendar.css';
import 'styles/index.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';

import dynamic from 'next/dynamic';

const _NoSSR = ({ children }: { children: ReactNode }) => (
  <React.Fragment>{children}</React.Fragment>
);

const NoSSR = dynamic(() => Promise.resolve(_NoSSR), {
  ssr: false,
});

export default function AppWrappers({ children }: { children: ReactNode }) {
  return (
    <NoSSR>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: { background: '#1B254B', color: '#fff' },
          }}
        />
      </AuthProvider>
    </NoSSR>
  );
}
