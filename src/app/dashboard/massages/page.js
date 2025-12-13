'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import MassageForm from '@/components/massages/MassageForm';
import MassageTable from '@/components/massages/MassageTable';
import { Plus, Search } from 'lucide-react';

const MassagesPage = () => {
  const router = useRouter();
  const { selectedBranch, getBranchId, mounted } = useBranch();

  const [massages, setMassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMassage, setEditingMassage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

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

  useEffect(() => {
    if (mounted && role) {
      fetchMassages();
    }
  }, [selectedBranch, mounted, role]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchMassages = async (searchQuery = '', isSearching = false) => {
    if (!role) return;

    try {
      // Use different loading state based on whether it's a search or initial load
      if (isSearching) {
        setSearching(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Get branch ID for filtering
      const branchId = getBranchId();
      const branchParam = branchId ? `branchId=${branchId}` : '';
      const searchParam = searchQuery ? `name=${encodeURIComponent(searchQuery)}` : '';

      const params = [branchParam, searchParam].filter(p => p).join('&');
      const queryString = params ? `?${params}` : '';

      const response = await fetch(`/api/massages${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch massages');
      }

      const data = await response.json();
      setMassages(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching massages:', error);
      setError('Failed to load massages. Please try again later.');
    } finally {
      if (isSearching) {
        setSearching(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search (300ms delay)
    const newTimeout = setTimeout(() => {
      fetchMassages(value, true); // Pass true to indicate it's a search
    }, 300);

    setSearchTimeout(newTimeout);
  };

  const handleMassageAdded = () => {
    fetchMassages(searchTerm);
    setShowModal(false);
  };

  const handleMassageUpdated = () => {
    fetchMassages(searchTerm);
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

  const handleStatusChange = (massageId, newStatus) => {
    setMassages(massages.map(m =>
      m._id === massageId ? { ...m, status: newStatus } : m
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
              className="pl-10 pr-10 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100 w-64"
              autoComplete="off"
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
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

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Massage List</h2>
          <MassageTable
            massages={massages}
            onStatusChange={handleStatusChange}
            onRefreshNeeded={() => fetchMassages(searchTerm)}
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
