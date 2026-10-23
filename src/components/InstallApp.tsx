'use client';

import { useEffect, useState } from 'react';
import { Download, Share2, X, PlusSquare } from 'lucide-react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export default function InstallApp({ lang = 'en' }: { lang?: 'en' | 'ar' }) {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const before = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    const after = () => { setInstalled(true); setOpen(false); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', after);

    // Register a minimal worker without caching checkout, products, or user data.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', before);
      window.removeEventListener('appinstalled', after);
    };
  }, []);

  async function install() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setOpen(true);
    }
  }

  if (installed) return null;
  const ar = lang === 'ar';
  return (
    <>
      <button type="button" onClick={install}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#a97b61] px-3 py-2 text-xs font-semibold text-[#5d4133] hover:bg-[#efe3d8]"
        aria-label={ar ? 'تثبيت تطبيق سوفت غلو' : 'Install Soft Glow app'}>
        <Download size={15} />
        <span>{ar ? 'تثبيت التطبيق' : 'Install App'}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5" role="dialog" aria-modal="true" aria-label="Install Soft Glow">
          <div className="w-full max-w-sm rounded-3xl bg-[#fbf7f2] p-6 text-[#5d4133] shadow-xl" dir={ar ? 'rtl' : 'ltr'}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{ar ? 'ثبّت Soft Glow' : 'Install Soft Glow'}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={20}/></button>
            </div>
            {ios ? (
              <div className="space-y-3 text-sm leading-7">
                <p>{ar ? 'افتح الموقع في Safari، ثم:' : 'Open this website in Safari, then:'}</p>
                <p className="flex items-center gap-2"><Share2 size={19}/> {ar ? 'اضغط مشاركة' : 'Tap Share'}</p>
                <p className="flex items-center gap-2"><PlusSquare size={19}/> {ar ? 'اختر إضافة إلى الشاشة الرئيسية' : 'Choose Add to Home Screen'}</p>
                <p>{ar ? 'اضغط إضافة' : 'Tap Add'}</p>
              </div>
            ) : (
              <p className="text-sm leading-7">{ar
                ? 'افتح قائمة المتصفح (⋮) واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية. إذا لم يظهر الخيار، جرّب Chrome.'
                : 'Open your browser menu (⋮) and choose Install app or Add to Home screen. If unavailable, try Chrome.'}</p>
            )}
            <button type="button" onClick={() => setOpen(false)} className="mt-6 w-full rounded-full bg-[#5d4133] px-5 py-3 text-sm text-white">{ar ? 'حسناً' : 'Got it'}</button>
          </div>
        </div>
      )}
    </>
  );
}
