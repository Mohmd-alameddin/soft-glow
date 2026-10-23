'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export type PurchaseInput = {
  id?: number;
  material_id: number;
  purchased_on: string;
  quantity: number;
  total_cost: number;
  supplier: string;
  notes: string;
};

export async function savePurchase(input: PurchaseInput) {
  const { supabase } = await requireAdmin();
  if (input.id !== undefined && (!Number.isSafeInteger(input.id) || input.id <= 0)) throw new Error('Invalid purchase ID.');
  if (!Number.isSafeInteger(input.material_id) || input.material_id <= 0) throw new Error('Choose a material.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.purchased_on) || Number.isNaN(Date.parse(input.purchased_on + 'T12:00:00Z'))) throw new Error('Invalid purchase date.');
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 100000000) throw new Error('Invalid quantity.');
  if (!Number.isFinite(input.total_cost) || input.total_cost < 0 || input.total_cost > 100000000) throw new Error('Invalid total cost.');
  if (input.supplier.length > 150 || input.notes.length > 500) throw new Error('Supplier or notes are too long.');
  const { data: material, error: materialError } = await supabase.from('raw_materials').select('id').eq('id', input.material_id).single();
  if (materialError || !material) throw new Error('Material not found.');
  const values = { material_id: input.material_id, purchased_on: input.purchased_on, quantity: input.quantity, total_cost: input.total_cost, supplier: input.supplier.trim(), notes: input.notes.trim() };
  if (input.id === undefined) {
    const { error } = await supabase.from('material_purchases').insert(values);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from('material_purchases').update(values).eq('id', input.id).select('id').single();
    if (error || !data) throw new Error(error?.message || 'Purchase not found.');
  }
  revalidatePath('/admin/purchases');
  return { success: true };
}

export async function deletePurchase(id: number) {
  const { supabase } = await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid purchase ID.');
  const { data, error } = await supabase.from('material_purchases').delete().eq('id', id).select('id').single();
  if (error || !data) throw new Error(error?.message || 'Purchase not found.');
  revalidatePath('/admin/purchases');
  return { success: true };
}
