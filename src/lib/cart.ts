export type CartItem = {
  key: string;
  productId: number;
  quantity: number;
  candleColor: string;
  gypsumColor: string;
  waxScent: string;
};
export type Cart = CartItem[];
export const CART_STORAGE_KEY = 'softglow-cart';

export function itemKey(productId: number, candleColor = '', gypsumColor = '', waxScent = ''): string {
  return JSON.stringify([productId, candleColor, gypsumColor, waxScent]);
}

export function readCart(): Cart {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    const entries: unknown = Array.isArray(value)
      ? value
      : value && typeof value === 'object' && !Array.isArray(value)
        ? Object.entries(value).map(([id, quantity]) => ({ productId: Number(id), quantity }))
        : [];
    if (!Array.isArray(entries)) return [];
    const merged = new Map<string, CartItem>();
    for (const candidate of entries) {
      if (!candidate || typeof candidate !== 'object') continue;
      const entry = candidate as Record<string, unknown>;
      const productId = Number(entry.productId);
      const quantity = Number(entry.quantity);
      if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) continue;
      const candleColor = typeof entry.candleColor === 'string' ? entry.candleColor.slice(0, 100) : '';
      const gypsumColor = typeof entry.gypsumColor === 'string' ? entry.gypsumColor.slice(0, 100) : '';
      const waxScent = typeof entry.waxScent === 'string' ? entry.waxScent.slice(0, 100) : '';
      const key = itemKey(productId, candleColor, gypsumColor, waxScent);
      const previous = merged.get(key);
      merged.set(key, { key, productId, candleColor, gypsumColor, waxScent,
        quantity: Math.min(99, (previous?.quantity ?? 0) + Math.floor(quantity)) });
    }
    return [...merged.values()];
  } catch { return []; }
}

export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}


export function addCartItem(productId: number, quantity: number, options: {
  candleColor?: string; gypsumColor?: string; waxScent?: string;
} = {}): Cart {
  const candleColor = options.candleColor ?? '';
  const gypsumColor = options.gypsumColor ?? '';
  const waxScent = options.waxScent ?? '';
  const key = itemKey(productId, candleColor, gypsumColor, waxScent);
  const cart = readCart();
  const existing = cart.find(item => item.key === key);
  if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
  else cart.push({ key, productId, candleColor, gypsumColor, waxScent, quantity: Math.min(99, quantity) });
  saveCart(cart);
  window.dispatchEvent(new Event('softglow-cart-updated'));
  return cart;
}

export function updateCartItem(cart: Cart, key: string, quantity: number): Cart {
  return cart.flatMap(item => item.key !== key ? [item] : quantity <= 0 ? [] : [{ ...item, quantity: Math.min(99, quantity) }]);
}

export function cartOptionLines(item: CartItem, rtl: boolean): string[] {
  return [
    ...(item.candleColor ? [`${rtl ? 'لون الشمعة' : 'Candle color'}: ${item.candleColor}`] : []),
    ...(item.gypsumColor ? [`${rtl ? 'لون الجبس' : 'Gypsum color'}: ${item.gypsumColor}`] : []),
    ...(item.waxScent ? [`${rtl ? 'رائحة الشمع' : 'Wax scent'}: ${item.waxScent}`] : []),
  ];
}
