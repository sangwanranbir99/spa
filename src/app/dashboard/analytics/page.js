'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import { Calendar, TrendingUp, DollarSign, Users, CreditCard, Smartphone, Banknote, Receipt } from 'lucide-react';

// Get today's date in local timezone
const getTodayDate = () => {
  const today = new Date();
  return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

const AnalyticsPage = () => {
  const router = useRouter();
  const { selectedBranch, getBranchId, mounted } = useBranch();

  const [selectedDate, setSelectedDate] = useState(''); // Initialize empty to avoid hydration mismatch
  const [dailyStats, setDailyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    // Only admin can access analytics
    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setRole(userRole);
    setSelectedDate(getTodayDate()); // Set date on client-side to avoid hydration mismatch
  }, [router]);

  useEffect(() => {
    if (mounted && role === 'admin' && selectedDate) {
      fetchAnalytics();
    }
  }, [selectedDate, selectedBranch, mounted, role]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const date = new Date(selectedDate);
      const day = date.getDate();
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const branchId = getBranchId();

      const branchParam = branchId ? `&branchId=${branchId}` : '';

      // Fetch daily stats
      const dailyResponse = await fetch(
        `/api/bookings/stats?date=${day}&month=${month}${branchParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const dailyData = await dailyResponse.json();
      setDailyStats(dailyData.stats);

      // Fetch monthly stats
      const monthlyResponse = await fetch(
        `/api/bookings/stats?month=${month}${branchParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const monthlyData = await monthlyResponse.json();
      setMonthlyStats(monthlyData.stats);

      // Fetch yearly stats (January 1st to current date)
      const year = date.getFullYear();
      const yearlyResponse = await fetch(
        `/api/bookings/stats?year=${year}${branchParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const yearlyData = await yearlyResponse.json();
      setYearlyStats(yearlyData.stats);

      // Fetch expense stats
      const expenseResponse = await fetch(
        `/api/expenses/stats?date=${selectedDate}${branchParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const expenseData = await expenseResponse.json();
      setExpenseStats(expenseData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return '₹' + (parseFloat(amount) || 0).toLocaleString('en-IN');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const StatsCard = ({ title, stats, icon: Icon, type }) => {
    if (!stats) return null;

    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
            {Icon && <Icon className="h-6 w-6 mr-2" />}
            {title}
          </h2>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {type === 'daily' ? formatDate(selectedDate) :
             type === 'monthly' ? new Date(selectedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) :
             `Jan 1 - ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </span>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Bookings</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalClients}</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Other Payments</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(stats.totalOtherPayment)}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(stats.totalPayments)}
              </p>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">Payment Methods</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Banknote className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Cash</p>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(stats.paymentStats.cash.totalAmount)}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Card</p>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(stats.paymentStats.card.totalAmount)}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Smartphone className="h-5 w-5 text-purple-600 mr-2" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">UPI</p>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(stats.paymentStats.upi.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ExpenseStatsCard = ({ stats }) => {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
            <Receipt className="h-6 w-6 mr-2" />
            Expense Statistics
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Daily Expenses */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Daily Expenses</p>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(stats?.dailyTotal || 0)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              {stats?.dailyCount || 0} {(stats?.dailyCount || 0) === 1 ? 'expense' : 'expenses'}
            </p>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Monthly Expenses</p>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(stats?.monthlyTotal || 0)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              {stats?.monthlyCount || 0} {(stats?.monthlyCount || 0) === 1 ? 'expense' : 'expenses'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted || !role || !selectedDate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-zinc-700 dark:text-zinc-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Analytics Dashboard</h1>
        {selectedBranch && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Viewing analytics for: {selectedBranch.name}
          </p>
        )}
        {!selectedBranch && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Viewing analytics across all branches
          </p>
        )}
      </div>

      {/* Date Selector */}
      <div className="mb-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Month: {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Daily & Monthly Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatsCard
              title="Daily Statistics"
              stats={dailyStats}
              icon={Calendar}
              type="daily"
            />
            <StatsCard
              title="Monthly Statistics"
              stats={monthlyStats}
              icon={TrendingUp}
              type="monthly"
            />
          </div>

          {/* Yearly Statistics */}
          <div className="grid grid-cols-1 gap-6">
            <StatsCard
              title="Yearly Statistics"
              stats={yearlyStats}
              icon={TrendingUp}
              type="yearly"
            />
          </div>

          {/* Expense Statistics */}
          <ExpenseStatsCard stats={expenseStats} />
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
