import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Rutas protegidas: Solo para usuarios autenticados.
 * Si no está logueado, redirige a /login guardando la ruta intentada.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Evitamos bucles infinitos y redirigimos limpiamente
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}

/**
 * Rutas de invitados (ej: /login).
 * Si ya está logueado, no tiene sentido ver el login, lo mandamos al admin.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
}
