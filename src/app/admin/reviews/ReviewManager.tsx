'use client';
import { useState, useTransition } from 'react';
import { createReviewInvitation, setReviewStatus, deleteReview } from './actions';
type Review={id:number;customer_name:string;rating:number;comment:string;product_id:number|null;source:string;verified_purchase:boolean;status:string;created_at:string};
type Product={id:number;name_en:string;name_ar:string};
export default function ReviewManager({reviews,products}:{reviews:Review[];products:Product[]}){
 const [token,setToken]=useState('');
 const [error,setError]=useState('');
 const [pending,startTransition]=useTransition();
 const [filter,setFilter]=useState('pending');
 const [origin,setOrigin]=useState('');
 const shown=reviews.filter(r=>filter==='all'||r.status===filter);
 const base=origin || (typeof window!=='undefined'?window.location.origin:'');
 const inviteUrl=token?`${base}/reviews?token=${encodeURIComponent(token)}`:'';
 const field='rounded-xl border border-[#e9ded3] bg-white px-3 py-2 text-sm';
 return <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 text-[#5d4133]">
 <div><h1 className="serif text-4xl">Customer Reviews / تقييمات العملاء</h1><p className="mt-2 text-sm text-[#8c786a]">Approve honest reviews, including constructive criticism. Invitation links are one-time use.</p></div>
 <section className="rounded-2xl border bg-white p-5">
  <h2 className="mb-4 text-xl font-semibold">Create private review invitation</h2>
  <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();setError('');const form=new FormData(e.currentTarget);startTransition(async()=>{try{const result=await createReviewInvitation(form);setToken(result);setOrigin(window.location.origin);}catch(err){setError(err instanceof Error?err.message:'Could not create invitation');}});}}>
   <label className="flex flex-col gap-1 text-sm">Customer reference (private)<input className={field} name="customer_label" maxLength={100} placeholder="Order # / name"/></label>
   <label className="flex flex-col gap-1 text-sm">Product<select className={field} name="product_id"><option value="">General store review</option>{products.map(p=><option key={p.id} value={p.id}>{p.name_en}</option>)}</select></label>
   <button type="submit" disabled={pending} className="rounded-full bg-[#5d4133] px-5 py-3 text-sm text-white disabled:opacity-50">{pending?'Creating...':'Create invitation'}</button>
  </form>
  {inviteUrl&&<div className="mt-4 rounded-xl bg-[#f7eee6] p-4"><p className="mb-2 text-sm">Copy this link now. It is shown only after creation:</p><div className="flex flex-wrap items-center gap-2"><input readOnly aria-label="Review invitation link" className={`${field} min-w-0 flex-1`} value={inviteUrl}/><button className="rounded-full border px-4 py-2 text-sm" type="button" onClick={()=>navigator.clipboard.writeText(inviteUrl)}>Copy</button></div></div>}
  {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
 </section>
 <section className="space-y-4">
  <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Reviews ({shown.length})</h2><select className={field} value={filter} onChange={e=>setFilter(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option></select></div>
  {shown.length===0&&<p className="rounded-xl bg-white p-6 text-sm">No reviews in this category.</p>}
  {shown.map(r=><article key={r.id} className="rounded-2xl border bg-white p-5">
   <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><strong>{r.customer_name}</strong><span className="text-sm text-[#a97b61]">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span></div>
   <p className="mb-3 whitespace-pre-wrap break-words text-sm">{r.comment}</p>
   <p className="mb-4 text-xs text-[#8c786a]">{r.product_id?products.find(p=>p.id===r.product_id)?.name_en??`Product ${r.product_id}`:'Shop review'} · {r.verified_purchase?'Invitation review':'Public review'} · {new Date(r.created_at).toLocaleDateString()} · {r.status}</p>
   <div className="flex flex-wrap gap-2">{(['approved','rejected','pending'] as const).filter(status=>status!==r.status).map(status=><form key={status} action={setReviewStatus}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="status" value={status}/><button type="submit" className="rounded-full border px-4 py-2 text-xs hover:bg-[#f8eee5]">{status==='approved'?'Approve':status==='rejected'?'Hide':'Move to pending'}</button></form>)}<form action={deleteReview} onSubmit={e=>{if(!window.confirm('Permanently delete this review? This cannot be undone.')) e.preventDefault();}}><input type="hidden" name="id" value={r.id}/><button type="submit" className="rounded-full border border-red-300 px-4 py-2 text-xs text-red-700 hover:bg-red-50">Delete permanently</button></form></div>
  </article>)}
 </section>
 </main>;
}
