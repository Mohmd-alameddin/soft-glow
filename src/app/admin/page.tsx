import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import {
  ArrowUpRight, BadgeDollarSign, Boxes, Calculator, Factory,
  LayoutDashboard, Package, Receipt, ShoppingBag, Star,
  TrendingUp, Wallet, Layers3, Store,
} from 'lucide-react';

const panels = [
  { title: 'Orders', ar: 'الطلبات', description: 'Payments, fulfillment and customer orders', href: '/admin/orders', icon: ShoppingBag, accent: 'bg-orange-100 text-orange-800' },
  { title: 'Products', ar: 'المنتجات', description: 'Manage your storefront catalog', href: '/admin/products', icon: Package, accent: 'bg-rose-100 text-rose-800' },
  { title: 'Finance', ar: 'المالية', description: 'Revenue, expenses and profit', href: '/admin/finance', icon: TrendingUp, accent: 'bg-emerald-100 text-emerald-800' },
  { title: 'Reviews', ar: 'التقييمات', description: 'Approve, hide and manage feedback', href: '/admin/reviews', icon: Star, accent: 'bg-amber-100 text-amber-800' },
  { title: 'Materials', ar: 'المواد الأولية', description: 'Raw materials and unit costs', href: '/admin/materials', icon: Layers3, accent: 'bg-violet-100 text-violet-800' },
  { title: 'Purchases', ar: 'المشتريات', description: 'Record material purchases', href: '/admin/purchases', icon: Receipt, accent: 'bg-sky-100 text-sky-800' },
  { title: 'Costing', ar: 'التكلفة', description: 'Calculate product production costs', href: '/admin/costing', icon: Calculator, accent: 'bg-teal-100 text-teal-800' },
  { title: 'Sales', ar: 'المبيعات', description: 'Manage sales records', href: '/admin/sales', icon: BadgeDollarSign, accent: 'bg-lime-100 text-lime-800' },
  { title: 'Inventory', ar: 'المخزون', description: 'Raw material stock movements', href: '/admin/inventory', icon: Boxes, accent: 'bg-indigo-100 text-indigo-800' },
  { title: 'Production', ar: 'الإنتاج', description: 'Production batches and consumption', href: '/admin/production', icon: Factory, accent: 'bg-fuchsia-100 text-fuchsia-800' },
];

export default async function AdminDashboard() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-[#faf7f3] text-[#30251e]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#9a5d38]">Soft Glow · Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Business Control Center</h1>
            <p className="mt-3 text-sm text-[#7b6e64] sm:text-base">Your business, organized in one beautiful place. <span lang="ar">إدارة متجرك من مكان واحد</span></p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#e7dcd2] bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-[#a87455] hover:text-[#9a5d38]">
            <Store size={17} /> View storefront <ArrowUpRight size={16} />
          </Link>
        </header>

        <section className="mb-9 overflow-hidden rounded-3xl bg-gradient-to-br from-[#614737] via-[#86614b] to-[#ae8060] px-6 py-8 text-white shadow-lg sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs tracking-wide"><LayoutDashboard size={14}/> ADMIN WORKSPACE</div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Welcome to Soft Glow</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">Manage orders, products, payments and every detail behind your handmade creations.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#614737] transition hover:bg-[#f8e9db]"><ShoppingBag size={17}/> Orders</Link>
              <Link href="/admin/finance" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Wallet size={17}/> Finance</Link>
            </div>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Management panels</h2>
            <p className="mt-1 text-sm text-[#8b7b6f]">Choose a section to manage your store.</p>
          </div>
          <span className="text-xs font-medium text-[#9a5d38]">{panels.length} sections</span>
        </div>
        <section aria-label="Admin management panels" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {panels.map(({title,ar,description,href,icon:Icon,accent}) => (
            <Link key={href} href={href} className="group flex min-h-48 flex-col justify-between rounded-2xl border border-[#e9e1da] bg-white p-5 shadow-[0_3px_15px_rgba(57,38,22,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#d7b89e] hover:shadow-[0_14px_32px_rgba(57,38,22,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a5d38]">
              <div className="flex items-start justify-between gap-2">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}><Icon size={23} strokeWidth={1.8}/></span>
                <ArrowUpRight size={19} className="text-[#a99a8e] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#9a5d38]" />
              </div>
              <div className="mt-6">
                <div className="flex flex-wrap items-baseline gap-x-2"><h3 className="text-lg font-semibold">{title}</h3><span lang="ar" className="text-xs text-[#927e70]">{ar}</span></div>
                <p className="mt-1 text-sm leading-5 text-[#85766b]">{description}</p>
              </div>
            </Link>
          ))}
        </section>
        <footer className="mt-10 border-t border-[#e9e1da] pt-5 text-center text-xs text-[#9b8b80]">Soft Glow · Handmade with love · Admin only</footer>
      </div>
    </main>
  );
}
