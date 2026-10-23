'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { saveCostRecipe, type RecipeIngredient } from './actions';

export type CostProduct = { id: number; name_en: string; name_ar: string; price: number | null };
export type CostMaterial = { id: number; name: string; category: string; unit: 'g' | 'ml' | 'piece'; unit_cost: number };
export type CostRecipe = {
  product_id: number; ingredients: RecipeIngredient[];
  waste_percent: number; extra_cost: number; extra_notes: string;
};

const money = (value: number) => '$' + value.toFixed(2);

export default function CostingManager({ products, materials, initialRecipes }: {
  products: CostProduct[]; materials: CostMaterial[]; initialRecipes: CostRecipe[];
}) {
  const [recipes, setRecipes] = useState<CostRecipe[]>(initialRecipes);
  const [selectedId, setSelectedId] = useState<number>(products[0]?.id ?? 0);
  const [lines, setLines] = useState<RecipeIngredient[]>(() => initialRecipes.find(r => r.product_id === products[0]?.id)?.ingredients ?? []);
  const [waste, setWaste] = useState(String(initialRecipes.find(r => r.product_id === products[0]?.id)?.waste_percent ?? 0));
  const [extra, setExtra] = useState(String(initialRecipes.find(r => r.product_id === products[0]?.id)?.extra_cost ?? 0));
  const [notes, setNotes] = useState(initialRecipes.find(r => r.product_id === products[0]?.id)?.extra_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selected = products.find(p => p.id === selectedId);
  const materialMap = useMemo(() => new Map(materials.map(m => [m.id, m])), [materials]);
  const rows = lines.map(line => ({ ...line, material: materialMap.get(line.material_id) }));
  const materialsSubtotal = rows.reduce((sum, row) => sum + (row.material?.unit_cost ?? 0) * row.quantity, 0);
  const wasteAmount = materialsSubtotal * (Number(waste) || 0) / 100;
  const total = materialsSubtotal + wasteAmount + (Number(extra) || 0);
  const margin = selected?.price === null || selected?.price === undefined ? null : selected.price - total;

  function chooseProduct(id: number) {
    const recipe = recipes.find(r => r.product_id === id);
    setSelectedId(id);
    setLines(recipe?.ingredients.map(l => ({ ...l })) ?? []);
    setWaste(String(recipe?.waste_percent ?? 0));
    setExtra(String(recipe?.extra_cost ?? 0));
    setNotes(recipe?.extra_notes ?? '');
    setError(''); setMessage('');
  }
  function addMaterial(id: number) {
    if (!id || lines.some(line => line.material_id === id)) return;
    setLines(current => [...current, { material_id: id, quantity: 1 }]);
    setMessage('');
  }
  async function save() {
    setError(''); setMessage('');
    if (!selectedId) return;
    const wasteNumber = Number(waste), extraNumber = Number(extra);
    if (waste.trim() === '' || extra.trim() === '' || !Number.isFinite(wasteNumber) || wasteNumber < 0 || wasteNumber > 100 || !Number.isFinite(extraNumber) || extraNumber < 0) {
      setError('Please enter valid waste and extra cost values.'); return;
    }
    if (lines.some(l => !Number.isFinite(l.quantity) || l.quantity <= 0)) {
      setError('Each material needs a quantity greater than zero.'); return;
    }
    setSaving(true);
    try {
      const payload = { product_id: selectedId, ingredients: lines, waste_percent: wasteNumber, extra_cost: extraNumber, extra_notes: notes };
      await saveCostRecipe(payload);
      setRecipes(current => [...current.filter(r => r.product_id !== selectedId), payload]);
      setMessage('Recipe saved successfully. / تم حفظ الوصفة بنجاح');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save recipe.');
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] text-[#5d4133] p-5 sm:p-9">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-6"><ArrowLeft size={17}/> Admin products</Link>
        <h1 className="text-3xl sm:text-4xl font-semibold mb-2">Product Costing <span className="text-[#a97b61]">/ تكلفة التصنيع</span></h1>
        <p className="text-sm text-[#806c5f] mb-7">Calculate material cost per product, excluding labor. All prices in USD. / التكلفة دون أجرة اليد</p>
        <div className="flex flex-wrap gap-3 mb-7 text-sm">
          <Link href="/admin/materials" className="underline">Raw Materials / المواد</Link>
          <Link href="/admin/purchases" className="underline">Purchases / المشتريات</Link>
        </div>
        {products.length === 0 ? <p>No products found.</p> : <>
          <section className="bg-white rounded-2xl border border-[#e9ded3] p-5 mb-5">
            <label htmlFor="cost-product" className="block font-medium mb-2">Select product / اختر المنتج</label>
            <select id="cost-product" value={selectedId} onChange={e => chooseProduct(Number(e.target.value))} className="w-full border rounded-xl p-3 bg-white">
              {products.map(p => <option key={p.id} value={p.id}>SG-{String(p.id).padStart(3, '0')} — {p.name_en} / {p.name_ar}</option>)}
            </select>
            {selected && <p className="text-sm text-[#806c5f] mt-3">Selling price / سعر البيع: {selected.price === null ? 'On request' : money(selected.price)}</p>}
          </section>
          <section className="bg-white rounded-2xl border border-[#e9ded3] p-5 mb-5">
            <h2 className="text-xl font-semibold mb-3">Materials / المواد المستخدمة</h2>
            <p className="text-xs text-[#806c5f] mb-4">Enter grams (g), milliliters (ml), or pieces, according to each material's unit. Prices are read from Raw Materials.</p>
            <div className="space-y-3">
              {rows.map(row => <div key={row.material_id} className="grid grid-cols-12 gap-2 items-center border-b pb-3">
                <div className="col-span-12 sm:col-span-5 text-sm font-medium">{row.material?.name ?? `Missing material #${row.material_id}`} <span className="text-[#806c5f]">({row.material?.unit ?? '?'})</span></div>
                <div className="col-span-5 sm:col-span-3"><input type="number" min="0.0001" step="any" aria-label={`Quantity of ${row.material?.name ?? row.material_id}`} value={row.quantity} onChange={e => setLines(old => old.map(l => l.material_id === row.material_id ? { ...l, quantity: Number(e.target.value) } : l))} className="w-full border rounded-lg p-2"/></div>
                <div className="col-span-5 sm:col-span-3 text-sm text-end">{money((row.material?.unit_cost ?? 0) * row.quantity)}</div>
                <button type="button" className="col-span-2 sm:col-span-1 flex justify-end text-red-700" aria-label="Remove material" onClick={() => setLines(old => old.filter(l => l.material_id !== row.material_id))}><Trash2 size={18}/></button>
              </div>)}
              {lines.length === 0 && <p className="text-sm text-[#806c5f]">No materials yet. / لم تُضف مواد بعد</p>}
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-5">
              <select id="new-material" defaultValue="" className="border rounded-xl p-3 bg-white flex-1 min-w-44">
                <option value="">Select a material / اختر مادة</option>
                {materials.filter(m => !lines.some(l => l.material_id === m.id)).map(m => <option key={m.id} value={m.id}>{m.name} — {money(m.unit_cost)}/{m.unit}</option>)}
              </select>
              <button type="button" className="inline-flex gap-2 items-center rounded-xl bg-[#5d4133] text-white px-4 py-3" onClick={() => {
                const select = document.getElementById('new-material') as HTMLSelectElement | null;
                if (select?.value) { addMaterial(Number(select.value)); select.value = ''; }
              }}><Plus size={16}/> Add material</button>
            </div>
            {materials.length === 0 && <p className="mt-3 text-red-700 text-sm">Add raw materials first in /admin/materials.</p>}
          </section>
          <section className="bg-white rounded-2xl border border-[#e9ded3] p-5 mb-5 space-y-4">
            <h2 className="text-xl font-semibold">Additional costs / تكاليف إضافية</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-sm">Waste percentage / نسبة الهدر (%)<input type="number" min="0" max="100" step="any" value={waste} onChange={e => setWaste(e.target.value)} className="block w-full border rounded-xl p-3 mt-2"/></label>
              <label className="block text-sm">Electricity, gas, etc. / كهرباء وغاز ($)<input type="number" min="0" step="any" value={extra} onChange={e => setExtra(e.target.value)} className="block w-full border rounded-xl p-3 mt-2"/></label>
            </div>
            <label className="block text-sm">Extra cost notes / ملاحظات<input type="text" maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Electricity, gas, etc." className="block w-full border rounded-xl p-3 mt-2"/></label>
          </section>
          <section className="bg-[#efe3d8] rounded-2xl p-5 mb-5 space-y-2">
            <div className="flex justify-between gap-3"><span>Materials / المواد</span><strong>{money(materialsSubtotal)}</strong></div>
            <div className="flex justify-between gap-3"><span>Waste / الهدر</span><strong>{money(wasteAmount)}</strong></div>
            <div className="flex justify-between gap-3"><span>Extra / إضافات</span><strong>{money(Number(extra) || 0)}</strong></div>
            <div className="border-t border-[#d6c5b5] pt-3 flex justify-between gap-3 text-xl"><strong>Total cost / التكلفة</strong><strong>{money(total)}</strong></div>
            {margin !== null && <p className="text-sm">Selling price minus material cost (before labor and other overhead): {money(margin)}</p>}
          </section>
          {error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
          {message && <p role="status" className="text-green-800 mb-3">{message}</p>}
          <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 bg-[#5d4133] text-white rounded-full px-7 py-3 disabled:opacity-50"><Save size={18}/>{saving ? 'Saving...' : 'Save Recipe / حفظ الوصفة'}</button>
        </>}
      </div>
    </main>
  );
}
