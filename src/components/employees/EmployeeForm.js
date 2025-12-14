'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EmployeeForm = ({ isOpen, onClose, onSubmit, employee, isEditing }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'employee',
    phoneNumber: '',
    address: '',
    notes: '',
    branches: [],
    status: true
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    } else {
      // Reset error when closing
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (employee && isEditing) {
      setFormData({
        name: employee.name || '',
        username: employee.username || '',
        password: '',
        role: employee.role || 'employee',
        phoneNumber: employee.phoneNumber || '',
        address: employee.address || '',
        notes: employee.notes || '',
        branches: employee.branches?.map(b => b._id || b) || [],
        status: employee.status !== undefined ? employee.status : true
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'employee',
        phoneNumber: '',
        address: '',
        notes: '',
        branches: [],
        status: true
      });
    }
  }, [employee, isEditing, isOpen]);

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
      console.log('Fetched branches:', data); // Debug log
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError(`Failed to load branches: ${error.message}`);
      setBranches([]); // Ensure branches is always an array
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Validate required fields
      if (!formData.name || !formData.username || (!isEditing && !formData.password)) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.branches.length === 0) {
        setError('Please select at least one branch');
        setLoading(false);
        return;
      }

      const url = isEditing
        ? `/api/employees/${employee._id}`
        : '/api/employees';

      const method = isEditing ? 'PUT' : 'POST';

      // Prepare data - don't send password if editing and it's empty
      const submitData = { ...formData };
      if (isEditing && !submitData.password) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save employee');
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      setError(error.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Edit User' : 'Add New User'}
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
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Password {!isEditing && <span className="text-red-500">*</span>}
                {isEditing && <span className="text-xs text-zinc-500"> (leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                required={!isEditing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                required
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
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
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Active Status
                </span>
              </label>
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
              {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Add User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
