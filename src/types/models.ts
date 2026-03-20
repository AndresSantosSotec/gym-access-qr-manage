export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dpi?: string;
  nit?: string;
  companyName?: string;
  fiscalAddress?: string;
  photo?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  membershipEnd?: string;
  profilePhoto?: string;
  fingerprintId?: string;
  fingerprintRegisteredAt?: string;
  createdAt: string;
}

export interface EconomicProfileItem {
  id: string;
  clientId: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  source?: string;
  monthlyAmount: number;
  active: boolean;
  createdAt: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  published: boolean;
  slug: string;
  recurrente_product_id?: string | null;
  recurrente_price_id?: string | null;
  synced_with_recurrente?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  clientId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'PENDING';
  totalAmount?: number;
  paymentType?: 'single' | 'installments';
  numInstallments?: number;
  amountPaid?: number;
  paymentStatus?: 'paid' | 'partial' | 'pending' | 'overdue';
  balance?: number;
  installments?: PaymentInstallment[];
  plan?: MembershipPlan;
  client?: Client;
  createdAt: string;
}

export interface PaymentInstallment {
  id: number;
  membership_id: number;
  client_id: number;
  installment_number: number;
  amount: number;
  amount_paid: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  payment_id?: number;
  paid_at?: string;
  notes?: string;
  membership?: any;
  client?: any;
  created_at?: string;
}

export interface Payment {
  id: string;
  clientId?: string;
  leadId?: string;
  planId: string;
  membershipId?: string;
  amount: number;
  method: 'CASH' | 'TRANSFER' | 'STRIPE' | 'CARD';
  createdAt: string;
  reference?: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
}

export interface Lead {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  planSlug: string;
  preferredPaymentMethod: string;
  status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';
  source?: string;
  notes?: string;
  contactedAt?: string;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  clientId: string;
  createdAt: string;
  method: 'QR' | 'FINGERPRINT';
  result: 'ALLOWED' | 'DENIED';
  clientName?: string;
}

export interface AccessLogRecord {
  id: number;
  client_id: number;
  access_time: string;
  access_type: 'entry' | 'exit';
  verification_method: 'qr' | 'fingerprint';
  status: 'allowed' | 'denied';
  notes?: string | null;
  qr_code?: string | null;
  fingerprint_id?: string | null;
  client?: {
    id: number;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    dni?: string;
    status?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type PermissionKey =
  | 'DASHBOARD_VIEW'
  | 'CLIENTS_VIEW' | 'CLIENTS_CREATE' | 'CLIENTS_EDIT' | 'CLIENTS_DELETE'
  | 'PLANS_VIEW' | 'PLANS_MANAGE'
  | 'MEMBERSHIPS_VIEW' | 'MEMBERSHIPS_MANAGE'
  | 'PAYMENTS_VIEW' | 'PAYMENTS_MANAGE'
  | 'CASH_VIEW' | 'CASH_MANAGE'
  | 'INVENTORY_VIEW' | 'INVENTORY_IN' | 'INVENTORY_OUT' | 'INVENTORY_MANAGE'
  | 'PRODUCTS_VIEW' | 'PRODUCTS_CREATE' | 'PRODUCTS_EDIT' | 'PRODUCTS_DELETE'
  | 'SALES_VIEW' | 'SALES_CREATE' | 'QUOTES_VIEW' | 'SALES_CLIENTS_MANAGE'
  | 'ACCESS_VIEW' | 'ACCESS_MANAGE'
  | 'SETTINGS_VIEW' | 'SETTINGS_MANAGE'
  | 'ROLES_VIEW' | 'ROLES_MANAGE'
  | 'USERS_VIEW' | 'USERS_MANAGE'
  | 'REPORTS_VIEW' | 'NOTIFICATIONS_VIEW'
  | 'MONITOR_VIEW';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionKey[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  roleId: string;
  role?: Role;
  active: boolean;
  createdAt: string;
  documents?: {
    name: string;
    url: string;
    type?: string;
    category?: string;
  }[];
  // Campos adicionales para staff
  phone?: string;
  photo?: string; // URL de la foto de perfil
  photos?: string[]; // URLs de fotos adicionales del staff
  address?: string;
  birthDate?: string;
  position?: string; // Cargo/puesto
  hireDate?: string; // Fecha de contratación
  salary?: number;
  cvUrl?: string; // URL de la hoja de vida
  documentsUrls?: string[]; // URLs de documentos adicionales
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  // Campos de biometría
  fingerprintId?: string; // ID de la huella digital registrada
  fingerprintRegisteredAt?: string; // Fecha de registro de huella
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  roleId: string;
  active: boolean;
  phone?: string;
  photo?: string;
  photos?: string[];
  address?: string;
  birthDate?: string;
  position?: string;
  hireDate?: string;
  salary?: number;
  cvUrl?: string;
  documents?: {
    name: string;
    url: string;
    type?: string;
    category?: string;
  }[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  fingerprintId?: string;
  fingerprintRegisteredAt?: string;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  roleId?: string;
  active?: boolean;
  phone?: string;
  photo?: string;
  photos?: string[];
  address?: string;
  birthDate?: string;
  position?: string;
  hireDate?: string;
  salary?: number;
  cvUrl?: string;
  documents?: {
    name: string;
    url: string;
    type?: string;
    category?: string;
  }[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  fingerprintId?: string;
  fingerprintRegisteredAt?: string;
}

export interface AuthState {
  token: string;
  user: User;
}

export interface CashMovement {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  category: string;
  description: string;
  reference?: string;
  createdAt: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku?: string;
  unitPrice: number;
  stock: number;
  active: boolean;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface SiteSection {
  id: string;
  type: 'text' | 'hero' | 'features' | 'testimonials' | 'products' | 'contact' | 'blog_featured' | 'plans';
  title: string;
  subtitle?: string;
  content?: string;
  order: number;
  settings?: {
    limit?: number;
    showPrice?: boolean;
    showImage?: boolean;
    layout?: 'grid' | 'list' | 'carousel';
    category?: string; // For products or blog
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
  };
}

export interface ThemePalette {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  sidebar?: string;
  sidebarForeground?: string;
}

export interface ThemeSettings {
  admin: {
    colors: Partial<ThemePalette>;
    font: string;
  };
  public: {
    colors: Partial<ThemePalette>;
    font: string;
  };
}

export interface SiteConfig {
  gymName: string;
  slogan: string;
  aboutText: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  primaryColor: string; // Deprecated, use themeColors.public.colors.primary
  heroImages: string[];
  themeColors?: ThemeSettings; // Now storing Admin/Public separation
  animationSettings?: {
    enabled?: boolean;
    cardAnimation?: 'fade' | 'slide' | 'zoom' | 'none';
    heroAnimation?: 'fade' | 'slide' | 'zoom' | 'none';
  };
  sections?: SiteSection[];
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StripeSession {
  sessionId: string;
  checkoutUrl: string;
  planId: string;
  clientId?: string;
  leadId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
}

// --- Módulos Comerciales ---
// NOTA: Las propiedades usan snake_case para coincidir con la API de Laravel

export interface Marca {
  id: number;
  nombre: string;
}

export interface Presentacion {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  marca_id?: number;
  marca?: Marca;
  presentacion_id?: number;
  presentacion?: Presentacion;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto?: Producto;
  tipo: 'INGRESO' | 'EGRESO';
  cantidad: number;
  motivo: string;
  referencia_id?: number;
  created_at: string;
}

export interface ClienteVenta {
  id: number;
  nombre: string;
  nit?: string;
  ciudad?: string;
  telefono?: string;
  correo?: string;
  created_at?: string;
}

export interface MetodoPago {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Venta {
  id: number;
  cliente_venta_id?: number;
  cliente?: ClienteVenta;
  total: number;
  estado: 'PAGADA' | 'PENDIENTE' | 'COTIZACION';
  detalles?: VentaDetalle[];
  pagos?: PagoVenta[];
  receipt?: { id: number; receipt_number: string; status: string } | null;
  created_at: string;
}

export interface SalesCashCutMethodTotal {
  method: string;
  amount: number;
}

export interface SalesCashCutDailyTotal {
  date: string;
  amount: number;
  count: number;
}

export interface SalesCashCutProductTotal {
  product_id: number;
  name: string;
  quantity: number;
  amount: number;
}

export interface SalesCashCutSummary {
  from: string;
  to: string;
  count: number;
  total_revenue: number;
  total_items: number;
  by_method: SalesCashCutMethodTotal[];
  daily_totals: SalesCashCutDailyTotal[];
  top_products: SalesCashCutProductTotal[];
  sales: Venta[];
}

export interface VentaDetalle {
  id: number;
  venta_id: number;
  producto_id: number;
  producto?: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PagoVenta {
  id: number;
  venta_id: number;
  metodo_pago_id: number;
  metodo_pago?: MetodoPago;
  monto: number;
}
