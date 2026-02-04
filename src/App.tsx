import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
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
import { SiteSettings } from '@/pages/admin/SiteSettings';
import { BlogAdmin } from '@/pages/admin/BlogAdmin';
import { Roles } from '@/pages/admin/Roles';
import { Reports } from '@/pages/admin/Reports';
import { Notifications } from '@/pages/admin/Notifications';
import { Cameras } from '@/pages/admin/Cameras';
import { Fingerprints } from '@/pages/admin/Fingerprints';
import { QrPass } from '@/pages/public/QrPass';
import { PublicHome } from '@/pages/public/PublicHome';
import { PublicPlans } from '@/pages/public/PublicPlans';
import { PublicPlanDetail } from '@/pages/public/PublicPlanDetail';
import { PublicBlog } from '@/pages/public/PublicBlog';
import { PublicBlogDetail } from '@/pages/public/PublicBlogDetail';
import { PublicSubscribe } from '@/pages/public/PublicSubscribe';
import { PublicContact } from '@/pages/public/PublicContact';
import { PublicStripeDemoCheckout } from '@/pages/public/PublicStripeDemoCheckout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/p" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        
        <Route path="/p" element={<PublicHome />} />
        <Route path="/p/planes" element={<PublicPlans />} />
        <Route path="/p/planes/:slug" element={<PublicPlanDetail />} />
        <Route path="/p/blog" element={<PublicBlog />} />
        <Route path="/p/blog/:slug" element={<PublicBlogDetail />} />
        <Route path="/p/suscripcion" element={<PublicSubscribe />} />
        <Route path="/p/contacto" element={<PublicContact />} />
        <Route path="/p/pago-demo" element={<PublicStripeDemoCheckout />} />
        <Route path="/qr/:clientId" element={<QrPass />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="leads" element={<Leads />} />
          <Route path="memberships" element={<Memberships />} />
          <Route path="payments" element={<Payments />} />
          <Route path="access" element={<AccessControl />} />
          <Route path="fingerprints" element={<Fingerprints />} />
          <Route path="site" element={<SiteSettings />} />
          <Route path="blog" element={<BlogAdmin />} />
          <Route path="roles" element={<Roles />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="cameras" element={<Cameras />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/p" replace />} />
      </Routes>
      
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
