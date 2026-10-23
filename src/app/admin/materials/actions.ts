'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export type MaterialInput = {
  id?: number;
  name: string;
  category: string;
  unit: 'g' | 'ml' | 'piece';
  purchasePrice: number;
  purchaseQuantity: number;
  notes: string;
};

export async function saveMaterial(input: MaterialInput) {
  const { supabase } = await requireAdmin();
  const name = input.name.trim();
  if (!name || name.length > 120) throw new Error('Enter a material name (max 120 characters).');
  if (!['wax', 'fragrance', 'gypsum', 'color', 'packaging', 'other'].includes(input.category)) throw new Error('Invalid category.');
  if (!['g', 'ml', 'piece'].includes(input.unit)) throw new Error('Invalid unit.');
  if (!Number.isFinite(input.purchasePrice) || input.purchasePrice < 0 || input.purchasePrice > 10000000) throw new Error('Invalid purchase price.');
  if (!Number.isFinite(input.purchaseQuantity) || input.purchaseQuantity <= 0 || input.purchaseQuantity > 100000000) throw new Error('Invalid purchase quantity.');
  if (input.notes.length > 500) throw new Error('Notes are too long.');
  if (input.id !== undefined && (!Number.isSafeInteger(input.id) || input.id <= 0)) throw new Error('Invalid material ID.');

  const values = {
    name,
    category: input.category,
    unit: input.unit,
    unit_cost: Number((input.purchasePrice / input.purchaseQuantity).toFixed(6)),
    notes: input.notes.trim(),
    updated_at: new Date().toISOString(),
  };
  if (input.id === undefined) {
    const { error } = await supabase.from('raw_materials').insert(values);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from('raw_materials').update(values).eq('id', input.id).select('id').single();
    if (error || !data) throw new Error(error?.message || 'Material not found.');
  }
  revalidatePath('/admin/materials');
  return { success: true };
}

export async function deleteMaterial(id: number) {
  const { supabase } = await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid material ID.');
  const { data, error } = await supabase.from('raw_materials').delete().eq('id', id).select('id').single();
  if (error || !data) throw new Error(error?.message || 'Material not found.');
  revalidatePath('/admin/materials');
  return { success: true };
}
