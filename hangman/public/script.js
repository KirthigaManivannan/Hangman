// Break Room Hangman - browser side.
// The server holds the game. This page shows what the server sends
// and sends back the player's actions. (Avatars live in avatars.js.)
var S = null;
var myId = null;
var es = null;
var selectedName = null;
var lastRound = -1, lastWrong = 0, lastFlash = 0, lastChatId = -1;
var lastThrowSeq = 0, lastGuessSeq = 0, lastCeremonyKey = "", lastPhase = "", lastFinalSig = "";
var toastTimer = null, flashTimer = null;
var cards = {};          // tomato/egg target cards, by key
var LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function $(id) { return document.getElementById(id); }
function setShown(id, on) { $(id).classList.toggle("hidden", !on); }
function canonicalName(name) {
  var low = name.toLowerCase();
  for (var i = 0; i < DEFAULT_NAMES.length; i++) {
    if (DEFAULT_NAMES[i].toLowerCase() === low) { return DEFAULT_NAMES[i]; }
  }
  return name;
}

try { myId = localStorage.getItem("hangmanId"); } catch (e) { myId = null; }

function toast(msg) {
  var t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.add("hidden"); }, 3000);
}

// ---------- Winner music (optional: assets/sounds/winner-song.mp3) ----------
var SONG_URL = "assets/sounds/winner-song.mp3";
var muted = false;
var song = null, songBroken = false, unlocked = false;
try { muted = localStorage.getItem("hangmanMuted") === "1"; } catch (e) { muted = false; }

function getSong() {
  if (song || songBroken) { return song; }
  try {
    song = new Audio(SONG_URL);
    song.onerror = function () { songBroken = true; };   // file missing: stay silent
  } catch (e) { songBroken = true; song = null; }
  return song;
}
function playWinner() {
  if (muted) { return; }
  var a = getSong();
  if (!a || songBroken) { return; }
  try {
    a.muted = false;
    a.currentTime = 0;
    var pr = a.play();
    if (pr && pr.catch) { pr.catch(function () {}); }
  } catch (e) {}
}
function stopWinner() {
  if (!song) { return; }
  try { song.pause(); song.currentTime = 0; } catch (e) {}
}
function updateMuteButton() { $("mute-btn").textContent = muted ? "🔇 Sound off" : "🔊 Sound on"; }
$("mute-btn").onclick = function () {
  muted = !muted;
  try { localStorage.setItem("hangmanMuted", muted ? "1" : "0"); } catch (e) {}
  updateMuteButton();
  if (muted) { stopWinner(); }
  else if (S && S.phase === "final") { playWinner(); }
};
updateMuteButton();
// Phones only allow audio after a tap, so quietly "unlock" it on the first tap.
document.addEventListener("click", function () {
  if (unlocked || muted) { return; }
  unlocked = true;
  var a = getSong();
  if (!a || songBroken) { return; }
  try {
    a.muted = true;
    var pr = a.play();
    if (pr && pr.then) { pr.then(function () { a.pause(); a.currentTime = 0; a.muted = false; }).catch(function () { a.muted = false; }); }
  } catch (e) {}
});

// ---------- Talking to the server ----------
function connect() {
  if (es) { es.close(); }
  es = new EventSource("/events" + (myId ? "?id=" + encodeURIComponent(myId) : ""));
  es.onmessage = function (e) {
    S = JSON.parse(e.data);
    if (myId && !S.you) {
      myId = null;
      try { localStorage.removeItem("hangmanId"); } catch (err) {}
    }
    render();
  };
}

function post(url, body, cb) {
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(function (r) { return r.json(); })
    .then(cb)
    .catch(function () { toast("Connection problem. Please try again."); });
}

function action(type, extra) {
  var body = { id: myId, type: type };
  for (var k in extra) { body[k] = extra[k]; }
  post("/api/action", body, function (d) { if (!d.ok) { toast(d.error); } });
}

// ---------- Join: pick your name or type one ----------
function renderJoin() {
  var grid = $("pick-grid");
  grid.innerHTML = "";
  DEFAULT_NAMES.forEach(function (name) {
    var taken = S.players.some(function (p) { return p.active && p.name.toLowerCase() === name.toLowerCase(); });
    if (taken && selectedName === name) { selectedName = null; }
    var c = document.createElement("button");
    c.className = "pick" + (selectedName === name ? " sel" : "") + (taken ? " taken" : "");
    c.disabled = taken;
    c.appendChild(makeAvatar(name, 56));
    var nm = document.createElement("span");
    nm.textContent = taken ? name + " ✓" : name;
    c.appendChild(nm);
    c.onclick = function () {
      selectedName = name;
      $("name-input").value = "";
      $("join-error").textContent = "";
      renderJoin();
    };
    grid.appendChild(c);
  });
}

function joinGame() {
  var name = $("name-input").value.trim() || selectedName || "";
  if (!name) { $("join-error").textContent = "Tap your name or type one."; return; }
  post("/api/join", { name: canonicalName(name) }, function (d) {
    if (!d.ok) { $("join-error").textContent = d.error; return; }
    myId = d.id;
    try { localStorage.setItem("hangmanId", myId); } catch (e) {}
    $("join-error").textContent = "";
    connect();
  });
}
$("join-btn").onclick = joinGame;
$("name-input").onkeydown = function (e) { if (e.key === "Enter") { joinGame(); } };
$("name-input").oninput = function () { selectedName = null; if (S) { renderJoin(); } };

// ---------- Buttons ----------
$("start-btn").onclick = function () { action("start"); };
$("again-btn").onclick = function () { action("again"); };
$("end-btn").onclick = function () { setShown("end-modal", true); };
$("end-cancel").onclick = function () { setShown("end-modal", false); };      // Continue Playing: nothing changes
$("end-confirm").onclick = function () { setShown("end-modal", false); action("end"); };
$("newgame-btn").onclick = function () { action("newgame"); };
$("restart-btn").onclick = function () {
  if (confirm("Restart the game for everyone? Scores will be reset.")) { action("restart"); }
};
$("show-word").onchange = function () { $("secret-input").type = this.checked ? "text" : "password"; };
function submitWord() {
  var word = $("secret-input").value.trim();
  if (!/^[A-Za-z]{2,15}$/.test(word)) {
    $("setup-error").textContent = "Use 2 to 15 letters only (A-Z, no spaces).";
    return;
  }
  $("setup-error").textContent = "";
  action("word", { word: word });
}
$("reveal-btn").onclick = submitWord;
$("secret-input").onkeydown = function (e) { if (e.key === "Enter") { submitWord(); } };

function sendChat() {
  var text = $("chat-input").value.trim();
  if (!text) { return; }
  $("chat-input").value = "";
  action("chat", { text: text });
  $("chat-input").focus();
}
$("chat-send").onclick = sendChat;
$("chat-input").onkeydown = function (e) { if (e.key === "Enter") { sendChat(); } };

function buildKeyboard() {
  LETTERS.forEach(function (letter) {
    var k = document.createElement("button");
    k.className = "key";
    k.id = "key-" + letter;
    k.textContent = letter;
    k.onclick = function () { action("guess", { letter: letter }); };
    $("keyboard").appendChild(k);
  });
}

// ---------- Pop-up messages for everyone ----------
function showFlash(text, kind) {
  var f = $("flash");
  f.className = kind;
  f.textContent = text;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(function () { f.classList.add("hidden"); }, kind === "win" ? 5000 : 3200);
  if (kind === "win") { confetti(); }
}
function confetti() {
  var bits = ["🎉", "🎊", "⭐", "🏆", "✨"];
  for (var i = 0; i < 26; i++) {
    var c = document.createElement("div");
    c.className = "confetti";
    c.textContent = bits[i % bits.length];
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDelay = Math.random() * 1.2 + "s";
    document.body.appendChild(c);
    setTimeout(function (el) { el.remove(); }, 4800, c);
  }
}
function handleFlash() {
  var f = S.flash;
  if (!f || f.seq === lastFlash) { return; }
  lastFlash = f.seq;
  if (f.text && f.age < 5000) { showFlash(f.text, f.kind); }
}

// ---------- Tomato & egg cards (side panel + Biggest Blunder ceremony) ----------
function buildCard(t, big) {
  var c = { host: big ? "blunder" : "pelt", size: big ? 120 : 40, name: t.name };
  var el = document.createElement("div");
  el.className = big ? "bcard" : "pcard";
  c.title = document.createElement("div");
  c.title.className = big ? "bname" : "ptitle";
  if (!big) {   // compact side panel: "Name" + a chip with the wrong letter
    c.tName = document.createElement("span");
    c.tName.className = "pname";
    c.tLetter = document.createElement("span");
    c.tLetter.className = "pletter";
    c.title.appendChild(c.tName);
    c.title.appendChild(c.tLetter);
  }
  el.appendChild(c.title);
  if (big) {
    c.sub = document.createElement("div");
    c.sub.className = "bsub";
    el.appendChild(c.sub);
  }
  var target = document.createElement("div");
  target.className = big ? "btarget" : "ptarget";
  c.av = makeAvatar(t.name, c.size);
  c.splats = document.createElement("div");
  c.splats.className = "psplats";
  target.appendChild(c.av);
  target.appendChild(c.splats);
  el.appendChild(target);

  var btns = document.createElement("div");
  btns.className = "pbtns";
  c.tomatoBtn = document.createElement("button");
  c.tomatoBtn.className = "btn small red";
  c.tomatoBtn.textContent = big ? "🍅 Throw Tomato" : "🍅";
  c.tomatoBtn.title = "Throw a tomato";
  c.tomatoBtn.setAttribute("aria-label", "Throw tomato");
  c.tomatoBtn.onclick = function () { action("throw", { key: t.key, item: "tomato" }); };
  c.eggBtn = document.createElement("button");
  c.eggBtn.className = "btn small orange";
  c.eggBtn.textContent = big ? "🥚 Throw Egg" : "🥚";
  c.eggBtn.title = "Throw an egg";
  c.eggBtn.setAttribute("aria-label", "Throw egg");
  c.eggBtn.onclick = function () { action("throw", { key: t.key, item: "egg" }); };
  btns.appendChild(c.tomatoBtn);
  btns.appendChild(c.eggBtn);
  el.appendChild(btns);
  c.counts = document.createElement("div");
  c.counts.className = "pcounts";
  el.appendChild(c.counts);
  c.msg = document.createElement("div");
  c.msg.className = "pmsg";
  el.appendChild(c.msg);
  c.el = el;
  return c;
}

function updateCard(c, t, big) {
  if (big) { c.title.textContent = "🤦 " + t.name; }
  else { c.tName.textContent = t.name; c.tLetter.textContent = "❌ " + t.letter; c.tLetter.title = t.name + " guessed " + t.letter + " wrong"; }
  if (big) { c.sub.textContent = t.wrongs + " wrong guess" + (t.wrongs === 1 ? "" : "es"); }
  c.counts.textContent = "🍅 x" + t.tomato + "    🥚 x" + t.egg;
  var self = t.id === S.you;
  c.tomatoBtn.disabled = self;
  c.eggBtn.disabled = self;
  var lt = S.lastThrow;
  c.msg.textContent = lt && lt.key === t.key ? lt.text : (self ? "That's you. Stay strong 😅" : "Everyone can throw!");
}

// Keeps the cards on screen in sync with the list from the server.
function syncCards(list, container, big) {
  var host = big ? "blunder" : "pelt";
  var keep = {};
  list.forEach(function (t) {
    keep[t.key] = true;
    if (!cards[t.key]) { cards[t.key] = buildCard(t, big); }
    updateCard(cards[t.key], t, big);
  });
  for (var key in cards) {
    if (cards[key].host === host && !keep[key]) {
      if (cards[key].el.parentNode) { cards[key].el.parentNode.removeChild(cards[key].el); }
      delete cards[key];
    }
  }
  list.forEach(function (t, i) {
    var el = cards[t.key].el;
    if (container.children[i] !== el) { container.insertBefore(el, container.children[i] || null); }
  });
}

// ---------- the ONE temporary attack panel (fixed at the side; latest wrong guesser only) ----------
var PANEL_MS = 5000;
var panelTimer = null, panelCleanTimer = null;
var panelVisible = false;
var panelKey = 0;            // key of the newest wrong guess already handled
var panelPrimed = false;     // the first state we see (e.g. after a reload) never pops the panel
var targetNames = {};        // key -> player name, so a late throw can still animate after the panel faded

function hidePanel() {
  clearTimeout(panelTimer);
  panelTimer = null;
  panelVisible = false;
  $("pelt-list").classList.remove("show");
  clearTimeout(panelCleanTimer);
  panelCleanTimer = setTimeout(function () {      // remove the card once the fade-out has finished
    if (!panelVisible) { syncCards([], $("pelt-list"), false); }
  }, 600);
}
function showPanel() {
  clearTimeout(panelTimer);                        // restart: never two timers at once
  clearTimeout(panelCleanTimer);
  panelVisible = true;
  $("pelt-list").classList.add("show");
  panelTimer = setTimeout(hidePanel, PANEL_MS);
}
function renderAttackPanel(list) {
  list.forEach(function (t) { targetNames[t.key] = t.name; });
  var t = list[0];
  if (!t) { panelPrimed = true; panelKey = 0; hidePanel(); return; }
  if (!panelPrimed) { panelPrimed = true; panelKey = t.key; return; }
  if (t.key !== panelKey) { panelKey = t.key; showPanel(); }      // a new wrong guess replaces the old one
  if (panelVisible) { syncCards([t], $("pelt-list"), false); }
}

function addSplat(c, kind) {
  var sp = document.createElement("span");
  var size = c.size * (0.35 + Math.random() * 0.25);
  sp.className = "splat " + kind;
  sp.style.width = size + "px";
  sp.style.height = size + "px";
  sp.style.left = 5 + Math.random() * 60 + "%";
  sp.style.top = 5 + Math.random() * 60 + "%";
  c.splats.appendChild(sp);
  setTimeout(function () { if (sp.parentNode) { sp.parentNode.removeChild(sp); } }, 5200);   // temporary
}

// Every throw: the victim's avatar becomes LARGE and the tomato / egg bursts on it (effects.js).
function handleThrow() {
  var lt = S.lastThrow;
  if (!lt || lt.seq === lastThrowSeq) { return; }
  lastThrowSeq = lt.seq;
  var c = cards[lt.key];
  var who = c ? c.name : targetNames[lt.key];
  if (lt.age < 3000 && who) {
    enqueueImpact({ item: lt.item, name: who, text: lt.text, reaction: lt.reaction, card: c });
  }
}

// ---------- Leaderboard helpers ----------
// Funny titles, given to everyone who is tied for the top spot.
function computeTitles(list) {
  var out = {};
  function award(field, label) {
    var max = 0;
    list.forEach(function (p) { if (p[field] > max) { max = p[field]; } });
    if (max <= 0) { return; }
    list.forEach(function (p) {
      if (p[field] === max) { (out[p.name] = out[p.name] || []).push(label); }
    });
  }
  award("correct", "🧠 Word Master");
  award("wrongs", "🤦 Biggest Blunder");
  award("tomatoes", "🍅 Tomato Magnet");
  award("eggs", "🥚 Egg Target");
  return out;
}
function titleChips(titles) {
  var box = document.createElement("div");
  box.className = "titles";
  (titles || []).forEach(function (t) {
    var s = document.createElement("span");
    s.className = "tchip";
    s.textContent = t;
    box.appendChild(s);
  });
  return box;
}

// ---------- Drawing the screen ----------
function nameOf(id) {
  var p = S.players.filter(function (x) { return x.id === id; })[0];
  return p ? p.name : "Someone";
}

function render() {
  if (!S) { return; }
  var joined = !!S.you;
  setShown("screen-join", !joined);
  setShown("play-area", joined);
  if (!joined) {
    setShown("restart-btn", false);
    renderJoin();
    return;
  }

  var isHost = S.hostId === S.you;
  var isGiver = S.giverId === S.you;
  var ph = S.phase;
  var inGame = ph === "setup" || ph === "guessing" || ph === "ceremony" || ph === "result";
  var onBoard = ph === "guessing" || ph === "ceremony" || ph === "result";
  setShown("restart-btn", isHost && ph !== "lobby" && ph !== "final");
  setShown("game-actions", inGame);            // END GAME is available to every player during play
  if (!inGame) { setShown("end-modal", false); }
  setShown("notice", !!S.notice);
  $("notice").textContent = S.notice;
  setShown("screen-final", ph === "final");
  setShown("screen-lobby", ph === "lobby");
  setShown("screen-setup", ph === "setup");
  setShown("screen-game", onBoard);
  if (ph !== "final") { lastFinalSig = ""; }
  if (!onBoard) {
    hidePanel();
    syncCards([], $("blunder-list"), true);
  }

  renderScores();
  renderChat();
  if (ph === "final") { renderFinal(); }
  if (ph === "lobby") { renderLobby(isHost); }
  if (ph === "setup") { renderSetup(isGiver); }
  if (onBoard) { renderGame(isGiver); }
  handleThrow();
  handleFlash();

  // winner music starts when the final leaderboard appears
  if (ph === "final" && lastPhase !== "final") { playWinner(); }
  if (ph !== "final" && lastPhase === "final") { stopWinner(); }
  lastPhase = ph;
}

function renderFinal() {
  var f = S.final;
  if (!f) { return; }
  var w = f.winners.join(" & ");
  $("final-title").textContent = f.winners.length
    ? "🏆 " + w + (f.winners.length > 1 ? " are the winners!" : " is the winner!")
    : "🤝 No winner this time";
  var stage = $("winner-stage");
  var sig = f.winners.join("|");
  setShown("winner-stage", f.winners.length > 0);
  if (sig !== lastFinalSig) {
    lastFinalSig = sig;
    stage.innerHTML = "";
    f.winners.forEach(function (name) {
      var card = document.createElement("div");
      card.className = "wcard";
      var rays = document.createElement("div"); rays.className = "rays";
      var crown = document.createElement("div"); crown.className = "wcrown"; crown.textContent = "👑";
      var nm = document.createElement("div"); nm.className = "wname"; nm.textContent = name;
      card.appendChild(rays);
      card.appendChild(makeAvatar(name, 160));
      card.appendChild(crown);
      card.appendChild(nm);
      [["✨", "0", "20px"], ["⭐", "170px", "10px"], ["🎉", "5px", "170px"], ["🎊", "175px", "165px"]].forEach(function (p, i) {
        var sp = document.createElement("div");
        sp.className = "spark";
        sp.textContent = p[0];
        sp.style.left = p[1];
        sp.style.top = p[2];
        sp.style.animationDelay = (i * 0.3) + "s";
        card.appendChild(sp);
      });
      stage.appendChild(card);
    });
  }
  var totalCorrect = 0, totalWrong = 0;
  f.board.forEach(function (p) { totalCorrect += p.correct; totalWrong += p.wrongs; });
  $("final-totals").textContent = "✅ Total correct guesses: " + totalCorrect + "     ❌ Total wrong guesses: " + totalWrong;
  $("final-treat").textContent = f.treat;
  $("productive-sign").textContent = f.productive;

  var list = $("final-board");
  list.innerHTML = "";
  var titles = computeTitles(f.board);
  var medals = ["🥇", "🥈", "🥉"];
  f.board.forEach(function (p) {
    var rank = f.board.filter(function (x) { return x.score > p.score; }).length;   // 0 = best
    var isWinner = f.winners.indexOf(p.name) !== -1;
    var li = document.createElement("li");
    if (isWinner) { li.className = "first"; }
    li.appendChild(makeAvatar(p.name, 44));
    var info = document.createElement("div");
    info.className = "info";
    var nm = document.createElement("div");
    nm.textContent = (p.score > 0 && rank < 3 ? medals[rank] + " " : "") + p.name;
    if (isWinner) {
      var badge = document.createElement("span");
      badge.className = "wbadge";
      badge.textContent = "🏆 WINNER";
      nm.appendChild(badge);
    }
    info.appendChild(nm);
    info.appendChild(titleChips(titles[p.name]));
    var st = document.createElement("div");
    st.className = "stats";
    st.textContent = "✅ " + p.correct + "   ❌ " + p.wrongs + "   🍅 " + p.tomatoes + "   🥚 " + p.eggs;
    info.appendChild(st);
    li.appendChild(info);
    var pts = document.createElement("span");
    pts.className = "pts";
    pts.textContent = p.score + " pts";
    li.appendChild(pts);
    list.appendChild(li);
  });
  setShown("newgame-btn", true);   // every player can start the next game
}

function renderLobby(isHost) {
  var box = $("lobby-players");
  box.innerHTML = "";
  S.players.forEach(function (p) {
    var b = document.createElement("div");
    b.className = "badge";
    var top = document.createElement("div"); top.className = "bt"; top.textContent = "BREAK ROOM";
    var nm = document.createElement("div"); nm.className = "nm"; nm.textContent = p.name + (p.id === S.you ? " (you)" : "");
    b.appendChild(top);
    b.appendChild(makeAvatar(p.name, 64));
    b.appendChild(nm);
    box.appendChild(b);
  });
  setShown("start-btn", isHost);
  $("start-btn").disabled = S.players.length < 2;
  $("lobby-wait").textContent = isHost
    ? (S.players.length < 2 ? "Waiting for at least one more colleague..." : "")
    : "Waiting for " + nameOf(S.hostId) + " to start the game...";
}

function renderSetup(isGiver) {
  if (lastRound !== S.round) {
    lastRound = S.round;
    $("secret-input").value = "";
    $("secret-input").type = "password";
    $("show-word").checked = false;
    $("setup-error").textContent = "";
    if (isGiver) { $("secret-input").focus(); }
  }
  setShown("screen-setup", true);
  setShown("setup-giver", isGiver);
  setShown("setup-wait", !isGiver);
  $("wait-name").textContent = nameOf(S.giverId);
}

function renderLastGuess() {
  var lg = S.lastGuess;
  var box = $("last-guess");
  setShown("last-guess", !!lg);
  if (!lg) { return; }
  box.innerHTML = "";
  box.appendChild(makeAvatar(lg.name, 36));
  var t = document.createElement("span");
  t.textContent = lg.name + " guessed " + lg.letter + (lg.correct ? "  ✅ +" + lg.count : "  ❌ wrong!");
  box.appendChild(t);
  if (lg.seq !== lastGuessSeq) {
    lastGuessSeq = lg.seq;
    box.classList.remove("pop");
    void box.getBoundingClientRect();
    box.classList.add("pop");
  }
}

function renderCeremony() {
  var list = S.blunders || [];
  syncCards(list, $("blunder-list"), true);
  $("ceremony-title").textContent = list.length > 1 ? "🍅 THE BIGGEST BLUNDERS 🥚" : "🍅 THE BIGGEST BLUNDER 🥚";
  var key = "c" + S.round;
  if (key !== lastCeremonyKey) {
    lastCeremonyKey = key;
    var fill = $("ceremony-fill");
    fill.classList.remove("run");
    void fill.getBoundingClientRect();
    fill.style.animationDuration = S.ceremonyLeft + "ms";
    fill.classList.add("run");
    // a barrage of flying tomatoes and eggs to open the ceremony
    setTimeout(function () {
      list.forEach(function (t) {
        for (var i = 0; i < (list.length > 1 ? 2 : 3); i++) {
          if (cards[t.key]) {
            enqueueImpact({ item: i % 2 ? "egg" : "tomato", name: t.name, text: "The Biggest Blunder gets the full treatment!", reaction: "🤡", card: cards[t.key] });
          }
        }
      });
    }, 500);
  }
}

function renderGame(isGiver) {
  var ph = S.phase;
  var playing = ph === "guessing";
  var canGuess = playing && !isGiver;      // free-for-all: everyone except the Word Giver

  var banner = "Round finished!";
  if (playing && isGiver) { banner = "🎤 You are the Word Giver. Your word: " + S.secret; }
  else if (playing) { banner = "⚡ Free-for-all! Anyone can guess. Be quick!"; }
  else if (ph === "ceremony") { banner = "🏅 Time for the Biggest Blunder ceremony!"; }
  $("turn-banner").textContent = banner;
  renderLastGuess();

  var wd = $("word-display");
  wd.innerHTML = "";
  S.tiles.forEach(function (t) {
    var d = document.createElement("div");
    d.className = "tile" + (t.s === "shown" ? " shown" : "") + (t.s === "missed" ? " missed" : "");
    d.textContent = t.s === "hidden" ? "_" : t.ch;
    wd.appendChild(d);
  });

  // one shared hangman: everyone sees the same parts
  for (var i = 1; i <= S.maxWrong; i++) {
    $("part" + i).classList.toggle("hidden", i > S.wrong.length);
  }
  if (S.wrong.length > lastWrong) {
    $("hangman").classList.remove("shake");
    void $("hangman").getBoundingClientRect();
    $("hangman").classList.add("shake");
  }
  lastWrong = S.wrong.length;
  $("lives").textContent = "❤️ Wrong guesses left: " + (S.maxWrong - S.wrong.length);
  $("wrong-letters").textContent = S.wrong.length ? "Wrong letters: " + S.wrong.join(" ") : "No wrong letters yet. Suspicious.";

  // tomato & egg cards for the latest wrong guessers (only while the round is on)
  renderAttackPanel(playing ? S.targets : []);
  setShown("ceremony", ph === "ceremony");
  if (ph === "ceremony") { renderCeremony(); } else { syncCards([], $("blunder-list"), true); }

  setShown("keyboard", ph !== "ceremony");
  LETTERS.forEach(function (letter) {
    var k = $("key-" + letter);
    var used = S.guessed.indexOf(letter) !== -1;
    k.disabled = used || !canGuess;
    k.classList.remove("good", "bad");
    if (S.wrong.indexOf(letter) !== -1) { k.classList.add("bad"); }
    else if (used && S.tiles.some(function (t) { return t.ch === letter; })) { k.classList.add("good"); }
  });

  setShown("result", ph === "result");
  if (ph === "result" && S.result) {
    var r = S.result;
    if (r.won) {
      $("result-title").textContent = r.finisherName ? "🏆 " + r.finisherName + " the OG found the answer!" : "🎉 Free win!";
      $("result-text").textContent = "The word was " + r.word + ". Score points go to whoever guessed the letters. Next Word Giver: " + r.nextGiverName + ".";
    } else {
      $("result-title").textContent = "💀 GAME OVER";
      $("result-text").textContent = "The word was " + r.word + ". " + r.giverName + " earns 3 points! Next Word Giver: " + r.nextGiverName + ".";
    }
  }
}

function renderScores() {
  var list = $("score-list");
  list.innerHTML = "";
  var sorted = S.players.slice().sort(function (a, b) { return b.score - a.score; });
  var top = sorted.length && sorted[0].score > 0 ? sorted[0].score : -1;
  var titles = computeTitles(S.players);
  sorted.forEach(function (p) {
    var li = document.createElement("li");
    li.className = (p.id === S.you ? "me " : "") + (p.active ? "" : "off");
    li.appendChild(makeAvatar(p.name, 34));
    var info = document.createElement("div");
    info.className = "info";
    var nm = document.createElement("div");
    var text = p.name + (p.id === S.you ? " (you)" : "");
    if (p.score === top) { text += " 👑"; }
    if (S.phase !== "lobby" && S.phase !== "final" && p.id === S.giverId) { text += " 🎤"; }
    nm.textContent = text;
    info.appendChild(nm);
    info.appendChild(titleChips(titles[p.name]));
    var st = document.createElement("div");
    st.className = "stats";
    st.textContent = "✅ " + p.correct + "   ❌ " + p.wrongs;
    info.appendChild(st);
    li.appendChild(info);
    var pts = document.createElement("span");
    pts.className = "pts";
    pts.textContent = p.score;
    li.appendChild(pts);
    list.appendChild(li);
  });
}

function renderChat() {
  var last = S.chat.length ? S.chat[S.chat.length - 1].id : 0;
  if (last === lastChatId) { return; }
  lastChatId = last;
  var log = $("chat-log");
  log.innerHTML = "";
  S.chat.forEach(function (m) {
    var p = document.createElement("p");
    p.className = "msg" + (m.sys ? " sys" : "") + (m.name === nameOf(S.you) && !m.sys ? " me" : "");
    if (m.sys) {
      p.textContent = m.text;
    } else {
      var b = document.createElement("b");
      b.textContent = m.name + ": ";
      p.appendChild(b);
      p.appendChild(document.createTextNode(m.text));
    }
    log.appendChild(p);
  });
  log.scrollTop = log.scrollHeight;
}

buildKeyboard();
connect();
