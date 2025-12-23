'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useBranch } from '@/context/BranchContext';
import { useRouter, useSearchParams } from 'next/navigation';

// Get current date in YYYY-MM-DD format (IST)
const getCurrentDate = () => {
  const today = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(today.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

// Separate component that uses useSearchParams - must be wrapped in Suspense
function BookingsContent() {
  const { getBranchId } = useBranch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Check for date query parameter on mount (client-side only)
  useEffect(() => {
    const dateParam = searchParams?.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    setUserRole(role);
  }, [router]);

  useEffect(() => {
    if (userRole) {
      fetchBookings(selectedDate);
    }
  }, [selectedDate, userRole]);

  const formatTime = (time) => {
    if (!time) return '';
    if (time.includes('AM') || time.includes('PM')) return time;

    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchBookings = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const branchId = getBranchId();
      const branchParam = branchId ? `?branchId=${branchId}` : '';

      const response = await fetch(`/api/bookings/date/${date}${branchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Sort bookings by creation time (latest first)
        const sortedBookings = (data.bookings || []).sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setBookings(sortedBookings);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to fetch bookings. Please try again.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchBookings(selectedDate);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete booking');
      }
    } catch (err) {
      setError('Failed to delete booking. Please try again.');
      console.error('Error deleting booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (bookingId) => {
    router.push(`/dashboard/bookings/${bookingId}`);
  };

  if (!userRole) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">All Bookings</h1>
      </div>

      {/* Date Picker - Only Admin can select dates */}
      {userRole === 'admin' && (
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
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No bookings found for this date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => {
            return (
              <div
                key={booking._id}
                onClick={() => handleCardClick(booking._id)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {booking.clientName}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {booking.clientContact}
                    </p>
                  </div>
                  {booking.updateHistory && booking.updateHistory.length > 0 && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-medium">
                      Payment Modified
                    </span>
                  )}
                </div>

                {/* Massage Info */}
                <div className="mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {booking.massage?.name || booking.massageType}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {booking.sessionTime} session
                  </p>
                </div>

                {/* Time & Staff */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">Time</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {formatTime(booking.massageTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">End Time</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {formatTime(booking.massageEndTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">Staff</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {booking?.staffDetails?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">Room</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {booking.roomNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Price</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      ₹{(booking.massagePrice || 0) + (booking.otherPayment || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-500">
                    <span>Cash: ₹{booking.cash || 0}</span>
                    <span>Card: ₹{booking.card || 0}</span>
                    <span>UPI: ₹{booking.upi || 0}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    By {booking.createdBy}
                  </p>
                  {userRole === 'admin' && (
                    <button
                      onClick={(e) => handleDelete(booking._id, e)}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Main page component with Suspense boundary
export default function AllBookingsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
