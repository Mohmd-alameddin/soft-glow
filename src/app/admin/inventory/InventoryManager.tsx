'use client';
import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { addStockMovement, deleteStockMovement, saveStockSettings } from './actions';

export type Material={id:number;name:string;unit:'g'|'ml'|'piece';category:string};
export type Purchase={material_id:number;quantity:number};
export type StockSettings={material_id:number;opening_quantity:number;low_stock_threshold:number};
export type Movement={id:number;material_id:number;moved_on:string;movement_type:'consumption'|'adjustment';quantity_change:number;notes:string};
const num=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:3});
const today=()=>new Date().toLocaleDateString('en-CA');
export default function InventoryManager({materials,purchases,settings,movements}:{materials:Material[];purchases:Purchase[];settings:StockSettings[];movements:Movement[]}) {
 const [search,setSearch]=useState('');
 const [selected,setSelected]=useState(materials[0]?.id??0);
 const [opening,setOpening]=useState('0');
 const [threshold,setThreshold]=useState('0');
 const [kind,setKind]=useState<'consumption'|'adjustment'>('consumption');
 const [amount,setAmount]=useState('');
 const [date,setDate]=useState(today);
 const [notes,setNotes]=useState('');
 const [error,setError]=useState('');
 const [busy,start]=useTransition();
 const [history,setHistory]=useState(movements);
 const [stockSettings,setStockSettings]=useState(settings);
 const purchaseTotals=useMemo(()=>{const map=new Map<number,number>();purchases.forEach(p=>map.set(p.material_id,(map.get(p.material_id)??0)+p.quantity));return map;},[purchases]);
 const movementTotals=useMemo(()=>{const map=new Map<number,number>();history.forEach(m=>map.set(m.material_id,(map.get(m.material_id)??0)+m.quantity_change));return map;},[history]);
 const rows=materials.map(m=>{const s=stockSettings.find(x=>x.material_id===m.id);const purchased=purchaseTotals.get(m.id)??0;const movement=movementTotals.get(m.id)??0;const opening=s?.opening_quantity??0;const balance=opening+purchased+movement;const limit=s?.low_stock_threshold??0;return {...m,opening,purchased,movement,balance,limit,low:balance<=limit};});
 const active=rows.find(r=>r.id===selected);
 const shown=rows.filter(r=>(r.name+' '+r.category).toLowerCase().includes(search.toLowerCase()));
 const lowCount=rows.filter(r=>r.low).length;
 const selectMaterial=(id:number)=>{setSelected(id);const s=stockSettings.find(x=>x.material_id===id);setOpening(String(s?.opening_quantity??0));setThreshold(String(s?.low_stock_threshold??0));setError('');};
 const run=(task:()=>Promise<void>)=>{setError('');start(async()=>{try{await task();window.location.reload();}catch(e){setError(e instanceof Error?e.message:String(e));}});};
 const saveSettings=()=>run(()=>saveStockSettings(selected,Number(opening),Number(threshold)));
 const saveMovement=()=>{
  const qty=Number(amount);
  if(!Number.isFinite(qty)||qty<=0){setError('Enter a positive quantity');return;}
  run(()=>addStockMovement({material_id:selected,moved_on:date,movement_type:kind,quantity_change:kind==='consumption'?-qty:qty*(notes.trim().startsWith('-')?-1:1),notes}));
 };
 const remove=(id:number)=>{if(!window.confirm('Delete stock movement? / حذف الحركة؟'))return;run(async()=>{await deleteStockMovement(id);setHistory(old=>old.filter(x=>x.id!==id));});};
 const input='w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-700 focus:outline-none';
 return <main className="min-h-screen bg-[#faf7f2] px-4 py-8 text-stone-800 sm:px-8"><div className="mx-auto max-w-6xl space-y-6">
  <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-800">Soft Glow · Admin</p><h1 className="mt-2 text-3xl font-semibold">Inventory / إدارة المخزون</h1><p className="mt-1 text-sm text-stone-600">Stock balances are calculated from purchases, opening balances and manual movements.</p></div>
  <nav className="flex flex-wrap gap-2 text-sm">{[['Finance','/admin/finance'],['Purchases','/admin/purchases'],['Materials','/admin/materials'],['Costing','/admin/costing'],['Sales','/admin/sales']].map(([t,h])=><Link key={h} href={h} className="rounded-full border border-stone-300 bg-white px-4 py-2">{t}</Link>)}</nav>
  <div className="grid gap-3 sm:grid-cols-3">{[['Materials / المواد',String(rows.length)],['Low stock / مخزون منخفض',String(lowCount)],['Recorded movements / الحركات',String(history.length)]].map(([label,value])=><div key={label} className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">Important: Existing purchases are included automatically. Set an opening quantity only for stock you had <strong>before</strong> your recorded purchases. Do not enter already-recorded purchases again. Sales and recipes do not automatically deduct stock yet.<span className="block" dir="rtl">المشتريات المسجلة محسوبة تلقائياً. أدخل رصيداً افتتاحياً فقط للمخزون الموجود قبل المشتريات المسجلة، ولا تسجله مرتين. المبيعات لا تخصم المخزون تلقائياً حالياً.</span></div>
  {error&&<div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  <section className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Material balances / أرصدة المواد</h2><input className={input+' max-w-sm'} placeholder="Search materials / بحث" value={search} onChange={e=>setSearch(e.target.value)}/></div>
   <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="p-3">Material</th><th className="p-3">Opening</th><th className="p-3">Purchases</th><th className="p-3">Movements</th><th className="p-3">Available</th><th className="p-3">Status</th></tr></thead><tbody>{shown.map(r=><tr key={r.id} className="border-b border-stone-100"><td className="p-3"><button className="font-medium text-amber-800 underline" onClick={()=>selectMaterial(r.id)}>{r.name}</button><span className="ml-2 text-stone-500">({r.unit})</span></td><td className="p-3">{num(r.opening)}</td><td className="p-3">{num(r.purchased)}</td><td className="p-3">{num(r.movement)}</td><td className="p-3 font-semibold">{num(r.balance)} {r.unit}</td><td className="p-3">{r.low?<span className="font-semibold text-red-700">Low / منخفض</span>:<span className="text-green-800">OK</span>}</td></tr>)}</tbody></table>{shown.length===0&&<p className="p-5 text-center text-sm text-stone-500">No matching materials.</p>}</div>
  </section>
  <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="text-lg font-semibold">Stock settings / إعدادات المخزون</h2><p className="mt-1 text-sm text-stone-500">Opening balance and low-stock alert threshold.</p><label className="mt-4 block text-sm">Material / المادة<select className={input+' mt-1'} value={selected} onChange={e=>selectMaterial(Number(e.target.value))}>{materials.map(m=><option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select></label><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm">Opening quantity<input type="number" step="0.001" className={input+' mt-1'} value={opening} onChange={e=>setOpening(e.target.value)}/></label><label className="text-sm">Low stock threshold<input type="number" min="0" step="0.001" className={input+' mt-1'} value={threshold} onChange={e=>setThreshold(e.target.value)}/></label></div><button disabled={busy||!selected} onClick={saveSettings} className="mt-4 rounded-xl bg-amber-800 px-4 py-2 text-white disabled:opacity-50">Save settings / حفظ</button>{active&&<p className="mt-3 text-sm text-stone-500">Current available: {num(active.balance)} {active.unit}</p>}</div>
  <div className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="text-lg font-semibold">New movement / حركة جديدة</h2><p className="mt-1 text-sm text-stone-500">Consumption subtracts stock. Adjustment can add or subtract.</p><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm">Type<select className={input+' mt-1'} value={kind} onChange={e=>setKind(e.target.value as 'consumption'|'adjustment')}><option value="consumption">Consumption / استهلاك (-)</option><option value="adjustment">Adjustment / تعديل (+/-)</option></select></label><label className="text-sm">Date<input type="date" className={input+' mt-1'} value={date} onChange={e=>setDate(e.target.value)}/></label><label className="text-sm">Quantity ({active?.unit??''})<input type="number" min="0.001" step="0.001" className={input+' mt-1'} value={amount} onChange={e=>setAmount(e.target.value)}/></label><label className="text-sm">Adjustment direction<select className={input+' mt-1'} disabled={kind!=='adjustment'} value={notes.trim().startsWith('-')?'-':'+'} onChange={e=>setNotes(old=>e.target.value==='-'?'- '+old.replace(/^[-+]\s*/, ''):old.replace(/^[-+]\s*/, ''))}><option value="+">Add (+)</option><option value="-">Subtract (-)</option></select></label></div><label className="mt-3 block text-sm">Notes / ملاحظات<textarea className={input+' mt-1'} rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/></label><button disabled={busy||!selected} onClick={saveMovement} className="mt-4 rounded-xl bg-amber-800 px-4 py-2 text-white disabled:opacity-50">Record movement / تسجيل</button></div></section>
  <section className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="text-lg font-semibold">Movement history / سجل الحركات</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="p-3">Date</th><th className="p-3">Material</th><th className="p-3">Type</th><th className="p-3">Change</th><th className="p-3">Notes</th><th className="p-3">Action</th></tr></thead><tbody>{history.slice(0,100).map(m=><tr key={m.id} className="border-b border-stone-100"><td className="p-3">{m.moved_on}</td><td className="p-3">{materials.find(x=>x.id===m.material_id)?.name??m.material_id}</td><td className="p-3">{m.movement_type}</td><td className="p-3 font-medium">{m.quantity_change>0?'+':''}{num(m.quantity_change)}</td><td className="p-3">{m.notes}</td><td className="p-3"><button disabled={busy} onClick={()=>remove(m.id)} className="text-red-700 underline">Delete</button></td></tr>)}</tbody></table>{history.length===0&&<p className="p-5 text-center text-sm text-stone-500">No stock movements yet.</p>}</div></section>
 </div></main>;
}
