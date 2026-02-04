export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dpi?: string;
  photo?: string;
  notes?: string;
  status: 'active' | 'expired' | 'inactive';
  membershipEnd?: string;
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

export interface Payment {
  id: string;
  clientId?: string;
  leadId?: string;
  planId: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'stripe';
  createdAt: string;
  reference?: string;
  status: 'paid' | 'pending' | 'failed';
}

export interface AccessLog {
  id: string;
  clientId: string;
  createdAt: string;
  result: 'ALLOWED' | 'DENIED';
  clientName?: string;
}

export interface User {
  email: string;
  name: string;
  role: 'admin';
}

export interface AuthState {
  token: string;
  user: User;
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

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  planSlug: string;
  preferredPaymentMethod: 'cash' | 'card';
  status: 'new' | 'contacted' | 'converted';
  createdAt: string;
  notes?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
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
