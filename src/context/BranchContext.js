'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranches, setUserBranches] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Branch data state
  const [branchDetails, setBranchDetails] = useState(null);
  const [branchEmployees, setBranchEmployees] = useState([]);
  const [branchMassages, setBranchMassages] = useState([]);
  const [totalBranches, setTotalBranches] = useState(0);

  // Loading states
  const [isLoadingBranchData, setIsLoadingBranchData] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeBranches();
  }, []);

  const initializeBranches = async () => {
    // Load user role and branches from localStorage
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    setUserRole(role);

    if (role === 'superadmin' || role === 'admin') {
      // Superadmin and Admin: Fetch ALL branches from the system
      try {
        const response = await fetch('/api/branches', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const allBranches = await response.json();
          setUserBranches(allBranches);
          setTotalBranches(allBranches.length);

          // If only one branch exists, auto-select it
          if (allBranches.length === 1) {
            setSelectedBranch(allBranches[0]);
            localStorage.setItem('selectedBranch', JSON.stringify(allBranches[0]));
          } else {
            // Multiple branches: Try to load previously selected branch or default to "All Branches"
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
              setSelectedBranch(null); // null means "All Branches" for superadmin/admin
            }
          }
        }
      } catch (error) {
        console.error('Error fetching branches for superadmin/admin:', error);
      }
    } else {
      // Manager/Employee: Use assigned branches from localStorage
      const branchesData = localStorage.getItem('branches');
      if (branchesData) {
        try {
          const branches = JSON.parse(branchesData);
          setUserBranches(branches);
          setTotalBranches(branches.length);

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

  // Fetch branch-specific data when selectedBranch changes
  useEffect(() => {
    if (mounted && userRole) {
      fetchBranchData();
    }
  }, [selectedBranch, mounted, userRole]);

  const fetchBranchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingBranchData(true);

    try {
      if (selectedBranch && selectedBranch._id) {
        // Fetch data for specific branch using bulk endpoint
        const response = await fetch(`/api/branches/${selectedBranch._id}/details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setBranchDetails(data.branch);
          setBranchEmployees(data.employees);
          setBranchMassages(data.massages);
        } else {
          console.error('Error fetching branch details');
          // Reset data on error
          setBranchDetails(null);
          setBranchEmployees([]);
          setBranchMassages([]);
        }
      } else {
        // Admin selected "All Branches" - fetch all data
        setBranchDetails(null);

        // Fetch all employees
        const employeesResponse = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (employeesResponse.ok) {
          const data = await employeesResponse.json();
          // /api/users returns { users: [...] }, so extract the array
          setBranchEmployees(data.users || data || []);
        } else {
          setBranchEmployees([]);
        }

        // Fetch all massages
        const massagesResponse = await fetch('/api/massages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (massagesResponse.ok) {
          const massages = await massagesResponse.json();
          // /api/massages returns array directly
          setBranchMassages(Array.isArray(massages) ? massages : []);
        } else {
          setBranchMassages([]);
        }
      }
    } catch (error) {
      console.error('Error fetching branch data:', error);
      setBranchDetails(null);
      setBranchEmployees([]);
      setBranchMassages([]);
    } finally {
      setIsLoadingBranchData(false);
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

  // Check if user can see all branches (superadmin/admin with no branch selected)
  const canSeeAllBranches = () => {
    return (userRole === 'superadmin' || userRole === 'admin') && !selectedBranch;
  };

  // Manual refresh function
  const refreshBranchData = () => {
    fetchBranchData();
  };

  const value = {
    // Existing
    selectedBranch,
    userRole,
    userBranches,
    selectBranch,
    clearBranch,
    getBranchId,
    canSeeAllBranches,
    mounted,

    // New branch data
    branchDetails,
    branchEmployees,
    branchMassages,
    totalBranches,

    // Loading states
    isLoadingBranchData,

    // Functions
    refreshBranchData
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
