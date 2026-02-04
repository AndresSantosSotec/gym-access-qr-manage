export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dpi?: string;
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
  createdAt: string;
}

export interface Payment {
  id: string;
  clientId?: string;
  leadId?: string;
  planId: string;
  membershipId?: string;
  amount: number;
  method: 'CASH' | 'TRANSFER' | 'STRIPE';
  createdAt: string;
  reference?: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
}

export interface AccessLog {
  id: string;
  clientId: string;
  createdAt: string;
  method: 'QR' | 'FINGERPRINT';
  result: 'ALLOWED' | 'DENIED';
  clientName?: string;
}

export type PermissionKey =
  | 'DASHBOARD_VIEW'
  | 'CLIENTS_VIEW' | 'CLIENTS_CREATE' | 'CLIENTS_EDIT' | 'CLIENTS_DELETE'
  | 'PLANS_VIEW' | 'PLANS_MANAGE'
  | 'MEMBERSHIPS_VIEW' | 'MEMBERSHIPS_MANAGE'
  | 'PAYMENTS_VIEW' | 'PAYMENTS_MANAGE'
  | 'CASH_VIEW' | 'CASH_MANAGE'
  | 'INVENTORY_VIEW' | 'INVENTORY_MANAGE'
  | 'ACCESS_VIEW' | 'ACCESS_MANAGE'
  | 'SETTINGS_VIEW' | 'SETTINGS_MANAGE'
  | 'ROLES_VIEW' | 'ROLES_MANAGE'
  | 'USERS_VIEW' | 'USERS_MANAGE';

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
  active: boolean;
  createdAt: string;
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

export interface SiteConfig {
  gymName: string;
  slogan: string;
  aboutText: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  primaryColor: string;
  heroImageUrl?: string;
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
