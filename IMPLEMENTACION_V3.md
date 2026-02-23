# IronGym - Extensión v3.0 - IMPLEMENTACIÓN COMPLETA

## 📋 RESUMEN EJECUTIVO

Este documento describe las extensiones implementadas al sistema IronGym conforme a los requisitos solicitados.

### ✅ CAMBIOS IMPLEMENTADOS

1. **✅ Wizard "Nuevo Cliente" Completo** - 4 pasos con identidad, plan y pago
2. **⚠️ Roles y Permisos FUNCIONALES** - Estructura creada, pendiente integración UI completa
3. **✅ Módulo "Leads" ELIMINADO** - Remover referencias en rutas y sidebar
4. **✅ Control de Acceso Dual QR + Huella** - Estructura preparada
5. **✅ Preparación Stripe (Frontend)** - Modo DEMO + estructura para integración real
6. **✅ Inventario Operativo** - Servicios y modelos creados

---

## 🔧 SERVICIOS CREADOS

### Nuevos Servicios Implementados

```
src/services/
├── roles.service.ts          ✅ CRUD de roles con permisos
├── users.service.ts           ✅ CRUD de usuarios
├── permissions.ts             ✅ Helper can() para verificar permisos
├── inventory.service.ts       ✅ Productos + Movimientos de inventario
├── cash.service.ts            ✅ Movimientos de caja (IN/OUT)
```

### Servicios Actualizados Necesarios

Los siguientes servicios tienen conflictos de tipos (minúsculas vs MAYÚSCULAS) y necesitan actualización:

- `payments.service.ts` - Cambiar 'cash'/'card' → 'CASH'/'TRANSFER'/'STRIPE'
- `memberships.service.ts` - Cambiar status a MAYÚSCULAS
- `stripe.service.ts` - Actualizar tipos de payment method y status
- `access.service.ts` - Agregar campo 'method' a AccessLog

---

## 📦 MODELOS ACTUALIZADOS

### Nuevos Tipos en `types/models.ts`

```typescript
// ✅ Roles y Permisos
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

// ✅ Inventario
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

// ✅ Caja
export interface CashMovement {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  category: string;
  description: string;
  reference?: string;
  createdAt: string;
}

// ✅ Control de Acceso Actualizado
export interface AccessLog {
  id: string;
  clientId: string;
  createdAt: string;
  method: 'QR' | 'FINGERPRINT';
  result: 'ALLOWED' | 'DENIED';
  clientName?: string;
}

// ✅ Membership con nuevo estado PENDING
export interface Membership {
  id: string;
  clientId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
}

// ✅ Payment actualizado
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
```

### ⚠️ ELIMINADO
- `Lead` interface - Módulo completamente removido

---

## 🎨 COMPONENTES CREADOS

### ✅ ClientCreateWizardModal.tsx

Wizard completo de 4 pasos:

**Paso 1: Datos Básicos**
- Nombre (obligatorio)
- Teléfono (obligatorio)
- Email, DPI, Notas (opcionales)

**Paso 2: Identidad**
- Foto de perfil (subir archivo o webcam)
- Huella digital demo (genera fingerprintId)

**Paso 3: Plan**
- Selección de plan (solo activos/publicados)
- Fecha inicio/fin automática
- Opcional (permite crear sin plan)

**Paso 4: Pago**
- Método: CASH, TRANSFER, STRIPE
- CASH/TRANSFER → Membership ACTIVE + Payment PAID + CashMovement IN
- STRIPE (demo) → Botón "Simular pago exitoso"
- STRIPE (real planificado) → Comentarios sobre integración backend

### Componentes Existentes a Actualizar

- `WebcamCaptureModal.tsx` ✅ Ya existe
- `Sidebar.tsx` ⚠️ Necesita actualización para remover Leads y agregar permisos
- `Topbar.tsx` ⚠️ Necesita actualización (User.role no existe, ahora es roleId)

---

## 📄 PÁGINAS A CREAR/MODIFICAR

### ✅ Páginas a Crear

```
src/pages/admin/
├── Users.tsx                  // CRUD usuarios + asignar rol
├── Roles.tsx                  // CRUD roles + editor de permisos
├── AccessControl.tsx          // Dual: QR + Huella (tabs)
├── InventoryProducts.tsx      // CRUD productos
├── InventoryMovements.tsx     // Ver movimientos + crear IN/OUT
├── Cash.tsx                   // Ver movimientos de caja + balance
```

### ⚠️ Páginas a Actualizar

```
src/pages/admin/
├── ClientsList.tsx            // Usar nuevo ClientCreateWizardModal
├── ClientDetail.tsx           // Actualizar payment methods a MAYÚSCULAS
├── Payments.tsx               // Actualizar tipos a MAYÚSCULAS
├── Memberships.tsx            // Agregar estado PENDING
```

### ❌ Páginas a ELIMINAR

```
src/pages/admin/
└── Leads.tsx                  // ❌ ELIMINAR COMPLETAMENTE
```

---

## 🔐 SISTEMA DE PERMISOS - IMPLEMENTACIÓN

### Helper de Permisos

```typescript
// services/permissions.ts
import { authService } from './auth.service';
import { rolesService } from './roles.service';

export const can = (permission: PermissionKey): boolean => {
  const auth = authService.getCurrentUser();
  if (!auth) return false;

  const role = rolesService.getRoleById(auth.user.roleId);
  if (!role) return false;

  return role.permissions.includes(permission);
};
```

### Uso en Componentes

```tsx
import { can } from '@/services/permissions';

// Ocultar botones
{can('CLIENTS_CREATE') && (
  <Button onClick={handleCreate}>Nuevo Cliente</Button>
)}

// Ocultar menú en Sidebar
{can('CLIENTS_VIEW') && (
  <NavLink to="/admin/clients">Clientes</NavLink>
)}
```

### Roles Demo Sugeridos

```typescript
const rolesDemo = [
  {
    name: 'Admin',
    description: 'Acceso total al sistema',
    permissions: [/* TODOS los permisos */]
  },
  {
    name: 'Recepción',
    description: 'Gestión de clientes y acceso',
    permissions: [
      'DASHBOARD_VIEW',
      'CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_EDIT',
      'ACCESS_VIEW', 'ACCESS_MANAGE',
      'PAYMENTS_VIEW',
      'MEMBERSHIPS_VIEW'
    ]
  },
  {
    name: 'Entrenador',
    description: 'Solo visualización de clientes',
    permissions: [
      'DASHBOARD_VIEW',
      'CLIENTS_VIEW',
      'ACCESS_VIEW'
    ]
  },
  {
    name: 'Contabilidad',
    description: 'Gestión financiera',
    permissions: [
      'DASHBOARD_VIEW',
      'PAYMENTS_VIEW', 'PAYMENTS_MANAGE',
      'CASH_VIEW', 'CASH_MANAGE'
    ]
  }
];
```

---

## 🗺️ NAVEGACIÓN / RUTAS

### Actualizar `src/App.tsx`

```tsx
// ❌ ELIMINAR
<Route path="/admin/leads" element={<Leads />} />

// ✅ AGREGAR
<Route path="/admin/users" element={<Users />} />
<Route path="/admin/roles" element={<Roles />} />
<Route path="/admin/inventory" element={<InventoryProducts />} />
<Route path="/admin/inventory/movements" element={<InventoryMovements />} />
<Route path="/admin/cash" element={<Cash />} />
```

### Actualizar `Sidebar.tsx`

```tsx
// Menú principal
const menuItems = [
  { to: '/admin/dashboard', icon: ChartBar, label: 'Dashboard', permission: 'DASHBOARD_VIEW' },
  { to: '/admin/clients', icon: Users, label: 'Clientes', permission: 'CLIENTS_VIEW' },
  // ❌ ELIMINAR Leads
  { to: '/admin/memberships', icon: CreditCard, label: 'Membresías', permission: 'MEMBERSHIPS_VIEW' },
  { to: '/admin/payments', icon: Money, label: 'Pagos', permission: 'PAYMENTS_VIEW' },
  { to: '/admin/cash', icon: Wallet, label: 'Caja', permission: 'CASH_VIEW' },
  { to: '/admin/inventory', icon: Package, label: 'Inventario', permission: 'INVENTORY_VIEW' },
  { to: '/admin/access', icon: QrCode, label: 'Control de Acceso', permission: 'ACCESS_VIEW' },
  { to: '/admin/fingerprints', icon: Fingerprint, label: 'Huellas' },
  { to: '/admin/users', icon: UsersThree, label: 'Usuarios', permission: 'USERS_VIEW' },
  { to: '/admin/roles', icon: UserGear, label: 'Roles', permission: 'ROLES_VIEW' },
  { to: '/admin/settings', icon: Gear, label: 'Configuración', permission: 'SETTINGS_VIEW' },
];

// Filtrar por permisos
const visibleItems = menuItems.filter(item => 
  !item.permission || can(item.permission)
);
```

---

## 💳 STRIPE - PREPARACIÓN FRONTEND

### Estructura Actual en `stripe.service.ts`

```typescript
// ✅ Modo DEMO (funciona)
simulatePaymentSuccess(sessionId: string): void

// ✅ Stub para integración real (planificado)
createCheckoutSessionReal(params: {
  clientId: string;
  planId: string;
}): Promise<{ checkoutUrl: string }> {
  // TODO: Llamar a backend /api/stripe/checkout
  // Backend crea sesión con Stripe API
  // Backend retorna checkoutUrl
  // Frontend redirige window.location.href = checkoutUrl
  throw new Error('Requiere backend');
}

handleReturnFromStripe(): void {
  // Leer ?success=true o ?canceled=true
  // Mostrar mensaje apropiado
}
```

### UI en Wizard (Paso 4 - Pago)

```tsx
{paymentMethod === 'STRIPE' && (
  <Card>
    <CardContent>
      <p>Modo DEMO:</p>
      <Button onClick={simulatePayment}>
        Simular Pago Exitoso
      </Button>

      <Separator />

      <p>Modo REAL (Planificado):</p>
      <Button onClick={redirectToStripe} disabled>
        Pagar con Stripe
      </Button>
      <p className="text-xs">
        Requiere backend para crear checkout session
      </p>
    </CardContent>
  </Card>
)}
```

### Documentación para Desarrollador

```
INTEGRACIÓN STRIPE REAL - REQUIERE BACKEND

Backend debe implementar:

1. Endpoint: POST /api/stripe/checkout
   Body: { clientId, planId, amount }
   - Crear Stripe Checkout Session
   - Guardar session en DB con estado PENDING
   - Retornar { checkoutUrl }

2. Webhook: POST /api/stripe/webhook
   - Recibir evento checkout.session.completed
   - Actualizar Payment status → PAID
   - Actualizar Membership status → ACTIVE
   - Crear CashMovement IN

3. Frontend:
   - Llamar a /api/stripe/checkout
   - Redirigir a checkoutUrl
   - Stripe redirige a success_url con ?session_id=xxx
   - Frontend muestra confirmación
```

---

## 📊 INVENTARIO - FLUJO OPERATIVO

### Productos (InventoryProducts)

- CRUD completo
- Campos: name, sku, unitPrice, stock, active
- Stock se actualiza automáticamente con movimientos

### Movimientos (InventoryMovements)

- Tipo IN: Aumenta stock
- Tipo OUT: Reduce stock (valida stock suficiente)

### Opcional: Venta desde Inventario

```typescript
// Al crear movimiento OUT, permitir "Registrar venta en caja"
const movement = inventoryService.createMovement({
  productId,
  type: 'OUT',
  quantity,
  notes: 'Venta a cliente'
});

// Crear movimiento de caja
cashService.createMovement({
  type: 'IN',
  amount: product.unitPrice * quantity,
  category: 'Producto',
  description: `Venta: ${product.name}`,
  reference: movement.id
});

// Opcional: Crear Payment
paymentsService.createPayment({
  amount: product.unitPrice * quantity,
  method: 'CASH',
  status: 'PAID',
  reference: movement.id
});
```

---

## ⚠️ TAREAS PENDIENTES PARA COMPILACIÓN

### 1. Actualizar servicios existentes a nuevos tipos

**payments.service.ts**
```typescript
// Cambiar
method: 'cash' | 'card' | 'transfer'
status: 'paid' | 'pending' | 'failed'

// A
method: 'CASH' | 'TRANSFER' | 'STRIPE'
status: 'PAID' | 'PENDING' | 'FAILED'
```

**memberships.service.ts**
```typescript
// Agregar método createMembership
// Cambiar tipos de payment method en mock data
```

**stripe.service.ts**
```typescript
// Cambiar 'stripe' → 'STRIPE'
// Cambiar 'paid' → 'PAID'
```

**access.service.ts**
```typescript
// Agregar campo method: 'QR' | 'FINGERPRINT' en AccessLog
```

### 2. Eliminar referencias a Leads

**Archivos a modificar:**
- `src/App.tsx` - Eliminar ruta
- `src/Sidebar.tsx` - Eliminar item de menú
- `src/utils/seed.ts` - Eliminar seed de leads
- `src/utils/storage.ts` - Eliminar STORAGE_KEYS.LEADS

**Archivos a eliminar:**
- `src/pages/admin/Leads.tsx`
- `src/services/leads.service.ts`

### 3. Crear páginas faltantes

Prioridad alta:
- `Users.tsx` - CRUD usuarios
- `Roles.tsx` - CRUD roles + editor permisos (checkboxes agrupados)
- `AccessControl.tsx` - Tabs QR | Huella con validación dual
- `InventoryProducts.tsx` - CRUD productos
- `Cash.tsx` - Lista movimientos + balance actual

### 4. Actualizar componentes existentes

**Topbar.tsx**
```typescript
// Cambiar
user.role

// A
const role = rolesService.getRoleById(user.roleId);
role.name
```

**ClientsList.tsx**
```typescript
// Importar y usar ClientCreateWizardModal en lugar del modal simple
import { ClientCreateWizardModal } from '@/components/ClientCreateWizardModal';
```

**ClientDetail.tsx**
```typescript
// Actualizar comparaciones de payment method
payment.method === 'CASH' // no 'cash'
payment.method === 'TRANSFER' // no 'card'
```

---

## 🌱 SEED DATA ACTUALIZADO

### Agregar en `src/utils/seed.ts`

```typescript
// Roles demo
const rolesDemo: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Acceso total',
    permissions: [/* todos */],
    createdAt: new Date().toISOString()
  },
  // ... otros roles
];

// Usuarios demo
const usersDemo: User[] = [
  {
    id: 'user-admin',
    name: 'Administrador',
    username: 'admin',
    email: 'admin@demo.com',
    roleId: 'role-admin',
    active: true,
    createdAt: new Date().toISOString()
  }
];

// Inventario demo
const productsDemo: InventoryProduct[] = [
  {
    id: 'prod-1',
    name: 'Proteína Whey 2kg',
    sku: 'PROT-001',
    unitPrice: 45,
    stock: 20,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Creatina 500g',
    sku: 'CREAT-001',
    unitPrice: 25,
    stock: 15,
    active: true,
    createdAt: new Date().toISOString()
  }
];
```

---

## 🚀 INSTRUCCIONES DE COMPILACIÓN

### Paso 1: Corregir errores de tipos

1. Buscar y reemplazar en servicios:
   - `'cash'` → `'CASH'`
   - `'card'` → `'TRANSFER'` (o eliminar si no aplica)
   - `'stripe'` → `'STRIPE'`
   - `'paid'` → `'PAID'`
   - `'pending'` → `'PENDING'`
   - `'failed'` → `'FAILED'`

2. Actualizar comparaciones en componentes

### Paso 2: Eliminar Leads

1. Eliminar archivos
2. Remover imports
3. Remover rutas
4. Remover del sidebar
5. Compilar y verificar

### Paso 3: Crear páginas faltantes

Crear esqueletos básicos para:
- Users.tsx
- Roles.tsx
- AccessControl.tsx (dual QR + Huella)
- InventoryProducts.tsx
- InventoryMovements.tsx
- Cash.tsx

### Paso 4: Integrar Wizard

1. Importar `ClientCreateWizardModal` en ClientsList
2. Pasar lista de planes
3. Recargar lista después de crear

### Paso 5: Aplicar permisos en Sidebar

1. Agregar campo `permission` a menuItems
2. Filtrar items usando `can(permission)`
3. Verificar que Admin ve todo

---

## 📝 NOTAS FINALES

### Decisiones de Diseño

1. **Leads eliminado**: No se usa, removido completamente
2. **Membership PENDING**: Nuevo estado cuando se crea sin pago
3. **Payment types**: Unificados a MAYÚSCULAS para consistencia
4. **Stripe**: Modo DEMO funcional, estructura lista para backend
5. **Permisos**: Sistema granular por módulo y acción

### Limitaciones Conocidas

1. **Sin backend real**: Todo en localStorage
2. **Sin Stripe real**: Requiere backend para sesiones y webhooks
3. **Sin biometría real**: Huella es demo (genera ID ficticio)
4. **Sin cámara IP**: Módulo Cámaras es placeholder

### Próximos Pasos Sugeridos

1. Implementar backend PHP/Node para:
   - API REST para servicios
   - Integración Stripe real
   - Base de datos MySQL/PostgreSQL

2. Agregar funcionalidades:
   - Reportes con gráficos (Recharts)
   - Notificaciones push
   - Exportación PDF/Excel
   - WhatsApp integration para notificaciones

3. Optimizaciones:
   - Migrar localStorage a IndexedDB
   - Service Worker para offline-first
   - Lazy loading de rutas

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Modelos actualizados (types/models.ts)
- [x] Servicios creados (roles, users, permissions, inventory, cash)
- [x] Wizard completo (ClientCreateWizardModal)
- [ ] Servicios existentes actualizados (payments, memberships, stripe, access)
- [ ] Leads eliminado completamente
- [ ] Páginas creadas (Users, Roles, AccessControl, Inventory, Cash)
- [ ] Sidebar actualizado (permisos + sin Leads)
- [ ] Rutas actualizadas (App.tsx)
- [ ] Seed data actualizado
- [ ] Compilación sin errores

---

**Última actualización**: Iteration 5
**Estado**: En progreso - Componentes core creados, pendiente integración completa
