
import { createClient } from '@/lib/supabase/client';
import type { Product, Category } from '@/data/products';

const validCategories = new Set<Category>([
  'florals',
  'candles',
  'decor',
  'arabic',
  'personalized',
  'baby',
  'seasonal',
]);

export async function loadShopProducts(): Promise<Product[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id,name_en,name_ar,category,price,image_url')
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    throw new Error(`Could not load products: ${error.message}`);
  }

  return (data ?? [])
    .filter(row => validCategories.has(row.category as Category))
    .map(row => ({
      id: row.id,
      en: row.name_en,
      ar: row.name_ar,
      category: row.category as Category,
      price: row.price === null ? null : Number(row.price),
      image: row.image_url,
    }));
}
