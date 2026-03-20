import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartBar,
  Users,
  CreditCard,
  Gear,
  Barbell,
  Money,
  DoorOpen,
  UsersFour,
  Globe,
  Article,
  UserCircleGear,
  ChartLine,
  UserList,
  Package,
  Warehouse,
  ShoppingCart,
  Receipt,
  Terminal,
  X,
  Ticket,
} from '@phosphor-icons/react';
import { can } from '@/services/permissions';
import type { PermissionKey } from '@/types/models';

interface SidebarProps {
  className?: string;
  /** Mobile drawer: is sidebar visible? */
  isOpen?: boolean;
  /** Mobile drawer: callback to close */
  onClose?: () => void;
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
  { to: '/admin/registration-products', icon: Ticket, label: 'Inscripciones', permission: 'MEMBERSHIPS_VIEW' },
  { to: '/admin/payments', icon: Money, label: 'Pagos', permission: 'PAYMENTS_VIEW' },
  { to: '/admin/checkins', icon: DoorOpen, label: 'Check-ins', permission: 'ACCESS_VIEW' },
  { to: '/admin/receipts', icon: Receipt, label: 'Recibos y Facturas', permission: 'PAYMENTS_VIEW' },
  { to: '/admin/staff', icon: UserList, label: 'Personal y Staff', permission: 'USERS_VIEW' },
  { to: '/admin/productos', icon: Package, label: 'Productos', permission: 'PRODUCTS_VIEW' },
  { to: '/admin/inventario', icon: Warehouse, label: 'Inventario', permission: 'INVENTORY_VIEW' },
  { to: '/admin/ventas', icon: ShoppingCart, label: 'Ventas y POS', permission: 'SALES_VIEW' },
  { to: '/admin/site', icon: Globe, label: 'Sitio Web', permission: 'SETTINGS_VIEW' },
  { to: '/admin/blog', icon: Article, label: 'Blog', permission: 'SETTINGS_VIEW' },
];

const plannedItems: MenuItem[] = [
  { to: '/admin/roles', icon: UserCircleGear, label: 'Roles', permission: 'ROLES_MANAGE' },
  { to: '/admin/reports', icon: ChartLine, label: 'Reportes', permission: 'REPORTS_VIEW' },
  { to: '/admin/monitor', icon: Terminal, label: 'Monitor / Logs', permission: 'MONITOR_VIEW' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const filteredMenuItems = menuItems.filter(item => !item.permission || can(item.permission));
  const filteredPlannedItems = plannedItems.filter(item => !item.permission || can(item.permission));

  return (
    <div
      className="flex flex-col h-full w-64"
      style={{
        backgroundColor: 'var(--sidebar, var(--card))',
        color: 'var(--sidebar-foreground, var(--card-foreground))',
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Barbell className="text-primary-foreground" size={24} weight="bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">IronGym</h1>
            <p className="text-xs text-muted-foreground">Sistema de Control</p>
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
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
              Administración
            </p>
          </div>
          {filteredPlannedItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
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

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          v2.0.0 · IronGym
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar — always visible on lg+ ── */}
      <aside
        className={cn(
          'hidden lg:flex border-r border-border overflow-y-auto',
          className
        )}
        style={{ borderColor: 'var(--border)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside
            className="relative z-50 border-r border-border h-full overflow-y-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
