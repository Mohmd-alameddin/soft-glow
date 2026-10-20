
import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();

  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/admin/login');
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    redirect('/admin/login?error=unauthorized');
  }

  return { supabase, user };
}
