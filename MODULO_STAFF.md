# Módulo de Personal y Staff - GymFlow

## Descripción

Módulo completo para la gestión de usuarios del sistema y personal del gimnasio. Permite crear, editar, visualizar y eliminar usuarios con información completa incluyendo datos personales, laborales, contactos de emergencia y documentación.

## Características Principales

### ✅ Gestión Completa de Usuarios
- **Creación de usuarios** con todos los datos necesarios
- **Edición** de información existente
- **Eliminación** con confirmación
- **Visualización detallada** de cada usuario
- **Búsqueda** por nombre, usuario, email o puesto

### 📋 Información que se Puede Gestionar

#### Datos Básicos
- Nombre completo
- Nombre de usuario (único)
- Email (único)
- Contraseña (encriptada)
- Teléfono
- Fecha de nacimiento
- Dirección
- Foto de perfil

#### Información Laboral
- Puesto/Cargo (Ej: Recepcionista, Entrenador, Gerente)
- Rol del sistema (con permisos)
- Fecha de ingreso/contratación
- Salario (opcional y confidencial)
- Estado (Activo/Inactivo)

#### Contacto de Emergencia
- Nombre del contacto
- Teléfono
- Relación (padre, madre, esposo/a, etc.)

#### Documentos y Notas
- URL de hoja de vida (CV)
- URLs de documentos adicionales
- Notas adicionales

## Acceso al Módulo

### Ubicación
**Panel Administrativo → Personal y Staff**

Ruta: `/admin/staff`

### Credenciales por Defecto
Para acceder al sistema por primera vez:

```
Email: admin@gymflow.com
Usuario: admin
Contraseña: password123
```

## Uso del Módulo

### 1. Crear Nuevo Usuario

1. Click en **"Nuevo Usuario"** (botón superior derecho)
2. Se abrirá un formulario con 4 pestañas:
   
   **Información Básica:**
   - Subir foto de perfil (opcional)
   - Ingresar nombre completo*
   - Nombre de usuario* (único, sin espacios)
   - Email* (único, formato válido)
   - Teléfono
   - Fecha de nacimiento
   - Dirección
   - Contraseña* (mínimo 6 caracteres)
   - Confirmar contraseña*

   **Información Laboral:**
   - Puesto/cargo (Ej: Entrenador Personal, Recepcionista)
   - Rol del sistema* (define permisos)
   - Fecha de ingreso
   - Salario (opcional, confidencial)
   - Estado (Activo/Inactivo)

   **Contacto de Emergencia:**
   - Nombre
   - Teléfono
   - Relación (padre, madre, hermano/a, etc.)

   **Documentos y Notas:**
   - URL de hoja de vida
   - Notas adicionales

3. Click en **"Crear Usuario"**

### 2. Editar Usuario

1. En la tabla de usuarios, click en el menú de 3 puntos (⋮)
2. Seleccionar **"Editar"**
3. Actualizar los campos necesarios
4. Click en **"Actualizar Usuario"**

**Nota:** Al editar, la contraseña es opcional. Solo se actualiza si se ingresa una nueva.

### 3. Ver Detalles

1. Click en menú de 3 puntos (⋮)
2. Seleccionar **"Ver detalles"**
3. Se mostrará toda la información del usuario
4. Desde aquí también se puede editar

### 4. Cambiar Contraseña

1. Click en menú de 3 puntos (⋮)
2. Seleccionar **"Cambiar contraseña"**
3. Ingresar nueva contraseña (mínimo 6 caracteres)
4. Confirmar

### 5. Eliminar Usuario

1. Click en menú de 3 puntos (⋮)
2. Seleccionar **"Eliminar"**
3. Confirmar la acción

⚠️ **Importante:** Esta acción no se puede deshacer.

### 6. Buscar Usuarios

Usar la barra de búsqueda para filtrar por:
- Nombre
- Usuario
- Email
- Puesto

## Estadísticas

El módulo muestra 4 tarjetas con estadísticas en tiempo real:

1. **Total Usuarios** - Cantidad total registrada
2. **Activos** - Usuarios que pueden acceder al sistema
3. **Inactivos** - Usuarios deshabilitados
4. **Roles Únicos** - Cantidad de roles diferentes

## Roles y Permisos

Los usuarios se asignan a roles que determinan sus permisos en el sistema:

- **Admin** - Acceso completo
- **Manager** - Gestión general
- **Recepcionista** - Acceso limitado
- **Entrenador** - Funcionalidades específicas
- Etc.

Los roles se gestionan desde: **Panel Administrativo → Roles**

## Seguridad

### Contraseñas
- Almacenadas por separado del resto de datos
- Mínimo 6 caracteres requeridos
- En producción se recomienda hashear las contraseñas

### Validaciones
- Nombres de usuario únicos
- Emails únicos
- Formato de email válido
- Usuarios inactivos no pueden iniciar sesión

### Datos Sensibles
- El salario se marca como confidencial
- Solo usuarios con permisos pueden ver/editar

## Archivos Modificados/Creados

### Nuevos Archivos
```
src/pages/admin/Staff.tsx
src/components/StaffFormModal.tsx
```

### Archivos Modificados
```
src/types/models.ts (interfaces User, CreateUserData, UpdateUserData)
src/services/users.service.ts (gestión completa de usuarios)
src/services/auth.service.ts (validación de credenciales)
src/App.tsx (nueva ruta /admin/staff)
src/components/Sidebar.tsx (enlace al módulo)
```

## Próximas Mejoras

### Recomendaciones
1. **Backend Real**: Conectar a API Laravel para persistencia
2. **Subida de Archivos**: Implementar upload real de fotos y documentos
3. **Hash de Contraseñas**: Usar bcrypt o similar
4. **Permisos Granulares**: Implementar control de acceso por rol
5. **Auditoría**: Registrar cambios en usuarios
6. **Exportación**: Generar reportes de personal en PDF/Excel
7. **Notificaciones**: Alertas por cumpleaños, aniversarios laborales
8. **Integración**: Conectar con módulo de asistencia/nómina

## Integración con Backend Laravel

Para conectar con el backend de Laravel:

### Endpoints Sugeridos
```
POST   /api/users              - Crear usuario
GET    /api/users              - Listar usuarios
GET    /api/users/:id          - Ver usuario
PUT    /api/users/:id          - Actualizar usuario
DELETE /api/users/:id          - Eliminar usuario
POST   /api/users/:id/password - Cambiar contraseña
POST   /api/auth/login         - Login
```

### Modelo Laravel
```php
// app/Models/User.php
protected $fillable = [
    'name', 'username', 'email', 'password',
    'phone', 'address', 'birth_date', 'photo',
    'position', 'hire_date', 'salary', 'role_id',
    'active', 'cv_url', 'emergency_contact', 'notes'
];

protected $hidden = ['password'];

protected $casts = [
    'emergency_contact' => 'array',
    'active' => 'boolean',
    'hire_date' => 'date',
    'birth_date' => 'date',
    'salary' => 'decimal:2',
];
```

## Soporte

Para dudas o problemas:
1. Revisar esta documentación
2. Verificar permisos del usuario
3. Consultar logs del sistema
4. Contactar al administrador del sistema

---

**Desarrollado para GymFlow - Sistema de Gestión de Gimnasios**

Versión: 2.0.0
Fecha: 2026
