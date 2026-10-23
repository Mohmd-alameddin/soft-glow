'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteExpense, saveExpense } from './actions';

export type SaleRow = { id:number; sold_on:string; product_name:string; quantity:number; unit_sale_price:number; unit_material_cost:number; discount_total:number };
export type PurchaseRow = { id:number; purchased_on:string; material_id:number; quantity:number; total_cost:number; supplier:string };
export type ExpenseRow = { id:number; spent_on:string; category:string; description:string; amount:number; notes:string };

const categories = ['electricity','gas','delivery','rent','marketing','subscriptions','transport','maintenance','other'];
const categoryLabels:Record<string,string> = {
 electricity:'Electricity / كهرباء', gas:'Gas / غاز', delivery:'Delivery / توصيل',
 rent:'Rent / إيجار', marketing:'Marketing / تسويق', subscriptions:'Subscriptions / اشتراكات',
 transport:'Transport / نقل', maintenance:'Maintenance / صيانة', other:'Other / أخرى'
};
const money = (n:number) => '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const monthNow = () => new Date().toLocaleDateString('en-CA',{year:'numeric',month:'2-digit'}).slice(0,7);
const blank = ():Omit<ExpenseRow,'id'> => ({spent_on:new Date().toLocaleDateString('en-CA'),category:'other',description:'',amount:0,notes:''});

export default function FinanceManager({sales,purchases,initialExpenses}:{sales:SaleRow[];purchases:PurchaseRow[];initialExpenses:ExpenseRow[]}) {
 const [month,setMonth] = useState(monthNow);
 const [expenses,setExpenses] = useState(initialExpenses);
 const [form,setForm] = useState<(Omit<ExpenseRow,'id'> & {id?:number}) | null>(null);
 const [error,setError] = useState('');
 const [busy,startTransition] = useTransition();
 const inMonth = (d:string) => d.slice(0,7)===month;
 const monthlySales = useMemo(()=>sales.filter(s=>inMonth(s.sold_on)),[sales,month]);
 const monthlyPurchases = useMemo(()=>purchases.filter(p=>inMonth(p.purchased_on)),[purchases,month]);
 const monthlyExpenses = useMemo(()=>expenses.filter(e=>inMonth(e.spent_on)).sort((a,b)=>b.spent_on.localeCompare(a.spent_on)||b.id-a.id),[expenses,month]);
 const revenue = monthlySales.reduce((a,s)=>a+s.quantity*s.unit_sale_price-s.discount_total,0);
 const cogs = monthlySales.reduce((a,s)=>a+s.quantity*s.unit_material_cost,0);
 const grossProfit = revenue-cogs;
 const purchasesTotal = monthlyPurchases.reduce((a,p)=>a+p.total_cost,0);
 const operatingTotal = monthlyExpenses.reduce((a,e)=>a+e.amount,0);
 const operatingResult = grossProfit-operatingTotal;
 const months = useMemo(()=>{
   const found = new Set([month,monthNow()]);
   sales.forEach(x=>found.add(x.sold_on.slice(0,7)));
   purchases.forEach(x=>found.add(x.purchased_on.slice(0,7)));
   expenses.forEach(x=>found.add(x.spent_on.slice(0,7)));
   return Array.from(found).filter(x=>/^\d{4}-\d{2}$/.test(x)).sort();
 },[sales,purchases,expenses,month]);
 const chartMonths = months.slice(-6);
 const chartValues = chartMonths.map(m=>sales.filter(s=>s.sold_on.startsWith(m)).reduce((a,s)=>a+s.quantity*s.unit_sale_price-s.discount_total,0));
 const maxChart = Math.max(1,...chartValues);
 const card = 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm';
 const input = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-amber-600';
 const submit = () => {
   if (!form) return;
   setError('');
   startTransition(async()=>{
     try {
       await saveExpense(form);
       // Refresh only expense rows via a full server navigation, ensuring server-authoritative RLS data.
       window.location.reload();
     } catch(e) { setError(e instanceof Error?e.message:String(e)); }
   });
 };
 const remove = (id:number) => {
   if (!window.confirm('Delete this expense? / حذف هذا المصروف؟')) return;
   setError('');
   startTransition(async()=>{
     try { await deleteExpense(id); setExpenses(prev=>prev.filter(e=>e.id!==id)); }
     catch(e) { setError(e instanceof Error?e.message:String(e)); }
   });
 };
 return <main className="min-h-screen bg-[#faf7f2] px-4 py-8 text-stone-800 sm:px-8">
   <div className="mx-auto max-w-6xl space-y-6">
     <div className="flex flex-wrap items-start justify-between gap-4">
       <div>
         <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Soft Glow · Admin</p>
         <h1 className="mt-2 text-3xl font-semibold text-stone-900">Financial Dashboard</h1>
         <p className="mt-1 text-sm text-stone-600">لوحة التحكم المالية · جميع المبالغ بالدولار الأمريكي</p>
       </div>
       <div className="flex flex-wrap items-center gap-2">
         <label htmlFor="month" className="text-sm">Month / الشهر</label>
         <input id="month" type="month" className={input} value={month} onChange={e=>setMonth(e.target.value)}/>
       </div>
     </div>
     <nav className="flex flex-wrap gap-2 text-sm">
       {[['Products','/admin/products'],['Materials','/admin/materials'],['Purchases','/admin/purchases'],['Costing','/admin/costing'],['Sales','/admin/sales']].map(([name,href])=>
         <Link key={href} href={href} className="rounded-full border border-stone-300 bg-white px-4 py-2 hover:bg-amber-50">{name}</Link>
       )}
     </nav>
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       {[
         ['Sales revenue / المبيعات',revenue],
         ['Material cost of sold goods / تكلفة المواد المباعة',cogs],
         ['Gross profit / الربح الإجمالي',grossProfit],
         ['Raw material purchases / مشتريات المواد',purchasesTotal],
         ['Operating expenses / مصاريف التشغيل',operatingTotal],
         ['Result after operating expenses / النتيجة بعد المصاريف',operatingResult],
       ].map(([label,value])=><div className={card} key={String(label)}>
         <p className="text-sm text-stone-600">{label}</p>
         <p className={'mt-3 text-3xl font-semibold '+(Number(value)<0?'text-red-700':'text-stone-900')}>{money(Number(value))}</p>
       </div>)}
     </div>
     <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
       <strong>Important / مهم:</strong> Purchases are cash spent on stock, not an additional deduction from gross profit.
       The result after operating expenses = sales − saved material cost of sold items − operating expenses.
       It is <strong>not</strong> full accounting net profit: it excludes labor, taxes, depreciation, inventory adjustments and any unrecorded costs.
       <span className="block" dir="rtl">المشتريات لا تُخصم مرة ثانية من الربح؛ النتيجة ليست ربحاً صافياً محاسبياً شاملاً.</span>
     </div>
     <section className={card}>
       <h2 className="text-lg font-semibold">Sales trend / اتجاه المبيعات</h2>
       <div className="mt-5 flex h-48 items-end gap-3">
         {chartMonths.map((m,i)=><div key={m} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
           <span className="text-xs text-stone-600">{money(chartValues[i])}</span>
           <div className="w-full max-w-24 rounded-t-lg bg-amber-700" style={{height:`${Math.max(2,chartValues[i]/maxChart*140)}px`}}/>
           <span className="text-xs text-stone-600">{m.slice(2)}</span>
         </div>)}
       </div>
     </section>
     <section className={card}>
       <div className="flex flex-wrap items-center justify-between gap-3">
         <div><h2 className="text-lg font-semibold">Operating expenses / المصاريف التشغيلية</h2><p className="text-sm text-stone-600">{monthlyExpenses.length} expenses in {month}</p></div>
         <button className="rounded-xl bg-amber-800 px-4 py-2 font-medium text-white hover:bg-amber-900" onClick={()=>{setForm({...blank(),spent_on:month===monthNow()?blank().spent_on:month+'-01'});setError('');}}>+ Add Expense / إضافة مصروف</button>
       </div>
       {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
       {form && <div className="mt-5 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
         <h3 className="font-semibold">{form.id?'Edit expense / تعديل المصروف':'New expense / مصروف جديد'}</h3>
         <div className="grid gap-3 sm:grid-cols-2">
           <label className="space-y-1 text-sm">Date / التاريخ<input className={input} type="date" value={form.spent_on} onChange={e=>setForm({...form,spent_on:e.target.value})}/></label>
           <label className="space-y-1 text-sm">Category / الفئة<select className={input} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c} value={c}>{categoryLabels[c]}</option>)}</select></label>
           <label className="space-y-1 text-sm">Description / الوصف<input className={input} value={form.description} maxLength={250} onChange={e=>setForm({...form,description:e.target.value})}/></label>
           <label className="space-y-1 text-sm">Amount (USD) / المبلغ<input className={input} type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})}/></label>
         </div>
         <label className="block space-y-1 text-sm">Notes / ملاحظات<textarea className={input} rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
         <div className="flex gap-2">
           <button disabled={busy||!form.description.trim()||!form.spent_on} onClick={submit} className="rounded-xl bg-amber-800 px-4 py-2 text-white disabled:opacity-50">{busy?'Saving...':'Save / حفظ'}</button>
           <button disabled={busy} onClick={()=>setForm(null)} className="rounded-xl border border-stone-300 bg-white px-4 py-2">Cancel / إلغاء</button>
         </div>
       </div>}
       <div className="mt-5 overflow-x-auto">
         <table className="w-full min-w-[640px] text-left text-sm">
           <thead><tr className="border-b border-stone-200 text-stone-500"><th className="p-3">Date</th><th className="p-3">Category</th><th className="p-3">Description</th><th className="p-3">Amount</th><th className="p-3">Actions</th></tr></thead>
           <tbody>{monthlyExpenses.map(e=><tr key={e.id} className="border-b border-stone-100">
             <td className="p-3">{e.spent_on}</td><td className="p-3">{categoryLabels[e.category]||e.category}</td>
             <td className="p-3">{e.description}{e.notes&&<p className="text-xs text-stone-500">{e.notes}</p>}</td>
             <td className="p-3 font-medium">{money(e.amount)}</td>
             <td className="p-3"><div className="flex gap-3"><button className="text-amber-800 underline" onClick={()=>{setForm({...e});setError('');}}>Edit</button><button disabled={busy} className="text-red-700 underline" onClick={()=>remove(e.id)}>Delete</button></div></td>
           </tr>)}</tbody>
         </table>
         {monthlyExpenses.length===0&&<p className="py-6 text-center text-sm text-stone-500">No expenses this month / لا توجد مصاريف لهذا الشهر</p>}
       </div>
     </section>
     <section className={card}>
       <h2 className="text-lg font-semibold">Monthly activity / النشاط الشهري</h2>
       <p className="mt-2 text-sm text-stone-600">Sales transactions: {monthlySales.length} · Purchased material entries: {monthlyPurchases.length} · Sold units: {monthlySales.reduce((a,s)=>a+s.quantity,0)}</p>
       <p className="mt-2 text-sm text-stone-600">To add or edit sales and purchases, use their dedicated pages above.</p>
     </section>
   </div>
 </main>;
}
