'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { useRouter } from 'next/navigation';

const AllBookingsPage = () => {
  const { getBranchId } = useBranch();
  const router = useRouter();

  // Get current date in YYYY-MM-DD format (IST)
  const getCurrentDate = () => {
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(today.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Inline editing states
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingCash, setEditingCash] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [editingUPI, setEditingUPI] = useState(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPriceAmount, setNewPriceAmount] = useState('');
  const [newCashAmount, setNewCashAmount] = useState('');
  const [newCardAmount, setNewCardAmount] = useState('');
  const [newUPIAmount, setNewUPIAmount] = useState('');

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
        setBookings(data.bookings || []);
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

  const handleDelete = async (bookingId) => {
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

  const handleOtherPaymentUpdate = async (bookingId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherPayment: parseFloat(newPaymentAmount) })
      });

      if (response.ok) {
        await fetchBookings(selectedDate);
        setEditingPayment(null);
        setNewPaymentAmount('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update other payment');
      }
    } catch (err) {
      setError('Failed to update other payment. Please try again.');
      console.error('Error updating other payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (bookingId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ massagePrice: parseFloat(newPriceAmount) })
      });

      if (response.ok) {
        await fetchBookings(selectedDate);
        setEditingPrice(null);
        setNewPriceAmount('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update price');
      }
    } catch (err) {
      setError('Failed to update price. Please try again.');
      console.error('Error updating price:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCashUpdate = async (bookingId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cash: parseFloat(newCashAmount) })
      });

      if (response.ok) {
        await fetchBookings(selectedDate);
        setEditingCash(null);
        setNewCashAmount('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update cash payment');
      }
    } catch (err) {
      setError('Failed to update cash payment. Please try again.');
      console.error('Error updating cash payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardUpdate = async (bookingId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ card: parseFloat(newCardAmount) })
      });

      if (response.ok) {
        await fetchBookings(selectedDate);
        setEditingCard(null);
        setNewCardAmount('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update card payment');
      }
    } catch (err) {
      setError('Failed to update card payment. Please try again.');
      console.error('Error updating card payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUPIUpdate = async (bookingId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ upi: parseFloat(newUPIAmount) })
      });

      if (response.ok) {
        await fetchBookings(selectedDate);
        setEditingUPI(null);
        setNewUPIAmount('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update UPI payment');
      }
    } catch (err) {
      setError('Failed to update UPI payment. Please try again.');
      console.error('Error updating UPI payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userRole) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">All Bookings</h1>

      {/* Date Picker - Hidden for employees */}
      {userRole !== 'employee' && (
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
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-zinc-900 border rounded-lg">
            <thead className="bg-gray-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Massage Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Session Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Cash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Card</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">UPI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Other Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Staff Name</th>
                {userRole === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{booking.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{booking.clientContact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{booking.massage?.name || booking.massageType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{booking.sessionTime}</td>

                  {/* Editable Price */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingPrice === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newPriceAmount}
                          onChange={(e) => setNewPriceAmount(e.target.value)}
                          className="w-20 p-1 border rounded dark:bg-zinc-800 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handlePriceUpdate(booking._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPrice(null);
                            setNewPriceAmount('');
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 dark:text-zinc-50">₹{booking.massagePrice}</span>
                        <button
                          onClick={() => {
                            setEditingPrice(booking._id);
                            setNewPriceAmount(booking.massagePrice?.toString() || '');
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Editable Cash */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCash === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newCashAmount}
                          onChange={(e) => setNewCashAmount(e.target.value)}
                          className="w-20 p-1 border rounded dark:bg-zinc-800 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handleCashUpdate(booking._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCash(null);
                            setNewCashAmount('');
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 dark:text-zinc-50">₹{booking.cash || '0'}</span>
                        <button
                          onClick={() => {
                            setEditingCash(booking._id);
                            setNewCashAmount(booking.cash?.toString() || '0');
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Editable Card */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCard === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newCardAmount}
                          onChange={(e) => setNewCardAmount(e.target.value)}
                          className="w-20 p-1 border rounded dark:bg-zinc-800 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handleCardUpdate(booking._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCard(null);
                            setNewCardAmount('');
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 dark:text-zinc-50">₹{booking.card || '0'}</span>
                        <button
                          onClick={() => {
                            setEditingCard(booking._id);
                            setNewCardAmount(booking.card?.toString() || '0');
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Editable UPI */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUPI === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newUPIAmount}
                          onChange={(e) => setNewUPIAmount(e.target.value)}
                          className="w-20 p-1 border rounded dark:bg-zinc-800 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handleUPIUpdate(booking._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingUPI(null);
                            setNewUPIAmount('');
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 dark:text-zinc-50">₹{booking.upi || '0'}</span>
                        <button
                          onClick={() => {
                            setEditingUPI(booking._id);
                            setNewUPIAmount(booking.upi?.toString() || '0');
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Editable Other Payment */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingPayment === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newPaymentAmount}
                          onChange={(e) => setNewPaymentAmount(e.target.value)}
                          className="w-20 p-1 border rounded dark:bg-zinc-800 dark:text-zinc-50"
                        />
                        <button
                          onClick={() => handleOtherPaymentUpdate(booking._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPayment(null);
                            setNewPaymentAmount('');
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 dark:text-zinc-50">₹{booking.otherPayment || '0'}</span>
                        <button
                          onClick={() => {
                            setEditingPayment(booking._id);
                            setNewPaymentAmount(booking.otherPayment?.toString() || '0');
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{formatTime(booking.massageTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{formatTime(booking.massageEndTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{booking.createdBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{booking.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-50">{booking?.staffDetails?.name}</td>
                  {userRole === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(booking._id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
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
    </div>
  );
};

export default AllBookingsPage;
