import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Barbell, InstagramLogo, Phone, WhatsappLogo } from '@phosphor-icons/react';
import { siteService } from '@/services/site.service';
import type { SiteConfig } from '@/types/models';

export function PublicFooter() {
  const [config, setConfig] = useState<SiteConfig>(siteService.getDefaultConfig());

  useEffect(() => {
    const loadConfig = async () => {
      const loadedConfig = await siteService.getConfig();
      setConfig(loadedConfig);
    };
    loadConfig();
  }, []);

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Barbell className="text-primary-foreground" size={24} weight="bold" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{config.gymName}</h3>
                <p className="text-xs text-muted-foreground">{config.slogan}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {config.aboutText?.slice(0, 120)}...
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/p" className="text-muted-foreground hover:text-foreground">Inicio</Link></li>
              <li><Link to="/p/planes" className="text-muted-foreground hover:text-foreground">Planes</Link></li>
              <li><Link to="/p/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link to="/p/contacto" className="text-muted-foreground hover:text-foreground">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone size={16} weight="fill" />
                {config.phone}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <WhatsappLogo size={16} weight="fill" />
                {config.whatsapp}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Síguenos</h4>
            <div className="flex gap-3">
              <a
                href={`https://instagram.com/${config.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-lg flex items-center justify-center transition-colors"
              >
                <InstagramLogo size={20} weight="fill" />
              </a>
              <a
                href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-lg flex items-center justify-center transition-colors"
              >
                <WhatsappLogo size={20} weight="fill" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {config.gymName}. Todos los derechos reservados.</p>
          <p className="mt-1">Sistema de gestión IronGym v1.0</p>
        </div>
      </div>
    </footer>
  );
}
