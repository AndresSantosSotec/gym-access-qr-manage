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
  Fingerprint,
  UserList,
  Package,
  Warehouse,
  ShoppingCart,
  Receipt,
} from '@phosphor-icons/react';
import { can } from '@/services/permissions';
import type { PermissionKey } from '@/types/models';

interface SidebarProps {
  className?: string;
}

interface MenuItem {
  to: string;
  icon: any;
  label: string;
  permission?: PermissionKey;
}

const menuItems: MenuItem[] = [
  { to: '/admin/dashboard', icon: ChartBar, label: 'Dashboard', permission: 'DASHBOARD_VIEW' },
  { to: '/admin/clients', icon: Users, label: 'Clientes', permission: 'CLIENTS_VIEW' },
  { to: '/admin/leads', icon: UsersFour, label: 'Leads', permission: 'CLIENTS_VIEW' },
  { to: '/admin/memberships', icon: CreditCard, label: 'Membresías', permission: 'MEMBERSHIPS_VIEW' },
  { to: '/admin/payments', icon: Money, label: 'Pagos', permission: 'PAYMENTS_VIEW' },
  { to: '/admin/receipts', icon: Receipt, label: 'Recibos y Facturas', permission: 'PAYMENTS_VIEW' },
  { to: '/admin/access', icon: QrCode, label: 'Control de Acceso', permission: 'ACCESS_VIEW' },
  { to: '/admin/fingerprints', icon: Fingerprint, label: 'Huellas Digitales', permission: 'ACCESS_VIEW' },
  { to: '/admin/staff', icon: UserList, label: 'Personal y Staff', permission: 'USERS_VIEW' },
  { to: '/admin/productos', icon: Package, label: 'Productos', permission: 'PRODUCTS_VIEW' },
  { to: '/admin/inventario', icon: Warehouse, label: 'Inventario', permission: 'INVENTORY_VIEW' },
  { to: '/admin/ventas', icon: ShoppingCart, label: 'Ventas y POS', permission: 'SALES_VIEW' },
  { to: '/admin/site', icon: Globe, label: 'Sitio Web', permission: 'SETTINGS_VIEW' },
  { to: '/admin/blog', icon: Article, label: 'Blog', permission: 'SETTINGS_VIEW' },
  { to: '/admin/settings', icon: Gear, label: 'Configuración' },
];

const plannedItems: MenuItem[] = [
  { to: '/admin/roles', icon: UserCircleGear, label: 'Roles', permission: 'ROLES_MANAGE' },
  { to: '/admin/reports', icon: ChartLine, label: 'Reportes' },
  { to: '/admin/notifications', icon: Bell, label: 'Notificaciones' },
  { to: '/admin/cameras', icon: Camera, label: 'Cámaras' },
];

export function Sidebar({ className }: SidebarProps) {
  const filteredMenuItems = menuItems.filter(item => !item.permission || can(item.permission));
  const filteredPlannedItems = plannedItems.filter(item => !item.permission || can(item.permission));

  return (
    <aside
      className={cn(
        'w-64 bg-card border-r border-border flex flex-col overflow-y-auto',
        className
      )}
      style={{
        backgroundColor: 'var(--sidebar, var(--card))',
        color: 'var(--sidebar-foreground, var(--card-foreground))',
        borderColor: 'var(--border)'
      }}
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
          {filteredMenuItems.map((item) => (
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
          {filteredPlannedItems.map((item) => (
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
