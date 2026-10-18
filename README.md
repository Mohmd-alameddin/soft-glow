# Soft Glow — Next.js Storefront

A bilingual (English / Arabic, RTL) handmade-product storefront featuring 31 real Soft Glow photos.

## Requirements
- Node.js 20.9+ and npm

## Start locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Before taking orders
1. In `src/app/page.tsx`, replace `const WHATSAPP_NUMBER=''` with your actual WhatsApp business number in international format **digits only** (Lebanon begins with `961`; remove the leading zero from the local number). Without this, ordering buttons show a configuration message.
2. Edit names, categories, and prices in `src/data/products.ts`. Prices are currently `null` (shown as "Price on request"); set `price: 12` etc. only when you know your actual price in USD. You can also adjust the display currency in `src/app/page.tsx`.
3. Product images are `public/products/01.webp` through `31.webp`, optimized from your supplied photos. Replace any photo while retaining its filename, or update the matching product image path.
4. Check the Arabic translations and product categorization. Product labels are provisional.
5. Add your business policies (delivery fees, delivery areas, exchanges/returns, privacy) before launch. Do not publish claims about free delivery, materials, or certifications unless verified.

## Tech
Next.js App Router, React, TypeScript, Tailwind CSS 4, lucide-react. Cart quantities persist in browser localStorage. No payment processing, user accounts, inventory, or backend yet. Orders are prepared as a WhatsApp message; **no order is placed automatically**.

## Deploy
Push to GitHub, import into Vercel, and configure your custom domain. Test on phones and desktop before sharing publicly.
