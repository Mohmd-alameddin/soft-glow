'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export type RecipeIngredient = { material_id: number; quantity: number };
export type RecipeInput = {
  product_id: number;
  ingredients: RecipeIngredient[];
  waste_percent: number;
  extra_cost: number;
  extra_notes: string;
};

export async function saveCostRecipe(input: RecipeInput) {
  const { supabase } = await requireAdmin();
  if (!Number.isSafeInteger(input.product_id) || input.product_id <= 0) throw new Error('Invalid product.');
  if (!Array.isArray(input.ingredients) || input.ingredients.length > 100) throw new Error('Invalid ingredients.');
  const seen = new Set<number>();
  for (const line of input.ingredients) {
    if (!Number.isSafeInteger(line.material_id) || line.material_id <= 0 || seen.has(line.material_id)) {
      throw new Error('Each material can appear only once.');
    }
    if (typeof line.quantity !== 'number' || !Number.isFinite(line.quantity) || line.quantity <= 0 || line.quantity > 10000000) {
      throw new Error('Invalid material quantity.');
    }
    seen.add(line.material_id);
  }
  if (typeof input.waste_percent !== 'number' || !Number.isFinite(input.waste_percent) || input.waste_percent < 0 || input.waste_percent > 100) throw new Error('Waste must be between 0% and 100%.');
  if (typeof input.extra_cost !== 'number' || !Number.isFinite(input.extra_cost) || input.extra_cost < 0 || input.extra_cost > 1000000) throw new Error('Invalid additional cost.');
  if (typeof input.extra_notes !== 'string' || input.extra_notes.length > 500) throw new Error('Notes are too long.');

  const { data: product, error: productError } = await supabase.from('products').select('id').eq('id', input.product_id).maybeSingle();
  if (productError || !product) throw new Error('Product does not exist.');
  if (seen.size) {
    const { data: materials, error } = await supabase.from('raw_materials').select('id').in('id', [...seen]);
    if (error || (materials ?? []).length !== seen.size) throw new Error('One or more materials no longer exist.');
  }
  const { error } = await supabase.from('product_cost_recipes').upsert({
    product_id: input.product_id,
    ingredients: input.ingredients,
    waste_percent: input.waste_percent,
    extra_cost: input.extra_cost,
    extra_notes: input.extra_notes.trim(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error('Could not save recipe: ' + error.message);
  revalidatePath('/admin/costing');
  return { success: true };
}
