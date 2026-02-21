import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { DevContinueButton } from '@/components/DevContinueButton';

export function AdminLayout() {
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>

      <DevContinueButton />
    </div>
  );
}
