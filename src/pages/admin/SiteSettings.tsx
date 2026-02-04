import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { siteService } from '@/services/site.service';
import { toast } from 'sonner';
import { FloppyDisk, Globe } from '@phosphor-icons/react';

export function SiteSettings() {
  const [config, setConfig] = useState(siteService.getConfig());

  const handleSave = () => {
    siteService.updateConfig(config);
    toast.success('Configuración guardada exitosamente');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sitio Web</h1>
          <p className="text-muted-foreground mt-1">
            Personaliza la información de tu gimnasio en la web pública
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <FloppyDisk size={20} />
          Guardar Cambios
        </Button>
      </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Diseño y Personalización</CardTitle>
            <CardDescription>Apariencia del sitio web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color Principal (OKLCH)</Label>
              <Input
                id="primaryColor"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                placeholder="oklch(0.45 0.15 285)"
              />
              <div 
                className="w-full h-12 rounded-lg border"
                style={{ background: config.primaryColor }}
              />
              <p className="text-xs text-muted-foreground">
                Este color se guarda pero requiere reiniciar la app para aplicarse en Tailwind
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroImageUrl">URL de Imagen Hero (opcional)</Label>
              <Input
                id="heroImageUrl"
                value={config.heroImageUrl || ''}
                onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Globe size={24} weight="fill" />
                Vista Previa
              </div>
            </CardTitle>
            <CardDescription>Cómo se verá en la web pública</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg border">
              <h2 className="text-2xl font-bold">{config.gymName}</h2>
              <p className="text-lg text-muted-foreground mt-1">{config.slogan}</p>
              <p className="text-sm mt-4">{config.aboutText}</p>
              
              <div className="mt-6 space-y-2 text-sm">
                <p><strong>Teléfono:</strong> {config.phone}</p>
                <p><strong>WhatsApp:</strong> {config.whatsapp}</p>
                <p><strong>Instagram:</strong> {config.instagram}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <a href="/p" target="_blank">
                Ver Sitio Público
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
