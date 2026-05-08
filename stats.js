const KEY = 'alphagame_stats';

function blank() {
  return { totalGames: 0, wins: 0, currentStreak: 0, bestStreak: 0, guessCounts: {} };
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch { return {}; }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getStats(length) {
  const all = load();
  return all[length] || blank();
}

export function recordWin(length, guessCount) {
  const all = load();
  const s = all[length] || blank();
  s.totalGames++;
  s.wins++;
  s.currentStreak++;
  if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
  s.guessCounts[guessCount] = (s.guessCounts[guessCount] || 0) + 1;
  all[length] = s;
  save(all);
}

export function recordLoss(length) {
  const all = load();
  const s = all[length] || blank();
  s.totalGames++;
  s.currentStreak = 0;
  all[length] = s;
  save(all);
}

export function getDailyPlayed(length, todayKey) {
  try {
    const d = JSON.parse(localStorage.getItem('alphagame_daily')) || {};
    return d[`${length}_${todayKey}`] || null;
  } catch { return null; }
}

export function setDailyPlayed(length, todayKey, result) {
  try {
    const d = JSON.parse(localStorage.getItem('alphagame_daily')) || {};
    d[`${length}_${todayKey}`] = result;
    localStorage.setItem('alphagame_daily', JSON.stringify(d));
  } catch {}
}
