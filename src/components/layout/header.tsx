'use client';

import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
        <p className="text-sm text-gray-500">Manage your invoices efficiently</p>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Muhammad Irfan</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}