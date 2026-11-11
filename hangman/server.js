// Break Room Hangman - online server. Uses only Node's built-in modules.
// Players get live updates through Server-Sent Events (/events)
// and send actions with POST (/api/join, /api/action).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const MAX_WRONG = 6;
const VOWELS = 'AEIOU';
const GRACE_MS = 20000;       // how long a disconnected player is kept before leaving
const MAX_PLAYERS = 12;
const CEREMONY_MS = Number(process.env.CEREMONY_MS) || 12000;   // "Biggest Blunder" ceremony length
const MAX_TARGETS = 3;        // wrong guessers shown at the side at once

// ---------- Game state (one shared room, kept in memory) ----------
const g = {
  players: [],      // {id, name, score, correct, wrongs, roundWrongs, tomatoes, eggs, active, conns, timer}
  phase: 'lobby',   // lobby | setup | guessing | ceremony | result | final
  round: 0,
  giverId: null,
  secret: '',
  guessed: [],
  wrong: [],
  result: null,
  final: null,
  targets: [],      // latest wrong guessers: {key, id, name, letter, tomato, egg}
  blunders: [],     // Biggest Blunder ceremony: {key, id, name, wrongs, tomato, egg}
  ceremonyEnds: 0,
  ceremonyTimer: null,
  lastGuess: null,
  lastThrow: { seq: 0, item: '', by: '', key: 0, text: '', reaction: '', time: 0 },
  notice: '',
  chat: [],
  flash: { seq: 0, text: '', kind: '', time: 0 }
};
let chatSeq = 0, keySeq = 0, throwSeq = 0, guessSeq = 0;
const clients = new Set();   // {res, id}

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function addChat(name, text, sys) {
  g.chat.push({ id: ++chatSeq, name: name, text: text, sys: !!sys });
  if (g.chat.length > 60) { g.chat.shift(); }
}
function addSys(text) { addChat('', text, true); }
function flash(text, kind) { g.flash = { seq: g.flash.seq + 1, text: text, kind: kind, time: Date.now() }; }

function find(id) { return g.players.find(function (p) { return p.id === id; }) || null; }
function activeCount() { return g.players.filter(function (p) { return p.active; }).length; }
function hostId() {
  const p = g.players.find(function (x) { return x.active; });
  return p ? p.id : null;
}
function nextGiver(fromId) {
  const n = g.players.length;
  const idx = g.players.findIndex(function (p) { return p.id === fromId; });
  for (let i = 1; i <= n; i++) {
    const cand = g.players[(idx + i + n) % n];
    if (cand && cand.active) { return cand.id; }
  }
  return null;
}
function resetStats(p) { p.score = 0; p.correct = 0; p.wrongs = 0; p.roundWrongs = 0; p.tomatoes = 0; p.eggs = 0; }
function clearCeremony() {
  if (g.ceremonyTimer) { clearTimeout(g.ceremonyTimer); g.ceremonyTimer = null; }
  g.blunders = [];
}
function resetRound() {
  g.secret = ''; g.guessed = []; g.wrong = []; g.result = null; g.final = null;
  g.targets = []; g.lastGuess = null;
  clearCeremony();
  g.players.forEach(function (p) { p.roundWrongs = 0; });
}
function startSetup() {
  resetRound();
  g.phase = 'setup';
  g.round++;
  const gv = find(g.giverId);
  if (gv) { addSys('🎤 ' + gv.name + ' is the Word Giver this round.'); }
}
function toLobby(notice) {
  resetRound();
  g.phase = 'lobby';
  g.giverId = null;
  g.notice = notice || '';
  g.players = g.players.filter(function (p) { return p.active; });
  g.players.forEach(resetStats);
}
function isComplete() {
  return g.secret.split('').every(function (ch) { return g.guessed.indexOf(ch) !== -1; });
}

// Round over: score it, then run the Biggest Blunder ceremony (if anyone guessed wrong).
function finish(won, finisher) {
  const giver = find(g.giverId);
  if (!won && giver) { giver.score += 3; }   // hangman completed: Word Giver earns 3
  const next = find(nextGiver(g.giverId));
  g.result = {
    won: won,
    word: g.secret,
    giverName: giver ? giver.name : '?',
    finisherName: finisher ? finisher.name : null,
    nextGiverName: next ? next.name : '?'
  };
  const text = won
    ? (finisher ? '🏆 ' + finisher.name + ' the OG found the answer!' : '🎉 The word was only vowels. Free win!')
    : '💀 Game over! The word was ' + g.secret + '.';
  flash(text, won ? 'win' : 'lose');
  addSys(text);

  g.targets = [];
  const guessers = g.players.filter(function (x) { return x.id !== g.giverId; });
  const maxW = Math.max.apply(null, [0].concat(guessers.map(function (x) { return x.roundWrongs; })));
  if (maxW > 0) {
    g.blunders = guessers.filter(function (x) { return x.roundWrongs === maxW; }).map(function (x) {
      return { key: ++keySeq, id: x.id, name: x.name, wrongs: maxW, tomato: 0, egg: 0 };
    });
    g.phase = 'ceremony';
    g.ceremonyEnds = Date.now() + CEREMONY_MS;
    const round = g.round;
    g.ceremonyTimer = setTimeout(function () { endCeremony(round); }, CEREMONY_MS);
    addSys('🏅 BIGGEST BLUNDER: ' + g.blunders.map(function (b) { return b.name; }).join(' & ') + ' (' + maxW + ' wrong). Pelt them!');
  } else {
    g.phase = 'result';
  }
}
function endCeremony(round) {
  g.ceremonyTimer = null;
  if (g.phase !== 'ceremony' || g.round !== round) { return; }
  g.phase = 'result';
  g.blunders = [];
  broadcast();
}

// ---------- What each player is allowed to see ----------
function view(id) {
  const me = id ? find(id) : null;
  const isGiver = !!me && me.id === g.giverId;
  const reveal = g.phase === 'result' || g.phase === 'ceremony';
  const tiles = g.secret.split('').map(function (ch) {
    if (g.guessed.indexOf(ch) !== -1) { return { ch: ch, s: 'shown' }; }
    if (reveal) { return { ch: ch, s: 'missed' }; }
    return { ch: '', s: 'hidden' };
  });
  const now = Date.now();
  return {
    phase: g.phase,
    round: g.round,
    you: me ? me.id : null,
    hostId: hostId(),
    giverId: g.giverId,
    players: g.players.map(function (p) {
      return { id: p.id, name: p.name, score: p.score, correct: p.correct, wrongs: p.wrongs, tomatoes: p.tomatoes, eggs: p.eggs, active: p.active };
    }),
    tiles: tiles,
    guessed: g.guessed,
    wrong: g.wrong,
    maxWrong: MAX_WRONG,
    secret: (isGiver && g.phase === 'guessing') ? g.secret : null,   // only the Word Giver sees it
    result: g.phase === 'result' ? g.result : null,
    final: g.final,
    targets: g.targets,
    blunders: g.blunders,
    ceremonyLeft: g.phase === 'ceremony' ? Math.max(0, g.ceremonyEnds - now) : 0,
    lastGuess: g.lastGuess ? Object.assign({ age: now - g.lastGuess.time }, g.lastGuess) : null,
    lastThrow: { seq: g.lastThrow.seq, item: g.lastThrow.item, by: g.lastThrow.by, key: g.lastThrow.key, text: g.lastThrow.text, reaction: g.lastThrow.reaction, age: now - g.lastThrow.time },
    notice: g.notice,
    chat: me ? g.chat : [],
    flash: { seq: g.flash.seq, text: g.flash.text, kind: g.flash.kind, age: now - g.flash.time }
  };
}
function send(res, data) { res.write('data: ' + JSON.stringify(data) + '\n\n'); }
function broadcast() {
  clients.forEach(function (c) { send(c.res, view(c.id)); });
}

// ---------- Players leaving ----------
function handleLeave(p) {
  p.timer = null;
  if (p.conns > 0) { return; }
  p.active = false;
  addSys('🚪 ' + p.name + ' left the building.');
  if (g.phase === 'lobby') {
    g.players = g.players.filter(function (x) { return x !== p; });
  } else if (activeCount() < 2) {
    toLobby('Not enough players. Back to the waiting room.');
  } else if (p.id === g.giverId && (g.phase === 'setup' || g.phase === 'guessing')) {
    g.giverId = nextGiver(p.id);
    startSetup();
    g.notice = p.name + ' left, so a new round starts with a new Word Giver.';
  }
  broadcast();
}

// ---------- Actions ----------
function fail(msg) { return { ok: false, error: msg }; }

function join(body) {
  const name = String(body.name || '').trim().replace(/\s+/g, ' ').slice(0, 12);
  if (!name) { return fail('Please type your name.'); }
  const existing = g.players.find(function (p) { return p.name.toLowerCase() === name.toLowerCase(); });
  if (existing) {
    if (existing.conns > 0) { return fail('That name is already taken. Try another.'); }
    return { ok: true, id: existing.id };   // coming back after a disconnect
  }
  if (g.players.length >= MAX_PLAYERS) { return fail('The room is full.'); }
  const p = { id: crypto.randomBytes(8).toString('hex'), name: name, active: true, conns: 0, timer: null };
  resetStats(p);
  p.timer = setTimeout(function () { handleLeave(p); }, GRACE_MS);   // cleared when its event stream connects
  g.players.push(p);
  addSys('👋 ' + p.name + ' joined the break room.');
  broadcast();
  return { ok: true, id: p.id };
}

const TOMATO_LINES = [
  function (by, n) { return '🍅 ' + by + ' splatted ' + n + '! Squish!'; },
  function (by, n) { return '🍅 Direct hit! ' + n + ' is now ketchup.'; },
  function (by, n) { return '🍅 ' + n + ' just got saucy, thanks to ' + by + '.'; },
  function (by, n) { return '🍅 Fresh from the canteen! ' + by + ' nails ' + n + '.'; }
];
const EGG_LINES = [
  function (by, n) { return '🥚 ' + by + ' cracked an egg on ' + n + '. Egg-cellent aim!'; },
  function (by, n) { return '🥚 ' + n + ' is sunny side up!'; },
  function (by, n) { return '🥚 Splat! ' + n + ' is scrambled.'; },
  function (by, n) { return '🥚 ' + by + ' made ' + n + ' an omelette.'; }
];
const REACTIONS = ['😵', '🤢', '😭', '🥴', '😤', '🙈', '🤡'];

function act(body) {
  const p = find(body.id);
  if (!p) { return fail('Please join first.'); }
  const type = body.type;

  if (type === 'start') {
    if (g.phase !== 'lobby') { return fail('The game already started.'); }
    if (p.id !== hostId()) { return fail('Only the host can start the game.'); }
    if (activeCount() < 2) { return fail('You need at least 2 players.'); }
    g.players.forEach(resetStats);
    const list = g.players.filter(function (x) { return x.active; });
    g.giverId = list[Math.floor(Math.random() * list.length)].id;
    g.notice = '';
    startSetup();

  } else if (type === 'word') {
    if (g.phase !== 'setup' || p.id !== g.giverId) { return fail('It is not your turn to pick a word.'); }
    const word = String(body.word || '').trim().toUpperCase();
    if (!/^[A-Z]{2,15}$/.test(word)) { return fail('Use 2 to 15 letters only (A-Z, no spaces).'); }
    g.secret = word;
    g.guessed = VOWELS.split('');
    g.wrong = [];
    g.notice = '';
    g.phase = 'guessing';
    addSys('🔒 ' + p.name + ' locked in a secret word (' + word.length + ' letters). Vowels are revealed!');
    if (isComplete()) { finish(true, null); }

  } else if (type === 'guess') {
    // free-for-all: any player except the Word Giver can guess, any time
    if (g.phase !== 'guessing') { return fail('No round in progress.'); }
    if (p.id === g.giverId) { return fail('The Word Giver cannot guess. You know the word! 😉'); }
    const letter = String(body.letter || '').toUpperCase();
    if (!/^[A-Z]$/.test(letter)) { return fail('Pick a letter.'); }
    if (g.guessed.indexOf(letter) !== -1) { return fail('Too slow! That letter was already guessed.'); }
    g.guessed.push(letter);
    const count = g.secret.split(letter).length - 1;
    const wrongGuess = count === 0;
    g.lastGuess = { seq: ++guessSeq, name: p.name, letter: letter, correct: !wrongGuess, count: count, time: Date.now() };
    if (wrongGuess) {
      g.wrong.push(letter);
      p.wrongs++;
      p.roundWrongs++;
      g.targets.unshift({ key: ++keySeq, id: p.id, name: p.name, letter: letter, tomato: 0, egg: 0 });
      if (g.targets.length > MAX_TARGETS) { g.targets.pop(); }
      const msg = '❌ ' + p.name + ' guessed wrong!';
      flash(msg, 'bad');
      addSys(msg);
    } else {
      p.score += count;   // 1 point for every letter revealed by this guess
      p.correct++;
      const msg = '🎯 ' + p.name + ' found "' + letter + '" (+' + count + ')';
      flash(msg, 'good');
      addSys(msg);
    }
    if (isComplete()) { finish(true, p); }
    else if (g.wrong.length >= MAX_WRONG) { finish(false, null); }

  } else if (type === 'throw') {
    // tomatoes and eggs: at the latest wrong guessers, or at the Biggest Blunder
    const list = g.phase === 'ceremony' ? g.blunders : (g.phase === 'guessing' ? g.targets : []);
    const t = list.find(function (x) { return x.key === body.key; });
    if (!t) { return fail('Too late! They already ran away 🏃'); }
    const item = body.item === 'egg' ? 'egg' : (body.item === 'tomato' ? 'tomato' : '');
    if (!item) { return fail('Pick a tomato or an egg.'); }
    if (p.id === t.id) { return fail("You can't pelt yourself 😅"); }
    const now = Date.now();
    if (p.lastThrow && now - p.lastThrow < 150) { return fail('Too fast! 🐢'); }
    p.lastThrow = now;
    t[item]++;
    const victim = find(t.id);
    if (victim) { if (item === 'egg') { victim.eggs++; } else { victim.tomatoes++; } }
    const line = pick(item === 'egg' ? EGG_LINES : TOMATO_LINES);
    g.lastThrow = { seq: ++throwSeq, item: item, by: p.name, key: t.key, text: line(p.name, t.name), reaction: pick(REACTIONS), time: now };

  } else if (type === 'again') {
    if (g.phase !== 'result') { return fail('The round is not finished yet.'); }
    g.giverId = nextGiver(g.giverId);
    g.notice = '';
    startSetup();

  } else if (type === 'chat') {
    const text = String(body.text || '').trim().slice(0, 200);
    if (!text) { return fail('Type a message first.'); }
    const now = Date.now();
    if (p.lastChat && now - p.lastChat < 400) { return fail('Slow down, speedy typist! 🐢'); }
    p.lastChat = now;
    addChat(p.name, text, false);

  } else if (type === 'end') {
    if (g.phase === 'lobby' || g.phase === 'final') { return fail('There is no game to end.'); }
    addSys('⛔ ' + p.name + ' ended the game.');
    clearCeremony();
    g.targets = [];
    const top = Math.max.apply(null, g.players.map(function (x) { return x.score; }));
    const winners = top > 0 ? g.players.filter(function (x) { return x.score === top; }).map(function (x) { return x.name; }) : [];
    const board = g.players.slice().sort(function (a, b) { return b.score - a.score; }).map(function (x) {
      return { name: x.name, score: x.score, correct: x.correct, wrongs: x.wrongs, tomatoes: x.tomatoes, eggs: x.eggs };
    });
    const w = winners.join(' & ');
    const treat = winners.length
      ? pick([
          'Treat time! Everyone else owes ' + w + ' a chai and biscuits ☕🍪',
          w + ' has earned a treat 🍩 Losers, open your wallets!',
          w + ' wins the bragging rights AND a free snack from the others 🍫'
        ])
      : 'Nobody scored, so everyone gets a participation cookie 🍪';
    g.phase = 'final';
    g.final = { winners: winners, board: board, treat: treat, productive: 'Break over! Now go be productive.' };
    const text = winners.length
      ? '🏆 ' + w + (winners.length > 1 ? ' are the winners!' : ' is the winner!')
      : '🤝 Nobody scored. Everyone is a winner!';
    flash(text, 'win');
    addSys(text);

  } else if (type === 'newgame') {
    if (g.phase !== 'final') { return fail('The game has not ended yet.'); }
    g.players = g.players.filter(function (x) { return x.active; });
    g.players.forEach(resetStats);
    if (g.players.length < 2) {
      toLobby('Not enough players. Back to the waiting room.');
    } else {
      g.giverId = g.players[Math.floor(Math.random() * g.players.length)].id;
      g.notice = '';
      addSys('🎮 New game started!');
      startSetup();
    }

  } else if (type === 'restart') {
    if (p.id !== hostId()) { return fail('Only the host can restart.'); }
    toLobby('Game restarted. Scores are reset.');

  } else {
    return fail('Unknown action.');
  }
  broadcast();
  return { ok: true };
}

// ---------- HTTP server ----------
const PUBLIC = path.join(__dirname, 'public');
const ASSETS = path.join(__dirname, 'assets');   // assets/sounds/winner-song.mp3 lives here
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg'
};

function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { rel = ''; }
  let base = PUBLIC;
  if (rel.indexOf('/assets/') === 0) { base = ASSETS; rel = rel.slice('/assets'.length); }
  if (rel === '/') { rel = '/index.html'; }
  const file = path.normalize(path.join(base, rel));
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type || file.indexOf(base + path.sep) !== 0) { res.writeHead(404); res.end('Not found'); return; }
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const headers = { 'Content-Type': type, 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    let start = 0, end = st.size - 1, status = 200;
    const m = req.headers.range ? /^bytes=(\d*)-(\d*)$/.exec(req.headers.range) : null;   // phones need Range for audio
    if (m && st.size > 0) {
      if (m[1] === '') { start = Math.max(0, st.size - Number(m[2])); }
      else { start = Number(m[1]); end = m[2] === '' ? end : Math.min(Number(m[2]), end); }
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); res.end(); return; }
      status = 206;
      headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + st.size;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (st.size === 0) { res.end(); return; }
    const stream = fs.createReadStream(file, { start: start, end: end });
    stream.on('error', function () { res.end(); });
    stream.pipe(res);
  });
}

function readBody(req, cb) {
  let data = '';
  req.on('data', function (c) { data += c; if (data.length > 10000) { req.destroy(); } });
  req.on('end', function () {
    let obj = {};
    try { obj = JSON.parse(data || '{}'); } catch (e) { obj = {}; }
    cb(obj);
  });
}
function json(res, obj) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(function (req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    const p = find(url.searchParams.get('id'));
    const client = { res: res, id: p ? p.id : null };
    clients.add(client);
    if (p) {
      p.conns++;
      if (p.timer) { clearTimeout(p.timer); p.timer = null; }
      p.active = true;
    }
    send(res, view(client.id));
    if (p) { broadcast(); }
    req.on('close', function () {
      clients.delete(client);
      if (p) {
        p.conns--;
        if (p.conns <= 0 && !p.timer) { p.timer = setTimeout(function () { handleLeave(p); }, GRACE_MS); }
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/join') {
    readBody(req, function (body) { json(res, join(body)); });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/action') {
    readBody(req, function (body) { json(res, act(body)); });
    return;
  }
  if (req.method === 'GET') { serveStatic(req, res, url.pathname); return; }
  res.writeHead(404);
  res.end('Not found');
});

// keep connections alive on hosting proxies
setInterval(function () { clients.forEach(function (c) { c.res.write(': ping\n\n'); }); }, 25000);

server.listen(PORT, function () { console.log('Group Hangman running on port ' + PORT); });
