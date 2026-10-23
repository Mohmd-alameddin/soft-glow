'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import type { PurchaseMaterial, PurchaseRecord } from './page';
import { savePurchase, deletePurchase, type PurchaseInput } from './actions';
import { createClient } from '@/lib/supabase/client';

const field = 'w-full rounded-xl border border-[#e6d8cc] bg-white p-3 outline-none focus:ring-2 focus:ring-[#a97b61]';
const money = (value: number) => `$${value.toFixed(2)}`;
const today = () => new Date().toLocaleDateString('en-CA');

export default function PurchaseManager({ initialMaterials, initialPurchases }: { initialMaterials: PurchaseMaterial[]; initialPurchases: PurchaseRecord[] }) {
  const [purchases, setPurchases] = useState(initialPurchases);
  const [editing, setEditing] = useState<PurchaseInput | null>(null);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const materialMap = useMemo(() => new Map(initialMaterials.map(m => [m.id, m])), [initialMaterials]);
  const monthRows = purchases.filter(p => p.purchased_on.startsWith(month));
  const visible = monthRows.filter(p => `${materialMap.get(p.material_id)?.name ?? ''} ${p.supplier} ${p.notes}`.toLowerCase().includes(search.toLowerCase()));
  const total = monthRows.reduce((sum, p) => sum + p.total_cost, 0);
  const update = (patch: Partial<PurchaseInput>) => setEditing(old => old ? { ...old, ...patch } : null);
  async function refresh() {
    const { data, error: loadError } = await createClient().from('material_purchases').select('id,material_id,purchased_on,quantity,total_cost,supplier,notes').order('purchased_on', { ascending: false }).order('id', { ascending: false }).limit(2000);
    if (loadError) throw new Error(loadError.message);
    setPurchases((data ?? []).map(p => ({ ...p, quantity: Number(p.quantity), total_cost: Number(p.total_cost) })));
  }
  async function save() {
    if (!editing) return;
    setBusy(true); setError(''); setMessage('');
    try { await savePurchase(editing); await refresh(); setEditing(null); setMonth(editing.purchased_on.slice(0, 7)); setMessage('Purchase saved / تم حفظ المشتريات'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save purchase.'); }
    finally { setBusy(false); }
  }
  async function remove(p: PurchaseRecord) {
    if (!window.confirm('Delete this purchase? / حذف عملية الشراء؟')) return;
    setBusy(true); setError(''); setMessage('');
    try { await deletePurchase(p.id); setPurchases(old => old.filter(x => x.id !== p.id)); setMessage('Purchase deleted / تم الحذف'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete purchase.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#fbf7f2] text-[#5d4133] p-5 sm:p-10">
    <div className="max-w-6xl mx-auto">
      <Link href="/admin/materials" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"><ArrowLeft size={16}/> Raw Materials / المواد الأولية</Link>
      <div className="flex flex-wrap justify-between gap-4 items-center mb-6">
        <div><h1 className="text-3xl font-semibold">Purchases / المشتريات</h1><p className="text-sm text-[#806b5e] mt-2">Monthly purchase records in USD / سجل المشتريات بالدولار</p></div>
        <button type="button" disabled={initialMaterials.length === 0} onClick={() => { setEditing({ material_id: initialMaterials[0]?.id ?? 0, purchased_on: today(), quantity: 1000, total_cost: 0, supplier: '', notes: '' }); setError(''); }} className="rounded-full bg-[#5d4133] text-white px-5 py-3 flex gap-2 items-center disabled:opacity-40"><Plus size={18}/> Add Purchase / إضافة شراء</button>
      </div>
      {initialMaterials.length === 0 && <p className="mb-5 text-red-700">Please add a material first / أضف مادة أولاً <Link href="/admin/materials" className="underline">Materials</Link></p>}
      <div className="rounded-2xl bg-[#f2e7db] p-4 mb-6 text-sm leading-7">Enter the actual quantity purchased in the material's base unit (g, ml, or piece), and the total amount paid. This page records purchases, not consumption or current stock. / أدخل الكمية التي اشتريتها والمبلغ المدفوع. هذه الصفحة للمشتريات وليست لحساب الاستهلاك أو المخزون.</div>
      {message && <p role="status" className="mb-4 text-green-700">{message}</p>}
      {error && !editing && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <label className="text-sm">Month / الشهر<input type="month" value={month} onChange={e => setMonth(e.target.value)} className={`${field} mt-2`}/></label>
        <label className="text-sm sm:col-span-2">Search / بحث<input value={search} onChange={e => setSearch(e.target.value)} className={`${field} mt-2`} placeholder="Material, supplier, notes"/></label>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-[#e6d8cc] p-5"><p className="text-sm text-[#806b5e]">Monthly spending / مصاريف شراء المواد</p><p className="text-3xl font-semibold mt-2">{money(total)}</p></div>
        <div className="rounded-2xl bg-white border border-[#e6d8cc] p-5"><p className="text-sm text-[#806b5e]">Purchase records / عمليات الشراء</p><p className="text-3xl font-semibold mt-2">{monthRows.length}</p></div>
        <div className="rounded-2xl bg-white border border-[#e6d8cc] p-5"><p className="text-sm text-[#806b5e]">Materials purchased / مواد مختلفة</p><p className="text-3xl font-semibold mt-2">{new Set(monthRows.map(p => p.material_id)).size}</p></div>
      </div>
      <div className="overflow-x-auto bg-white border border-[#e6d8cc] rounded-2xl"><table className="w-full text-sm text-left"><thead className="bg-[#f2e7db]"><tr><th className="p-4">Date / التاريخ</th><th className="p-4">Material / المادة</th><th className="p-4">Quantity / الكمية</th><th className="p-4">Total / المجموع</th><th className="p-4">Cost / unit</th><th className="p-4">Supplier / المورد</th><th className="p-4">Actions</th></tr></thead><tbody>
        {visible.map(p => { const m = materialMap.get(p.material_id); return <tr key={p.id} className="border-t border-[#eee3d9]"><td className="p-4 whitespace-nowrap">{p.purchased_on}</td><td className="p-4 font-medium">{m?.name ?? 'Deleted material'}</td><td className="p-4">{p.quantity} {m?.unit}</td><td className="p-4">{money(p.total_cost)}</td><td className="p-4">${(p.total_cost / p.quantity).toFixed(5)}</td><td className="p-4">{p.supplier || '—'}{p.notes && <p className="text-xs text-[#806b5e] mt-1">{p.notes}</p>}</td><td className="p-4"><div className="flex gap-3"><button disabled={busy} aria-label="Edit purchase" onClick={() => { setEditing({ ...p }); setError(''); }}><Pencil size={17}/></button><button disabled={busy} aria-label="Delete purchase" onClick={() => void remove(p)} className="text-red-700"><Trash2 size={17}/></button></div></td></tr>; })}
        {visible.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-[#806b5e]">No purchases for this month / لا توجد مشتريات لهذا الشهر</td></tr>}
      </tbody></table></div>
      <p className="text-xs text-[#806b5e] mt-4">Showing up to 2,000 most recent purchase records. / عرض آخر ٢٠٠٠ عملية شراء.</p>
      {editing && <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4 flex items-center justify-center"><div className="bg-[#fbf7f2] rounded-2xl p-6 w-full max-w-xl my-6 space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{editing.id ? 'Edit Purchase / تعديل شراء' : 'New Purchase / شراء جديد'}</h2><button type="button" onClick={() => setEditing(null)} aria-label="Close"><X/></button></div>
        <label className="block text-sm">Material / المادة<select className={`${field} mt-1`} value={editing.material_id} onChange={e => update({ material_id: Number(e.target.value) })}>{initialMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select></label>
        <label className="block text-sm">Date / التاريخ<input type="date" className={`${field} mt-1`} value={editing.purchased_on} onChange={e => update({ purchased_on: e.target.value })}/></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Quantity / الكمية ({materialMap.get(editing.material_id)?.unit})<input type="number" min="0.001" step="0.001" className={`${field} mt-1`} value={editing.quantity} onChange={e => update({ quantity: Number(e.target.value) })}/></label><label className="block text-sm">Total paid (USD) / المبلغ<input type="number" min="0" step="0.01" className={`${field} mt-1`} value={editing.total_cost} onChange={e => update({ total_cost: Number(e.target.value) })}/></label></div>
        <p className="text-sm bg-[#f2e7db] p-3 rounded-xl">Cost per unit / تكلفة الوحدة: {editing.quantity > 0 ? `$${(editing.total_cost / editing.quantity).toFixed(6)}` : '—'}</p>
        <label className="block text-sm">Supplier / المورد<input className={`${field} mt-1`} maxLength={150} value={editing.supplier} onChange={e => update({ supplier: e.target.value })}/></label>
        <label className="block text-sm">Notes / ملاحظات<textarea className={`${field} mt-1`} maxLength={500} rows={3} value={editing.notes} onChange={e => update({ notes: e.target.value })}/></label>
        {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
        <button type="button" disabled={busy} onClick={() => void save()} className="w-full rounded-full bg-[#5d4133] text-white py-3 flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18}/>{busy ? 'Saving...' : 'Save Purchase / حفظ الشراء'}</button>
      </div></div>}
    </div>
  </main>;
}
