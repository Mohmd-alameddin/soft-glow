'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { addSale, deleteSale } from './actions';

export type SaleProduct = { id: number; name_en: string; name_ar: string; price: number | null };
export type Sale = {
  id: number; sold_on: string; product_id: number | null; product_code: string;
  product_name: string; quantity: number; unit_sale_price: number;
  unit_material_cost: number; discount_total: number; notes: string;
};
const money = (n: number) => '$' + n.toFixed(2);
const field = 'w-full rounded-xl border border-[#e7d9cc] bg-white px-3 py-2.5';

export default function SalesManager({ products, initialSales }: { products: SaleProduct[]; initialSales: Sale[] }) {
  const [sales, setSales] = useState(initialSales);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState(String(products[0]?.price ?? 0));
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const visible = useMemo(() => sales.filter(s => s.sold_on.startsWith(month)), [sales, month]);
  const revenue = visible.reduce((n, s) => n + s.quantity * s.unit_sale_price - s.discount_total, 0);
  const cost = visible.reduce((n, s) => n + s.quantity * s.unit_material_cost, 0);
  const units = visible.reduce((n, s) => n + s.quantity, 0);
  const grossProfit = revenue - cost;

  function chooseProduct(id: number) {
    setProductId(id);
    setUnitPrice(String(products.find(p => p.id === id)?.price ?? 0));
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setMessage('');
    setBusy(true);
    try {
      await addSale({ sold_on: date, product_id: productId, quantity: Number(qty), unit_sale_price: Number(unitPrice), discount_total: Number(discount), notes });
      // Reload to obtain the server-calculated cost snapshot and generated sale ID.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record sale.');
      setBusy(false);
    }
  }
  async function remove(id: number) {
    if (!window.confirm('Delete this sale permanently? / حذف عملية البيع نهائياً؟')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await deleteSale(id);
      setSales(current => current.filter(s => s.id !== id));
      setMessage('Sale deleted / تم حذف البيع');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete sale.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#fbf7f2] text-[#5d4133] px-4 py-8 sm:p-10">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-5"><ArrowLeft size={17}/> Admin products</Link>
      <h1 className="text-3xl sm:text-4xl font-semibold">Sales & Profit <span className="text-[#a97b61]">/ المبيعات والأرباح</span></h1>
      <p className="text-sm text-[#806c5f] mt-2 mb-5">USD only. Sales are entered manually after customer confirmation. Labor is excluded from manufacturing cost.</p>
      <nav className="flex flex-wrap gap-4 text-sm underline mb-8"><Link href="/admin/materials">Materials / المواد</Link><Link href="/admin/purchases">Purchases / المشتريات</Link><Link href="/admin/costing">Costing / تكلفة التصنيع</Link></nav>
      {error && <p role="alert" className="rounded-xl bg-red-50 text-red-800 p-3 mb-4">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-green-50 text-green-800 p-3 mb-4">{message}</p>}
      <section className="rounded-2xl border border-[#e7d9cc] bg-white p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4">Record a Sale / تسجيل عملية بيع</h2>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="text-sm">Sale date / تاريخ البيع<input className={field + ' mt-1'} type="date" required value={date} onChange={e => setDate(e.target.value)}/></label>
          <label className="text-sm sm:col-span-2">Product / المنتج<select className={field + ' mt-1'} required value={productId} onChange={e => chooseProduct(Number(e.target.value))}>{products.map(p => <option key={p.id} value={p.id}>SG-{String(p.id).padStart(3,'0')} — {p.name_en} / {p.name_ar}</option>)}</select></label>
          <label className="text-sm">Quantity / الكمية<input className={field + ' mt-1'} type="number" min="1" max="9999" step="1" required value={qty} onChange={e => setQty(e.target.value)}/></label>
          <label className="text-sm">Unit selling price ($) / سعر بيع القطعة<input className={field + ' mt-1'} type="number" min="0" step="0.01" required value={unitPrice} onChange={e => setUnitPrice(e.target.value)}/></label>
          <label className="text-sm">Total discount ($) / الخصم الإجمالي<input className={field + ' mt-1'} type="number" min="0" step="0.01" required value={discount} onChange={e => setDiscount(e.target.value)}/></label>
          <label className="text-sm sm:col-span-2 lg:col-span-3">Notes / ملاحظات<input className={field + ' mt-1'} maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional customer name, order reference, colors, scent..."/></label>
          <button disabled={busy || products.length === 0} className="rounded-full bg-[#5d4133] text-white px-6 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50" type="submit"><Plus size={17}/>{busy ? 'Saving...' : 'Save Sale / حفظ البيع'}</button>
        </form>
        <p className="text-xs text-[#806c5f] mt-4">The system calculates and freezes manufacturing cost using the current saved recipe and material prices. A recipe is required before recording a sale.</p>
      </section>
      <section className="rounded-2xl border border-[#e7d9cc] bg-white p-5 mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5"><h2 className="text-xl font-semibold">Monthly report / التقرير الشهري</h2><label className="text-sm">Month / الشهر <input type="month" className="border rounded-lg p-2 ms-2" value={month} onChange={e => setMonth(e.target.value)}/></label></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[['Revenue / المبيعات',money(revenue)],['Material cost / تكلفة المواد',money(cost)],['Gross profit / الربح الإجمالي',money(grossProfit)],['Units sold / القطع المباعة',String(units)]].map(([label,value]) => <div key={label} className="bg-[#f6eee7] rounded-xl p-4"><p className="text-xs text-[#806c5f] mb-2">{label}</p><p className="text-xl font-semibold">{value}</p></div>)}
        </div>
        <p className="text-xs text-[#806c5f] mt-4">Gross profit = sales after discounts − saved material manufacturing cost. It is NOT net profit: rent, delivery, labor, other business expenses and taxes are not deducted.</p>
      </section>
      <section className="rounded-2xl border border-[#e7d9cc] bg-white p-5">
        <h2 className="text-xl font-semibold mb-4">Sales records / سجل المبيعات ({visible.length})</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm text-start"><thead><tr className="border-b text-[#806c5f]">{['Date','Product','Qty','Revenue','Cost','Gross profit','Notes',''].map(h => <th key={h} className="text-start p-2">{h}</th>)}</tr></thead><tbody>
          {visible.map(s => { const saleRevenue = s.quantity * s.unit_sale_price - s.discount_total; const saleCost = s.quantity * s.unit_material_cost; return <tr key={s.id} className="border-b border-[#eee5de]"><td className="p-2 whitespace-nowrap">{s.sold_on}</td><td className="p-2">{s.product_name}<div className="text-xs text-[#806c5f]">{s.product_code}</div></td><td className="p-2">{s.quantity}</td><td className="p-2">{money(saleRevenue)}</td><td className="p-2">{money(saleCost)}</td><td className="p-2 font-medium">{money(saleRevenue-saleCost)}</td><td className="p-2 max-w-40 break-words">{s.notes}</td><td className="p-2"><button type="button" disabled={busy} onClick={() => remove(s.id)} title="Delete sale" aria-label={`Delete sale ${s.id}`} className="text-red-700 disabled:opacity-50"><Trash2 size={17}/></button></td></tr>; })}
          {visible.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-[#806c5f]">No sales recorded for this month. / لا توجد مبيعات لهذا الشهر</td></tr>}
        </tbody></table></div>
      </section>
      <p className="text-xs text-[#806c5f] mt-5">This initial view loads up to 5,000 recent sales. It does not automatically import WhatsApp orders or deduct inventory.</p>
    </div>
  </main>;
}
