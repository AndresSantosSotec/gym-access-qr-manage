import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Fingerprint, CheckCircle, Trash } from '@phosphor-icons/react';
import { formatDateTime } from '@/utils/date';

interface FingerprintRegistrationProps {
  fingerprintId?: string;
  fingerprintRegisteredAt?: string;
  onRegister: () => void;
  onRemove: () => void;
  entityType?: 'cliente' | 'staff';
}

export function FingerprintRegistration({
  fingerprintId,
  fingerprintRegisteredAt,
  onRegister,
  onRemove,
  entityType = 'staff'
}: FingerprintRegistrationProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {!fingerprintId ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Fingerprint size={48} className="text-primary" weight="duotone" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Sin huella registrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Registra la huella digital del {entityType} para control de acceso biométrico
              </p>
            </div>
            <Button onClick={onRegister} size="lg" className="gap-2">
              <Fingerprint size={20} weight="bold" />
              Registrar Huella Digital
            </Button>
            <p className="text-xs text-muted-foreground">
              Este es un sistema de demostración. En producción se conectará con un lector biométrico real.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Huella Registrada
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {fingerprintId}
                  </p>
                  {fingerprintRegisteredAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Registrada: {formatDateTime(fingerprintRegisteredAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={onRegister} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Fingerprint size={16} className="mr-2" />
                Registrar Nueva Huella
              </Button>
              <Button 
                onClick={onRemove} 
                variant="destructive" 
                size="sm"
              >
                <Trash size={16} className="mr-2" />
                Eliminar
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Nota:</strong> El {entityType} podrá usar su huella digital para registrar su entrada y salida del gimnasio mediante el sistema de control de acceso biométrico.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
