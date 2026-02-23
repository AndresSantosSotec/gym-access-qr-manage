import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, RefreshCw, Pause, Clock, CheckCircle, User,
    ChevronRight, Mail, Loader2, ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api.service';

// ─── Types ───────────────────────────────────────────────────────────

interface MembershipRisk {
    id: number;
    client_id: number;
    client_name: string;
    client_email?: string;
    plan_name: string;
    status: string;
    reactivation_error?: string;
    reactivation_error_at?: string;
    advance_end_date?: string;
    since_days?: number;
}

interface MembershipExpiring {
    id: number;
    client_id: number;
    client_name: string;
    plan_name: string;
    status: string;
    advance_end_date: string;
    days_left: number;
    wants_auto_renewal: boolean;
}

interface MembershipPaused {
    id: number;
    client_id: number;
    client_name: string;
    plan_name: string;
    status: string;
    pause_end?: string;
    pause_reason?: string;
    days_left?: number;
    pause_id?: number;
}

interface RiesgoData {
    summary: { at_risk: number; expiring: number; paused: number; date: string };
    at_risk: MembershipRisk[];
    expiring: MembershipExpiring[];
    paused: MembershipPaused[];
}

// ─── Status Badges ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        at_risk: { label: '🔴 En riesgo', className: 'bg-red-100 text-red-700' },
        advance_expiring: { label: '🟡 Vence en 7d', className: 'bg-yellow-100 text-yellow-700' },
        advance_active: { label: '💵 Con adelanto', className: 'bg-blue-100 text-blue-700' },
        paused: { label: '⏸️ Pausada', className: 'bg-gray-100 text-gray-700' },
        active: { label: '✅ Activa', className: 'bg-green-100 text-green-700' },
    };
    const config = map[status] ?? { label: status, className: 'bg-muted text-foreground' };
    return <Badge className={config.className}>{config.label}</Badge>;
}

// ─── Dashboard ────────────────────────────────────────────────────────

export function MembresiaRiesgo() {
    const navigate = useNavigate();
    const [data, setData] = useState<RiesgoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [reactivatingId, setReactivatingId] = useState<number | null>(null);
    const [cancellingPauseId, setCancellingPauseId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: riesgo } = await api.get('/api/membresias/riesgo');
            setData(riesgo);
        } catch {
            toast.error('No se pudo cargar el dashboard de riesgo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function reactivarManual(membershipId: number) {
        setReactivatingId(membershipId);
        try {
            await api.post(`/api/membresias/${membershipId}/reactivar`);
            toast.success('✅ Job de reactivación disparado. Espera unos segundos y recarga.');
            setTimeout(fetchData, 3000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al reactivar';
            toast.error(msg);
        } finally {
            setReactivatingId(null);
        }
    }

    async function cancelarPausa(pauseId: number) {
        setCancellingPauseId(pauseId);
        try {
            await api.post(`/api/membresias/pausar/${pauseId}/cancelar`, { motivo: 'Cancelación manual desde dashboard' });
            toast.success('▶️ Pausa cancelada. Membresía reactivada.');
            fetchData();
        } catch {
            toast.error('No se pudo cancelar la pausa');
        } finally {
            setCancellingPauseId(null);
        }
    }

    if (loading) return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-9 w-28" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-5 flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-12" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="space-y-4 pt-4">
                <Skeleton className="h-10 w-64" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const d = data!;

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-7 h-7 text-orange-500" />
                    <div>
                        <h1 className="text-2xl font-bold">Membresías — Panel de Atención</h1>
                        <p className="text-muted-foreground text-sm">Actualizado: {d.summary.date}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} id="refresh-risk-btn">
                    <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
                </Button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-red-200">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        <div>
                            <p className="text-3xl font-bold text-red-600">{d.summary.at_risk}</p>
                            <p className="text-sm text-muted-foreground">En riesgo</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-yellow-200">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <Clock className="w-8 h-8 text-yellow-500" />
                        <div>
                            <p className="text-3xl font-bold text-yellow-600">{d.summary.expiring}</p>
                            <p className="text-sm text-muted-foreground">Vencen en 7 días</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <Pause className="w-8 h-8 text-gray-500" />
                        <div>
                            <p className="text-3xl font-bold text-gray-600">{d.summary.paused}</p>
                            <p className="text-sm text-muted-foreground">Pausadas activas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="at_risk">
                <TabsList>
                    <TabsTrigger value="at_risk" className="relative">
                        En Riesgo
                        {d.summary.at_risk > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                {d.summary.at_risk}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="expiring">Próximos a Vencer</TabsTrigger>
                    <TabsTrigger value="paused">Pausadas</TabsTrigger>
                </TabsList>

                {/* En Riesgo */}
                <TabsContent value="at_risk">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-red-600">
                                🔴 Requieren intervención inmediata
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {d.at_risk.length === 0 ? (
                                <div className="flex items-center gap-2 text-green-600 py-4">
                                    <CheckCircle className="w-5 h-5" /> Sin membresías en riesgo
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Estado desde</TableHead>
                                            <TableHead>Error</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {d.at_risk.map(m => (
                                            <TableRow key={m.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{m.client_name}</p>
                                                            {m.client_email && (
                                                                <p className="text-xs text-muted-foreground">{m.client_email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{m.plan_name}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm">{m.reactivation_error_at}</p>
                                                        {m.since_days != null && (
                                                            <p className="text-xs text-red-500">Hace {m.since_days} día(s)</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-xs text-red-600 max-w-[200px] truncate" title={m.reactivation_error}>
                                                        {m.reactivation_error}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => reactivarManual(m.id)}
                                                            disabled={reactivatingId === m.id}
                                                            id={`reactivate-btn-${m.id}`}
                                                        >
                                                            {reactivatingId === m.id
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <RefreshCw className="w-3 h-3" />}
                                                            {' '}Reactivar
                                                        </Button>
                                                        <Button
                                                            size="sm" variant="outline"
                                                            onClick={() => navigate(`/admin/clients/${m.client_id}`)}
                                                        >
                                                            <ChevronRight className="w-3 h-3" /> Ver
                                                        </Button>
                                                        {m.client_email && (
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                onClick={() => window.location.href = `mailto:${m.client_email}`}
                                                            >
                                                                <Mail className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Próximos a vencer */}
                <TabsContent value="expiring">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-yellow-600">
                                ⚠️ Adelantos que vencen en 7 días o menos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {d.expiring.length === 0 ? (
                                <div className="flex items-center gap-2 text-green-600 py-4">
                                    <CheckCircle className="w-5 h-5" /> Ninguna por vencer
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Vence</TableHead>
                                            <TableHead>Días restantes</TableHead>
                                            <TableHead>Auto-reactivación</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {d.expiring.map(m => (
                                            <TableRow key={m.id}>
                                                <TableCell className="font-medium">{m.client_name}</TableCell>
                                                <TableCell>{m.plan_name}</TableCell>
                                                <TableCell>{m.advance_end_date}</TableCell>
                                                <TableCell>
                                                    <Badge className={m.days_left <= 3 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                                        {m.days_left} día(s)
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={m.wants_auto_renewal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                        {m.wants_auto_renewal ? '✅ Sí' : '❌ No'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm" variant="outline"
                                                        onClick={() => navigate(`/admin/clients/${m.client_id}`)}
                                                    >
                                                        Ver detalle <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pausadas */}
                <TabsContent value="paused">
                    <Card>
                        <CardContent className="pt-5">
                            {d.paused.length === 0 ? (
                                <div className="flex items-center gap-2 text-muted-foreground py-4">
                                    <Pause className="w-5 h-5" /> No hay membresías pausadas
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Regresa</TableHead>
                                            <TableHead>Motivo</TableHead>
                                            <TableHead>Días restantes</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {d.paused.map(m => (
                                            <TableRow key={m.id}>
                                                <TableCell className="font-medium">{m.client_name}</TableCell>
                                                <TableCell>{m.plan_name}</TableCell>
                                                <TableCell>{m.pause_end ?? '—'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{m.pause_reason ?? '—'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {m.days_left != null && m.days_left >= 0
                                                        ? <Badge variant="outline">{m.days_left} días</Badge>
                                                        : <Badge className="bg-red-100 text-red-700">Vencida</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm" variant="outline"
                                                            onClick={() => navigate(`/admin/clients/${m.client_id}`)}
                                                        >
                                                            Ver <ChevronRight className="w-3 h-3 ml-1" />
                                                        </Button>
                                                        {m.pause_id && (
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                className="text-green-600 hover:text-green-700"
                                                                onClick={() => m.pause_id && cancelarPausa(m.pause_id)}
                                                                disabled={cancellingPauseId === m.pause_id}
                                                                id={`cancel-pause-btn-${m.pause_id}`}
                                                            >
                                                                {cancellingPauseId === m.pause_id
                                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                    : '▶️'}
                                                                {' '}Reactivar ya
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
