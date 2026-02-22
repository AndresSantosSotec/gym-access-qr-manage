import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { can } from '@/services/permissions';
import { useAuth } from '@/hooks/useAuth';
import type { PermissionKey } from '@/types/models';

interface PermissionGuardProps {
    permission: PermissionKey;
    redirectTo?: string;
}

/**
 * PermissionGuard — protege rutas según permisos del rol.
 *
 * Bug anterior: can() era async, lo que hacía que !hasPermission
 * fuera siempre false (un Promise es truthy). Ahora can() es
 * síncrono y lee directamente desde localStorage.
 *
 * Muestra un estado de carga breve mientras el auth no está listo.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    redirectTo = '/admin/forbidden'
}) => {
    const { auth, isAuthenticated } = useAuth();
    const [checked, setChecked] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        // Esperar a que el auth esté cargado
        if (isAuthenticated !== undefined) {
            setHasPermission(can(permission));
            setChecked(true);
        }
    }, [permission, auth, isAuthenticated]);

    // Mientras resuelve — mostrar nada brevemente
    if (!checked) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasPermission) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};
