'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Power, PowerOff, Eye, EyeOff } from 'lucide-react';

const EmployeeTable = ({ employees, onStatusChange, onRefreshNeeded, onEditEmployee }) => {
  const [role, setRole] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role'));
    }
  }, []);

  const togglePasswordVisibility = (employeeId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const handleStatusToggle = async (employeeId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${employeeId}`, {
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

      onStatusChange(employeeId, !currentStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update employee status');
    }
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete employee "${employeeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete employee');
      }

      alert('Employee deleted successfully');
      onRefreshNeeded();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(error.message || 'Failed to delete employee');
    }
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        No employees found
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
              Username
            </th>
            {(role === 'superadmin' || role === 'admin') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Password
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Branches
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
          {employees.map((employee) => (
            <tr key={employee._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {employee.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {employee.username}
                </div>
              </td>
              {(role === 'superadmin' || role === 'admin') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 font-mono">
                      {visiblePasswords[employee._id] ? employee.password : '••••••••'}
                    </div>
                    <button
                      onClick={() => togglePasswordVisibility(employee._id)}
                      className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      title={visiblePasswords[employee._id] ? 'Hide password' : 'Show password'}
                    >
                      {visiblePasswords[employee._id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    employee.role === 'superadmin'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : employee.role === 'admin'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : employee.role === 'manager'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {employee.role === 'superadmin'
                    ? 'Super Admin'
                    : employee.role === 'admin'
                    ? 'Admin'
                    : employee.role === 'manager'
                    ? 'Manager'
                    : 'Employee'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {employee.phoneNumber || '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300 max-w-xs truncate" title={employee.address}>
                  {employee.address || '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {employee.branches && employee.branches.length > 0
                    ? employee.branches.map(b => b.name || b).join(', ')
                    : '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {(role === 'admin' || role === 'manager') ? (
                  <button
                    onClick={() => handleStatusToggle(employee._id, employee.status)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      employee.status
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                    title={employee.status ? 'Click to deactivate' : 'Click to activate'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        employee.status ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : (
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {employee.status ? 'Active' : 'Inactive'}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {/* Edit button - visible to both admin and manager */}
                  {(role === 'admin' || role === 'manager') && (
                    <button
                      onClick={() => onEditEmployee(employee)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Edit employee"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  )}

                  {/* Delete button - visible only to admin */}
                  {role === 'admin' && (
                    <button
                      onClick={() => handleDelete(employee._id, employee.name)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete employee"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
