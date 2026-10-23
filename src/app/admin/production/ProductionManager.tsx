'use client';
import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { recordProduction } from './actions';

export type Product = { id:number; name_en:string; name_ar:string };
export type Material = { id:number; name:string; unit:string; unit_cost:number };
export type Recipe = { product_id:number; ingredients:{material_id:number;quantity:number}[]; waste_percent:number; extra_cost:number };
export type Batch = { id:number; product_id:number; produced_on:string; quantity:number; recipe_snapshot:{material_id:number;material_name:string;unit:string;quantity_consumed:number;unit_cost:number}[]; material_cost_total:number; extra_cost_total:number; notes:string };
const money=(n:number)=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>new Date().toLocaleDateString('en-CA');

export default function ProductionManager({products,materials,recipes,batches}:{products:Product[];materials:Material[];recipes:Recipe[];batches:Batch[]}) {
 const [productId,setProductId]=useState(products[0]?.id??0);
 const [quantity,setQuantity]=useState(1);
 const [producedOn,setProducedOn]=useState(today);
 const [notes,setNotes]=useState('');
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [busy,startTransition]=useTransition();
 const recipe=recipes.find(r=>r.product_id===productId);
 const materialMap=useMemo(()=>new Map(materials.map(m=>[m.id,m])),[materials]);
 const preview=(recipe?.ingredients??[]).map(line=>{
  const m=materialMap.get(line.material_id);
  const need=Math.ceil(line.quantity*quantity*(1+(recipe?.waste_percent??0)/100)*1000)/1000;
  return {id:line.material_id,name:m?.name??'Missing material',unit:m?.unit??'',need,cost:need*(m?.unit_cost??0)};
 });
 const total=preview.reduce((sum,x)=>sum+x.cost,0)+(recipe?.extra_cost??0)*quantity;
 const input='w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-amber-700';
 function submit(){
  setError('');setSuccess('');
  if(!recipe?.ingredients.length){setError('Save a recipe for this product first. / يجب حفظ وصفة تصنيع أولاً');return;}
  if(!Number.isSafeInteger(quantity)||quantity<1){setError('Invalid quantity');return;}
  if(!window.confirm(`Record production of ${quantity} units and deduct raw materials? / تأكيد تصنيع ${quantity} قطع وخصم المواد؟`))return;
  startTransition(async()=>{
   try {
    const result=await recordProduction({product_id:productId,quantity,produced_on:producedOn,notes});
    setSuccess(`Production batch #${result.batchId} saved. / تم تسجيل دفعة التصنيع`);
    window.location.reload();
   } catch(e){setError(e instanceof Error?e.message:String(e));}
  });
 }
 return <main className="min-h-screen bg-[#faf7f2] px-4 py-8 text-stone-900 sm:px-8">
  <div className="mx-auto max-w-5xl space-y-6">
   <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-800">Soft Glow · Admin</p><h1 className="mt-2 text-3xl font-semibold">Production & Material Consumption</h1><p className="mt-1 text-stone-600">تسجيل التصنيع وخصم المواد من المخزون</p></div>
   <nav className="flex flex-wrap gap-2 text-sm">{[['Inventory','/admin/inventory'],['Costing','/admin/costing'],['Sales','/admin/sales'],['Finance','/admin/finance']].map(([name,href])=><Link key={href} href={href} className="rounded-full border border-stone-300 bg-white px-4 py-2 hover:bg-amber-50">{name}</Link>)}</nav>
   <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
    <h2 className="text-xl font-semibold">New production batch / دفعة تصنيع جديدة</h2>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
     <label className="space-y-1 text-sm">Product / المنتج<select className={input} value={productId} onChange={e=>setProductId(Number(e.target.value))}>{products.map(p=><option key={p.id} value={p.id}>{p.name_en} / {p.name_ar}</option>)}</select></label>
     <label className="space-y-1 text-sm">Number of pieces / عدد القطع<input className={input} type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>
     <label className="space-y-1 text-sm">Production date / تاريخ التصنيع<input className={input} type="date" value={producedOn} onChange={e=>setProducedOn(e.target.value)}/></label>
     <label className="space-y-1 text-sm">Notes / ملاحظات<input className={input} maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
    </div>
    {!recipe?.ingredients.length?<p className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-900">No recipe for this product. <Link className="underline" href="/admin/costing">Create a recipe / إنشاء وصفة</Link></p>:<>
     <div className="mt-6 overflow-x-auto"><h3 className="mb-3 font-semibold">Materials to deduct / المواد التي ستُخصم</h3><table className="w-full min-w-[440px] text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="p-3">Material</th><th className="p-3">Quantity</th><th className="p-3">Estimated cost</th></tr></thead><tbody>{preview.map(x=><tr key={x.id} className="border-b border-stone-100"><td className="p-3">{x.name}</td><td className="p-3">{x.need} {x.unit}</td><td className="p-3">{money(x.cost)}</td></tr>)}</tbody></table></div>
     <div className="mt-4 flex flex-wrap justify-between gap-2 rounded-xl bg-amber-50 p-4 text-sm"><span>Waste included: {recipe.waste_percent}% · Extra cost: {money(recipe.extra_cost*quantity)}</span><strong>Estimated batch cost: {money(total)}</strong></div>
    </>}
    <p className="mt-4 text-sm text-stone-600">Final quantities and stock availability are verified again by the database when you submit. / يتحقق النظام من المخزون عند الحفظ.</p>
    {error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {success&&<p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{success}</p>}
    <button onClick={submit} disabled={busy||!recipe?.ingredients.length||!products.length} className="mt-5 rounded-xl bg-amber-800 px-5 py-3 font-medium text-white disabled:opacity-50">{busy?'Saving...':'Record Production & Deduct Stock / تسجيل التصنيع وخصم المواد'}</button>
   </section>
   <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold">Production history / سجل التصنيع</h2><p className="mt-1 text-sm text-stone-500">Latest 200 batches / آخر 200 دفعة</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="p-3">Batch</th><th className="p-3">Date</th><th className="p-3">Product</th><th className="p-3">Pieces</th><th className="p-3">Batch cost</th></tr></thead><tbody>{batches.map(b=><tr key={b.id} className="border-b border-stone-100"><td className="p-3">#{b.id}</td><td className="p-3">{b.produced_on}</td><td className="p-3">{products.find(p=>p.id===b.product_id)?.name_en??`Product #${b.product_id}`}</td><td className="p-3">{b.quantity}</td><td className="p-3">{money(b.material_cost_total+b.extra_cost_total)}</td></tr>)}</tbody></table>{!batches.length&&<p className="p-5 text-center text-stone-500">No production recorded yet / لا توجد عمليات تصنيع</p>}</div></section>
  </div>
 </main>;
}
