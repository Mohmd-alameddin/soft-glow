'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export type ColorOption = { name: string; hex: string };
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
  candle_colors: ColorOption[];
  gypsum_colors: ColorOption[];
  wax_scents: string[];
};

const categories = new Set(['florals','candles','decor','arabic','personalized','baby','seasonal']);
const hexPattern = /^#[0-9a-fA-F]{6}$/;

function validateColors(options: ColorOption[], label: string) {
  if (!Array.isArray(options) || options.length > 30) throw new Error(`Invalid ${label} list (maximum 30).`);
  const seen = new Set<string>();
  for (const item of options) {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 60 ||
        typeof item.hex !== 'string' || !hexPattern.test(item.hex)) throw new Error(`Invalid ${label} option.`);
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate ${label}: ${item.name}`);
    seen.add(key);
  }
}

function validateProduct(input: ProductInput) {
  if (!Number.isSafeInteger(input.id) || input.id <= 0) throw new Error('Invalid product ID.');
  if (typeof input.name_en !== 'string' || typeof input.name_ar !== 'string' ||
      !input.name_en.trim() || !input.name_ar.trim() || input.name_en.length > 150 || input.name_ar.length > 150)
    throw new Error('Valid English and Arabic names are required (maximum 150 characters).');
  if (!categories.has(input.category)) throw new Error('Invalid category.');
  if (input.price !== null && (!Number.isFinite(input.price) || input.price < 0 || input.price > 1000000))
    throw new Error('Invalid price.');
  if (typeof input.image_url !== 'string' || input.image_url.length > 1000 || !(
      /^\/products\/[a-zA-Z0-9_-]+\.webp$/.test(input.image_url) ||
      /^https:\/\/[a-zA-Z0-9.-]+\/[^\s]*$/.test(input.image_url)))
    throw new Error('Invalid image URL.');
  if (typeof input.description_en !== 'string' || typeof input.description_ar !== 'string' ||
      input.description_en.length > 2000 || input.description_ar.length > 2000)
    throw new Error('Description is too long.');
  validateColors(input.candle_colors, 'candle colors');
  validateColors(input.gypsum_colors, 'gypsum colors');
  if (!Array.isArray(input.wax_scents) || input.wax_scents.length > 50 ||
      input.wax_scents.some(s => typeof s !== 'string' || !s.trim() || s.length > 80))
    throw new Error('Invalid wax scents (maximum 50).');
  if (new Set(input.wax_scents.map(s => s.trim().toLowerCase())).size !== input.wax_scents.length)
    throw new Error('Duplicate wax scents are not allowed.');
}

export async function saveProduct(input: ProductInput) {
  const { supabase } = await requireAdmin();
  validateProduct(input);
  const { error } = await supabase.from('products').upsert({
    id: input.id,
    name_en: input.name_en.trim(), name_ar: input.name_ar.trim(),
    category: input.category, price: input.price, image_url: input.image_url,
    description_en: input.description_en.trim(), description_ar: input.description_ar.trim(),
    is_active: input.is_active,
    candle_colors: input.candle_colors.map(c => ({ name: c.name.trim(), hex: c.hex })),
    gypsum_colors: input.gypsum_colors.map(c => ({ name: c.name.trim(), hex: c.hex })),
    wax_scents: input.wax_scents.map(s => s.trim()),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error('Could not save product: ' + error.message);
  revalidatePath('/admin/products');
  revalidatePath('/products/' + input.id);
  revalidatePath('/');
  return { success: true };
}

export async function deleteProduct(id: number) {
  const { supabase } = await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid product ID.');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error('Could not delete product: ' + error.message);
  revalidatePath('/admin/products');
  revalidatePath('/');
  return { success: true };
}
