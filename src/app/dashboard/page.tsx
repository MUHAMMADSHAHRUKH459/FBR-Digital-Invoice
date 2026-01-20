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
  Package,
  BarChart2
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/layout/sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*', { head: true, count: 'exact' })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching invoices:', JSON.stringify(error, null, 2));
          setStats(prevStats => prevStats.map(stat => ({...stat, value: '0'})));
          setLoading(false);
          return;
        }

        if (invoices) {
          const count = error ? 0 : invoices.length;

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
      } catch (error) {
        console.error('Unexpected error in loadStats:', error);
        setStats(prevStats => prevStats.map(stat => ({...stat, value: '0'})));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:ml-64 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                  Muhammad Shahrukh Accounting Overview
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
                  Create Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Generate new invoices for your clients
                </p>
                <Link href="/invoices/local">
                  <Button className="w-full">New Invoice</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Manage your client database
                </p>
                <Button variant="outline" className="w-full">
                  View Clients
                </Button>
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
                      Invoice #001 created
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-green-100 p-2 rounded-lg shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Payment received
                    </p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}