import WORDS from './words.js';
import VALID_WORDS from './valid_words.js';

const EPOCH = new Date('2026-01-01').getTime();

function listAt(n) { return WORDS[n] || []; }

function isPlural(word) {
  const w = word.toLowerCase();
  const len = w.length;
  if (w.endsWith('ies')) {
    const base = w.slice(0, -3) + 'y';
    if (listAt(len - 2).includes(base)) return true;
  }
  if (w.endsWith('es')) {
    if (listAt(len - 2).includes(w.slice(0, -2))) return true;
  }
  if (w.endsWith('s')) {
    if (listAt(len - 1).includes(w.slice(0, -1))) return true;
  }
  return false;
}

function getTargetList(length) {
  return listAt(length).filter(w => !isPlural(w));
}

export function getDailyWord(length) {
  const day = Math.floor((Date.now() - EPOCH) / 86400000);
  const list = getTargetList(length);
  return list[(day * 7 + length) % list.length];
}

export function getRandomWord(length) {
  const list = getTargetList(length);
  return list[Math.floor(Math.random() * list.length)];
}

export function evaluateGuess(guess, target) {
  const g = guess.toLowerCase();
  const t = target.toLowerCase();
  if (g === t) return 'correct';
  return g.localeCompare(t) > 0 ? 'before' : 'after';
}

export function isValidWord(word, length) {
  const w = word.toLowerCase();
  if (w.length !== length) return false;
  if ((VALID_WORDS[length] || []).includes(w)) return true;
  // Accept simple +s plurals whose singular is a real word one letter shorter
  if (w.endsWith('s') && (VALID_WORDS[length - 1] || []).includes(w.slice(0, -1))) return true;
  return false;
}

export function getWordLengths() {
  return Object.keys(WORDS).map(Number).sort((a, b) => a - b);
}

export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
