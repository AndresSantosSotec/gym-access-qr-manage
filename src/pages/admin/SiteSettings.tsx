import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ColorPicker } from '@/components/ColorPicker';
import { ImageUploader } from '@/components/ImageUploader';
import { siteService } from '@/services/site.service';
import { toast } from 'sonner';
import { FloppyDisk, Globe, Palette, Images, Sparkle, Layout, Plus, Trash, ArrowUp, ArrowDown, PencilSimple, Copy, Desktop, User } from '@phosphor-icons/react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SiteSection, SiteConfig, ThemeSettings } from '@/types/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const animations = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } },
  slide: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.5 } },
  zoom: { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.4 } },
  none: { initial: {}, animate: {}, transition: {} },
};

const animationOptions = [
  { value: 'fade', label: 'Fade In (Suave)', description: 'Ideal para texto e imágenes grandes.' },
  { value: 'slide', label: 'Slide Up (Deslizar)', description: 'Perfecto para tarjetas y listas.' },
  { value: 'zoom', label: 'Zoom In (Escaler)', description: 'Bueno para elementos destacados o botones.' },
  { value: 'none', label: 'Ninguna', description: 'Sin animación.' },
];

const PRESETS = {
  admin: [
    {
      id: 'default-light',
      label: 'Claro Estándar',
      config: {
        font: 'Inter',
        colors: {
          primary: '#4f46e5',
          background: '#ffffff',
          foreground: '#0f172a',
          sidebar: '#1e293b',
          sidebarForeground: '#ffffff'
        }
      }
    },
    {
      id: 'dark-modern',
      label: 'Oscuro Moderno',
      config: {
        font: 'Roboto',
        colors: {
          primary: '#6366f1',
          background: '#0f172a',
          foreground: '#f8fafc',
          sidebar: '#020617',
          sidebarForeground: '#e2e8f0',
          card: '#1e293b',
          cardForeground: '#f8fafc',
          border: '#334155'
        }
      }
    },
    {
      id: 'corporate-blue',
      label: 'Azul Corporativo',
      config: {
        font: 'Open Sans',
        colors: {
          primary: '#2563eb',
          background: '#f8fafc',
          foreground: '#1e293b',
          sidebar: '#1e3a8a',
          sidebarForeground: '#ffffff',
          card: '#ffffff',
          cardForeground: '#1e293b',
          border: '#e2e8f0'
        }
      }
    }
  ],
  public: [
    {
      id: 'clean-white',
      label: 'Blanco Limpio',
      config: {
        font: 'Inter',
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          background: '#ffffff',
          foreground: '#0f172a',
          card: '#ffffff',
          cardForeground: '#0f172a',
          border: '#e2e8f0'
        }
      }
    },
    {
      id: 'elegant-dark',
      label: 'Elegante Oscuro',
      config: {
        font: 'Montserrat',
        colors: {
          primary: '#c084fc',
          secondary: '#94a3b8',
          background: '#020617',
          foreground: '#f8fafc',
          card: '#1e293b',
          cardForeground: '#f8fafc',
          border: '#334155'
        }
      }
    },
    {
      id: 'vibrant',
      label: 'Vibrante',
      config: {
        font: 'Lato',
        colors: {
          primary: '#db2777',
          secondary: '#f472b6',
          background: '#fff1f2',
          foreground: '#831843',
          card: '#ffffff',
          cardForeground: '#881337',
          border: '#fbcfe8'
        }
      }
    }
  ]
};

// Helper: Hex to Luminance
const getLuminance = (hex: string) => {
  const c = hex.substring(1);      // strip #
  const rgb = parseInt(c, 16);   // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff;  // extract red
  const g = (rgb >> 8) & 0xff;  // extract green
  const b = (rgb >> 0) & 0xff;  // extract blue

  const [lr, lg, lb] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

const getContrastRatio = (color1?: string, color2?: string) => {
  if (!color1 || !color2) return 21; // Assume good if missing
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

const ContrastWarning = ({ ratio }: { ratio: number }) => {
  if (ratio >= 4.5) return null;
  return (
    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2 border border-amber-200 flex items-center gap-1">
      <span className="font-bold">⚠️ Baja Legibilidad:</span> El contraste es {ratio.toFixed(1)}:1 (Recomendado 4.5:1)
    </div>
  );
};

const sectionTypes = [
  { value: 'products', label: 'Productos Destacados' },
  { value: 'plans', label: 'Planes de Membresía' },
  { value: 'text', label: 'Texto Libre' },
  { value: 'testimonials', label: 'Testimonios' },
  { value: 'blog_featured', label: 'Blog Reciente' },
];

const fontOptions = [
  { value: 'Inter', label: 'Inter (Moderno)' },
  { value: 'Roboto', label: 'Roboto (Estándar)' },
  { value: 'Open Sans', label: 'Open Sans (Legible)' },
  { value: 'Lato', label: 'Lato (Amigable)' },
  { value: 'Montserrat', label: 'Montserrat (Geométrico)' },
];

export function SiteSettings() {
  const [config, setConfig] = useState<SiteConfig>(siteService.getDefaultConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Section Edit State
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Partial<SiteSection>>({});
  const [isEditingSection, setIsEditingSection] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const loadedConfig = await siteService.getConfig();

      // Ensure themeColors structure
      let themeColors = loadedConfig.themeColors as any;
      if (!themeColors || !themeColors.admin) {
        // Establish default structure if missing or old format
        themeColors = {
          admin: {
            font: 'Inter',
            colors: {
              primary: 'oklch(0.65 0.25 285)',
              background: '#ffffff',
              foreground: '#0f172a',
              sidebar: '#1e293b',
              sidebarForeground: '#ffffff'
            }
          },
          public: {
            font: 'Roboto',
            colors: loadedConfig.themeColors || { // Use existing flat themeColors for public if available
              primary: loadedConfig.primaryColor || 'oklch(0.65 0.25 285)',
              background: '#ffffff',
              foreground: '#0f172a',
              card: '#ffffff',
              cardForeground: '#0f172a',
              border: '#e2e8f0',
              secondary: '#64748b'
            }
          }
        };
      }

      setConfig({
        ...loadedConfig,
        themeColors: themeColors,
        animationSettings: loadedConfig.animationSettings || siteService.getDefaultConfig().animationSettings,
        sections: loadedConfig.sections || [],
      });
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await siteService.updateConfig(config);
      toast.success('Configuración guardada exitosamente');
      // Reload page to apply admin theme changes accurately? Or useThemeColors handles it?
      // useThemeColors handles it, but maybe a refresh is good for full clean application
    } catch (error) {
      toast.error('Error al guardar la configuración');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateAdminTheme = (key: string, value: string) => {
    const currentTheme = (config.themeColors as any)?.admin || {};
    setConfig({
      ...config,
      themeColors: {
        ...(config.themeColors as any),
        admin: {
          ...currentTheme,
          colors: {
            ...currentTheme.colors,
            [key]: value
          }
        }
      }
    });
  };

  const updateAdminFont = (font: string) => {
    setConfig({
      ...config,
      themeColors: {
        ...(config.themeColors as any),
        admin: {
          ...(config.themeColors as any).admin,
          font
        }
      }
    });
  };

  const updatePublicTheme = (key: string, value: string) => {
    const currentTheme = (config.themeColors as any)?.public || {};
    setConfig({
      ...config,
      themeColors: {
        ...(config.themeColors as any),
        public: {
          ...currentTheme,
          colors: {
            ...currentTheme.colors,
            [key]: value
          }
        }
      }
    });
  };

  const updatePublicFont = (font: string) => {
    setConfig({
      ...config,
      themeColors: {
        ...(config.themeColors as any),
        public: {
          ...(config.themeColors as any).public,
          font
        }
      }
    });
  };


  const updateAnimation = (key: string, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      animationSettings: {
        ...prev.animationSettings,
        [key]: value
      }
    }));
  };

  const handleAddSection = () => {
    setCurrentSection({
      type: 'text',
      title: '',
      subtitle: '',
      content: '',
      settings: { limit: 4, showPrice: true },
      order: (config.sections?.length || 0) + 1,
    });
    setIsEditingSection(false);
    setIsSectionDialogOpen(true);
  };

  const handleEditSection = (section: SiteSection) => {
    setCurrentSection(section);
    setIsEditingSection(true);
    setIsSectionDialogOpen(true);
  };

  const handleSaveSection = () => {
    if (!currentSection.title || !currentSection.type) {
      toast.error('El título y tipo son obligatorios');
      return;
    }

    let newSections = [...(config.sections || [])];

    if (isEditingSection) {
      newSections = newSections.map(s => s.id === currentSection.id ? { ...s, ...currentSection } as SiteSection : s);
    } else {
      const newSection: SiteSection = {
        ...currentSection,
        id: crypto.randomUUID(),
        order: newSections.length + 1,
      } as SiteSection;
      newSections.push(newSection);
    }

    // Sort by order
    newSections.sort((a, b) => a.order - b.order);

    setConfig({ ...config, sections: newSections });
    setIsSectionDialogOpen(false);
  };

  const handleDuplicateSection = (section: SiteSection) => {
    const newSection: SiteSection = {
      ...section,
      id: crypto.randomUUID(),
      title: `${section.title} (Copia)`,
      order: (config.sections?.length || 0) + 1,
    };

    const newSections = [...(config.sections || []), newSection];
    // Sort
    newSections.sort((a, b) => a.order - b.order);

    setConfig({ ...config, sections: newSections });
    toast.success('Sección duplicada');
  };

  const handleDeleteSection = (id: string) => {
    const newSections = (config.sections || []).filter(s => s.id !== id);
    setConfig({ ...config, sections: newSections });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...(config.sections || [])];
    if (direction === 'up' && index > 0) {
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }

    // Update order property
    newSections.forEach((s, i) => s.order = i + 1);

    setConfig({ ...config, sections: newSections });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const adminTheme = (config.themeColors as any)?.admin || {};
  const publicTheme = (config.themeColors as any)?.public || {};

  const currentHeroAnim = animations[config.animationSettings?.heroAnimation as keyof typeof animations || 'fade'];
  const currentCardAnim = animations[config.animationSettings?.cardAnimation as keyof typeof animations || 'fade'];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sitio Web</h1>
          <p className="text-muted-foreground mt-1">
            Personaliza el panel de administración y el sitio público
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2" disabled={isSaving} size="lg">
          <FloppyDisk size={20} weight="bold" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general">General y Contacto</TabsTrigger>
          <TabsTrigger value="public">Sitio Público</TabsTrigger>
          <TabsTrigger value="admin">Panel Admin</TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos de tu gimnasio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gymName">Nombre del Gimnasio</Label>
                  <Input
                    id="gymName"
                    value={config.gymName}
                    onChange={(e) => setConfig({ ...config, gymName: e.target.value })}
                    placeholder="GymFlow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slogan">Eslogan</Label>
                  <Input
                    id="slogan"
                    value={config.slogan}
                    onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                    placeholder="Tu mejor versión te espera"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aboutText">Sobre Nosotros</Label>
                  <Textarea
                    id="aboutText"
                    value={config.aboutText}
                    onChange={(e) => setConfig({ ...config, aboutText: e.target.value })}
                    placeholder="Descripción de tu gimnasio"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Redes sociales y contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    placeholder="+502 1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={config.whatsapp}
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    placeholder="+502 1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={config.instagram}
                    onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                    placeholder="@gymflow_gt"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images size={24} weight="duotone" />
                Imágenes Hero
              </CardTitle>
              <CardDescription>Sube imágenes para el carrusel de la página principal</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                images={config.heroImages}
                onChange={(images) => setConfig({ ...config, heroImages: images })}
                maxImages={5}
                label="Imágenes del Carrusel Hero"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PUBLIC SITE TAB */}
        <TabsContent value="public" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette size={24} weight="duotone" />
                  Estilo Visual
                </CardTitle>
                <CardDescription>Colores y tipografía del sitio web</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <div className="space-y-2">
                  <Label>Preset (Tema Predefinido)</Label>
                  <Select onValueChange={(val) => {
                    const preset = PRESETS.public.find(p => p.id === val);
                    if (preset) {
                      setConfig({
                        ...config,
                        themeColors: {
                          ...(config.themeColors as any),
                          public: {
                            ...preset.config
                          }
                        }
                      });
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cargar un preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.public.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipografía</Label>
                  <Select value={publicTheme.font} onValueChange={updatePublicFont}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Primario"
                    value={publicTheme.colors?.primary}
                    onChange={(c) => updatePublicTheme('primary', c)}
                  />
                  <ColorPicker
                    label="Secundario"
                    value={publicTheme.colors?.secondary}
                    onChange={(c) => updatePublicTheme('secondary', c)}
                  />
                  <ColorPicker
                    label="Fondo"
                    value={publicTheme.colors?.background}
                    onChange={(c) => updatePublicTheme('background', c)}
                  />
                  <ColorPicker
                    label="Texto"
                    value={publicTheme.colors?.foreground}
                    onChange={(c) => updatePublicTheme('foreground', c)}
                  />
                  <ColorPicker
                    label="Tarjetas"
                    value={publicTheme.colors?.card}
                    onChange={(c) => updatePublicTheme('card', c)}
                  />
                  <ColorPicker
                    label="Texto Tarjetas"
                    value={publicTheme.colors?.cardForeground}
                    onChange={(c) => updatePublicTheme('cardForeground', c)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe size={24} weight="duotone" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden shadow-sm" style={{ fontFamily: publicTheme.font }}>
                  {/* Fake Navbar */}
                  <div className="h-12 border-b flex items-center px-4 justify-between" style={{ backgroundColor: publicTheme.colors?.background, borderColor: publicTheme.colors?.border }}>
                    <span className="font-bold text-lg" style={{ color: publicTheme.colors?.foreground }}>GymFlow</span>
                    <div className="flex gap-2">
                      <div className="h-2 w-8 rounded bg-gray-200"></div>
                      <div className="h-2 w-8 rounded bg-gray-200"></div>
                    </div>
                  </div>
                  {/* Fake Content */}
                  <div className="p-6 transition-colors duration-300" style={{ backgroundColor: publicTheme.colors?.background, color: publicTheme.colors?.foreground }}>
                    <motion.div
                      key={config.animationSettings?.cardAnimation}
                      {...(config.animationSettings?.enabled ? animations[config.animationSettings?.cardAnimation as keyof typeof animations] : {})}
                    >
                      <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
                      <p className="opacity-80 mb-4">Este es un ejemplo de cómo se verán tus contenidos.</p>
                      <ContrastWarning ratio={getContrastRatio(publicTheme.colors?.foreground, publicTheme.colors?.background)} />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded border shadow-sm" style={{
                          backgroundColor: publicTheme.colors?.card,
                          color: publicTheme.colors?.cardForeground,
                          borderColor: publicTheme.colors?.border
                        }}>
                          <h3 className="font-semibold mb-1">Tarjeta 1</h3>
                          <Button size="sm" className="w-full mt-2" style={{ backgroundColor: publicTheme.colors?.primary }}>Acción</Button>
                          <ContrastWarning ratio={getContrastRatio(publicTheme.colors?.cardForeground, publicTheme.colors?.card)} />
                        </div>
                        <div className="p-4 rounded border shadow-sm" style={{
                          backgroundColor: publicTheme.colors?.card,
                          color: publicTheme.colors?.cardForeground,
                          borderColor: publicTheme.colors?.border
                        }}>           <h3 className="font-semibold mb-1">Tarjeta 2</h3>
                          <Button size="sm" variant="outline" className="w-full mt-2" style={{ borderColor: publicTheme.colors?.border }}>Detalle</Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Animaciones</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Habilitar Animaciones</Label>
                    <p className="text-sm text-muted-foreground">Animaciones en el scroll y carga.</p>
                  </div>
                  <Switch
                    checked={config.animationSettings?.enabled}
                    onCheckedChange={(checked) => updateAnimation('enabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Animación</Label>
                  <Select
                    value={config.animationSettings?.cardAnimation}
                    onValueChange={(val) => updateAnimation('cardAnimation', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {animationOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layout size={24} weight="duotone" />
                    Secciones del Sitio
                  </CardTitle>
                  <CardDescription>Administra las secciones de la página principal</CardDescription>
                </div>
                <Button onClick={handleAddSection} size="sm" className="gap-2">
                  <Plus size={16} />
                  Agregar Sección
                </Button>
              </CardHeader>
              <CardContent>
                {(!config.sections || config.sections.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No hay secciones personalizadas.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Orden</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {config.sections.map((section, index) => (
                        <TableRow key={section.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{section.title}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {sectionTypes.find(t => t.value === section.type)?.label || section.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleMoveSection(index, 'up')} disabled={index === 0}><ArrowUp size={16} /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleMoveSection(index, 'down')} disabled={index === (config.sections?.length || 0) - 1}><ArrowDown size={16} /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDuplicateSection(section)}><Copy size={16} /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditSection(section)}><PencilSimple size={16} /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSection(section.id)}><Trash size={16} /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ADMIN PANEL TAB */}
        <TabsContent value="admin" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Desktop size={24} weight="duotone" />
                  Apariencia del Panel
                </CardTitle>
                <CardDescription>Personaliza el entorno de administración.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Preset (Tema Predefinido)</Label>
                  <Select onValueChange={(val) => {
                    const preset = PRESETS.admin.find(p => p.id === val);
                    if (preset) {
                      setConfig({
                        ...config,
                        themeColors: {
                          ...(config.themeColors as any),
                          admin: {
                            ...preset.config
                          }
                        }
                      });
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cargar un preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.admin.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipografía</Label>
                  <Select value={adminTheme.font} onValueChange={updateAdminFont}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Primario"
                    value={adminTheme.colors?.primary}
                    onChange={(c) => updateAdminTheme('primary', c)}
                  />
                  <ColorPicker
                    label="Sidebar"
                    value={adminTheme.colors?.sidebar}
                    onChange={(c) => updateAdminTheme('sidebar', c)}
                  />
                  <ColorPicker
                    label="Texto Sidebar"
                    value={adminTheme.colors?.sidebarForeground}
                    onChange={(c) => updateAdminTheme('sidebarForeground', c)}
                  />
                  <ColorPicker
                    label="Fondo Panel"
                    value={adminTheme.colors?.background}
                    onChange={(c) => updateAdminTheme('background', c)}
                  />
                  <ColorPicker
                    label="Texto Principal"
                    value={adminTheme.colors?.foreground}
                    onChange={(c) => updateAdminTheme('foreground', c)}
                  />
                  <ColorPicker
                    label="Tarjetas / Topbar"
                    value={adminTheme.colors?.card}
                    onChange={(c) => updateAdminTheme('card', c)}
                  />
                  <ColorPicker
                    label="Texto Tarjetas"
                    value={adminTheme.colors?.cardForeground}
                    onChange={(c) => updateAdminTheme('cardForeground', c)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={24} weight="duotone" />
                  Vista Previa Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden shadow-sm flex h-64" style={{ fontFamily: adminTheme.font }}>
                  {/* Fake Sidebar */}
                  <div className="w-1/3 p-4 flex flex-col gap-4" style={{ backgroundColor: adminTheme.colors?.sidebar || '#1e293b', color: adminTheme.colors?.sidebarForeground || '#fff' }}>
                    <div className="h-6 w-3/4 bg-white/20 rounded"></div>
                    <div className="space-y-2 mt-4">
                      <div className="h-4 w-full bg-white/10 rounded"></div>
                      <div className="h-4 w-5/6 bg-white/10 rounded"></div>
                      <div className="h-4 w-4/6 bg-white/10 rounded"></div>
                    </div>
                    <ContrastWarning ratio={getContrastRatio(adminTheme.colors?.sidebarForeground, adminTheme.colors?.sidebar)} />
                  </div>
                  {/* Fake Body */}
                  <div className="flex-1 p-6" style={{ backgroundColor: adminTheme.colors?.background }}>
                    <h3 className="font-bold text-xl mb-4" style={{ color: adminTheme.colors?.foreground }}>Dashboard</h3>
                    <ContrastWarning ratio={getContrastRatio(adminTheme.colors?.foreground, adminTheme.colors?.background)} />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-20 rounded border bg-white shadow-sm"></div>
                      <div className="h-20 rounded border bg-white shadow-sm"></div>
                    </div>
                    <Button className="mt-4" style={{ backgroundColor: adminTheme.colors?.primary }}>Guardar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Add/Edit Section (Reused) */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditingSection ? 'Editar Sección' : 'Nueva Sección'}</DialogTitle>
            <DialogDescription>Configura el contenido y apariencia.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Título</Label>
              <Input className="col-span-3" value={currentSection.title || ''} onChange={(e) => setCurrentSection({ ...currentSection, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Subtítulo</Label>
              <Input className="col-span-3" value={currentSection.subtitle || ''} onChange={(e) => setCurrentSection({ ...currentSection, subtitle: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tipo</Label>
              <Select value={currentSection.type} onValueChange={(val: any) => setCurrentSection({ ...currentSection, type: val })}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {sectionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {currentSection.type === 'text' && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Contenido</Label>
                <Textarea className="col-span-3" rows={5} value={currentSection.content || ''} onChange={(e) => setCurrentSection({ ...currentSection, content: e.target.value })} />
              </div>
            )}
            {currentSection.type === 'products' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Límite</Label>
                  <Input
                    type="number"
                    className="col-span-3"
                    min={1}
                    max={20}
                    value={currentSection.settings?.limit || 4}
                    onChange={(e) => setCurrentSection({
                      ...currentSection,
                      settings: { ...currentSection.settings, limit: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Acción</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      checked={currentSection.settings?.showPrice !== false} // Default true
                      onCheckedChange={(c) => setCurrentSection({
                        ...currentSection,
                        settings: { ...currentSection.settings, showPrice: c }
                      })}
                    />
                    <span className="text-sm text-muted-foreground">Mostrar Precios</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSection}>Guardar Sección</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

