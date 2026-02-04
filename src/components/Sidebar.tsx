import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartBar,
  Users,
  CreditCard,
  QrCode,
  Gear,
  Barbell,
  Money,
  UsersFour,
  Globe,
  Article,
  UserCircleGear,
  ChartLine,
  Bell,
  Camera,
} from '@phosphor-icons/react';

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { to: '/admin/dashboard', icon: ChartBar, label: 'Dashboard' },
  { to: '/admin/clients', icon: Users, label: 'Clientes' },
  { to: '/admin/leads', icon: UsersFour, label: 'Leads' },
  { to: '/admin/memberships', icon: CreditCard, label: 'Membresías' },
  { to: '/admin/payments', icon: Money, label: 'Pagos' },
  { to: '/admin/access', icon: QrCode, label: 'Control de Acceso' },
  { to: '/admin/site', icon: Globe, label: 'Sitio Web' },
  { to: '/admin/blog', icon: Article, label: 'Blog' },
  { to: '/admin/settings', icon: Gear, label: 'Configuración' },
];

const plannedItems = [
  { to: '/admin/roles', icon: UserCircleGear, label: 'Roles' },
  { to: '/admin/reports', icon: ChartLine, label: 'Reportes' },
  { to: '/admin/notifications', icon: Bell, label: 'Notificaciones' },
  { to: '/admin/cameras', icon: Camera, label: 'Cámaras' },
];

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'w-64 bg-card border-r border-border flex flex-col overflow-y-auto',
        className
      )}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Barbell className="text-primary-foreground" size={24} weight="bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">GymFlow</h1>
            <p className="text-xs text-muted-foreground">Sistema de Control</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  'text-sm font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} weight={isActive ? 'fill' : 'regular'} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1">
          <div className="px-4 py-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Planificado
            </p>
          </div>
          {plannedItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  'text-sm font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} weight={isActive ? 'fill' : 'regular'} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          v2.0.0 - MVP Extendido
        </div>
      </div>
    </aside>
  );
}
