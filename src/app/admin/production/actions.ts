'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function recordProduction(input: { product_id: number; quantity: number; produced_on: string; notes: string }) {
 const { supabase } = await requireAdmin();
 if (!Number.isSafeInteger(input.product_id) || input.product_id < 1 || !Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 100000) throw new Error('Invalid product or quantity');
 if (!/^\d{4}-\d{2}-\d{2}$/.test(input.produced_on)) throw new Error('Invalid date');
 if (typeof input.notes !== 'string' || input.notes.length > 1000) throw new Error('Notes too long');
 const { data, error } = await supabase.rpc('record_production_batch', {
  p_product_id: input.product_id, p_quantity: input.quantity, p_produced_on: input.produced_on, p_notes: input.notes.trim(),
 });
 if (error) throw new Error(error.message);
 revalidatePath('/admin/production');
 revalidatePath('/admin/inventory');
 return { batchId: Number(data) };
}
