import bcrypt from "bcryptjs";
import type {
  Assignment,
  AttendanceDay,
  AttendanceStatus,
  Database,
  GameStat,
  Grade,
  GradeType,
  Material,
  Message,
  SchoolClass,
  Submission,
  Teaching,
  TestQuestion,
  User,
} from "./types";
import { newId, generatePassword, setSeedMode } from "./ids";
import { subjectsForGrade } from "./subjects";
import { addDays, isSchoolDay, localDate, tashkentToIso } from "./dates";
import { threadIdFor } from "./threads";
import { toLogin } from "./translit";
import { gradeFromPercent } from "./grading";

/* ------------------------------------------------------------------ */
/*  Deterministik tasodif (har safar bir xil demo ma'lumot)            */
/* ------------------------------------------------------------------ */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260902);
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const chance = (p: number) => rng() < p;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Ismlar                                                             */
/* ------------------------------------------------------------------ */
const BOY_NAMES = ["Aziz", "Bobur", "Doniyor", "Elyor", "Farrux", "Islom", "Javohir", "Jahongir", "Kamron", "Mirjalol", "Muhammadali", "Nodir", "Otabek", "Rustam", "Samandar", "Sanjar", "Shohruh", "Temur", "Umid", "Xurshid", "Yusuf", "Zafar", "Abdulloh", "Asadbek", "Behruz", "Diyorbek", "Ibrohim", "Lazizbek", "Ozodbek", "Sherzod"];
const GIRL_NAMES = ["Aziza", "Barno", "Dilnoza", "Durdona", "Feruza", "Gulnoza", "Hilola", "Iroda", "Kamola", "Laylo", "Madina", "Malika", "Mohinur", "Munisa", "Nigora", "Nilufar", "Oydin", "Robiya", "Sabina", "Sevara", "Shahzoda", "Zarina", "Zilola", "Yasmina", "Asal", "Bonu", "Charos", "Mubina", "Sarvinoz", "Xadicha"];
const SURNAMES = ["Abdullayev", "Alimov", "Aminov", "Azimov", "Bakirov", "Ergashev", "Fayzullayev", "Hamidov", "Ismoilov", "Jo'rayev", "Karimov", "Komilov", "Latipov", "Mahmudov", "Mirzayev", "Nazarov", "Normatov", "Qodirov", "Rahimov", "Rasulov", "Saidov", "Salimov", "Sharipov", "Tursunov", "Umarov", "Usmonov", "Valiyev", "Xolmatov", "Yo'ldoshev", "Yusupov", "Zokirov", "Sobirov", "Hasanov", "G'aniyev"];
const FATHER_NAMES = ["Anvar", "Bahodir", "Dilshod", "Farhod", "G'ayrat", "Ilhom", "Jamshid", "Ravshan", "Rustam", "Shavkat", "Sherali", "Ulug'bek", "Akmal", "Botir", "Komil", "Mansur"];
const MOTHER_NAMES = ["Dilfuza", "Gulchehra", "Gulnora", "Lola", "Manzura", "Nodira", "Shoira", "Umida", "Zuhra", "Mohira", "Sanobar", "Yulduz"];
const DISTRICTS = ["Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Yakkasaroy", "Olmazor", "Shayxontohur", "Uchtepa", "Sergeli", "Mirobod", "Yashnobod"];
const STREETS = ["Bunyodkor", "Qatortol", "Navro'z", "Bog'ishamol", "Mustaqillik", "Amir Temur", "Lutfiy", "Muqimiy", "Shota Rustaveli", "Farg'ona yo'li"];

const femaleSurname = (s: string) => (/(ov|ev|yev)$/.test(s) ? s + "a" : s);
const phone = () =>
  `+998 ${pick(["90", "91", "93", "94", "97", "99", "88", "33"])} ${randInt(100, 999)} ${String(randInt(0, 99)).padStart(2, "0")} ${String(randInt(0, 99)).padStart(2, "0")}`;

/* ------------------------------------------------------------------ */
/*  Vazifa shablonlari                                                 */
/* ------------------------------------------------------------------ */
type Tpl = { t: string; d: string };
const HW: Record<string, Tpl[]> = {
  "onatili:kids": [
    { t: "Harflarni chiroyli yozish", d: "Daftaringizga 'A', 'B', 'D' harflarini 2 qatordan chiroyli qilib yozing." },
    { t: "So'zlarni bo'g'inlarga ajratish", d: "Darslikdagi 12-mashqdagi so'zlarni bo'g'inlarga ajrating: ki-tob, maktab..." },
    { t: "Gap tuzish", d: "'Bahor', 'quyosh', 'gul' so'zlari bilan 3 ta gap tuzing." },
    { t: "Imlo mashqi", d: "Matnni ko'chirib yozing va tushirib qoldirilgan harflarni qo'ying." },
  ],
  "onatili:pro": [
    { t: "Ot so'z turkumi — mashqlar", d: "Darslikdagi 45-46-mashqlarni bajaring. Atoqli va turdosh otlarni ajratib yozing." },
    { t: "Qo'shma gaplar tahlili", d: "Berilgan 5 ta qo'shma gapni sintaktik tahlil qiling, bog'lovchilarni belgilang." },
    { t: "Insho: 'Mening orzuim'", d: "Kamida 150 so'zdan iborat insho yozing. Reja tuzishni unutmang." },
    { t: "Fe'l zamonlari", d: "Matndagi fe'llarni topib, zamonini aniqlang va jadval tuzing." },
  ],
  oqish: [
    { t: "Ertakni o'qish va qayta hikoya qilish", d: "'Zumrad va Qimmat' ertagini o'qing, 5 gap bilan qisqacha yozing." },
    { t: "She'r yodlash", d: "Darslikdagi 'Ona yurtim' she'rini yod oling va ifodali o'qing." },
    { t: "Savollarga javob", d: "Matnni o'qib, oxiridagi 4 ta savolga to'liq javob yozing." },
  ],
  matematika: [
    { t: "Qo'shish va ayirish misollari", d: "Darslikdagi 34-betdagi 1-5-misollarni yeching." },
    { t: "Masala yechish", d: "3 ta masalani yeching, shartini va javobini to'liq yozing." },
    { t: "Ko'paytirish jadvali", d: "7 va 8 ga ko'paytirish jadvalini yod oling va daftarga yozing." },
    { t: "Kasrlar ustida amallar", d: "112-114-misollar: kasrlarni qo'shing va qisqartiring." },
    { t: "Geometrik shakllar perimetri", d: "To'g'ri to'rtburchak va kvadrat perimetrini topishga oid 4 ta masala." },
  ],
  tabiiy: [
    { t: "Kuz fasli kuzatuvi", d: "Hovlingizdagi daraxtlarni kuzating, 3 ta o'zgarishni yozing yoki rasmini chizing." },
    { t: "Hayvonlar va ularning bolalari", d: "5 ta hayvon va uning bolasi nomini yozing (sigir — buzoq...)." },
    { t: "Suvning holatlari", d: "Suvning uch holatiga misol keltiring va rasm chizing." },
  ],
  "ingliz:kids": [
    { t: "Colors and numbers", d: "Write 10 colors and numbers 1-10 in English. Draw a rainbow." },
    { t: "My family", d: "Write 5 sentences about your family: 'This is my mother...'" },
    { t: "Animals vocabulary", d: "Learn 8 new animal words and draw 4 of them." },
  ],
  "ingliz:pro": [
    { t: "Present Perfect exercises", d: "Complete exercises 3-5 on page 41. Write 5 own sentences." },
    { t: "Essay: My favourite book", d: "Write 120-150 words about your favourite book." },
    { t: "Irregular verbs", d: "Learn 20 irregular verbs (3 forms) and write them." },
    { t: "Reading comprehension", d: "Read the text 'A trip to Samarkand' and answer the questions." },
  ],
  adabiyot: [
    { t: "Alisher Navoiy g'azallari", d: "Bitta g'azalni yod oling va mazmunini o'z so'zlaringiz bilan yozing." },
    { t: "Asar tahlili: 'O'tkan kunlar'", d: "Asardagi bosh qahramonlar tavsifini yozing (1 bet)." },
    { t: "Hikoya qahramoni tavsifi", d: "O'qilgan hikoyadagi qahramonga xat yozing." },
  ],
  algebra: [
    { t: "Chiziqli tenglamalar", d: "214-220-misollar. Har bir tenglamani tekshirib qo'ying." },
    { t: "Kvadrat tenglamalar", d: "Diskriminant orqali 6 ta tenglamani yeching." },
    { t: "Funksiya grafigi", d: "y = 2x − 3 va y = −x + 4 grafiklarini bitta koordinatada chizing." },
    { t: "Qisqa ko'paytirish formulalari", d: "Formulalar yordamida 10 ta ifodani soddalashtiring." },
  ],
  geometriya: [
    { t: "Uchburchaklar tengligi", d: "Darslikdagi 3 ta isbotlash masalasini yeching, chizma bilan." },
    { t: "Pifagor teoremasi", d: "Teorema yordamida 5 ta masala yeching." },
    { t: "Aylana va doira", d: "Aylana uzunligi va doira yuzini topishga 4 ta masala." },
  ],
  fizika: [
    { t: "Tezlik va harakat", d: "4 ta masala: tezlik, yo'l va vaqtni toping. Birliklarni yozing!" },
    { t: "Nyuton qonunlari", d: "Har bir qonunga hayotdan 2 ta misol keltiring." },
    { t: "Laboratoriya hisoboti", d: "Prujina tajribasi bo'yicha hisobot va jadval tuzing." },
  ],
  kimyo: [
    { t: "Kimyoviy elementlar belgilari", d: "Birinchi 20 element belgisi va nomini yod oling." },
    { t: "Reaksiya tenglamalari", d: "5 ta reaksiya tenglamasini tenglashtiring." },
    { t: "Molyar massa", d: "H₂O, CO₂, NaCl, H₂SO₄ ning molyar massasini hisoblang." },
  ],
  biologiya: [
    { t: "Hujayra tuzilishi", d: "O'simlik va hayvon hujayrasi chizmasini chizib, qismlarini belgilang." },
    { t: "Fotosintez", d: "Fotosintez jarayonini sxema ko'rinishida tushuntiring." },
    { t: "Inson skeleti", d: "Skelet bo'limlari va vazifalarini jadvalga yozing." },
  ],
  tarix: [
    { t: "Amir Temur davlati", d: "Amir Temur davlatining tashkil topishi haqida reja asosida konspekt." },
    { t: "Buyuk Ipak yo'li", d: "Ipak yo'li o'tgan O'zbekiston shaharlarini xaritada belgilang." },
    { t: "Tarixiy sanalar", d: "Mavzudagi 10 ta muhim sanani jadvalga yozing." },
  ],
  informatika: [
    { t: "Algoritm blok-sxemasi", d: "Ikki sondan kattasini topish algoritmini blok-sxemada chizing." },
    { t: "Python: o'zgaruvchilar", d: "Ism va yoshni so'rab, salomlashadigan dastur yozing." },
    { t: "Sanoq sistemalari", d: "10 ta sonni ikkilik sanoq sistemasiga o'tkazing." },
  ],
};

const TESTS: Record<string, { title: string; questions: Omit<TestQuestion, "id">[] }> = {
  algebra: {
    title: "Tenglamalar bo'yicha test",
    questions: [
      { text: "2x + 6 = 14 tenglamaning ildizi?", options: ["3", "4", "5", "10"], correct: 1 },
      { text: "x² − 9 = 0 tenglamaning ildizlari?", options: ["±3", "3", "9", "±9"], correct: 0 },
      { text: "(a + b)² ni oching:", options: ["a² + b²", "a² + 2ab + b²", "a² − 2ab + b²", "2a + 2b"], correct: 1 },
      { text: "Diskriminant formulasi:", options: ["b² − 4ac", "b² + 4ac", "4ac − b²", "b − 4ac"], correct: 0 },
      { text: "y = 3x − 2 funksiyada x = 2 bo'lsa, y = ?", options: ["4", "6", "2", "8"], correct: 0 },
      { text: "3(x − 1) = 2x + 4 ⇒ x = ?", options: ["5", "7", "3", "−7"], correct: 1 },
    ],
  },
  ingliz: {
    title: "Vocabulary test",
    questions: [
      { text: "'Kitob' in English:", options: ["Pen", "Book", "Bag", "Desk"], correct: 1 },
      { text: "Past form of 'go':", options: ["goed", "gone", "went", "going"], correct: 2 },
      { text: "Choose the correct: She ___ a student.", options: ["am", "is", "are", "be"], correct: 1 },
      { text: "Opposite of 'cold':", options: ["hot", "cool", "wet", "big"], correct: 0 },
      { text: "'Maktab' in English:", options: ["Shop", "School", "Street", "Sport"], correct: 1 },
    ],
  },
  fizika: {
    title: "Mexanika: tezkor test",
    questions: [
      { text: "Tezlikning SI birligi:", options: ["km/soat", "m/s", "m/s²", "N"], correct: 1 },
      { text: "Kuch birligi:", options: ["Joul", "Vatt", "Nyuton", "Paskal"], correct: 2 },
      { text: "v = 10 m/s, t = 5 s bo'lsa, s = ?", options: ["2 m", "15 m", "50 m", "500 m"], correct: 2 },
      { text: "Erkin tushish tezlanishi taxminan:", options: ["9,8 m/s²", "1 m/s²", "98 m/s²", "0,98 m/s²"], correct: 0 },
      { text: "Inersiya qonuni Nyutonning nechanchi qonuni?", options: ["I", "II", "III", "Bunday qonun yo'q"], correct: 0 },
    ],
  },
  biologiya: {
    title: "Hujayra — test",
    questions: [
      { text: "Hujayraning 'energiya stansiyasi':", options: ["Yadro", "Mitoxondriya", "Ribosoma", "Vakuola"], correct: 1 },
      { text: "Fotosintez qayerda boradi?", options: ["Xloroplastda", "Yadroda", "Lizosomada", "Membranada"], correct: 0 },
      { text: "Irsiy axborot saqlanadigan qism:", options: ["Sitoplazma", "Yadro", "Devor", "Vakuola"], correct: 1 },
      { text: "O'simlik hujayrasida bo'ladi, hayvonda yo'q:", options: ["Membrana", "Hujayra devori", "Yadro", "Ribosoma"], correct: 1 },
    ],
  },
  tarix: {
    title: "Temuriylar davri — test",
    questions: [
      { text: "Amir Temur tug'ilgan yil:", options: ["1336", "1370", "1405", "1220"], correct: 0 },
      { text: "Temuriylar poytaxti:", options: ["Buxoro", "Samarqand", "Xiva", "Toshkent"], correct: 1 },
      { text: "Ulug'bek rasadxonasi qayerda?", options: ["Samarqand", "Hirot", "Termiz", "Qo'qon"], correct: 0 },
      { text: "'Temur tuzuklari' nima haqida?", options: ["Tibbiyot", "Davlat boshqaruvi", "Astronomiya", "She'riyat"], correct: 1 },
    ],
  },
};

function kidsMathTest(grade: number): Omit<TestQuestion, "id">[] {
  const qs: Omit<TestQuestion, "id">[] = [];
  for (let i = 0; i < 6; i++) {
    let a: number, b: number, op: string, ans: number;
    if (grade <= 2) {
      a = randInt(2, 15); b = randInt(1, Math.min(9, a)); op = chance(0.5) ? "+" : "−";
      ans = op === "+" ? a + b : a - b;
    } else {
      a = randInt(2, 9); b = randInt(2, 9); op = chance(0.6) ? "×" : "+";
      if (op === "+") { a = randInt(10, 60); b = randInt(5, 39); }
      ans = op === "×" ? a * b : a + b;
    }
    const opts = new Set<number>([ans]);
    while (opts.size < 4) opts.add(Math.max(0, ans + randInt(-6, 6)));
    const options = shuffle([...opts]);
    qs.push({ text: `${a} ${op} ${b} = ?`, options: options.map(String), correct: options.indexOf(ans) });
  }
  return qs;
}

const FEEDBACK = {
  5: ["Barakalla! Juda toza va to'g'ri bajarilgan.", "A'lo ish! Shunday davom eting.", "Zo'r! Hamma javoblar to'g'ri."],
  4: ["Yaxshi ish, lekin kichik xatolar bor — ularni ko'rib chiqing.", "Yaxshi! Biroz e'tiborliroq bo'lsangiz 5 bo'ladi."],
  3: ["Qoniqarli. Xatolar ustida ishlang, mavzuni qayta o'qing.", "Vazifaning yarmi to'g'ri. Darsda birga ko'rib chiqamiz."],
  2: ["Vazifa deyarli bajarilmagan. Qayta ishlab, menga ko'rsating.", "Ko'p xato bor. Mavzuni takrorlang."],
} as Record<number, string[]>;
const MISTAKES = [
  "2-misolda hisoblash xatosi",
  "Javob birligi ko'rsatilmagan",
  "Imlo xatosi: so'z noto'g'ri yozilgan",
  "Tinish belgisi tushib qolgan",
  "Shart to'liq yozilmagan",
  "Chizma aniq emas",
  "Formulaga noto'g'ri qiymat qo'yilgan",
  "Xulosa yozilmagan",
];
const ANSWER_TEXT = [
  "Vazifani bajardim. Hamma mashqlar daftarda.",
  "Bajarildi. 3-misolda biroz qiynaldim.",
  "Mashqlarni yechdim, javoblarni tekshirdim.",
  "Ustoz, vazifa tayyor. Rasmda ko'rinmasa ayting.",
  "Bajarib bo'ldim!",
];

/* ------------------------------------------------------------------ */
/*  Dars jadvali                                                       */
/* ------------------------------------------------------------------ */
const WEEKLY_HOURS: Record<string, number> = {
  onatili: 4, oqish: 4, matematika: 5, tabiiy: 2, ingliz: 2, adabiyot: 2, algebra: 3, geometriya: 2,
  fizika: 2, kimyo: 2, biologiya: 2, tarix: 2, informatika: 1,
};
export function buildTimetable(subjectIds: string[], grade: number): string[][] {
  const pool: string[] = [];
  for (const id of subjectIds) {
    let h = WEEKLY_HOURS[id] ?? 2;
    if (id === "onatili" && grade >= 5) h = 3;
    if (id === "ingliz" && grade >= 5) h = 3;
    for (let i = 0; i < h; i++) pool.push(id);
  }
  const days: string[][] = [[], [], [], [], []];
  // eng ko'p soatli fanlardan boshlab, kunlarga teng taqsimlash
  const ordered = shuffle(pool).sort((a, b) => (WEEKLY_HOURS[b] ?? 2) - (WEEKLY_HOURS[a] ?? 2));
  let d = 0;
  for (const s of ordered) {
    let tries = 0;
    while (tries < 5 && days[d].includes(s)) { d = (d + 1) % 5; tries++; }
    days[d].push(s);
    d = (d + 1) % 5;
  }
  return days.map((day) => shuffle(day));
}

/* ------------------------------------------------------------------ */
/*  Asosiy seed                                                        */
/* ------------------------------------------------------------------ */
export interface SeedCredential { role: string; fullName: string; className: string; login: string; password: string }

export const DEMO_ACCOUNTS = [
  { role: "Admin", login: "admin", password: "Admin2026" },
  { role: "Ustoz (matematika, 5–11)", login: "j.alimov", password: "Ustoz2026" },
  { role: "Ustoz (3-A sinf rahbari)", login: "d.karimova", password: "Ustoz2026" },
  { role: "O'quvchi (3-A, kichik sinf)", login: "sardor.toshmatov", password: "Oquvchi2026" },
  { role: "O'quvchi (8-A, yuqori sinf)", login: "madina.toshmatova", password: "Oquvchi2026" },
  { role: "Ota-ona (2 farzand)", login: "dilshod.toshmatov", password: "OtaOna2026" },
];

export function createSeed(now = new Date()): { db: Database; credentials: SeedCredential[] } {
  setSeedMode(true);
  try {
    return buildSeed(now);
  } finally {
    setSeedMode(false);
  }
}

function buildSeed(now: Date): { db: Database; credentials: SeedCredential[] } {
  const createdAt = now.toISOString();
  const users: User[] = [];
  const credentials: SeedCredential[] = [];
  const logins = new Set<string>();
  // Qat'iy tuz: har bir server nusxasida bir xil hash (sessiya imzosi mos kelishi uchun)
  const hash = (pw: string) => bcrypt.hashSync(pw, "$2a$08$SmartSchoolDemoSaltab.");

  const uniqueLogin = (base: string) => {
    let l = base;
    let i = 2;
    while (logins.has(l)) l = `${base}${i++}`;
    logins.add(l);
    return l;
  };

  function addUser(u: Omit<User, "id" | "login" | "passwordHash" | "createdAt">, loginBase: string, password?: string, className = "") {
    const login = uniqueLogin(loginBase);
    const pw = password ?? generatePassword();
    const prefix = { admin: "adm", teacher: "tea", student: "stu", parent: "par" }[u.role];
    const user: User = { id: newId(prefix), login, passwordHash: hash(pw), createdAt, ...u };
    users.push(user);
    credentials.push({ role: u.role, fullName: `${u.lastName} ${u.firstName}`, className, login, password: pw });
    return user;
  }

  // ---- admin
  addUser({ role: "admin", firstName: "Maktab", lastName: "Ma'muriyati", position: "Direktor o'rinbosari", phone: "+998 71 200 00 01" }, "admin", "Admin2026");

  // ---- ustozlar
  const T = (first: string, last: string, subjectIds: string[], position: string, password?: string) =>
    addUser({ role: "teacher", firstName: first, lastName: last, subjectIds, position, phone: phone() }, toLogin(`${first[0]}.${last}`), password);

  const primaryTeachers = [
    T("Gulnora", "Yusupova", ["onatili", "oqish", "matematika", "tabiiy"], "Boshlang'ich sinf o'qituvchisi"),
    T("Nilufar", "Saidova", ["onatili", "oqish", "matematika", "tabiiy"], "Boshlang'ich sinf o'qituvchisi"),
    T("Dilnoza", "Karimova", ["onatili", "oqish", "matematika", "tabiiy"], "Boshlang'ich sinf o'qituvchisi", "Ustoz2026"),
    T("Nodira", "Rahimova", ["onatili", "oqish", "matematika", "tabiiy"], "Boshlang'ich sinf o'qituvchisi"),
  ];
  const english = T("Malika", "Tursunova", ["ingliz"], "Ingliz tili o'qituvchisi");
  const math = T("Jasur", "Alimov", ["matematika", "algebra", "geometriya"], "Matematika o'qituvchisi", "Ustoz2026");
  const math2 = T("Akmal", "Hamidov", ["matematika", "algebra", "geometriya"], "Matematika o'qituvchisi");
  const uzlit = T("Shahnoza", "Mirzayeva", ["onatili", "adabiyot"], "Ona tili va adabiyot o'qituvchisi");
  const physics = T("Bekzod", "Qodirov", ["fizika"], "Fizika o'qituvchisi");
  const chembio = T("Kamola", "Ergasheva", ["kimyo", "biologiya"], "Kimyo va biologiya o'qituvchisi");
  const history = T("Sherzod", "Nazarov", ["tarix"], "Tarix o'qituvchisi");
  const it = T("Otabek", "Raximov", ["informatika"], "Informatika o'qituvchisi");

  // ---- sinflar
  const classes: SchoolClass[] = [];
  const teachings: Teaching[] = [];
  const upperHomerooms = [uzlit, math, physics, chembio, history, it, math2];
  for (let grade = 1; grade <= 11; grade++) {
    const subj = subjectsForGrade(grade).map((s) => s.id);
    const cls: SchoolClass = {
      id: `cls_${grade}a`,
      grade,
      letter: "A",
      room: `${grade <= 4 ? 1 : 2}${String(grade).padStart(2, "0")}-xona`,
      homeroomTeacherId: grade <= 4 ? primaryTeachers[grade - 1].id : upperHomerooms[grade - 5].id,
      timetable: buildTimetable(subj, grade),
    };
    classes.push(cls);
    for (const s of subj) {
      let teacher: User;
      if (s === "ingliz") teacher = english;
      else if (grade <= 4) teacher = primaryTeachers[grade - 1];
      else if (["matematika", "algebra", "geometriya"].includes(s)) teacher = grade === 5 || grade === 6 ? math2 : math;
      else if (s === "onatili" || s === "adabiyot") teacher = uzlit;
      else if (s === "fizika") teacher = physics;
      else if (s === "kimyo" || s === "biologiya") teacher = chembio;
      else if (s === "tarix") teacher = history;
      else teacher = it;
      teachings.push({ id: newId("tg"), teacherId: teacher.id, classId: cls.id, subjectId: s });
    }
  }
  // math2 5–6 sinflarda ham, J. Alimov 7–11 da: demo uchun J. Alimov 5–6 da geometriya yo'q, shuning uchun 5-A, 6-A matematikani ham unga beramiz
  for (const t of teachings) {
    if ((t.classId === "cls_5a" || t.classId === "cls_6a") && t.subjectId === "matematika") t.teacherId = math.id;
  }

  // ---- o'quvchilar va ota-onalar
  const classLabel = (c: SchoolClass) => `${c.grade}-${c.letter}`;
  const ability = new Map<string, number>(); // o'rtacha baho darajasi
  const diligence = new Map<string, number>(); // uy ishini bajarish ehtimoli
  const today = localDate(now);
  const yearNow = Number(today.slice(0, 4));

  function addStudent(cls: SchoolClass, first: string, last: string, gender: "m" | "f", password?: string, parent?: User) {
    const birthYear = yearNow - (6 + cls.grade) - (chance(0.3) ? 1 : 0);
    const birthDate = `${birthYear}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`;
    const stu = addUser(
      {
        role: "student",
        firstName: first,
        lastName: last,
        gender,
        classId: cls.id,
        birthDate,
        address: `Toshkent sh., ${pick(DISTRICTS)} tumani, ${pick(STREETS)} ko'chasi, ${randInt(1, 80)}-uy`,
        parentIds: [],
      },
      toLogin(`${first}.${last}`),
      password,
      classLabel(cls),
    );
    let par = parent;
    if (!par) {
      const father = chance(0.55);
      const baseSurname = last.replace(/a$/, "");
      const pFirst = father ? pick(FATHER_NAMES) : pick(MOTHER_NAMES);
      const pLast = father ? baseSurname : femaleSurname(baseSurname);
      par = addUser(
        { role: "parent", firstName: pFirst, lastName: pLast, phone: phone(), childIds: [], position: father ? "Otasi" : "Onasi" },
        toLogin(`${pFirst}.${pLast}`),
        undefined,
        classLabel(cls),
      );
    }
    stu.parentIds = [par.id];
    par.childIds = [...(par.childIds ?? []), stu.id];
    ability.set(stu.id, clamp(rand(2.9, 5.1), 2.6, 5));
    diligence.set(stu.id, clamp(rand(0.55, 1.05), 0.4, 0.99));
    return stu;
  }

  // Demo oila: Toshmatovlar
  const demoParent = addUser(
    { role: "parent", firstName: "Dilshod", lastName: "Toshmatov", phone: "+998 90 123 45 67", childIds: [], position: "Otasi" },
    "dilshod.toshmatov",
    "OtaOna2026",
    "3-A, 8-A",
  );
  const demoKid = addStudent(classes[2], "Sardor", "Toshmatov", "m", "Oquvchi2026", demoParent);
  const demoTeen = addStudent(classes[7], "Madina", "Toshmatova", "f", "Oquvchi2026", demoParent);
  ability.set(demoKid.id, 4.4);
  diligence.set(demoKid.id, 0.92);
  ability.set(demoTeen.id, 4.5);
  diligence.set(demoTeen.id, 0.9);

  for (const cls of classes) {
    const target = 9;
    const current = users.filter((u) => u.role === "student" && u.classId === cls.id).length;
    for (let i = current; i < target; i++) {
      const gender: "m" | "f" = chance(0.5) ? "m" : "f";
      const sur = pick(SURNAMES);
      addStudent(cls, gender === "m" ? pick(BOY_NAMES) : pick(GIRL_NAMES), gender === "m" ? sur : femaleSurname(sur), gender);
    }
  }

  const students = users.filter((u) => u.role === "student");
  const studentsByClass = new Map<string, User[]>();
  for (const s of students) studentsByClass.set(s.classId!, [...(studentsByClass.get(s.classId!) ?? []), s]);

  // ---- sanalar: o'quv yili boshi (2-sentabr) yoki 6 hafta oldin
  const termStart = `${Number(today.slice(5, 7)) >= 9 ? yearNow : yearNow - 1}-09-02`;
  let start = addDays(today, -42);
  if (start < termStart) start = termStart;
  const schoolDays: string[] = [];
  for (let d = start; d < today; d = addDays(d, 1)) if (isSchoolDay(d)) schoolDays.push(d);
  const dayIndex = (ymd: string) => {
    const w = new Date(`${ymd}T12:00:00Z`).getUTCDay();
    return w - 1; // 0=Dushanba
  };

  // ---- davomat
  const attendance: AttendanceDay[] = [];
  const absentToday = new Map<string, Set<string>>();
  for (const cls of classes) {
    for (const d of schoolDays) {
      const marks: Record<string, AttendanceStatus> = {};
      const absent = new Set<string>();
      for (const s of studentsByClass.get(cls.id) ?? []) {
        const dil = diligence.get(s.id)!;
        const r = rng();
        let st: AttendanceStatus = "present";
        if (r < 0.025 + (1 - dil) * 0.06) st = "absent";
        else if (r < 0.04 + (1 - dil) * 0.08) st = "late";
        else if (r < 0.055 + (1 - dil) * 0.08) st = "excused";
        marks[s.id] = st;
        if (st === "absent" || st === "excused") absent.add(s.id);
      }
      absentToday.set(`${cls.id}|${d}`, absent);
      const homeroom = cls.homeroomTeacherId!;
      attendance.push({ id: newId("att"), classId: cls.id, date: d, marks, markedBy: homeroom, updatedAt: tashkentToIso(d, "08:20") });
    }
  }

  // Demo: Sardor bir kun kasal bo'lgan (ota-onasining xabariga mos)
  const sickDay = schoolDays[schoolDays.length - 2];
  const sickRec = attendance.find((a) => a.classId === demoKid.classId && a.date === sickDay);
  if (sickRec) {
    sickRec.marks[demoKid.id] = "excused";
    absentToday.get(`${demoKid.classId}|${sickDay}`)?.add(demoKid.id);
  }

  // ---- baholar (dars) — jadvalga ko'ra
  const grades: Grade[] = [];
  const teacherFor = (classId: string, subjectId: string) => teachings.find((t) => t.classId === classId && t.subjectId === subjectId)!.teacherId;
  const gradeValue = (sid: string, bias = 0) => clamp(Math.round(ability.get(sid)! + bias + rand(-0.9, 0.9)), 2, 5);

  for (const cls of classes) {
    const roster = studentsByClass.get(cls.id) ?? [];
    for (const d of schoolDays) {
      const lessons = cls.timetable[dayIndex(d)] ?? [];
      const absent = absentToday.get(`${cls.id}|${d}`) ?? new Set();
      for (const subjectId of lessons) {
        const present = roster.filter((s) => !absent.has(s.id));
        const graded = shuffle(present).slice(0, randInt(1, 3));
        for (const s of graded) {
          const type: GradeType = chance(0.12) ? "nazorat" : "dars";
          grades.push({
            id: newId("grd"), studentId: s.id, classId: cls.id, subjectId, teacherId: teacherFor(cls.id, subjectId),
            value: gradeValue(s.id, type === "nazorat" ? -0.2 : 0), date: d, type, createdAt: tashkentToIso(d, "13:00"),
          });
        }
      }
    }
  }

  // ---- vazifalar va topshiriqlar
  const assignments: Assignment[] = [];
  const submissions: Submission[] = [];
  const band = (grade: number) => (grade <= 4 ? "kids" : "pro");

  for (const t of teachings) {
    const cls = classes.find((c) => c.id === t.classId)!;
    const tpls = HW[`${t.subjectId}:${band(cls.grade)}`] ?? HW[t.subjectId] ?? [];
    if (!tpls.length) continue;
    // fan dars kunlari
    const lessonDays = schoolDays.filter((d) => cls.timetable[dayIndex(d)]?.includes(t.subjectId));
    // har ikkinchi-uchinchi darsdan keyin uy ishi
    const hwDays = lessonDays.filter((_, i) => i % (cls.grade <= 4 ? 2 : 3) === 1);
    hwDays.forEach((day, idx) => {
      const tpl = tpls[idx % tpls.length];
      const nextLesson = lessonDays.find((d) => d > day) ?? addDays(day, 2);
      const a: Assignment = {
        id: newId("asg"), classId: cls.id, subjectId: t.subjectId, teacherId: t.teacherId, kind: "homework",
        title: tpl.t, description: tpl.d, createdAt: tashkentToIso(day, "14:00"), dueAt: tashkentToIso(nextLesson, "08:00"),
        fileIds: [], allowLate: true,
      };
      assignments.push(a);
      const dueDay = localDate(a.dueAt);
      const daysSinceDue = schoolDays.filter((d) => d >= dueDay).length;
      for (const s of studentsByClass.get(cls.id) ?? []) {
        if (!chance(diligence.get(s.id)!)) continue;
        const late = chance(0.08);
        const submittedAt = late
          ? new Date(new Date(a.dueAt).getTime() + randInt(2, 30) * 36e5).toISOString()
          : new Date(new Date(a.dueAt).getTime() - randInt(2, 14) * 36e5).toISOString();
        if (new Date(submittedAt) > now) continue;
        const sub: Submission = {
          id: newId("sub"), assignmentId: a.id, studentId: s.id, text: pick(ANSWER_TEXT), fileIds: [],
          submittedAt, late, status: "submitted", attempts: 1,
        };
        // muddatdan 2+ o'quv kuni o'tgan bo'lsa — ustoz tekshirgan
        if (daysSinceDue >= 2 || chance(0.4)) {
          const g = gradeValue(s.id, late ? -0.5 : 0.1);
          sub.status = "graded";
          sub.grade = g;
          sub.feedback = pick(FEEDBACK[g]);
          sub.mistakes = g >= 5 ? [] : shuffle(MISTAKES).slice(0, 5 - g);
          sub.gradedAt = new Date(Math.min(now.getTime() - 36e5, new Date(submittedAt).getTime() + randInt(10, 40) * 36e5)).toISOString();
          sub.gradedBy = t.teacherId;
          grades.push({
            id: newId("grd"), studentId: s.id, classId: cls.id, subjectId: t.subjectId, teacherId: t.teacherId, value: g,
            date: localDate(sub.gradedAt), type: "uy_ishi", submissionId: sub.id, createdAt: sub.gradedAt, comment: a.title,
          });
        }
        submissions.push(sub);
      }
    });

    // kelgusi uy ishi (hali topshirilmagan)
    const nextDays: string[] = [];
    for (let d = today; nextDays.length < 2 && d < addDays(today, 14); d = addDays(d, 1)) {
      if (isSchoolDay(d) && cls.timetable[dayIndex(d)]?.includes(t.subjectId)) nextDays.push(d);
    }
    if (nextDays.length) {
      const tpl = tpls[(hwDays.length + 1) % tpls.length];
      assignments.push({
        id: newId("asg"), classId: cls.id, subjectId: t.subjectId, teacherId: t.teacherId, kind: "homework",
        title: tpl.t, description: tpl.d, createdAt: new Date(now.getTime() - randInt(2, 30) * 36e5).toISOString(),
        dueAt: tashkentToIso(nextDays[0], "08:00"), fileIds: [], allowLate: true,
      });
    }
  }

  // ---- testlar (elektron, avtomatik tekshiriladi)
  for (const cls of classes) {
    const subjIds = subjectsForGrade(cls.grade).map((s) => s.id);
    const testSubjects = cls.grade <= 4 ? ["matematika"] : subjIds.filter((s) => s in TESTS).slice(0, 3);
    testSubjects.forEach((subjectId, idx) => {
      const bank = cls.grade <= 4 ? { title: "Tez hisoblash testi", questions: kidsMathTest(cls.grade) } : TESTS[subjectId];
      const questions = bank.questions.map((q) => ({ ...q, id: newId("q") }));
      const teacherId = teacherFor(cls.id, subjectId);
      // o'tgan test
      const pastDay = schoolDays[Math.max(0, schoolDays.length - 6 - idx * 3)];
      const past: Assignment = {
        id: newId("asg"), classId: cls.id, subjectId, teacherId, kind: "test", title: bank.title, description: "Har bir savolga bitta to'g'ri javobni tanlang. Natija darhol chiqadi.",
        createdAt: tashkentToIso(addDays(pastDay, -2), "15:00"), dueAt: tashkentToIso(pastDay, "20:00"), fileIds: [], questions, allowLate: false,
      };
      assignments.push(past);
      for (const s of studentsByClass.get(cls.id) ?? []) {
        if (!chance(diligence.get(s.id)! + 0.05)) continue;
        const pCorrect = clamp((ability.get(s.id)! - 2) / 3 + 0.05, 0.25, 0.97);
        const answers = questions.map((q) => (chance(pCorrect) ? q.correct : (q.correct + randInt(1, q.options.length - 1)) % q.options.length));
        const score = answers.filter((a, i) => a === questions[i].correct).length;
        const grade = gradeFromPercent((score / questions.length) * 100);
        const submittedAt = tashkentToIso(pastDay, `${randInt(15, 19)}:${String(randInt(0, 59)).padStart(2, "0")}`);
        const sub: Submission = {
          id: newId("sub"), assignmentId: past.id, studentId: s.id, fileIds: [], answers, submittedAt, late: false,
          status: "graded", score, maxScore: questions.length, grade, gradedAt: submittedAt, gradedBy: "auto",
          feedback: "Test avtomatik tekshirildi.", attempts: 1,
        };
        submissions.push(sub);
        grades.push({ id: newId("grd"), studentId: s.id, classId: cls.id, subjectId, teacherId, value: grade, date: localDate(submittedAt), type: "test", submissionId: sub.id, createdAt: submittedAt, comment: bank.title });
      }
      // ochiq test (hali yechilmagan)
      if (idx === 0) {
        const fresh = cls.grade <= 4 ? kidsMathTest(cls.grade) : bank.questions;
        assignments.push({
          id: newId("asg"), classId: cls.id, subjectId, teacherId, kind: "test",
          title: cls.grade <= 4 ? "Matematika: 6 ta savol" : `${bank.title} (takroriy)`,
          description: "Testni bir marta yechish mumkin. Shoshilmang, har bir savolni o'qing.",
          createdAt: new Date(now.getTime() - 20 * 36e5).toISOString(),
          dueAt: tashkentToIso(addDays(today, 3), "20:00"), fileIds: [], allowLate: false,
          questions: fresh.map((q) => ({ ...q, id: newId("q") })),
        });
      }
    });
  }

  // ---- tekshirilmagan topshiriqlar (ustoz uchun navbat): oxirgi uy ishlarining bir qismini "submitted" qoldiramiz
  // (yuqorida tasodifiy qoldirilganlar yetarli)

  // ---- materiallar
  const materials: Material[] = [
    {
      id: newId("mat"), classId: "cls_8a", subjectId: "algebra", teacherId: math.id, title: "Kvadrat tenglamalar — qisqa konspekt",
      body: "ax² + bx + c = 0 ko'rinishidagi tenglama kvadrat tenglama deyiladi (a ≠ 0).\n\n1) Diskriminant: D = b² − 4ac\n2) D > 0 — ikkita ildiz: x = (−b ± √D) / 2a\n3) D = 0 — bitta ildiz: x = −b / 2a\n4) D < 0 — haqiqiy ildiz yo'q\n\nMisol: x² − 5x + 6 = 0 → D = 25 − 24 = 1 → x₁ = 3, x₂ = 2.",
      fileIds: [], createdAt: new Date(now.getTime() - 4 * 864e5).toISOString(),
    },
    {
      id: newId("mat"), classId: "cls_3a", subjectId: "matematika", teacherId: primaryTeachers[2].id, title: "Ko'paytirish jadvali — o'yin orqali yodlaymiz",
      body: "Har kuni 5 daqiqa 'Tez hisob' o'yinini o'ynang. 7 va 8 ga ko'paytirishni yod oling.\n\nMaslahat: 8 × 7 = 56 — '5, 6, 7, 8' ketma-ketligini eslang: 56 = 7 × 8.",
      fileIds: [], createdAt: new Date(now.getTime() - 2 * 864e5).toISOString(),
    },
  ];

  // ---- xabarlar
  const messages: Message[] = [];
  const say = (from: User, to: User, text: string, hoursAgo: number, read = true) => {
    const createdAtMsg = new Date(now.getTime() - hoursAgo * 36e5).toISOString();
    messages.push({ id: newId("msg"), threadId: threadIdFor(from.id, to.id), senderId: from.id, text, createdAt: createdAtMsg, readAt: read ? createdAtMsg : undefined });
  };
  const karimova = primaryTeachers[2];
  say(demoTeen, math, "Assalomu alaykum, ustoz! Kvadrat tenglamalardagi 3-misolni tushunmadim, D manfiy chiqyapti.", 30);
  say(math, demoTeen, "Va alaykum assalom, Madina. D < 0 bo'lsa, haqiqiy ildiz yo'q — javobga shuni yozasiz. Konspektni ham ko'rib chiqing.", 29);
  say(demoTeen, math, "Rahmat, ustoz! Tushundim 😊", 28);
  say(demoParent, karimova, "Assalomu alaykum, Dilnoza opa. Sardor kecha mazasi bo'lmagani uchun darsga kela olmadi, uzr.", 50);
  say(karimova, demoParent, "Va alaykum assalom! Tushunarli, sog'ayib ketsin. Uy vazifasini platformada ko'rishi mumkin.", 49);
  say(karimova, demoParent, "Sardor bu hafta matematikadan juda yaxshi natija ko'rsatdi, barakalla! 👏", 6, false);
  say(demoKid, karimova, "Ustoz, men she'rni yod oldim!", 20);
  say(karimova, demoKid, "Barakalla, Sardor! Ertaga sinfda aytib berasan 🌟", 19, false);

  // ---- o'yin statistikasi (1–4 sinflar)
  const gameStats: GameStat[] = students
    .filter((s) => classes.find((c) => c.id === s.classId)!.grade <= 4)
    .map((s) => ({ studentId: s.id, stars: randInt(5, 60), plays: randInt(3, 25), best: { math: randInt(4, 10), memory: randInt(3, 10), words: randInt(2, 8) }, updatedAt: createdAt }));

  const db: Database = {
    version: 1,
    school: { name: process.env.SCHOOL_NAME || "SmartSchool 1-maktab", createdAt },
    users,
    classes,
    teachings,
    assignments,
    submissions,
    grades,
    attendance,
    messages,
    files: [],
    materials,
    gameStats,
  };
  return { db, credentials };
}
