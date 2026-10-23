'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

type ExpenseInput = {
 id?: number | null;
 spent_on: string;
 category: string;
 description: string;
 amount: number;
 notes: string;
};

export async function saveExpense(input: ExpenseInput) {
 const { supabase } = await requireAdmin();
 if (!/^\d{4}-\d{2}-\d{2}$/.test(input.spent_on)) throw new Error('Invalid date');
 const category = input.category.trim().slice(0, 80);
 const description = input.description.trim().slice(0, 250);
 const notes = (input.notes || '').trim().slice(0, 1000);
 const amount = Number(input.amount);
 if (!category || !description || !Number.isFinite(amount) || amount < 0) throw new Error('Invalid expense');
 const payload = { spent_on: input.spent_on, category, description, amount: Math.round(amount * 100) / 100, notes };
 if (input.id) {
   const { error } = await supabase.from('operating_expenses').update(payload).eq('id', input.id);
   if (error) throw new Error(error.message);
 } else {
   const { error } = await supabase.from('operating_expenses').insert(payload);
   if (error) throw new Error(error.message);
 }
 revalidatePath('/admin/finance');
 return { ok: true };
}

export async function deleteExpense(id: number) {
 const { supabase } = await requireAdmin();
 if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid expense id');
 const { error } = await supabase.from('operating_expenses').delete().eq('id', id);
 if (error) throw new Error(error.message);
 revalidatePath('/admin/finance');
 return { ok: true };
}
