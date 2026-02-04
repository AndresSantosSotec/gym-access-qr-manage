import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { SiteConfig } from '@/types/models';

export const siteService = {
  getConfig: (): SiteConfig => {
    const config = storage.get<SiteConfig>(STORAGE_KEYS.SITE_CONFIG);
    return config || siteService.getDefaultConfig();
  },

  getDefaultConfig: (): SiteConfig => {
    return {
      gymName: 'GymFlow',
      slogan: 'Tu mejor versión te espera',
      aboutText: 'Somos un gimnasio moderno y completo, dedicado a ayudarte a alcanzar tus metas de fitness. Con equipamiento de última generación y entrenadores certificados.',
      phone: '+502 1234-5678',
      whatsapp: '+502 1234-5678',
      instagram: '@gymflow',
      primaryColor: 'oklch(0.45 0.15 285)',
      updatedAt: new Date().toISOString(),
    };
  },

  updateConfig: (updates: Partial<SiteConfig>): SiteConfig => {
    const current = siteService.getConfig();
    const updated: SiteConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    storage.set(STORAGE_KEYS.SITE_CONFIG, updated);
    return updated;
  },
};
