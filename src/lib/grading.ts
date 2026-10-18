/** Foiz → 5 ballik baho (O'zbekiston maktablari tizimi) */
export function gradeFromPercent(p: number) {
  if (p >= 86) return 5;
  if (p >= 71) return 4;
  if (p >= 56) return 3;
  return 2;
}

export const GRADE_LABEL: Record<number, string> = {
  5: "A'lo",
  4: "Yaxshi",
  3: "Qoniqarli",
  2: "Qoniqarsiz",
  1: "Juda past",
};

export const GRADE_TYPE_LABEL: Record<string, string> = {
  dars: "Darsdagi javob",
  uy_ishi: "Uy ishi",
  nazorat: "Nazorat ishi",
  test: "Test",
};
