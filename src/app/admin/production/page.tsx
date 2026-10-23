import { requireAdmin } from '@/lib/admin';
import ProductionManager, { type Product, type Material, type Recipe, type Batch } from './ProductionManager';

export default async function ProductionPage() {
 const { supabase } = await requireAdmin();
 const [p,m,r,b] = await Promise.all([
  supabase.from('products').select('id,name_en,name_ar').order('id'),
  supabase.from('raw_materials').select('id,name,unit,unit_cost').order('name'),
  supabase.from('product_cost_recipes').select('product_id,ingredients,waste_percent,extra_cost'),
  supabase.from('production_batches').select('id,product_id,produced_on,quantity,recipe_snapshot,material_cost_total,extra_cost_total,notes').order('id',{ascending:false}).limit(200),
 ]);
 if(p.error) throw new Error('Products: '+p.error.message);
 if(m.error) throw new Error('Materials: '+m.error.message);
 if(r.error) throw new Error('Recipes: '+r.error.message);
 if(b.error) throw new Error('Production batches: '+b.error.message);
 const products:Product[]=(p.data??[]).map(x=>({id:Number(x.id),name_en:x.name_en,name_ar:x.name_ar}));
 const materials:Material[]=(m.data??[]).map(x=>({id:Number(x.id),name:x.name,unit:x.unit,unit_cost:Number(x.unit_cost)}));
 const recipes:Recipe[]=(r.data??[]).map(x=>({product_id:Number(x.product_id),ingredients:Array.isArray(x.ingredients)?x.ingredients as Recipe['ingredients']:[],waste_percent:Number(x.waste_percent),extra_cost:Number(x.extra_cost)}));
 const batches:Batch[]=(b.data??[]).map(x=>({id:Number(x.id),product_id:Number(x.product_id),produced_on:x.produced_on,quantity:Number(x.quantity),recipe_snapshot:Array.isArray(x.recipe_snapshot)?x.recipe_snapshot as Batch['recipe_snapshot']:[],material_cost_total:Number(x.material_cost_total),extra_cost_total:Number(x.extra_cost_total),notes:x.notes??''}));
 return <ProductionManager products={products} materials={materials} recipes={recipes} batches={batches}/>;
}
