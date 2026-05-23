'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '../types';
import { hasPermission, Permission } from '../services/permissions';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: UserRole[];
  requirePermission?: Permission;
}

export function AuthGuard({ children, requireRole, requirePermission }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    if (requireRole || requirePermission) {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const role: UserRole | undefined = user?.role;

        if (requireRole && role && !requireRole.includes(role)) {
          router.replace('/');
          return;
        }

        if (requirePermission && role && !hasPermission(role, requirePermission)) {
          router.replace('/');
          return;
        }
      } catch {}
    }

    setChecked(true);
  }, [router, pathname, requireRole, requirePermission]);

  if (!checked) return null;

  return <>{children}</>;
}
