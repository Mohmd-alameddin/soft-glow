'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react';
import type { Material } from './page';
import { saveMaterial, deleteMaterial, type MaterialInput } from './actions';

const categories = [
  ['wax', 'Wax / شمع'], ['fragrance', 'Fragrance / عطر'],
  ['gypsum', 'Gypsum / جبس'], ['color', 'Color / لون'],
  ['packaging', 'Packaging / تغليف'], ['other', 'Other / أخرى'],
];
const empty = (): MaterialInput => ({ name: '', category: 'wax', unit: 'g', purchasePrice: 0, purchaseQuantity: 1000, notes: '' });
const field = 'w-full rounded-xl border border-[#e6d8cc] bg-white p-3 outline-none focus:ring-2 focus:ring-[#a97b61]';

export default function MaterialManager({ initialMaterials }: { initialMaterials: Material[] }) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initialMaterials);
  const [editing, setEditing] = useState<MaterialInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const update = (patch: Partial<MaterialInput>) => setEditing(old => old ? { ...old, ...patch } : old);
  function startEdit(m: Material) {
    // The current per-base-unit cost is shown as the price of 1000 units for convenient editing.
    setEditing({ id: m.id, name: m.name, category: m.category, unit: m.unit,
      purchasePrice: Number((m.unit_cost * (m.unit === 'piece' ? 1 : 1000)).toFixed(4)),
      purchaseQuantity: m.unit === 'piece' ? 1 : 1000, notes: m.notes });
    setError(''); setSuccess('');
  }
  async function save() {
    if (!editing) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await saveMaterial(editing);
      setEditing(null); setSuccess('Material saved successfully.');
      const { createClient } = await import('@/lib/supabase/client');
      const { data, error: loadError } = await createClient().from('raw_materials').select('id,name,category,unit,unit_cost,notes').order('name');
      if (!loadError && data) setMaterials(data.map(m => ({ ...m, unit: m.unit as Material['unit'], unit_cost: Number(m.unit_cost) })));
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); }
    finally { setBusy(false); }
  }
  async function remove(m: Material) {
    if (!window.confirm(`Delete ${m.name}?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try { await deleteMaterial(m.id); setMaterials(old => old.filter(x => x.id !== m.id)); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#fbf7f2] text-[#5d4133] p-5 sm:p-10">
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"><ArrowLeft size={16}/> Back to Products / العودة للمنتجات</Link>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
        <div><h1 className="text-3xl font-semibold">Raw Materials / المواد الأولية</h1><p className="text-sm text-[#806b5e] mt-2">All prices in USD · No labor cost / الأسعار بالدولار دون أجرة اليد</p></div>
        <button className="flex items-center gap-2 rounded-full bg-[#5d4133] text-white px-5 py-3" onClick={() => { setEditing(empty()); setError(''); setSuccess(''); }}><Plus size={18}/> Add Material / إضافة مادة</button>
      </div>
      <div className="rounded-2xl bg-[#f2e7db] p-4 mb-6 text-sm leading-7">Enter the price and quantity you buy (for example: $8 for 1000 g of wax). The system calculates the cost of one gram, milliliter, or piece automatically. / أدخل سعر الشراء والكمية، وسيحسب النظام تكلفة الوحدة تلقائياً.</div>
      {success && <p className="text-green-700 mb-4" role="status">{success}</p>}
      <input className={`${field} mb-5`} placeholder="Search materials / بحث عن مادة" value={search} onChange={e => setSearch(e.target.value)}/>
      <div className="overflow-x-auto rounded-2xl bg-white border border-[#e6d8cc]">
        <table className="w-full text-sm text-left"><thead className="bg-[#f2e7db]"><tr><th className="p-4">Material / المادة</th><th className="p-4">Category</th><th className="p-4">Unit cost (USD)</th><th className="p-4">Actions</th></tr></thead><tbody>
          {materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).map(m => <tr key={m.id} className="border-t border-[#eee3d9]"><td className="p-4 font-medium">{m.name}</td><td className="p-4">{categories.find(c => c[0] === m.category)?.[1] ?? m.category}</td><td className="p-4">${m.unit_cost.toFixed(4)} / {m.unit}</td><td className="p-4"><div className="flex gap-3"><button disabled={busy} onClick={() => startEdit(m)} aria-label={`Edit ${m.name}`}><Pencil size={18}/></button><button disabled={busy} onClick={() => void remove(m)} aria-label={`Delete ${m.name}`} className="text-red-700"><Trash2 size={18}/></button></div></td></tr>)}
          {materials.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-[#806b5e]">No materials yet / لا توجد مواد بعد</td></tr>}
        </tbody></table>
      </div>
      {editing && <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4 flex items-center justify-center"><div className="bg-[#fbf7f2] rounded-2xl p-6 w-full max-w-lg my-6 space-y-4">
        <h2 className="text-xl font-semibold">{editing.id ? 'Edit Material / تعديل مادة' : 'New Material / مادة جديدة'}</h2>
        <label className="block text-sm">Name / اسم المادة<input className={`${field} mt-1`} maxLength={120} value={editing.name} onChange={e => update({name:e.target.value})}/></label>
        <label className="block text-sm">Category / الفئة<select className={`${field} mt-1`} value={editing.category} onChange={e => update({category:e.target.value})}>{categories.map(c => <option key={c[0]} value={c[0]}>{c[1]}</option>)}</select></label>
        <label className="block text-sm">Unit used in recipes / وحدة الحساب<select className={`${field} mt-1`} value={editing.unit} onChange={e => update({unit:e.target.value as MaterialInput['unit'],purchaseQuantity:e.target.value === 'piece' ? 1 : 1000})}><option value="g">Gram / غرام</option><option value="ml">Milliliter / مل</option><option value="piece">Piece / قطعة</option></select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Purchase price ($) / السعر<input type="number" min="0" step="any" className={`${field} mt-1`} value={editing.purchasePrice} onChange={e => update({purchasePrice:Number(e.target.value)})}/></label><label className="block text-sm">Purchased quantity ({editing.unit}) / الكمية<input type="number" min="0.000001" step="any" className={`${field} mt-1`} value={editing.purchaseQuantity} onChange={e => update({purchaseQuantity:Number(e.target.value)})}/></label></div>
        <p className="bg-[#f2e7db] rounded-xl p-3 text-sm">Cost per {editing.unit}: <strong>${editing.purchaseQuantity > 0 ? (editing.purchasePrice / editing.purchaseQuantity).toFixed(6) : '—'}</strong></p>
        <label className="block text-sm">Notes / ملاحظات<textarea className={`${field} mt-1`} rows={2} maxLength={500} value={editing.notes} onChange={e => update({notes:e.target.value})}/></label>
        {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end"><button disabled={busy} className="rounded-full border px-5 py-3" onClick={() => setEditing(null)}>Cancel / إلغاء</button><button disabled={busy} className="flex gap-2 items-center rounded-full bg-[#5d4133] text-white px-5 py-3 disabled:opacity-50" onClick={() => void save()}><Save size={17}/>{busy ? 'Saving...' : 'Save / حفظ'}</button></div>
      </div></div>}
    </div>
  </main>;
}
