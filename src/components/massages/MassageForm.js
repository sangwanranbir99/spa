'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const MassageForm = ({ isOpen, onClose, onSubmit, massage, isEditing }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    time: ['30MIN+15MIN'],
    price: [0],
    discountedPrice: [0],
    branches: [],
    status: true
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    } else {
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (massage && isEditing) {
      setFormData({
        name: massage.name || '',
        description: massage.description || '',
        time: massage.time || ['30MIN+15MIN'],
        price: massage.price || [0],
        discountedPrice: massage.discountedPrice || [0],
        branches: massage.branches?.map(b => b._id || b) || [],
        status: massage.status !== undefined ? massage.status : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        time: ['30MIN+15MIN'],
        price: [0],
        discountedPrice: [0],
        branches: [],
        status: true
      });
    }
  }, [massage, isEditing, isOpen]);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/branches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch branches');
      }

      const data = await response.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError(`Failed to load branches: ${error.message}`);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBranchChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      branches: selectedOptions
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      time: [...prev.time, ''],
      price: [...prev.price, 0],
      discountedPrice: [...prev.discountedPrice, 0]
    }));
  };

  const removeTimeSlot = (index) => {
    if (formData.time.length <= 1) {
      alert('At least one time slot is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      time: prev.time.filter((_, i) => i !== index),
      price: prev.price.filter((_, i) => i !== index),
      discountedPrice: prev.discountedPrice.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index, field, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (field === 'time') {
        newData.time[index] = value;
      } else if (field === 'price') {
        newData.price[index] = Number(value);
      } else if (field === 'discountedPrice') {
        newData.discountedPrice[index] = Number(value);
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Validate required fields
      if (!formData.name) {
        setError('Please enter massage name');
        setLoading(false);
        return;
      }

      if (formData.branches.length === 0) {
        setError('Please select at least one branch');
        setLoading(false);
        return;
      }

      // Validate time slots are not empty
      if (formData.time.some(t => !t.trim())) {
        setError('All time slots must have a value');
        setLoading(false);
        return;
      }

      const url = isEditing
        ? `/api/massages/${massage._id}`
        : '/api/massages';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save massage');
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving massage:', error);
      setError(error.message || 'Failed to save massage');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Edit Massage' : 'Add New Massage'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Status
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Active
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Branches <span className="text-red-500">*</span>
                {loadingBranches && <span className="text-xs text-blue-500 ml-2">(Loading...)</span>}
              </label>
              {loadingBranches ? (
                <div className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 min-h-[100px] flex items-center justify-center">
                  <span className="text-zinc-500 dark:text-zinc-400">Loading branches...</span>
                </div>
              ) : branches.length === 0 ? (
                <div className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 min-h-[100px] flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-red-500 dark:text-red-400">No branches available</span>
                    <button
                      type="button"
                      onClick={fetchBranches}
                      className="block mx-auto mt-2 text-sm text-blue-500 hover:text-blue-700 underline"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    multiple
                    name="branches"
                    value={formData.branches}
                    onChange={handleBranchChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100 min-h-[100px]"
                    required
                  >
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Hold Ctrl (Cmd on Mac) to select multiple branches. {branches.length} branch(es) available.
                  </p>
                </>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Time Slots & Pricing <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center text-sm text-blue-500 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time Slot
                </button>
              </div>

              <div className="space-y-3">
                {formData.time.map((time, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border border-zinc-200 dark:border-zinc-700 rounded-md">
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={time}
                        onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                        placeholder="e.g., 30MIN+15MIN"
                        className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.price[index]}
                        onChange={(e) => updateTimeSlot(index, 'price', e.target.value)}
                        min="0"
                        className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Discounted Price (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.discountedPrice[index]}
                        onChange={(e) => updateTimeSlot(index, 'discountedPrice', e.target.value)}
                        min="0"
                        className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                        required
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={formData.time.length <= 1}
                        title="Remove time slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Massage' : 'Add Massage')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MassageForm;
