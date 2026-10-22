
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Pencil, Trash2, LogOut, Package,
  X, Save
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { saveProduct, deleteProduct, type ProductInput, type ColorOption } from '../actions';
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
    candle_colors: [],
    gypsum_colors: [],
    wax_scents: [],
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
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);


  const filtered = products.filter(p =>
    `${p.id} ${p.name_en} ${p.name_ar} ${p.category}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const publishedCount = products.filter(p => p.is_active).length;

  function startNew() {
    const nextId = Math.max(0, ...products.map(p => p.id)) + 1;

    setGallery([]);
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
      candle_colors: [],
      gypsum_colors: [],
      wax_scents: [],
    });

    setError('');
    setMessage('');
  }

  async function editProduct(product: AdminProduct) {
    setEditor(makeEditor(product));
    setError('');
    setMessage('');
    setGallery([]);
    setGalleryLoading(true);
    try {
      const supabase = createClient();
      const { data, error: readError } = await supabase.from('products')
        .select('gallery_urls,candle_colors,gypsum_colors,wax_scents').eq('id', product.id).single();
      if (readError) throw readError;
      setGallery(Array.isArray(data?.gallery_urls) ? data.gallery_urls : []);
      setEditor(previous => previous && previous.id === product.id ? {
        ...previous,
        candle_colors: Array.isArray(data?.candle_colors) ? data.candle_colors as ColorOption[] : [],
        gypsum_colors: Array.isArray(data?.gypsum_colors) ? data.gypsum_colors as ColorOption[] : [],
        wax_scents: Array.isArray(data?.wax_scents) ? data.wax_scents as string[] : [],
      } : previous);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load product images.');
    } finally {
      setGalleryLoading(false);
    }
  }

  function update<K extends keyof EditorProduct>(
    key: K,
    value: EditorProduct[K]
  ) {
    setEditor(previous =>
      previous ? { ...previous, [key]: value } : previous
    );
  }

  async function uploadImages(files: FileList | null, asMain: boolean) {
    if (!files?.length || !editor || uploading) return;
    setUploading(true);
    setError('');
    try {
      const supabase = createClient();
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error('Only JPG, PNG, or WebP images are allowed.');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Each image must be smaller than 5 MB.');
        }
        const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        const path = `${editor.id}/${filename}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images').upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      if (asMain) {
        update('image_url', urls[0]);
        if (urls.length > 1) setGallery(previous => [...previous, ...urls.slice(1)]);
      } else {
        setGallery(previous => [...previous, ...urls]);
      }
      setMessage('Images uploaded. Click Save Product to publish the changes.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!editor || saving || uploading || galleryLoading) return;

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
      const supabase = createClient();
      const { error: galleryError } = await supabase.from('products')
        .update({ gallery_urls: gallery }).eq('id', payload.id);
      if (galleryError) throw new Error(`Product saved, but gallery failed: ${galleryError.message}`);

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

                <div className="rounded-xl border border-[#e9ded3] bg-[#fbf7f2] p-4 space-y-3">
                  <p className="font-semibold">Product photos</p>
                  <p className="text-xs text-[#78675e]">Upload JPG, PNG or WebP (max 5 MB each). Uploads are stored immediately; click Save Product to link them to the product.</p>
                  <label className="block text-sm font-medium">Upload main photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
                      onChange={e => { void uploadImages(e.target.files, true); e.target.value = ''; }}
                      className="block w-full mt-2 text-sm" />
                  </label>
                  <label className="block text-sm font-medium">Upload extra photos
                    <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading}
                      onChange={e => { void uploadImages(e.target.files, false); e.target.value = ''; }}
                      className="block w-full mt-2 text-sm" />
                  </label>
                  {uploading && <p className="text-sm">Uploading photos...</p>}
                  {galleryLoading && <p className="text-sm">Loading existing photos...</p>}
                  {editor.image_url && <div><p className="text-xs mb-1">Main photo</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editor.image_url} alt="Main product" className="h-28 w-28 rounded-lg object-cover" />
                  </div>}
                  {gallery.length > 0 && <div className="flex flex-wrap gap-3">
                    {gallery.map((url, index) => <div key={`${url}-${index}`} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Extra photo ${index + 1}`} className="h-24 w-24 rounded-lg object-cover" />
                      <button type="button" aria-label={`Remove photo ${index + 1}`}
                        onClick={() => setGallery(previous => previous.filter((_, i) => i !== index))}
                        className="absolute right-0 top-0 bg-white rounded-full p-1 shadow"><X size={15}/></button>
                      <div className="flex justify-center gap-2 mt-1">
                        <button type="button" disabled={index === 0} aria-label="Move image left"
                          onClick={() => setGallery(previous => { const next = [...previous]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>←</button>
                        <button type="button" disabled={index === gallery.length - 1} aria-label="Move image right"
                          onClick={() => setGallery(previous => { const next = [...previous]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}>→</button>
                      </div>
                    </div>)}
                  </div>}
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


                <div className="border-t pt-5 space-y-3">
                  <h3 className="text-lg font-semibold">Candle colors (optional)</h3>
                  <p className="text-xs text-[#78675e]">Leave empty to hide candle colors on the customer page.</p>
                  {editor.candle_colors.map((color, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-center">
                      <input type="color" aria-label={`Candle color ${i + 1}`} value={color.hex}
                        onChange={e => update('candle_colors', editor.candle_colors.map((c, j) => j === i ? {...c, hex:e.target.value} : c))}
                        className="w-12 h-11 cursor-pointer" />
                      <input aria-label={`Candle color name ${i + 1}`} placeholder="e.g. Ocean Blue" maxLength={60} value={color.name}
                        onChange={e => update('candle_colors', editor.candle_colors.map((c, j) => j === i ? {...c, name:e.target.value} : c))}
                        className="flex-1 min-w-32 border rounded-xl px-3 py-2" />
                      <button type="button" onClick={() => update('candle_colors', editor.candle_colors.filter((_,j)=>j!==i))}
                        className="text-red-700 px-2" aria-label="Remove candle color"><X size={18}/></button>
                    </div>
                  ))}
                  <button type="button" disabled={editor.candle_colors.length >= 30}
                    onClick={() => update('candle_colors', [...editor.candle_colors, {name:'',hex:'#D8C1A8'}])}
                    className="border rounded-full px-4 py-2 text-sm">+ Add candle color</button>
                </div>

                <div className="border-t pt-5 space-y-3">
                  <h3 className="text-lg font-semibold">Gypsum colors (optional)</h3>
                  <p className="text-xs text-[#78675e]">These colors are independent of candle colors.</p>
                  {editor.gypsum_colors.map((color, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-center">
                      <input type="color" aria-label={`Gypsum color ${i + 1}`} value={color.hex}
                        onChange={e => update('gypsum_colors', editor.gypsum_colors.map((c, j) => j === i ? {...c, hex:e.target.value} : c))}
                        className="w-12 h-11 cursor-pointer" />
                      <input aria-label={`Gypsum color name ${i + 1}`} placeholder="e.g. Sage Green" maxLength={60} value={color.name}
                        onChange={e => update('gypsum_colors', editor.gypsum_colors.map((c, j) => j === i ? {...c, name:e.target.value} : c))}
                        className="flex-1 min-w-32 border rounded-xl px-3 py-2" />
                      <button type="button" onClick={() => update('gypsum_colors', editor.gypsum_colors.filter((_,j)=>j!==i))}
                        className="text-red-700 px-2" aria-label="Remove gypsum color"><X size={18}/></button>
                    </div>
                  ))}
                  <button type="button" disabled={editor.gypsum_colors.length >= 30}
                    onClick={() => update('gypsum_colors', [...editor.gypsum_colors, {name:'',hex:'#A5B9A1'}])}
                    className="border rounded-full px-4 py-2 text-sm">+ Add gypsum color</button>
                </div>

                <div className="border-t pt-5 space-y-3">
                  <h3 className="text-lg font-semibold">Wax scents (optional)</h3>
                  <p className="text-xs text-[#78675e]">Leave empty for products without wax or fragrance choices.</p>
                  {editor.wax_scents.map((scent, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input aria-label={`Wax scent ${i + 1}`} placeholder="e.g. Rose Wonderland" maxLength={80} value={scent}
                        onChange={e => update('wax_scents', editor.wax_scents.map((s,j)=>j===i?e.target.value:s))}
                        className="flex-1 border rounded-xl px-3 py-2" />
                      <button type="button" onClick={() => update('wax_scents', editor.wax_scents.filter((_,j)=>j!==i))}
                        className="text-red-700 px-2" aria-label="Remove wax scent"><X size={18}/></button>
                    </div>
                  ))}
                  <button type="button" disabled={editor.wax_scents.length >= 50}
                    onClick={() => update('wax_scents', [...editor.wax_scents, ''])}
                    className="border rounded-full px-4 py-2 text-sm">+ Add wax scent</button>
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
                  disabled={saving || uploading || galleryLoading}
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
