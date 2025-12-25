'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    contactNumber: '',
    email: '',
    status: true,
    notes: '',
    roomCount: 0
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/branches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch branches');

      const data = await response.json();
      setBranches(data);
    } catch (error) {
      setError('Error loading branches');
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const url = editingBranch
        ? `/api/branches/${editingBranch._id}`
        : '/api/branches';

      const method = editingBranch ? 'PUT' : 'POST';

      console.log('Submitting form data:', formData);
      console.log('Room count:', formData.roomCount, 'Type:', typeof formData.roomCount);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Operation failed');

      setSuccessMessage(editingBranch ? 'Branch updated successfully' : 'Branch created successfully');
      setShowModal(false);
      resetForm();
      fetchBranches();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      contactNumber: branch.contactNumber || '',
      email: branch.email || '',
      status: branch.status,
      notes: branch.notes || '',
      roomCount: branch.roomCount || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (branchId) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete branch');

      setSuccessMessage('Branch deleted successfully');
      fetchBranches();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      contactNumber: '',
      email: '',
      status: true,
      notes: '',
      roomCount: 0
    });
    setEditingBranch(null);
    setError('');
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (branch.address && branch.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const canCreateEdit = userRole === 'superadmin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-600 dark:text-zinc-400">Loading branches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Branches</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage your organization branches</p>
        </div>
        {canCreateEdit && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Branch</span>
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search branches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50"
        />
      </div>

      {/* Branches Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Branch Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rooms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                {canCreateEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={canCreateEdit ? 6 : 5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No branches found
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => (
                  <tr key={branch._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{branch.name}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{branch.address}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">{branch.code}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900 dark:text-zinc-50">{branch.contactNumber}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{branch.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {branch.roomCount || 0} {branch.roomCount === 1 ? 'room' : 'rooms'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        branch.status
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {branch.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canCreateEdit && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(branch)}
                            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(branch._id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {editingBranch ? 'Edit Branch' : 'Create New Branch'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50"
                />
              </div>

              {/* Room Count */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                  Number of Rooms
                </label>
                <input
                  type="number"
                  name="roomCount"
                  value={formData.roomCount}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-zinc-900 dark:text-zinc-50"
                  placeholder="e.g., 5"
                />
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Rooms will be numbered 1, 2, 3, etc.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="status"
                  id="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-zinc-900 dark:text-zinc-50 border-zinc-300 dark:border-zinc-700 rounded focus:ring-zinc-900 dark:focus:ring-zinc-50"
                />
                <label htmlFor="status" className="ml-2 text-sm text-zinc-900 dark:text-zinc-50">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchesPage;
