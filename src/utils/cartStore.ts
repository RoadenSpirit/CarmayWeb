/**
 * Carrito de Compras CarmayWeb - CRUD completo con localStorage y CustomEvents.
 */

export interface CartItem {
  id: string; // ID único compuesto por: slug-color-talla
  productId?: number;
  slug: string;
  name: string;
  image: string;
  priceUSD: number;
  priceCUP: number;
  size?: string;
  color?: string;
  quantity: number;
}

const STORAGE_KEY = 'carmay_cart_v1';

/**
 * Operaciones CRUD sobre localStorage.
 */
export const CartCRUD = {
  /** READ: Obtiene todos los ítems del carrito guardados en localStorage. */
  read(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error leyendo carrito de localStorage:', e);
      return [];
    }
  },

  /** CREATE / ADD: Agrega un nuevo ítem o incrementa la cantidad si ya existe. */
  create(item: Omit<CartItem, 'id'> & { id?: string }): CartItem[] {
    const items = CartCRUD.read();
    const cleanColor = (item.color || 'default').toLowerCase().trim();
    const cleanSize = (item.size || 'default').toLowerCase().trim();
    const itemId = item.id || `${item.slug}-${cleanColor}-${cleanSize}`;

    const existingIndex = items.findIndex((i) => i.id === itemId);

    if (existingIndex > -1) {
      items[existingIndex].quantity += item.quantity || 1;
    } else {
      items.push({
        ...item,
        id: itemId,
        quantity: item.quantity || 1,
      });
    }

    return CartCRUD.save(items);
  },

  /** UPDATE: Actualiza la cantidad exacta de un ítem por su ID. */
  updateQuantity(id: string, newQuantity: number): CartItem[] {
    let items = CartCRUD.read();
    const index = items.findIndex((i) => i.id === id);

    if (index > -1) {
      if (newQuantity <= 0) {
        items = items.filter((i) => i.id !== id);
      } else {
        items[index].quantity = newQuantity;
      }
      return CartCRUD.save(items);
    }
    return items;
  },

  /** UPDATE DELTA: Suma o resta una cantidad a un ítem existente. */
  changeQuantity(id: string, delta: number): CartItem[] {
    const items = CartCRUD.read();
    const item = items.find((i) => i.id === id);
    if (item) {
      return CartCRUD.updateQuantity(id, item.quantity + delta);
    }
    return items;
  },

  /** DELETE: Elimina un ítem específico del carrito por su ID. */
  delete(id: string): CartItem[] {
    const items = CartCRUD.read().filter((i) => i.id !== id);
    return CartCRUD.save(items);
  },

  /** CLEAR: Vacía todo el carrito. */
  clear(): CartItem[] {
    return CartCRUD.save([]);
  },

  /** SAVE: Persiste los ítems en localStorage y notifica a la app. */
  save(items: CartItem[]): CartItem[] {
    if (typeof window === 'undefined') return items;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('carmay-cart-changed', { detail: { items } }));
    return items;
  },

  /** TOTALS: Devuelve resumen numérico de unidades y montos acumulados. */
  getTotals() {
    const items = CartCRUD.read();
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalCUP = items.reduce((sum, i) => sum + i.priceCUP * i.quantity, 0);
    const totalUSD = items.reduce((sum, i) => sum + i.priceUSD * i.quantity, 0);
    return { totalUnits, totalCUP, totalUSD, items };
  },
};
