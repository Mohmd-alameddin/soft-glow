'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function updateShopOrder(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = Number(formData.get('id'));
  const payment_status = String(formData.get('payment_status') ?? '');
  const order_status = String(formData.get('order_status') ?? '');
  const feeText = String(formData.get('delivery_fee') ?? '').trim();
  const delivery_fee = feeText === '' ? null : Number(feeText);
  const notes_admin = String(formData.get('notes_admin') ?? '').trim();
  if (!Number.isSafeInteger(id) || id < 1 ||
    !['pending','paid','failed','refunded'].includes(payment_status) ||
    !['new','confirmed','preparing','delivered','cancelled'].includes(order_status) ||
    (delivery_fee !== null && (!Number.isFinite(delivery_fee) || delivery_fee < 0 || delivery_fee > 100000)) ||
    notes_admin.length > 2000) throw new Error('Invalid order update');
  const {data:previous,error:readError} = await supabase.from('shop_orders').select('payment_status,paid_at').eq('id',id).single();
  if(readError || !previous) throw new Error('Order not found');
  const paid_at = payment_status === 'paid' ? (previous.payment_status === 'paid' ? previous.paid_at : new Date().toISOString()) : null;
  const {error} = await supabase.from('shop_orders').update({payment_status,order_status,delivery_fee,notes_admin,paid_at}).eq('id',id);
  if(error) throw new Error(error.message);
  revalidatePath('/admin/orders');
}
