/**
 * Onlayn darslik mavzulari (namuna sifatida yozilgan original matnlar).
 * Rasmiy darsliklarni ustozlar "Materiallar" bo'limidan PDF qilib yuklashi mumkin.
 */
export type LessonBlock =
  | { type: "p"; text: string }
  | { type: "rule"; title: string; text: string }
  | { type: "example"; title: string; text: string }
  | { type: "list"; title?: string; items: string[] };

export interface Lesson {
  id: string;
  subjectId: string;
  grades: [number, number];
  title: string;
  intro: string;
  minutes: number;
  blocks: LessonBlock[];
  quiz: { q: string; options: string[]; correct: number }[];
}

export const LESSONS: Lesson[] = [
  /* ===================== 1–4 SINFLAR ===================== */
  {
    id: "mat-qoshish", subjectId: "matematika", grades: [1, 2], minutes: 10,
    title: "Qo'shish va ayirish", intro: "Olmalar yordamida sonlarni qo'shish va ayirishni o'rganamiz 🍎",
    blocks: [
      { type: "p", text: "Savatda 3 ta olma bor edi. Oyijon yana 2 ta olma solib qo'ydi. Endi savatda nechta olma bor? Sanaymiz: 1, 2, 3 … 4, 5. Demak, 3 + 2 = 5." },
      { type: "rule", title: "Eslab qol!", text: "Qo'shishda narsalar ko'payadi (+). Ayirishda narsalar kamayadi (−). Natija '=' belgisidan keyin yoziladi." },
      { type: "example", title: "Ayirish misoli", text: "Daraxtda 7 ta qush o'tirgan edi. 3 tasi uchib ketdi. 7 − 3 = 4. Daraxtda 4 ta qush qoldi 🐦" },
      { type: "list", title: "Mashq qil:", items: ["4 + 3 = ?", "9 − 5 = ?", "6 + 4 = ?", "10 − 7 = ?"] },
    ],
    quiz: [
      { q: "5 + 3 = ?", options: ["7", "8", "9"], correct: 1 },
      { q: "10 − 4 = ?", options: ["6", "5", "7"], correct: 0 },
      { q: "Qaysi belgi qo'shishni bildiradi?", options: ["−", "+", "="], correct: 1 },
    ],
  },
  {
    id: "mat-kopaytirish", subjectId: "matematika", grades: [2, 4], minutes: 12,
    title: "Ko'paytirish nima?", intro: "Bir xil sonlarni tez qo'shishning sehrli usuli ✨",
    blocks: [
      { type: "p", text: "Har bir tarelkada 4 tadan shirinlik bor. Tarelkalar 3 ta. Hammasi nechta? 4 + 4 + 4 = 12. Buni qisqa yozamiz: 4 × 3 = 12." },
      { type: "rule", title: "Qoida", text: "Ko'paytirish — bir xil sonlarni bir necha marta qo'shish. O'rinlarini almashtirsak ham natija o'zgarmaydi: 4 × 3 = 3 × 4 = 12." },
      { type: "example", title: "Hayotiy misol", text: "Bir haftada 7 kun bor. 2 haftada nechta kun? 7 × 2 = 14 kun." },
      { type: "list", title: "Yodlab ol:", items: ["2 × 5 = 10", "3 × 3 = 9", "5 × 5 = 25", "6 × 7 = 42", "8 × 7 = 56"] },
    ],
    quiz: [
      { q: "3 × 4 = ?", options: ["7", "12", "14"], correct: 1 },
      { q: "5 + 5 + 5 ni ko'paytirish bilan yozing:", options: ["5 × 3", "5 × 5", "3 + 5"], correct: 0 },
      { q: "6 × 7 = ?", options: ["42", "36", "48"], correct: 0 },
    ],
  },
  {
    id: "mat-masala", subjectId: "matematika", grades: [2, 4], minutes: 12,
    title: "Masala yechishni o'rganamiz", intro: "Har qanday masalani 4 qadamda yechish mumkin 🧩",
    blocks: [
      { type: "list", title: "4 ta qadam:", items: ["1. Masalani diqqat bilan o'qi.", "2. Nima ma'lum, nima noma'lum — ajrat.", "3. Qaysi amal kerakligini o'yla (+, −, ×, :).", "4. Hisobla va javobni so'z bilan yoz."] },
      { type: "example", title: "Masala", text: "Aziz 12 ta daftar oldi, ukasi esa undan 5 ta kam. Ukasi nechta daftar olgan? Yechish: 12 − 5 = 7. Javob: ukasi 7 ta daftar olgan." },
      { type: "rule", title: "Maslahat", text: "'… ta ko'p' — qo'shish, '… ta kam' — ayirish, '… marta ko'p' — ko'paytirish." },
    ],
    quiz: [
      { q: "'5 ta kam' so'zi qaysi amalni bildiradi?", options: ["Qo'shish", "Ayirish", "Ko'paytirish"], correct: 1 },
      { q: "Javob qanday yoziladi?", options: ["Faqat son", "So'z bilan, to'liq", "Yozilmaydi"], correct: 1 },
      { q: "Malikada 8 ta gul bor, yana 4 ta oldi. Nechta bo'ldi?", options: ["4", "12", "32"], correct: 1 },
    ],
  },
  {
    id: "ona-tovush", subjectId: "onatili", grades: [1, 3], minutes: 10,
    title: "Unli va undosh tovushlar", intro: "Tovushlar — so'zlarning g'ishtchalari 🧱",
    blocks: [
      { type: "p", text: "Biz gapirganda tovushlarni talaffuz qilamiz. O'zbek tilida 6 ta unli tovush bor: a, o, u, e, i, o'. Qolganlari — undosh tovushlar." },
      { type: "rule", title: "Farqini bil!", text: "Unli tovushlar talaffuz qilinganda havo og'izdan erkin chiqadi, ularni cho'zib aytish mumkin: aaa, ooo. Undoshlarda havo to'siqqa uchraydi: b, d, k, m." },
      { type: "example", title: "Misol", text: "'Kitob' so'zida: k-i-t-o-b. Unlilar: i, o. Undoshlar: k, t, b." },
    ],
    quiz: [
      { q: "O'zbek tilida nechta unli tovush bor?", options: ["5", "6", "10"], correct: 1 },
      { q: "Qaysi biri unli?", options: ["m", "a", "k"], correct: 1 },
      { q: "'Ona' so'zida nechta unli bor?", options: ["1", "2", "3"], correct: 1 },
    ],
  },
  {
    id: "ona-gap", subjectId: "onatili", grades: [2, 4], minutes: 10,
    title: "Gap va uning turlari", intro: "Fikrimizni gap orqali aytamiz 💬",
    blocks: [
      { type: "p", text: "Gap — tugal fikr bildiradigan so'zlar birikmasi. Gap bosh harf bilan boshlanadi va oxirida tinish belgisi qo'yiladi." },
      { type: "list", title: "Gapning turlari:", items: ["Darak gap — xabar beradi: Bugun havo issiq.", "So'roq gap — savol beradi: Sen qayerga borasan?", "Buyruq gap — buyruq, iltimos: Kitobni o'qing.", "His-hayajon gap — kuchli tuyg'u: Qanday go'zal!"] },
      { type: "rule", title: "Eslab qol!", text: "Darak gap oxirida nuqta (.), so'roq gapda so'roq belgisi (?), his-hayajon gapda undov belgisi (!) qo'yiladi." },
    ],
    quiz: [
      { q: "'Sen kitob o'qidingmi?' — qanday gap?", options: ["Darak", "So'roq", "Buyruq"], correct: 1 },
      { q: "Gap qanday harf bilan boshlanadi?", options: ["Kichik", "Bosh", "Farqi yo'q"], correct: 1 },
      { q: "'Voy, qanday chiroyli!' oxirida qaysi belgi?", options: ["!", "?", "."], correct: 0 },
    ],
  },
  {
    id: "oqish-ifodali", subjectId: "oqish", grades: [1, 4], minutes: 8,
    title: "Ifodali o'qish sirlari", intro: "Matnni jonli va chiroyli o'qishni o'rganamiz 🎭",
    blocks: [
      { type: "list", title: "Yaxshi o'quvchining 5 qoidasi:", items: ["Shoshilmasdan, aniq o'qi.", "Nuqtada to'xta, vergulda biroz nafas ol.", "So'roq gapni so'rayotgandek o'qi.", "Qahramonlar ovozini o'zgartirib ko'r.", "O'qib bo'lgach, nimani tushunganingni aytib ber."] },
      { type: "p", text: "Har kuni 10 daqiqa ovoz chiqarib o'qisang, bir oyda o'qish tezliging ancha oshadi!" },
    ],
    quiz: [
      { q: "Nuqtada nima qilamiz?", options: ["To'xtaymiz", "Tezlashamiz", "Qichqiramiz"], correct: 0 },
      { q: "Har kuni necha daqiqa o'qish tavsiya qilinadi?", options: ["1", "10", "60"], correct: 1 },
      { q: "So'roq gapni qanday o'qiymiz?", options: ["So'rayotgandek", "Pichirlab", "Juda tez"], correct: 0 },
    ],
  },
  {
    id: "oqish-ertak", subjectId: "oqish", grades: [2, 4], minutes: 8,
    title: "Ertak va hikoya farqi", intro: "Sehrli dunyo va hayotiy voqealar 🏰",
    blocks: [
      { type: "rule", title: "Ertak", text: "Ertakda sehrli voqealar bo'ladi: hayvonlar gapiradi, uchar gilam uchadi. Odatda 'Bor ekan, yo'q ekan…' deb boshlanadi va yaxshilik g'alaba qiladi." },
      { type: "rule", title: "Hikoya", text: "Hikoyada hayotda bo'lishi mumkin bo'lgan voqealar aytiladi. Qahramonlar oddiy odamlar." },
      { type: "example", title: "Topshiriq", text: "Sevimli ertagingni esla. Undagi yaxshi va yomon qahramonlarni ayt." },
    ],
    quiz: [
      { q: "'Bor ekan, yo'q ekan…' bilan nima boshlanadi?", options: ["Ertak", "She'r", "Maqol"], correct: 0 },
      { q: "Hikoyada voqealar qanday?", options: ["Sehrli", "Hayotiy", "Faqat hayvonlar haqida"], correct: 1 },
      { q: "Ertakda odatda kim g'alaba qiladi?", options: ["Yomonlik", "Yaxshilik", "Hech kim"], correct: 1 },
    ],
  },
  {
    id: "tab-fasl", subjectId: "tabiiy", grades: [1, 3], minutes: 8,
    title: "Yil fasllari", intro: "Bahor, yoz, kuz va qish 🌸☀️🍂❄️",
    blocks: [
      { type: "p", text: "Bir yilda 4 ta fasl bor. Har bir fasl 3 oydan iborat. Jami 12 oy." },
      { type: "list", items: ["🌸 Bahor: mart, aprel, may — daraxtlar gullaydi.", "☀️ Yoz: iyun, iyul, avgust — eng issiq vaqt.", "🍂 Kuz: sentabr, oktabr, noyabr — barglar sarg'ayadi, hosil yig'iladi.", "❄️ Qish: dekabr, yanvar, fevral — qor yog'adi."] },
      { type: "example", title: "Kuzat!", text: "Hozir qaysi fasl? Derazadan qara va 3 ta belgisini ayt." },
    ],
    quiz: [
      { q: "Bir yilda nechta fasl bor?", options: ["3", "4", "12"], correct: 1 },
      { q: "Qaysi faslda barglar sarg'ayadi?", options: ["Bahor", "Kuz", "Yoz"], correct: 1 },
      { q: "Yanvar qaysi fasl?", options: ["Qish", "Yoz", "Bahor"], correct: 0 },
    ],
  },
  {
    id: "tab-suv", subjectId: "tabiiy", grades: [2, 4], minutes: 10,
    title: "Suv — hayot manbai", intro: "Suvsiz hayot yo'q 💧",
    blocks: [
      { type: "p", text: "Suv uch holatda bo'ladi: qattiq (muz, qor), suyuq (daryo, yomg'ir) va gaz (bug')." },
      { type: "rule", title: "Tajriba", text: "Muzni iliq xonaga qo'ysang, eriydi — suyuq suvga aylanadi. Choynakdagi suv qaynasa, bug'ga aylanadi." },
      { type: "list", title: "Suvni tejaymiz:", items: ["Tish yuvayotganda jo'mrakni yop.", "Oqayotgan jo'mrakni kattalarga ayt.", "Gullarni kechqurun sug'or."] },
    ],
    quiz: [
      { q: "Muz — suvning qaysi holati?", options: ["Qattiq", "Suyuq", "Gaz"], correct: 0 },
      { q: "Suv qaynasa nimaga aylanadi?", options: ["Muzga", "Bug'ga", "Qumga"], correct: 1 },
      { q: "Suvni tejash uchun:", options: ["Jo'mrakni ochiq qoldiramiz", "Tish yuvganda jo'mrakni yopamiz"], correct: 1 },
    ],
  },
  {
    id: "eng-colors", subjectId: "ingliz", grades: [1, 3], minutes: 8,
    title: "Colors — Ranglar", intro: "Ingliz tilida ranglarni o'rganamiz 🌈",
    blocks: [
      { type: "list", items: ["🔴 red — qizil", "🟢 green — yashil", "🔵 blue — ko'k", "🟡 yellow — sariq", "⚪ white — oq", "⚫ black — qora", "🩷 pink — pushti"] },
      { type: "example", title: "Gap tuzamiz", text: "The sky is blue. — Osmon ko'k. The grass is green. — O't yashil." },
    ],
    quiz: [
      { q: "'Yashil' inglizcha:", options: ["red", "green", "blue"], correct: 1 },
      { q: "'yellow' nima degani?", options: ["sariq", "oq", "pushti"], correct: 0 },
      { q: "The sky is …", options: ["blue", "black", "pink"], correct: 0 },
    ],
  },
  {
    id: "eng-family", subjectId: "ingliz", grades: [2, 4], minutes: 8,
    title: "My family — Mening oilam", intro: "Oila a'zolarini inglizcha aytamiz 👨‍👩‍👧‍👦",
    blocks: [
      { type: "list", items: ["mother — ona", "father — ota", "sister — opa/singil", "brother — aka/uka", "grandmother — buvi", "grandfather — buva"] },
      { type: "example", title: "Gaplar", text: "This is my mother. — Bu mening onam. I love my family. — Men oilamni yaxshi ko'raman." },
    ],
    quiz: [
      { q: "'brother' nima degani?", options: ["aka/uka", "opa", "buva"], correct: 0 },
      { q: "'Ona' inglizcha:", options: ["father", "mother", "sister"], correct: 1 },
      { q: "I love my …", options: ["family", "blue", "seven"], correct: 0 },
    ],
  },

  /* ===================== 5–11 SINFLAR ===================== */
  {
    id: "mat-kasr", subjectId: "matematika", grades: [5, 6], minutes: 15,
    title: "Oddiy kasrlar", intro: "Butunning qismlari bilan ishlash",
    blocks: [
      { type: "p", text: "Kasr a/b ko'rinishda yoziladi: a — surat (nechta qism olindi), b — maxraj (butun nechta teng qismga bo'lindi). Masalan, 3/4 — butunni 4 qismga bo'lib, 3 tasini olish." },
      { type: "rule", title: "Kasrlarni qo'shish", text: "Maxrajlari bir xil bo'lsa — suratlar qo'shiladi: 2/7 + 3/7 = 5/7. Har xil bo'lsa — umumiy maxrajga keltiriladi: 1/2 + 1/3 = 3/6 + 2/6 = 5/6." },
      { type: "rule", title: "Qisqartirish", text: "Surat va maxrajni bir xil songa bo'lish mumkin: 6/8 = 3/4 (ikkalasi 2 ga bo'lindi)." },
      { type: "example", title: "Masala", text: "Pitsaning 3/8 qismini Ali, 2/8 qismini Vali yedi. Jami: 5/8. Qolgan qismi: 1 − 5/8 = 3/8." },
    ],
    quiz: [
      { q: "1/4 + 2/4 = ?", options: ["3/8", "3/4", "1/2"], correct: 1 },
      { q: "8/12 ni qisqartiring:", options: ["2/3", "4/5", "3/4"], correct: 0 },
      { q: "Kasrning pastki qismi:", options: ["Surat", "Maxraj", "Kasr chizig'i"], correct: 1 },
    ],
  },
  {
    id: "mat-foiz", subjectId: "matematika", grades: [5, 6], minutes: 12,
    title: "Foizlar", intro: "1% — sonning yuzdan bir qismi",
    blocks: [
      { type: "rule", title: "Ta'rif", text: "Sonning 1 foizi — uning 1/100 qismi. 25% = 25/100 = 1/4." },
      { type: "example", title: "Sonning foizini topish", text: "200 ning 15% i: 200 × 15 / 100 = 30." },
      { type: "example", title: "Chegirma", text: "Kitob 40 000 so'm, chegirma 20%. Chegirma: 8 000 so'm. Yangi narx: 32 000 so'm." },
    ],
    quiz: [
      { q: "50% qaysi kasrga teng?", options: ["1/2", "1/5", "5/10 emas"], correct: 0 },
      { q: "300 ning 10% i:", options: ["3", "30", "300"], correct: 1 },
      { q: "100 000 so'mlik narsa 25% arzonlashdi. Yangi narx:", options: ["75 000", "25 000", "80 000"], correct: 0 },
    ],
  },
  {
    id: "alg-chiziqli", subjectId: "algebra", grades: [7, 9], minutes: 15,
    title: "Chiziqli tenglamalar", intro: "ax + b = 0 ko'rinishidagi tenglamalarni yechish",
    blocks: [
      { type: "p", text: "Tenglama — noma'lum qatnashgan tenglik. Uni yechish — tenglikni to'g'ri qiladigan noma'lum qiymatini topish demakdir." },
      { type: "list", title: "Yechish algoritmi:", items: ["Qavslarni oching.", "Noma'lumli hadlarni chap tomonga, sonlarni o'ng tomonga o'tkazing (ishorani almashtirib!).", "O'xshash hadlarni ixchamlang.", "Ikkala tomonni noma'lum oldidagi koeffitsiyentga bo'ling.", "Tekshiring."] },
      { type: "example", title: "Misol", text: "3(x − 2) = x + 8 → 3x − 6 = x + 8 → 3x − x = 8 + 6 → 2x = 14 → x = 7. Tekshirish: 3·5 = 15, 7 + 8 = 15 ✔" },
    ],
    quiz: [
      { q: "5x = 35 ⇒ x = ?", options: ["7", "30", "175"], correct: 0 },
      { q: "x + 9 = 4 ⇒ x = ?", options: ["13", "−5", "5"], correct: 1 },
      { q: "Hadni boshqa tomonga o'tkazganda:", options: ["Ishora o'zgarmaydi", "Ishora qarama-qarshisiga o'zgaradi"], correct: 1 },
    ],
  },
  {
    id: "alg-kvadrat", subjectId: "algebra", grades: [8, 11], minutes: 18,
    title: "Kvadrat tenglamalar", intro: "ax² + bx + c = 0 va diskriminant",
    blocks: [
      { type: "rule", title: "Diskriminant", text: "D = b² − 4ac. D > 0 — ikki ildiz; D = 0 — bitta ildiz; D < 0 — haqiqiy ildiz yo'q." },
      { type: "rule", title: "Ildizlar formulasi", text: "x₁,₂ = (−b ± √D) / (2a)" },
      { type: "example", title: "Misol", text: "x² − 7x + 10 = 0: a = 1, b = −7, c = 10. D = 49 − 40 = 9. x₁ = (7 + 3)/2 = 5, x₂ = (7 − 3)/2 = 2." },
      { type: "rule", title: "Viyet teoremasi", text: "Keltirilgan tenglama x² + px + q = 0 uchun: x₁ + x₂ = −p, x₁·x₂ = q. Yuqoridagi misolda: 5 + 2 = 7, 5·2 = 10 ✔" },
    ],
    quiz: [
      { q: "x² − 4x + 4 = 0 da D = ?", options: ["0", "32", "−16"], correct: 0 },
      { q: "D < 0 bo'lsa:", options: ["2 ta ildiz", "1 ta ildiz", "Haqiqiy ildiz yo'q"], correct: 2 },
      { q: "x² − 5x + 6 = 0 ildizlari:", options: ["2 va 3", "−2 va −3", "1 va 6"], correct: 0 },
    ],
  },
  {
    id: "geo-pifagor", subjectId: "geometriya", grades: [8, 11], minutes: 15,
    title: "Pifagor teoremasi", intro: "To'g'ri burchakli uchburchak tomonlari orasidagi bog'lanish",
    blocks: [
      { type: "rule", title: "Teorema", text: "To'g'ri burchakli uchburchakda gipotenuza kvadrati katetlar kvadratlari yig'indisiga teng: c² = a² + b²." },
      { type: "example", title: "Misol", text: "Katetlar 6 va 8 bo'lsa: c² = 36 + 64 = 100, c = 10." },
      { type: "p", text: "Mashhur 'Misr uchburchagi' — tomonlari 3, 4, 5. Qadimda quruvchilar to'g'ri burchak yasash uchun 12 ta tugunli arqondan foydalanishgan." },
    ],
    quiz: [
      { q: "Katetlar 3 va 4. Gipotenuza:", options: ["5", "7", "25"], correct: 0 },
      { q: "Gipotenuza — bu:", options: ["To'g'ri burchak qarshisidagi tomon", "Eng qisqa tomon", "Balandlik"], correct: 0 },
      { q: "c = 13, a = 5 ⇒ b = ?", options: ["8", "12", "18"], correct: 1 },
    ],
  },
  {
    id: "fiz-tezlik", subjectId: "fizika", grades: [6, 9], minutes: 15,
    title: "Mexanik harakat va tezlik", intro: "Jism qancha tez harakatlanadi?",
    blocks: [
      { type: "rule", title: "Formula", text: "v = s / t. Tezlik (v) = bosib o'tilgan yo'l (s) / vaqt (t). SI birligi — m/s." },
      { type: "rule", title: "Birliklarni o'tkazish", text: "1 km/soat = 1000 m / 3600 s ≈ 0,28 m/s. 72 km/soat = 20 m/s (3,6 ga bo'lamiz)." },
      { type: "example", title: "Masala", text: "Velosipedchi 15 minutda 4,5 km yo'l bosdi. t = 900 s, s = 4500 m. v = 4500 / 900 = 5 m/s." },
    ],
    quiz: [
      { q: "s = 100 m, t = 20 s. v = ?", options: ["5 m/s", "2000 m/s", "80 m/s"], correct: 0 },
      { q: "36 km/soat = ? m/s", options: ["10", "36", "3,6"], correct: 0 },
      { q: "Yo'l formulasi:", options: ["s = v·t", "s = v/t", "s = t/v"], correct: 0 },
    ],
  },
  {
    id: "fiz-nyuton", subjectId: "fizika", grades: [7, 11], minutes: 18,
    title: "Nyutonning uchta qonuni", intro: "Klassik mexanikaning asosi",
    blocks: [
      { type: "rule", title: "I qonun (inersiya)", text: "Jismga kuch ta'sir qilmasa (yoki kuchlar muvozanatda bo'lsa), u tinch turadi yoki to'g'ri chiziqli tekis harakatlanadi." },
      { type: "rule", title: "II qonun", text: "F = m·a. Jismning tezlanishi unga ta'sir etuvchi kuchga to'g'ri, massasiga teskari proporsional." },
      { type: "rule", title: "III qonun", text: "Ta'sir aks ta'sirga teng va qarama-qarshi yo'nalgan: F₁ = −F₂." },
      { type: "example", title: "Hayotda", text: "Avtobus keskin to'xtasa, yo'lovchilar oldinga og'adi (I qonun). Raketa gazni orqaga otib, oldinga uchadi (III qonun)." },
    ],
    quiz: [
      { q: "m = 2 kg, a = 3 m/s². F = ?", options: ["6 N", "1,5 N", "5 N"], correct: 0 },
      { q: "Raketaning uchishi qaysi qonunga misol?", options: ["I", "II", "III"], correct: 2 },
      { q: "Kuchning birligi:", options: ["Joul", "Nyuton", "Vatt"], correct: 1 },
    ],
  },
  {
    id: "kim-atom", subjectId: "kimyo", grades: [7, 11], minutes: 15,
    title: "Atom tuzilishi", intro: "Moddaning eng kichik zarrachalari ichida nima bor?",
    blocks: [
      { type: "p", text: "Atom musbat zaryadli yadro va uning atrofida harakatlanuvchi elektronlardan iborat. Yadroda protonlar (+) va neytronlar (zaryadsiz) joylashgan." },
      { type: "rule", title: "Muhim!", text: "Protonlar soni = elementning tartib raqami = elektronlar soni (neytral atomda). Neytronlar = massa soni − protonlar." },
      { type: "example", title: "Misol: Uglerod ¹²C", text: "Tartib raqami 6 → 6 proton, 6 elektron. Neytronlar: 12 − 6 = 6." },
    ],
    quiz: [
      { q: "Proton zaryadi:", options: ["Musbat", "Manfiy", "Zaryadsiz"], correct: 0 },
      { q: "Kislorod (8-element) atomida nechta elektron?", options: ["8", "16", "6"], correct: 0 },
      { q: "²³Na (11-element) da nechta neytron?", options: ["11", "12", "23"], correct: 1 },
    ],
  },
  {
    id: "bio-hujayra", subjectId: "biologiya", grades: [5, 9], minutes: 15,
    title: "Hujayra — hayot birligi", intro: "Barcha tirik organizmlar hujayralardan tuzilgan",
    blocks: [
      { type: "list", title: "Hujayra qismlari:", items: ["Membrana — hujayrani o'rab turadi, moddalar almashinuvini boshqaradi.", "Sitoplazma — ichki suyuq muhit.", "Yadro — irsiy axborotni (DNK) saqlaydi.", "Mitoxondriya — energiya ishlab chiqaradi.", "Xloroplast — faqat o'simliklarda, fotosintez joyi."] },
      { type: "rule", title: "O'simlik va hayvon hujayrasi farqi", text: "O'simlik hujayrasida qattiq hujayra devori, xloroplastlar va katta vakuola bor. Hayvon hujayrasida ular yo'q." },
    ],
    quiz: [
      { q: "DNK qayerda saqlanadi?", options: ["Yadroda", "Membranada", "Vakuolada"], correct: 0 },
      { q: "Fotosintez qayerda boradi?", options: ["Mitoxondriyada", "Xloroplastda", "Yadroda"], correct: 1 },
      { q: "Hujayra devori kimda bor?", options: ["O'simlikda", "Hayvonda", "Ikkalasida"], correct: 0 },
    ],
  },
  {
    id: "tar-temur", subjectId: "tarix", grades: [5, 11], minutes: 15,
    title: "Amir Temur va temuriylar davlati", intro: "XIV–XV asrlarda Markaziy Osiyo",
    blocks: [
      { type: "p", text: "Amir Temur 1336-yilda Kesh (hozirgi Shahrisabz) yaqinidagi Xo'ja Ilg'or qishlog'ida tug'ilgan. 1370-yilda Movarounnahrda hokimiyatni qo'lga olib, Samarqandni poytaxt qildi." },
      { type: "list", title: "Asosiy faktlar:", items: ["Davlat boshqaruvi qoidalari 'Temur tuzuklari'da bayon etilgan.", "Samarqandda Bibixonim masjidi, Shohi Zinda ansambli qurildi.", "Nabirasi Mirzo Ulug'bek Samarqandda mashhur rasadxona qurdirgan.", "Amir Temur 1405-yilda O'trorda vafot etgan."] },
      { type: "rule", title: "Shiori", text: "'Kuch — adolatdadir' — Temur davlatining asosiy tamoyili sifatida mashhur." },
    ],
    quiz: [
      { q: "Amir Temur davlatining poytaxti:", options: ["Buxoro", "Samarqand", "Hirot"], correct: 1 },
      { q: "Rasadxona qurdirgan temuriy:", options: ["Ulug'bek", "Shohrux", "Bobur"], correct: 0 },
      { q: "Amir Temur hokimiyatga kelgan yil:", options: ["1336", "1370", "1405"], correct: 1 },
    ],
  },
  {
    id: "inf-algoritm", subjectId: "informatika", grades: [5, 8], minutes: 12,
    title: "Algoritm va uning turlari", intro: "Kompyuter qanday 'o'ylaydi'?",
    blocks: [
      { type: "rule", title: "Ta'rif", text: "Algoritm — maqsadga erishish uchun aniq ketma-ketlikda bajariladigan buyruqlar to'plami." },
      { type: "list", title: "Turlari:", items: ["Chiziqli — buyruqlar ketma-ket bajariladi (choy damlash).", "Tarmoqlanuvchi — shartga qarab yo'l tanlanadi (yomg'ir yog'sa — soyabon ol).", "Takrorlanuvchi (sikl) — buyruq bir necha marta bajariladi (10 marta o'tirib-tur)."] },
      { type: "example", title: "Blok-sxema", text: "Oval — boshlanish/tugash, to'rtburchak — amal, romb — shart, parallelogramm — kiritish/chiqarish." },
    ],
    quiz: [
      { q: "Shart qaysi shaklda chiziladi?", options: ["Romb", "Oval", "Doira"], correct: 0 },
      { q: "'Agar … bo'lsa' — qaysi algoritm?", options: ["Chiziqli", "Tarmoqlanuvchi", "Sikl"], correct: 1 },
      { q: "Takrorlanuvchi algoritm boshqacha:", options: ["Sikl", "Shart", "O'zgaruvchi"], correct: 0 },
    ],
  },
  {
    id: "inf-python", subjectId: "informatika", grades: [7, 11], minutes: 18,
    title: "Python: birinchi dastur", intro: "O'zgaruvchilar, input() va print()",
    blocks: [
      { type: "example", title: "Salomlashuvchi dastur", text: "ism = input(\"Ismingiz: \")\nyosh = int(input(\"Yoshingiz: \"))\nprint(\"Salom,\", ism + \"!\")\nprint(\"5 yildan keyin\", yosh + 5, \"yoshda bo'lasiz\")" },
      { type: "rule", title: "Ma'lumot turlari", text: "int — butun son (15), float — kasr son (3.14), str — matn (\"salom\"), bool — True/False." },
      { type: "rule", title: "Diqqat!", text: "input() har doim matn (str) qaytaradi. Son kerak bo'lsa int() yoki float() bilan o'giring." },
    ],
    quiz: [
      { q: "input() qanday tur qaytaradi?", options: ["int", "str", "bool"], correct: 1 },
      { q: "Ekranga chiqarish funksiyasi:", options: ["print()", "show()", "echo()"], correct: 0 },
      { q: "3.14 qaysi tur?", options: ["int", "float", "str"], correct: 1 },
    ],
  },
  {
    id: "ona-turkum", subjectId: "onatili", grades: [5, 11], minutes: 15,
    title: "So'z turkumlari", intro: "Mustaqil va yordamchi so'z turkumlari",
    blocks: [
      { type: "list", title: "Mustaqil so'z turkumlari:", items: ["Ot — kim? nima? (kitob, Toshkent)", "Sifat — qanday? (chiroyli, baland)", "Son — nechta? nechanchi? (besh, uchinchi)", "Olmosh — ot, sifat, son o'rnida (men, bu, hamma)", "Fe'l — nima qildi? (o'qidi, yozmoqda)", "Ravish — qanday? qachon? (tez, ertaga)"] },
      { type: "rule", title: "Yordamchi so'zlar", text: "Ko'makchi (uchun, bilan), bog'lovchi (va, lekin), yuklama (-mi, faqat) — mustaqil ma'noga ega emas, gapda bog'lash va ma'no qo'shish vazifasini bajaradi." },
    ],
    quiz: [
      { q: "'Chiroyli' qaysi turkum?", options: ["Ot", "Sifat", "Fe'l"], correct: 1 },
      { q: "'va' qaysi turkum?", options: ["Bog'lovchi", "Ko'makchi", "Olmosh"], correct: 0 },
      { q: "'Ertaga' qaysi turkum?", options: ["Ravish", "Son", "Ot"], correct: 0 },
    ],
  },
  {
    id: "adab-navoiy", subjectId: "adabiyot", grades: [5, 11], minutes: 15,
    title: "Alisher Navoiy ijodi", intro: "O'zbek mumtoz adabiyotining cho'qqisi",
    blocks: [
      { type: "p", text: "Alisher Navoiy 1441-yilda Hirotda tug'ilgan, 1501-yilda vafot etgan. U turkiy (eski o'zbek) tilda ulkan asarlar yaratib, bu tilning boyligini isbotladi." },
      { type: "list", title: "'Xamsa' (Beshlik) dostonlari:", items: ["Hayrat ul-abror", "Farhod va Shirin", "Layli va Majnun", "Sab'ai sayyor", "Saddi Iskandariy"] },
      { type: "rule", title: "Muhim asar", text: "'Muhokamat ul-lug'atayn' (1499) — turkiy va forsiy tillarni qiyoslagan ilmiy asar." },
    ],
    quiz: [
      { q: "Navoiy tug'ilgan shahar:", options: ["Samarqand", "Hirot", "Buxoro"], correct: 1 },
      { q: "'Xamsa' nechta dostondan iborat?", options: ["3", "5", "7"], correct: 1 },
      { q: "Qaysi doston 'Xamsa'ga kiradi?", options: ["Farhod va Shirin", "O'tkan kunlar", "Kecha va kunduz"], correct: 0 },
    ],
  },
  {
    id: "eng-tenses", subjectId: "ingliz", grades: [5, 11], minutes: 15,
    title: "Present Simple vs Present Continuous", intro: "Doimiy harakat va hozir bo'layotgan harakat",
    blocks: [
      { type: "rule", title: "Present Simple", text: "Odat, doimiy holat: I go to school every day. She likes music. (he/she/it + -s)" },
      { type: "rule", title: "Present Continuous", text: "Ayni paytda bo'layotgan harakat: I am reading now. They are playing football. (am/is/are + V-ing)" },
      { type: "list", title: "Signal so'zlar:", items: ["Simple: always, usually, every day, often", "Continuous: now, at the moment, look!, listen!"] },
    ],
    quiz: [
      { q: "She ___ tea every morning.", options: ["drinks", "is drinking", "drink"], correct: 0 },
      { q: "Look! The baby ___.", options: ["sleeps", "is sleeping", "sleep"], correct: 1 },
      { q: "'Now' qaysi zamon signali?", options: ["Present Simple", "Present Continuous"], correct: 1 },
    ],
  },
];

export function lessonsFor(subjectId: string, grade: number) {
  return LESSONS.filter((l) => l.subjectId === subjectId && grade >= l.grades[0] && grade <= l.grades[1]);
}

export function getLesson(id: string) {
  return LESSONS.find((l) => l.id === id);
}
