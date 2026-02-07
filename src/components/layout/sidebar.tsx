'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  FileText,
  Users,
  Package,
  Settings,
  LogOut,
  BookOpen,
  DollarSign,
  Clock,
  BarChart2,
  Menu,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'FBR Invoices',
      href: '/invoices/create',
      icon: FileText
    },
    {
      name: 'Local Invoices',
      href: '/invoices/local',
      icon: BookOpen
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/10">
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="truncate">Muhammad Shahrukh</span>
        </h1>
        <p className="text-xs text-white/70 mt-1">Accounting System</p>
        <p className="text-xs text-white/50 mt-0.5">Pakistan Standard Time</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-white/10 text-white'
                : 'text-white/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="font-medium text-sm sm:text-base">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-white/10">
        <button
          onClick={() => {
            handleLogout();
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="font-medium text-sm sm:text-base">Logout</span>
        </button>
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Muhammad Shahrukh
          </p>
          <p className="text-xs text-white/50 mt-1">
            {new Date().toLocaleTimeString('en-PK', {
              timeZone: 'Asia/Karachi',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-800 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar - Slides from left */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-indigo-800 to-blue-900 text-white z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar - Always visible */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-gradient-to-b from-indigo-800 to-blue-900 text-white fixed left-0 top-0">
        <SidebarContent />
      </div>
    </>
  );
}