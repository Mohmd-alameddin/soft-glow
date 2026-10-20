
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError || !data.user) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', data.user.id)
      .single();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      setError('This account is not authorized to manage Soft Glow.');
      setLoading(false);
      return;
    }

    router.replace('/admin/products');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e9ded3] p-8">
        <Link href="/" className="block text-center serif text-4xl text-[#5d4133] mb-2">
          Soft <span className="italic text-[#a97b61]">Glow</span>
        </Link>

        <p className="text-center text-sm text-[#78675e] mb-8">
          Administrator Login
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          {error && (
            <p role="alert" className="text-red-700 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5d4133] text-white rounded-full py-3 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
