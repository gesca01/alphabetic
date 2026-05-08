import { getDailyWord, getRandomWord, evaluateGuess, isValidWord, getWordLengths, getTodayKey } from './game.js';
import { getStats, recordWin, recordLoss, getDailyPlayed, setDailyPlayed } from './stats.js';

let state = {
  mode: 'daily',
  length: 5,
  target: '',
  guesses: [], // [{word, result}]
  done: false,
  gaveUp: false,
  isReplay: false,
};

const $ = id => document.getElementById(id);

// ── Screen routing ─────────────────────────────────────────────────────────────
const screens = {
  home: $('screen-home'),
  game: $('screen-game'),
  win:  $('screen-win'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  if (name === 'game') {
    $('guess-input').focus();
  }
}

// ── Letter boxes ──────────────────────────────────────────────────────────────
function buildLetterBoxes(length) {
  const container = $('letter-boxes');
  container.innerHTML = '';
  container.className = 'letter-boxes' + (length >= 7 ? ' len-7' : '');

  for (let i = 0; i < length; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.dataset.index = i;
    container.appendChild(box);
  }
  syncBoxes('');
}

function syncBoxes(value) {
  const boxes = $('letter-boxes').querySelectorAll('.letter-box');
  boxes.forEach((box, i) => {
    const ch = value[i] ? value[i].toUpperCase() : '';
    box.textContent = ch;
    box.classList.toggle('filled', !!ch);
    box.classList.toggle('active', i === value.length && i < state.length);
  });
}

// Tap/click on boxes area focuses the ghost input
$('letter-boxes').addEventListener('click', () => { $('guess-input').focus(); });
$('letter-boxes').addEventListener('keydown', e => {
  if (e.key === 'Enter') { $('guess-form').requestSubmit(); }
});

const guessInput = $('guess-input');

guessInput.addEventListener('input', () => {
  const cleaned = guessInput.value.replace(/[^a-zA-Z]/g, '').slice(0, state.length);
  guessInput.value = cleaned;
  syncBoxes(cleaned);
  $('guess-error').textContent = '';
});

guessInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); $('guess-form').requestSubmit(); }
});

// ── Confirmation modal ────────────────────────────────────────────────────────
function showConfirm(message, okLabel, onOk) {
  $('confirm-msg').textContent = message;
  $('confirm-ok').textContent = okLabel;
  $('confirm-modal').classList.remove('hidden');

  function close() {
    $('confirm-modal').classList.add('hidden');
    $('confirm-ok').removeEventListener('click', handleOk);
    $('confirm-cancel').removeEventListener('click', close);
    $('confirm-backdrop').removeEventListener('click', close);
  }
  function handleOk() { close(); onOk(); }

  $('confirm-ok').addEventListener('click', handleOk);
  $('confirm-cancel').addEventListener('click', close);
  $('confirm-backdrop').addEventListener('click', close);
}

// ── Home screen ───────────────────────────────────────────────────────────────
function renderLengthPills() {
  const lengths = getWordLengths();
  const todayKey = getTodayKey();
  const pillsEl = $('length-pills');
  pillsEl.innerHTML = '';
  lengths.forEach(len => {
    const played = state.mode === 'daily' ? getDailyPlayed(len, todayKey) : null;
    const btn = document.createElement('button');
    btn.className = 'length-pill'
      + (len === state.length ? ' active' : '')
      + (played ? ' completed' : '');
    btn.textContent = `${len} letters`;
    btn.dataset.len = len;
    btn.addEventListener('click', () => {
      state.length = len;
      pillsEl.querySelectorAll('.length-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
    });
    pillsEl.appendChild(btn);
  });
}

function initHome() {
  renderLengthPills();

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLengthPills();
    });
  });
}

$('btn-play').addEventListener('click', startGame);
$('btn-back').addEventListener('click', () => { showScreen('home'); renderLengthPills(); });
$('btn-win-home').addEventListener('click', () => { showScreen('home'); renderLengthPills(); });
$('btn-play-again').addEventListener('click', () => {
  if (state.mode === 'infinite') { startGame(); } else { showScreen('home'); }
});

['btn-stats-home','btn-stats-game','btn-stats-win'].forEach(id => {
  $(id).addEventListener('click', () => openStats(state.length));
});
$('btn-close-stats').addEventListener('click', closeStats);
$('stats-modal').querySelector('.modal-backdrop').addEventListener('click', closeStats);

// ── Give up ───────────────────────────────────────────────────────────────────
$('btn-give-up').addEventListener('click', () => {
  if (state.done) return;
  showConfirm('Give up and reveal the word?', 'Give up', () => {
    state.done = true;
    state.gaveUp = true;
    if (state.mode === 'daily' && !state.isReplay) {
      recordLoss(state.length);
      setDailyPlayed(state.length, getTodayKey(), { gaveUp: true, guesses: state.guesses });
    } else if (state.mode === 'infinite') {
      recordLoss(state.length);
    }
    showWin(state.target, state.guesses.length);
  });
});

// ── Game ──────────────────────────────────────────────────────────────────────
function startGame(replay = false) {
  state.isReplay = replay;
  state.guesses = [];
  state.done = false;
  state.gaveUp = false;
  const todayKey = getTodayKey();

  if (state.mode === 'daily') {
    state.target = getDailyWord(state.length);
    if (!state.isReplay) {
      const played = getDailyPlayed(state.length, todayKey);
      if (played) {
        showConfirm(
          played.gaveUp
            ? 'You gave up on this one. Want to try again?'
            : `Already solved in ${played.guessCount} guess${played.guessCount === 1 ? '' : 'es'}. Play again?`,
          'Play again',
          () => startGame(true)
        );
        return;
      }
    }
  } else {
    state.target = getRandomWord(state.length);
  }

  buildLetterBoxes(state.length);
  $('guess-list').innerHTML = '';
  guessInput.value = '';
  syncBoxes('');
  $('guess-error').textContent = '';
  $('guess-num').textContent = '1';
  $('game-mode-label').textContent = state.mode === 'daily' ? 'Daily' : 'Infinite';
  $('game-length-label').textContent = `${state.length} letters`;

  // Show initial mystery placeholder
  renderGuessList();
  showScreen('game');
}

$('guess-form').addEventListener('submit', e => {
  e.preventDefault();
  if (state.done) return;

  const raw = guessInput.value.trim().toLowerCase();
  $('guess-error').textContent = '';

  if (raw.length !== state.length) {
    $('guess-error').textContent = `Enter a ${state.length}-letter word.`;
    return;
  }
  if (!isValidWord(raw, state.length)) {
    $('guess-error').textContent = 'Not in word list.';
    return;
  }
  if (state.guesses.some(g => g.word === raw)) {
    $('guess-error').textContent = 'Already guessed.';
    return;
  }

  const result = evaluateGuess(raw, state.target);
  state.guesses.push({ word: raw, result });

  guessInput.value = '';
  syncBoxes('');
  $('guess-num').textContent = state.guesses.length + 1;
  renderGuessList();

  if (result === 'correct') {
    state.done = true;
    const count = state.guesses.length;
    if (!state.isReplay) {
      recordWin(state.length, count);
      if (state.mode === 'daily') {
        setDailyPlayed(state.length, getTodayKey(), { guessCount: count, guesses: state.guesses });
      }
    }
    setTimeout(() => showWin(state.target, count), 700);
  }
});

// ── Alphabetical guess list with mystery placeholder ──────────────────────────
function renderGuessList() {
  const listEl = $('guess-list');
  listEl.innerHTML = '';

  // The correct guess fills the mystery slot; don't show it as a separate row
  const correctGuess = state.guesses.find(g => g.result === 'correct');
  const otherGuesses = state.guesses.filter(g => g.result !== 'correct');

  if (otherGuesses.length === 0 && !correctGuess) {
    listEl.appendChild(makeMysteryRow(null));
    return;
  }

  const sorted = [...otherGuesses].sort((a, b) => a.word.localeCompare(b.word));

  let placeholderIdx = sorted.findIndex(g => g.result === 'before');
  if (placeholderIdx === -1) placeholderIdx = sorted.length;

  sorted.slice(0, placeholderIdx).forEach(g => listEl.appendChild(makeGuessRow(g)));
  listEl.appendChild(makeMysteryRow(correctGuess ? correctGuess.word : null));
  sorted.slice(placeholderIdx).forEach(g => listEl.appendChild(makeGuessRow(g)));
}

function makeGuessRow({ word, result }) {
  const li = document.createElement('li');
  li.className = 'guess-item';

  const wordEl = document.createElement('span');
  wordEl.className = 'guess-word';
  wordEl.textContent = word;

  const hintEl = document.createElement('span');
  hintEl.className = 'guess-hint';

  if (result === 'before') {
    hintEl.classList.add('hint-before');
    hintEl.textContent = '← comes before';
  } else {
    hintEl.classList.add('hint-after');
    hintEl.textContent = 'comes after →';
  }

  li.appendChild(wordEl);
  li.appendChild(hintEl);
  return li;
}

function makeMysteryRow(solvedWord) {
  const li = document.createElement('li');
  li.className = 'guess-item mystery' + (solvedWord ? ' solved' : '');

  const lettersEl = document.createElement('div');
  lettersEl.className = 'mystery-letters';

  for (let i = 0; i < state.length; i++) {
    const box = document.createElement('div');
    box.className = 'mystery-letter';
    if (solvedWord) box.textContent = solvedWord[i].toUpperCase();
    lettersEl.appendChild(box);
  }

  li.appendChild(lettersEl);
  return li;
}

// ── Win screen ────────────────────────────────────────────────────────────────
function showWin(word, guessCount) {
  const wordEl = $('win-word');
  wordEl.textContent = word;
  wordEl.classList.toggle('gave-up', state.gaveUp);

  let countText;
  if (state.gaveUp) {
    countText = `Gave up after ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'}`;
  } else if (state.isReplay) {
    countText = `Solved in ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'} (replay)`;
  } else {
    countText = `Solved in ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'}`;
  }

  $('win-count').textContent = countText;
  $('btn-play-again').textContent = state.mode === 'infinite' ? 'Play again' : 'Back to home';
  showScreen('win');
}

$('btn-share').addEventListener('click', () => {
  const lines = [`Alphabetic — ${state.mode === 'daily' ? 'Daily' : 'Infinite'} (${state.length} letters)`];
  state.guesses.forEach((g, i) => {
    const arrow = g.result === 'correct' ? '✓' : g.result === 'before' ? '←' : '→';
    lines.push(`${i + 1}. ${g.word} ${arrow}`);
  });
  if (state.gaveUp) lines.push('✗ gave up');
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    $('btn-share').textContent = 'Copied!';
    setTimeout(() => { $('btn-share').textContent = 'Copy result'; }, 1800);
  });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
function openStats(activeLength) {
  const lengths = getWordLengths();
  const tabsEl = $('stats-length-tabs');
  tabsEl.innerHTML = '';
  lengths.forEach(len => {
    const btn = document.createElement('button');
    btn.className = 'stats-tab' + (len === activeLength ? ' active' : '');
    btn.textContent = `${len}`;
    btn.addEventListener('click', () => {
      tabsEl.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderStats(len);
    });
    tabsEl.appendChild(btn);
  });
  renderStats(activeLength);
  $('stats-modal').classList.remove('hidden');
}

function closeStats() { $('stats-modal').classList.add('hidden'); }

function renderStats(length) {
  const s = getStats(length);
  const winPct = s.totalGames ? Math.round((s.wins / s.totalGames) * 100) : 0;

  $('stats-grid').innerHTML = `
    <div class="stat-cell"><span class="stat-value">${s.totalGames}</span><span class="stat-label">Played</span></div>
    <div class="stat-cell"><span class="stat-value">${winPct}</span><span class="stat-label">Win %</span></div>
    <div class="stat-cell"><span class="stat-value">${s.currentStreak}</span><span class="stat-label">Streak</span></div>
    <div class="stat-cell"><span class="stat-value">${s.bestStreak}</span><span class="stat-label">Best</span></div>
  `;

  const counts = s.guessCounts;
  const maxCount = Math.max(1, ...Object.values(counts));
  const chartEl = $('stats-chart');
  chartEl.innerHTML = '';

  for (let i = 1; i <= 12; i++) {
    const c = counts[i] || 0;
    if (i > 6 && c === 0) continue;
    const pct = Math.round((c / maxCount) * 100);
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <span class="chart-num">${i}</span>
      <div class="chart-bar-wrap">
        <div class="chart-bar" style="width:${Math.max(pct, c > 0 ? 8 : 0)}%">${c > 0 ? c : ''}</div>
      </div>
    `;
    chartEl.appendChild(row);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
initHome();
showScreen('home');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const gameEl = screens.game;
    if (gameEl.classList.contains('active')) {
      gameEl.style.height = `${window.visualViewport.height}px`;
    } else {
      gameEl.style.height = '';
    }
  });
}
