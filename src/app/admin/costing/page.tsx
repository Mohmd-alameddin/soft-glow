import { requireAdmin } from '@/lib/admin';
import CostingManager, { type CostMaterial, type CostProduct, type CostRecipe } from './CostingManager';

export default async function CostingPage() {
  const { supabase } = await requireAdmin();
  const [productsResult, materialsResult, recipesResult] = await Promise.all([
    supabase.from('products').select('id,name_en,name_ar,price').order('id'),
    supabase.from('raw_materials').select('id,name,category,unit,unit_cost').order('name'),
    supabase.from('product_cost_recipes').select('product_id,ingredients,waste_percent,extra_cost,extra_notes'),
  ]);
  if (productsResult.error) throw new Error('Could not load products: ' + productsResult.error.message);
  if (materialsResult.error) throw new Error('Could not load materials: ' + materialsResult.error.message);
  if (recipesResult.error) throw new Error('Could not load recipes: ' + recipesResult.error.message);

  const products: CostProduct[] = (productsResult.data ?? []).map(p => ({
    id: Number(p.id), name_en: p.name_en, name_ar: p.name_ar,
    price: p.price === null ? null : Number(p.price),
  }));
  const materials: CostMaterial[] = (materialsResult.data ?? []).map(m => ({
    id: Number(m.id), name: m.name, category: m.category,
    unit: m.unit as CostMaterial['unit'], unit_cost: Number(m.unit_cost),
  }));
  const recipes: CostRecipe[] = (recipesResult.data ?? []).map(r => ({
    product_id: Number(r.product_id),
    ingredients: Array.isArray(r.ingredients) ? r.ingredients as CostRecipe['ingredients'] : [],
    waste_percent: Number(r.waste_percent), extra_cost: Number(r.extra_cost),
    extra_notes: r.extra_notes ?? '',
  }));
  return <CostingManager products={products} materials={materials} initialRecipes={recipes} />;
}
