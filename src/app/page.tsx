'use client';
import {useEffect,useMemo,useState} from 'react';
import Image from 'next/image';
import {ShoppingBag,Menu,X,Instagram,Heart,Search,ArrowRight,ArrowLeft,Minus,Plus} from 'lucide-react';
import {products,Category} from '@/data/products';
const categories:{id:Category;en:string;ar:string;image:number}[]=[{id:'florals',en:'Floral Creations',ar:'تنسيقات الزهور',image:2},{id:'candles',en:'Candles',ar:'الشموع',image:26},{id:'decor',en:'Gypsum & Decor',ar:'الجبس والديكور',image:11},{id:'arabic',en:'Arabic Art',ar:'فن الخط العربي',image:9},{id:'personalized',en:'Personalized Gifts',ar:'هدايا مخصصة',image:23},{id:'baby',en:'Baby Gifts',ar:'هدايا المواليد',image:24},{id:'seasonal',en:'Seasonal',ar:'الموسمية',image:30}];
const copy={en:{tag:'Made by hand, made with love',hero:'Little details. Lasting warmth.',sub:'Discover thoughtful handmade candles, floral keepsakes and beautiful decor, crafted for the moments that matter.',shop:'Explore the collection',cat:'Shop by category',all:'All products',collection:'Our creations',intro:'Every piece has a story',introText:'From meaningful gifts to small details for your home, Soft Glow celebrates the beauty of handmade.',custom:'Looking for something personal?',customText:'We create thoughtful pieces for celebrations, names and special moments. Tell us what you imagine.',contact:'Ask about a custom order',cart:'Your bag',empty:'Your bag is empty',order:'Order on WhatsApp',price:'Price on request',added:'Add to bag',search:'Search creations...',noResults:'No products found',note:'Prices and availability are confirmed when you order.',footer:'Handmade in Lebanon, with love.',home:'Home',products:'Products',about:'Our story',contactNav:'Contact',remove:'Remove',items:'items'},ar:{tag:'صُنع يدويًا بكل حب',hero:'تفاصيل صغيرة. دفء يدوم.',sub:'اكتشفوا الشموع والهدايا والتصاميم اليدوية المصنوعة بعناية لترافق أجمل لحظاتكم.',shop:'تسوقوا المجموعة',cat:'تسوقوا حسب الفئة',all:'كل المنتجات',collection:'إبداعاتنا',intro:'لكل قطعة حكاية',introText:'من الهدايا المميزة إلى تفاصيل المنزل، نحتفي في سوفت غلو بجمال الأعمال اليدوية.',custom:'تبحثون عن هدية خاصة؟',customText:'نصمم قطعًا مخصصة للمناسبات والأسماء واللحظات الجميلة. شاركونا أفكاركم.',contact:'اطلبوا تصميمًا خاصًا',cart:'سلة التسوق',empty:'سلة التسوق فارغة',order:'الطلب عبر واتساب',price:'السعر عند الطلب',added:'أضف إلى السلة',search:'ابحثوا عن منتج...',noResults:'لا توجد منتجات',note:'يتم تأكيد الأسعار والتوفر عند الطلب.',footer:'صنع يدويًا في لبنان، بكل حب.',home:'الرئيسية',products:'المنتجات',about:'قصتنا',contactNav:'تواصلوا معنا',remove:'إزالة',items:'قطع'}};
// Replace with your Lebanon WhatsApp number including country code, digits only, e.g. 961XXXXXXXX.
const WHATSAPP_NUMBER='96176552059';
function whatsapp(message:string){if(!WHATSAPP_NUMBER){alert('Set WHATSAPP_NUMBER in src/app/page.tsx before enabling WhatsApp orders.');return;}window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer')}
export default function Home(){
 const [lang,setLang]=useState<'en'|'ar'>('en');const [category,setCategory]=useState<Category|'all'>('all');const [query,setQuery]=useState('');const [cart,setCart]=useState<Record<number,number>>({});const [cartOpen,setCartOpen]=useState(false);const [menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{try{const saved=localStorage.getItem('softglow-cart');if(saved)setCart(JSON.parse(saved))}catch{}},[]);
 useEffect(()=>{localStorage.setItem('softglow-cart',JSON.stringify(cart))},[cart]);
 const t=copy[lang],rtl=lang==='ar';const filtered=useMemo(()=>products.filter(p=>(category==='all'||p.category===category)&&(`${p.en} ${p.ar}`.toLowerCase().includes(query.toLowerCase()))),[category,query]);
 const count=Object.values(cart).reduce((a,b)=>a+b,0);const add=(id:number)=>setCart(c=>({...c,[id]:(c[id]||0)+1}));const change=(id:number,delta:number)=>setCart(c=>{const n={...c};n[id]=Math.max(0,(n[id]||0)+delta);if(!n[id])delete n[id];return n});
 const orderText = () => [
  rtl
    ? 'مرحباً Soft Glow، أود طلب المنتجات التالية:'
    : 'Hello Soft Glow! I would like to order:',

  ...Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const product = products.find(
        p => p.id === Number(id)
      );

      if (!product) return '';

      const name = rtl ? product.ar : product.en;
      const code = `SG-${String(id).padStart(3, '0')}`;

      return `• ${name} (${code}) × ${qty}`;
    }),

  '',
  rtl
    ? 'الرجاء تأكيد الأسعار والتوفر ورسوم التوصيل داخل لبنان.'
    : 'Please confirm prices, availability, and delivery fees within Lebanon.'
].join('\n');
 const Arrow=rtl?ArrowLeft:ArrowRight;
 return <div dir={rtl?'rtl':'ltr'} lang={lang}>
 <div className="bg-[#efe3d8] text-center py-2 text-xs tracking-wide">{t.tag} ✦ Lebanon</div>
 <header className="sticky top-0 z-30 bg-[#fbf7f2]/95 backdrop-blur border-b border-[#e9ded3]"><div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4"><a href="#home" className="serif text-3xl tracking-tight">Soft <span className="italic text-[#a97b61]">Glow</span><span className="block text-[9px] tracking-[.27em] uppercase text-[#927e70] text-center">Handmade with love</span></a><nav className="hidden md:flex items-center gap-7 text-sm"><a href="#home">{t.home}</a><a href="#shop">{t.products}</a><a href="#about">{t.about}</a><a href="#contact">{t.contactNav}</a></nav><div className="flex items-center gap-4"><button aria-label="Switch language" className="text-sm font-semibold" onClick={()=>setLang(l=>l==='en'?'ar':'en')}>{lang==='en'?'العربية':'English'}</button><button aria-label="Open cart" className="relative" onClick={()=>setCartOpen(true)}><ShoppingBag size={22}/>{count>0&&<span className="absolute -top-2 -end-2 bg-[#a97b61] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{count}</span>}</button><button aria-label="Toggle menu" className="md:hidden" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></div></div>{menuOpen&&<nav className="md:hidden flex flex-col px-6 pb-4 gap-3 text-sm"><a onClick={()=>setMenuOpen(false)} href="#home">{t.home}</a><a onClick={()=>setMenuOpen(false)} href="#shop">{t.products}</a><a onClick={()=>setMenuOpen(false)} href="#about">{t.about}</a><a onClick={()=>setMenuOpen(false)} href="#contact">{t.contactNav}</a></nav>}</header>
 <main id="home"><section className="bg-[#eee0d1]"><div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center"><div className="p-9 sm:p-14 lg:p-20 order-2 md:order-1"><p className="uppercase tracking-[.25em] text-xs text-[#9c7059] mb-5">SOFT GLOW · LEBANON</p><h1 className="serif text-5xl sm:text-6xl lg:text-7xl leading-[1.08] mb-6">{t.hero}</h1><p className="text-[#78675e] leading-7 max-w-md mb-8">{t.sub}</p><a className="primary inline-flex gap-3 items-center" href="#shop">{t.shop}<Arrow size={17}/></a></div><div className="relative h-[390px] md:h-[590px] order-1 md:order-2"><Image src="/products/02.webp" alt="Soft Glow handmade floral bouquet" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw"/></div></div></section>
 <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16"><div className="flex justify-between items-end mb-8"><div><p className="uppercase tracking-[.25em] text-xs muted mb-2">SOFT GLOW</p><h2 className="serif text-4xl">{t.cat}</h2></div><a href="#shop" className="text-sm underline underline-offset-4">{t.all}</a></div><div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-5">{categories.map(c=><button key={c.id} className="text-center group" onClick={()=>{setCategory(c.id);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}}><div className="relative aspect-square rounded-full overflow-hidden mb-3 bg-[#eee0d1]"><Image src={`/products/${String(c.image).padStart(2,'0')}.webp`} alt={lang==='en'?c.en:c.ar} fill sizes="(max-width: 640px) 45vw, 15vw" className="object-cover group-hover:scale-105 transition duration-300"/></div><span className="text-sm">{lang==='en'?c.en:c.ar}</span></button>)}</div></section>
 <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-8 pb-20 scroll-mt-24"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5 mb-7"><div><p className="uppercase tracking-[.25em] text-xs muted mb-2">THE COLLECTION</p><h2 className="serif text-4xl">{t.collection}</h2></div><div className="flex items-center gap-2 bg-white border border-[#e9ded3] rounded-full px-4 py-3"><Search size={17} className="muted"/><input aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)} className="bg-transparent text-sm w-52"/></div></div><div className="flex gap-2 overflow-x-auto pb-5 mb-4"><button className={`chip ${category==='all'?'active':''}`} onClick={()=>setCategory('all')}>{t.all}</button>{categories.map(c=><button key={c.id} className={`chip ${category===c.id?'active':''}`} onClick={()=>setCategory(c.id)}>{lang==='en'?c.en:c.ar}</button>)}</div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">{filtered.map(p=><article key={p.id} className="card group"><div className="relative aspect-[4/5] bg-[#eee0d1]"><Image src={p.image} alt={lang==='en'?p.en:p.ar} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-[1.03] transition duration-300"/><span className="absolute top-3 start-3 bg-white/90 rounded-full px-2 py-1 text-[10px]">SG-{String(p.id).padStart(3,'0')}</span></div><div className="p-4"><h3 className="text-sm sm:text-base font-medium min-h-11">{lang==='en'?p.en:p.ar}</h3><p className="text-sm muted my-2">{p.price===null?t.price:`$${p.price.toFixed(2)}`}</p><button onClick={()=>add(p.id)} className="w-full bg-[#5d4133] text-white rounded-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2"><Plus size={15}/>{t.added}</button></div></article>)}</div>{filtered.length===0&&<p className="text-center py-16 muted">{t.noResults}</p>}</section>
<section className="bg-[#f3eae1] py-14 px-6">
  <div className="max-w-3xl mx-auto text-center">
    <h2 className="serif text-4xl mb-5">
      {rtl ? 'التوصيل إلى جميع أنحاء لبنان' : 'Delivery Across Lebanon'}
    </h2>

    <p className="text-[#78675e] leading-8 mb-6">
      {rtl
        ? 'نستقبل طلباتكم من جميع المناطق اللبنانية. يتم تأكيد رسوم التوصيل ومدة تجهيز الطلب عند التواصل معنا.'
        : 'We accept orders from all across Lebanon. Delivery fees and preparation times are confirmed when you contact us.'}
    </p>

    <a
      href="https://wa.me/96176552059"
      target="_blank"
      rel="noopener noreferrer"
      className="primary inline-flex items-center justify-center"
    >
      {rtl ? 'تواصلوا معنا عبر واتساب' : 'Contact us on WhatsApp'}
    </a>
  </div>
</section>
 <section id="about" className="bg-[#efe4d9] py-16 scroll-mt-24"><div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 items-center gap-12"><div className="relative aspect-[5/4] rounded-2xl overflow-hidden"><Image src="/products/20.webp" alt="Soft Glow handmade rose bouquet" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw"/></div><div><p className="uppercase tracking-[.25em] text-xs mb-4">HANDMADE WITH LOVE</p><h2 className="serif text-4xl sm:text-5xl mb-6">{t.intro}</h2><p className="leading-8 text-[#78675e]">{t.introText}</p></div></div></section>
 <section id="contact" className="text-center max-w-3xl mx-auto px-6 py-20 scroll-mt-24"><Heart className="mx-auto mb-5 text-[#a97b61]" size={28}/><h2 className="serif text-4xl mb-5">{t.custom}</h2><p className="muted leading-8 mb-8">{t.customText}</p><button className="outline" onClick={()=>whatsapp(rtl?'مرحبًا، أود الاستفسار عن طلب مخصص.':'Hello Soft Glow, I would like to ask about a custom order.')}>{t.contact}</button></section></main>
 <footer className="bg-[#5d4133] text-[#f9f0e7] py-10 text-center"><p className="serif text-3xl mb-3">Soft Glow</p><p className="text-sm opacity-80">{t.footer}</p><p className="text-xs opacity-60 mt-5">© {new Date().getFullYear()} Soft Glow</p></footer>
 {cartOpen&&<div className="fixed inset-0 z-50"><button aria-label="Close cart" className="absolute inset-0 bg-black/45 w-full" onClick={()=>setCartOpen(false)}></button><aside className={`absolute top-0 bottom-0 ${rtl?'left-0':'right-0'} bg-[#fbf7f2] w-full max-w-md shadow-2xl p-6 flex flex-col`} dir={rtl?'rtl':'ltr'}><div className="flex justify-between items-center border-b pb-5 mb-6"><h2 className="serif text-3xl">{t.cart} ({count})</h2><button aria-label="Close cart" onClick={()=>setCartOpen(false)}><X/></button></div><div className="flex-1 overflow-y-auto">{count===0?<p className="muted">{t.empty}</p>:Object.entries(cart).map(([id,qty])=>{const p=products.find(p=>p.id===Number(id))!;return <div key={id} className="flex gap-4 mb-5"><div className="relative w-24 h-28 shrink-0 rounded-lg overflow-hidden"><Image src={p.image} alt={lang==='en'?p.en:p.ar} fill className="object-cover" sizes="96px"/></div><div className="flex-1"><p className="text-sm font-medium">{lang==='en'?p.en:p.ar}</p><p className="text-xs muted mt-2">{t.price}</p><div className="flex items-center gap-4 mt-4"><button aria-label="Decrease quantity" onClick={()=>change(p.id,-1)}><Minus size={16}/></button><span>{qty}</span><button aria-label="Increase quantity" onClick={()=>change(p.id,1)}><Plus size={16}/></button><button className="text-xs underline ms-auto" onClick={()=>change(p.id,-qty)}>{t.remove}</button></div></div></div>})}</div><div className="border-t pt-5"><p className="text-xs muted mb-4">{t.note}</p><button disabled={count===0} className="primary w-full" onClick={()=>whatsapp(orderText())}>{t.order}</button></div></aside></div>}
 </div>;
}
