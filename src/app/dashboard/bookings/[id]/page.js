'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditPaymentModal from '@/components/bookings/EditPaymentModal';

const BookingDetailsPage = ({ params }) => {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
  }, []);

  const fetchBookingDetails = async () => {
    try {
      const { id } = await params;
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/bookings/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
      } else {
        setError(data.message || 'Failed to fetch booking details');
      }
    } catch (err) {
      setError('Failed to fetch booking details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [params, router]);

  const formatTime12Hour = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleUpdateSuccess = (updatedBooking) => {
    setBooking(updatedBooking);
    fetchBookingDetails();
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">No booking found</div>
      </div>
    );
  }

  const totalPayment = (booking.cash || 0) + (booking.card || 0) + (booking.upi || 0);
  const totalPrice = (booking.massagePrice || 0) + (booking.otherPayment || 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Bookings
        </button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Booking Details</h1>
          {(userRole === 'admin' || userRole === 'manager' || userRole === 'employee') && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Edit Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Booking Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Client Name</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.clientName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Contact</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.clientContact}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Massage Type</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.massage?.name || booking.massageType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Session Time</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.sessionTime}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Date</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatDate(booking.massageDate)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Time Slot</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {formatTime12Hour(booking.massageTime)} - {formatTime12Hour(booking.massageEndTime)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Staff</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.staffDetails?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Room Number</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.roomNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Branch</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.branch?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Created By</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{booking.createdBy}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment Breakdown
          </h2>
          <div className="space-y-3">
            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Massage Price</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">₹{booking.massagePrice || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Other Payment</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">₹{booking.otherPayment || 0}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-600">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Total Price</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg mt-4">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 uppercase">Payment Methods</p>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Cash</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">₹{booking.cash || 0}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Card</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">₹{booking.card || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">UPI</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">₹{booking.upi || 0}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-600">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Total Paid</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">₹{totalPayment.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update History */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mt-6 border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Payment History
        </h2>
        {booking.updateHistory && booking.updateHistory.length > 0 ? (
          <div className="space-y-4">
            {booking.updateHistory.map((update, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-r-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{update.updatedBy}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(update.updatedAt)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {update.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="text-sm bg-white dark:bg-zinc-900 p-2 rounded">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50 capitalize">
                        {change.field.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>{' '}
                      <span className="text-red-600 dark:text-red-400 line-through">₹{change.oldValue}</span>
                      {' → '}
                      <span className="text-green-600 dark:text-green-400 font-semibold">₹{change.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
            No payment updates have been made to this booking yet.
          </p>
        )}
      </div>

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        booking={booking}
        onUpdate={handleUpdateSuccess}
      />
    </div>
  );
};

export default BookingDetailsPage;
