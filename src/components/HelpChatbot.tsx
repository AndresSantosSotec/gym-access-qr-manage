import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ChatCircleDots,
    X,
    PaperPlaneTilt,
    Robot,
    User,
    Minus,
} from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

// ─── BASE DE CONOCIMIENTO ─────────────────────────────────────────────────────
// Cada entrada tiene: keywords (para detectar la intención), requiredPermission
// (null = siempre mostrar), y answer.

interface KnowledgeEntry {
    keywords: string[];
    requiredPermission: string | null;
    answer: string;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
    // ── CLIENTES ───────────────────────────────────────────────────────────────
    {
        keywords: ['cliente', 'clientes', 'nuevo cliente', 'registrar cliente', 'agregar cliente', 'crear cliente'],
        requiredPermission: 'CLIENTS_VIEW',
        answer: `**Módulo de Clientes** 👥\n\nDesde el menú **Clientes** puedes:\n- Ver la lista completa de miembros\n- Buscar por nombre, teléfono o email\n- Crear un **Nuevo Cliente** con el botón azul (arriba a la derecha)\n- Ver el perfil completo de cada cliente haciendo clic en su nombre\n\nEl asistente de creación tiene 4 pasos: Datos básicos → Identidad → Plan de membresía → Pago`,
    },
    {
        keywords: ['lead', 'leads', 'prospecto', 'prospectos', 'interesados'],
        requiredPermission: 'CLIENTS_VIEW',
        answer: `**Módulo de Leads** 🎯\n\nLos leads son personas interesadas que aún no son miembros activos.\n\nDesde **Clientes → Leads** puedes:\n- Ver todos los prospectos registrados\n- Hacer seguimiento de su estado\n- Convertirlos en clientes activos cuando se inscriban`,
    },
    {
        keywords: ['membresia', 'membresía', 'plan', 'planes', 'asignar membresia', 'renovar'],
        requiredPermission: 'MEMBERSHIPS_VIEW',
        answer: `**Módulo de Membresías** 📋\n\nDesde **Membresías** puedes:\n- Ver todos los planes disponibles y crearlos\n- Ver membresías activas, vencidas y en riesgo\n- Pausar y reactivar membresías\n- Sincronizar planes con Recurrente para cobros automáticos\n\n💡 Para **asignar un plan a un cliente existente**, ve al perfil del cliente y usa la sección "Membresía".`,
    },
    {
        keywords: ['pago', 'pagos', 'cobro', 'cuota', 'cuotas', 'efectivo', 'transferencia', 'tarjeta', 'recurrente'],
        requiredPermission: 'PAYMENTS_VIEW',
        answer: `**Módulo de Pagos** 💳\n\nDesde **Pagos** puedes:\n- Ver todas las **cuotas pendientes** agrupadas por cliente\n- Registrar pagos en efectivo, transferencia o con tarjeta vía Recurrente\n- Ver el **historial completo** de pagos\n\n**Métodos de pago disponibles:**\n- 💵 Efectivo\n- 🏦 Transferencia bancaria (con foto de comprobante)\n- 💳 Tarjeta de crédito/débito (vía Recurrente — genera enlace de pago)`,
    },
    {
        keywords: ['recibo', 'recibos', 'factura', 'comprobante'],
        requiredPermission: 'PAYMENTS_VIEW',
        answer: `**Recibos y Comprobantes** 🧾\n\nDesde **Recibos** puedes:\n- Ver todos los recibos generados\n- Descargar en PDF\n- Buscar por cliente o fecha\n\nLos recibos se generan automáticamente cuando se registra un pago completo.`,
    },
    {
        keywords: ['acceso', 'control de acceso', 'entrada', 'qr', 'escaneo', 'huella', 'identificador'],
        requiredPermission: 'ACCESS_VIEW',
        answer: `**Control de Acceso** 🔐\n\nEl módulo de acceso permite controlar la entrada al gimnasio:\n- **Código QR**: Cada cliente tiene un QR único para escanear\n- **Huellas dactilares**: Registro y validación biométrica\n- **Identificador**: Búsqueda manual de cliente`,
    },
    {
        keywords: ['configuracion', 'configuración', 'ajustes', 'settings', 'sitio', 'tema'],
        requiredPermission: 'SETTINGS_VIEW',
        answer: `**Configuración del Sistema** ⚙️\n\nDesde **Configuración** puedes:\n- Cambiar el nombre y logo del gimnasio\n- Personalizar colores y tema\n- Configurar horarios y datos de contacto\n- Gestionar el blog público\n- Configurar métodos de pago (claves de Recurrente)`,
    },
    {
        keywords: ['rol', 'roles', 'permiso', 'permisos', 'acceso rol'],
        requiredPermission: 'ROLES_VIEW',
        answer: `**Roles y Permisos** 🛡️\n\nDesde **Roles** puedes:\n- Crear roles personalizados (ej: Recepcionista, Contador)\n- Asignar permisos específicos por módulo\n- Controlar qué puede ver y hacer cada usuario\n\nLos permisos están organizados por módulo: Clientes, Membresías, Pagos, etc.`,
    },
    {
        keywords: ['usuario', 'usuarios', 'staff', 'personal', 'empleado', 'trabajador'],
        requiredPermission: 'USERS_VIEW',
        answer: `**Gestión de Personal** 👔\n\nDesde **Personal** puedes:\n- Ver todos los usuarios del sistema\n- Crear nuevos usuarios asignándoles un rol\n- Editar datos y subir documentos del personal\n- Desactivar usuarios cuando sea necesario`,
    },
    {
        keywords: ['producto', 'productos', 'inventario', 'venta', 'ventas', 'comercial', 'tienda'],
        requiredPermission: 'PRODUCTS_VIEW',
        answer: `**Módulo Comercial** 🛍️\n\nEl módulo comercial incluye:\n- **Productos**: Crear y gestionar artículos a la venta\n- **Inventario**: Control de stock y movimientos\n- **Ventas (POS)**: Punto de venta para vender directamente\n- **Historial de Ventas**: Ver todas las transacciones\n- **Catálogos**: Organizar productos por categoría`,
    },
    {
        keywords: ['reporte', 'reportes', 'estadística', 'estadisticas', 'informe', 'resumen'],
        requiredPermission: 'REPORTS_VIEW',
        answer: `**Reportes** 📊\n\nDesde **Reportes** puedes ver:\n- Ingresos por período\n- Clientes activos vs inactivos\n- Membresías vendidas\n- Exportar en Excel o PDF`,
    },
    {
        keywords: ['notificacion', 'notificaciones', 'alerta', 'alertas', 'aviso'],
        requiredPermission: 'NOTIFICATIONS_VIEW',
        answer: `**Notificaciones** 🔔\n\nEl sistema envía alertas automáticas sobre:\n- Membresías próximas a vencer\n- Pagos pendientes o vencidos\n- Nuevos registros de clientes\n\nPuedes ver el historial desde el módulo de **Notificaciones**.`,
    },
    {
        keywords: ['dashboard', 'inicio', 'resumen', 'panel', 'home'],
        requiredPermission: 'DASHBOARD_VIEW',
        answer: `**Panel Principal (Dashboard)** 🏠\n\nEl dashboard muestra un resumen en tiempo real:\n- 📊 Total de clientes activos\n- 💰 Ingresos del mes\n- ⚠️ Membresías por vencer\n- 📅 Cuotas pendientes\n- 📈 Gráfico de tendencias\n\nEs tu punto de partida cada vez que inicias sesión.`,
    },

    // ── FLUJOS ESPECÍFICOS ──────────────────────────────────────────────────────
    {
        keywords: ['como crear', 'cómo crear', 'como agregar', 'cómo agregar', 'como registrar', 'cómo registrar'],
        requiredPermission: null,
        answer: `**¿Qué deseas crear o registrar?**\n\nPuedo explicarte cómo:\n- 👥 Crear un **cliente nuevo**\n- 📋 Asignar una **membresía**\n- 💳 Registrar un **pago**\n- 👔 Agregar un **usuario del sistema**\n- 🏷️ Crear un **producto**\n\nEscribe lo que necesitas y te guío paso a paso.`,
    },
    {
        keywords: ['pagar recurrente', 'cobro recurrente', 'pago automatico', 'pago automático', 'tarjeta en linea', 'link de pago', 'enlace de pago'],
        requiredPermission: 'PAYMENTS_VIEW',
        answer: `**Pago con Tarjeta (Recurrente)** 💳\n\nRecurrente es la pasarela de pagos en línea integrada.\n\n**Para cobrar con tarjeta:**\n1. Al crear un cliente → Paso 4 → Selecciona "Tarjeta de Crédito/Débito"\n2. Haz clic en **"Generar Enlace de Pago"**\n3. Se abre Recurrente en una nueva pestaña — el cliente ingresa su tarjeta\n4. Regresa y haz clic en **"Confirmar y Activar Membresía"**\n\n⚠️ El plan debe estar sincronizado con Recurrente. Si hay error, el administrador debe ejecutar: \`php artisan recurrente:sync-products\``,
    },
    {
        keywords: ['mi perfil', 'mi cuenta', 'cambiar contraseña', 'datos personales'],
        requiredPermission: null,
        answer: `**Tu perfil de usuario** 👤\n\nPuedes ver y editar tu perfil haciendo clic en tu nombre o avatar en la esquina superior derecha del sistema.\n\nDesde ahí puedes:\n- Ver tus datos\n- Cambiar tu contraseña\n- Cerrar sesión`,
    },

    // ── RESPUESTAS GENERALES ────────────────────────────────────────────────────
    {
        keywords: ['hola', 'hello', 'hi', 'buenas', 'buenos dias', 'buen dia', 'buen dia', 'ayuda', 'help'],
        requiredPermission: null,
        answer: `¡Hola! 👋 Soy el asistente de **IronGym**.\n\nPuedo ayudarte con información sobre los módulos del sistema. Pregúntame sobre:\n- Clientes y Membresías\n- Pagos y Cuotas\n- Productos e Inventario\n- Usuarios y Roles\n- Configuración\n\n¿En qué puedo ayudarte hoy?`,
    },
    {
        keywords: ['gracias', 'ok', 'entendido', 'perfecto', 'listo', 'excelente'],
        requiredPermission: null,
        answer: `¡Con gusto! 😊 Si tienes más dudas, aquí estaré. ¿Hay algo más en lo que pueda ayudarte?`,
    },
];

// ─── LÓGICA DE BÚSQUEDA DE RESPUESTA ─────────────────────────────────────────
function findAnswer(query: string, permissions: string[]): string {
    const normalized = query.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

    // Buscar en la base de conocimiento
    for (const entry of KNOWLEDGE_BASE) {
        const matches = entry.keywords.some((kw) =>
            normalized.includes(kw.normalize('NFD').replace(/\p{Diacritic}/gu, ''))
        );

        if (!matches) continue;

        // Verificar permiso si requiere
        if (entry.requiredPermission && !permissions.includes(entry.requiredPermission)) {
            return `Lo siento, no tienes acceso al módulo requerido para esa función. Consulta con tu administrador si necesitas más permisos.`;
        }

        return entry.answer;
    }

    return `No encontré información específica sobre eso. Puedes preguntarme sobre:\n- **Clientes** o **Membresías**\n- **Pagos** y métodos de pago\n- **Productos** e Inventario\n- **Usuarios** y Roles\n- **Configuración** del sistema\n\n¿Puedes reformular tu pregunta?`;
}

// ─── FUNCIÓN DE BÚSQUEDA DE SUGERENCIAS ─────────────────────────────────────
function findSuggestions(query: string, permissions: string[]): KnowledgeEntry[] {
    if (query.trim().length < 2) return [];

    const normalized = query.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

    return KNOWLEDGE_BASE
        .filter(entry => {
            // Filtrar por permisos
            if (entry.requiredPermission && !permissions.includes(entry.requiredPermission)) {
                return false;
            }

            // Buscar coincidencias de palabras clave
            return entry.keywords.some(kw =>
                kw.normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(normalized) ||
                normalized.includes(kw.normalize('NFD').replace(/\p{Diacritic}/gu, ''))
            );
        })
        .slice(0, 4); // Mostrar máximo 4 sugerencias
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function HelpChatbot() {
    const { auth } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            text: `¡Hola${auth?.user?.name ? `, **${auth.user.name}**` : ''}! 👋 Soy tu asistente de IronGym.\n\n¿En qué puedo ayudarte hoy? Puedes preguntarme sobre cualquier módulo del sistema.`,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [suggestions, setSuggestions] = useState<KnowledgeEntry[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const permissions: string[] = auth?.user?.role?.permissions ?? [];

    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    const sendMessage = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simular tiempo de respuesta realista
        setTimeout(() => {
            const answer = findAnswer(userMsg.text, permissions);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: answer,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 600);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        // Actualizar sugerencias mientras escribe
        if (value.trim()) {
            setSuggestions(findSuggestions(value, permissions));
        } else {
            setSuggestions([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestionClick = (suggestion: KnowledgeEntry) => {
        const question = suggestion.keywords[0]; // Usar el primer keyword
        setInput('');
        setSuggestions([]);

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: question,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: suggestion.answer,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 600);
    };

    // Parsear markdown simple (bold, listas)
    const renderText = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Bold: **texto**
            const parts = line.split(/\*\*(.*?)\*\*/g);
            const rendered = parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            );
            // Lista: starts with -
            if (line.startsWith('- ')) {
                return (
                    <li key={i} className="ml-4 list-disc text-sm">
                        {parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                    </li>
                );
            }
            return (
                <p key={i} className="text-sm leading-relaxed">
                    {rendered}
                </p>
            );
        });
    };

    // Sugerencias rápidas basadas en permisos
    const quickSuggestions = [
        permissions.includes('CLIENTS_VIEW') && '¿Cómo creo un cliente?',
        permissions.includes('PAYMENTS_VIEW') && '¿Cómo cobro con tarjeta?',
        permissions.includes('MEMBERSHIPS_VIEW') && '¿Cómo asigno una membresía?',
        permissions.includes('PAYMENTS_VIEW') && '¿Qué son las cuotas?',
    ].filter(Boolean) as string[];

    if (!auth) return null;

    return (
        <>
            {/* ── Botón flotante ── */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {!isOpen && (
                    <div className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-lg animate-bounce">
                        ¿Necesitas ayuda?
                    </div>
                )}
                <Button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setIsMinimized(false);
                    }}
                    className={cn(
                        'w-14 h-14 rounded-full shadow-2xl transition-all duration-300',
                        isOpen ? 'bg-destructive hover:bg-destructive/90 rotate-0' : 'bg-primary hover:bg-primary/90'
                    )}
                    size="icon"
                    title={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
                >
                    {isOpen ? <X size={22} /> : <ChatCircleDots size={26} weight="fill" />}
                </Button>
            </div>

            {/* ── Panel del chat ── */}
            {isOpen && (
                <div
                    className={cn(
                        'fixed z-50 bg-background border border-border shadow-2xl flex flex-col transition-all duration-300',
                        // Mobile: ocupa toda la pantalla menos la topbar
                        'inset-0 top-14 rounded-none',
                        // Desktop: panel flotante en la esquina
                        'sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[360px] sm:rounded-2xl sm:top-auto',
                        isMinimized ? 'sm:h-14 overflow-hidden' : 'sm:h-[500px]'
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Robot size={18} className="text-primary" weight="fill" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Asistente IronGym</p>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <p className="text-xs text-muted-foreground">En línea</p>
                                </div>
                            </div>
                            {auth.user?.role?.name && (
                                <Badge variant="outline" className="text-xs ml-1">
                                    {auth.user.role.name}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? 'Expandir' : 'Minimizar'}
                            >
                                <Minus size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsOpen(false)}
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Mensajes */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'flex gap-2',
                                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                                        )}
                                    >
                                        {msg.role === 'bot' && (
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Robot size={14} className="text-primary" weight="fill" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                'max-w-[80%] rounded-2xl px-3 py-2 space-y-0.5',
                                                msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                    : 'bg-muted rounded-bl-sm'
                                            )}
                                        >
                                            {msg.role === 'bot' ? renderText(msg.text) : (
                                                <p className="text-sm">{msg.text}</p>
                                            )}
                                            <p className={cn(
                                                'text-[10px] mt-1',
                                                msg.role === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'
                                            )}>
                                                {msg.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <User size={14} className="text-primary" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex gap-2 justify-start">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Robot size={14} className="text-primary" weight="fill" />
                                        </div>
                                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                                            <div className="flex gap-1 items-center">
                                                {[0, 150, 300].map((delay) => (
                                                    <div
                                                        key={delay}
                                                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                                                        style={{ animationDelay: `${delay}ms` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Sugerencias rápidas */}
                            {messages.length <= 1 && quickSuggestions.length > 0 && (
                                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                                    {quickSuggestions.slice(0, 3).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setInput(s);
                                                setTimeout(sendMessage, 0);
                                                // Direct send
                                                const userMsg: Message = {
                                                    id: Date.now().toString(),
                                                    role: 'user',
                                                    text: s,
                                                    timestamp: new Date(),
                                                };
                                                setMessages((prev) => [...prev, userMsg]);
                                                setIsTyping(true);
                                                setTimeout(() => {
                                                    const answer = findAnswer(s, permissions);
                                                    setMessages((prev) => [
                                                        ...prev,
                                                        {
                                                            id: (Date.now() + 1).toString(),
                                                            role: 'bot',
                                                            text: answer,
                                                            timestamp: new Date(),
                                                        },
                                                    ]);
                                                    setIsTyping(false);
                                                }, 700);
                                            }}
                                            className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input con sugerencias dinámicas */}
                            <div className="px-3 pb-3 border-t pt-3">
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={input}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Escribe tu pregunta..."
                                        className="flex-1 text-sm h-9 rounded-full"
                                        disabled={isTyping}
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isTyping}
                                        size="icon"
                                        className="h-9 w-9 rounded-full flex-shrink-0"
                                    >
                                        <PaperPlaneTilt size={16} weight="fill" />
                                    </Button>
                                </div>

                                {/* Sugerencias dinámicas */}
                                {suggestions.length > 0 && (
                                    <div className="space-y-1">
                                        {suggestions.map((sugg, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSuggestionClick(sugg)}
                                                className="w-full text-left text-xs px-2.5 py-1.5 rounded-md border border-border/50 bg-accent/30 hover:bg-accent/60 transition-colors truncate"
                                                title={sugg.keywords[0]}
                                            >
                                                💡 {sugg.keywords[0]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
