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
  description?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  planId: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  createdAt: string;
  reference?: string;
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
