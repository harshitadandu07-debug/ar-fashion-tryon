export type Season = "spring" | "summer" | "fall" | "winter";

export function getCurrentSeason(now: Date = new Date()): Season {
  const month = now.getMonth() + 1; // 1–12
  const day = now.getDate();

  if (month === 12 || month <= 2) return "winter";
  if (month === 3 || month === 4) return "spring";
  if (month === 5 && day < 15) return "spring";
  if (month <= 8) return "summer"; // May 15–Aug 31
  return "fall"; // Sep 1–Nov 30
}
