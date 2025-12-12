'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import EmployeeForm from '@/components/employees/EmployeeForm';
import EmployeeTable from '@/components/employees/EmployeeTable';
import { Plus } from 'lucide-react';

const EmployeesPage = () => {
  const router = useRouter();
  const { selectedBranch, getBranchId, mounted } = useBranch();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    // Only admin and manager can access employees page
    if (userRole !== 'admin' && userRole !== 'manager') {
      router.push('/dashboard');
      return;
    }

    setRole(userRole);
  }, [router]);

  useEffect(() => {
    if (mounted && role) {
      fetchEmployees();
    }
  }, [selectedBranch, mounted, role]);

  const fetchEmployees = async () => {
    if (!role) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Get branch ID for filtering
      const branchId = getBranchId();
      const branchParam = branchId ? `?branchId=${branchId}` : '';

      const response = await fetch(`/api/employees${branchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setEmployees(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeAdded = () => {
    fetchEmployees();
    setShowModal(false);
  };

  const handleEmployeeUpdated = () => {
    fetchEmployees();
    setShowModal(false);
    setEditingEmployee(null);
    setIsEditing(false);
  };

  const handleAddEmployee = () => {
    setIsEditing(false);
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setIsEditing(false);
  };

  const handleStatusChange = (employeeId, newStatus) => {
    setEmployees(employees.map(emp =>
      emp._id === employeeId ? { ...emp, status: newStatus } : emp
    ));
  };

  if (!mounted || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-zinc-700 dark:text-zinc-300">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-zinc-700 dark:text-zinc-300">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">User Management</h1>
          {selectedBranch && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Viewing users for: {selectedBranch.name}
            </p>
          )}
          {!selectedBranch && role === 'admin' && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Viewing all users across all branches
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAddEmployee}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New User
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">User List</h2>
          <EmployeeTable
            employees={employees}
            onStatusChange={handleStatusChange}
            onRefreshNeeded={fetchEmployees}
            onEditEmployee={handleEditEmployee}
          />
        </div>
      </div>

      <EmployeeForm
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={isEditing ? handleEmployeeUpdated : handleEmployeeAdded}
        employee={editingEmployee}
        isEditing={isEditing}
      />
    </div>
  );
};

export default EmployeesPage;
