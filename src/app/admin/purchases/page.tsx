import { requireAdmin } from '@/lib/admin';
import PurchaseManager from './PurchaseManager';

export type PurchaseMaterial = { id: number; name: string; unit: 'g' | 'ml' | 'piece' };
export type PurchaseRecord = { id: number; material_id: number; purchased_on: string; quantity: number; total_cost: number; supplier: string; notes: string };

export default async function PurchasesPage() {
  const { supabase } = await requireAdmin();
  const [materialsResult, purchasesResult] = await Promise.all([
    supabase.from('raw_materials').select('id,name,unit').order('name'),
    supabase.from('material_purchases').select('id,material_id,purchased_on,quantity,total_cost,supplier,notes').order('purchased_on', { ascending: false }).order('id', { ascending: false }).limit(2000),
  ]);
  if (materialsResult.error) throw new Error(materialsResult.error.message);
  if (purchasesResult.error) throw new Error(purchasesResult.error.message);
  const materials: PurchaseMaterial[] = (materialsResult.data ?? []).map(m => ({ ...m, unit: m.unit as PurchaseMaterial['unit'] }));
  const purchases: PurchaseRecord[] = (purchasesResult.data ?? []).map(p => ({ ...p, quantity: Number(p.quantity), total_cost: Number(p.total_cost) }));
  return <PurchaseManager initialMaterials={materials} initialPurchases={purchases} />;
}
