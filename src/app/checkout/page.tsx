
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, ShoppingBag, Trash2, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react';
import { loadShopProducts } from '@/lib/shop-products';
import type { Product } from '@/data/products';
import { type Cart, readCart, saveCart, updateCartItem, cartOptionLines } from '@/lib/cart';

const WHATSAPP_NUMBER = '96176552059';
const WHISH_NUMBER = process.env.NEXT_PUBLIC_WHISH_RECEIVING_NUMBER || '';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

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


export default function CheckoutPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [cart, setCart] = useState<Cart>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [whatsappReady, setWhatsappReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'whish' | 'cod'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  useEffect(() => {
    const savedLang = localStorage.getItem('softglow-lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      setLang(savedLang);
    }

    setCart(readCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveCart(cart);
    }
  }, [cart, loaded]);

  useEffect(() => {
    let active = true;
    loadShopProducts().then(items => {
      if (active) { setProducts(items); setProductsError(false); }
    }).catch(() => { if (active) setProductsError(true); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, []);

  const rtl = lang === 'ar';
  const BackArrow = rtl ? ArrowRight : ArrowLeft;

  const productById = new Map(products.map(p => [p.id, p]));
  const cartItems = cart.flatMap(item => {
    const product = productById.get(item.productId);
    return product ? [{ ...product, item, quantity: item.quantity }] : [];
  });
  const missingItems = !productsLoading && !productsError && cart.some(item => !productById.has(item.productId));

  const estimatedTotal = cartItems.reduce(
    (sum, p) => sum + (p.price ?? 0) * p.quantity,
    0
  );

  const allPricesKnown = cartItems.every(p => p.price !== null);

  function updateQuantity(key: string, quantity: number) {
    setCart(previous => updateCartItem(previous, key, quantity));
  }

  function changeLanguage() {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('softglow-lang', next);
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cartItems.length || missingItems || productsLoading || productsError) return;
    setFormError('');
    setWhatsappReady(false);
    setOrderReference('');
    setTrackingUrl('');
    const digits = phone.replace(/\D/g, '');
    if (customerName.trim().length < 2) {
      setFormError(rtl ? 'يرجى إدخال الاسم الكامل.' : 'Please enter your full name.');
      document.getElementById('customerName')?.focus();
      return;
    }
    if (digits.length < 7 || digits.length > 15) {
      setFormError(rtl ? 'يرجى إدخال رقم هاتف صحيح (7 إلى 15 رقماً).' : 'Enter a valid phone number (7–15 digits).');
      document.getElementById('phone')?.focus();
      return;
    }
    if (!governorate || !city.trim() || !address.trim()) {
      setFormError(rtl ? 'يرجى تعبئة بيانات التوصيل المطلوبة.' : 'Please complete all required delivery details.');
      return;
    }

    if (!allPricesKnown) {
      setFormError(rtl ? 'يوجد منتج يحتاج إلى تأكيد السعر. تواصل معنا عبر واتساب.' : 'One or more items need a price quote. Please contact us on WhatsApp.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    let reference = '';
    let orderTrackingUrl = '';
    try {
      const { data, error } = await supabase.rpc('create_softglow_order', {
        p_customer_name: customerName.trim(), p_phone: phone.trim(),
        p_governorate: governorate, p_city: city.trim(), p_address: address.trim(),
        p_delivery_notes: deliveryNotes.trim(), p_payment_method: paymentMethod,
        p_items: cartItems.map(p => ({product_id: p.id, quantity: p.quantity, options: p.item})),
      });
      if (error || !data) throw new Error(error?.message || 'Could not create order');
      const [savedReference, privateToken] = String(data).split('|');
      if (!savedReference || !/^[a-f0-9]{64}$/.test(privateToken || '')) throw new Error('Tracking setup is missing. Run setup-order-tracking.sql in Supabase.');
      reference = savedReference;
      const url = `${window.location.origin}/order/track?token=${privateToken}`;
      setOrderReference(reference);
      setTrackingUrl(url);
      orderTrackingUrl = url;
    } catch (error) {
      setFormError((rtl ? 'تعذّر حفظ الطلب: ' : 'Could not save order: ') + (error instanceof Error ? error.message : 'Unknown error'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    const itemLines = cartItems.map(p => {
      const name = rtl ? p.ar : p.en;
      const code = `SG-${String(p.id).padStart(3, '0')}`;
      const price = p.price === null
        ? (rtl ? 'السعر عند الطلب' : 'Price on request')
        : `$${p.price.toFixed(2)}`;

      return `• ${name} (${code}) x${p.quantity} — ${price}${cartOptionLines(p.item, rtl).map(line => `\n   ${line}`).join('')}`;
    });

    const message = rtl
      ? [
          'مرحباً Soft Glow، أود تأكيد تفاصيل طلبي:',
          `رقم الطلب: ${reference}`,
          `رابط متابعة الطلب (خاص): ${orderTrackingUrl}`,
          `طريقة الدفع: ${paymentMethod === 'whish' ? 'Whish Money (بانتظار التحقق)' : 'الدفع عند الاستلام'}`,
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
          `Order reference: ${reference}`,
          `Private order tracking link: ${orderTrackingUrl}`,
          `Payment method: ${paymentMethod === 'whish' ? 'Whish Money (pending verification)' : 'Cash on Delivery'}`,
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

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!popup) window.location.href = whatsappUrl;
    setWhatsappReady(true);
  }

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      lang={lang}
      className="sg-checkout min-h-screen bg-[#fbf7f2] text-[#5d4133]"
    >
      <header className="sticky top-0 z-20 border-b border-[#e9ded3] bg-[#fbf7f2]/95 backdrop-blur px-6 py-5">
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

      <main className="max-w-6xl mx-auto px-5 py-9 sm:py-12">
        <Link
          href="/#shop"
          className="inline-flex items-center gap-2 text-sm mb-8"
        >
          <BackArrow size={17} />
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

        {!loaded || productsLoading ? (
          <p>{rtl ? 'جارٍ التحميل...' : 'Loading...'}</p>
        ) : productsError ? (
          <p role="alert" className="text-red-700">{rtl ? 'تعذر تحميل المنتجات، حاول تحديث الصفحة.' : 'Could not load products. Please refresh.'}</p>
        ) : cart.length === 0 ? (
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
          <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-8 lg:gap-12 items-start">
            {/* Cart Summary */}
            <section className="sg-checkout-card lg:sticky lg:top-28">
              <h2 className="serif text-2xl mb-6">
                {rtl ? 'ملخص الطلب' : 'Order Summary'}
              </h2>

              {missingItems && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {rtl ? 'بعض المنتجات لم تعد متاحة. احذفها قبل الطلب.' : 'Some products are unavailable. Remove them before ordering.'}
                {cart.filter(item => !productById.has(item.productId)).map(item => (
                  <button type="button" key={item.key} className="block underline mt-2" onClick={() => updateQuantity(item.key, 0)}>
                    SG-{String(item.productId).padStart(3, '0')} — {rtl ? 'إزالة' : 'Remove'}
                  </button>
                ))}
              </div>}
              <div className="space-y-5">
                {cartItems.map(p => (
                  <div
                    key={p.item.key}
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

                      {cartOptionLines(p.item, rtl).map(line => <p key={line} className="text-xs text-[#78675e] mt-1">{line}</p>)}

                      <p className="mt-2 text-sm">
                        {p.price === null
                          ? rtl ? 'السعر عند الطلب' : 'Price on request'
                          : `$${p.price.toFixed(2)}`}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.item.key, p.quantity - 1)}
                          className="border rounded-full w-8 h-8"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span>{p.quantity}</span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(p.item.key, p.quantity + 1)}
                          className="border rounded-full w-8 h-8"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() => updateQuantity(p.item.key, 0)}
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
            <section className="sg-checkout-card">
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={22} />
                <h2 className="serif text-2xl">
                  {rtl ? 'بيانات التوصيل' : 'Delivery Details'}
                </h2>
              </div>

              <form onSubmit={submitOrder} className="space-y-5">
                <div className="rounded-2xl border border-[#e6d6c8] bg-[#fffaf5] p-4 space-y-3">
                  <p className="font-semibold">{rtl ? 'طريقة الدفع' : 'Payment method'}</p>
                  <label className="flex items-center gap-3 cursor-pointer"><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />{rtl ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</label>
                  <label className="flex items-center gap-3 cursor-pointer"><input type="radio" name="paymentMethod" value="whish" checked={paymentMethod === 'whish'} onChange={() => setPaymentMethod('whish')} />{rtl ? 'Whish Money — تحويل يدوي' : 'Whish Money — manual transfer'}</label>
                  {paymentMethod === 'whish' && <div className="rounded-xl bg-white border border-[#e6d6c8] p-3 text-sm space-y-2">
                    <p>{rtl ? 'بعد إرسال الطلب، يرجى انتظار تأكيد المبلغ النهائي مع التوصيل قبل التحويل.' : 'After submitting, please confirm the final amount including delivery before transferring.'}</p>
                    {WHISH_NUMBER && <p className="font-semibold">{rtl ? 'رقم Whish للاستلام: ' : 'Whish receiving number: '}{WHISH_NUMBER}</p>}
                    <p>{rtl ? 'اذكر رقم الطلب في رسالة التحويل وأرسل إثبات الدفع عبر واتساب. لا يعتبر الطلب مدفوعاً حتى نتحقق من وصول المبلغ.' : 'Include the order reference and send proof through WhatsApp. Payment remains pending until we verify receipt.'}</p>
                  </div>}
                  <p className="text-xs text-[#907568]">{rtl ? 'لا يتم تحصيل أي مبلغ تلقائياً من الموقع.' : 'No automatic payment is collected on this website.'}</p>
                </div>
                {orderReference && <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-sm"><p>{rtl ? 'تم حفظ طلبك برقم: ' : 'Order saved with reference: '}{orderReference}</p>{trackingUrl && <div className="mt-2 space-y-1"><a className="font-semibold underline break-all" href={trackingUrl} target="_blank" rel="noopener noreferrer">{rtl ? 'افتح رابط متابعة الطلب' : 'Open your private order tracking page'}</a><p className="text-xs">{rtl ? 'احفظ الرابط. أي شخص لديه الرابط يستطيع رؤية حالة الطلب.' : 'Save this link. Anyone with it can see the order status.'}</p><button type="button" className="underline text-xs" onClick={()=>navigator.clipboard.writeText(trackingUrl)}>{rtl ? 'نسخ الرابط' : 'Copy tracking link'}</button></div>}</div>}
                <p className="text-sm text-[#907568]">{rtl ? 'يرجى تعبئة بيانات التوصيل المطلوبة.' : 'Please complete the required delivery details.'}</p>
                {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
                {whatsappReady && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{rtl ? 'تم تجهيز الرسالة. تأكد من إرسالها داخل واتساب.' : 'Your message is ready. Make sure to send it in WhatsApp.'}</p>}
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
                    className="sg-checkout-field w-full border rounded-xl px-4 py-3 bg-white"
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
                    className="sg-checkout-field w-full border rounded-xl px-4 py-3 bg-white"
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
                    className="sg-checkout-field w-full border rounded-xl px-4 py-3 bg-white"
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
                    className="sg-checkout-field w-full border rounded-xl px-4 py-3 bg-white"
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
                    className="sg-checkout-field w-full border rounded-xl px-4 py-3 bg-white"
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
                    className="sg-checkout-field w-full border rounded-xl px-4 py-3 bg-white"
                    placeholder={
                      rtl
                        ? 'علامة مميزة أو تعليمات إضافية'
                        : 'Landmark or special delivery instructions'
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || missingItems || cartItems.length === 0 || !allPricesKnown}
                  className="sg-checkout-submit w-full disabled:opacity-40 bg-[#5d4133] text-white rounded-full py-4 font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle size={19} />{submitting ? (rtl ? 'جارٍ حفظ الطلب...' : 'Saving order...') : (rtl ? 'حفظ الطلب وإرساله عبر واتساب' : 'Save Order & Open WhatsApp')}
                </button>

                <div className="flex items-start gap-2 rounded-xl bg-[#f8f0e9] px-4 py-3 text-sm text-[#745b4d]">
                  <ShieldCheck size={19} className="shrink-0 mt-0.5" />
                  <span>{rtl ? 'لا يتم الدفع على الموقع. ستُجهز رسالة الطلب عبر واتساب.' : 'No payment is collected on the website. Your order message is prepared for WhatsApp.'}</span>
                </div>
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
