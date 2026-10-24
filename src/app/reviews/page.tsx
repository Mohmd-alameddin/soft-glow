'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Star, ArrowLeft, CheckCircle2 } from 'lucide-react';

type ProductChoice = { id: number; en: string; ar: string };
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
export default function ReviewsPage() {
 const [lang,setLang] = useState<'en'|'ar'>('en');
 const [products,setProducts] = useState<ProductChoice[]>([]);
 const [token,setToken] = useState('');
 const [productId,setProductId] = useState('');
 const [name,setName] = useState('');
 const [rating,setRating] = useState(5);
 const [comment,setComment] = useState('');
 const [website,setWebsite] = useState('');
 const [busy,setBusy] = useState(false);
 const [done,setDone] = useState(false);
 const [error,setError] = useState('');
 useEffect(()=>{
   const langSaved=localStorage.getItem('softglow-lang');
   if(langSaved==='ar') setLang('ar');
   const params=new URLSearchParams(window.location.search);
   setToken(params.get('token')??'');
   setProductId(params.get('product')??'');
   supabase.from('products').select('id,name_en,name_ar').order('id').then(({data})=>{
     setProducts((data??[]).map(p=>({id:Number(p.id),en:p.name_en,ar:p.name_ar})));
   });
 },[]);
 const ar=lang==='ar';
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault(); if(busy) return;
   setError('');setBusy(true);
   try {
     const {error:err}=await supabase.rpc('submit_softglow_review',{
       p_name:name.trim(),p_rating:rating,p_comment:comment.trim(),
       p_product_id:productId?Number(productId):null,p_token:token||null,p_website:website
     });
     if(err) throw err;
     setDone(true);
   }catch(err){setError(ar?'تعذر إرسال التقييم. تحقق من البيانات أو صلاحية الرابط وحاول مجدداً.':'Could not submit review. Check your details or invitation link and try again.');console.error(err);}
   finally{setBusy(false);}
 }
 const input='w-full rounded-xl border border-[#e4d4c8] bg-white px-4 py-3 outline-none focus:border-[#a97b61] focus:ring-2 focus:ring-[#a97b61]/20';
 return <main dir={ar?'rtl':'ltr'} lang={lang} className="min-h-screen bg-[#fbf7f2] px-4 py-10 text-[#5d4133]">
  <div className="mx-auto max-w-2xl">
   <div className="mb-8 flex items-center justify-between"><Link href="/" className="flex items-center gap-2 text-sm"><ArrowLeft size={17}/>{ar?'المتجر':'Back to shop'}</Link><button type="button" onClick={()=>{const next=ar?'en':'ar';setLang(next);localStorage.setItem('softglow-lang',next);}} className="rounded-full border px-4 py-2 text-sm">{ar?'English':'العربية'}</button></div>
   <div className="rounded-3xl border border-[#e8dacf] bg-white p-6 shadow-sm sm:p-10">
    <p className="mb-3 text-xs uppercase tracking-[.25em] text-[#a97b61]">SOFT GLOW · LEBANON</p>
    <h1 className="serif mb-3 text-4xl">{ar?'شاركنا تجربتك':'Share your experience'}</h1>
    <p className="mb-8 text-sm leading-7 text-[#826b5d]">{ar?'رأيك الصادق يساعدنا على التطور ويساعد العملاء الآخرين على الاختيار. تتم مراجعة التقييمات قبل نشرها.':'Your honest feedback helps us improve and helps others choose. Reviews are moderated before publication.'}</p>
    {done?<div role="status" className="rounded-2xl bg-[#f0f6ed] p-7 text-center"><CheckCircle2 size={36} className="mx-auto mb-3 text-green-700"/><h2 className="mb-2 text-xl font-semibold">{ar?'شكراً لتقييمك!':'Thank you for your review!'}</h2><p>{ar?'تم استلام رأيك وسيظهر بعد المراجعة.':'Your review was received and will appear after moderation.'}</p><Link href="/" className="mt-5 inline-block underline">{ar?'العودة للمتجر':'Return to shop'}</Link></div>:
    <form onSubmit={submit} className="space-y-6">
      <div className="absolute -left-[9999px]" aria-hidden="true"><label htmlFor="review-website">Website</label><input id="review-website" tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></div>
      {token&&<p className="rounded-xl bg-[#f4ede7] p-3 text-sm">{ar?'أنت تستخدم رابط تقييم خاصاً.':'You are using a personal review invitation.'}</p>}
      <div><label htmlFor="review-product" className="mb-2 block text-sm font-medium">{ar?'المنتج (اختياري لتقييم المتجر)':'Product (optional for shop review)'}</label><select id="review-product" className={input} value={productId} onChange={e=>setProductId(e.target.value)}><option value="">{ar?'تقييم المتجر بشكل عام':'General shop experience'}</option>{products.map(p=><option key={p.id} value={p.id}>{ar?p.ar:p.en}</option>)}</select></div>
      <div><label htmlFor="review-name" className="mb-2 block text-sm font-medium">{ar?'الاسم':'Your name'} *</label><input id="review-name" required minLength={2} maxLength={80} autoComplete="name" className={input} value={name} onChange={e=>setName(e.target.value)}/></div>
      <fieldset><legend className="mb-3 text-sm font-medium">{ar?'التقييم':'Rating'} *</legend><div className="flex gap-2">{[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setRating(n)} aria-label={`${n} stars`} aria-pressed={rating===n} className="rounded-lg p-1 focus-visible:outline-2"><Star size={32} fill={n<=rating?'#c49356':'none'} color={n<=rating?'#c49356':'#d5c5b8'}/></button>)}</div></fieldset>
      <div><label htmlFor="review-comment" className="mb-2 block text-sm font-medium">{ar?'اكتب رأيك':'Your review'} *</label><textarea id="review-comment" required minLength={10} maxLength={1200} rows={5} className={input} value={comment} onChange={e=>setComment(e.target.value)} placeholder={ar?'ما الذي أعجبك؟ وما الذي يمكن تحسينه؟':'What did you love? What could be improved?'}/><p className="mt-1 text-end text-xs text-[#9a8475]">{comment.length}/1200</p></div>
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} type="submit" className="w-full rounded-full bg-[#5d4133] px-6 py-4 font-semibold text-white transition hover:bg-[#795644] disabled:opacity-50">{busy?(ar?'جارٍ الإرسال...':'Submitting...'):(ar?'إرسال التقييم':'Submit review')}</button>
    </form>}
   </div>
  </div>
 </main>;
}
