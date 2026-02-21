import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, AlertTriangle, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/services/api.service';

interface Cuota {
    installment_number: number;
    amount: number;
    date_before: string;
    date_after: string;
}

interface Impacto {
    pause_days: number;
    pause_start_fmt: string;
    pause_end_fmt: string;
    proximo_cobro: string;
    cuotas_afectadas: number;
    comparacion: Cuota[];
    dias_disponibles: number;
    puede_pausar: boolean;
    mensaje_limite?: string;
}

export function PausarMembresia() {
    const { membershipId } = useParams<{ membershipId: string }>();
    const navigate = useNavigate();

    const [pauseStart, setPauseStart] = useState('');
    const [pauseEnd, setPauseEnd] = useState('');
    const [reason, setReason] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [impacto, setImpacto] = useState<Impacto | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [success, setSuccess] = useState(false);

    // Calcular impacto en tiempo real cuando cambian las fechas
    useEffect(() => {
        if (!pauseStart || !pauseEnd || !membershipId) return;

        const timer = setTimeout(async () => {
            setLoadingPreview(true);
            try {
                const { data } = await api.get('/api/membresias/pausar/impacto', {
                    params: { membership_id: membershipId, pause_start: pauseStart, pause_end: pauseEnd },
                });
                setImpacto(data);
            } catch {
                setImpacto(null);
            } finally {
                setLoadingPreview(false);
            }
        }, 600); // debounce 600ms

        return () => clearTimeout(timer);
    }, [pauseStart, pauseEnd, membershipId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!reason) { toast.error('Selecciona un motivo'); return; }
        if (!impacto?.puede_pausar) { toast.error('No se puede pausar: ' + impacto?.mensaje_limite); return; }

        setLoadingSubmit(true);
        try {
            await api.post('/api/membresias/pausar', {
                membership_id: parseInt(membershipId!),
                pause_start: pauseStart,
                pause_end: pauseEnd,
                reason,
                notes,
            });

            setSuccess(true);
            toast.success('✅ Pausa registrada. Recurrente pausado correctamente.');
            setTimeout(() => navigate(-1), 2000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al pausar membresía';
            toast.error(msg);
        } finally {
            setLoadingSubmit(false);
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-green-600">
                <CheckCircle2 className="w-16 h-16" />
                <p className="text-xl font-semibold">Pausa registrada correctamente</p>
                <p className="text-muted-foreground">Redirigiendo…</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <CalendarDays className="w-7 h-7 text-blue-500" />
                <h1 className="text-2xl font-bold">Pausar Membresía</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Fechas */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Período de pausa</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="pause-start">Inicio de pausa</Label>
                            <input
                                id="pause-start"
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={pauseStart}
                                onChange={e => setPauseStart(e.target.value)}
                                required
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pause-end">Fecha de regreso</Label>
                            <input
                                id="pause-end"
                                type="date"
                                min={pauseStart || new Date().toISOString().split('T')[0]}
                                value={pauseEnd}
                                onChange={e => setPauseEnd(e.target.value)}
                                required
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Motivo */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Motivo</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Select onValueChange={setReason} required>
                            <SelectTrigger id="reason-select">
                                <SelectValue placeholder="Selecciona el motivo…" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="travel">✈️ Viaje</SelectItem>
                                <SelectItem value="injury">🩹 Lesión o enfermedad</SelectItem>
                                <SelectItem value="other">❓ Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            id="pause-notes"
                            placeholder="Notas adicionales (opcional)…"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                        />
                    </CardContent>
                </Card>

                {/* Preview de impacto */}
                {(loadingPreview) && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculando impacto…
                    </div>
                )}

                {impacto && !loadingPreview && (
                    <Card className={impacto.puede_pausar ? 'border-blue-200 bg-blue-50/30' : 'border-red-200 bg-red-50/30'}>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className={`w-4 h-4 ${impacto.puede_pausar ? 'text-blue-500' : 'text-red-500'}`} />
                                ⚠️ Impacto de la pausa ({impacto.pause_days} días)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {!impacto.puede_pausar && (
                                <div className="text-red-600 font-semibold">{impacto.mensaje_limite}</div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Recurrente pausado</span>
                                <span className="font-medium">{impacto.pause_days} días</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Próximo cobro automático</span>
                                <span className="font-medium text-blue-600">{impacto.proximo_cobro}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Días de pausa disponibles restantes</span>
                                <Badge variant="outline">{impacto.dias_disponibles} días</Badge>
                            </div>

                            {impacto.comparacion.length > 0 && (
                                <>
                                    <Separator />
                                    <p className="font-medium">Nuevas fechas de cuotas ({impacto.cuotas_afectadas} afectadas):</p>
                                    <div className="space-y-1 max-h-44 overflow-y-auto">
                                        {impacto.comparacion.map(c => (
                                            <div key={c.installment_number} className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Cuota #{c.installment_number}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="line-through text-muted-foreground">{c.date_before}</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="font-semibold text-blue-600">{c.date_after}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={!impacto?.puede_pausar || loadingSubmit || !reason}
                        id="confirm-pause-btn"
                    >
                        {loadingSubmit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Confirmar Pausa
                    </Button>
                </div>
            </form>
        </div>
    );
}
