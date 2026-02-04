import { storage } from '@/utils/storage';
import type { InventoryProduct, InventoryMovement } from '@/types/models';

const PRODUCTS_KEY = 'gymflow_inventory_products';
const MOVEMENTS_KEY = 'gymflow_inventory_movements';

export const inventoryService = {
  getAllProducts: (): InventoryProduct[] => {
    return storage.get<InventoryProduct[]>(PRODUCTS_KEY) || [];
  },

  getProductById: (id: string): InventoryProduct | undefined => {
    const products = inventoryService.getAllProducts();
    return products.find(p => p.id === id);
  },

  createProduct: (data: Omit<InventoryProduct, 'id' | 'createdAt'>): InventoryProduct => {
    const products = inventoryService.getAllProducts();
    
    const newProduct: InventoryProduct = {
      ...data,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...products, newProduct];
    storage.set(PRODUCTS_KEY, updated);
    
    return newProduct;
  },

  updateProduct: (id: string, data: Partial<Omit<InventoryProduct, 'id' | 'createdAt'>>): InventoryProduct | null => {
    const products = inventoryService.getAllProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    const updated = products.map(p => 
      p.id === id ? { ...p, ...data } : p
    );
    
    storage.set(PRODUCTS_KEY, updated);
    return updated[index];
  },

  deleteProduct: (id: string): boolean => {
    const products = inventoryService.getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    
    if (filtered.length === products.length) return false;
    
    storage.set(PRODUCTS_KEY, filtered);
    return true;
  },

  getAllMovements: (): InventoryMovement[] => {
    return storage.get<InventoryMovement[]>(MOVEMENTS_KEY) || [];
  },

  getMovementsByProduct: (productId: string): InventoryMovement[] => {
    const movements = inventoryService.getAllMovements();
    return movements.filter(m => m.productId === productId);
  },

  createMovement: (data: Omit<InventoryMovement, 'id' | 'createdAt'>): InventoryMovement | null => {
    const product = inventoryService.getProductById(data.productId);
    if (!product) return null;

    if (data.type === 'OUT' && product.stock < data.quantity) {
      throw new Error('Stock insuficiente');
    }

    const newMovement: InventoryMovement = {
      ...data,
      id: `mov-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const movements = inventoryService.getAllMovements();
    storage.set(MOVEMENTS_KEY, [...movements, newMovement]);

    const newStock = data.type === 'IN' 
      ? product.stock + data.quantity 
      : product.stock - data.quantity;
    
    inventoryService.updateProduct(data.productId, { stock: newStock });

    return newMovement;
  },
};
