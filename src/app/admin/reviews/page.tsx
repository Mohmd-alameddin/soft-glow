import { requireAdmin } from '@/lib/admin';
import ReviewManager from './ReviewManager';
export default async function AdminReviewsPage(){
 const {supabase}=await requireAdmin();
 const [reviewsResult,productsResult]=await Promise.all([
   supabase.from('customer_reviews').select('id,customer_name,rating,comment,product_id,source,verified_purchase,status,created_at').order('created_at',{ascending:false}).limit(500),
   supabase.from('products').select('id,name_en,name_ar').order('id')
 ]);
 if(reviewsResult.error) throw new Error(reviewsResult.error.message);
 if(productsResult.error) throw new Error(productsResult.error.message);
 return <ReviewManager
  reviews={(reviewsResult.data??[]).map(r=>({...r,id:Number(r.id),product_id:r.product_id===null?null:Number(r.product_id)}))}
  products={(productsResult.data??[]).map(p=>({id:Number(p.id),name_en:p.name_en,name_ar:p.name_ar}))}
 />;
}
