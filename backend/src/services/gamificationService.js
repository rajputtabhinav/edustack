export function getBadgeFromXp(xp) {
  if (xp >= 100) {
    return "Pro Referrer";
  }
  if (xp >= 30) {
    return "Active Earner";
  }
  return "Beginner";
}

export function getLevelFromXp(xp) {
  return Math.max(1, Math.floor(xp / 25) + 1);
}
