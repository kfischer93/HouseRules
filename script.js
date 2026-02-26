// =====================
//  HOUSE RULES - script.js 
// =====================

let insertCoin, isHost, myPlayer, onPlayerJoin, setState, getState, onStateChange;

window.addEventListener('load', () => {
  ({ insertCoin, isHost, myPlayer, onPlayerJoin, setState, getState, onStateChange } = Playroom);
});
// --- STATE ---
let selectedGame = null;
let wordList = [];
let currentIndex = 0;
let score = 0;
let skips = 0;

// --- PRE-LOADED WORDS ---
const preloadedWords = {
  fishbowl: [
    "sprinting to class on the hill", "the c4c at 11pm", "boulder creek tubing",
    "hiking chautauqua hungover", "running into your ex on the pearl street mall",
    "the line at illegal pete's", "getting caught in a hailstorm on campus",
    "lost on the flatirons trail", "freshman dorms smell", "game day at folsom field",
    "the buffalo stampede", "boulder bubble", "climbing the fountain at fiske",
    "skipping class for a powder day", "the walk of shame down broadway",
    "first time driving in snow", "elevation makes you drunk faster",
    "everyone owns a patagonia", "moose sighting on a ski run",
    "red rocks at sunset", "i-70 traffic on sunday", "fourteener bragging rights",
    "dispensary loyalty card", "hot springs road trip", "breckenridge ski trip drama",
    "brat summer", "demure and mindful", "the tortured poets department",
    "charli xcx at coachella", "sabrina carpenter short n sweet tour",
    "girl dinner", "brain rot humor", "that girl era", "he's so babygirl",
    "roman empire thoughts", "lana del rey sad girl autumn",
    "talking stage that never ends", "main character moment",
    "beige flag in a relationship", "delulu to solulu"
  ],
  charades: [
    "riding an electric scooter downhill", "trying to find parking on campus",
    "doing yoga on the quad", "eating a chipotle burrito in one sitting",
    "skiing moguls for the first time", "getting altitude sickness",
    "a buffalo charging at you", "setting up a hammock between trees",
    "hiking in crocs", "doing the worm at a house party",
    "whitewater rafting and freaking out", "fishing and catching nothing",
    "building a snowman in april", "driving over a mountain pass in a blizzard",
    "spotting a bear at a campsite", "snowboarding and eating it on the bunny slope",
    "doing the apple dance", "brat dancing", "eras tour crowd moment",
    "doomscrolling at 2am", "posting your that girl morning routine",
    "manifesting out loud", "roman empire staring into the distance",
    "getting a cortisol face reading", "being a golden retriever boyfriend",
    "crying at a taylor swift song in public"
  ]
};

// --- NAVIGATION ---
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// --- GAME SELECTION ---
function selectGame(gameName, el) {
  selectedGame = gameName;
  document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const wordInput = document.getElementById('custom-words');
  wordInput.value = preloadedWords[gameName].join(', ');
  checkStartReady();
}

function checkStartReady() {
  const hasWords = document.getElementById('custom-words').value.trim().length > 0;
  document.getElementById('start-btn').disabled = !hasWords;
}

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('custom-words');
  if (textarea) textarea.addEventListener('input', checkStartReady);
});

// --- JOIN GAME (non-host) ---
async function joinGame() {
  try {
    await insertCoin({ streamMode: false });
    setupGame();
  } catch (err) {
    goTo('screen-home');
  }
}
// --- START GAME (host) ---
async function startGame() {
  const customInput = document.getElementById('custom-words').value.trim();

  if (customInput.length > 0) {
    wordList = customInput.split(',').map(w => w.trim()).filter(w => w.length > 0);
  } else {
    alert('please enter some words or pick a game!');
    return;
  }

  wordList = shuffle(wordList);
  currentIndex = 0;
  score = 0;
  skips = 0;

    document.getElementById('cancel-lobby').style.display = 'block';
    try {
        await insertCoin();
    } catch (err) {
        goTo('screen-home');
    }
    document.getElementById('cancel-lobby').style.display = 'none';

  // Push initial state to all players
  setState("wordList", JSON.stringify(wordList));
  setState("currentIndex", 0);
  setState("score", 0);
  setState("skips", 0);
  setState("gameStarted", true);
  setState("gameName", selectedGame || "custom");

  setupGame();
}

// --- SETUP AFTER LOBBY ---
function setupGame() {
  if (isHost()) {
    goTo('screen-game');
    document.getElementById('game-name-display').textContent = getState("gameName") || "custom";
    document.getElementById('word-actions').style.display = 'flex';
    updateHostDisplay();
  } else {
    goTo('screen-player');
    updatePlayerDisplay();
  }

  onPlayerJoin((player) => {
    updatePlayersBar();
    player.onQuit(() => updatePlayersBar());
  });

  onStateChange("currentIndex", (val) => {
    currentIndex = val;
    wordList = JSON.parse(getState("wordList") || "[]");
    if (isHost()) {
      updateHostDisplay();
    } else {
      updatePlayerDisplay();
    }
  });

  onStateChange("score", (val) => {
    score = val;
    document.getElementById('score-count').textContent = score;
    document.getElementById('player-score').textContent = score;
  });

  onStateChange("skips", (val) => {
    skips = val;
    document.getElementById('skip-count').textContent = skips;
    document.getElementById('player-skips').textContent = skips;
  });
}

// --- HOST DISPLAY ---
function updateHostDisplay() {
  const wordEl = document.getElementById('current-word');
  const card = document.getElementById('word-card');

  wordList = JSON.parse(getState("wordList") || "[]");
  currentIndex = getState("currentIndex") || 0;

  if (currentIndex >= wordList.length) {
    wordEl.textContent = '🎉 all done!';
    document.getElementById('round-label').textContent = `final score: ${score} words`;
    document.getElementById('word-actions').style.display = 'none';
    return;
  }

  card.classList.remove('flip');
  void card.offsetWidth;
  card.classList.add('flip');

  wordEl.textContent = wordList[currentIndex];
  document.getElementById('words-left-display').textContent = `${wordList.length - currentIndex} left`;
}

// --- PLAYER DISPLAY ---
function updatePlayerDisplay() {
  const list = JSON.parse(getState("wordList") || "[]");
  const idx = getState("currentIndex") || 0;
  const wordEl = document.getElementById('player-current-word');

  const card = document.getElementById('player-word-card');
  card.classList.remove('flip');
  void card.offsetWidth;
  card.classList.add('flip');

  wordEl.textContent = idx < list.length ? list[idx] : '🎉 all done!';
  document.getElementById('player-score').textContent = getState("score") || 0;
  document.getElementById('player-skips').textContent = getState("skips") || 0;
}

// --- PLAYERS BAR ---
function updatePlayersBar() {
  const bar = document.getElementById('players-bar');
  if (bar) bar.innerHTML = '<span class="player-chip">players connected ✓</span>';
}

// --- GAME CONTROLS (host only) ---
function nextWord() {
  if (!isHost()) return;
  const newScore = (getState("score") || 0) + 1;
  const newIndex = (getState("currentIndex") || 0) + 1;
  setState("score", newScore);
  setState("currentIndex", newIndex);
}

function skipWord() {
  if (!isHost()) return;
  const newSkips = (getState("skips") || 0) + 1;
  let list = JSON.parse(getState("wordList") || "[]");
  const idx = getState("currentIndex") || 0;
  const skipped = list.splice(idx, 1)[0];
  list.push(skipped);
  setState("wordList", JSON.stringify(list));
  setState("skips", newSkips);
  setState("currentIndex", idx);
}

function endGame() {
  goTo('screen-home');
}

// --- UTILITY ---
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cancelLobby() {
  document.getElementById('cancel-lobby').style.display = 'none';
  location.reload(); // easiest way to fully exit Playroom's overlay
}