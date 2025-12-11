'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { BranchProvider } from '@/context/BranchContext';

export default function Layout({ children }) {
  return (
    <BranchProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </BranchProvider>
  );
}
