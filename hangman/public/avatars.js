// Cartoon avatars for Break Room Hangman (no photos, all drawn in code).
// Every default player has their own hairstyle, outfit and funny face.
// The same name always gives the same avatar.
var DEFAULT_NAMES = ["Abinesh", "Bala", "Jaanageswar", "Kaviya", "Kirthiga", "Rasmus", "Sai", "Sanskaar", "Shravan", "Vasupradaa"];

// girl: 1 = girl. hair/hc = hairstyle + colour, out/oc = outfit + colour, face = funny expression.
var LOOKS = {
  Kaviya:      { girl: 1, lash: 1, skin: "#e0ac80", hair: "ponytail", hc: "#2b1b12", out: "dots",    oc: "#ffb703", bg: "#ffe5ec", face: "wink",   acc: "flower" },
  Kirthiga:    { girl: 1, skin: "#eac197", hair: "medium",   hc: "#1c1c1c", out: "hoodie",  oc: "#8338ec", bg: "#d0f4de", face: "happy" },
  Vasupradaa:  { girl: 1, lash: 1, skin: "#c98f5f", hair: "part",     hc: "#2b1b12", out: "collar",  oc: "#2a9d8f", bg: "#fff3b0", face: "cute",   acc: "braids", extra: ["specs"], fc: "#ff8c42" },
  Abinesh:     { skin: "#d9a273", hair: "casual",   hc: "#1c1c1c", out: "tee",     oc: "#e63946", bg: "#caffbf", face: "default", acc: "airpods" },
  Bala:        { skin: "#d09a6c", hair: "curly",    hc: "#1c1c1c", out: "tie",     oc: "#4361ee", bg: "#ffd6a5", face: "grin",   acc: "beard" },
  Jaanageswar: { skin: "#e8b88a", hair: "sidepart", hc: "#3d2314", out: "bow",     oc: "#1d3557", bg: "#bde0fe", face: "shock",  acc: "mustache" },
  Rasmus:      { skin: "#d49f70", hair: "shag",   hc: "#1c1c1c", out: "stripes", oc: "#06a77d", bg: "#fdffb6", face: "charm",  acc: "earring" },
  Sai:         { skin: "#e6b88c", hair: "hero",     hc: "#1c1c1c", out: "hoodie",  oc: "#f77f00", bg: "#cdb4db", face: "confident" },
  Sanskaar:    { skin: "#e2b085", hair: "cap",      hc: "#7209b7", out: "tee",     oc: "#2d6a4f", bg: "#ffc8dd", face: "awake" },
  Shravan:     { skin: "#e4c09c", hair: "bowl",     hc: "#1c1c1c", out: "collar",  oc: "#5b84b5", bg: "#8fa6c9", face: "default", acc: "specsTop", fc: "#aab4c4" }
};

var SKINS = ["#f6d0a8", "#e8b88a", "#c98f5f", "#9a6a43"];
var HAIRS = ["#2b1b12", "#3d2314", "#1c1c1c", "#5a3825"];
var BGS = ["#ffd166", "#9bdeac", "#a0c4ff", "#ffadad", "#caffbf", "#bdb2ff", "#fdffb6", "#ffc6ff"];
var SHIRTS = ["#e63946", "#2a9d8f", "#4361ee", "#f77f00", "#7209b7", "#06a77d"];
var INK = "#2d2a32";

function hashOf(name) {
  var h = 7;
  for (var i = 0; i < name.length; i++) { h = (h * 31 + name.charCodeAt(i)) >>> 0; }
  return h;
}
function bits(h, shift, mod) { return (h >>> shift) % mod; }

// Typed names that are not in the list get a random (but always the same) look.
function lookFor(name) {
  if (LOOKS[name]) { return LOOKS[name]; }
  var h = hashOf(name), girl = h % 2 === 0;
  var hairs = girl ? ["long", "bob", "buns"] : ["spiky", "curly", "sidepart", "mohawk", "topknot", "bowl"];
  var faces = ["wink", "laugh", "tongue", "shades", "grin", "shock", "cross", "smirk", "sleepy", "cheesy"];
  var outs = ["tee", "hoodie", "collar", "tie", "bow", "stripes", "dots"];
  return {
    girl: girl ? 1 : 0, skin: SKINS[bits(h, 1, 4)], hair: hairs[bits(h, 3, hairs.length)], hc: HAIRS[bits(h, 5, 4)],
    out: outs[bits(h, 7, outs.length)], oc: SHIRTS[bits(h, 10, 6)], bg: BGS[bits(h, 13, 8)], face: faces[bits(h, 16, faces.length)]
  };
}

function hairBack(l) {
  var c = l.hc;
  if (l.hair === "long") { return '<path d="M24 46 Q24 12 50 12 Q76 12 76 46 L79 86 Q64 78 62 60 L38 60 Q36 78 21 86Z" fill="' + c + '"/>'; }
  if (l.hair === "bob") { return '<path d="M24 46 Q22 12 50 12 Q78 12 76 46 L77 68 Q50 76 23 68Z" fill="' + c + '"/>'; }
  if (l.hair === "buns") { return '<circle cx="27" cy="20" r="10" fill="' + c + '"/><circle cx="73" cy="20" r="10" fill="' + c + '"/>'; }
  if (l.hair === "topknot") { return '<circle cx="50" cy="12" r="9" fill="' + c + '"/>'; }
  if (l.hair === "wavy") { return '<path d="M22 48 Q20 10 50 9 Q80 10 78 48 L81 70 L74 66 L72 76 L66 64 L34 64 L28 76 L26 66 L19 70Z" fill="' + c + '"/>'; }
  if (l.hair === "part") { return '<path d="M24 46 Q23 14 50 13 Q77 14 76 46 L77 62 Q50 68 23 62Z" fill="' + c + '"/>'; }
  if (l.hair === "shag") { return '<path d="M25 40 Q21 9 50 7 Q79 9 75 40 L77 56 L73 55 L76 66 L70 60 L67 66 L62 61 L38 61 L33 66 L30 60 L24 66 L27 55 L23 56Z" fill="' + c + '"/>'; }
  if (l.hair === "medium") { return '<path d="M23 46 Q21 12 50 11 Q79 12 77 46 L79 70 Q80 80 70 80 Q63 76 63 62 L37 62 Q37 76 30 80 Q20 80 21 70Z" fill="' + c + '"/>'; }
  if (l.hair === "ponytail") { return '<path d="M60 20 Q96 6 93 46 Q91 66 83 82 Q78 68 81 52 Q82 34 66 32Z" fill="' + c + '"/>'; }
  return "";
}

function hairFront(l) {
  var c = l.hc;
  var fringe = '<path d="M26 44 Q28 18 50 18 Q72 18 74 44 Q60 30 50 30 Q40 30 26 44Z" fill="' + c + '"/>';
  switch (l.hair) {
    case "long": case "buns": case "topknot": return fringe;
    case "bob": return '<path d="M25 48 Q22 13 50 13 Q78 13 75 48 Q72 32 50 30 Q28 32 25 48Z" fill="' + c + '"/>';
    case "spiky": return '<path d="M26 44 L27 22 L36 32 L42 12 L50 28 L58 12 L64 32 L73 22 L74 44 Q50 28 26 44Z" fill="' + c + '"/>';
    case "curly":
      return '<g fill="' + c + '"><circle cx="29" cy="34" r="9"/><circle cx="38" cy="23" r="9"/><circle cx="50" cy="19" r="9.5"/>' +
        '<circle cx="62" cy="23" r="9"/><circle cx="71" cy="34" r="9"/></g>';
    case "sidepart": return '<path d="M25 46 Q22 14 52 14 Q79 16 75 46 Q70 28 46 28 Q32 30 25 46Z" fill="' + c + '"/>';
    case "mohawk": return '<path d="M42 28 Q42 6 50 2 Q58 6 58 28 Q50 22 42 28Z" fill="' + c + '"/>';
    case "wavy":
      return '<path d="M24 44 Q22 12 52 10 Q80 12 76 44 Q74 30 64 26 Q58 34 44 28 Q32 30 24 44Z" fill="' + c + '"/><path d="M30 22 L25 11 L39 17Z M66 20 L72 9 L74 24Z" fill="' + c + '"/>';
    case "neat":
      return '<path d="M25 45 Q24 15 50 14 Q76 15 75 45 Q72 30 58 26 Q44 24 34 30 Q27 35 25 45Z" fill="' + c + '"/><path d="M45 16 Q47 24 40 28" stroke="rgba(255,255,255,.25)" stroke-width="1.6" fill="none"/>';
    case "casual":
      return '<path d="M25 45 Q23 16 50 15 Q77 16 75 45 Q68 30 50 29 Q32 30 25 45Z" fill="' + c + '"/><g fill="' + c + '"><circle cx="38" cy="18" r="6"/><circle cx="50" cy="14" r="6.5"/><circle cx="62" cy="18" r="6"/></g>';
    case "part":
      return '<path d="M24 48 Q22 12 50 12 Q78 12 76 48 Q70 30 51 24 L49 24 Q30 30 24 48Z" fill="' + c + '"/><path d="M50 12 L50 24" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>';
    case "ponytail":
      return '<path d="M25 44 Q24 14 50 14 Q76 14 75 40 Q62 22 46 26 Q32 30 25 44Z" fill="' + c + '"/><circle cx="63" cy="23" r="6" fill="#ff5c8a"/><circle cx="63" cy="23" r="2.4" fill="#ffd1dc"/>';
    case "crop":     // TEXTURE CROP: faded short sides, curly textured top, short choppy fringe pushed forward
      return '<path d="M32 30 L33 40 L31 50 Q27 46 27 42Z M68 30 L67 40 L69 50 Q73 46 73 42Z" fill="' + c + '" opacity=".4"/>' +
        '<path d="M27 38 Q23 16 40 12 Q50 8 60 12 Q77 16 73 38 Q71 31 67 29 L64 37 L59 30 L54 38 L49 30 L44 38 L39 30 L35 37 L31 30 Q28 33 27 38Z" fill="' + c + '"/>' +
        '<g fill="' + c + '"><circle cx="32" cy="24" r="5.5"/><circle cx="38" cy="16" r="6"/><circle cx="47" cy="12.5" r="6"/><circle cx="57" cy="13" r="6"/><circle cx="65" cy="18" r="6"/><circle cx="69" cy="26" r="5"/></g>' +
        '<path d="M36 18 q3 -4 6 -1 M46 14 q3 -4 6 -1 M56 15 q3 -4 6 0 M33 26 q2 -3 5 -1 M63 24 q3 -3 5 0" stroke="rgba(255,255,255,.3)" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    case "crew":     // CROW CUT MEDIUM: faded sides, medium-length textured top swept up and back, tousled fringe
      return '<path d="M32 30 L33 40 L31 50 Q27 46 27 42Z M68 30 L67 40 L69 50 Q73 46 73 42Z" fill="' + c + '" opacity=".4"/>' +
        '<path d="M28 36 Q22 14 42 8 Q56 2 68 10 Q80 18 73 36 Q72 29 67 27 L64 33 L59 26 L54 32 L48 25 L43 32 L37 27 L33 33 Q30 31 28 36Z" fill="' + c + '"/>' +
        '<path d="M32 22 Q40 4 62 7 Q74 10 72 22 Q60 10 32 22Z" fill="' + c + '"/>' +
        '<path d="M34 20 Q42 10 56 10 M40 24 Q50 14 64 14 M48 24 Q58 18 68 20 M36 28 Q44 22 52 24" stroke="rgba(255,255,255,.28)" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
    case "shag":     // Rasmus: medium shaggy layered hair, long side-swept fringe, ragged ends covering the ears
      return '<path d="M47 8 Q22 7 22 36 L21 52 L27 46 L27 57 L31 42 Q35 36 41 32 Q48 28 52 24 Q50 14 47 8Z" fill="' + c + '"/>' +
        '<path d="M47 8 Q77 5 79 34 L80 51 L74 46 L74 56 L69 41 Q65 35 61 31 Q55 28 52 24 Q50 14 47 8Z" fill="' + c + '"/>' +
        '<path d="M29 28 Q38 15 53 19 Q60 25 70 31 Q58 27 51 29 Q43 30 38 36 L35 32 L32 37Z" fill="' + c + '"/>' +
        '<path d="M28 22 Q36 3 58 4 Q78 8 75 24 Q62 10 46 12 Q34 14 28 22Z" fill="' + c + '"/>' +
        '<path d="M33 22 Q42 12 54 15 M38 32 Q46 24 56 28 M26 36 q-1 8 1 14 M74 36 q1 8 -1 14 M58 12 Q68 12 73 20" stroke="rgba(255,255,255,.3)" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
    case "medium":   // Kirthiga: medium, side-swept fringe + soft face-framing locks with flipped ends + bow clip
      return '<path d="M24 52 Q19 11 50 10 Q81 11 76 52 Q73 33 58 27 Q47 38 31 40 Q26 44 24 52Z" fill="' + c + '"/>' +
        '<path d="M24 47 Q18 62 22 74 Q26 83 34 79 Q28 68 30 52Z" fill="' + c + '"/><path d="M76 47 Q82 62 78 74 Q74 83 66 79 Q72 68 70 52Z" fill="' + c + '"/>' +
        '<path d="M40 14 Q52 14 60 24 M27 60 Q25 68 27 74 M73 60 Q75 68 73 74" stroke="rgba(255,255,255,.28)" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M69 25 L61.5 21 L61.5 29Z M69 25 L76.5 21 L76.5 29Z" fill="#ff8fc7"/><circle cx="69" cy="25" r="2.3" fill="#ffd1e8"/>';
    case "modern":   // Rasmus: medium, neat textured quiff swept to the side
      return '<path d="M24 47 Q19 15 46 10 Q80 7 77 45 Q75 31 67 26 Q52 19 37 28 Q28 34 24 47Z" fill="' + c + '"/>' +
        '<path d="M33 27 Q39 5 64 11 Q76 15 74 28 Q64 16 52 20 Q42 21 33 27Z" fill="' + c + '"/>' +
        '<path d="M40 23 Q47 16 57 17 M30 36 Q33 31 38 30" stroke="rgba(255,255,255,.28)" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    case "hero":     // Sai: confident, voluminous swept-back style with a side part and sideburns
      return '<path d="M24 48 Q19 12 50 8 Q83 10 77 48 Q75 36 70 31 Q60 23 46 25 Q33 28 29 40 L27 52Z" fill="' + c + '"/>' +
        '<path d="M27 32 Q27 4 58 6 Q80 9 77 31 Q68 14 50 15 Q35 17 27 32Z" fill="' + c + '"/>' +
        '<path d="M24 46 L30 46 L29.5 59 L25 55Z M76 46 L70 46 L70.5 59 L75 55Z" fill="' + c + '"/>' +
        '<path d="M34 22 Q44 12 60 13 M45 17 Q55 20 64 27" stroke="rgba(255,255,255,.3)" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
    case "bowl": return '<path d="M25 48 Q21 13 50 13 Q79 13 75 48 L71 35 Q50 29 29 35Z" fill="' + c + '"/>';
    case "cap":
      return '<path d="M25 41 Q25 11 50 11 Q75 11 75 41Z" fill="' + c + '"/><path d="M48 36 L88 36 Q91 43 80 43 L48 43Z" fill="rgba(0,0,0,.28)"/>' +
        '<path d="M48 36 L88 36 Q91 43 80 43 L48 43Z" fill="' + c + '" opacity=".85"/><circle cx="50" cy="11" r="2.5" fill="#fff"/>';
  }
  return fringe;
}

function outfit(l) {
  var s = '<path d="M12 100 Q12 74 50 74 Q88 74 88 100Z" fill="' + l.oc + '"/>';
  var collar = '<path d="M40 74 L50 90 L36 84Z M60 74 L50 90 L64 84Z" fill="#fff"/>';
  switch (l.out) {
    case "hoodie":
      s += '<path d="M28 80 Q50 62 72 80 L74 92 Q50 78 26 92Z" fill="rgba(0,0,0,.25)"/><path d="M44 82v14M56 82v14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'; break;
    case "collar": s += collar; break;
    case "tie": s += collar + '<path d="M47 82 L53 82 L55 100 L50 104 L45 100Z" fill="#c1121f"/>'; break;
    case "bow": s += collar + '<path d="M50 85 L37 78 L37 92Z M50 85 L63 78 L63 92Z" fill="#e63946"/><circle cx="50" cy="85" r="3" fill="#9d0208"/>'; break;
    case "stripes": s += '<path d="M15 88H85M13 96H87" stroke="rgba(255,255,255,.75)" stroke-width="4"/>'; break;
    case "dots": s += '<g fill="#fff" opacity=".85"><circle cx="28" cy="90" r="3"/><circle cx="40" cy="97" r="3"/><circle cx="60" cy="97" r="3"/><circle cx="72" cy="90" r="3"/></g>'; break;
  }
  return s;
}

// Eyes + mouth: this is where the funny expressions live.
function face(l) {
  var K = INK;
  var eyeL = '<circle cx="41" cy="46" r="3.4" fill="' + K + '"/><circle cx="42" cy="45" r="1.1" fill="#fff"/>';
  var eyeR = '<circle cx="59" cy="46" r="3.4" fill="' + K + '"/><circle cx="60" cy="45" r="1.1" fill="#fff"/>';
  var smile = '<path d="M41 57 Q50 66 59 57" stroke="' + K + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  var cheeks = '<circle cx="34" cy="55" r="4" fill="#ff8a8a" opacity=".45"/><circle cx="66" cy="55" r="4" fill="#ff8a8a" opacity=".45"/>';
  var happyEyes = '<path d="M36 47 Q41 41 46 47 M54 47 Q59 41 64 47" stroke="' + K + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
  var tongue = '<ellipse cx="50" cy="65" rx="4.2" ry="5.2" fill="#ff6b81"/>';
  var out;
  switch (l.face) {
    case "wink": out = eyeL + '<path d="M54 46 Q59 41 64 46" stroke="' + K + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>' + smile; break;
    case "laugh": out = happyEyes + '<path d="M38 56 Q50 76 62 56Z" fill="#7a1f2b"/><path d="M43 65 Q50 72 57 65 Q50 61 43 65Z" fill="#ff7a8a"/>'; break;
    case "tongue": out = eyeL + eyeR + tongue + smile; break;
    case "shades":
      out = '<rect x="32" y="40" width="16" height="11" rx="4" fill="#111"/><rect x="52" y="40" width="16" height="11" rx="4" fill="#111"/>' +
        '<path d="M48 44h4" stroke="#111" stroke-width="2"/><path d="M35 43l5 0M55 43l5 0" stroke="#fff" stroke-width="1.6" opacity=".6"/>' +
        '<path d="M42 58 Q50 63 60 56" stroke="' + K + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; break;
    case "grin": out = eyeL + eyeR + '<path d="M38 56 Q50 70 62 56Z" fill="#fff" stroke="' + K + '" stroke-width="2"/><path d="M50 57v11M42 59.5h16" stroke="' + K + '" stroke-width="1"/>'; break;
    case "shock":
      out = '<circle cx="41" cy="46" r="5.5" fill="#fff" stroke="' + K + '" stroke-width="1.6"/><circle cx="59" cy="46" r="5.5" fill="#fff" stroke="' + K + '" stroke-width="1.6"/>' +
        '<circle cx="41" cy="46" r="2.2" fill="' + K + '"/><circle cx="59" cy="46" r="2.2" fill="' + K + '"/>' +
        '<path d="M34 36 Q41 31 47 36 M53 36 Q59 31 66 36" stroke="' + K + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="50" cy="63" rx="4.2" ry="6" fill="#7a1f2b"/>'; break;
    case "cross":
      out = '<circle cx="41" cy="46" r="5.2" fill="#fff" stroke="' + K + '" stroke-width="1.6"/><circle cx="59" cy="46" r="5.2" fill="#fff" stroke="' + K + '" stroke-width="1.6"/>' +
        '<circle cx="43.6" cy="46" r="2.3" fill="' + K + '"/><circle cx="56.4" cy="46" r="2.3" fill="' + K + '"/>' + tongue + smile; break;
    case "smirk":
      out = eyeL + eyeR + '<path d="M53 39 L65 36" stroke="' + K + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M42 60 Q52 64 61 55" stroke="' + K + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; break;
    case "sleepy":
      out = '<path d="M36 46 Q41 51 46 46 M54 46 Q59 51 64 46" stroke="' + K + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="50" cy="61" rx="3.4" ry="3" fill="#7a1f2b"/>' +
        '<text x="77" y="27" font-size="12" font-weight="bold" font-family="Arial" fill="' + K + '">z</text><text x="85" y="16" font-size="9" font-weight="bold" font-family="Arial" fill="' + K + '">z</text>'; break;
    case "cheesy":
      out = eyeL + eyeR + '<path d="M35 55 Q50 74 65 55Z" fill="#fff" stroke="' + K + '" stroke-width="2.2"/><path d="M39 61h22M50 56v14" stroke="' + K + '" stroke-width="1"/>'; break;
    case "cute":
      out = '<circle cx="41" cy="46" r="4.8" fill="' + K + '"/><circle cx="59" cy="46" r="4.8" fill="' + K + '"/>' +
        '<circle cx="42.8" cy="44" r="1.8" fill="#fff"/><circle cx="60.8" cy="44" r="1.8" fill="#fff"/><circle cx="39.6" cy="48" r="1" fill="#fff"/><circle cx="57.6" cy="48" r="1" fill="#fff"/>' +
        '<path d="M43 58 Q50 64 57 58" stroke="' + K + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; break;
    case "bright":
      out = '<circle cx="41" cy="46" r="4.4" fill="' + K + '"/><circle cx="59" cy="46" r="4.4" fill="' + K + '"/>' +
        '<circle cx="42.6" cy="44.2" r="1.7" fill="#fff"/><circle cx="60.6" cy="44.2" r="1.7" fill="#fff"/>' +
        '<path d="M34 36 Q41 31 47 35 M53 35 Q59 31 66 36" stroke="' + K + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M39 56 Q50 71 61 56Z" fill="#7a1f2b"/><path d="M44 64 Q50 69 56 64 Q50 61 44 64Z" fill="#ff7a8a"/>'; break;
    case "happy":    // Kirthiga: happy closed eyes, soft lashes, slightly open cute smile
      out = '<path d="M35.5 47.5 Q41 40.5 46.5 47.5 M53.5 47.5 Q59 40.5 64.5 47.5" stroke="' + K + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M35 45.5 L32.6 43.6 M64.8 45.5 L67.2 43.6" stroke="' + K + '" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M35.5 36.5 Q41 33 46 35.5 M54 35.5 Q59 33 64.5 36.5" stroke="' + K + '" stroke-width="1.9" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M42 56 Q50 66.5 58 56 Q50 59.5 42 56Z" fill="#7a1f2b" stroke="' + K + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M45.5 61.6 Q50 64.6 54.5 61.6 Q50 59.6 45.5 61.6Z" fill="#ff7a8a"/>'; break;
    case "charm":    // Rasmus: warm, friendly, slightly cool smile
      out = '<circle cx="41" cy="46" r="3.6" fill="' + K + '"/><circle cx="59" cy="46" r="3.6" fill="' + K + '"/>' +
        '<circle cx="42.1" cy="44.8" r="1.2" fill="#fff"/><circle cx="60.1" cy="44.8" r="1.2" fill="#fff"/>' +
        '<path d="M35.5 38.5 Q41 35 46.5 37.5 M53.5 36.5 Q59.5 33.5 65 36.5" stroke="' + K + '" stroke-width="2.1" fill="none" stroke-linecap="round"/>' +
        '<path d="M41.5 57 Q50 64.5 59.5 56" stroke="' + K + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M60.5 56 q2 .3 2.6 -1.4" stroke="' + K + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>'; break;
    case "confident": // Sai: confident brows, friendly toothy smile
      out = '<circle cx="41" cy="46" r="3.6" fill="' + K + '"/><circle cx="59" cy="46" r="3.6" fill="' + K + '"/>' +
        '<circle cx="42.1" cy="44.8" r="1.2" fill="#fff"/><circle cx="60.1" cy="44.8" r="1.2" fill="#fff"/>' +
        '<path d="M34 38.5 Q40.5 33.5 47 37" stroke="' + K + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M53 36 Q59.5 32.5 66 36.5" stroke="' + K + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M39.5 56 Q50 66 61 55.5 Q50 59.5 39.5 56Z" fill="#fff" stroke="' + K + '" stroke-width="2" stroke-linejoin="round"/>'; break;
    case "awake":    // Sanskaar: bright open eyes, cheerful open smile
      out = '<circle cx="41" cy="46" r="4.4" fill="' + K + '"/><circle cx="59" cy="46" r="4.4" fill="' + K + '"/>' +
        '<circle cx="42.6" cy="44.2" r="1.7" fill="#fff"/><circle cx="60.6" cy="44.2" r="1.7" fill="#fff"/>' +
        '<path d="M35 38 Q41 34.5 47 37.5 M53 37.5 Q59 34.5 65 38" stroke="' + K + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M40 56 Q50 69 60 56Z" fill="#7a1f2b" stroke="' + K + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M44.5 63.4 Q50 67.6 55.5 63.4 Q50 60.6 44.5 63.4Z" fill="#ff7a8a"/>'; break;
    default: out = eyeL + eyeR + smile;
  }
  if (l.lash) { out += '<path d="M37.6 44.6 L34.4 42.2 M38.6 42.4 L36.4 39.4 M62.4 44.6 L65.6 42.2 M61.4 42.4 L63.6 39.4" stroke="' + K + '" stroke-width="1.8" stroke-linecap="round"/>'; }
  return out + cheeks;
}

function has(l, name) { return l.acc === name || (l.extra && l.extra.indexOf(name) !== -1); }

// glasses frames have a dark outline + a coloured rim so they stay visible at small sizes
function frame(cx, cy, r, color) {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(255,255,255,.1)" stroke="#2d2a32" stroke-width="4.6"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="2.4"/>';
}
function specs(l) {
  var c = l.fc || "#4a6fa5";
  return frame(41, 46, 8.5, c) + frame(59, 46, 8.5, c) +
    '<path d="M49.5 45.5 Q50 43.5 50.5 45.5" stroke="#2d2a32" stroke-width="2.4" fill="none"/>' +
    '<path d="M32.5 45 L27 44 M67.5 45 L73 44" stroke="#2d2a32" stroke-width="2.4" stroke-linecap="round"/>';
}
function specsOnHead(l) {
  var c = l.fc || "#cfd8e6";
  return frame(40, 22, 7.5, c) + frame(60, 22, 7.5, c) +
    '<path d="M47.5 21 Q50 18 52.5 21" stroke="#2d2a32" stroke-width="2.4" fill="none"/>' +
    '<path d="M32.5 22 L27 27 M67.5 22 L73 27" stroke="#2d2a32" stroke-width="2.4" stroke-linecap="round"/>';
}
function airpods() {
  var s = "";
  [26, 74].forEach(function (x) {
    s += '<rect x="' + (x - 2.4) + '" y="50" width="4.8" height="13" rx="2.4" fill="#fff" stroke="#aeb4c0" stroke-width="1"/>' +
      '<circle cx="' + x + '" cy="49" r="4.2" fill="#fff" stroke="#aeb4c0" stroke-width="1"/>';
  });
  return s;
}
function earring() {   // one tiny diamond stud on the left ear lobe
  return '<path d="M25 49.3 L26.9 51.2 L25 53.1 L23.1 51.2Z" fill="#e6fbff" stroke="#5fb4d6" stroke-width=".8" stroke-linejoin="round"/>' +
    '<circle cx="24.5" cy="50.6" r=".5" fill="#fff"/>';
}
function braids(l) {   // two neat plaited braids with hair bands
  var s = "";
  [27, 73].forEach(function (cx) {
    for (var i = 0; i < 4; i++) {
      s += '<ellipse cx="' + (cx + (i % 2 ? 1.8 : -1.8)) + '" cy="' + (62 + i * 8) + '" rx="5.6" ry="5.4" fill="' + l.hc + '" stroke="rgba(255,255,255,.3)" stroke-width="1.2"/>';
    }
    s += '<circle cx="' + cx + '" cy="93" r="3.4" fill="#ff5c8a"/>';
  });
  return s;
}

function avatarSvg(name) {
  var l = lookFor(name);
  if (name === "Rasmus") {   // Rasmus uses his finished illustrated avatar (public/avatars/rasmus.png)
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><image href="avatars/rasmus.png" x="0" y="0" width="100" height="100"/></svg>';
  }
  var s = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">';
  s += '<circle cx="50" cy="50" r="50" fill="' + l.bg + '"/>';
  s += hairBack(l);
  s += outfit(l);
  if (has(l, "braids")) { s += braids(l); }
  s += '<rect x="43" y="60" width="14" height="16" fill="' + l.skin + '"/>';
  s += '<circle cx="26" cy="48" r="4.5" fill="' + l.skin + '"/><circle cx="74" cy="48" r="4.5" fill="' + l.skin + '"/>';
  s += '<circle cx="50" cy="46" r="24" fill="' + l.skin + '"/>';
  if (l.acc === "beard") { s += '<path d="M26.5 51 Q26 73 50 74.5 Q74 73 73.5 51 Q70 56 68 57 Q65 67 50 69 Q35 67 32 57 Q30 56 26.5 51Z" fill="' + l.hc + '"/>'; }
  s += hairFront(l);
  s += face(l);
  if (l.acc === "beard") { s += '<path d="M39 57.5 Q44 53.5 50 56 Q56 53.5 61 57.5 Q50 55 39 57.5Z" fill="' + l.hc + '"/>'; }
  if (has(l, "tinystache")) { s += '<path d="M42 57 Q50 51.5 58 57 Q50 55 42 57Z" fill="#3a2a22"/>'; }
  if (has(l, "airpods")) { s += airpods(); }
  if (has(l, "earring")) { s += earring(); }
  if (has(l, "specs")) { s += specs(l); }
  if (has(l, "specsTop")) { s += specsOnHead(l); }
  if (l.acc === "mustache") { s += '<path d="M37 58 Q44 50 50 55 Q56 50 63 58 Q50 54 37 58Z" fill="' + l.hc + '"/>'; }
  if (l.acc === "glasses") { s += '<g fill="rgba(255,255,255,.3)" stroke="' + INK + '" stroke-width="2"><circle cx="41" cy="46" r="7.5"/><circle cx="59" cy="46" r="7.5"/><path d="M48.5 46h3"/></g>'; }
  if (l.acc === "flower") {
    s += '<g transform="translate(31 24)" fill="#ff5c8a"><circle cx="0" cy="-5" r="3.8"/><circle cx="5" cy="-1.5" r="3.8"/><circle cx="3" cy="4" r="3.8"/><circle cx="-3" cy="4" r="3.8"/><circle cx="-5" cy="-1.5" r="3.8"/><circle cx="0" cy="0" r="2.6" fill="#ffd166"/></g>';
  }
  return s + '</svg>';
}

// Returns a round avatar element of the given pixel size.
function makeAvatar(name, size) {
  var d = document.createElement("div");
  d.className = "avatar";
  d.style.width = size + "px";
  d.style.height = size + "px";
  d.innerHTML = avatarSvg(name);
  return d;
}
