'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Star } from 'lucide-react';
type Review={id:number;customer_name:string;rating:number;comment:string;product_id:number|null;created_at:string};
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
export default function ReviewsShowcase({lang='en',productId}:{lang?:'en'|'ar';productId?:number}){
 const [reviews,setReviews]=useState<Review[]>([]);
 const [total,setTotal]=useState<number|null>(null);
 const [average,setAverage]=useState<number|null>(null);
 useEffect(()=>{
  let live=true;
  async function load(){
   // Pagination ensures the average is based on all approved reviews, not just the first few.
   const all:Review[]=[];
   for(let from=0;from<10000;from+=1000){
    let query=supabase.from('customer_reviews').select('id,customer_name,rating,comment,product_id,created_at').eq('status','approved').order('created_at',{ascending:false}).range(from,from+999);
    if(productId!==undefined) query=query.eq('product_id',productId);
    const {data,error}=await query;
    if(error||!data) return;
    all.push(...data.map(r=>({...r,id:Number(r.id),rating:Number(r.rating)})));
    if(data.length<1000) break;
   }
   if(live){setReviews(all.slice(0,6));setTotal(all.length);setAverage(all.length?all.reduce((n,r)=>n+r.rating,0)/all.length:null);}
  }
  void load();
  return()=>{live=false;};
 },[productId]);
 const ar=lang==='ar';
 return <section dir={ar?'rtl':'ltr'} className="bg-[#f3eae1] px-5 py-16 text-[#5d4133]" aria-label={ar?'آراء العملاء':'Customer reviews'}>
  <div className="mx-auto max-w-7xl">
   <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs uppercase tracking-[.25em] text-[#a97b61]">SOFT GLOW · REVIEWS</p><h2 className="serif text-4xl">{ar?'تجارب عملائنا':'Words from our customers'}</h2>{total!==null&&<p className="mt-3 text-sm text-[#826b5d]">{total?`${average?.toFixed(1)} / 5 · ${total} ${ar?'تقييم منشور':'published reviews'}`:(ar?'لا توجد تقييمات منشورة بعد':'No published reviews yet')}</p>}</div><Link href="/reviews" className="rounded-full border border-[#5d4133] px-5 py-3 text-sm transition hover:bg-[#5d4133] hover:text-white">{ar?'شاركنا رأيك':'Leave a review'}</Link></div>
   {reviews.length>0&&<div className="grid gap-4 md:grid-cols-3">{reviews.map(r=><article key={r.id} className="rounded-2xl border border-[#eadbd0] bg-white p-6 shadow-sm"><div className="mb-3 flex gap-1" aria-label={`${r.rating} out of 5 stars`}>{[1,2,3,4,5].map(n=><Star key={n} size={16} color="#c49356" fill={n<=r.rating?'#c49356':'none'}/>)}</div><p className="mb-4 line-clamp-5 whitespace-pre-wrap break-words text-sm leading-7">{r.comment}</p><p className="text-sm font-semibold">{r.customer_name}</p></article>)}</div>}
  </div>
 </section>;
}
