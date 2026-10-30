'use client';
import { useState } from 'react';
import { updateShopOrder } from './actions';

type OrderItem = {id:number;product_id:number;product_name:string;quantity:number;unit_price:number;line_total:number;options:unknown};
type Order = {id:number;reference:string;created_at:string;customer_name:string;phone:string;governorate:string;city:string;address:string;delivery_notes:string;payment_method:string;payment_status:string;order_status:string;currency:string;subtotal:number;delivery_fee:number|null;notes_admin:string;paid_at:string|null;shop_order_items:OrderItem[]};
const payments=['pending','paid','failed','refunded'];
const statuses=['new','confirmed','preparing','delivered','cancelled'];
export default function OrdersManager({orders}:{orders:Order[]}) {
 const [filter,setFilter]=useState('all');
 const filtered=orders.filter(o=>filter==='all'||o.payment_status===filter);
 return <main className="mx-auto max-w-6xl px-4 py-10 text-[#513e33]">
   <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold">Customer Orders</h1><p className="mt-1 text-sm text-[#8c7568]">Manual Whish verification & Cash on Delivery. Showing latest 300 orders.</p></div><a className="underline" href="/admin">Admin home</a></div>
   <div className="mb-6 flex flex-wrap gap-2">{['all',...payments].map(s=><button key={s} type="button" onClick={()=>setFilter(s)} className={'rounded-full border px-4 py-2 text-sm capitalize '+(filter===s?'bg-[#513e33] text-white':'bg-white')}>{s} ({s==='all'?orders.length:orders.filter(o=>o.payment_status===s).length})</button>)}</div>
   <div className="space-y-5">{filtered.length===0&&<p>No matching orders.</p>}{filtered.map(o=><article key={o.id} className="rounded-2xl border border-[#e8d9cc] bg-white p-5 shadow-sm">
     <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-semibold">{o.reference}</h2><p className="text-xs text-[#8c7568]">{new Date(o.created_at).toLocaleString()}</p></div><div className="text-sm"><strong>{o.payment_method==='whish'?'Whish Money':'Cash on Delivery'}</strong> · <span className="capitalize">{o.payment_status}</span></div></div>
     <div className="mt-4 grid gap-4 text-sm md:grid-cols-2"><div><p><b>Customer:</b> {o.customer_name}</p><p><b>Phone:</b> <a className="underline" href={'tel:'+o.phone}>{o.phone}</a></p><p><b>Delivery:</b> {o.governorate}, {o.city}, {o.address}</p>{o.delivery_notes&&<p><b>Notes:</b> {o.delivery_notes}</p>}</div><div>{o.shop_order_items.map(i=><div key={i.id} className="mb-2 border-b pb-2"><p>{i.product_name} × {i.quantity} — ${i.line_total.toFixed(2)}</p><p className="text-xs text-[#8c7568]">Options: {JSON.stringify(i.options)}</p></div>)}<p><b>Subtotal:</b> ${o.subtotal.toFixed(2)} USD</p><p><b>Delivery:</b> {o.delivery_fee===null?'Not confirmed':'$'+o.delivery_fee.toFixed(2)}</p><p><b>Final total:</b> {o.delivery_fee===null?'Confirm delivery fee first':'$'+(o.subtotal+o.delivery_fee).toFixed(2)}</p></div></div>
     <form action={updateShopOrder} className="mt-5 grid gap-3 border-t pt-4 md:grid-cols-4" onSubmit={e=>{const form=e.currentTarget;const next=(new FormData(form)).get('payment_status');if(next==='paid'&&o.payment_status!=='paid'&&!window.confirm('Have you verified the actual payment in Whish or received cash?'))e.preventDefault();}}>
       <input type="hidden" name="id" value={o.id}/>
       <label className="text-sm">Payment status<select name="payment_status" defaultValue={o.payment_status} className="mt-1 block w-full rounded-lg border p-2">{payments.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
       <label className="text-sm">Order status<select name="order_status" defaultValue={o.order_status} className="mt-1 block w-full rounded-lg border p-2">{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
       <label className="text-sm">Delivery fee (USD)<input type="number" min="0" step="0.01" name="delivery_fee" defaultValue={o.delivery_fee??''} placeholder="Not confirmed" className="mt-1 block w-full rounded-lg border p-2" /></label>
       <label className="text-sm">Private admin notes<input name="notes_admin" maxLength={2000} defaultValue={o.notes_admin} className="mt-1 block w-full rounded-lg border p-2" /></label>
       <button type="submit" className="rounded-full bg-[#513e33] px-5 py-3 text-white md:col-span-4">Save order updates</button>
     </form>
   </article>)}</div>
 </main>;
}
