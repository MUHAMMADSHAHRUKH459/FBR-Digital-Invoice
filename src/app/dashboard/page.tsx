'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Users,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const stats = [
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>{stat.change} from last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link 
                href="/invoices/create"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Create FBR Invoice</p>
                  <p className="text-sm text-gray-500">Generate new sales invoice</p>
                </div>
              </Link>

              <Link 
                href="/invoices/local"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Create Local Invoice</p>
                  <p className="text-sm text-gray-500">Non-FBR invoice</p>
                </div>
              </Link>

              <Link 
                href="/customers"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Manage Customers</p>
                  <p className="text-sm text-gray-500">Add or edit customers</p>
                </div>
              </Link>

              <Link 
                href="/products"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Manage Products</p>
                  <p className="text-sm text-gray-500">Add or edit products</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">Create your first invoice to get started!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}