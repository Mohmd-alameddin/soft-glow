import { requireAdmin } from '@/lib/admin';
import SalesManager, { type Sale, type SaleProduct } from './SalesManager';

export default async function SalesPage() {
  const { supabase } = await requireAdmin();
  const [productsResult, salesResult] = await Promise.all([
    supabase.from('products').select('id,name_en,name_ar,price').order('id'),
    supabase.from('sales').select('id,sold_on,product_id,product_code,product_name,quantity,unit_sale_price,unit_material_cost,discount_total,notes').order('sold_on', { ascending: false }).order('id', { ascending: false }).limit(5000),
  ]);
  if (productsResult.error) throw new Error('Could not load products: ' + productsResult.error.message);
  if (salesResult.error) throw new Error('Could not load sales: ' + salesResult.error.message);
  const products: SaleProduct[] = (productsResult.data ?? []).map(p => ({
    id: Number(p.id), name_en: p.name_en, name_ar: p.name_ar,
    price: p.price === null ? null : Number(p.price),
  }));
  const sales: Sale[] = (salesResult.data ?? []).map(s => ({
    id: Number(s.id), sold_on: s.sold_on, product_id: s.product_id === null ? null : Number(s.product_id),
    product_code: s.product_code, product_name: s.product_name,
    quantity: Number(s.quantity), unit_sale_price: Number(s.unit_sale_price),
    unit_material_cost: Number(s.unit_material_cost), discount_total: Number(s.discount_total), notes: s.notes ?? '',
  }));
  return <SalesManager products={products} initialSales={sales} />;
}
