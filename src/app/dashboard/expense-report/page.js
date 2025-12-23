'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const current = new Date();
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
};

const ExpenseReport = () => {
  const router = useRouter();
  const { selectedBranch, getBranchId, mounted } = useBranch();

  const [selectedDate, setSelectedDate] = useState(''); // Initialize empty to avoid hydration mismatch
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [userRole, setUserRole] = useState(null);

  // Check authentication and set initial date
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    // Only admin and manager can access this page
    if (role !== 'admin' && role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    setUserRole(role);
    setSelectedDate(getCurrentMonth()); // Set date on client-side to avoid hydration mismatch
  }, [router]);

  // Parse year and month from selectedDate
  const [year, month] = selectedDate ? selectedDate.split('-') : ['', ''];

  // Fetch expense data whenever the month, year, or selected branch changes
  useEffect(() => {
    if (selectedDate && userRole) {
      fetchExpenseReport();
    }
  }, [selectedDate, selectedBranch, userRole]);

  const fetchExpenseReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const branchId = getBranchId();

      // Build query parameters
      const branchParam = branchId ? `&branchId=${branchId}` : '';

      const response = await fetch(
        `/api/expenses/monthly-report?year=${year}&month=${parseInt(month)}${branchParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      setTotalExpenses(data.totalCount || 0);
      setTotalAmount(data.totalAmount || 0);
      setExpenseData(data.result || []);
    } catch (err) {
      setError('Error fetching expense data');
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarCells = () => {
    if (!year || !month) return [];

    const cells = [];
    // Determine the weekday of the 1st day of the month
    const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1).getDay();
    // Total days in the selected month
    const totalDays = new Date(parseInt(year), parseInt(month), 0).getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(null);
    }

    // Add each day number for the month
    for (let day = 1; day <= totalDays; day++) {
      cells.push(day);
    }

    return cells;
  };

  const calendarCells = generateCalendarCells();

  // Format month name for display
  const monthName = year && month
    ? new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
    : '';

  // Function to determine cell background color based on expense count
  const getCellColor = (count) => {
    if (count === 0) return 'bg-gray-50 dark:bg-zinc-800';
    if (count < 3) return 'bg-orange-50 dark:bg-orange-900/30';
    if (count < 5) return 'bg-orange-100 dark:bg-orange-800/40';
    return 'bg-orange-200 dark:bg-orange-700/50';
  };

  // Get current day for highlighting today in calendar
  const today = new Date();
  const isCurrentMonth = year && month && today.getFullYear() === parseInt(year) && today.getMonth() === parseInt(month) - 1;
  const currentDay = today.getDate();

  // Helper function to format date as YYYY-MM-DD
  const formatDateString = (year, month, day) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return '₹' + (parseFloat(amount) || 0).toLocaleString('en-IN');
  };

  // Handle day click - redirect to expenses page with date
  const handleDayClick = (day) => {
    const dateStr = formatDateString(year, parseInt(month), day);
    router.push(`/dashboard/expenses?date=${dateStr}`);
  };

  // Show loading while mounting
  if (!mounted || !userRole || !selectedDate) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-zinc-700 dark:text-zinc-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md dark:shadow-zinc-800">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-zinc-100">
        Monthly Expense Report
      </h1>

      {/* Top controls and stats */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <label htmlFor="monthInput" className="mr-2 font-medium text-gray-700 dark:text-zinc-300">
            Select Month:
          </label>
          <input
            id="monthInput"
            type="month"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div className="flex space-x-4">
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center min-w-32">
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalExpenses}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center min-w-32">
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Total Amount</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Branch info */}
      {selectedBranch && (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Viewing expenses for: <span className="font-medium">{selectedBranch.name}</span>
        </p>
      )}
      {!selectedBranch && userRole === 'admin' && (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Viewing expenses across all branches
        </p>
      )}

      {/* Calendar header */}
      <h2 className="text-xl font-semibold text-center mb-6 text-gray-700 dark:text-zinc-300">
        {`${monthName} ${year}`}
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 dark:text-red-400 p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      ) : (
        <div>
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <div key={idx} className="text-center font-medium text-gray-500 dark:text-zinc-400 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, index) => {
              if (cell === null) {
                return <div key={`empty-${index}`} className="h-24"></div>;
              }

              // Create the date string for this cell - ensure proper formatting
              const formattedDateString = formatDateString(year, parseInt(month), cell);

              // Find matching expense data for this day
              const expenseForDay = expenseData.find(
                (item) => item._id === formattedDateString
              );
              const expenseCount = expenseForDay ? expenseForDay.count : 0;
              const expenseAmount = expenseForDay ? expenseForDay.totalAmount : 0;

              // Check if this is today
              const isToday = isCurrentMonth && cell === currentDay;

              return (
                <div
                  key={`day-${index}`}
                  role="button"
                  onClick={() => handleDayClick(cell)}
                  className={`border ${isToday ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-700' : 'border-gray-200 dark:border-zinc-700'}
                              rounded-md h-24 flex flex-col items-center justify-start p-2
                              ${getCellColor(expenseCount)} transition-all duration-200
                              hover:shadow-md hover:scale-105 hover:z-10 cursor-pointer`}
                >
                  <div className={`text-lg w-8 h-8 rounded-full flex items-center justify-center
                                  ${isToday ? 'bg-orange-500 text-white font-bold' : 'font-medium dark:text-zinc-100'}`}>
                    {cell}
                  </div>

                  <div className="text-center mt-1">
                    <div className={`font-medium text-sm ${expenseCount > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-zinc-500'}`}>
                      {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
                    </div>
                    {expenseAmount > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency(expenseAmount)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex justify-center items-center space-x-4 text-sm text-gray-600 dark:text-zinc-400">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-50 dark:bg-orange-900/30 border border-gray-200 dark:border-zinc-700 rounded mr-2"></div>
              <span>1-2 Expenses</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-100 dark:bg-orange-800/40 border border-gray-200 dark:border-zinc-700 rounded mr-2"></div>
              <span>3-4 Expenses</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-200 dark:bg-orange-700/50 border border-gray-200 dark:border-zinc-700 rounded mr-2"></div>
              <span>5+ Expenses</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseReport;
