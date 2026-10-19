
'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { products } from '@/data/products';

const WHATSAPP_NUMBER = '96176552059';

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = products.find((p) => p.id === Number(id));

  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('softglow-lang');
    if (saved === 'ar' || saved === 'en') setLang(saved);
  }, []);

  const rtl = lang === 'ar';

  function changeLanguage() {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('softglow-lang', next);
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
    let cart: Record<number, number> = {};

    try {
      const saved = localStorage.getItem('softglow-cart');
      if (saved) cart = JSON.parse(saved);
    } catch {
      cart = {};
    }

    cart[product!.id] = (cart[product!.id] || 0) + quantity;
    localStorage.setItem('softglow-cart', JSON.stringify(cart));
    setAdded(true);
  }

  function orderOnWhatsApp() {
    const message = rtl
      ? `مرحباً Soft Glow، أود طلب:\n${name}\nرمز المنتج: ${code}\nالكمية: ${quantity}\nالرجاء تأكيد السعر والتوصيل في لبنان.`
      : `Hello Soft Glow! I would like to order:\n${name}\nProduct code: ${code}\nQuantity: ${quantity}\nPlease confirm the price and delivery in Lebanon.`;

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
              <button
                onClick={addToCart}
                className="bg-[#5d4133] text-white rounded-full py-4 flex justify-center items-center gap-3"
              >
                <ShoppingBag size={19} />
                {rtl ? 'أضف إلى السلة' : 'Add to Bag'}
              </button>

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
