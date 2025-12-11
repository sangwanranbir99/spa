'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranches, setUserBranches] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeBranches();
  }, []);

  const initializeBranches = async () => {
    // Load user role and branches from localStorage
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    setUserRole(role);

    if (role === 'admin') {
      // Admin: Fetch ALL branches from the system
      try {
        const response = await fetch('/api/branches', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const allBranches = await response.json();
          setUserBranches(allBranches);

          // Try to load previously selected branch or default to "All Branches"
          const savedBranch = localStorage.getItem('selectedBranch');
          if (savedBranch && savedBranch !== 'null') {
            const parsed = JSON.parse(savedBranch);
            // Verify the saved branch still exists in the system
            const branchExists = allBranches.find(b => b._id === parsed._id);
            if (branchExists) {
              setSelectedBranch(parsed);
            } else {
              setSelectedBranch(null); // Branch no longer exists, default to all
            }
          } else {
            setSelectedBranch(null); // null means "All Branches" for admin
          }
        }
      } catch (error) {
        console.error('Error fetching branches for admin:', error);
      }
    } else {
      // Manager/Employee: Use assigned branches from localStorage
      const branchesData = localStorage.getItem('branches');
      if (branchesData) {
        try {
          const branches = JSON.parse(branchesData);
          setUserBranches(branches);

          // Auto-select their only branch
          if (role === 'manager' || role === 'employee') {
            if (branches.length > 0) {
              setSelectedBranch(branches[0]);
              localStorage.setItem('selectedBranch', JSON.stringify(branches[0]));
            }
          }
        } catch (error) {
          console.error('Error parsing branches:', error);
        }
      }
    }
  };

  const selectBranch = (branch) => {
    setSelectedBranch(branch);
    if (branch) {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
    } else {
      localStorage.setItem('selectedBranch', 'null');
    }
  };

  const clearBranch = () => {
    setSelectedBranch(null);
    localStorage.setItem('selectedBranch', 'null');
  };

  // Get branch ID for API calls
  const getBranchId = () => {
    if (!selectedBranch) return null;
    return selectedBranch._id;
  };

  // Check if user can see all branches (admin with no branch selected)
  const canSeeAllBranches = () => {
    return userRole === 'admin' && !selectedBranch;
  };

  const value = {
    selectedBranch,
    userRole,
    userBranches,
    selectBranch,
    clearBranch,
    getBranchId,
    canSeeAllBranches,
    mounted
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return context;
}
