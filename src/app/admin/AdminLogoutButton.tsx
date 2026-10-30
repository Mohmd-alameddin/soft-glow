
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        setError('Unable to sign out. Please try again.');
        return;
      }

      router.replace('/admin/login');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-[#d8c7b8] bg-white px-5 py-3 text-sm font-medium text-[#9a4e3d] shadow-sm transition hover:border-[#c58b78] hover:bg-[#fff3ed] disabled:opacity-50"
      >
        <LogOut size={17} />

        {loading ? 'Signing out...' : 'Sign Out'}
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
