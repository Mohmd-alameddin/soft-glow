
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Pencil, Trash2, LogOut, Package,
  X, Save
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { saveProduct, deleteProduct, type ProductInput } from '../actions';
import type { AdminProduct } from './page';

const CATEGORIES = [
  { value: 'florals', label: 'Floral Creations' },
  { value: 'candles', label: 'Candles' },
  { value: 'decor', label: 'Gypsum & Decor' },
  { value: 'arabic', label: 'Arabic Art' },
  { value: 'personalized', label: 'Personalized Gifts' },
  { value: 'baby', label: 'Baby Gifts' },
  { value: 'seasonal', label: 'Seasonal' },
];

type EditorProduct = Omit<ProductInput, 'price'> & {
  price: string;
};

function makeEditor(product: AdminProduct): EditorProduct {
  return {
    id: product.id,
    name_en: product.name_en,
    name_ar: product.name_ar,
    category: product.category,
    price: product.price === null ? '' : String(product.price),
    image_url: product.image_url,
    description_en: product.description_en ?? '',
    description_ar: product.description_ar ?? '',
    is_active: product.is_active,
  };
}

export default function ProductManager({
  initialProducts,
  adminEmail,
}: {
  initialProducts: AdminProduct[];
  adminEmail: string;
}) {
  const router = useRouter();

  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<EditorProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const filtered = products.filter(p =>
    `${p.id} ${p.name_en} ${p.name_ar} ${p.category}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const publishedCount = products.filter(p => p.is_active).length;

  function startNew() {
    const nextId = Math.max(0, ...products.map(p => p.id)) + 1;

    setEditor({
      id: nextId,
      name_en: '',
      name_ar: '',
      category: 'candles',
      price: '',
      image_url: '/products/01.webp',
      description_en: '',
      description_ar: '',
      is_active: false,
    });

    setError('');
    setMessage('');
  }

  function editProduct(product: AdminProduct) {
    setEditor(makeEditor(product));
    setError('');
    setMessage('');
  }

  function update<K extends keyof EditorProduct>(
    key: K,
    value: EditorProduct[K]
  ) {
    setEditor(previous =>
      previous ? { ...previous, [key]: value } : previous
    );
  }

  async function handleSave() {
    if (!editor || saving) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload: ProductInput = {
        ...editor,
        price: editor.price.trim() === ''
          ? null
          : Number(editor.price),
      };

      await saveProduct(payload);

      const savedProduct: AdminProduct = {
        ...payload,
      };

      setProducts(previous => {
        const exists = previous.some(p => p.id === payload.id);

        return exists
          ? previous.map(p =>
              p.id === payload.id ? savedProduct : p
            )
          : [...previous, savedProduct].sort((a, b) => a.id - b.id);
      });

      setEditor(null);
      setMessage('Product saved successfully.');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save product.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: AdminProduct) {
    const confirmed = window.confirm(
      `Permanently delete "${product.name_en}"?`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      await deleteProduct(product.id);
      setProducts(previous =>
        previous.filter(p => p.id !== product.id)
      );
      setMessage('Product deleted.');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete product.'
      );
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] text-[#5d4133]">
      <header className="bg-white border-b border-[#e9ded3]">
        <div className="max-w-7xl mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="serif text-3xl">
              Soft <span className="italic text-[#a97b61]">Glow</span>
            </Link>
            <p className="text-xs text-[#78675e] mt-1">
              Product Management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs text-[#78675e]">
              {adminEmail}
            </span>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 border rounded-full px-4 py-2 text-sm"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="serif text-4xl">Products</h1>
            <p className="text-sm text-[#78675e] mt-2">
              Manage your Soft Glow catalog
            </p>
          </div>

          <button
            onClick={startNew}
            className="bg-[#5d4133] text-white rounded-full px-6 py-3 inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border rounded-xl p-5">
            <Package className="mb-3" size={22} />
            <p className="text-3xl font-semibold">{products.length}</p>
            <p className="text-sm text-[#78675e]">Total products</p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-3xl font-semibold">{publishedCount}</p>
            <p className="text-sm text-[#78675e]">Published</p>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-3xl font-semibold">
              {products.length - publishedCount}
            </p>
            <p className="text-sm text-[#78675e]">Unpublished</p>
          </div>
        </div>

        {message && (
          <p role="status" className="mb-5 text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="mb-5 text-red-700">
            {error}
          </p>
        )}

        <div className="bg-white rounded-2xl border border-[#e9ded3] overflow-hidden">
          <div className="p-5 border-b">
            <div className="flex items-center gap-3 border rounded-xl px-4 py-3 max-w-md">
              <Search size={18} />
              <input
                aria-label="Search products"
                placeholder="Search products..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f3eae1]">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-t">
                    <td className="p-4">{product.id}</td>
                    <td className="p-4">
                      <p className="font-medium">{product.name_en}</p>
                      <p className="text-xs text-[#78675e]" dir="rtl">
                        {product.name_ar}
                      </p>
                    </td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">
                      {product.price === null
                        ? 'On request'
                        : `$${Number(product.price).toFixed(2)}`}
                    </td>
                    <td className="p-4">
                      {product.is_active ? 'Published' : 'Draft'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => editProduct(product)}
                          aria-label={`Edit ${product.name_en}`}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(product)}
                          aria-label={`Delete ${product.name_en}`}
                          className="text-red-700"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="text-center py-12 text-[#78675e]">
                No products found.
              </p>
            )}
          </div>
        </div>

        {editor && (
          <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Product editor"
              className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="serif text-2xl">
                  {products.some(p => p.id === editor.id)
                    ? 'Edit Product'
                    : 'New Product'}
                </h2>

                <button
                  onClick={() => setEditor(null)}
                  aria-label="Close editor"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Product ID</label>
                  <input
                    type="number"
                    value={editor.id}
                    readOnly
                    className="w-full border rounded-xl px-4 py-3 bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    English name
                  </label>
                  <input
                    value={editor.name_en}
                    onChange={e => update('name_en', e.target.value)}
                    maxLength={150}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Arabic name
                  </label>
                  <input
                    dir="rtl"
                    value={editor.name_ar}
                    onChange={e => update('name_ar', e.target.value)}
                    maxLength={150}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Category</label>
                  <select
                    value={editor.category}
                    onChange={e => update('category', e.target.value)}
                    className="w-full border rounded-xl px-4 py-3"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Price (USD) — blank means on request
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editor.price}
                    onChange={e => update('price', e.target.value)}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Image path
                  </label>
                  <input
                    value={editor.image_url}
                    onChange={e => update('image_url', e.target.value)}
                    placeholder="/products/01.webp"
                    className="w-full border rounded-xl px-4 py-3"
                  />
                  <p className="text-xs text-[#78675e] mt-1">
                    Use an existing image from public/products.
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    English description
                  </label>
                  <textarea
                    rows={3}
                    value={editor.description_en}
                    onChange={e => update('description_en', e.target.value)}
                    maxLength={2000}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Arabic description
                  </label>
                  <textarea
                    dir="rtl"
                    rows={3}
                    value={editor.description_ar}
                    onChange={e => update('description_ar', e.target.value)}
                    maxLength={2000}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editor.is_active}
                    onChange={e => update('is_active', e.target.checked)}
                  />
                  Publish this product
                </label>

                {error && (
                  <p role="alert" className="text-red-700 text-sm">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#5d4133] text-white rounded-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
