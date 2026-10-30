'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { CheckCircle2, Clock3, RefreshCw, AlertCircle } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
type Tracking = {reference:string;created_at:string;payment_method:'whish'|'cod';payment_status:'pending'|'paid'|'failed'|'refunded';order_status:'new'|'confirmed'|'preparing'|'delivered'|'cancelled';currency:string;subtotal:number;delivery_fee:number|null;paid_at:string|null};
const labels:Record<string,string> = {pending:'Awaiting payment confirmation',paid:'Payment confirmed',failed:'Payment unsuccessful',refunded:'Payment refunded',new:'Order received',confirmed:'Order confirmed',preparing:'Preparing your order',delivered:'Delivered',cancelled:'Cancelled'};
export default function OrderTrackingPage(){
 const [token,setToken]=useState('');
 const [order,setOrder]=useState<Tracking|null>(null);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [lang,setLang]=useState<'en'|'ar'>('en');
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  setToken(params.get('token')||'');
  setLang(localStorage.getItem('softglow-lang')==='ar'?'ar':'en');
 },[]);
 const load=useCallback(async()=>{
  if(!token){setBusy(false);setError('Missing private tracking link.');return;}
  setBusy(true);setError('');
  const {data,error:queryError}=await supabase.rpc('get_softglow_order_tracking',{p_token:token});
  if(queryError){setError('Unable to check the order right now. Please try again.');setOrder(null);}
  else if(!data){setError('Tracking link not found. Check that you copied the full link.');setOrder(null);}
  else setOrder(data as Tracking);
  setBusy(false);
 },[token]);
 useEffect(()=>{if(token) void load();else if(typeof window!=='undefined')setBusy(false);},[token,load]);
 const ar=lang==='ar';
 return <main dir={ar?'rtl':'ltr'} lang={lang} className="min-h-screen bg-[#fbf7f2] px-4 py-12 text-[#5d4133]">
  <div className="mx-auto max-w-xl rounded-3xl border border-[#e8d9cc] bg-white p-6 shadow-sm sm:p-9">
   <div className="flex items-center justify-between gap-3"><Link href="/" className="text-2xl font-semibold">Soft <span className="italic text-[#ad7d62]">Glow</span></Link><button className="rounded-full border px-3 py-1 text-sm" onClick={()=>setLang(ar?'en':'ar')}>{ar?'English':'العربية'}</button></div>
   <h1 className="mt-8 text-2xl font-semibold">{ar?'متابعة الطلب':'Track your order'}</h1>
   <p className="mt-1 text-sm text-[#88766b]">{ar?'يمكنك تحديث الصفحة لمعرفة حالة الدفع والطلب.':'Check your payment and order status at any time.'}</p>
   {busy&&<p role="status" className="mt-7">{ar?'جارٍ التحميل...':'Checking your order...'}</p>}
   {!busy&&error&&<div role="alert" className="mt-7 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-red-800"><AlertCircle className="shrink-0" size={20}/>{error}</div>}
   {!busy&&order&&<div className="mt-7 space-y-5">
    <div className="rounded-xl bg-[#faf4ed] p-4"><p className="text-xs uppercase tracking-wide text-[#8d7566]">{ar?'رقم الطلب':'Order reference'}</p><p className="mt-1 text-xl font-semibold">{order.reference}</p></div>
    <section className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-[#8d7566]">{ar?'حالة الدفع':'Payment status'}</p><div className="mt-3 flex items-start gap-3">{order.payment_status==='paid'?<CheckCircle2 className="shrink-0 text-green-700"/>:<Clock3 className="shrink-0 text-amber-700"/>}<div><p className="font-semibold">{ar?({pending:'بانتظار تأكيد الدفع',paid:'تم تأكيد الدفع',failed:'تعذّر الدفع',refunded:'تم ردّ المبلغ'}[order.payment_status]):labels[order.payment_status]}</p><p className="mt-1 text-sm text-[#8d7566]">{order.payment_status==='pending'?(ar?'سيتم تحديث الحالة بعد أن نتحقق من استلام المبلغ.':'We will update this once we verify the payment.'):(order.payment_status==='paid'?(ar?'تم التحقق من استلام الدفعة.':'We have verified your payment.'):null)}</p></div></div></section>
    <section className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-[#8d7566]">{ar?'حالة الطلب':'Order status'}</p><p className="mt-2 font-semibold">{labels[order.order_status]}</p></section>
    <div className="space-y-2 text-sm"><div className="flex justify-between gap-3"><span>{ar?'طريقة الدفع':'Payment method'}</span><strong>{order.payment_method==='whish'?'Whish Money':'Cash on Delivery'}</strong></div><div className="flex justify-between gap-3"><span>{ar?'مجموع المنتجات':'Items subtotal'}</span><strong>${Number(order.subtotal).toFixed(2)}</strong></div><div className="flex justify-between gap-3"><span>{ar?'التوصيل':'Delivery fee'}</span><strong>{order.delivery_fee===null?(ar?'لم يحدد بعد':'Not confirmed'):`$${Number(order.delivery_fee).toFixed(2)}`}</strong></div>{order.delivery_fee!==null&&<div className="flex justify-between gap-3 border-t pt-2"><span>{ar?'المجموع':'Total'}</span><strong>${(Number(order.subtotal)+Number(order.delivery_fee)).toFixed(2)} {order.currency}</strong></div>}</div>
    <p className="text-xs text-[#8d7566]">{ar?'احتفظ بهذا الرابط بشكل خاص؛ أي شخص يملكه يمكنه مشاهدة حالة الطلب.':'Keep this link private. Anyone with the link can see the order status.'}</p>
   </div>}
   <button type="button" disabled={busy||!token} onClick={()=>void load()} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#5d4133] px-4 py-3 font-semibold text-white disabled:opacity-50"><RefreshCw size={17}/>{ar?'تحديث الحالة':'Refresh status'}</button>
   <Link className="mt-5 block text-center text-sm underline" href="/">{ar?'العودة للمتجر':'Back to shop'}</Link>
  </div>
 </main>;
}
