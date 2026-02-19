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
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;

    const applyColors = (config: SiteConfig) => {
      // 1. Get current mode for color selection (do not modify DOM classes here, handled by ThemeProvider)
      const savedTheme = localStorage.getItem('vite-ui-theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      let mode = savedTheme;

      if (!mode || mode === 'system') {
        mode = systemTheme;
      }

      // 2. Determine which color set to use
      const path = location.pathname;
      const isDashboard = path.startsWith('/admin') || path.startsWith('/login');
      const themeConfig = config.themeColors as any;

      let activeColors: Record<string, string> | null = null;
      let activeFont: string | null = null;

      if (themeConfig?.admin && themeConfig?.public) {
        // New Structure: Separate Admin/Public
        const targetTheme = isDashboard ? themeConfig.admin : themeConfig.public;
        if (targetTheme) {
          // Check if it has 'light'/'dark' sub-keys (advanced) or just flat colors
          if (targetTheme[mode] && typeof targetTheme[mode] === 'object') {
            activeColors = targetTheme[mode]; // e.g. themeConfig.admin.dark
          } else if (targetTheme.colors) {
            activeColors = targetTheme.colors; // Fallback to flat/old structure
            activeFont = targetTheme.font;
          } else {
            // Assume it's just the colors object directly if no wrapper
            activeColors = targetTheme;
          }
        }
      } else {
        // Old Structure: Flattened global colors
        activeColors = (config.themeColors as any) || {};

        // Backwards compatibility for 'primaryColor'
        // Backwards compatibility for 'primaryColor'
        if (config.primaryColor && activeColors && !activeColors.primary) {
          activeColors.primary = config.primaryColor;
        }
      }

      // 3. Apply Colors to CSS Variables
      if (activeColors) {
        const colors = activeColors;
        Object.entries(colors).forEach(([key, value]) => {
          if (!value || typeof value !== 'string') return;
          const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssVar, value);
        });

        if (colors?.primary) {
          root.style.setProperty('--primary', colors.primary);
          if (!colors?.primaryForeground) {
            root.style.setProperty('--primary-foreground', 'oklch(1 0 0)');
          }
        }
      }

      // 4. Apply Font
      if (activeFont) {
        const fontValue = `"${activeFont}", sans-serif`;
        root.style.setProperty('--font-sans', fontValue);
        root.style.setProperty('--font-heading', fontValue);

        // Load from Google Fonts
        const linkId = 'dynamic-theme-font';
        let link = document.getElementById(linkId) as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        link.href = `https://fonts.googleapis.com/css2?family=${activeFont.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
      }
    };

    const loadSettings = async () => {
      try {
        // Try cache first
        const cached = siteService.getCachedConfig();
        if (cached) {
          applyColors(cached);
          setAnimationSettings(cached.animationSettings);
        }

        // Then sync with backend
        const config = await siteService.getConfig();
        applyColors(config);
        setAnimationSettings(config.animationSettings);
      } catch (error) {
        console.warn('Error syncing theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
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
