'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Power, PowerOff } from 'lucide-react';

const MassageTable = ({ massages, onStatusChange, onRefreshNeeded, onEditMassage }) => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role'));
    }
  }, []);

  const handleStatusToggle = async (massageId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/massages/${massageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: !currentStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }

      onStatusChange(massageId, !currentStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update massage status');
    }
  };

  const handleDelete = async (massageId, massageName) => {
    if (!window.confirm(`Are you sure you want to delete massage "${massageName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/massages/${massageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete massage');
      }

      alert('Massage deleted successfully');
      onRefreshNeeded();
    } catch (error) {
      console.error('Error deleting massage:', error);
      alert(error.message || 'Failed to delete massage');
    }
  };

  if (massages.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        No massages found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Time Slots
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Price Range
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Discounted Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Branches
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Status
            </th>
            {(role === 'admin' || role === 'manager') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
          {massages.map((massage) => (
            <tr key={massage._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {massage.name}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300 max-w-xs">
                  {massage.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {massage.time && massage.time.length > 0 ? (
                    <ul className="list-none space-y-1">
                      {massage.time.map((t, index) => (
                        <li key={index}>{t}</li>
                      ))}
                    </ul>
                  ) : '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {massage.price && massage.price.length > 0 ? (
                    <ul className="list-none space-y-1">
                      {massage.price.map((p, index) => (
                        <li key={index}>₹{p}</li>
                      ))}
                    </ul>
                  ) : '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {massage.discountedPrice && massage.discountedPrice.length > 0 ? (
                    <ul className="list-none space-y-1">
                      {massage.discountedPrice.map((p, index) => (
                        <li key={index}>₹{p}</li>
                      ))}
                    </ul>
                  ) : '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {massage.branches && massage.branches.length > 0
                    ? massage.branches.map(b => b.name || b).join(', ')
                    : '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {(role === 'admin' || role === 'manager') ? (
                  <button
                    onClick={() => handleStatusToggle(massage._id, massage.status)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      massage.status
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                    title={massage.status ? 'Click to deactivate' : 'Click to activate'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        massage.status ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : (
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      massage.status
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {massage.status ? 'Active' : 'Inactive'}
                  </span>
                )}
              </td>
              {(role === 'admin' || role === 'manager') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {/* Edit button - visible to both admin and manager */}
                    <button
                      onClick={() => onEditMassage(massage)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Edit massage"
                    >
                      <Edit className="h-5 w-5" />
                    </button>

                    {/* Delete button - visible only to admin */}
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDelete(massage._id, massage.name)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete massage"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MassageTable;
