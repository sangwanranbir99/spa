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
  UserCircle
} from 'lucide-react';

const Sidebar = () => {
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
      title: 'Branches',
      path: '/dashboard/branches',
      icon: <Building2 className="w-5 h-5" />,
      access: ['admin', 'manager']
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
      title: 'Clients',
      path: '/dashboard/clients',
      icon: <UserCircle className="w-5 h-5" />,
      access: ['admin', 'manager', 'employee']
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

  return (
    <div className="w-64 min-h-screen bg-white border-r border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">VIP SMS</h1>
      </div>
      <nav className="space-y-1 p-4">
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
