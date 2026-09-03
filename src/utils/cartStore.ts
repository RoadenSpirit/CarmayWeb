/**
 * Carrito de Compras - Gestión de Estado Client-Side con localStorage y CustomEvents.
 */

export interface CartItem {
  id: string; // ID único compuesto por slug + color + talla
  productId: number;
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

export class CartStore {
  static getItems(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static setItems(items: CartItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('carmay-cart-updated', { detail: { items } }));
    } catch (e) {
      console.error('Error guardando carrito en localStorage:', e);
    }
  }

  static addItem(item: Omit<CartItem, 'id'>): void {
    const items = CartStore.getItems();
    const itemId = `${item.slug}-${item.color || 'default'}-${item.size || 'default'}`;
    const existingIndex = items.findIndex((i) => i.id === itemId);

    if (existingIndex > -1) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push({ ...item, id: itemId });
    }

    CartStore.setItems(items);
  }

  static updateQuantity(id: string, delta: number): void {
    const items = CartStore.getItems();
    const index = items.findIndex((i) => i.id === id);
    if (index > -1) {
      items[index].quantity += delta;
      if (items[index].quantity <= 0) {
        items.splice(index, 1);
      }
      CartStore.setItems(items);
    }
  }

  static removeItem(id: string): void {
    const items = CartStore.getItems().filter((i) => i.id !== id);
    CartStore.setItems(items);
  }

  static clearCart(): void {
    CartStore.setItems([]);
  }

  static getTotalUnits(): number {
    return CartStore.getItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  static getTotals(): { totalCUP: number; totalUSD: number } {
    const items = CartStore.getItems();
    const totalCUP = items.reduce((sum, i) => sum + i.priceCUP * i.quantity, 0);
    const totalUSD = items.reduce((sum, i) => sum + i.priceUSD * i.quantity, 0);
    return { totalCUP, totalUSD };
  }
}
