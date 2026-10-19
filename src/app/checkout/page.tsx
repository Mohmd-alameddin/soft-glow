
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, ShoppingBag, Trash2 } from 'lucide-react';
import { products } from '@/data/products';

const WHATSAPP_NUMBER = '96176552059';

const GOVERNORATES = [
  'Beirut',
  'Mount Lebanon',
  'North Lebanon',
  'Akkar',
  'Bekaa',
  'Baalbek-Hermel',
  'South Lebanon',
  'Nabatieh',
];

type Cart = Record<number, number>;

export default function CheckoutPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [cart, setCart] = useState<Cart>({});
  const [loaded, setLoaded] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    const savedLang = localStorage.getItem('softglow-lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      setLang(savedLang);
    }

    try {
      const savedCart = localStorage.getItem('softglow-cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      setCart({});
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('softglow-cart', JSON.stringify(cart));
    }
  }, [cart, loaded]);

  const rtl = lang === 'ar';

  const cartItems = products
    .filter((p) => Number(cart[p.id]) > 0)
    .map((p) => ({
      ...p,
      quantity: Math.min(99, Math.max(1, Number(cart[p.id]))),
    }));

  const estimatedTotal = cartItems.reduce(
    (sum, p) => sum + (p.price ?? 0) * p.quantity,
    0
  );

  const allPricesKnown = cartItems.every(p => p.price !== null);

  function updateQuantity(id: number, quantity: number) {
    setCart(previous => {
      const next = { ...previous };
      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = Math.min(99, quantity);
      }
      return next;
    });
  }

  function changeLanguage() {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('softglow-lang', next);
  }

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cartItems.length) return;

    const itemLines = cartItems.map(p => {
      const name = rtl ? p.ar : p.en;
      const code = `SG-${String(p.id).padStart(3, '0')}`;
      const price = p.price === null
        ? (rtl ? 'السعر عند الطلب' : 'Price on request')
        : `$${p.price.toFixed(2)}`;

      return `• ${name} (${code}) x${p.quantity} — ${price}`;
    });

    const message = rtl
      ? [
          'مرحباً Soft Glow، أود تأكيد تفاصيل طلبي:',
          '',
          'المنتجات:',
          ...itemLines,
          '',
          `المجموع التقديري: ${
            allPricesKnown
              ? '$' + estimatedTotal.toFixed(2)
              : 'يتم تأكيده'
          }`,
          '',
          'بيانات الزبون:',
          `الاسم: ${customerName.trim()}`,
          `الهاتف: ${phone.trim()}`,
          `المحافظة: ${governorate}`,
          `المدينة أو البلدة: ${city.trim()}`,
          `العنوان: ${address.trim()}`,
          `ملاحظات التوصيل: ${deliveryNotes.trim() || 'لا يوجد'}`,
          '',
          'الرجاء تأكيد الأسعار النهائية والتوفر ورسوم التوصيل ومدة التحضير.'
        ].join('\n')
      : [
          'Hello Soft Glow! I would like to confirm my order details:',
          '',
          'Products:',
          ...itemLines,
          '',
          `Estimated subtotal: ${
            allPricesKnown
              ? '$' + estimatedTotal.toFixed(2)
              : 'To be confirmed'
          }`,
          '',
          'Customer details:',
          `Name: ${customerName.trim()}`,
          `Phone: ${phone.trim()}`,
          `Governorate: ${governorate}`,
          `City/Village: ${city.trim()}`,
          `Address: ${address.trim()}`,
          `Delivery notes: ${deliveryNotes.trim() || 'None'}`,
          '',
          'Please confirm final prices, availability, delivery fees, and preparation time.'
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

          <button
            type="button"
            onClick={changeLanguage}
            className="text-sm font-semibold"
          >
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
          {rtl ? 'العودة إلى المتجر' : 'Back to shop'}
        </Link>

        <h1 className="serif text-4xl sm:text-5xl mb-3">
          {rtl ? 'إتمام الطلب' : 'Checkout'}
        </h1>

        <p className="text-[#78675e] mb-10">
          {rtl
            ? 'أدخل بيانات التوصيل وسنقوم بتجهيز رسالة الطلب عبر واتساب.'
            : 'Enter your delivery details to prepare your WhatsApp order.'}
        </p>

        {!loaded ? (
          <p>{rtl ? 'جارٍ التحميل...' : 'Loading...'}</p>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={42} className="mx-auto mb-5" />
            <h2 className="serif text-3xl mb-5">
              {rtl ? 'سلتك فارغة' : 'Your bag is empty'}
            </h2>
            <Link href="/#shop" className="underline">
              {rtl ? 'تصفح المنتجات' : 'Browse products'}
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Cart Summary */}
            <section>
              <h2 className="serif text-2xl mb-6">
                {rtl ? 'ملخص الطلب' : 'Order Summary'}
              </h2>

              <div className="space-y-5">
                {cartItems.map(p => (
                  <div
                    key={p.id}
                    className="flex gap-4 border-b border-[#e9ded3] pb-5"
                  >
                    <Link
                      href={`/products/${p.id}`}
                      className="relative w-24 h-28 shrink-0 rounded-xl overflow-hidden bg-[#eee0d1]"
                    >
                      <Image
                        src={p.image}
                        alt={rtl ? p.ar : p.en}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex-1">
                      <Link
                        href={`/products/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {rtl ? p.ar : p.en}
                      </Link>

                      <p className="text-xs text-[#78675e] mt-1">
                        SG-{String(p.id).padStart(3, '0')}
                      </p>

                      <p className="mt-2 text-sm">
                        {p.price === null
                          ? rtl ? 'السعر عند الطلب' : 'Price on request'
                          : `$${p.price.toFixed(2)}`}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, p.quantity - 1)}
                          className="border rounded-full w-8 h-8"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span>{p.quantity}</span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, p.quantity + 1)}
                          className="border rounded-full w-8 h-8"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, 0)}
                          className="text-[#a97b61] ms-auto"
                          aria-label="Remove product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-semibold text-lg mt-7">
                <span>
                  {rtl ? 'المجموع التقديري' : 'Estimated subtotal'}
                </span>
                <span>
                  {allPricesKnown
                    ? `$${estimatedTotal.toFixed(2)}`
                    : rtl ? 'يتم تأكيده' : 'To be confirmed'}
                </span>
              </div>

              <p className="text-xs text-[#78675e] mt-3">
                {rtl
                  ? 'رسوم التوصيل وأي تكاليف تخصيص غير مشمولة.'
                  : 'Delivery fees and any customization costs are not included.'}
              </p>
            </section>

            {/* Delivery Form */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={22} />
                <h2 className="serif text-2xl">
                  {rtl ? 'بيانات التوصيل' : 'Delivery Details'}
                </h2>
              </div>

              <form onSubmit={submitOrder} className="space-y-5">
                <div>
                  <label htmlFor="customerName" className="block mb-2">
                    {rtl ? 'الاسم الكامل' : 'Full name'}
                  </label>
                  <input
                    id="customerName"
                    required
                    maxLength={100}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 bg-white"
                    placeholder={rtl ? 'الاسم الكامل' : 'Your full name'}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block mb-2">
                    {rtl ? 'رقم الهاتف' : 'Phone number'}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    maxLength={25}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 bg-white"
                    placeholder="+961 76 123 456"
                  />
                </div>

                <div>
                  <label htmlFor="governorate" className="block mb-2">
                    {rtl ? 'المحافظة' : 'Governorate'}
                  </label>
                  <select
                    id="governorate"
                    required
                    value={governorate}
                    onChange={e => setGovernorate(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 bg-white"
                  >
                    <option value="">
                      {rtl ? 'اختر المحافظة' : 'Select governorate'}
                    </option>
                    {GOVERNORATES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block mb-2">
                    {rtl ? 'المدينة أو البلدة' : 'City or village'}
                  </label>
                  <input
                    id="city"
                    required
                    maxLength={100}
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 bg-white"
                    placeholder={rtl ? 'مثال: جونية' : 'Example: Jounieh'}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block mb-2">
                    {rtl ? 'عنوان التوصيل الكامل' : 'Full delivery address'}
                  </label>
                  <textarea
                    id="address"
                    required
                    rows={3}
                    maxLength={300}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 bg-white"
                    placeholder={
                      rtl
                        ? 'الشارع، المبنى، الطابق، الشقة'
                        : 'Street, building, floor, apartment'
                    }
                  />
                </div>

                <div>
                  <label htmlFor="deliveryNotes" className="block mb-2">
                    {rtl ? 'ملاحظات التوصيل (اختياري)' : 'Delivery notes (optional)'}
                  </label>
                  <textarea
                    id="deliveryNotes"
                    rows={3}
                    maxLength={500}
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 bg-white"
                    placeholder={
                      rtl
                        ? 'علامة مميزة أو تعليمات إضافية'
                        : 'Landmark or special delivery instructions'
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#5d4133] text-white rounded-full py-4 font-medium hover:opacity-90"
                >
                  {rtl ? 'إرسال الطلب عبر واتساب' : 'Send Order via WhatsApp'}
                </button>

                <p className="text-xs text-[#78675e] leading-6">
                  {rtl
                    ? 'لن يتم الدفع الآن. ستُفتح رسالة واتساب لتراجعها وترسلها بنفسك. سيتم تأكيد السعر والتوصيل قبل إتمام الطلب.'
                    : 'No payment is collected now. WhatsApp will open with a prepared message for you to review and send. Final prices and delivery will be confirmed before the order is finalized.'}
                </p>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
