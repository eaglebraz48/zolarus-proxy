// src/app/layout.tsx
'use client';

import './globals.css';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import ChatWidget from '@/components/ChatWidget';
import Header from '@/components/header';
import BagIcon from '@/components/icons/Bag';


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <Suspense fallback={null}>
          <Header />
          {children}
          <ChatWidget />
        </Suspense>
      </body>
    </html>
  );
}
