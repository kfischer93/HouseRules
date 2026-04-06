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
let wordList = [];
let currentIndex = 0;
let score = 0;
let skips = 0;
let connectedPlayers = [];

// --- GAME SETUP STATE ---
let gameSettings = {
  style: null,
  numPlayers: 6,
  cardsPerPlayer: 5,
  timerSeconds: 60,
  superlatives: false,
  adult: false,
};

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

// --- STEP 1: PICK STYLE ---
function pickStyle(styleName, el) {
  const soon = ['versus'];
  if (soon.includes(styleName)) return;
  gameSettings.style = styleName;
  document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
  document.getElementById('style-next-btn').disabled = false;
}

function goToDetails() {
  if (!gameSettings.style) return;
  const subtitleMap = { fishbowl: 'fishbowl details', charades: 'charades details', tinder: 'tinder details' };
  document.getElementById('details-subtitle').textContent = subtitleMap[gameSettings.style] || 'configure your game';
  updateDetailsForStyle();
  goTo('screen-details');
}

// --- STEP 2: DETAILS ---
function updateDetailsForStyle() {
  const isTinder = gameSettings.style === 'tinder';
  const isWordGame = ['fishbowl', 'charades'].includes(gameSettings.style);
  document.getElementById('tinder-label-section').style.display = isTinder ? 'block' : 'none';
  document.getElementById('custom-words-section').style.display = isWordGame ? 'block' : 'none';
}

function adjustCounter(id, delta) {
  const el = document.getElementById(id);
  const min = id === 'cards-per' ? 1 : 2;
  const max = id === 'cards-per' ? 20 : 30;
  let val = Math.min(max, Math.max(min, parseInt(el.textContent) + delta));
  el.textContent = val;
  if (id === 'num-players') gameSettings.numPlayers = val;
  if (id === 'cards-per') gameSettings.cardsPerPlayer = val;
}

function adjustTimer(delta) {
  gameSettings.timerSeconds = Math.min(180, Math.max(15, gameSettings.timerSeconds + delta));
  document.getElementById('timer-display').textContent = gameSettings.timerSeconds + 's';
}

function toggleSetting(key) {
  gameSettings[key] = !gameSettings[key];
  const btn = document.getElementById('toggle-' + key);
  btn.textContent = gameSettings[key] ? 'on' : 'off';
  btn.classList.toggle('toggle-btn--on', gameSettings[key]);
}

// --- STEP 3: REVIEW ---
function goToReview() {
  const customWords = document.getElementById('custom-words').value.trim();
  const iconMap = { fishbowl: '🐟', charades: '🎭', tinder: '🔥' };
  document.getElementById('review-game').textContent = (iconMap[gameSettings.style] || '') + ' ' + gameSettings.style;
  document.getElementById('review-players').textContent = gameSettings.numPlayers;
  document.getElementById('review-cards').textContent = gameSettings.cardsPerPlayer;
  document.getElementById('review-timer').textContent = gameSettings.timerSeconds + ' seconds';
  document.getElementById('review-superlatives').textContent = gameSettings.superlatives ? '✓ on' : 'off';
  document.getElementById('review-adult').textContent = gameSettings.adult ? '✓ on' : 'off';
  const wordsRow = document.getElementById('review-words-row');
  if (gameSettings.style === 'tinder') {
    const ll = document.getElementById('tinder-label-left').value.trim() || 'not';
    const lr = document.getElementById('tinder-label-right').value.trim() || 'hot';
    document.getElementById('review-words').textContent = ll + ' / ' + lr;
    wordsRow.style.display = 'flex';
    document.querySelector('#review-words-row .review-label').textContent = 'labels';
  } else if (customWords) {
    const count = customWords.split(',').filter(w => w.trim()).length;
    document.getElementById('review-words').textContent = count + ' custom words';
    wordsRow.style.display = 'flex';
    document.querySelector('#review-words-row .review-label').textContent = 'custom words';
  } else {
    wordsRow.style.display = 'none';
  }
  goTo('screen-review');
}

function checkStartReady() {}

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('custom-words');
  if (textarea) textarea.addEventListener('input', checkStartReady);
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
  if (!code || code.length < 4) { showJoinError('enter a valid room code!'); return; }
  const btn = document.getElementById('join-submit-btn');
  btn.disabled = true;
  btn.textContent = 'joining...';
  try {
    await _insertCoin({ skipLobby: true, roomCode: code, playerName: nameInput || undefined });
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
  if (gameSettings.style === 'tinder') { startTinder(); return; }

  const customInput = document.getElementById('custom-words').value.trim();
  const preloaded = preloadedWords[gameSettings.style] || [];
  const custom = customInput.length ? customInput.split(',').map(w => w.trim()).filter(w => w.length > 0) : [];
  wordList = shuffle([...preloaded, ...custom]);

  if (!wordList.length) { alert('add some words first!'); return; }

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
    btn.textContent = "let's go! open lobby →";
    return;
  }

  _setState("wordList", JSON.stringify(wordList));
  _setState("currentIndex", 0);
  _setState("score", 0);
  _setState("skips", 0);
  _setState("gameStarted", false);
  _setState("gameName", gameSettings.style || "custom");
  _setState("timerSeconds", gameSettings.timerSeconds);

  showHostLobby();
}

// --- CUSTOM HOST LOBBY ---
function showHostLobby() {
  goTo('screen-lobby-host');
  setTimeout(() => { const n = document.getElementById('host-name-input'); if (n && !n.value) n.focus(); }, 100);
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
    return '<div class="lobby-player-chip" style="background:' + color + '"><span class="lobby-player-dot"></span>' + name + '</div>';
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
  const hostName = document.getElementById('host-name-input').value.trim() || 'host';
  _setState("hostName", hostName);
  _setState("gameStarted", true);
  setupGame();
}

// --- SETUP AFTER LOBBY ---
function setupGame() {
  const gameName = _getState2("gameName");
  if (gameName === 'tinder') { showTinderUploadScreen(); return; }

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

// ==============================================
//  TINDER GAME
// ==============================================

let tinderPhotos = [];
let tinderCurrentIdx = 0;
let tinderMyVote = null;
let tinderLabelLeft = 'not';
let tinderLabelRight = 'hot';
let tinderReadyPlayers = {};
let tinderSwipeStartX = 0;
let tinderDragging = false;

function applyPreset(left, right) {
  document.getElementById('tinder-label-left').value = left;
  document.getElementById('tinder-label-right').value = right;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
  event.target.classList.add('preset-btn--active');
}

async function startTinder() {
  const labelLeft = document.getElementById('tinder-label-left').value.trim() || 'not';
  const labelRight = document.getElementById('tinder-label-right').value.trim() || 'hot';
  tinderLabelLeft = labelLeft;
  tinderLabelRight = labelRight;

  const btn = document.getElementById('start-btn');
  btn.disabled = true;
  btn.textContent = 'opening room...';

  try {
    await _insertCoin({ skipLobby: true });
  } catch (err) {
    goTo('screen-home');
    btn.disabled = false;
    btn.textContent = "let's go! open lobby →";
    return;
  }

  const hostName = document.getElementById('host-name-input').value.trim() || 'host';
  _setState("hostName", hostName);
  _setState("gameName", "tinder");
  _setState("tinderLabelLeft", labelLeft);
  _setState("tinderLabelRight", labelRight);
  _setState("tinderPhotosPerPlayer", gameSettings.cardsPerPlayer);
  _setState("tinderPhase", "upload");
  _setState("tinderReadyPlayers", JSON.stringify({}));
  _setState("tinderAllPhotos", JSON.stringify([]));
  _setState("tinderVotes", JSON.stringify({}));
  _setState("tinderCurrentIdx", 0);
  _setState("gameStarted", false);

  showTinderUploadScreen();
}

function showTinderUploadScreen() {
  goTo('screen-tinder-upload');

  const roomCode = _getRoomCode();
  document.getElementById('tinder-upload-pill').textContent = 'room: ' + roomCode;

  const perPlayer = _getState2("tinderPhotosPerPlayer") || 3;
  document.getElementById('tinder-upload-subtitle').textContent = 'add ' + perPlayer + ' photos';
  document.getElementById('tinder-upload-count').textContent = '0 / ' + perPlayer + ' added';

  tinderPhotos = [];
  tinderReadyPlayers = {};

  connectedPlayers = [];
  _onPlayerJoin((player) => {
    connectedPlayers.push(player);
    updateTinderReadyList();
    player.onQuit(() => {
      connectedPlayers = connectedPlayers.filter(p => p !== player);
      updateTinderReadyList();
    });
  });

  _onStateChange("tinderReadyPlayers", (val) => {
    tinderReadyPlayers = JSON.parse(val || '{}');
    updateTinderReadyList();
  });

  _onStateChange("tinderPhase", (val) => {
    if (val === 'voting') startTinderVoting();
  });

  updateTinderReadyList();
}

function updateTinderReadyList() {
  const readyCount = Object.keys(tinderReadyPlayers).length;
  const totalCount = connectedPlayers.length + 1;
  document.getElementById('tinder-ready-count').textContent = readyCount + ' / ' + totalCount + ' players ready';

  const colors = ['#EE94B8', '#E9C12A', '#7A9476', '#FE564B', '#C9756C', '#a8c5da'];
  document.getElementById('tinder-ready-list').innerHTML = connectedPlayers.map((p, i) => {
    const name = p.getProfile ? (p.getProfile().name || ('player ' + (i + 1))) : ('player ' + (i + 1));
    const isReady = tinderReadyPlayers[p.id];
    return '<div class="lobby-player-chip" style="background:' + colors[i % colors.length] + ';opacity:' + (isReady ? '1' : '0.4') + '">' +
      '<span class="lobby-player-dot"></span>' + name + (isReady ? ' ✓' : '') + '</div>';
  }).join('');

  const hostReady = tinderReadyPlayers['host'];
  const allReady = hostReady && connectedPlayers.every(p => tinderReadyPlayers[p.id]);
  const launchDiv = document.getElementById('tinder-host-launch');
  if (launchDiv && _isHost()) launchDiv.style.display = allReady ? 'block' : 'none';
}

function handlePhotoUpload(event) {
  const perPlayer = parseInt(_getState2("tinderPhotosPerPlayer") || 3);
  const files = Array.from(event.target.files);

  files.forEach(file => {
    if (tinderPhotos.length >= perPlayer) return;

    const countEl = document.getElementById('tinder-upload-count');
    countEl.textContent = 'compressing...';

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_WIDTH) { height = Math.round(height * MAX_WIDTH / width); width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width = Math.round(width * MAX_HEIGHT / height); height = MAX_HEIGHT; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        console.log('compressed photo:', Math.round((compressed.length * 0.75) / 1024) + 'KB');
        tinderPhotos.push({ dataUrl: compressed });
        updateUploadUI(perPlayer);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function updateUploadUI(perPlayer) {
  const count = tinderPhotos.length;
  document.getElementById('tinder-upload-count').textContent = count + ' / ' + perPlayer + ' added';
  const thumbRow = document.getElementById('tinder-thumb-row');
  thumbRow.innerHTML = tinderPhotos.map((p, i) =>
    '<div class="tinder-thumb" style="background-image:url(' + p.dataUrl + ')">' +
    '<button class="tinder-thumb-remove" onclick="removeTinderPhoto(' + i + ')">×</button></div>'
  ).join('');
  document.getElementById('tinder-upload-done-btn').disabled = count === 0;
  const area = document.getElementById('tinder-upload-area');
  area.style.opacity = count >= perPlayer ? '0.4' : '1';
  area.style.pointerEvents = count >= perPlayer ? 'none' : 'auto';
}

function removeTinderPhoto(idx) {
  tinderPhotos.splice(idx, 1);
  const perPlayer = parseInt(_getState2("tinderPhotosPerPlayer") || 3);
  updateUploadUI(perPlayer);
}

function submitPhotos() {
  if (tinderPhotos.length === 0) return;
  const myName = _isHost() ? (_getState2("hostName") || 'host') : (_myPlayer() ? (_myPlayer().getProfile().name || 'player') : 'player');
  const myId = _isHost() ? 'host' : (_myPlayer() ? _myPlayer().id : 'p' + Date.now());
  const existing = JSON.parse(_getState2("tinderAllPhotos") || "[]");
  const myPhotos = tinderPhotos.map((p, i) => ({
    dataUrl: p.dataUrl,
    ownerName: myName,
    ownerId: myId,
    key: myId + '_' + i
  }));
  _setState("tinderAllPhotos", JSON.stringify([...existing, ...myPhotos]));
  const ready = JSON.parse(_getState2("tinderReadyPlayers") || "{}");
  ready[myId] = true;
  _setState("tinderReadyPlayers", JSON.stringify(ready));
  document.getElementById('tinder-upload-done-btn').style.display = 'none';
  document.getElementById('tinder-waiting-msg').style.display = 'block';
  if (_isHost()) updateTinderReadyList();
}

function launchTinder() {
  if (!_isHost()) return;
  const allPhotos = JSON.parse(_getState2("tinderAllPhotos") || "[]");
  _setState("tinderAllPhotos", JSON.stringify(shuffle(allPhotos)));
  _setState("tinderCurrentIdx", 0);
  _setState("tinderVotes", JSON.stringify({}));
  _setState("tinderPhase", "voting");
}

function startTinderVoting() {
  tinderLabelLeft = _getState2("tinderLabelLeft") || 'not';
  tinderLabelRight = _getState2("tinderLabelRight") || 'hot';
  tinderCurrentIdx = _getState2("tinderCurrentIdx") || 0;
  tinderMyVote = null;

  goTo('screen-tinder-vote');

  document.getElementById('tinder-label-left-display').textContent = tinderLabelLeft;
  document.getElementById('tinder-label-right-display').textContent = tinderLabelRight;
  document.getElementById('tinder-btn-left-label').textContent = tinderLabelLeft;
  document.getElementById('tinder-btn-right-label').textContent = tinderLabelRight;

  showCurrentTinderPhoto();

  _onStateChange("tinderCurrentIdx", (val) => {
    tinderCurrentIdx = val;
    tinderMyVote = null;
    document.getElementById('tinder-voted-msg').style.display = 'none';
    document.getElementById('tinder-btn-left').disabled = false;
    document.getElementById('tinder-btn-right').disabled = false;
    showCurrentTinderPhoto();
  });

  _onStateChange("tinderPhase", (val) => {
    if (val === 'results') showTinderResults();
  });
}

function showCurrentTinderPhoto() {
  const allPhotos = JSON.parse(_getState2("tinderAllPhotos") || "[]");
  if (tinderCurrentIdx >= allPhotos.length) {
    if (_isHost()) _setState("tinderPhase", "results");
    return;
  }
  const photo = allPhotos[tinderCurrentIdx];
  document.getElementById('tinder-photo-img').src = photo.dataUrl;
  document.getElementById('tinder-progress-pill').textContent = (tinderCurrentIdx + 1) + ' / ' + allPhotos.length;
  const card = document.getElementById('tinder-photo-card');
  card.style.transform = '';
  card.style.transition = '';
  document.getElementById('tinder-overlay-left').style.opacity = '0';
  document.getElementById('tinder-overlay-right').style.opacity = '0';
}

function castVote(direction) {
  if (tinderMyVote) return;
  tinderMyVote = direction;
  const allPhotos = JSON.parse(_getState2("tinderAllPhotos") || "[]");
  const photo = allPhotos[tinderCurrentIdx];
  if (!photo) return;
  const votes = JSON.parse(_getState2("tinderVotes") || "{}");
  if (!votes[photo.key]) votes[photo.key] = { left: 0, right: 0 };
  votes[photo.key][direction]++;
  _setState("tinderVotes", JSON.stringify(votes));
  const card = document.getElementById('tinder-photo-card');
  card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
  card.style.transform = direction === 'left' ? 'translateX(-120%) rotate(-20deg)' : 'translateX(120%) rotate(20deg)';
  document.getElementById('tinder-btn-left').disabled = true;
  document.getElementById('tinder-btn-right').disabled = true;
  document.getElementById('tinder-voted-msg').style.display = 'block';
  if (_isHost()) setTimeout(() => { _setState("tinderCurrentIdx", tinderCurrentIdx + 1); }, 800);
}

function tinderTouchStart(e) {
  tinderSwipeStartX = e.touches[0].clientX;
  tinderDragging = true;
}

function tinderTouchMove(e) {
  if (!tinderDragging || tinderMyVote) return;
  const dx = e.touches[0].clientX - tinderSwipeStartX;
  const card = document.getElementById('tinder-photo-card');
  card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * 0.08) + 'deg)';
  card.style.transition = 'none';
  document.getElementById('tinder-overlay-left').style.opacity = dx < -30 ? Math.min(1, Math.abs(dx) / 120) : 0;
  document.getElementById('tinder-overlay-right').style.opacity = dx > 30 ? Math.min(1, dx / 120) : 0;
}

function tinderTouchEnd(e) {
  if (!tinderDragging) return;
  tinderDragging = false;
  const dx = e.changedTouches[0].clientX - tinderSwipeStartX;
  if (dx < -80) castVote('left');
  else if (dx > 80) castVote('right');
  else {
    const card = document.getElementById('tinder-photo-card');
    card.style.transition = 'transform 0.3s ease';
    card.style.transform = '';
    document.getElementById('tinder-overlay-left').style.opacity = 0;
    document.getElementById('tinder-overlay-right').style.opacity = 0;
  }
}

function tinderMouseDown(e) {
  tinderSwipeStartX = e.clientX;
  tinderDragging = true;
  const onMove = (e) => {
    if (!tinderDragging || tinderMyVote) return;
    const dx = e.clientX - tinderSwipeStartX;
    const card = document.getElementById('tinder-photo-card');
    card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * 0.08) + 'deg)';
    card.style.transition = 'none';
    document.getElementById('tinder-overlay-left').style.opacity = dx < -30 ? Math.min(1, Math.abs(dx) / 120) : 0;
    document.getElementById('tinder-overlay-right').style.opacity = dx > 30 ? Math.min(1, dx / 120) : 0;
  };
  const onUp = (e) => {
    tinderDragging = false;
    const dx = e.clientX - tinderSwipeStartX;
    if (dx < -80) castVote('left');
    else if (dx > 80) castVote('right');
    else {
      const card = document.getElementById('tinder-photo-card');
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = '';
      document.getElementById('tinder-overlay-left').style.opacity = 0;
      document.getElementById('tinder-overlay-right').style.opacity = 0;
    }
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function showTinderResults() {
  goTo('screen-tinder-results');
  const allPhotos = JSON.parse(_getState2("tinderAllPhotos") || "[]");
  const votes = JSON.parse(_getState2("tinderVotes") || "{}");
  const labelLeft = _getState2("tinderLabelLeft") || 'not';
  const labelRight = _getState2("tinderLabelRight") || 'hot';
  document.getElementById('tinder-results-list').innerHTML = allPhotos.map((photo) => {
    const v = votes[photo.key] || { left: 0, right: 0 };
    const total = v.left + v.right;
    const rightPct = total > 0 ? Math.round((v.right / total) * 100) : 0;
    return '<div class="tinder-result-card">' +
      '<img class="tinder-result-img" src="' + photo.dataUrl + '" />' +
      '<div class="tinder-result-info">' +
        '<p class="tinder-result-owner">' + photo.ownerName + '</p>' +
        '<div class="tinder-result-bar"><div class="tinder-result-fill" style="width:' + rightPct + '%"></div></div>' +
        '<div class="tinder-result-labels"><span>' + labelLeft + ': ' + v.left + '</span><span>' + labelRight + ': ' + v.right + '</span></div>' +
      '</div></div>';
  }).join('');
}