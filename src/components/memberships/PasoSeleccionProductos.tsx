import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/** Producto para mostrar en el selector (Recurrente Productos o Registration Products mapeados) */
export interface ProductoPagoItem {
  id: number;
  nombre: string;
  monto_centavos: number;
  monto_quetzales: number;
  tipo: string;
}

const TIPO_LABELS: Record<string, string> = {
  inscripcion: 'INSCRIPCIÓN',
  mensualidad: 'MENSUALIDADES',
  curso: 'CURSOS',
  otro: 'OTROS',
};

interface PasoSeleccionProductosProps {
  productos: ProductoPagoItem[];
  productosSeleccionados: number[];
  onToggle: (id: number) => void;
  totalProductos: number;
  /** Si hay un plan seleccionado, su precio se muestra aparte */
  planPrice?: number;
  className?: string;
}

export function PasoSeleccionProductos({
  productos,
  productosSeleccionados,
  onToggle,
  totalProductos,
  planPrice = 0,
  className,
}: PasoSeleccionProductosProps) {
  const productosAgrupados = useMemo(() => {
    const grupos: Record<string, ProductoPagoItem[]> = {};
    productos.forEach((p) => {
      const tipo = p.tipo || 'otro';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(p);
    });
    const order = ['inscripcion', 'mensualidad', 'curso', 'otro'];
    return order
      .filter((t) => grupos[t]?.length)
      .map((t) => ({ tipo: t, label: TIPO_LABELS[t] ?? t.toUpperCase(), items: grupos[t] }));
  }, [productos]);

  const totalAPagar = useMemo(() => {
    const sumProductos = productos
      .filter((p) => productosSeleccionados.includes(p.id))
      .reduce((s, p) => s + p.monto_centavos, 0);
    return planPrice + sumProductos / 100;
  }, [productos, productosSeleccionados, planPrice]);

  if (productos.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground py-4', className)}>
        No hay productos de inscripción. Crea productos en{' '}
        <a href="/admin/registration-products" className="text-primary underline" target="_blank" rel="noopener noreferrer">
          Inscripción (Registration Products)
        </a>
        {' '}o en Membresías → Productos de Pago.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-sm text-muted-foreground">
        Selecciona los conceptos a pagar (inscripción, mensualidades, etc.):
      </p>

      {productosAgrupados.map(({ tipo, label, items }) => (
        <Card key={tipo}>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              {label}
            </h4>
            <ul className="space-y-2">
              {items.map((producto) => {
                const checked = productosSeleccionados.includes(producto.id);
                return (
                  <li
                    key={producto.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                      checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      id={`producto-${producto.id}`}
                      checked={checked}
                      onCheckedChange={() => onToggle(producto.id)}
                    />
                    <label
                      htmlFor={`producto-${producto.id}`}
                      className="flex-1 cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-medium">{producto.nombre}</span>
                      <span className="text-primary font-semibold">
                        Q {producto.monto_quetzales.toFixed(2)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">
            Productos seleccionados: {productosSeleccionados.length}
          </p>
          {planPrice > 0 && (
            <p className="text-sm text-muted-foreground">
              Plan: Q {planPrice.toFixed(2)}
            </p>
          )}
        </div>
        <p className="text-right">
          <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Total a pagar
          </span>
          <span className="ml-2 font-bold text-2xl text-primary">
            Q {totalAPagar.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
}
