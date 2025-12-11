'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useBranch } from '@/context/BranchContext';
import Sidebar from './Sidebar';
import { ChevronDown, LogOut, Sun, Moon } from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const {
    selectedBranch,
    userRole,
    userBranches,
    selectBranch,
    clearBranch,
    mounted: branchMounted
  } = useBranch();

  const [themeMounted, setThemeMounted] = useState(false);
  const [userName, setUserName] = useState('');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('role');

    if (!name || !role) {
      router.push('/login');
      return;
    }

    setUserName(name);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleBranchChange = (branch) => {
    selectBranch(branch);
    setShowBranchDropdown(false);
  };

  const handleClearBranch = () => {
    clearBranch();
    setShowBranchDropdown(false);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="py-4 px-6">
            <div className="flex items-center justify-between">
              {/* Left side - Branch Selector (only for admin and manager) */}
              <div className="flex items-center space-x-4">
                {(userRole === 'admin' || userRole === 'manager') && userBranches.length > 0 && branchMounted && (
                  <div className="relative">
                    <button
                      onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                      className="flex items-center space-x-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {selectedBranch ? selectedBranch.name : (userRole === 'admin' ? 'All Branches' : 'Select Branch')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </button>

                    {/* Branch Dropdown */}
                    {showBranchDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50">
                        <div className="p-2">
                          {userRole === 'admin' && (
                            <div
                              onClick={handleClearBranch}
                              className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md cursor-pointer"
                            >
                              <div className="font-medium text-zinc-900 dark:text-zinc-50">All Branches</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">View data from all branches</div>
                            </div>
                          )}
                          {userBranches.map((branch) => (
                            <div
                              key={branch._id}
                              onClick={() => handleBranchChange(branch)}
                              className={`px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md cursor-pointer ${
                                selectedBranch?._id === branch._id ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                              }`}
                            >
                              <div className="font-medium text-zinc-900 dark:text-zinc-50">{branch.name}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">{branch.code}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right side - Theme Toggle & User Profile */}
              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                {themeMounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    )}
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {userName}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                        {userRole}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50">
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-zinc-50 dark:bg-black p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
