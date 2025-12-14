'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import { Calendar, Users, TrendingUp, Eye, X } from 'lucide-react';

const EmployeeAnalyticsPage = () => {
  const router = useRouter();
  const { selectedBranch, getBranchId, branchEmployees, mounted } = useBranch();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [stats, setStats] = useState({
    dailyStats: [],
    monthlyStats: [],
    dailyTotals: {},
    monthlyTotals: {}
  });
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    // Only admin can access employee analytics
    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setRole(userRole);
  }, [router]);

  useEffect(() => {
    if (mounted && role === 'admin') {
      fetchEmployeeStats();
    }
  }, [selectedDate, selectedBranch, selectedEmployeeId, mounted, role]);

  const fetchEmployeeStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const date = selectedDate;
      const month = `${new Date(selectedDate).getFullYear()}-${String(new Date(selectedDate).getMonth() + 1).padStart(2, '0')}`;
      const branchId = getBranchId();

      let url = `/api/bookings/stats/employee?date=${date}&month=${month}`;

      if (branchId) {
        url += `&branchId=${branchId}`;
      }

      if (selectedEmployeeId) {
        const selectedEmp = branchEmployees.find(emp => emp._id === selectedEmployeeId);
        if (selectedEmp?.name) {
          url += `&employeeName=${encodeURIComponent(selectedEmp.name)}`;
        }
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setStats(data);

    } catch (error) {
      console.error('Error fetching employee stats:', error);
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
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = branchEmployees.find(emp => emp._id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  if (!mounted || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-zinc-700 dark:text-zinc-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Employee Analytics</h1>
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Date Filter */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-50 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Select Date
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Month: {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Employee Filter */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-50 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Filter by Employee
          </h2>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All Employees</option>
            {branchEmployees.map(employee => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Stats */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
            {activeTab === 'daily' ? 'Daily Overview' : 'Monthly Overview'}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Bookings:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">
                {activeTab === 'daily' ?
                  stats.dailyTotals?.totalDailyBookingCount || 0 :
                  stats.monthlyTotals?.totalMonthlyBookingCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Revenue:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(
                  activeTab === 'daily' ?
                    (stats.dailyTotals?.totalDailyMassagePayment || 0) + (stats.dailyTotals?.totalDailyOtherPayment || 0) :
                    (stats.monthlyTotals?.totalMonthlyMassagePayment || 0) + (stats.monthlyTotals?.totalMonthlyOtherPayment || 0)
                )}
              </span>
            </div>
          </div>
          <button
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
            onClick={() => {
              setSelectedBookings(activeTab === 'daily' ?
                stats.dailyTotals?.dailyBookings || [] :
                stats.monthlyTotals?.monthlyBookings || []);
              setSelectedPeriod(activeTab);
              setSelectedEmployee({ name: 'All Employees' });
              setModalOpen(true);
            }}
            disabled={activeTab === 'daily' ?
              !(stats.dailyTotals?.dailyBookings?.length) :
              !(stats.monthlyTotals?.monthlyBookings?.length)}
          >
            View All Bookings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <button
          className={`py-2 px-4 font-medium transition-colors ${activeTab === 'daily' ?
            'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' :
            'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily Stats
        </button>
        <button
          className={`py-2 px-4 font-medium transition-colors ${activeTab === 'monthly' ?
            'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' :
            'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Stats
        </button>
      </div>

      {/* Stats Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Unique Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Massage Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Other Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {activeTab === 'daily' ? (
                  stats.dailyStats.length > 0 && !stats.dailyStats.every(emp => emp._id === null && emp.dailyBookingCount === 0) ? (
                    stats.dailyStats.map((employee) => (
                      <tr key={employee._id || 'empty'} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {employee.staffName || getEmployeeName(employee._id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {employee.dailyBookingCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {employee.dailyUniqueClients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(employee.dailyMassagePayment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(employee.dailyOtherPayment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(employee.dailyMassagePayment + employee.dailyOtherPayment)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md transition-colors"
                            onClick={() => {
                              setSelectedEmployee({
                                _id: employee._id,
                                name: employee.staffName || getEmployeeName(employee._id)
                              });
                              setSelectedBookings(employee.dailyBookings || []);
                              setSelectedPeriod('daily');
                              setModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-zinc-500 dark:text-zinc-400">
                        {selectedEmployeeId ?
                          `No bookings found for ${getEmployeeName(selectedEmployeeId)} on this date.` :
                          'No daily booking data available for this date.'}
                      </td>
                    </tr>
                  )
                ) : (
                  stats.monthlyStats.length > 0 && !stats.monthlyStats.every(emp => emp._id === null && emp.monthlyBookingCount === 0) ? (
                    stats.monthlyStats.map((employee) => (
                      <tr key={employee._id || 'empty'} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {employee.staffName || getEmployeeName(employee._id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {employee.monthlyBookingCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {employee.monthlyUniqueClients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(employee.monthlyMassagePayment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(employee.monthlyOtherPayment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(employee.monthlyMassagePayment + employee.monthlyOtherPayment)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="flex items-center bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md transition-colors"
                            onClick={() => {
                              setSelectedEmployee({
                                _id: employee._id,
                                name: employee.staffName || getEmployeeName(employee._id)
                              });
                              setSelectedBookings(employee.monthlyBookings || []);
                              setSelectedPeriod('monthly');
                              setModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-zinc-500 dark:text-zinc-400">
                        {selectedEmployeeId ?
                          `No bookings found for ${getEmployeeName(selectedEmployeeId)} in ${new Date(selectedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.` :
                          'No monthly booking data available for this month.'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {modalOpen && (
        <BookingDetailsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          employee={selectedEmployee}
          bookings={selectedBookings}
          period={selectedPeriod}
          formatDate={formatDate}
          formatTime={formatTime}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// Booking Details Modal Component
const BookingDetailsModal = ({ isOpen, onClose, employee, bookings, period, formatDate, formatTime, formatCurrency }) => {
  if (!isOpen) return null;

  const calculateTotalRevenue = () => {
    return bookings.reduce((total, booking) => {
      return total + (parseFloat(booking.massagePrice) || 0) + (parseFloat(booking.otherPayment) || 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-7xl w-full max-h-screen overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-zinc-100 dark:bg-zinc-800 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {employee?.name || 'All'} - {period === 'daily' ? 'Daily' : 'Monthly'} Bookings
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4 flex-grow overflow-y-auto">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Bookings</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{bookings.length}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Revenue</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(calculateTotalRevenue())}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Unique Clients</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {new Set(bookings.map(b => b.clientContact || b.clientName)).size}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Avg Booking Value</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(bookings.length ? calculateTotalRevenue() / bookings.length : 0)}
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-zinc-200 dark:border-zinc-700">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Date</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Time</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Room</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Massage</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Client</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Price</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Cash</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Card</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">UPI</th>
                  <th className="p-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">Other</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking, index) => (
                    <tr key={booking._id || index} className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{formatDate(booking.massageDate)}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{formatTime(booking.massageTime)}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">Room {booking.roomNumber}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{booking.massageType}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{booking.clientName || 'Unknown Client'}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{formatCurrency(booking.massagePrice)}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{formatCurrency(booking.cash || 0)}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{formatCurrency(booking.card || 0)}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{formatCurrency(booking.upi || 0)}</td>
                      <td className="p-2 text-sm text-zinc-700 dark:text-zinc-300">{formatCurrency(booking.otherPayment || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="p-2 text-center text-zinc-500 dark:text-zinc-400">
                      No booking data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-100 dark:bg-zinc-800 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="bg-zinc-500 hover:bg-zinc-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAnalyticsPage;
