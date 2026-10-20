
'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Product } from '@/data/products';
import { loadShopProducts } from '@/lib/shop-products';

const WHATSAPP_NUMBER = '96176552059';
const COLORS = [
  { name: 'White', hex: '#F8F6F1' },
  { name: 'Beige', hex: '#D8C1A8' },
  { name: 'Pink', hex: '#E8B6C3' },
  { name: 'Sage', hex: '#A9B8A2' },
  { name: 'Brown', hex: '#94715F' },
];
export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState('Beige');
  const [customName, setCustomName] = useState('');
  const [occasion, setOccasion] = useState('Birthday');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('softglow-lang');
    if (saved === 'ar' || saved === 'en') setLang(saved);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

    loadShopProducts()
      .then((items) => {
        if (active) setProduct(items.find((item) => item.id === Number(id)) ?? null);
      })
      .catch(() => {
        if (active) setLoadError('Unable to load this product. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  const rtl = lang === 'ar';

  function changeLanguage() {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('softglow-lang', next);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fbf7f2] text-[#5d4133]">
        <p>{rtl ? 'جاري تحميل المنتج...' : 'Loading product...'}</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fbf7f2] text-[#5d4133]">
        <p role="alert">{rtl ? 'تعذر تحميل المنتج. يرجى المحاولة مرة أخرى.' : loadError}</p>
        <Link href="/#shop" className="underline">{rtl ? 'العودة إلى المتجر' : 'Return to shop'}</Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-5">
        <h1 className="text-3xl">Product not found</h1>
        <Link href="/#shop" className="underline">
          Return to collection
        </Link>
      </main>
    );
  }

  const name = rtl ? product.ar : product.en;
  const code = `SG-${String(product.id).padStart(3, '0')}`;

  function addToCart() {
    if (!product) return;

    let cart: Record<number, number> = {};

    try {
      const saved = localStorage.getItem('softglow-cart');
      if (saved) cart = JSON.parse(saved);
    } catch {
      cart = {};
    }

    cart[product.id] = (cart[product.id] || 0) + quantity;
    localStorage.setItem('softglow-cart', JSON.stringify(cart));
    setAdded(true);
  }

  
function orderOnWhatsApp() {
  const message = rtl
    ? [
        'مرحباً Soft Glow، أود طلب منتج مخصص:',
        '',
        `المنتج: ${name}`,
        `رمز المنتج: ${code}`,
        `الكمية: ${quantity}`,
        `اللون: ${selectedColor}`,
        `الاسم المخصص: ${customName.trim() || 'لا يوجد'}`,
        `المناسبة: ${occasion}`,
        `ملاحظات: ${instructions.trim() || 'لا يوجد'}`,
        '',
        'الرجاء تأكيد السعر النهائي والتوفر ورسوم التوصيل في لبنان.'
      ].join('\n')
    : [
        'Hello Soft Glow! I would like to order a customized product:',
        '',
        `Product: ${name}`,
        `Product code: ${code}`,
        `Quantity: ${quantity}`,
        `Color: ${selectedColor}`,
        `Personalized name: ${customName.trim() || 'None'}`,
        `Occasion: ${occasion}`,
        `Special instructions: ${instructions.trim() || 'None'}`,
        '',
        'Please confirm the final price, availability, and delivery fees in Lebanon.'
      ].join('\n');

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer'
  );
}


  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      lang={lang}
      className="min-h-screen bg-[#fbf7f2] text-[#5d4133]"
    >
      <header className="border-b border-[#e9ded3] px-6 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="serif text-3xl">
            Soft <span className="italic text-[#a97b61]">Glow</span>
          </Link>

          <button onClick={changeLanguage} className="text-sm font-semibold">
            {rtl ? 'English' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">
        <Link
          href="/#shop"
          className="inline-flex items-center gap-2 text-sm mb-8"
        >
          <ArrowLeft size={17} />
          {rtl ? 'العودة إلى المنتجات' : 'Back to products'}
        </Link>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#eee0d1]">
            <Image
              src={product.image}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs tracking-widest text-[#a97b61] mb-4">
              SOFT GLOW · {code}
            </p>

            <h1 className="serif text-4xl sm:text-5xl mb-5">
              {name}
            </h1>

            <p className="text-2xl font-semibold mb-5">
              {product.price === null
                ? rtl ? 'السعر عند الطلب' : 'Price on request'
                : `${rtl ? 'السعر التقديري' : 'Estimated price'}: $${product.price.toFixed(2)}`}
            </p>

            <p className="text-[#78675e] leading-8 mb-8">
              {rtl
                ? 'قطعة مصنوعة يدوياً بعناية من سوفت غلو. يمكنكم التواصل معنا للاستفسار عن الألوان والتخصيص والتوفر.'
                : 'A thoughtfully handmade Soft Glow creation. Contact us to ask about available colors, personalization, and availability.'}
            </p>

{/* Product Customization */}
<div className="border-t border-[#e9ded3] pt-7 mb-8">
  <h2 className="serif text-2xl mb-6">
    {rtl ? 'خصص طلبك' : 'Personalize Your Order'}
  </h2>

  {/* Colors */}
  <div className="mb-6">
    <p className="font-medium mb-3">
      {rtl ? 'اختر اللون' : 'Choose a color'}
    </p>

    <div className="flex flex-wrap gap-3">
      {COLORS.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => setSelectedColor(color.name)}
          aria-label={color.name}
          aria-pressed={selectedColor === color.name}
          className={`w-11 h-11 rounded-full border-2 ${
            selectedColor === color.name
              ? 'border-[#5d4133] ring-2 ring-[#c5a991]'
              : 'border-[#ded4c9]'
          }`}
          style={{ backgroundColor: color.hex }}
          title={color.name}
        />
      ))}
    </div>

    <p className="text-sm mt-3 text-[#78675e]">
      {rtl ? 'اللون المختار:' : 'Selected color:'}{' '}
      {selectedColor}
    </p>
  </div>

  {/* Personalized Name */}
  <div className="mb-6">
    <label htmlFor="customName" className="block font-medium mb-2">
      {rtl ? 'الاسم المخصص (اختياري)' : 'Personalized name (optional)'}
    </label>

    <input
      id="customName"
      type="text"
      maxLength={60}
      value={customName}
      onChange={(e) => setCustomName(e.target.value)}
      placeholder={rtl ? 'مثال: سارة' : 'Example: Sarah'}
      className="w-full border border-[#ded4c9] bg-white rounded-xl px-4 py-3"
    />
  </div>

  {/* Occasion */}
  <div className="mb-6">
    <label htmlFor="occasion" className="block font-medium mb-2">
      {rtl ? 'المناسبة' : 'Occasion'}
    </label>

    <select
      id="occasion"
      value={occasion}
      onChange={(e) => setOccasion(e.target.value)}
      className="w-full border border-[#ded4c9] bg-white rounded-xl px-4 py-3"
    >
      <option value="Birthday">
        {rtl ? 'عيد ميلاد' : 'Birthday'}
      </option>
      <option value="Wedding">
        {rtl ? 'زفاف' : 'Wedding'}
      </option>
      <option value="Baby shower">
        {rtl ? 'استقبال مولود' : 'Baby shower'}
      </option>
      <option value="Graduation">
        {rtl ? 'تخرج' : 'Graduation'}
      </option>
      <option value="Other">
        {rtl ? 'مناسبة أخرى' : 'Other'}
      </option>
    </select>
  </div>

  {/* Special Instructions */}
  <div className="mb-4">
    <label htmlFor="instructions" className="block font-medium mb-2">
      {rtl ? 'ملاحظات خاصة' : 'Special instructions'}
    </label>

    <textarea
      id="instructions"
      rows={3}
      maxLength={500}
      value={instructions}
      onChange={(e) => setInstructions(e.target.value)}
      placeholder={
        rtl
          ? 'مثال: إضافة تفاصيل ذهبية وتغليف هدية'
          : 'Example: Gold details and gift wrapping'
      }
      className="w-full border border-[#ded4c9] bg-white rounded-xl px-4 py-3"
    />
  </div>

  <p className="text-xs text-[#78675e]">
    {rtl
      ? 'جميع خيارات التخصيص تخضع للتأكيد وقد تؤثر على السعر ومدة التحضير.'
      : 'Customization options are subject to confirmation and may affect price and preparation time.'}
  </p>
</div>

            <p className="font-medium mb-3">
              {rtl ? 'الكمية' : 'Quantity'}
            </p>

            <div className="flex items-center gap-5 mb-8">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="border rounded-full p-3"
              >
                <Minus size={17} />
              </button>

              <span className="text-xl font-medium">{quantity}</span>

              <button
                aria-label="Increase quantity"
                onClick={() => setQuantity(q => Math.min(99, q + 1))}
                className="border rounded-full p-3"
              >
                <Plus size={17} />
              </button>
            </div>


<div className="flex flex-col gap-3">
  {/* Add to Bag Button */}
  <button
    type="button"
    onClick={addToCart}
    disabled={
      selectedColor !== 'Beige' ||
      customName.trim() !== '' ||
      occasion !== 'Birthday' ||
      instructions.trim() !== ''
    }
    className="bg-[#5d4133] text-white rounded-full py-4 flex justify-center items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <ShoppingBag size={19} />
    {rtl ? 'أضف إلى السلة' : 'Add to Bag'}
  </button>

  {/* Custom Order Information */}
  <p className="text-xs text-center text-[#78675e]">
    {rtl
      ? 'للطلبات المخصصة، يرجى استخدام زر واتساب.'
      : 'For customized orders, please use the WhatsApp button.'}
  </p>

{added && (
  <p className="text-center text-sm">
    {rtl ? 'تمت الإضافة إلى السلة' : 'Added to your bag'}
    {' · '}
    <Link href="/#shop" className="underline">
      {rtl ? 'العودة إلى المتجر' : 'Return to shop'}
    </Link>
  </p>
)}

<button
  onClick={orderOnWhatsApp}
  className="border border-[#5d4133] rounded-full py-4"
>
  {rtl ? 'اطلب عبر واتساب' : 'Order on WhatsApp'}
</button>
</div>
            <div className="mt-9 border-t pt-6 text-sm text-[#78675e]">
              {rtl
                ? 'التوصيل متاح إلى جميع أنحاء لبنان. يتم تأكيد الأسعار ورسوم التوصيل قبل إتمام الطلب.'
                : 'Delivery available across Lebanon. Prices and delivery fees are confirmed before your order is finalized.'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
