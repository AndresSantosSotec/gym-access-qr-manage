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
import { QrPass } from '@/pages/public/QrPass';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/qr/:clientId" element={<QrPass />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="memberships" element={<Memberships />} />
          <Route path="access" element={<AccessControl />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
