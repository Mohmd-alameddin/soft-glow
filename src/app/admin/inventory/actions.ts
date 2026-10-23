'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function saveStockSettings(materialId: number, openingQuantity: number, lowStockThreshold: number) {
 const { supabase } = await requireAdmin();
 if (!Number.isSafeInteger(materialId) || materialId <= 0 || !Number.isFinite(openingQuantity) || !Number.isFinite(lowStockThreshold) || lowStockThreshold < 0 || Math.abs(openingQuantity) > 1e12 || lowStockThreshold > 1e12) throw new Error('Invalid stock settings');
 const { error } = await supabase.from('material_inventory_settings').upsert({material_id:materialId,opening_quantity:openingQuantity,low_stock_threshold:lowStockThreshold,updated_at:new Date().toISOString()},{onConflict:'material_id'});
 if(error) throw new Error(error.message);
 revalidatePath('/admin/inventory');
}
export async function addStockMovement(input: {material_id:number;moved_on:string;movement_type:'consumption'|'adjustment';quantity_change:number;notes:string}) {
 const { supabase } = await requireAdmin();
 if(!Number.isSafeInteger(input.material_id)||input.material_id<=0||!/^\d{4}-\d{2}-\d{2}$/.test(input.moved_on)||!['consumption','adjustment'].includes(input.movement_type)||!Number.isFinite(input.quantity_change)||input.quantity_change===0||Math.abs(input.quantity_change)>1e12||(input.movement_type==='consumption'&&input.quantity_change>=0)) throw new Error('Invalid stock movement');
 const {error}=await supabase.from('material_stock_movements').insert({material_id:input.material_id,moved_on:input.moved_on,movement_type:input.movement_type,quantity_change:input.quantity_change,notes:(input.notes||'').trim().slice(0,1000)});
 if(error) throw new Error(error.message);
 revalidatePath('/admin/inventory');
}
export async function deleteStockMovement(id:number) {
 const {supabase}=await requireAdmin();
 if(!Number.isSafeInteger(id)||id<=0) throw new Error('Invalid movement');
 const {error}=await supabase.from('material_stock_movements').delete().eq('id',id);
 if(error) throw new Error(error.message);
 revalidatePath('/admin/inventory');
}
