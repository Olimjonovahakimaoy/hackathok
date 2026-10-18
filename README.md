# SmartSchool 🏫👀

Maktab uchun to'liq onlayn platforma: o'quvchi kitob-daftar ko'tarmaydi — darsliklar, uy ishlari, baholar, davomat, reyting va ustoz bilan aloqa bir joyda.

**Texnologiyalar:** Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · JWT sessiya (jose) · bcrypt · Anthropic Claude (AI yordamchi)

---

## 1. Ishga tushirish (3 qadam)

Talab: **Node.js 20.9+** (tavsiya: 22 LTS) — https://nodejs.org

```bash
npm install
npm run dev
```

Brauzerda oching: **http://localhost:3000**

Birinchi ishga tushishda `data/` papkasida demo maktab avtomatik yaratiladi: 11 sinf (1-A … 11-A), 99 o'quvchi, 12 ustoz, ota-onalar, 6 haftalik baho/davomat/vazifa tarixi.

### Demo hisoblar

| Kim | Login | Parol |
|---|---|---|
| Ma'muriyat (admin) | `admin` | `Admin2026` |
| Ustoz — matematika, 5–11 sinflar | `j.alimov` | `Ustoz2026` |
| Ustoz — 3-A sinf rahbari | `d.karimova` | `Ustoz2026` |
| O'quvchi — 3-A (bolalar dizayni + o'yinlar) | `sardor.toshmatov` | `Oquvchi2026` |
| O'quvchi — 8-A (yuqori sinf dizayni) | `madina.toshmatova` | `Oquvchi2026` |
| Ota-ona (ikki farzandi bor) | `dilshod.toshmatov` | `OtaOna2026` |

Qolgan 200+ foydalanuvchining login/paroli: **`data/credentials.csv`** (Excel'da ochiladi).

Bazani noldan qayta yaratish: `npm run seed` (⚠️ barcha ma'lumot o'chadi).

---

## 2. Imkoniyatlar

### Kirish
- Har bir o'quvchi, ustoz, ota-ona va ma'muriyatning **o'z unikal login-paroli**.
- Login sahifasi rol tanlash bilan (rasmdagi palitra asosida). Kirgach har kim **o'z bo'limiga**, o'quvchi esa **o'z sinfiga** yo'naltiriladi.
- Admin yaratgan yangi hisob birinchi kirishda parolni almashtirishga majbur.
- Parol o'zgarsa — barcha eski sessiyalar avtomatik bekor bo'ladi.

### O'quvchi — 1–4 sinflar (bolalar dizayni)
- Ko'k osmon, tepaliklar, ko'zcha-maskot, katta rangli tugmalar.
- **4 ta o'quv o'yini:** Tez hisob, Juftini top (xotira), So'z yig', Kattami-kichikmi. Har biri 3 tagacha ⭐ beradi, qiyinlik sinfga qarab o'zgaradi.
- Darsliklar, vazifalar, baholar, reyting, davomat, AI yordamchi, ustozga yozish.

### O'quvchi — 5–11 sinflar
- Statistik panel: o'rtacha baho, reyting (sinfda/maktabda o'rni), uy ishlari %, davomat.
- Bugungi dars jadvali (hozirgi dars belgilanadi), yaqin muddatlar, ustozlar izohi, fanlar bo'yicha o'rtacha.

### Uy ishi va vazifalar
- **Rasmga olib topshirish** (telefon kamerasi to'g'ridan-to'g'ri ochiladi), galereyadan bir nechta rasm yoki PDF.
- **Elektron javob** — matn ko'rinishida.
- **Test** — o'quvchi yechadi, avtomatik tekshiriladi, baho darhol jurnalga tushadi.
- Ustoz tekshirgunga qadar javobni o'zgartirish mumkin; ustoz "qayta ishlashga" qaytarishi mumkin.
- Rasmlar yuborishdan oldin brauzerda siqiladi (trafik tejaladi).

### Ustoz
- Barcha sinflari kartochkalarda: o'quvchilar soni, sinf reytingi, bugungi davomat, tekshirilmagan ishlar.
- **Sinf sahifasi:** o'quvchilar ro'yxati (F.I.Sh., tug'ilgan sana, login, ota-ona va telefoni, baho, davomat, reyting), elektron **jurnal**, **davomat**, vazifalar, reyting.
- **O'quvchi kartasi:** to'liq ma'lumot, ota-onasi, reyting tarkibi, barcha baholar, oxirgi topshiriqlar.
- **Vazifa berish:** uy ishi / sinf ishi / test (savollar konstruktori), fayl biriktirish, bir nechta sinfga birdaniga.
- **Tekshirish:** o'quvchi rasmiga qizil/yashil ruchka bilan **belgi qo'yish**, xatolar ro'yxati, tayyor izohlar, baho 2–5. Baholagach keyingi ish avtomatik ochiladi.
- Test tahlili: har bir savolga necha foiz to'g'ri javob berilgani.
- Materiallar (darslik PDF, konspekt) qo'shish, AI metodik yordamchi, xabarlar.

### Ota-ona
- Har bir farzand bo'yicha: baholar, uy ishlari (topshirgan ishini ham ko'radi), davomat, reyting.
- Avtomatik ogohlantirishlar: uy ishi qarzi, darsga kelmagan kunlar, qoniqarsiz baholar.
- Farzandiga dars beradigan har bir ustoz bilan to'g'ridan-to'g'ri chat.

### Ma'muriyat
- Boshqaruv paneli: o'quvchilar, davomat (qaysi sinf belgilamagan), **ustozlar faolligi** (tekshirilmagan ishlar soni).
- Foydalanuvchi yaratish (o'quvchi + ota-onasi birga), parolni tiklash, o'chirish, sinfga ko'chirish.
- **Kirish kartochkalari:** butun sinf uchun yangi parollar yaratib, chop etish.
- Sinflar: sinf rahbari, har bir fanga ustoz biriktirish, dars jadvali.

### Reyting (sinf va maktab — alohida)
```
Jami 100 ball =
  Baholar o'rtachasi       → 50 ball  (o'rtacha ÷ 5 × 50)
  Uy ishlarini bajarish    → 30 ball  (o'z vaqtida = 1, kechikkan = 0.5, topshirmagan = 0)
  Vazifa/test natijalari   → 20 ball  (tekshirilgan ishlar o'rtacha foizi)
```
Sinf reytingi, maktab reytingi (barchasi / 1–4 / 5–11) va **sinflar bellashuvi** alohida ko'rsatiladi. Har bir yangi baho yoki topshirilgan uy ishi reytingni darhol o'zgartiradi.

### Darsliklar
- 26 ta original mavzu (matematika, ona tili, o'qish, tabiiy fan, ingliz tili, algebra, geometriya, fizika, kimyo, biologiya, tarix, informatika, adabiyot) — har birida qoida, misol va o'z-o'zini tekshirish testi.
- Ustozlar rasmiy darslik PDF va konspektlarni "Materiallar" bo'limidan qo'shadi.

---

## 3. AI yordamchini yoqish

1. https://console.anthropic.com dan API kalit oling.
2. Loyiha papkasida `.env.local` fayli yarating:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Serverni qayta ishga tushiring.

AI o'quvchiga **uy ishini tayyor yechib bermaydi** — bosqichma-bosqich tushuntiradi va yo'naltiruvchi savol beradi. Kichik sinflar uchun sodda til. Limit: o'quvchi soatiga 40 ta, ustoz 80 ta savol. Kalit bo'lmasa AI bo'limi "yoqilmagan" deb ko'rsatadi, qolgan hamma narsa ishlaydi.

---

## 4. Serverga joylash (production)

```bash
npm install
npm run build
npm start            # 3000-port
```

`.env.local` (yoki server muhit o'zgaruvchilari):
```
AUTH_SECRET=<kamida 32 belgili tasodifiy satr>
ANTHROPIC_API_KEY=...
SCHOOL_NAME="12-umumta'lim maktabi"
```

- **HTTPS** majburiy (Caddy yoki Nginx + Let's Encrypt). Maktab ichki tarmog'ida `http://192.168.x.x` orqali ham ishlaydi — cookie protokolga qarab sozlanadi.
- Jarayonni doimiy ushlab turish: `pm2 start npm --name smartschool -- start`
- **Zaxira nusxa:** butun ma'lumot `data/` papkasida (`db.json` + `uploads/`). Uni har kuni nusxalang.
- Demo hisoblar ro'yxati productionda login sahifasida ko'rinmaydi (`SHOW_DEMO_ACCOUNTS=1` bilan yoqiladi).
- Haqiqiy maktab uchun: `npm run seed` o'rniga admin bilan kirib, sinflar va foydalanuvchilarni o'zingiz yarating (yoki `src/lib/seed.ts` ni o'z ro'yxatingizga moslang).

---

## 5. Loyiha tuzilishi

```
src/
  proxy.ts              — rol bo'yicha yo'naltirish (Next 16 "middleware")
  app/
    login/              — kirish sahifasi + server action
    student/            — o'quvchi bo'limi (1–4 va 5–11 dizayni)
    teacher/            — ustoz bo'limi (jurnal, davomat, tekshirish…)
    parent/             — ota-ona bo'limi
    admin/              — ma'muriyat
    account/            — profil va parol
    api/upload|files|messages|ai — fayl yuklash, xavfsiz fayl berish, chat, AI (stream)
  components/           — UI, chat, o'yinlar, rasmga belgi qo'yish, jurnal…
  lib/
    db.ts               — ma'lumotlar ombori (navbatli atomik yozish)
    auth.ts, session.ts — JWT sessiya, bcrypt, rol tekshiruvi
    access.ts           — kim nimani ko'ra oladi (barcha ruxsatlar shu yerda)
    stats.ts            — reyting, baholar, davomat hisoblari
    lessons.ts          — onlayn darslik mavzulari
    seed.ts             — demo ma'lumotlar generatori
```

## 6. Xavfsizlik
- Parollar bcrypt bilan xeshlanadi, sessiya — imzolangan httpOnly cookie.
- Har bir sahifa va API ichida ruxsat qayta tekshiriladi: o'quvchi boshqa o'quvchining rasmini ko'ra olmaydi, ota-ona faqat o'z farzandini, ustoz faqat o'z sinflarini ko'radi.
- Login urinishlari cheklangan (10 daqiqada 8 marta), yuklanadigan fayl turi ichidagi baytlar bo'yicha tekshiriladi (faqat rasm/PDF, 10 MB gacha).

## 7. Bilib qo'yish kerak bo'lgan cheklovlar
- **Ma'lumotlar bazasi — JSON fayl.** Bitta maktab uchun yetarli va o'rnatish oson (alohida baza serveri kerak emas). Bir nechta maktab yoki katta yuklama uchun `src/lib/db.ts` interfeysini saqlagan holda PostgreSQL'ga o'tkazish kerak.
- Chat har 4 soniyada yangilanadi (WebSocket emas).
- SMS/Telegram bildirishnomalar yo'q.
- Darsliklardagi mavzular — namunaviy original matnlar; rasmiy darsliklar litsenziyasi maktab/vazirlik tomonidan hal qilinadi.

---

## 6. Netlify'da demo (muhim)

- Netlify'da fayl tizimi faqat o'qish uchun, shuning uchun demo baza vaqtinchalik papkada (`/tmp`) avtomatik yaratiladi. Demo hisoblar (`admin / Admin2026` va h.k.) har bir server nusxasida bir xil ID va parol bilan yaratiladi, shu sababli kirish ishlaydi.
- ⚠️ Netlify'da kiritilgan yangi ma'lumotlar (baho, vazifa, fayl) doimiy saqlanmaydi — server qayta ishga tushganda demo holatiga qaytadi. Haqiqiy maktab uchun VPS (`npm start`) yoki PostgreSQL kerak.
- Netlify → Site configuration → Environment variables ga `AUTH_SECRET` (kamida 32 belgili tasodifiy satr) qo'shing va qayta deploy qiling.
