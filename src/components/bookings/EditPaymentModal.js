'use client';

import { useState, useEffect } from 'react';

const EditPaymentModal = ({ isOpen, onClose, booking, onUpdate }) => {
  const [formData, setFormData] = useState({
    massagePrice: 0,
    cash: 0,
    card: 0,
    upi: 0,
    otherPayment: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (booking && isOpen) {
      setFormData({
        massagePrice: booking.massagePrice || 0,
        cash: booking.cash || 0,
        card: booking.card || 0,
        upi: booking.upi || 0,
        otherPayment: booking.otherPayment || 0
      });
      setError(null);
    }
  }, [booking, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
    });
  };

  const getTotalPayment = () => {
    return formData.cash + formData.card + formData.upi;
  };

  const getTotalPrice = () => {
    return formData.massagePrice + formData.otherPayment;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate(data.booking);
        onClose();
      } else {
        setError(data.message || 'Failed to update payment');
      }
    } catch (err) {
      setError('Failed to update payment. Please try again.');
      console.error('Error updating payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Edit Payment</h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Price Section */}
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Price Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Massage Price (₹)
                  </label>
                  <input
                    type="number"
                    name="massagePrice"
                    value={formData.massagePrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Other Payment (₹)
                  </label>
                  <input
                    type="number"
                    name="otherPayment"
                    value={formData.otherPayment}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Total Price: ₹{getTotalPrice().toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment Methods Section */}
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Payment Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Cash (₹)
                  </label>
                  <input
                    type="number"
                    name="cash"
                    value={formData.cash}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Card (₹)
                  </label>
                  <input
                    type="number"
                    name="card"
                    value={formData.card}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    UPI (₹)
                  </label>
                  <input
                    type="number"
                    name="upi"
                    value={formData.upi}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-300">
                  Total Payment: ₹{getTotalPayment().toFixed(2)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
                  !loading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed'
                }`}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentModal;
