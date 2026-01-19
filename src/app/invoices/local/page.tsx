'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Wallet, Building2, TrendingUp, FileText, Download, Users, BarChart3, ChevronRight, Home, Clock, Shield, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function LocalInvoicePage() {
  const [stats, setStats] = useState({
    karachiEntries: 0,
    lahoreEntries: 0,
    cashEntries: 0,
    lastUpdated: ''
  });

  // Load stats from localStorage
  useEffect(() => {
    const today = new Date().toLocaleString();
    
    // Load Karachi entries
    const karachiData = localStorage.getItem('karachi-ledger');
    const karachiEntries = karachiData ? JSON.parse(karachiData).length : 0;
    
    // Load Lahore entries
    const lahoreData = localStorage.getItem('lahore-ledger');
    const lahoreEntries = lahoreData ? JSON.parse(lahoreData).length : 0;
    
    // Load Cash Book entries (you'll need to implement this)
    const cashEntries = 0; // Placeholder

    setStats({
      karachiEntries,
      lahoreEntries,
      cashEntries,
      lastUpdated: today
    });
  }, []);

  const handleExportAll = () => {
    alert('📊 Export feature coming soon! All your data will be exported to Excel format.');
  };

  const handleQuickGuide = () => {
    alert('📚 Quick Guide:\n\n1. Karachi Ledger: For Karachi branch transactions\n2. Lahore Ledger: For Lahore branch transactions\n3. Cash Book: For cash receipts and payments\n\n💡 Data is automatically saved to your browser.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl shadow-xl p-6 md:p-8 text-white overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                    Accounting Dashboard
                  </h1>
                  <p className="text-indigo-100 text-sm sm:text-base">
                    Manage Karachi, Lahore & Cash Book records efficiently
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleQuickGuide}
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Quick Guide
                </Button>
                <Button 
                  onClick={handleExportAll}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-100">Karachi Entries</p>
                    <p className="text-2xl font-bold mt-1">{stats.karachiEntries}</p>
                  </div>
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
                <p className="text-xs text-indigo-200 mt-2">Total transactions</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-100">Lahore Entries</p>
                    <p className="text-2xl font-bold mt-1">{stats.lahoreEntries}</p>
                  </div>
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-green-300" />
                  </div>
                </div>
                <p className="text-xs text-indigo-200 mt-2">Total transactions</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-100">Cash Book</p>
                    <p className="text-2xl font-bold mt-1">{stats.cashEntries}</p>
                  </div>
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Wallet className="h-5 w-5 text-purple-300" />
                  </div>
                </div>
                <p className="text-xs text-indigo-200 mt-2">Cash transactions</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-100">Last Updated</p>
                    <p className="text-lg font-bold mt-1 truncate">{stats.lastUpdated.split(',')[0]}</p>
                  </div>
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-300" />
                  </div>
                </div>
                <p className="text-xs text-indigo-200 mt-2">Auto-saves to browser</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Karachi Ledger Card */}
          <Link href="/invoices/local/karachi">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg h-full group hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform"></div>
              
              <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-t-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {stats.karachiEntries} entries
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">Karachi Ledger</CardTitle>
                  <CardDescription className="text-blue-100">
                    Complete account book for Karachi operations
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">Track daily transactions</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">Debit & Credit entries</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">Auto-calculate balance</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">Monthly summary reports</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">Status:</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        stats.karachiEntries > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stats.karachiEntries > 0 ? 'Active' : 'Ready'}
                      </span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg group-hover:shadow-xl">
                    <span className="flex items-center justify-center gap-2">
                      Open Karachi Ledger
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Lahore Ledger Card */}
          <Link href="/invoices/local/lahore">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg h-full group hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform"></div>
              
              <CardHeader className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-t-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {stats.lahoreEntries} entries
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">Lahore Ledger</CardTitle>
                  <CardDescription className="text-emerald-100">
                    Complete account book for Lahore operations
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <span className="text-sm">Track daily transactions</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <span className="text-sm">Debit & Credit entries</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <span className="text-sm">Auto-calculate balance</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <span className="text-sm">Monthly summary reports</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">Status:</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        stats.lahoreEntries > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stats.lahoreEntries > 0 ? 'Active' : 'Ready'}
                      </span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg group-hover:shadow-xl">
                    <span className="flex items-center justify-center gap-2">
                      Open Lahore Ledger
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Cash Book Card */}
          <Link href="/invoices/local/cashbook">
            <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg h-full group hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform"></div>
              
              <CardHeader className="bg-gradient-to-br from-purple-600 to-violet-700 text-white p-6 rounded-t-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Wallet className="h-8 w-8" />
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {stats.cashEntries} entries
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">Cash Book</CardTitle>
                  <CardDescription className="text-purple-100">
                    Track cash receipts and payments
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm">Money received tracking</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm">Money paid tracking</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm">Person-wise summary</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm">Monthly cash totals</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">Status:</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        stats.cashEntries > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stats.cashEntries > 0 ? 'Active' : 'Ready'}
                      </span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white shadow-lg group-hover:shadow-xl">
                    <span className="flex items-center justify-center gap-2">
                      Open Cash Book
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>

        {/* Information & Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Features Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Dashboard Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Auto-Save Security</h4>
                    <p className="text-sm text-gray-600 mt-1">All data is automatically saved to your browser</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Export Options</h4>
                    <p className="text-sm text-gray-600 mt-1">Download data as JSON or print reports</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Live Statistics</h4>
                    <p className="text-sm text-gray-600 mt-1">Real-time entry counts and summaries</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Guide Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <HelpCircle className="h-5 w-5 text-amber-600" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <div className="bg-blue-100 text-blue-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
                    Choose Ledger
                  </h4>
                  <p className="text-sm text-gray-600">Select Karachi, Lahore, or Cash Book based on your needs</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <div className="bg-green-100 text-green-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
                    Add Transactions
                  </h4>
                  <p className="text-sm text-gray-600">Enter debit/credit entries with details and amounts</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <div className="bg-purple-100 text-purple-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
                    Auto-Calculate
                  </h4>
                  <p className="text-sm text-gray-600">System automatically calculates running balances</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <div className="bg-amber-100 text-amber-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
                    Save & Export
                  </h4>
                  <p className="text-sm text-gray-600">Download data or print reports anytime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Your data is secure</p>
                <p className="text-gray-300 text-sm">All information is stored locally in your browser</p>
              </div>
            </div>
            <Button 
              onClick={handleExportAll}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Backup All Data
            </Button>
          </div>
        </div>

      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        /* Smooth transitions */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}