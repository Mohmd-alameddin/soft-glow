export type Category = 'florals'|'candles'|'decor'|'arabic'|'personalized'|'baby'|'seasonal';
export type Product = { id:number; en:string; ar:string; category:Category; price:number|null; image:string };
const names:[string,string,Category][] = [
['Pink floral vase set','طقم مزهريات وردية','florals'],['Pink floral bouquet','باقة زهور وردية','florals'],['Mini floral vase set','طقم مزهريات صغير','florals'],['Personalized mini vases','مزهريات صغيرة مخصصة','personalized'],['Baby welcome plaque','لوحة ترحيب بالمولود','baby'],['Neutral floral vase','مزهرية ورود هادئة','florals'],['Arabic graduation plaque','لوحة تخرج عربية','arabic'],['Arabic gift tray set','طقم صينية هدية عربية','arabic'],['Arabic calligraphy plate','طبق خط عربي','arabic'],['Graduation keepsakes','تذكارات تخرج','personalized'],['Decorative lidded jar','وعاء مزخرف بغطاء','decor'],['Graduation plaques','لوحات تخرج','arabic'],['Arabic blessing plaque','لوحة دعاء عربية','arabic'],['Personalized photo plaque','لوحة صور مخصصة','personalized'],['Gold detail keepsake','تذكار بتفاصيل ذهبية','decor'],['Golden keepsake trio','مجموعة تذكارات ذهبية','decor'],['Blue decorative favors','توزيعات زرقاء مزخرفة','decor'],['Personalized golden keepsake','تذكار ذهبي مخصص','personalized'],['Arabic decorative plaque','لوحة زخرفية عربية','arabic'],['Rose bouquet arrangement','تنسيق باقة ورد','florals'],['Personalized photo frame','إطار صورة مخصص','personalized'],['Arabic quote plaque','لوحة اقتباس عربي','arabic'],['Personalized floral name tray','صينية ورود باسم مخصص','personalized'],['Baby teddy gift favors','هدايا دببة للمواليد','baby'],['Baby shower favors','توزيعات استقبال المولود','baby'],['Daisy candle design','شمعة بتصميم الأقحوان','candles'],['Butterfly candle jar','مرطبان شمعة بالفراشات','candles'],['Personalized flower tray','صينية ورود مخصصة','personalized'],['Gift candle bowl','وعاء شمعة للهدايا','candles'],['Pumpkin candle set','مجموعة شموع اليقطين','seasonal'],['Autumn pumpkin gift box','صندوق هدايا خريفي','seasonal']
];
// Temporary estimated prices in USD
// Change these values whenever you confirm real prices.
const temporaryPrices = [
  8, 6, 10, 5, 12, 7, 9, 4,
  11, 8, 6, 10, 5, 9, 12, 7,
  4, 8, 11, 6, 10, 5, 9, 12,
  7, 4, 8, 11, 6, 10, 5
];

export const products: Product[] = names.map(
  ([en, ar, category], i) => ({
    id: i + 1,
    en,
    ar,
    category,
    price: temporaryPrices[i],
    image: `/products/${String(i + 1).padStart(2, '0')}.webp`
  })
);