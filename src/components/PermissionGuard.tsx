import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { can } from '@/services/permissions';
import { PermissionKey } from '@/types/models';

interface PermissionGuardProps {
    permission: PermissionKey;
    redirectTo?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    redirectTo = '/admin/forbidden'
}) => {
    const hasPermission = can(permission);

    if (!hasPermission) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};
