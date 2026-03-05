// =====================
//  HOUSE RULES - script.js
// =====================

let _insertCoin, _isHost, _myPlayer, _onPlayerJoin, _setState, _getState2, _onStateChange, _getRoomCode;

window.addEventListener('load', () => {
  ({
    insertCoin: _insertCoin,
    isHost: _isHost,
    myPlayer: _myPlayer,
    onPlayerJoin: _onPlayerJoin,
    setState: _setState,
    getState: _getState2,
    onStateChange: _onStateChange,
    getRoomCode: _getRoomCode,
  } = Playroom);
});

// --- STATE ---
let selectedGame = null;
let wordList = [];
let currentIndex = 0;
let score = 0;
let skips = 0;
let connectedPlayers = [];

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
  document.getElementById('custom-words').value = preloadedWords[gameName].join(', ');
  checkStartReady();
}

function checkStartReady() {
  const hasWords = document.getElementById('custom-words').value.trim().length > 0;
  document.getElementById('start-btn').disabled = !hasWords;
}

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('custom-words');
  if (textarea) textarea.addEventListener('input', checkStartReady);

  // Auto-fill room code from URL hash if present (for joiners)
  const hash = window.location.hash;
  const match = hash.match(/[#&]r=([A-Z0-9]+)/i);
  if (match) {
    const codeInput = document.getElementById('join-code-input');
    if (codeInput) codeInput.value = match[1].toUpperCase();
    goTo('screen-join');
  }
});

// --- JOIN GAME (non-host) ---
function goToJoin() {
  goTo('screen-join');
}

async function submitJoin() {
  const code = document.getElementById('join-code-input').value.trim().toUpperCase();
  const nameInput = document.getElementById('join-name-input').value.trim();

  if (!code || code.length < 4) {
    showJoinError('enter a valid room code!');
    return;
  }

  const btn = document.getElementById('join-submit-btn');
  btn.disabled = true;
  btn.textContent = 'joining...';

  try {
    await _insertCoin({
      skipLobby: true,
      roomCode: code,
      playerName: nameInput || undefined,
    });
    setupGame();
  } catch (err) {
    showJoinError("couldn't find that room. check the code!");
    btn.disabled = false;
    btn.textContent = 'join game →';
  }
}

function showJoinError(msg) {
  const el = document.getElementById('join-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
}

// --- START GAME (host) ---
async function startGame() {
  const customInput = document.getElementById('custom-words').value.trim();

  if (!customInput.length) {
    alert('please enter some words or pick a game!');
    return;
  }

  wordList = customInput.split(',').map(w => w.trim()).filter(w => w.length > 0);
  wordList = shuffle(wordList);
  currentIndex = 0;
  score = 0;
  skips = 0;

  const btn = document.getElementById('start-btn');
  btn.disabled = true;
  btn.textContent = 'opening room...';

  try {
    await _insertCoin({ skipLobby: true });
  } catch (err) {
    goTo('screen-home');
    btn.disabled = false;
    btn.textContent = 'start game + open lobby';
    return;
  }

  _setState("wordList", JSON.stringify(wordList));
  _setState("currentIndex", 0);
  _setState("score", 0);
  _setState("skips", 0);
  _setState("gameStarted", false);
  _setState("gameName", selectedGame || "custom");

  showHostLobby();
}

// --- CUSTOM HOST LOBBY ---
function showHostLobby() {
  goTo('screen-lobby-host');

  const roomCode = _getRoomCode();
  document.getElementById('lobby-room-code').textContent = roomCode;

  const shareUrl = window.location.origin + window.location.pathname + '#r=' + roomCode;
  document.getElementById('lobby-share-link').textContent = shareUrl;

  connectedPlayers = [];
  _onPlayerJoin((player) => {
    connectedPlayers.push(player);
    updateLobbyPlayers();
    player.onQuit(() => {
      connectedPlayers = connectedPlayers.filter(p => p !== player);
      updateLobbyPlayers();
    });
  });

  updateLobbyPlayers();
}

function updateLobbyPlayers() {
  const list = document.getElementById('lobby-players-list');
  if (!list) return;

  const count = connectedPlayers.length;
  document.getElementById('lobby-player-count').textContent =
    count === 0 ? 'waiting for players...' : count + ' player' + (count !== 1 ? 's' : '') + ' in the room';

  const colors = ['#EE94B8', '#E9C12A', '#7A9476', '#FE564B', '#C9756C', '#a8c5da'];
  list.innerHTML = connectedPlayers.map((p, i) => {
    const name = p.getProfile ? (p.getProfile().name || ('player ' + (i + 1))) : ('player ' + (i + 1));
    const color = colors[i % colors.length];
    return '<div class="lobby-player-chip" style="background:' + color + '">' +
      '<span class="lobby-player-dot"></span>' + name + '</div>';
  }).join('');
}

function copyShareLink() {
  const link = document.getElementById('lobby-share-link').textContent;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.getElementById('copy-link-btn');
    btn.textContent = 'copied! ✓';
    setTimeout(() => { btn.textContent = 'copy link'; }, 2000);
  });
}

function launchGame() {
  if (!_isHost()) return;
  _setState("gameStarted", true);
  setupGame();
}

// --- SETUP AFTER LOBBY ---
function setupGame() {
  if (_isHost()) {
    goTo('screen-game');
    document.getElementById('game-name-display').textContent = _getState2("gameName") || "custom";
    document.getElementById('word-actions').style.display = 'flex';
    document.getElementById('room-pill').textContent = 'room: ' + _getRoomCode();
    updateHostDisplay();
  } else {
    goTo('screen-player');
    updatePlayerDisplay();
  }

  _onPlayerJoin((player) => {
    updatePlayersBar();
    player.onQuit(() => updatePlayersBar());
  });

  _onStateChange("currentIndex", (val) => {
    currentIndex = val;
    wordList = JSON.parse(_getState2("wordList") || "[]");
    if (_isHost()) { updateHostDisplay(); } else { updatePlayerDisplay(); }
  });

  _onStateChange("score", (val) => {
    score = val;
    document.getElementById('score-count').textContent = score;
    document.getElementById('player-score').textContent = score;
  });

  _onStateChange("skips", (val) => {
    skips = val;
    document.getElementById('skip-count').textContent = skips;
    document.getElementById('player-skips').textContent = skips;
  });

  if (!_isHost()) {
    _onStateChange("gameStarted", (val) => {
      if (val === true) { updatePlayerDisplay(); }
    });
  }
}

// --- HOST DISPLAY ---
function updateHostDisplay() {
  const wordEl = document.getElementById('current-word');
  const card = document.getElementById('word-card');

  wordList = JSON.parse(_getState2("wordList") || "[]");
  currentIndex = _getState2("currentIndex") || 0;

  if (currentIndex >= wordList.length) {
    wordEl.textContent = '🎉 all done!';
    document.getElementById('round-label').textContent = 'final score: ' + score + ' words';
    document.getElementById('word-actions').style.display = 'none';
    return;
  }

  card.classList.remove('flip');
  void card.offsetWidth;
  card.classList.add('flip');

  wordEl.textContent = wordList[currentIndex];
  document.getElementById('words-left-display').textContent = (wordList.length - currentIndex) + ' left';
}

// --- PLAYER DISPLAY ---
function updatePlayerDisplay() {
  const list = JSON.parse(_getState2("wordList") || "[]");
  const idx = _getState2("currentIndex") || 0;
  const wordEl = document.getElementById('player-current-word');

  const card = document.getElementById('player-word-card');
  card.classList.remove('flip');
  void card.offsetWidth;
  card.classList.add('flip');

  wordEl.textContent = idx < list.length ? list[idx] : '🎉 all done!';
  document.getElementById('player-score').textContent = _getState2("score") || 0;
  document.getElementById('player-skips').textContent = _getState2("skips") || 0;
}

// --- PLAYERS BAR ---
function updatePlayersBar() {
  const bar = document.getElementById('players-bar');
  if (bar) bar.innerHTML = '<span class="player-chip">players connected ✓</span>';
}

// --- GAME CONTROLS (host only) ---
function nextWord() {
  if (!_isHost()) return;
  _setState("score", (_getState2("score") || 0) + 1);
  _setState("currentIndex", (_getState2("currentIndex") || 0) + 1);
}

function skipWord() {
  if (!_isHost()) return;
  const newSkips = (_getState2("skips") || 0) + 1;
  let list = JSON.parse(_getState2("wordList") || "[]");
  const idx = _getState2("currentIndex") || 0;
  const skipped = list.splice(idx, 1)[0];
  list.push(skipped);
  _setState("wordList", JSON.stringify(list));
  _setState("skips", newSkips);
  _setState("currentIndex", idx);
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