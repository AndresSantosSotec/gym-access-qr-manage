import { api } from './api.service';
import type {
    Producto,
    MovimientoInventario,
    Venta,
    ClienteVenta,
    Marca,
    Presentacion,
    MetodoPago
} from '@/types/models';

export const commercialService = {
    // Lookups
    getLookups: async () => {
        const response = await api.get<{ marcas: Marca[], presentaciones: Presentacion[], metodos_pago: MetodoPago[] }>('/commercial/lookups');
        return response.data;
    },

    // Productos
    getProducts: async () => {
        const response = await api.get<Producto[]>('/productos');
        return response.data;
    },
    createProduct: async (data: Partial<Producto>) => {
        const response = await api.post<Producto>('/productos', data);
        return response.data;
    },
    updateProduct: async (id: number, data: Partial<Producto>) => {
        const response = await api.patch<Producto>(`/productos/${id}`, data);
        return response.data;
    },
    deleteProduct: async (id: number) => {
        await api.delete(`/productos/${id}`);
        return true;
    },

    // Inventario
    getMovements: async () => {
        const response = await api.get<MovimientoInventario[]>('/inventario');
        return response.data;
    },
    createMovement: async (data: { producto_id: number; tipo: 'INGRESO' | 'EGRESO'; cantidad: number; motivo: string }) => {
        const response = await api.post<MovimientoInventario>('/inventario', data);
        return response.data;
    },

    // Ventas
    getSales: async (estado?: string) => {
        const response = await api.get<Venta[]>('/ventas', { params: { estado } });
        return response.data;
    },
    createSale: async (data: any) => {
        const response = await api.post<Venta>('/ventas', data);
        return response.data;
    },
    getSale: async (id: number) => {
        const response = await api.get<Venta>(`/ventas/${id}`);
        return response.data;
    },
    updateSale: async (id: number, data: any) => {
        const response = await api.patch<Venta>(`/ventas/${id}`, data);
        return response.data;
    },

    // Clientes Ventas
    getSalesClients: async () => {
        const response = await api.get<ClienteVenta[]>('/clientes-ventas');
        return response.data;
    },
    createSalesClient: async (data: Partial<ClienteVenta>) => {
        const response = await api.post<ClienteVenta>('/clientes-ventas', data);
        return response.data;
    },

    // Marcas
    getMarcas: async () => {
        const response = await api.get<(Marca & { productos_count: number })[]>('/marcas');
        return response.data;
    },
    createMarca: async (data: { nombre: string }) => {
        const response = await api.post<Marca>('/marcas', data);
        return response.data;
    },
    updateMarca: async (id: number, data: { nombre: string }) => {
        const response = await api.patch<Marca>(`/marcas/${id}`, data);
        return response.data;
    },
    deleteMarca: async (id: number) => {
        await api.delete(`/marcas/${id}`);
        return true;
    },

    // Presentaciones
    getPresentaciones: async () => {
        const response = await api.get<(Presentacion & { productos_count: number })[]>('/presentaciones');
        return response.data;
    },
    createPresentacion: async (data: { nombre: string }) => {
        const response = await api.post<Presentacion>('/presentaciones', data);
        return response.data;
    },
    updatePresentacion: async (id: number, data: { nombre: string }) => {
        const response = await api.patch<Presentacion>(`/presentaciones/${id}`, data);
        return response.data;
    },
    deletePresentacion: async (id: number) => {
        await api.delete(`/presentaciones/${id}`);
        return true;
    },

    // Reportes Contables
    getReporteInventarioDisponible: async (fecha?: string) => {
        const response = await api.get('/reports/inventario-disponible', { params: { fecha } });
        return response.data;
    },
    getReporteMovimientos: async (fechaInicio?: string, fechaFin?: string) => {
        const response = await api.get('/reports/movimientos-inventario', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } });
        return response.data;
    },
    getReporteCatalogo: async (soloActivos?: boolean) => {
        const response = await api.get('/reports/catalogo-productos', { params: { solo_activos: soloActivos } });
        return response.data;
    },
    getReporteValoracion: async (fechaInicio?: string, fechaFin?: string) => {
        const response = await api.get('/reports/valoracion-inventario', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } });
        return response.data;
    },
    getReporteRotacion: async (fechaInicio?: string, fechaFin?: string) => {
        const response = await api.get('/reports/rotacion-inventario', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } });
        return response.data;
    },
    getReporteSemestral: async (anio?: number, semestre?: number) => {
        const response = await api.get('/reports/reporte-semestral', { params: { anio, semestre } });
        return response.data;
    },
};
