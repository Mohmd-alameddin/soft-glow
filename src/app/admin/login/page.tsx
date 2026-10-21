
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError || !data.user) {
        setError(loginError?.message || 'Login failed.');
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        setError('You do not have administrator access.');
        return;
      }

      router.replace('/admin/products');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] flex items-center justify-center px-5 py-12 text-[#5d4133]">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg border border-[#e9ded3]">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-semibold">
            Soft <span className="italic text-[#a97b61]">Glow</span>
          </Link>

          <h1 className="text-2xl font-semibold mt-6">
            Admin Login
          </h1>

          <p className="text-sm text-[#78675e] mt-2">
            Sign in to manage your products
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-[#ded4c9] px-4 py-3 outline-none focus:border-[#a97b61]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#ded4c9] px-4 py-3 outline-none focus:border-[#a97b61]"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#5d4133] py-3.5 font-semibold text-white hover:bg-[#795b4b] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[#78675e] underline"
          >
            Back to Soft Glow website
          </Link>
        </div>
      </div>
    </main>
  );
}
