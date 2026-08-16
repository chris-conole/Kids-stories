/** Derive a friendly age band from an optional birth year. */
export function ageBandFromBirthYear(birthYear?: number | null): string {
  if (!birthYear) return "4–6";
  const age = new Date().getFullYear() - birthYear;
  if (age <= 3) return "2–3";
  if (age <= 5) return "4–5";
  if (age <= 7) return "6–7";
  if (age <= 9) return "8–9";
  return "9–10";
}
