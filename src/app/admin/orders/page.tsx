import { requireAdmin } from '@/lib/admin';
import OrdersManager from './OrdersManager';

export default async function OrdersPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('shop_orders')
    .select('id,reference,created_at,customer_name,phone,governorate,city,address,delivery_notes,payment_method,payment_status,order_status,currency,subtotal,delivery_fee,notes_admin,paid_at,shop_order_items(id,product_id,product_name,quantity,unit_price,line_total,options)')
    .order('created_at', { ascending: false }).limit(300);
  if (error) throw new Error('Cannot load orders: ' + error.message);
  return <OrdersManager orders={(data ?? []).map(o => ({...o, id:Number(o.id), subtotal:Number(o.subtotal), delivery_fee:o.delivery_fee===null?null:Number(o.delivery_fee),shop_order_items:(o.shop_order_items ?? []).map(i=>({...i,id:Number(i.id),quantity:Number(i.quantity),unit_price:Number(i.unit_price),line_total:Number(i.line_total)}))}))} />;
}
