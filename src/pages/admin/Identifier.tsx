import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fingerprint, User, CheckCircle, XCircle, Spinner } from '@phosphor-icons/react';
import { accessService } from '@/services/access.service';
import { clientsService } from '@/services/clients.service';
import type { Client } from '@/types/models';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function Identifier() {
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanResult, setLastScanResult] = useState<{
        allowed: boolean;
        client: Client | null;
        message: string;
    } | null>(null);

    // For simulation purposes
    const [clients, setClients] = useState<Partial<Client>[]>([]);
    const [selectedSimulatedClient, setSelectedSimulatedClient] = useState<string>('');

    useEffect(() => {
        // Load clients for simulation dropdown (public endpoint)
        const loadClients = async () => {
            try {
                const data = await clientsService.getFingerprintClients();
                setClients(data);
            } catch (error) {
                console.error('Error loading clients', error);
            }
        };
        loadClients();
    }, []);

    const handleScan = async () => {
        setIsScanning(true);
        setLastScanResult(null);

        // Simulate delay for scanning
        setTimeout(async () => {
            try {
                // In a real scenario, this would come from the device SDK
                // For now, we use the selected client's fingerprint ID or a dummy one
                const fingerprintId = selectedSimulatedClient
                    ? clients.find(c => c.id === selectedSimulatedClient)?.fingerprintId
                    : 'UNKNOWN-FINGERPRINT';

                if (!fingerprintId) {
                    toast.error("Error: Cliente seleccionado sin ID de huella");
                    setIsScanning(false);
                    return;
                }

                const result = await accessService.verifyAccessByFingerprint(fingerprintId);
                setLastScanResult(result);

                if (result.allowed) {
                    toast.success(result.message);
                } else {
                    toast.error(result.message);
                }
            } catch (error) {
                console.error(error);
                toast.error('Error al procesar la huella');
            } finally {
                setIsScanning(false);
            }
        }, 2000);
    };

    const clearResult = () => {
        setLastScanResult(null);
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Terminal de Identificación</h1>
                <p className="text-muted-foreground">
                    Coloca el dedo en el lector para identificar y verificar acceso
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Scanner Panel */}
                <Card className="md:col-span-1 h-full flex flex-col items-center justify-center p-8 bg-muted/20">
                    <div className="relative mb-8">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${isScanning ? 'border-primary animate-pulse' : 'border-muted-foreground/20'}`}>
                            {isScanning ? (
                                <Spinner size={64} className="animate-spin text-primary" />
                            ) : (
                                <Fingerprint size={64} className="text-muted-foreground" weight="duotone" />
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-xs space-y-4">
                        {!isScanning && (
                            <>
                                {/* Simulation Control */}
                                <div className="p-4 border rounded-lg bg-background shadow-sm space-y-3">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Modo Simulación</Label>
                                    <Select value={selectedSimulatedClient} onValueChange={setSelectedSimulatedClient}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar huella..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unknown">Huella No Registrada</SelectItem>
                                            {clients.map(client => (
                                                <SelectItem key={String(client.id ?? '')} value={String(client.id ?? '')}>
                                                    {client.name} (ID: {client.fingerprintId?.substring(0, 8) || '?'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full h-12 text-lg"
                                    onClick={handleScan}
                                    disabled={!selectedSimulatedClient}
                                >
                                    {isScanning ? 'Escaneando...' : 'Escanear Huella'}
                                </Button>
                            </>
                        )}

                        {isScanning && (
                            <p className="text-center text-sm text-muted-foreground animate-pulse">
                                Leyendo datos biométricos...
                            </p>
                        )}
                    </div>
                </Card>

                {/* Result Panel */}
                <Card className="md:col-span-1 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-full pb-10">
                        {lastScanResult ? (
                            <div className="text-center space-y-6 w-full animate-in fade-in zoom-in duration-300">
                                <div className="relative mx-auto">
                                    {lastScanResult.client?.profilePhoto ? (
                                        <img
                                            src={lastScanResult.client.profilePhoto}
                                            alt={lastScanResult.client.name}
                                            className={`w-40 h-40 rounded-full object-cover border-4 ${lastScanResult.allowed ? 'border-green-500' : 'border-red-500'}`}
                                        />
                                    ) : (
                                        <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 bg-muted ${lastScanResult.allowed ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}`}>
                                            <User size={80} weight="fill" />
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 right-0 p-2 rounded-full border-4 border-background ${lastScanResult.allowed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {lastScanResult.allowed ? <CheckCircle size={32} weight="fill" /> : <XCircle size={32} weight="fill" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">
                                        {lastScanResult.client ? lastScanResult.client.name : 'Desconocido'}
                                    </h2>
                                    <p className={`text-lg font-medium ${lastScanResult.allowed ? 'text-green-600' : 'text-red-600'}`}>
                                        {lastScanResult.message}
                                    </p>
                                    {lastScanResult.client && (
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>ID: {lastScanResult.client.id}</p>
                                            <p>Estado: {lastScanResult.client.status}</p>
                                        </div>
                                    )}
                                </div>

                                <Button variant="outline" onClick={clearResult}>
                                    Nueva Lectura
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground space-y-4">
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto opacity-50">
                                    <User size={48} />
                                </div>
                                <p>Esperando lectura de huella...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
