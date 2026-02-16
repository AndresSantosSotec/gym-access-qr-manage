import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldWarning, House } from '@phosphor-icons/react';

export function Forbidden() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-[80vh] p-4">
            <Card className="max-w-md w-full text-center shadow-lg border-destructive/20">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="bg-destructive/10 p-4 rounded-full">
                            <ShieldWarning size={64} className="text-destructive" weight="duotone" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">¡Oops! Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        No tienes los permisos necesarios para acceder a esta sección.
                        Si crees que esto es un error, contacta con el administrador del gimnasio.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        className="w-full"
                        onClick={() => navigate('/admin/dashboard')}
                    >
                        <House size={20} className="mr-2" />
                        Volver al Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => navigate(-1)}
                    >
                        Regresar
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
