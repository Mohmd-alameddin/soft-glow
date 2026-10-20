
import { requireAdmin } from '@/lib/admin';
import ProductManager from './ProductManager';

export const dynamic = 'force-dynamic';

export type AdminProduct = {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
  price: number | null;
  image_url: string;
  description_en: string | null;
  description_ar: string | null;
  is_active: boolean;
};

export default async function AdminProductsPage() {
  const { supabase, user } = await requireAdmin();

  const { data, error } = await supabase
    .from('products')
    .select(
      'id,name_en,name_ar,category,price,image_url,description_en,description_ar,is_active'
    )
    .order('id', { ascending: true });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Unable to load products</h1>
        <p className="mt-3 text-red-700">{error.message}</p>
      </main>
    );
  }

  return (
    <ProductManager
      initialProducts={(data ?? []) as AdminProduct[]}
      adminEmail={user.email ?? 'Administrator'}
    />
  );
}
