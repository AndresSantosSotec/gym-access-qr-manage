import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, Loader2, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/services/api.service';

interface Cuota {
    id: number;
    installment_number: number;
    due_date: string;
    amount: number;
    status: string;
    payment_method?: string;
}

interface ClientStatus {
    client_name: string;
    client_id: number;
    cuotas_adelantadas: Cuota[];
    proxima_cuota_pendiente?: Cuota;
    payment_methods: Array<{ id: string; brand?: string; last4?: string }>;
    recurrente_user_id?: string;
}

type PaymentMethodSelection = 'existing' | 'new';

export function ReactivarCobro() {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();

    const [status, setStatus] = useState<ClientStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [selection, setSelection] = useState<PaymentMethodSelection>('existing');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');

    useEffect(() => {
        if (!clientId) return;
        api.get(`/api/pagos/adelanto/client/${clientId}`)
            .then(({ data }) => {
                setStatus(data);
                // Pre-seleccionar la primera cuota pendiente
                const primera = data.cuotas?.find((c: Cuota) => c.status !== 'paid' && !c.payment_method?.includes('tarjeta'));
                if (primera) setSelectedInstallment(primera.id);
            })
            .catch(() => toast.error('No se pudo cargar la información del cliente'))
            .finally(() => setLoading(false));
    }, [clientId]);

    async function handleNewCard() {
        try {
            const { data } = await api.post('/api/pagos/checkout', {
                client_id: parseInt(clientId!),
                plan_id: null, // Checkout para guardar tarjeta
                mode: 'save_card',
            });
            setCheckoutUrl(data.checkout_url);
            window.open(data.checkout_url, '_blank');
            toast.info('Se abrió la página para ingresar tu tarjeta. Una vez guardada, regresa aquí.');
        } catch {
            toast.error('No se pudo iniciar el checkout');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedInstallment) { toast.error('Selecciona desde qué cuota reactivar'); return; }

        const pmId = selection === 'existing'
            ? (status?.payment_methods?.[0]?.id ?? selectedMethod)
            : selectedMethod;

        if (!pmId) { toast.error('No hay método de pago seleccionado. Usa "Nueva tarjeta" primero.'); return; }

        setSubmitting(true);
        try {
            await api.post('/api/membresias/reactivar-tarjeta', {
                client_id: parseInt(clientId!),
                payment_method_id: pmId,
                from_installment_id: selectedInstallment,
            });
            setSuccess(true);
            toast.success('✅ Cobro automático reactivado correctamente');
            setTimeout(() => navigate(-1), 2000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                ?? 'Error al reactivar cobro';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    if (success) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-green-600">
            <CheckCircle2 className="w-16 h-16" />
            <p className="text-xl font-semibold">Cobro automático reactivado</p>
        </div>
    );

    const cuotasDesdeDonde = status?.cuotas_adelantadas?.filter(c => c.status !== 'paid') ?? [];
    const savedCard = status?.payment_methods?.[0];

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <CreditCard className="w-7 h-7 text-purple-500" />
                <h1 className="text-2xl font-bold">Reactivar Cobro Automático</h1>
            </div>
            {status && (
                <p className="text-muted-foreground">Cliente: <strong>{status.client_name}</strong></p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Cuotas pagadas en efectivo */}
                {cuotasDesdeDonde.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="text-base">Desde qué cuota empezar con tarjeta</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {cuotasDesdeDonde.map(c => (
                                <label
                                    key={c.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedInstallment === c.id ? 'border-purple-400 bg-purple-50' : 'border-border hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="installment"
                                            value={c.id}
                                            checked={selectedInstallment === c.id}
                                            onChange={() => setSelectedInstallment(c.id)}
                                            className="accent-purple-500"
                                        />
                                        <div>
                                            <p className="font-medium text-sm">Cuota #{c.installment_number}</p>
                                            <p className="text-xs text-muted-foreground">{c.due_date}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">Q{c.amount}</Badge>
                                </label>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Selección de tarjeta */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Tarjeta a usar</CardTitle></CardHeader>
                    <CardContent className="space-y-3">

                        {savedCard && (
                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selection === 'existing' ? 'border-purple-400 bg-purple-50' : 'border-border hover:bg-muted/50'
                                }`}>
                                <input
                                    type="radio"
                                    name="payment-method"
                                    checked={selection === 'existing'}
                                    onChange={() => setSelection('existing')}
                                    className="accent-purple-500"
                                />
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {savedCard.brand ?? 'Tarjeta'} terminada en {savedCard.last4 ?? '****'}
                                </span>
                                <Badge className="ml-auto bg-green-100 text-green-700">Guardada</Badge>
                            </label>
                        )}

                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selection === 'new' ? 'border-purple-400 bg-purple-50' : 'border-border hover:bg-muted/50'
                            }`}>
                            <input
                                type="radio"
                                name="payment-method"
                                checked={selection === 'new'}
                                onChange={() => setSelection('new')}
                                className="accent-purple-500"
                            />
                            <Radio className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Agregar nueva tarjeta</span>
                        </label>

                        {selection === 'new' && (
                            <div className="pl-8">
                                <Button type="button" variant="outline" size="sm" onClick={handleNewCard}>
                                    Abrir formulario seguro de Recurrente →
                                </Button>
                                {checkoutUrl && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Una vez guardada la tarjeta, regresa aquí y vuelve a hacer clic en "Activar Cobro".
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || !selectedInstallment}
                        id="activate-charge-btn"
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Activar Cobro Automático
                    </Button>
                </div>
            </form>
        </div>
    );
}
