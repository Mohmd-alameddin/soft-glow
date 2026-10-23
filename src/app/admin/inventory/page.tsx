import { requireAdmin } from '@/lib/admin';
import InventoryManager, { type Material, type Purchase, type StockSettings, type Movement } from './InventoryManager';

export default async function InventoryPage() {
 const {supabase}=await requireAdmin();
 // Explicit column lists avoid the dynamic select type error seen in finance.
 const [m,p,s,mv]=await Promise.all([
  supabase.from('raw_materials').select('id,name,unit,category').order('name'),
  supabase.from('material_purchases').select('id,material_id,quantity').order('id').limit(10000),
  supabase.from('material_inventory_settings').select('material_id,opening_quantity,low_stock_threshold'),
  supabase.from('material_stock_movements').select('id,material_id,moved_on,movement_type,quantity_change,notes').order('id',{ascending:false}).limit(10000),
 ]);
 if(m.error) throw new Error('Materials: '+m.error.message);
 if(p.error) throw new Error('Purchases: '+p.error.message);
 if(s.error) throw new Error('Settings: '+s.error.message);
 if(mv.error) throw new Error('Movements: '+mv.error.message);
 const materials:Material[]=(m.data??[]).map(x=>({id:Number(x.id),name:x.name,unit:x.unit as Material['unit'],category:x.category}));
 const purchases:Purchase[]=(p.data??[]).map(x=>({material_id:Number(x.material_id),quantity:Number(x.quantity)}));
 const settings:StockSettings[]=(s.data??[]).map(x=>({material_id:Number(x.material_id),opening_quantity:Number(x.opening_quantity),low_stock_threshold:Number(x.low_stock_threshold)}));
 const movements:Movement[]=(mv.data??[]).map(x=>({id:Number(x.id),material_id:Number(x.material_id),moved_on:x.moved_on,movement_type:x.movement_type as Movement['movement_type'],quantity_change:Number(x.quantity_change),notes:x.notes??''}));
 return <InventoryManager materials={materials} purchases={purchases} settings={settings} movements={movements}/>;
}
