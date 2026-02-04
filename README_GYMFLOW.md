# GymFlow - Sistema de Gestión de Membresías

Sistema completo de gestión de membresías y control de acceso por QR para gimnasios y clubes deportivos.

## 🚀 Características Implementadas

### ✅ Módulos Completados

1. **Autenticación de Admin**
   - Login con validación
   - Usuario demo: `admin@demo.com` / `Admin123!`
   - Protección de rutas privadas
   - Sesión persistente en localStorage

2. **Dashboard Administrativo**
   - Métricas en tiempo real (miembros activos, vencidos, ingresos)
   - Últimos check-ins
   - Vista general del gimnasio

3. **Gestión de Clientes (CRUD Completo)**
   - Listado con búsqueda en tiempo real
   - Crear nuevos clientes
   - Vista detallada de cada cliente
   - Generación de código QR único
   - Historial de pagos y check-ins

4. **Membresías**
   - 3 planes predefinidos (Mensual, Trimestral, Anual)
   - Asignación de membresías a clientes
   - Cálculo automático de fechas de vencimiento
   - Registro de pagos (Efectivo, Tarjeta, Transferencia)
   - Actualización automática de estado

5. **Control de Acceso**
   - Verificación de códigos QR
   - Registro automático de check-ins
   - Feedback visual inmediato (permitido/denegado)
   - Historial de accesos en tiempo real

6. **Pase Digital QR (Vista Pública)**
   - URL única por cliente: `/qr/:clientId`
   - Código QR visible y escaneabl
   - Estado de membresía en tiempo real
   - Diseño mobile-first
   - Funciona offline después de primera carga

7. **DevContinueButton**
   - Roadmap de features futuras
   - Placeholders para próximas funcionalidades
   - Guía de expansión del sistema

## 📁 Estructura del Proyecto

```
/src
  /components
    DevContinueButton.tsx    # Botón de roadmap
    Sidebar.tsx              # Navegación lateral
    Topbar.tsx              # Barra superior con perfil
    /ui                     # Componentes shadcn
  
  /pages
    /auth
      AdminLogin.tsx        # Pantalla de inicio de sesión
    /admin
      AdminLayout.tsx       # Layout con sidebar + topbar
      Dashboard.tsx         # Métricas y resumen
      ClientsList.tsx       # Lista de clientes con búsqueda
      ClientDetail.tsx      # Detalle completo del cliente
      Memberships.tsx       # Catálogo de planes
      AccessControl.tsx     # Verificación de QR
      Settings.tsx          # Configuración (placeholder)
    /public
      QrPass.tsx           # Pase digital público
  
  /services
    auth.service.ts         # Lógica de autenticación
    clients.service.ts      # CRUD de clientes
    memberships.service.ts  # Gestión de planes y pagos
    access.service.ts       # Verificación y logs de acceso
  
  /types
    models.ts              # Interfaces TypeScript
  
  /utils
    storage.ts             # Wrapper de localStorage
    date.ts               # Utilidades de fechas y formato

  App.tsx                 # Configuración de rutas
```

## 🛠️ Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **React Router v7** - Enrutamiento
- **TailwindCSS v4** - Estilos
- **shadcn/ui v4** - Componentes UI
- **Phosphor Icons** - Iconografía
- **qrcode.react** - Generación de QR
- **Sonner** - Notificaciones toast
- **localStorage** - Persistencia de datos

## 📦 Instalación y Ejecución

### Requisitos
- Node.js 18+ 
- npm o pnpm

### Pasos

1. **Instalar dependencias** (ya instaladas)
```bash
npm install
```

2. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

3. **Abrir en el navegador**
```
http://localhost:5173
```

4. **Credenciales de acceso**
```
Email: admin@demo.com
Contraseña: Admin123!
```

## 🎯 Flujos de Uso

### 1. Login Admin
- Accede a `/login`
- Ingresa credenciales demo
- Serás redirigido al dashboard

### 2. Crear un Cliente
- Ve a **Clientes** → **Nuevo Cliente**
- Completa el formulario
- El cliente se guardará con estado "Inactivo"

### 3. Asignar Membresía
- Entra al detalle de un cliente
- Click en **Asignar Membresía**
- Selecciona plan, método de pago y monto
- La membresía se activa automáticamente

### 4. Generar QR
- Desde el detalle del cliente, click en **Ver QR**
- Se abrirá el pase digital en nueva pestaña
- Comparte la URL con el cliente

### 5. Verificar Acceso
- Ve a **Control de Acceso**
- Ingresa el código QR (ej: `QR-CLIENT-CLT-001`)
- Sistema valida y registra el check-in

## 🎨 Diseño y UX

### Paleta de Colores
- **Primary (Morado)**: `oklch(0.45 0.15 285)` - Acciones principales
- **Accent (Cian)**: `oklch(0.75 0.15 200)` - CTAs y notificaciones
- **Success (Verde)**: Membresías activas
- **Destructive (Rojo)**: Membresías vencidas

### Tipografía
- **Headings**: Space Grotesk (bold, tight spacing)
- **Body**: Inter (regular, excellent legibility)

### Componentes Clave
- Cards con sombras sutiles
- Badges para estados
- Toasts para feedback
- Modals para formularios
- Tablas responsivas

## 📊 Datos de Prueba

El sistema incluye 3 clientes mock:
- **CLT-001**: Juan Pérez (Activo, vence en 30 días)
- **CLT-002**: María González (Vencido hace 5 días)
- **CLT-003**: Carlos Ramírez (Activo, vence en 60 días)

3 planes de membresía:
- **Mensual**: Q250 / 30 días
- **Trimestral**: Q650 / 90 días
- **Anual**: Q2200 / 365 días

## 🔮 Próximas Funcionalidades

Ver el **DevContinueButton** (esquina inferior derecha) para:
- Sistema de facturación completa
- Roles y permisos multi-usuario
- Reportes y analytics avanzados
- Notificaciones push automáticas
- Integración con cámaras QR
- App móvil nativa

## 🔌 Preparado para Backend

El sistema está diseñado con una capa de servicios (`/services`) lista para conectarse a una API PHP:

```typescript
// Ejemplo de migración a API
export const clientsService = {
  getAll: async (): Promise<Client[]> => {
    // Cambiar de:
    // return storage.get<Client[]>(STORAGE_KEYS.CLIENTS) || [];
    
    // A:
    const response = await fetch('/api/clients');
    return await response.json();
  }
}
```

## 📱 URLs Importantes

- **Login**: `/login`
- **Dashboard**: `/admin/dashboard`
- **Clientes**: `/admin/clients`
- **Control Acceso**: `/admin/access`
- **Pase QR Público**: `/qr/:clientId`

## 💾 Persistencia de Datos

- Todos los datos se guardan en **localStorage**
- Los datos persisten entre sesiones
- Para reiniciar: Limpiar localStorage del navegador
- No requiere backend para funcionar

## 🚨 Notas Importantes

1. **Sin Backend Real**: Sistema 100% frontend con mocks
2. **localStorage**: Datos limitados al navegador actual
3. **Producción**: Requiere implementar API PHP para datos reales
4. **Seguridad**: Las credenciales son solo para demo
5. **QR**: Los códigos funcionan dentro del mismo navegador

## 📄 Licencia

MVP Frontend - Sistema de demostración para integración con backend PHP

---

**Desarrollado por**: Arquitecto Frontend Senior
**Versión**: 1.0.0 - MVP Completo
**Stack**: React + TypeScript + Vite + TailwindCSS
