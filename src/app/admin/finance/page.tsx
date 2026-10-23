import { requireAdmin } from '@/lib/admin';
import FinanceManager, { type SaleRow, type PurchaseRow, type ExpenseRow } from './FinanceManager';

export default async function FinancePage() {
 const { supabase } = await requireAdmin();
 // Query all rows in batches: Supabase defaults to 1000 rows per request.
 async function loadAll(table: 'sales' | 'material_purchases' | 'operating_expenses', columns: string) {
   const output: Record<string, unknown>[] = [];
   for (let start = 0; ; start += 1000) {
     const { data, error } = await supabase.from(table).select(columns).order('id', { ascending: true }).range(start, start + 999);
     if (error) throw new Error(`Could not load ${table}: ${error.message}`);
     output.push(...((data ?? []) as unknown as Record<string, unknown>[]));
     if (!data || data.length < 1000) break;
   }
   return output;
 }
 const [salesRaw, purchasesRaw, expensesRaw] = await Promise.all([
   loadAll('sales', 'id,sold_on,product_name,quantity,unit_sale_price,unit_material_cost,discount_total'),
   loadAll('material_purchases', 'id,purchased_on,material_id,quantity,total_cost,supplier'),
   loadAll('operating_expenses', 'id,spent_on,category,description,amount,notes'),
 ]);
 const sales: SaleRow[] = salesRaw.map(s => ({
   id: Number(s.id), sold_on: String(s.sold_on), product_name: String(s.product_name ?? ''),
   quantity: Number(s.quantity), unit_sale_price: Number(s.unit_sale_price),
   unit_material_cost: Number(s.unit_material_cost), discount_total: Number(s.discount_total),
 }));
 const purchases: PurchaseRow[] = purchasesRaw.map(p => ({
   id: Number(p.id), purchased_on: String(p.purchased_on), material_id: Number(p.material_id),
   quantity: Number(p.quantity), total_cost: Number(p.total_cost), supplier: String(p.supplier ?? ''),
 }));
 const expenses: ExpenseRow[] = expensesRaw.map(e => ({
   id: Number(e.id), spent_on: String(e.spent_on), category: String(e.category),
   description: String(e.description), amount: Number(e.amount), notes: String(e.notes ?? ''),
 }));
 return <FinanceManager sales={sales} purchases={purchases} initialExpenses={expenses} />;
}
