export const SEASON_START_DATE = new Date('2025-09-02T00:00:00'); // Tuesday before Week 1 (Sep 4th)

export function getCurrentNFLWeek(): number {
  const now = new Date();
  // If we're before the season, return Week 1
  if (now < SEASON_START_DATE) {
    return 1;
  }

  const diffTime = Math.abs(now.getTime() - SEASON_START_DATE.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const weekNumber = Math.floor(diffDays / 7) + 1;

  // Cap at Week 18 for regular season (or 22 for Super Bowl if needed, but let's stick to Reg Season for now)
  return Math.min(weekNumber, 18);
}




