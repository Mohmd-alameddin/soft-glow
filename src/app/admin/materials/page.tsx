import { requireAdmin } from '@/lib/admin';
import MaterialManager from './MaterialManager';

export type Material = {
  id: number;
  name: string;
  category: string;
  unit: 'g' | 'ml' | 'piece';
  unit_cost: number;
  notes: string;
};

export default async function MaterialsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('raw_materials')
    .select('id,name,category,unit,unit_cost,notes').order('name');
  if (error) throw new Error('Could not load materials: ' + error.message);
  const materials: Material[] = (data ?? []).map(item => ({
    ...item, unit: item.unit as Material['unit'], unit_cost: Number(item.unit_cost),
  }));
  return <MaterialManager initialMaterials={materials} />;
}
