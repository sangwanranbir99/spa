'use client';

import React, { useEffect, useState } from 'react';
import { useBranch } from '@/context/BranchContext';
import { Building2, Users, Activity, BarChart3, CalendarDays, Receipt, CalendarPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const router = useRouter();
  const { selectedBranch, getBranchId, canSeeAllBranches } = useBranch();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalUsers: 0
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    setUserRole(role);
    setUserName(name);
  }, []);

  // Fetch stats whenever selected branch changes
  useEffect(() => {
    if (userRole) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, userRole]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const branchId = getBranchId();

      // Build query params for branch filtering
      const branchParam = branchId ? `?branchId=${branchId}` : '';

      const branchesRes = await fetch(`/api/branches${branchParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const branches = await branchesRes.json();

      let users = [];
      if (userRole === 'admin' || userRole === 'manager') {
        const usersRes = await fetch(`/api/users${branchParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        users = await usersRes.json();
      }

      setStats({
        totalBranches: branches.length || 0,
        totalUsers: users.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome back, {userName}!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Here is what is happening with your organization today.
        </p>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Your Role</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2 capitalize">
                {userRole}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div> */}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Analytics</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">View business insights</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/dashboard/booking-report')}
                className="flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <CalendarDays className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Monthly Report</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">View booking reports</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/dashboard/expenses')}
                className="flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Expenses</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage expenses</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/dashboard/employees')}
                className="flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Users</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage employees</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/dashboard/bookings')}
                className="flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <CalendarPlus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Create Booking</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Add new booking</p>
                </div>
              </button>
            </>
          )}
          {(userRole === 'manager' || userRole === 'employee') && (
            <>
              <button
                onClick={() => router.push('/dashboard/bookings')}
                className="flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <CalendarPlus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Create Booking</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Add new booking</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/dashboard/expenses')}
                className="flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Expense</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Record expenses</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
