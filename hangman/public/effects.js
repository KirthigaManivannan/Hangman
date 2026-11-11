// Cartoon food-fight effects.
// A big tomato / egg flies to an ENLARGED avatar in the middle of the screen and bursts:
// splash, pulp / yolk, droplets, shell pieces and transparent blotches across the screen.
// Nothing here blocks the game: the overlay ignores clicks and removes itself when done.
var impactQueue = [];
var impactBusy = false;
var stg = null;                 // the stage that is currently on screen
var stageHideTimer = null;
var uidCounter = 0;
var MAX_QUEUE = 6;
var TOMATO_WORDS = ["SPLAT!", "SQUISH!", "BULLSEYE!", "SAUCY!"];
var EGG_WORDS = ["CRACK!", "EGG-CELLENT!", "OMELETTE!", "SPLOSH!"];

function rnd(a, b) { return a + Math.random() * (b - a); }
function pickOf(list) { return list[Math.floor(Math.random() * list.length)]; }
function makeEl(tag, cls) { var e = document.createElement(tag); if (cls) { e.className = cls; } return e; }
function safe(fn) {   // an animation problem must never break the game
  return function () {
    try { fn.apply(null, arguments); } catch (e) { impactBusy = false; try { endStage(); } catch (e2) {} }
  };
}

// smooth wobbly blob outline (used for every splat shape)
function blobPath(cx, cy, r, n, jit) {
  var pts = [], i;
  for (i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2 + rnd(-0.15, 0.15), rr = r * (1 + rnd(-jit, jit));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  function mid(p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; }
  var m0 = mid(pts[n - 1], pts[0]);
  var d = "M" + m0[0].toFixed(1) + " " + m0[1].toFixed(1);
  for (i = 0; i < n; i++) {
    var p = pts[i], m = mid(pts[i], pts[(i + 1) % n]);
    d += " Q" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + m[0].toFixed(1) + " " + m[1].toFixed(1);
  }
  return d + "Z";
}

// ---------- the flying tomato and egg (cartoon style) ----------
function tomatoSvg() {
  var id = "tm" + (++uidCounter);
  return '<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><radialGradient id="' + id + '" cx="36%" cy="30%" r="78%">' +
    '<stop offset="0" stop-color="#ff9a8a"/><stop offset=".45" stop-color="#e5383b"/><stop offset="1" stop-color="#8e0207"/></radialGradient></defs>' +
    '<ellipse cx="50" cy="58" rx="41" ry="36" fill="url(#' + id + ')" stroke="#6d0a0a" stroke-width="2.5"/>' +
    '<path d="M50 26 L56 35 L69 31 L63 41 L76 45 L63 47 L50 41 L37 47 L24 45 L37 41 L31 31 L44 35Z" fill="#2f9e44" stroke="#1b6b2c" stroke-width="1.6"/>' +
    '<rect x="47" y="13" width="6" height="16" rx="3" fill="#2f9e44" stroke="#1b6b2c" stroke-width="1.2"/>' +
    '<ellipse cx="32" cy="50" rx="10" ry="6" fill="#fff" opacity=".5" transform="rotate(-32 32 50)"/></svg>';
}
function eggSvg() {
  var id = "eg" + (++uidCounter);
  return '<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><radialGradient id="' + id + '" cx="36%" cy="30%" r="80%">' +
    '<stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fff1d6"/><stop offset="1" stop-color="#e3c08c"/></radialGradient></defs>' +
    '<path d="M50 5 C75 5 89 42 89 62 C89 85 71 97 50 97 C29 97 11 85 11 62 C11 42 25 5 50 5Z" fill="url(#' + id + ')" stroke="#b98d4f" stroke-width="2.8"/>' +
    '<ellipse cx="36" cy="38" rx="8" ry="15" fill="#fff" opacity=".65" transform="rotate(18 36 38)"/>' +
    '<circle cx="64" cy="70" r="2.2" fill="#c79a5a" opacity=".6"/><circle cx="54" cy="82" r="1.8" fill="#c79a5a" opacity=".6"/><circle cx="70" cy="56" r="1.6" fill="#c79a5a" opacity=".6"/></svg>';
}

// ---------- the big splashes that burst over the avatar (transparent backgrounds) ----------
function tomatoSplashSvg() {
  var s = '<svg class="splash" viewBox="0 0 300 300" style="overflow:visible">', i, a, d, r, x, y;
  s += '<path d="' + blobPath(150, 140, 112, 11, 0.28) + '" fill="rgba(190,20,35,.4)"/>';
  s += '<path d="' + blobPath(150, 138, 84, 9, 0.25) + '" fill="rgba(229,56,59,.42)"/>';
  s += '<path d="' + blobPath(128, 112, 40, 7, 0.3) + '" fill="rgba(255,150,125,.32)"/>';
  for (i = 0; i < 8; i++) {   // pulp chunks
    a = rnd(0, 6.28); d = rnd(55, 118); r = rnd(9, 16); x = 150 + Math.cos(a) * d; y = 140 + Math.sin(a) * d;
    s += '<path d="' + blobPath(x, y, r, 7, 0.3) + '" fill="rgba(214,40,40,.92)"/><path d="' + blobPath(x, y, r * 0.55, 6, 0.3) + '" fill="rgba(255,135,105,.85)"/>';
  }
  for (i = 0; i < 11; i++) {  // seeds
    a = rnd(0, 6.28); d = rnd(20, 105); x = 150 + Math.cos(a) * d; y = 140 + Math.sin(a) * d;
    s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="3.6" ry="6.5" fill="#fff3bd" stroke="rgba(150,110,30,.8)" stroke-width="1" transform="rotate(' + Math.round(rnd(0, 180)) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
  }
  for (i = 0; i < 16; i++) {  // droplets
    a = rnd(0, 6.28); d = rnd(108, 150); r = rnd(3, 9);
    s += '<circle cx="' + (150 + Math.cos(a) * d).toFixed(1) + '" cy="' + (140 + Math.sin(a) * d).toFixed(1) + '" r="' + r.toFixed(1) + '" fill="rgba(176,16,30,.85)"/>';
  }
  for (i = 0; i < 4; i++) {   // juice running down
    var w = rnd(8, 12), h = rnd(45, 85), dx = rnd(75, 225);
    s += '<g class="drip" style="transform-box:fill-box;transform-origin:50% 0;animation-delay:' + (0.1 + i * 0.12).toFixed(2) + 's"><rect x="' + dx.toFixed(1) + '" y="170" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) +
      '" rx="' + (w / 2).toFixed(1) + '" fill="rgba(190,20,35,.74)"/><circle cx="' + (dx + w / 2).toFixed(1) + '" cy="' + (170 + h).toFixed(1) + '" r="' + (w * 0.78).toFixed(1) + '" fill="rgba(190,20,35,.74)"/></g>';
  }
  return s + '</svg>';
}
function eggSplashSvg() {
  var id = "yk" + (++uidCounter), s = '<svg class="splash" viewBox="0 0 300 300" style="overflow:visible">', i, a, d, r, x, y;
  s += '<defs><radialGradient id="' + id + '" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff3a0"/><stop offset=".5" stop-color="#ffc300"/><stop offset="1" stop-color="#e08e00"/></radialGradient></defs>';
  s += '<path d="' + blobPath(150, 140, 115, 12, 0.3) + '" fill="rgba(255,255,255,.4)" stroke="rgba(150,170,190,.9)" stroke-width="3"/>';
  s += '<path d="' + blobPath(155, 136, 88, 10, 0.22) + '" fill="rgba(255,255,255,.3)" stroke="rgba(150,170,190,.5)" stroke-width="2"/>';
  for (i = 0; i < 4; i++) {   // egg white running down
    var w = rnd(8, 13), h = rnd(45, 85), dx = rnd(75, 225);
    s += '<g class="drip" style="transform-box:fill-box;transform-origin:50% 0;animation-delay:' + (0.1 + i * 0.12).toFixed(2) + 's"><rect x="' + dx.toFixed(1) + '" y="170" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) +
      '" rx="' + (w / 2).toFixed(1) + '" fill="rgba(255,255,255,.78)" stroke="rgba(150,170,190,.7)" stroke-width="1.5"/><circle cx="' + (dx + w / 2).toFixed(1) + '" cy="' + (170 + h).toFixed(1) + '" r="' + (w * 0.8).toFixed(1) + '" fill="rgba(255,255,255,.78)" stroke="rgba(150,170,190,.7)" stroke-width="1.5"/></g>';
  }
  s += '<g class="yolk-slide"><circle cx="150" cy="112" r="34" fill="url(#' + id + ')" stroke="rgba(176,110,0,.85)" stroke-width="2.5"/>' +
    '<ellipse cx="138" cy="99" rx="11" ry="7" fill="rgba(255,255,255,.78)" transform="rotate(-25 138 99)"/></g>';
  for (i = 0; i < 14; i++) {  // droplets: clear egg white + a few yolk ones
    a = rnd(0, 6.28); d = rnd(105, 150); r = rnd(3, 8); x = 150 + Math.cos(a) * d; y = 140 + Math.sin(a) * d;
    s += i % 4 === 0
      ? '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#ffc300" stroke="rgba(176,110,0,.8)" stroke-width="1"/>'
      : '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="rgba(255,255,255,.88)" stroke="rgba(150,170,190,.85)" stroke-width="1.5"/>';
  }
  for (i = 0; i < 6; i++) {   // shell pieces stuck on
    a = rnd(0, 6.28); d = rnd(40, 105); x = 150 + Math.cos(a) * d; y = 140 + Math.sin(a) * d;
    s += '<polygon points="' + [[0, 12], [7, -10], [16, 4], [8, 14]].map(function (p) { return (x + p[0]).toFixed(1) + "," + (y + p[1]).toFixed(1); }).join(" ") +
      '" fill="#fff7e6" stroke="#b98d4f" stroke-width="2" transform="rotate(' + Math.round(rnd(0, 360)) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
  }
  return s + '</svg>';
}

// ---------- flying pieces: droplets, seeds, pulp, shell fragments ----------
function addParticles(kind, host, size) {
  var list = [], i, el;
  function piece(css, html) { el = makeEl("div", "pt"); el.style.cssText = css; if (html) { el.innerHTML = html; } list.push(el); }
  if (kind === "tomato") {
    for (i = 0; i < 22; i++) { var d = rnd(8, 24); piece("width:" + d + "px;height:" + d + "px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a7a,#" + pickOf(["c1121f", "e5383b", "9d0208"]) + ");"); }
    for (i = 0; i < 8; i++) { piece("width:9px;height:14px;border-radius:50%;background:#fff0b3;border:1px solid #a98a3a;"); }
    for (i = 0; i < 6; i++) { var p = rnd(14, 24); piece("width:" + p + "px;height:" + p + "px;border-radius:40% 60% 55% 45%;background:#e5383b;box-shadow:inset -3px -3px 0 rgba(0,0,0,.2);"); }
  } else {
    for (i = 0; i < 14; i++) { var q = rnd(8, 22); piece("width:" + q + "px;height:" + q + "px;border-radius:50%;background:rgba(255,255,255,.9);border:1.5px solid rgba(150,170,190,.9);"); }
    for (i = 0; i < 5; i++) { var y = rnd(8, 16); piece("width:" + y + "px;height:" + y + "px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3a0,#ffc300);"); }
    for (i = 0; i < 9; i++) {
      var sh = rnd(16, 28);
      piece("width:" + sh + "px;height:" + sh + "px;", '<svg viewBox="0 0 20 20" width="100%" height="100%"><polygon points="2,14 8,2 18,8 12,18" fill="#fff7e6" stroke="#b98d4f" stroke-width="1.6"/></svg>');
    }
  }
  var k = size / 300;
  list.forEach(function (e) {
    var a = rnd(0, 6.28), dist = rnd(120, 270) * k;
    e.style.setProperty("--dx", (Math.cos(a) * dist).toFixed(0) + "px");
    e.style.setProperty("--dy", (Math.sin(a) * dist - 30 * k).toFixed(0) + "px");
    e.style.setProperty("--rot", Math.round(rnd(-300, 300)) + "deg");
    e.style.setProperty("--rot2", Math.round(rnd(-600, 600)) + "deg");
    e.style.animationDuration = rnd(0.9, 1.4).toFixed(2) + "s";
    host.appendChild(e);
    setTimeout(function () { if (e.parentNode) { e.parentNode.removeChild(e); } }, 1700);
  });
}

// transparent blotches that spread over the whole screen
function screenBlots(kind, layer) {
  var out = [];
  for (var i = 0; i < 7; i++) {
    var size = Math.round(rnd(150, 330));
    var b = makeEl("div", "sblot");
    b.style.width = size + "px";
    b.style.height = size + "px";
    b.style.left = rnd(-6, 82).toFixed(0) + "%";
    b.style.top = rnd(-6, 82).toFixed(0) + "%";
    var svg = '<svg viewBox="-110 -110 220 220" width="100%" height="100%">';
    if (kind === "tomato") {
      svg += '<path d="' + blobPath(0, 0, 90, 10, 0.3) + '" fill="rgba(200,30,40,.34)"/><circle cx="' + rnd(-60, 60).toFixed(0) + '" cy="' + rnd(-60, 60).toFixed(0) + '" r="10" fill="rgba(160,10,25,.4)"/>';
    } else {
      svg += '<path d="' + blobPath(0, 0, 90, 10, 0.3) + '" fill="rgba(255,255,255,.5)" stroke="rgba(150,170,190,.55)" stroke-width="3"/><circle cx="' + rnd(-40, 40).toFixed(0) + '" cy="' + rnd(-40, 40).toFixed(0) + '" r="18" fill="rgba(255,195,0,.5)"/>';
    }
    b.innerHTML = svg + '</svg>';
    layer.appendChild(b);
    out.push(b);
  }
  return out;
}

// ---------- the stage: the victim's avatar, temporarily LARGE ----------
function showStage(info) {
  clearTimeout(stageHideTimer);
  var root = document.getElementById("impact");
  root.classList.remove("hidden");
  root.classList.remove("leaving");
  if (stg && stg.name === info.name) { return; }
  root.innerHTML = "";
  var size = Math.round(Math.min(300, Math.max(170, window.innerWidth * 0.6)));
  var s = { name: info.name, size: size, blots: [], fresh: true };
  s.screen = makeEl("div", "impact-screen");
  s.box = makeEl("div", "stage");
  s.wrap = makeEl("div", "stage-avatar");
  s.wrap.style.width = size + "px";
  s.wrap.style.height = size + "px";
  s.wrap.appendChild(makeAvatar(info.name, size));
  s.fx = makeEl("div", "stage-fx");
  s.react = makeEl("div", "stage-react");
  s.wrap.appendChild(s.fx);
  s.wrap.appendChild(s.react);
  s.nameEl = makeEl("div", "stage-name");
  s.nameEl.textContent = info.name;
  s.msg = makeEl("div", "stage-msg");
  s.box.appendChild(s.wrap);
  s.box.appendChild(s.nameEl);
  s.box.appendChild(s.msg);
  root.appendChild(s.screen);
  root.appendChild(s.box);
  stg = s;
}

function endStage() {
  if (!stg) { return; }
  var root = document.getElementById("impact");
  root.classList.add("leaving");
  stageHideTimer = setTimeout(safe(function () {
    root.classList.add("hidden");
    root.classList.remove("leaving");
    root.innerHTML = "";
    stg = null;
  }), 420);
}

// the big tomato / egg flies in from the side of the screen towards the face
function launch(info, fast, done) {
  var ps = Math.round(Math.min(130, window.innerWidth * 0.3));
  var el = makeEl("div", "proj");
  el.style.width = ps + "px";
  el.style.height = ps + "px";
  el.innerHTML = info.item === "egg" ? eggSvg() : tomatoSvg();
  var fromLeft = Math.random() < 0.5, dur = fast ? 0.35 : 0.6;
  el.style.left = (fromLeft ? -ps : window.innerWidth) + "px";
  el.style.top = Math.round(rnd(window.innerHeight * 0.15, window.innerHeight * 0.7)) + "px";
  el.style.transition = "left " + dur + "s linear, top " + dur + "s cubic-bezier(.3,-.6,.7,1), transform " + dur + "s linear";
  document.body.appendChild(el);
  setTimeout(safe(function () {
    el.style.left = Math.round(window.innerWidth / 2 - ps / 2) + "px";
    el.style.top = Math.round(window.innerHeight * 0.46 - 35 - ps / 2) + "px";
    el.style.transform = "rotate(" + (fromLeft ? 720 : -720) + "deg) scale(1.2)";
  }), 30);
  setTimeout(safe(function () { if (el.parentNode) { el.parentNode.removeChild(el); } done(); }), dur * 1000 + 60);
}

function burst(info) {
  var kind = info.item;
  stg.fx.innerHTML = kind === "egg" ? eggSplashSvg() : tomatoSplashSvg();
  addParticles(kind, stg.wrap, stg.size);
  stg.blots = stg.blots.concat(screenBlots(kind, stg.screen));
  var word = makeEl("div", "boom");
  word.textContent = pickOf(kind === "egg" ? EGG_WORDS : TOMATO_WORDS);
  stg.box.appendChild(word);
  setTimeout(function () { if (word.parentNode) { word.parentNode.removeChild(word); } }, 1000);
  stg.wrap.classList.remove("squish");
  void stg.wrap.getBoundingClientRect();
  stg.wrap.classList.add("squish");
  stg.react.textContent = info.reaction || "😵";
  stg.react.classList.remove("show");
  void stg.react.getBoundingClientRect();
  stg.react.classList.add("show");
  stg.msg.textContent = info.text || "";
  if (info.card && typeof addSplat === "function") { addSplat(info.card, kind); }   // small stain on the side card too
}

function fadeSplash() {
  if (!stg) { return; }
  var sp = stg.fx.firstChild;
  if (sp && sp.classList) { sp.classList.add("fade"); }
  var old = stg.blots;
  stg.blots = [];
  old.forEach(function (b) { b.classList.add("fade"); setTimeout(function () { if (b.parentNode) { b.parentNode.removeChild(b); } }, 500); });
}

function nextImpact() {
  var info = impactQueue.shift();
  if (!info) { endStage(); return; }
  impactBusy = true;
  var fast = impactQueue.length > 0;     // several throws waiting: speed up so nobody is kept waiting
  showStage(info);
  var wait = stg.fresh ? 300 : 40;       // let a new avatar grow first
  stg.fresh = false;
  setTimeout(safe(function () {
    launch(info, fast, safe(function () {
      burst(info);
      setTimeout(safe(function () { fadeSplash(); impactBusy = false; nextImpact(); }), fast ? 600 : 1400);
    }));
  }), wait);
}

function enqueueImpact(info) {
  try {
    if (impactQueue.length >= MAX_QUEUE) { impactQueue.shift(); }
    impactQueue.push(info);
    if (!impactBusy) { nextImpact(); }
  } catch (e) { impactBusy = false; }
}
