'use client';

import React, { useState, useEffect,Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import ExpenseModal from '@/components/expenses/ExpenseModal';
import { Plus } from 'lucide-react';

// Get today's date in local timezone
const getTodayDate = () => {
  const today = new Date();
  return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

const ExpensesPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBranch, getBranchId } = useBranch();

  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(''); // Initialize empty to avoid hydration mismatch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingAmount, setEditingAmount] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Check authentication and initialize date on client-side
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    // Only admin and manager can access expenses
    if (role !== 'admin' && role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    setUserRole(role);

    // Check for date query parameter, otherwise use today's date
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    } else {
      setSelectedDate(getTodayDate());
    }

    setMounted(true);
  }, [router, searchParams]);

  // Fetch expenses when date or selected branch changes
  useEffect(() => {
    if (userRole && selectedDate) {
      fetchExpenses(selectedDate);
    }
  }, [selectedDate, userRole, selectedBranch]);

  const fetchExpenses = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const branchId = getBranchId();
      const branchParam = branchId ? `&branchId=${branchId}` : '';

      const response = await fetch(`/api/expenses?date=${date}${branchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError('Failed to fetch expenses. Please try again.');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchExpenses(selectedDate);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete expense');
      }
    } catch (err) {
      setError('Failed to delete expense. Please try again.');
      console.error('Error deleting expense:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleUpdate = async (expenseId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        await fetchExpenses(selectedDate);
        setEditingTitle(null);
        setNewTitle('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update expense');
      }
    } catch (err) {
      setError('Failed to update expense. Please try again.');
      console.error('Error updating expense:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountUpdate = async (expenseId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(newAmount) })
      });

      if (response.ok) {
        await fetchExpenses(selectedDate);
        setEditingAmount(null);
        setNewAmount('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update expense');
      }
    } catch (err) {
      setError('Failed to update expense. Please try again.');
      console.error('Error updating expense:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    fetchExpenses(selectedDate);
  };

  if (!userRole || !mounted) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Expenses</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Date Picker */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Select Date
        </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 border rounded-md w-48 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-zinc-400 text-lg">No expenses found for this date.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Created By</th>
                {userRole === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTitle === expense._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-40 p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handleTitleUpdate(expense._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingTitle(null);
                            setNewTitle('');
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 dark:text-zinc-50">{expense.title}</span>
                        {(userRole === 'admin' || userRole === 'manager') && (
                          <button
                            onClick={() => {
                              setEditingTitle(expense._id);
                              setNewTitle(expense.title);
                            }}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingAmount === expense._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-20 p-1 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handleAmountUpdate(expense._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingAmount(null);
                            setNewAmount('');
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 dark:text-zinc-50">₹{expense.amount}</span>
                        {(userRole === 'admin' || userRole === 'manager') && (
                          <button
                            onClick={() => {
                              setEditingAmount(expense._id);
                              setNewAmount(expense.amount?.toString() || '');
                            }}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                    {expense.createdBy}
                  </td>
                  {userRole === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
