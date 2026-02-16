import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { siteService } from '@/services/site.service';
import type { SiteConfig } from '@/types/models';

/**
 * Hook para aplicar los colores personalizados del tema a todo el sistema.
 * Los colores configurados en SiteSettings afectan:
 * - Panel de administración
 * - Sitio web público
 * - Todos los componentes que usen CSS variables del tema
 */
export function useThemeColors() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [animationSettings, setAnimationSettings] = useState<SiteConfig['animationSettings'] | undefined>(undefined);
  const appliedRef = useRef(false);
  const location = useLocation();

  const applyColors = (config: SiteConfig, path: string) => {
    const root = document.documentElement;
    const isDashboard = path.startsWith('/admin') || path.startsWith('/login');

    // Check if new structure exists
    // Cast to any because the type definition might strict but runtime can be mixed or transitioning
    const themeConfig = config.themeColors as any;

    let activeTheme: any = null;

    if (themeConfig && themeConfig.admin && themeConfig.public) {
      // New Structure
      activeTheme = isDashboard ? themeConfig.admin : themeConfig.public;
    } else {
      // Old Structure / Flattened
      // Use existing themeColors or primaryColor
      // If it's old structure, we treat it as GLOBAL (applied to both)
      activeTheme = {
        colors: config.themeColors || {},
        font: null // Old structure didn't have font
      };

      // Fix for primary color deprecated
      if (!activeTheme.colors.primary && config.primaryColor) {
        activeTheme.colors.primary = config.primaryColor;
      }
    }

    if (!activeTheme) return;

    // Apply Font
    if (activeTheme.font) {
      const fontValue = `"${activeTheme.font}", sans-serif`;
      root.style.setProperty('--font-sans', fontValue);
      root.style.setProperty('--font-heading', fontValue);

      // Load Google Font
      const linkId = 'dynamic-theme-font';
      let link = document.getElementById(linkId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      // Simple Google Fonts loader
      link.href = `https://fonts.googleapis.com/css2?family=${activeTheme.font.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
    } else {
      // Reset to default if no font specified
      root.style.removeProperty('--font-sans');
      root.style.removeProperty('--font-heading');
    }

    // Apply Colors
    if (activeTheme.colors) {
      Object.entries(activeTheme.colors).forEach(([key, value]) => {
        if (!value) return;
        // Convert camelCase to kebab-case for CSS variables (e.g., cardForeground -> --card-foreground)
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value as string);
      });

      // Ensure primary/foreground mapping for compat
      if (activeTheme.colors.primary) {
        root.style.setProperty('--primary', activeTheme.colors.primary);
        // Default foreground if not set
        if (!activeTheme.colors.primaryForeground) {
          root.style.setProperty('--primary-foreground', 'oklch(1 0 0)');
        }
      }
    }
  };

  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const config = await siteService.getConfig();
        applyColors(config, location.pathname);
        setAnimationSettings(config.animationSettings);
      } catch (error) {
        console.error('Error al sincronizar configuración del tema:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    // Apply cached first
    const cached = siteService.getCachedConfig();
    if (cached) {
      applyColors(cached, location.pathname);
      setAnimationSettings(cached.animationSettings);
    }

    // Then sync
    syncWithBackend();
  }, [location.pathname]);

  return { isLoaded, animationSettings };
}

/**
 * Aplica un color de tema específico (para uso inmediato sin esperar async)
 */
export function applyThemeColor(color: string) {
  if (color) {
    document.documentElement.style.setProperty('--primary', color);
  }
}
