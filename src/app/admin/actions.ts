
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export type ProductInput = {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
  price: number | null;
  image_url: string;
  description_en: string;
  description_ar: string;
  is_active: boolean;
};

const categories = new Set([
  'florals',
  'candles',
  'decor',
  'arabic',
  'personalized',
  'baby',
  'seasonal',
]);

function validateProduct(input: ProductInput) {
  if (!Number.isSafeInteger(input.id) || input.id <= 0) {
    throw new Error('Invalid product ID.');
  }

  if (!input.name_en?.trim() || !input.name_ar?.trim()) {
    throw new Error('English and Arabic names are required.');
  }

  if (
    input.name_en.length > 150 ||
    input.name_ar.length > 150
  ) {
    throw new Error('Product names are too long.');
  }

  if (!categories.has(input.category)) {
    throw new Error('Invalid category.');
  }

  if (
    input.price !== null &&
    (!Number.isFinite(input.price) ||
      input.price < 0 ||
      input.price > 1000000)
  ) {
    throw new Error('Invalid price.');
  }

  if (
    !input.image_url ||
    input.image_url.length > 500 ||
    !(
      /^\/products\/[a-zA-Z0-9_-]+\.webp$/.test(input.image_url) ||
      /^https:\/\/[a-zA-Z0-9.-]+\/[^\s]*$/.test(input.image_url)
    )
  ) {
    throw new Error('Invalid image URL.');
  }

  if (
    input.description_en.length > 2000 ||
    input.description_ar.length > 2000
  ) {
    throw new Error('Description is too long.');
  }
}

export async function saveProduct(input: ProductInput) {
  const { supabase } = await requireAdmin();

  validateProduct(input);

  const { error } = await supabase.from('products').upsert({
    id: input.id,
    name_en: input.name_en.trim(),
    name_ar: input.name_ar.trim(),
    category: input.category,
    price: input.price,
    image_url: input.image_url,
    description_en: input.description_en.trim(),
    description_ar: input.description_ar.trim(),
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error('Could not save product: ' + error.message);
  }

  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteProduct(id: number) {
  const { supabase } = await requireAdmin();

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Invalid product ID.');
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Could not delete product: ' + error.message);
  }

  revalidatePath('/admin/products');
  return { success: true };
}
