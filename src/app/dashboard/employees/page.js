'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import EmployeeForm from '@/components/employees/EmployeeForm';
import EmployeeTable from '@/components/employees/EmployeeTable';
import { Plus } from 'lucide-react';

const EmployeesPage = () => {
  const router = useRouter();
  const {
    selectedBranch,
    branchEmployees,
    isLoadingBranchData,
    refreshBranchData,
    mounted
  } = useBranch();

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

    // Only superadmin, admin and manager can access employees page
    if (userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'manager') {
      router.push('/dashboard');
      return;
    }

    setRole(userRole);
  }, [router]);

  const handleEmployeeAdded = () => {
    refreshBranchData();
    setShowModal(false);
  };

  const handleEmployeeUpdated = () => {
    refreshBranchData();
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

  const handleStatusChange = () => {
    // Refresh data after status change
    refreshBranchData();
  };

  if (!mounted || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-zinc-700 dark:text-zinc-300">Loading...</div>
      </div>
    );
  }

  if (isLoadingBranchData) {
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

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">User List</h2>
          <EmployeeTable
            employees={branchEmployees}
            onStatusChange={handleStatusChange}
            onRefreshNeeded={refreshBranchData}
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
