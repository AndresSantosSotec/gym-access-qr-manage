import { Link } from 'react-router-dom';
import { Barbell, List, X } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { siteService } from '@/services/site.service';
import type { SiteConfig } from '@/types/models';

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(siteService.getDefaultConfig());

  useEffect(() => {
    siteService.getConfig().then(setConfig).catch(console.error);
  }, []);

  const navLinks = [
    { to: '/p', label: 'Inicio' },
    { to: '/p/planes', label: 'Planes' },
    { to: '/p/blog', label: 'Blog' },
    { to: '/p/contacto', label: 'Contacto' },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/p" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Barbell className="text-primary-foreground" size={24} weight="bold" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">{config.gymName}</h1>
              <p className="text-xs text-muted-foreground">{config.slogan}</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-2 text-sm font-medium text-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
