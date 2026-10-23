'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export type SaleInput = {
  sold_on: string;
  product_id: number;
  quantity: number;
  unit_sale_price: number;
  discount_total: number;
  notes: string;
};

export async function addSale(input: SaleInput) {
  const { supabase } = await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sold_on) ||
      Number.isNaN(Date.parse(`${input.sold_on}T12:00:00Z`))) throw new Error('Invalid sale date.');
  if (!Number.isSafeInteger(input.product_id) || input.product_id <= 0) throw new Error('Choose a product.');
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 9999) throw new Error('Invalid quantity.');
  if (!Number.isFinite(input.unit_sale_price) || input.unit_sale_price < 0 || input.unit_sale_price > 1000000) throw new Error('Invalid sale price.');
  if (!Number.isFinite(input.discount_total) || input.discount_total < 0 || input.discount_total > input.quantity * input.unit_sale_price) throw new Error('Invalid discount.');
  if (typeof input.notes !== 'string' || input.notes.length > 500) throw new Error('Notes are too long.');

  const { data: product, error: productError } = await supabase.from('products')
    .select('id,name_en').eq('id', input.product_id).maybeSingle();
  if (productError || !product) throw new Error('Product not found.');

  const { data: recipe, error: recipeError } = await supabase.from('product_cost_recipes')
    .select('ingredients,waste_percent,extra_cost').eq('product_id', input.product_id).maybeSingle();
  if (recipeError) throw new Error('Could not read recipe: ' + recipeError.message);
  // Require a saved recipe: otherwise a zero cost would produce misleading profits.
  if (!recipe) throw new Error('Save a costing recipe for this product before recording its sale.');
  const ingredients = recipe.ingredients;
  if (!Array.isArray(ingredients)) throw new Error('Invalid saved recipe.');
  const ids = [...new Set(ingredients.map((item: {material_id:number}) => item.material_id))];
  const { data: materials, error: materialError } = ids.length
    ? await supabase.from('raw_materials').select('id,unit_cost').in('id', ids)
    : { data: [], error: null };
  if (materialError) throw new Error('Could not load material prices: ' + materialError.message);
  const costs = new Map((materials ?? []).map(m => [Number(m.id), Number(m.unit_cost)]));
  if (costs.size !== ids.length) throw new Error('A recipe material was deleted. Update the recipe first.');
  let materialsCost = 0;
  for (const item of ingredients as {material_id:number;quantity:number}[]) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || !costs.has(item.material_id)) throw new Error('Invalid recipe ingredient.');
    materialsCost += item.quantity * (costs.get(item.material_id) ?? 0);
  }
  const waste = Number(recipe.waste_percent);
  const extra = Number(recipe.extra_cost);
  if (!Number.isFinite(waste) || waste < 0 || waste > 100 || !Number.isFinite(extra) || extra < 0) throw new Error('Invalid recipe cost.');
  const unitCost = Math.round((materialsCost * (1 + waste / 100) + extra) * 10000) / 10000;

  const { error } = await supabase.from('sales').insert({
    sold_on: input.sold_on,
    product_id: product.id,
    product_code: `SG-${String(product.id).padStart(3, '0')}`,
    product_name: product.name_en,
    quantity: input.quantity,
    unit_sale_price: input.unit_sale_price,
    unit_material_cost: unitCost,
    discount_total: input.discount_total,
    notes: input.notes.trim(),
  });
  if (error) throw new Error('Could not record sale: ' + error.message);
  revalidatePath('/admin/sales');
  return { success: true };
}

export async function deleteSale(id: number) {
  const { supabase } = await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid sale ID.');
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw new Error('Could not delete sale: ' + error.message);
  revalidatePath('/admin/sales');
  return { success: true };
}
