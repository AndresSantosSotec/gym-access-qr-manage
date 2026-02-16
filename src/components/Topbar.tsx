import { useState, useEffect } from 'react';
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
import { authService } from '@/services/auth.service';
import { rolesService } from '@/services/roles.service';
import { SignOut, User } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Role } from '@/types/models';

export function Topbar() {
  const navigate = useNavigate();
  const auth = authService.getCurrentUser();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      if (auth?.user.roleId) {
        try {
          const roleData = await rolesService.getRoleById(auth.user.roleId);
          setRole(roleData);
        } catch (error) {
          console.error('Error cargando rol:', error);
        }
      }
    };
    loadRole();
  }, [auth?.user.roleId]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así redirigir al login
      navigate('/login');
    }
  };

  const initials = auth?.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Panel Administrativo</h2>
        <p className="text-xs text-muted-foreground">Gestión de membresías y acceso</p>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm font-semibold">{auth?.user.name}</div>
                <div className="text-xs text-muted-foreground">{role?.name || 'Usuario'}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2" size={16} />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <SignOut className="mr-2" size={16} />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
