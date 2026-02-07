'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  BarChart2
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/layout/sidebar';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState([
    {
      title: 'Total Invoices',
      value: '0',
      icon: FileText,
      change: '+0%',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'FBR Approved',
      value: '0',
      icon: CheckCircle,
      change: '+0%',
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Pending',
      value: '0',
      icon: Clock,
      change: '0%',
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Total Revenue',
      value: 'Rs. 0',
      icon: DollarSign,
      change: '+0%',
      color: 'text-purple-600 bg-purple-100'
    }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // ✅ NO AUTH CHECK - Dashboard is public
        // Just load data if available
        const { data: { user } } = await supabase.auth.getUser();

        // If user exists, load their stats
        if (user) {
          const { data: invoices, error } = await supabase
            .from('invoices')
            .select('*', { head: true, count: 'exact' })
            .eq('user_id', user.id);

          if (!error && invoices) {
            const count = invoices.length;

            setStats([
              {
                title: 'Total Invoices',
                value: count.toString(),
                icon: FileText,
                change: '+0%',
                color: 'text-blue-600 bg-blue-100'
              },
              {
                title: 'FBR Approved',
                value: '0',
                icon: CheckCircle,
                change: '+0%',
                color: 'text-green-600 bg-green-100'
              },
              {
                title: 'Pending',
                value: '0',
                icon: Clock,
                change: '0%',
                color: 'text-yellow-600 bg-yellow-100'
              },
              {
                title: 'Total Revenue',
                value: 'Rs. 0',
                icon: DollarSign,
                change: '+0%',
                color: 'text-purple-600 bg-purple-100'
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        // Keep default stats
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:ml-64 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - Proper margin for desktop sidebar */}
      <div className="md:ml-64 min-h-screen">
        {/* Header - Sticky with proper mobile spacing */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="pl-14 sm:pl-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  AI Fashion Accounting Overview
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg ml-14 sm:ml-0">
                <Clock className="h-4 w-4" />
                <span className="font-medium">PKT:</span>
                <span className="font-semibold text-gray-700">
                  {new Date().toLocaleTimeString('en-PK', {
                    timeZone: 'Asia/Karachi',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-4 sm:p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="shadow-sm hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>{stat.change} from last month</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mt-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  FBR Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Generate FBR digital invoices
                </p>
                <Link href="/invoices/create">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Create FBR Invoice
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  Local Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Manage local ledgers & cash book
                </p>
                <Link href="/invoices/local">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Open Local Invoices
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart2 className="h-5 w-5 text-purple-600" />
                  Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  View detailed analytics and reports
                </p>
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Invoice system ready
                    </p>
                    <p className="text-xs text-gray-500">Welcome to AI Fashion Accounting</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-green-100 p-2 rounded-lg shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      System online
                    </p>
                    <p className="text-xs text-gray-500">All features available</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Create FBR digital invoices (no login required)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Login to access Local Invoices (Karachi, Lahore, Cash Book)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      All data automatically synced to cloud
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}