import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { SignOut, User, List } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  const initials = auth?.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  const roleName = auth?.user?.role?.name ?? 'Administrador';

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Left: Hamburger (mobile) + title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — solo visible en móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 shrink-0"
          onClick={onMenuToggle}
          aria-label="Abrir menú"
        >
          <List size={22} weight="bold" />
        </Button>

        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-bold tracking-tight truncate">IronGym</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">Panel administrativo</p>
        </div>
      </div>

      {/* Right: Theme toggle + user menu */}
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-3 h-9">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Name only visible on md+ */}
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold leading-none">{auth?.user.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{roleName}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-semibold">{auth?.user.name}</div>
              <div className="text-xs text-muted-foreground font-normal">{auth?.user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2" size={16} />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <SignOut className="mr-2" size={16} />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
