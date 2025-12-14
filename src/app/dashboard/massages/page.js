'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import MassageForm from '@/components/massages/MassageForm';
import MassageTable from '@/components/massages/MassageTable';
import { Plus, Search } from 'lucide-react';

const MassagesPage = () => {
  const router = useRouter();
  const {
    selectedBranch,
    branchMassages,
    isLoadingBranchData,
    refreshBranchData,
    mounted
  } = useBranch();

  const [showModal, setShowModal] = useState(false);
  const [editingMassage, setEditingMassage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    setRole(userRole);
  }, [router]);

  // Filter massages based on search term (client-side filtering)
  const filteredMassages = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return branchMassages;
    }
    return branchMassages.filter(massage =>
      massage.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branchMassages, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleMassageAdded = () => {
    refreshBranchData();
    setShowModal(false);
  };

  const handleMassageUpdated = () => {
    refreshBranchData();
    setShowModal(false);
    setEditingMassage(null);
    setIsEditing(false);
  };

  const handleAddMassage = () => {
    setIsEditing(false);
    setEditingMassage(null);
    setShowModal(true);
  };

  const handleEditMassage = (massage) => {
    setEditingMassage(massage);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMassage(null);
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
        <div className="text-xl text-zinc-700 dark:text-zinc-300">Loading massages...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Massage Management</h1>
          {selectedBranch && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Viewing massages for: {selectedBranch.name}
            </p>
          )}
          {!selectedBranch && role === 'admin' && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Viewing all massages across all branches
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search massages..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100 w-64"
              autoComplete="off"
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          </div>

          {/* Add Button - Only for admin and manager */}
          {(role === 'admin' || role === 'manager') && (
            <button
              onClick={handleAddMassage}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Massage
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Massage List</h2>
          <MassageTable
            massages={filteredMassages}
            onStatusChange={handleStatusChange}
            onRefreshNeeded={refreshBranchData}
            onEditMassage={handleEditMassage}
          />
        </div>
      </div>

      {/* Modal - Only shown for admin and manager */}
      {(role === 'admin' || role === 'manager') && (
        <MassageForm
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={isEditing ? handleMassageUpdated : handleMassageAdded}
          massage={editingMassage}
          isEditing={isEditing}
        />
      )}
    </div>
  );
};

export default MassagesPage;
