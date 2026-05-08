const KEY = 'alphagame_stats';
const PROGRESS_KEY = 'alphagame_progress';

function blank() {
  return { totalGames: 0, wins: 0, currentStreak: 0, bestStreak: 0, guessCounts: {} };
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    console.error('[Alphabetic] stats load error:', e);
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Alphabetic] stats save error:', e);
  }
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
  console.log('[Alphabetic] recordWin: length=%d guesses=%d streak=%d', length, guessCount, s.currentStreak);
}

export function recordLoss(length) {
  const all = load();
  const s = all[length] || blank();
  s.totalGames++;
  s.currentStreak = 0;
  all[length] = s;
  save(all);
  console.log('[Alphabetic] recordLoss: length=%d', length);
}

export function getDailyPlayed(length, todayKey) {
  try {
    const d = JSON.parse(localStorage.getItem('alphagame_daily')) || {};
    const result = d[`${length}_${todayKey}`] || null;
    console.log('[Alphabetic] getDailyPlayed: key=%s_%s result=%o', length, todayKey, result);
    return result;
  } catch (e) {
    console.error('[Alphabetic] getDailyPlayed error:', e);
    return null;
  }
}

export function setDailyPlayed(length, todayKey, result) {
  try {
    const d = JSON.parse(localStorage.getItem('alphagame_daily')) || {};
    d[`${length}_${todayKey}`] = result;
    localStorage.setItem('alphagame_daily', JSON.stringify(d));
    console.log('[Alphabetic] setDailyPlayed: key=%s_%s', length, todayKey);
  } catch (e) {
    console.error('[Alphabetic] setDailyPlayed error:', e);
  }
}

export function saveProgress({ mode, length, target, guesses, todayKey }) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ mode, length, target, guesses, todayKey }));
    console.log('[Alphabetic] saveProgress: %d guesses saved', guesses.length);
  } catch (e) {
    console.error('[Alphabetic] saveProgress error:', e);
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data) console.log('[Alphabetic] loadProgress: found %d guesses (mode=%s)', data.guesses?.length ?? 0, data.mode);
    return data;
  } catch (e) {
    console.error('[Alphabetic] loadProgress error:', e);
    return null;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    console.log('[Alphabetic] progress cleared');
  } catch (e) {
    console.error('[Alphabetic] clearProgress error:', e);
  }
}
