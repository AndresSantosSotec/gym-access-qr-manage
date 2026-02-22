import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AdminLogin } from '@/pages/auth/AdminLogin';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Dashboard } from '@/pages/admin/Dashboard';
import { ClientsList } from '@/pages/admin/ClientsList';
import { ClientDetail } from '@/pages/admin/ClientDetail';
import { Memberships } from '@/pages/admin/Memberships';
import { AccessControl } from '@/pages/admin/AccessControl';
import { Settings } from '@/pages/admin/Settings';
import { Leads } from '@/pages/admin/Leads';
import { Payments } from '@/pages/admin/Payments';
import { ReceiptsPage } from '@/pages/admin/Receipts';
import { SiteSettings } from '@/pages/admin/SiteSettings';
import { BlogAdmin } from '@/pages/admin/BlogAdmin';
import { Roles } from '@/pages/admin/Roles';
import { Reports } from '@/pages/admin/Reports';
import { Notifications } from '@/pages/admin/Notifications';
import { Cameras } from '@/pages/admin/Cameras';
import { Fingerprints } from '@/pages/admin/Fingerprints';
import { Identifier } from '@/pages/admin/Identifier';
import { Staff } from '@/pages/admin/Staff';
import { StaffForm } from '@/pages/admin/StaffForm';
import { Products } from '@/pages/admin/commercial/Products';
import { ProductForm } from '@/pages/admin/commercial/ProductForm';
import { Inventory } from '@/pages/admin/commercial/Inventory';
import { Sales } from '@/pages/admin/commercial/Sales';
import { SalesHistory } from '@/pages/admin/commercial/SalesHistory';
import { Catalogs } from '@/pages/admin/commercial/Catalogs';
import { QrPass } from '@/pages/public/QrPass';
import { PublicHome } from '@/pages/public/PublicHome';
import { PublicPlans } from '@/pages/public/PublicPlans';
import { PublicPlanDetail } from '@/pages/public/PublicPlanDetail';
import { PublicBlog } from '@/pages/public/PublicBlog';
import { PublicBlogDetail } from '@/pages/public/PublicBlogDetail';
import { PublicSubscribe } from '@/pages/public/PublicSubscribe';
import { PaymentSuccess } from '@/pages/public/PaymentSuccess';
import { PaymentFailure } from '@/pages/public/PaymentFailure';
import { PublicContact } from '@/pages/public/PublicContact';
import { PublicStripeDemoCheckout } from '@/pages/public/PublicStripeDemoCheckout';
import { PausarMembresia } from '@/pages/admin/PausarMembresia';
import { ReactivarCobro } from '@/pages/admin/ReactivarCobro';
import { MembresiaRiesgo } from '@/pages/admin/MembresiaRiesgo';

import { PermissionGuard } from '@/components/PermissionGuard';
import { Forbidden } from '@/pages/admin/Forbidden';
import { ProtectedRoute, GuestRoute } from '@/components/AuthGuards';

function ThemeApplicator() {
  useThemeColors();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeApplicator />
      <Routes>
        {/* Base redirect to landing */}
        <Route path="/" element={<Navigate to="/p" replace />} />

        {/* Guest route (only accessible if NOT logged in) */}
        <Route path="/login" element={
          <GuestRoute>
            <AdminLogin />
          </GuestRoute>
        } />

        {/* Public routes (always accessible, no auth checks) */}
        <Route path="/p" element={<PublicHome />} />
        <Route path="/p/planes" element={<PublicPlans />} />
        <Route path="/p/planes/:slug" element={<PublicPlanDetail />} />
        <Route path="/p/blog" element={<PublicBlog />} />
        <Route path="/p/blog/:slug" element={<PublicBlogDetail />} />
        <Route path="/p/suscripcion" element={<PublicSubscribe />} />
        <Route path="/p/pago-exitoso" element={<PaymentSuccess />} />
        <Route path="/p/pago-fallido" element={<PaymentFailure />} />
        <Route path="/p/contacto" element={<PublicContact />} />
        <Route path="/p/pago-demo" element={<PublicStripeDemoCheckout />} />
        <Route path="/qr/:clientId" element={<QrPass />} />

        {/* Admin protected routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="forbidden" element={<Forbidden />} />

          {/* Dashboard - General access usually */}
          <Route element={<PermissionGuard permission="DASHBOARD_VIEW" />}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          {/* Clientes */}
          <Route element={<PermissionGuard permission="CLIENTS_VIEW" />}>
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="leads" element={<Leads />} />
          </Route>

          {/* Gestión de Gimnasio */}
          <Route element={<PermissionGuard permission="MEMBERSHIPS_VIEW" />}>
            <Route path="memberships" element={<Memberships />} />
            <Route path="memberships/riesgo" element={<MembresiaRiesgo />} />
            <Route path="memberships/:membershipId/pausar" element={<PausarMembresia />} />
            <Route path="clients/:clientId/reactivar-cobro" element={<ReactivarCobro />} />
          </Route>

          <Route element={<PermissionGuard permission="PAYMENTS_VIEW" />}>
            <Route path="payments" element={<Payments />} />
            <Route path="receipts" element={<ReceiptsPage />} />
          </Route>

          <Route element={<PermissionGuard permission="ACCESS_VIEW" />}>
            <Route path="access" element={<AccessControl />} />
            <Route path="fingerprints" element={<Fingerprints />} />
            <Route path="identifier" element={<Identifier />} />
          </Route>

          {/* Configuración de Sitio */}
          <Route element={<PermissionGuard permission="SETTINGS_VIEW" />}>
            <Route path="site" element={<SiteSettings />} />
            <Route path="blog" element={<BlogAdmin />} />
          </Route>

          {/* Roles y Personal (Admin Only usually) */}
          <Route element={<PermissionGuard permission="ROLES_MANAGE" />}>
            <Route path="roles" element={<Roles />} />
          </Route>

          <Route element={<PermissionGuard permission="USERS_VIEW" />}>
            <Route path="staff" element={<Staff />} />
            <Route path="staff/new" element={<StaffForm />} />
            <Route path="staff/edit/:id" element={<StaffForm />} />
          </Route>

          {/* Módulos Comerciales */}
          <Route element={<PermissionGuard permission="PRODUCTS_VIEW" />}>
            <Route path="productos" element={<Products />} />
            <Route path="productos/nuevo" element={<ProductForm />} />
            <Route path="productos/editar/:id" element={<ProductForm />} />
            <Route path="catalogos" element={<Catalogs />} />
          </Route>

          <Route element={<PermissionGuard permission="INVENTORY_VIEW" />}>
            <Route path="inventario" element={<Inventory />} />
          </Route>

          <Route element={<PermissionGuard permission="SALES_VIEW" />}>
            <Route path="ventas" element={<SalesHistory />} />
            <Route path="ventas/pos" element={<Sales />} />
          </Route>

          {/* Otros */}
          <Route element={<PermissionGuard permission="REPORTS_VIEW" />}>
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route element={<PermissionGuard permission="NOTIFICATIONS_VIEW" />}>
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route element={<PermissionGuard permission="CAMERAS_VIEW" />}>
            <Route path="cameras" element={<Cameras />} />
          </Route>
          <Route element={<PermissionGuard permission="SETTINGS_VIEW" />}>
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/p" replace />} />
      </Routes>

      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
