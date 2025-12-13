'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BookingDetailsPage = ({ params }) => {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          &larr; Back to Bookings
        </button>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Booking Details</h1>
      </div>

      {/* Booking Information */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Booking Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Client Name</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.clientName}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Client Contact</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.clientContact}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Massage Type</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.massageType}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Session Time</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.sessionTime}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Date</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{formatDate(booking.massageDate)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Time Slot</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">
              {formatTime12Hour(booking.massageTime)} - {formatTime12Hour(booking.massageEndTime)}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Staff</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.staffDetails?.name || 'N/A'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Room Number</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.roomNumber}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Branch</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.branch?.name || 'N/A'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Created By</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">{booking.createdBy}</p>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Payment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Massage Price</h3>
            <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">₹{booking.massagePrice}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Other Payment</h3>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">₹{booking.otherPayment || 0}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Cash Payment</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">₹{booking.cash || 0}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Card Payment</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">₹{booking.card || 0}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">UPI Payment</h3>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-50">₹{booking.upi || 0}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Total Paid</h3>
            <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
              ₹{(booking.cash || 0) + (booking.card || 0) + (booking.upi || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Update History */}
      {booking.updateHistory && booking.updateHistory.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Update History</h2>
          <div className="space-y-4">
            {booking.updateHistory.map((update, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">Updated by: {update.updatedBy}</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{formatDateTime(update.updatedAt)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {update.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="text-sm">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{change.field}:</span>{' '}
                      <span className="text-red-600 dark:text-red-400 line-through">₹{change.oldValue}</span>{' '}
                      <span className="text-zinc-900 dark:text-zinc-50">→</span>{' '}
                      <span className="text-green-600 dark:text-green-400">₹{change.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.updateHistory && booking.updateHistory.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Update History</h2>
          <p className="text-gray-500 dark:text-zinc-400">No updates have been made to this booking.</p>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPage;
