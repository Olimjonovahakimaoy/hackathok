export interface SubjectDef {
  id: string;
  name: string;
  short: string;
  emoji: string;
  /** palitradagi rang kaliti */
  tone: "green" | "daisy" | "sky" | "cream";
  grades: [number, number];
}

export const SUBJECTS: SubjectDef[] = [
  { id: "onatili", name: "Ona tili", short: "Ona tili", emoji: "📝", tone: "green", grades: [1, 11] },
  { id: "oqish", name: "O'qish savodxonligi", short: "O'qish", emoji: "📖", tone: "daisy", grades: [1, 4] },
  { id: "matematika", name: "Matematika", short: "Matem.", emoji: "🔢", tone: "sky", grades: [1, 6] },
  { id: "tabiiy", name: "Tabiiy fan", short: "Tabiiy fan", emoji: "🌱", tone: "green", grades: [1, 4] },
  { id: "ingliz", name: "Ingliz tili", short: "Ingliz", emoji: "🇬🇧", tone: "daisy", grades: [1, 11] },
  { id: "adabiyot", name: "Adabiyot", short: "Adabiyot", emoji: "📚", tone: "daisy", grades: [5, 11] },
  { id: "algebra", name: "Algebra", short: "Algebra", emoji: "➗", tone: "sky", grades: [7, 11] },
  { id: "geometriya", name: "Geometriya", short: "Geometr.", emoji: "📐", tone: "sky", grades: [7, 11] },
  { id: "fizika", name: "Fizika", short: "Fizika", emoji: "⚡", tone: "sky", grades: [6, 11] },
  { id: "kimyo", name: "Kimyo", short: "Kimyo", emoji: "🧪", tone: "daisy", grades: [7, 11] },
  { id: "biologiya", name: "Biologiya", short: "Biolog.", emoji: "🧬", tone: "green", grades: [5, 11] },
  { id: "tarix", name: "Tarix", short: "Tarix", emoji: "🏛️", tone: "cream", grades: [5, 11] },
  { id: "informatika", name: "Informatika", short: "Inform.", emoji: "💻", tone: "sky", grades: [5, 11] },
];

const byId = new Map(SUBJECTS.map((s) => [s.id, s]));

export function getSubject(id: string): SubjectDef {
  return (
    byId.get(id) ?? { id, name: id, short: id, emoji: "📘", tone: "cream", grades: [1, 11] }
  );
}

export function subjectsForGrade(grade: number): SubjectDef[] {
  return SUBJECTS.filter((s) => grade >= s.grades[0] && grade <= s.grades[1]);
}

export const isKidsGrade = (grade: number) => grade >= 1 && grade <= 4;
