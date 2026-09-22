# Frontend Standartlari va Qoidalari (Frontend Rules)

## 1. 320px Ultra-Mobil Moslashuvchanlik Qoidasi (Majburiy)
- Barcha sahifalar, kartochkalar, modallar va formalarni **320px (iPhone SE 1st gen / kichik telefonlar)** ekran kengligida mukammal ishlashini ta'minlash shart.
- Hech qanday gorizontal skroll (`overflow-x`) bo'lishi mumkin emas.
- Tashqi padding: `px-2.5 sm:px-4`.
- Tugmalar guruhi 320px da erkin sig'ishi shart (`grid-cols-3 sm:grid-cols-5 gap-1.5`, `py-2 px-1 text-[11px]`).
- Har bir modal oynasi `max-w-[300px]` yoki `max-w-sm` chegarasida bo'lishi kerak.

## 2. Multi-Photo (Bir nechta rasm olish)
- Har bir karobka uchun 1 dan ortiq rasm olish va saqlash (`photoUrls: string[]`).
- Kamerada ketma-ket kadr olish, sonini ko'rsatish (`📸 2 ta olindi`) va "Tayyor" tugmasi.
- Galereyadan bir nechta fayl tanlash (`multiple`).
- Olingan rasmlarni ko'rish (Lightbox zoom) va bittalab o'chirish imkoniyati.

## 3. Terminologiya
- "Og'irlik" (Brutto emas)
- "Karobka og'irligi" (Tara emas)
- "Toza vazn" (Netto emas)

## 4. Fast Mode
- Rasm olingach darhol `Karobka kodi` inputiga fokus berish.

## 5. Entry Sahifalarida Navbar va MobileNav Yashirilishi (To'liq Ekran Maydoni)
- `/entry/` bilan bog'liq sahifalarda (kiritish formasi va yuklanganlar ro'yxati):
  - Yuqoridagi global **Navbar** ("Mandarin Logistics | Standalone Web") butunlay yashiriladi.
  - Pastdagi **MobileNav** paneli ham butunlay yashiriladi.
  - Sahifaning o'zining ixcham maxsus headeri (Ortga qaytish, Reys kodi, Yuklanganlar, Fast Mode, Kamera) eng yuqorida turadi.
  - Bu operator uchun butun ekran bo'ylab 100% tarozi va kiritish maydonini taqdim etadi.


