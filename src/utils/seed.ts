import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { MembershipPlan, BlogPost, SiteConfig, Role } from '@/types/models';

// Función para limpiar datos (útil para desarrollo)
export const clearAllData = (): void => {
  localStorage.clear();
  console.log('✅ Datos limpiados. Recarga la página para reinicializar.');
};

// Hacer disponible globalmente para pruebas en consola
if (typeof window !== 'undefined') {
  (window as any).clearIronGymData = clearAllData;
}

export const initializeSeedData = (): void => {
  const seedInitialized = storage.get<boolean>(STORAGE_KEYS.SEED_INITIALIZED);
  
  if (seedInitialized) return;

  const now = new Date().toISOString();

  // Inicializar roles
  const mockRoles: Role[] = [
    {
      id: 'role-admin',
      name: 'Admin',
      description: 'Administrador con acceso completo al sistema',
      permissions: [
        'DASHBOARD_VIEW',
        'CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_EDIT', 'CLIENTS_DELETE',
        'PLANS_VIEW', 'PLANS_MANAGE',
        'MEMBERSHIPS_VIEW', 'MEMBERSHIPS_MANAGE',
        'PAYMENTS_VIEW', 'PAYMENTS_MANAGE',
        'CASH_VIEW', 'CASH_MANAGE',
        'INVENTORY_VIEW', 'INVENTORY_MANAGE',
        'SETTINGS_VIEW', 'SETTINGS_MANAGE',
        'ROLES_VIEW', 'ROLES_MANAGE',
        'USERS_VIEW', 'USERS_MANAGE',
      ],
      createdAt: now,
    },
    {
      id: 'role-staff',
      name: 'Staff',
      description: 'Personal del gimnasio con acceso limitado',
      permissions: [
        'DASHBOARD_VIEW',
        'CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_EDIT',
        'PLANS_VIEW',
        'MEMBERSHIPS_VIEW', 'MEMBERSHIPS_MANAGE',
        'PAYMENTS_VIEW',
      ],
      createdAt: now,
    },
  ];

  const mockPlans: MembershipPlan[] = [
    {
      id: 'PLAN-001',
      name: 'Plan Mensual',
      slug: 'mensual',
      price: 250,
      durationDays: 30,
      description: 'Perfecto para comenzar tu viaje fitness',
      features: [
        'Acceso completo al gimnasio',
        'Todas las clases grupales',
        'Vestuarios y duchas',
        'WiFi gratuito',
      ],
      published: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'PLAN-002',
      name: 'Plan Trimestral',
      slug: 'trimestral',
      price: 650,
      durationDays: 90,
      description: 'Ahorra Q100 con este plan de 3 meses',
      features: [
        'Acceso completo al gimnasio',
        'Todas las clases grupales',
        'Vestuarios y duchas',
        'WiFi gratuito',
        'Asesoría nutricional básica',
        '1 sesión de entrenamiento personal',
      ],
      published: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'PLAN-003',
      name: 'Plan Anual',
      slug: 'anual',
      price: 2200,
      durationDays: 365,
      description: 'La mejor inversión en tu salud - Ahorra Q800',
      features: [
        'Acceso completo al gimnasio',
        'Todas las clases grupales ilimitadas',
        'Vestuarios y duchas premium',
        'WiFi gratuito de alta velocidad',
        'Plan nutricional personalizado',
        '3 sesiones de entrenamiento personal al mes',
        'Acceso a zona VIP',
        'Invitaciones a eventos exclusivos',
      ],
      published: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const mockPosts: BlogPost[] = [
    {
      id: 'POST-001',
      title: '5 Consejos para Comenzar en el Gimnasio',
      slug: '5-consejos-para-comenzar',
      excerpt: 'Si eres nuevo en el gimnasio, estos consejos te ayudarán a empezar con el pie derecho y evitar errores comunes.',
      content: `## Bienvenido al Gimnasio

Si eres nuevo en el mundo del fitness, puede ser un poco intimidante al principio. Aquí te compartimos 5 consejos esenciales:

### 1. Empieza Despacio
No intentes hacer demasiado el primer día. Tu cuerpo necesita tiempo para adaptarse.

### 2. Aprende la Técnica Correcta
Es mejor hacer menos repeticiones con buena forma que muchas con mala técnica.

### 3. Calienta Siempre
Dedica 5-10 minutos al calentamiento antes de entrenar.

### 4. Mantente Hidratado
Lleva una botella de agua y bebe frecuentemente.

### 5. Descansa Adecuadamente
El descanso es tan importante como el entrenamiento. Tu cuerpo crece cuando descansas.

¡Nos vemos en el gimnasio!`,
      coverImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      published: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'POST-002',
      title: 'La Importancia de la Nutrición en el Fitness',
      slug: 'importancia-nutricion-fitness',
      excerpt: 'El ejercicio es solo la mitad de la ecuación. Descubre por qué la nutrición es fundamental para alcanzar tus objetivos.',
      content: `## Nutrición y Fitness van de la Mano

Muchas personas se enfocan solo en el entrenamiento, pero la nutrición es igualmente importante.

### Proteínas para Recuperación
Las proteínas ayudan a reparar y construir músculo. Incluye fuentes de calidad en cada comida.

### Carbohidratos para Energía
Los carbohidratos son tu principal fuente de energía durante el entrenamiento.

### Grasas Saludables
No temas a las grasas saludables. Son esenciales para muchas funciones corporales.

### Hidratación
El agua es crucial para el rendimiento y la recuperación.

### Consistencia es Clave
No necesitas una dieta perfecta, necesitas consistencia en buenos hábitos alimenticios.

Recuerda: los resultados se hacen en la cocina y se esculpen en el gimnasio.`,
      coverImageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
      published: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const siteConfig: SiteConfig = {
    gymName: 'IronGym',
    slogan: 'Tu mejor versión te espera',
    aboutText: 'Somos un gimnasio moderno y completo, dedicado a ayudarte a alcanzar tus metas de fitness. Con equipamiento de última generación, entrenadores certificados y un ambiente motivador, te acompañamos en cada paso de tu transformación.',
    phone: '+502 1234-5678',
    whatsapp: '+502 1234-5678',
    instagram: '@irongym_gt',
    primaryColor: 'oklch(0.45 0.15 285)',
    heroImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200',
    updatedAt: now,
  };

  storage.set('irongym_roles', mockRoles);
  storage.set(STORAGE_KEYS.MEMBERSHIP_PLANS, mockPlans);
  storage.set(STORAGE_KEYS.BLOG_POSTS, mockPosts);
  storage.set(STORAGE_KEYS.SITE_CONFIG, siteConfig);
  storage.set(STORAGE_KEYS.SEED_INITIALIZED, true);
};
