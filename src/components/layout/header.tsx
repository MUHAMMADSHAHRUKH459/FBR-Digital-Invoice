'use client';

import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center justify-between border-b bg-white px-3 sm:px-4 md:px-6 shadow-sm">
      {/* Left side - Title */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
          Welcome Back!
        </h2>
        <p className="hidden sm:block text-xs sm:text-sm text-gray-500 truncate">
          Manage your invoices efficiently
        </p>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
        {/* Notification Bell */}
        <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        {/* User Profile */}
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-blue-600 text-white shrink-0">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          
          {/* User Info - Hidden on very small screens */}
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[100px] md:max-w-none">
              Muhammad Irfan
            </p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}