import { storage, STORAGE_KEYS } from '@/utils/storage';
import { api } from './api.service';
import type { SiteConfig } from '@/types/models';

export const siteService = {
  /**
   * Obtener configuración cacheada inmediatamente (sin esperar API)
   */
  getCachedConfig: (): SiteConfig => {
    const cached = storage.get<SiteConfig>(STORAGE_KEYS.SITE_CONFIG);
    return cached || siteService.getDefaultConfig();
  },

  /**
   * Obtener configuración desde API (con fallback a cache)
   */
  getConfig: async (): Promise<SiteConfig> => {
    try {
      // Intentar obtener desde el backend
      const response = await api.get<SiteConfig>('/site-settings');
      const config = response.data;

      // Guardar en localStorage como caché
      storage.set(STORAGE_KEYS.SITE_CONFIG, config);
      return config;
    } catch (error) {
      console.warn('Backend no disponible, usando configuración local:', error);
      // Si falla, usar localStorage
      return siteService.getCachedConfig();
    }
  },

  getDefaultConfig: (): SiteConfig => {
    return {
      gymName: 'IronGym',
      slogan: 'Tu mejor versión te espera',
      aboutText: 'Somos un gimnasio moderno y completo, dedicado a ayudarte a alcanzar tus metas de fitness. Con equipamiento de última generación y entrenadores certificados.',
      phone: '5868 7153',
      whatsapp: '5868 7153',
      instagram: '@irongym',
      primaryColor: 'oklch(0.65 0.25 285)',
      heroImages: [],
      themeColors: {
        primary: '#7c3aed',
        secondary: '#64748b',
        background: '#ffffff',
        foreground: '#0f172a',
        card: '#ffffff',
        cardForeground: '#0f172a',
        muted: '#f1f5f9',
        mutedForeground: '#64748b',
        border: '#e2e8f0',
      },
      animationSettings: {
        enabled: true,
        cardAnimation: 'fade',
        heroAnimation: 'fade',
      },
      sections: [],
      updatedAt: new Date().toISOString(),
    };
  },

  updateConfig: async (updates: Partial<SiteConfig>): Promise<SiteConfig> => {
    const current = storage.get<SiteConfig>(STORAGE_KEYS.SITE_CONFIG) || siteService.getDefaultConfig();
    const updated: SiteConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Intentar guardar en el backend
      const response = await api.post<SiteConfig>('/site-settings', updated);
      const savedConfig = response.data;

      // Guardar en localStorage
      storage.set(STORAGE_KEYS.SITE_CONFIG, savedConfig);
      return savedConfig;
    } catch (error) {
      console.warn('Backend no disponible, guardando solo en local:', error);
      // Si falla, guardar solo en localStorage
      storage.set(STORAGE_KEYS.SITE_CONFIG, updated);
      return updated;
    }
  },
};
