'use server';
import { randomBytes, createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function setReviewStatus(formData: FormData) {
 const {supabase}=await requireAdmin();
 const id=Number(formData.get('id'));
 const status=String(formData.get('status'));
 if(!Number.isSafeInteger(id)||id<1||!['approved','rejected','pending'].includes(status)) throw new Error('Invalid review');
 const {error}=await supabase.from('customer_reviews').update({status}).eq('id',id);
 if(error) throw new Error(error.message);
 revalidatePath('/admin/reviews');revalidatePath('/');
}
export async function createReviewInvitation(formData: FormData) {
 const {supabase}=await requireAdmin();
 const productValue=String(formData.get('product_id')??'');
 const productId=productValue?Number(productValue):null;
 if(productId!==null&&(!Number.isSafeInteger(productId)||productId<1)) throw new Error('Invalid product');
 const label=String(formData.get('customer_label')??'').trim().slice(0,100);
 const token=randomBytes(24).toString('hex');
 const tokenHash=createHash('sha256').update(token).digest('hex');
 const {error}=await supabase.from('review_invitations').insert({token_hash:tokenHash,product_id:productId,customer_label:label});
 if(error) throw new Error(error.message);
 revalidatePath('/admin/reviews');
 return token;
}

export async function deleteReview(formData: FormData) {
 const {supabase}=await requireAdmin();
 const id=Number(formData.get('id'));
 if(!Number.isSafeInteger(id)||id<1) throw new Error('Invalid review ID');
 const {error}=await supabase.from('customer_reviews').delete().eq('id',id);
 if(error) throw new Error(error.message);
 revalidatePath('/admin/reviews');
 revalidatePath('/');
}
