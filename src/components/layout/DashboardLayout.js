'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useBranch } from '@/context/BranchContext';
import Sidebar from './Sidebar';
import { ChevronDown, LogOut, Sun, Moon, Menu, X } from 'lucide-react';

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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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
    <div className="flex h-screen bg-zinc-50 dark:bg-black overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out md:hidden ${
        showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between flex-shrink-0 p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">SMS</h1>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar isMobile={true} onLinkClick={() => setShowMobileSidebar(false)} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="py-4 px-4 md:px-6">
            <div className="flex items-center justify-between">
              {/* Left side - Mobile Menu + Branch Selector */}
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </button>

                {(userRole === 'superadmin' || userRole === 'admin' || userRole === 'manager') && userBranches.length > 0 && branchMounted && (
                  <div className="relative">
                    <button
                      onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                      className="flex items-center space-x-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {selectedBranch ? selectedBranch.name : ((userRole === 'superadmin' || userRole === 'admin') ? 'All Branches' : 'Select Branch')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </button>

                    {/* Branch Dropdown */}
                    {showBranchDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50">
                        <div className="p-2">
                          {(userRole === 'superadmin' || userRole === 'admin') && userBranches.length > 1 && (
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
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black p-4 md:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
