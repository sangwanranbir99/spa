'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Sparkles,
  Settings,
  CalendarPlus,
  Calendar,
  UserCircle,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Receipt
} from 'lucide-react';

const Sidebar = ({ isMobile = false, onLinkClick = () => {} }) => {
  const pathname = usePathname();
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  // Define menu items with role-based access
  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      access: ['admin', 'manager', 'employee']
    },
    {
      title: 'Users',
      path: '/dashboard/employees',
      icon: <Users className="w-5 h-5" />,
      access: ['admin', 'manager']
    },
    {
      title: 'Massages',
      path: '/dashboard/massages',
      icon: <Sparkles className="w-5 h-5" />,
      access: ['admin', 'manager', 'employee']
    },
    {
      title: 'Create Booking',
      path: '/dashboard/bookings',
      icon: <CalendarPlus className="w-5 h-5" />,
      access: ['admin', 'manager', 'employee']
    },
    {
      title: 'All Bookings',
      path: '/dashboard/bookings/all',
      icon: <Calendar className="w-5 h-5" />,
      access: ['admin', 'manager', 'employee']
    },
    {
      title: 'Booking Report',
      path: '/dashboard/booking-report',
      icon: <CalendarDays className="w-5 h-5" />,
      access: ['admin']
    },
    {
      title: 'Analytics',
      path: '/dashboard/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      access: ['admin']
    },
    {
      title: 'Employee Analytics',
      path: '/dashboard/analytics/employee',
      icon: <TrendingUp className="w-5 h-5" />,
      access: ['admin']
    },
    {
      title: 'Expenses',
      path: '/dashboard/expenses',
      icon: <Receipt className="w-5 h-5" />,
      access: ['admin', 'manager']
    },
    {
      title: 'Expense Report',
      path: '/dashboard/expense-report',
      icon: <Receipt className="w-5 h-5" />,
      access: ['admin', 'manager']
    },
    {
      title: 'Clients',
      path: '/dashboard/clients',
      icon: <UserCircle className="w-5 h-5" />,
      access: ['admin']
    },
    {
      title: 'Branches',
      path: '/dashboard/branches',
      icon: <Building2 className="w-5 h-5" />,
      access: ['admin', 'manager']
    },
    {
      title: 'Settings',
      path: '/dashboard/settings',
      icon: <Settings className="w-5 h-5" />,
      access: ['admin', 'manager', 'employee']
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item =>
    item.access.includes(role?.toLowerCase() || '')
  );

  // For mobile, render only the navigation
  if (isMobile) {
    return (
      <nav className="space-y-1 p-4">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={onLinkClick}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === item.path
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden md:flex md:flex-col w-64 h-full bg-white border-r border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex-shrink-0 p-6 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">VIP SMS</h1>
      </div>
      <nav className="flex-1 overflow-y-auto space-y-1 p-4">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === item.path
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
