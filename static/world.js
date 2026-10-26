// =====================================================================
// Pixel world: walk around, talk to NPCs in Hindi, collect 3 word-gems,
// beat the Rakshasa. Uses helpers from app.js (save, persist, addXP, ...).
// Sprites: Kenney Tiny Town / Tiny Dungeon (CC0), 16x16 tiles.
// =====================================================================
(() => {
const TS = 16, VW = 15, VH = 10;                 // tile size, view size in tiles
const town = new Image(); town.src = "/static/assets/tiny-town/Tilemap/tilemap_packed.png";
const dung = new Image(); dung.src = "/static/assets/tiny-dungeon/Tilemap/tilemap_packed.png";

// legend: char -> [sheet, tile index, solid?, ground drawn underneath]
const G = [town, 0];
const LEGEND = {
  ".":[town,0,false], ",":[town,2,false], "=":[town,25,false],
  "T":[town,16,true,G], "A":[town,15,true,G], "P":[town,28,true,G], "B":[town,5,true,G], "#":[town,81,true,G],
  "R":[town,53,true], "G":[town,61,true], "W":[town,73,true], "w":[town,77,true],
  "d":[town,86,false], "o":[town,90,false],                    // school door, dojo door
  "s":[dung,48,false], "z":[dung,49,false], "r":[dung,40,true], "c":[dung,63,true,[dung,48]],
  "f":[dung,0,false], "x":[dung,14,true], "k":[dung,45,false,[dung,48]], "g":[dung,46,true,[dung,0]],
};

// ---- areas (20x14 tiles each) ----
const AREAS = {
  bazaar: { name:"बाज़ार · Bazaar", map:[
    "TTTTTTTTTTTTTTTTTTTT",
    "T.RRR....,....GGG..T",
    "T.RRR.........GGG..T",
    "T.WdW....,....wow..T",
    "T..=...........=...T",
    "T..=============....",
    "T,.=....,...=.......",
    "T..=.###....=..,...T",
    "T..=.........B.....T",
    "T..=..,......BB...,T",
    "T..=...............T",
    "T..=......,........T",
    "T..=...............T",
    "TTT=TTTTTTTTTTTTTTTT"],
    exits:{ east:["forest",1,5], south:["desert",3,1] } },
  forest: { name:"जंगल · Autumn Forest", map:[
    "AAAAAAAAAAAAAAAAAAAA",
    "A,...A....P...A..,.A",
    "A..A....P....A.....A",
    "A.....AA.....,..A..A",
    "A..P.......A.......A",
    "....=========.....PA",
    "A.......,....=..A..A",
    "A..A..P......=.....A",
    "A.......A....=..P..A",
    "AA..P........=.....A",
    "A.....A..,...====..A",
    "A..A.....P.......A.A",
    "A.,..A.......A....,A",
    "AAAAAAAAAAAAAAAAAAAA"],
    exits:{ west:["bazaar",18,5] } },
  desert: { name:"रेगिस्तान · Desert", map:[
    "rrrs.rrrrrrrrrrrrrrr",
    "r..s........z.....rr",
    "r..s...r.........c.r",
    "r..ssssssssss...z..r",
    "r..z.....r..s......r",
    "r.....c.....s...r..r",
    "rr..........s......r",
    "r...z..rr...s....z.r",
    "r...........skz....r",
    "r..c....z..........r",
    "r.....r.......c..r.r",
    "r..z.........z.....r",
    "r.....c...r......z.r",
    "rrrrrrrrrrrrrrrrrrrr"],
    exits:{ north:["bazaar",3,12] }, fill:"s" },
  lair: { name:"राक्षस की गुफ़ा · Lair", map:[
    "xxxxxxxxxxxxxxxxxxxx",
    "x..................x",
    "x..xx..........xx..x",
    "x..................x",
    "x......x....x......x",
    "x..................x",
    "x..................x",
    "x..xx..........xx..x",
    "x..................x",
    "x..................x",
    "x..................x",
    "x.........k........x",
    "x..................x",
    "xxxxxxxxxxxxxxxxxxxx"], fill:"f" },
};
// "." in desert/lair means that area's own floor
for (const a of Object.values(AREAS)) if (a.fill) a.map = a.map.map(r => r.replaceAll(".", a.fill));

// ---- NPCs: sprite index in tiny-dungeon, position, scripted Hindi dialogue ----
// node: { hi, en, opts:[{hi, en, r, next?, money?, add?, gem?, need?}] }  (no opts = end)
const NPCS = [
  { id:"dadaji", area:"bazaar", x:8, y:6, s:84, name:"दादाजी (Storyteller)", nodes:{
    start:{ hi:"नमस्ते बच्चे! राक्षस ने हमारे शब्द चुरा लिए।", en:"Hello child! The Rakshasa stole our words.",
      opts:[{ hi:"नमस्ते दादाजी!", en:"Hello grandpa!", r:"namaste daadaaji", next:"quest" }] },
    quest:{ hi:"तीन शब्द-रत्न लाओ: बाज़ार, जंगल और रेगिस्तान से।", en:"Bring three word-gems: from the bazaar, forest and desert.",
      opts:[{ hi:"ठीक है, मैं जाऊँगा!", en:"Okay, I will go!", r:"theek hai, main jaaoonga" },
            { hi:"राक्षस कहाँ है?", en:"Where is the Rakshasa?", r:"raakshas kahaan hai", next:"where" }] },
    where:{ hi:"रेगिस्तान की गुफ़ा में। पहले रत्न लाओ!", en:"In the desert cave. Bring the gems first!",
      opts:[{ hi:"समझ गया।", en:"Understood.", r:"samajh gaya" }] },
    won:{ hi:"शाबाश! बाज़ार फिर से बोल रहा है!", en:"Well done! The bazaar speaks again!",
      opts:[{ hi:"धन्यवाद दादाजी!", en:"Thank you grandpa!", r:"dhanyavaad daadaaji" }] } } },
  { id:"fruit", area:"bazaar", x:12, y:9, s:99, name:"फलवाली (Fruit seller)", nodes:{
    start:{ hi:"आम लो, आम! एक आम दस रुपये।", en:"Mangoes! One mango, ten rupees.",
      opts:[{ hi:"दो आम दीजिए।", en:"Two mangoes, please.", r:"do aam deejiye", next:"gem", money:-20, add:"🥭 आम ×2" },
            { hi:"नहीं, धन्यवाद।", en:"No, thank you.", r:"nahin, dhanyavaad" }] },
    gem:{ hi:"ये लो! तुम अच्छे ग्राहक हो। ये रत्न भी लो।", en:"Here you go! You're a good customer. Take this gem too.",
      opts:[{ hi:"बहुत धन्यवाद!", en:"Thank you very much!", r:"bahut dhanyavaad", gem:"bazaar" }] } } },
  { id:"chai", area:"bazaar", x:16, y:4, s:98, name:"चायवाला (Chai seller)", nodes:{
    start:{ hi:"गरम चाय! चाय पियोगे?", en:"Hot tea! Will you drink tea?",
      opts:[{ hi:"हाँ, एक चाय दीजिए।", en:"Yes, one tea please.", r:"haan, ek chaay deejiye", money:-5, add:"🍵 चाय", next:"thanks" },
            { hi:"अभी नहीं।", en:"Not now.", r:"abhi nahin" }] },
    thanks:{ hi:"लो! दोजो में अभ्यास करो, ताक़त बढ़ेगी।", en:"Here! Practise in the Dojo, you'll get stronger.",
      opts:[{ hi:"ज़रूर!", en:"Sure!", r:"zaroor" }] } } },
  { id:"hermit", area:"forest", x:10, y:7, s:100, name:"साधु (Forest hermit)", nodes:{
    start:{ hi:"जंगल में स्वागत है। बताओ, 'पानी' का मतलब क्या है?", en:"Welcome to the forest. Tell me, what does 'paani' mean?",
      opts:[{ hi:"पानी मतलब आग।", en:"Paani means fire.", r:"paani matlab aag", next:"wrong" },
            { hi:"पानी मतलब water।", en:"Paani means water.", r:"paani matlab water", next:"gem" },
            { hi:"पानी मतलब घर।", en:"Paani means house.", r:"paani matlab ghar", next:"wrong" }] },
    wrong:{ hi:"नहीं बच्चे! फिर सोचो।", en:"No, child! Think again.", opts:[{ hi:"फिर से।", en:"Again.", r:"phir se", next:"start" }] },
    gem:{ hi:"सही! ये जंगल का रत्न तुम्हारा है।", en:"Right! This forest gem is yours.",
      opts:[{ hi:"धन्यवाद बाबा!", en:"Thank you, baba!", r:"dhanyavaad baabaa", gem:"forest" }] } } },
  { id:"trader", area:"desert", x:6, y:4, s:112, name:"व्यापारी (Trader)", nodes:{
    start:{ hi:"रेगिस्तान का रत्न चाहिए? सौ रुपये!", en:"Want the desert gem? A hundred rupees!",
      opts:[{ hi:"ये लो सौ रुपये।", en:"Here's a hundred rupees.", r:"ye lo sau rupaye", money:-100, gem:"desert", next:"deal" },
            { hi:"कम कीजिए, पचास?", en:"Lower it, fifty?", r:"kam keejiye, pachaas", next:"haggle" }] },
    haggle:{ hi:"हा हा! ठीक है, पचास। तुम होशियार हो।", en:"Ha ha! Okay, fifty. You're clever.",
      opts:[{ hi:"धन्यवाद भैया!", en:"Thanks, brother!", r:"dhanyavaad bhaiyaa", money:-50, gem:"desert", next:"deal" }] },
    deal:{ hi:"गुफ़ा के पहरेदार को रत्न दिखाना।", en:"Show the gems to the cave guard.", opts:[{ hi:"ठीक है।", en:"Okay.", r:"theek hai" }] } } },
  { id:"guard", area:"desert", x:12, y:9, s:96, name:"पहरेदार (Guard)", nodes:{
    start:{ hi:"रुको! तीन रत्न के बिना गुफ़ा में नहीं।", en:"Stop! Not into the cave without three gems.", opts:[{ hi:"मैं रत्न लाऊँगा।", en:"I'll bring the gems.", r:"main ratn laaoonga" }] },
    open:{ hi:"तीन रत्न! जाओ वीर, राक्षस अंदर है।", en:"Three gems! Go, hero, the Rakshasa is inside.", opts:[{ hi:"चलो!", en:"Let's go!", r:"chalo" }] } } },
  { id:"boss", area:"lair", x:10, y:4, s:110, name:"राक्षस (Rakshasa)", nodes:{
    start:{ hi:"हा हा हा! शब्द मेरे हैं!", en:"Ha ha ha! The words are mine!", opts:[{ hi:"शब्द लौटाओ!", en:"Give back the words!", r:"shabd lautaao", next:"fight" }] } } },
];

// ---- secrets: deliberately overpowered perks ----
const SECRETS = [
  { id:"chai",  area:"bazaar", x:1,  y:12, name:"☕ Golden Chai",   desc:"Double XP for 10 minutes" },
  { id:"owl",   area:"forest", x:18, y:1,  name:"🦉 Wise Owl",      desc:"Crosses out 2 wrong answers, forever" },
  { id:"laddu", area:"desert", x:18, y:1,  name:"🍬 Lucky Laddu",   desc:"Infinite hearts next lesson / boss fight" },
  { id:"pouch", area:"forest", x:1,  y:12, name:"💰 Rupee Pouch",   desc:"+₹1000" },
];

// ---- saved world state (inside the shared save object) ----
save.world = Object.assign({ area:"bazaar", x:9, y:7, money:100, items:[], gems:[], found:[], won:false }, save.world || {});
const W = save.world;
const area = () => AREAS[W.area];
const $w = id => document.getElementById(id);

// ---- drawing ----
const cv = $w("wCanvas"), ctx = cv.getContext("2d");
ctx.imageSmoothingEnabled = false;
const tileAt = (x, y) => (area().map[y] || "")[x] || " ";
function drawTile(sheet, i, px, py) {
  ctx.drawImage(sheet, (i % 12) * TS, Math.floor(i / 12) * TS, TS, TS, px, py, TS, TS);
}
let anim = { px:W.x, py:W.y, t:1, fx:W.x, fy:W.y }, face = 1, frame = 0;
function draw() {
  frame++;
  const cx = anim.fx + (anim.px - anim.fx) * anim.t, cy = anim.fy + (anim.py - anim.fy) * anim.t;
  const camX = Math.max(0, Math.min(20 - VW, cx - 7)), camY = Math.max(0, Math.min(14 - VH, cy - 4.5));
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 20; x++) {
    const L = LEGEND[tileAt(x, y)]; if (!L) continue;
    const px = Math.round((x - camX) * TS), py = Math.round((y - camY) * TS);
    if (L[3]) drawTile(L[3][0], L[3][1], px, py);
    drawTile(L[0], L[1], px, py);
  }
  // sparkles for secrets not yet found
  for (const s of SECRETS) if (s.area === W.area && !W.found.includes(s.id)) {
    const px = (s.x - camX) * TS + 8, py = (s.y - camY) * TS + 8, r = 2 + Math.sin(frame / 8) * 1.5;
    ctx.fillStyle = "rgba(255,240,120,.9)"; ctx.fillRect(px - r, py - .5, r * 2, 1); ctx.fillRect(px - .5, py - r, 1, r * 2);
  }
  for (const n of NPCS) if (n.area === W.area && !(n.id === "boss" && W.won))
    drawTile(dung, n.s, Math.round((n.x - camX) * TS), Math.round((n.y - camY) * TS) + (n.id === "boss" ? Math.sin(frame / 10) : 0));
  // player (bob while walking, flip for left)
  const bob = anim.t < 1 ? -Math.abs(Math.sin(anim.t * Math.PI)) * 2 : 0;
  const ppx = Math.round((cx - camX) * TS), ppy = Math.round((cy - camY) * TS + bob);
  ctx.save();
  if (face < 0) { ctx.translate(ppx + TS, ppy); ctx.scale(-1, 1); drawTile(dung, 88, 0, 0); } else drawTile(dung, 88, ppx, ppy);
  ctx.restore();
  if (anim.t < 1) anim.t = Math.min(1, anim.t + .2);
  requestAnimationFrame(draw);
}

// ---- movement ----
let dir = { x:0, y:1 };
const npcAt = (x, y) => NPCS.find(n => n.area === W.area && n.x === x && n.y === y && !(n.id === "boss" && W.won));
function solid(x, y) {
  const c = tileAt(x, y);
  if (c === "k" && W.area === "desert" && W.gems.length < 3) return true;  // cave sealed until 3 gems
  return (LEGEND[c] || [, , true])[2] || !!npcAt(x, y);
}
function move(dx, dy) {
  if (busy()) return;
  dir = { x:dx, y:dy }; if (dx) face = dx;
  const nx = W.x + dx, ny = W.y + dy;
  if (nx < 0 || ny < 0 || nx >= 20 || ny >= 14) return leave(dx, dy);
  if (anim.t < 1 || solid(nx, ny)) return;
  anim = { fx:W.x, fy:W.y, px:nx, py:ny, t:0 };
  W.x = nx; W.y = ny; persist();
  stepOn(nx, ny);
}
function leave(dx, dy) {
  const side = dx > 0 ? "east" : dx < 0 ? "west" : dy > 0 ? "south" : "north";
  const ex = (area().exits || {})[side]; if (ex) goTo(...ex);
}
function goTo(to, x, y) {
  W.area = to; W.x = x; W.y = y; anim = { px:x, py:y, fx:x, fy:y, t:1 }; persist(); hud();
  const b = $w("wBanner"); b.textContent = area().name; replay(b, "show");
}
function stepOn(x, y) {
  const c = tileAt(x, y);
  if (c === "d") enterBuilding("alphabet");
  if (c === "o") enterBuilding("practice");
  if (c === "k") W.area === "desert" ? goTo("lair", 10, 10) : goTo("desert", 13, 9);
  const s = SECRETS.find(s => s.area === W.area && s.x === x && s.y === y && !W.found.includes(s.id));
  if (s) findSecret(s);
}
// the 'k' tile in the desert is next to the guard; stepping off the lair's 'k' goes back

// ---- perks ----
function findSecret(s) {
  W.found.push(s.id);
  if (s.id === "chai") save.perks.chaiUntil = Date.now() + 10 * 60 * 1000;
  if (s.id === "owl") save.perks.owl = true;
  if (s.id === "laddu") save.perks.laddu = true;
  if (s.id === "pouch") W.money += 1000;
  persist(); hud(); chime([523, 659, 784, 1047]); confettiBurst(true);
  say({ name:"✨ Secret found!", hi:s.name, en:s.desc, opts:[{ hi:"वाह!", en:"Wow!", r:"vaah" }] });
}

// ---- dialogue ----
let talking = null;
const busy = () => talking || !$w("bag").hidden || !$w("battle").hidden || $w("world").hidden;
function interact() {
  if (talking) return;
  const n = npcAt(W.x + dir.x, W.y + dir.y); if (!n) return;
  let node = "start";
  if (n.id === "dadaji" && W.won) node = "won";
  if (n.id === "guard" && W.gems.length >= 3) node = "open";
  if ((n.id === "fruit" && W.gems.includes("bazaar")) || (n.id === "hermit" && W.gems.includes("forest")) || (n.id === "trader" && W.gems.includes("desert")))
    node = n.id === "fruit" ? "start" : "deal";
  if (n.id === "hermit" && W.gems.includes("forest")) node = "gem";
  showNode(n, node);
}
function showNode(n, key) {
  if (key === "fight") { closeTalk(); return startBattle(); }
  const node = n.nodes[key];
  say({ name:n.name, hi:node.hi, en:node.en, opts:node.opts, npc:n });
}
function say(d) {
  talking = d;
  $w("wDialog").hidden = false;
  $w("dName").textContent = d.name;
  $w("dHi").textContent = d.hi;
  $w("dEn").textContent = d.en;
  $w("dEn").hidden = !$w("wSubs").checked;
  $w("dSpeak").onclick = () => hear(d.hi);
  $w("dOpts").innerHTML = (d.opts || []).map((o, i) => `<div class="dopt"><button data-i="${i}"><b>${esc(o.hi)}</b><small>${esc(o.en)}</small><small class="r">🗣 ${esc(o.r)}</small></button><button class="dspeak" data-hear="${i}" title="Hear it">🔊</button></div>`).join("");
  $w("dMore").hidden = !!(d.opts || []).length;
}
// NPC voices + your replies via Sarvam TTS (fails quietly when there are no credits)
function hear(text) { playText(text).catch(e => { $w("dEn").hidden = false; $w("dEn").textContent = "🔇 " + e.message; }); }
$w("dOpts").addEventListener("click", e => {
  const h = e.target.closest("[data-hear]");
  if (h) return hear(talking.opts[+h.dataset.hear].hi);
  const b = e.target.closest("[data-i]"); if (!b || !talking) return;
  choose(talking.opts[+b.dataset.i]);
});
function choose(o) {
  const d = talking;
  if (o.money && W.money + o.money < 0)
    return say({ ...d, hi:"पैसे कम हैं!", en:"Not enough money!", opts:[{ hi:"ठीक है।", en:"Okay.", r:"theek hai" }] });
  if (o.money) W.money += o.money;
  if (o.add) W.items.push(o.add);
  if (o.gem && !W.gems.includes(o.gem)) { W.gems.push(o.gem); pop("💎 Gem!"); chime(); confettiBurst(false); }
  persist(); hud();
  if (o.next && d.npc) return showNode(d.npc, o.next);
  closeTalk();
}
function closeTalk() { talking = null; $w("wDialog").hidden = true; }
$w("wSubs").onchange = () => { if (talking) $w("dEn").hidden = !$w("wSubs").checked; };

// ---- boss battle: real-time. Answer before the timer runs out; the boss keeps attacking. ----
const QUESTION_TIME = 8;       // seconds per question; running out = the boss hits hard
const BOSS_EVERY = 4;          // the boss also strikes on its own every few seconds
const HIT = { wrong:20, timeout:25, auto:8 }, YOUR_HIT = 20, CRIT_BONUS = 10;
let B = null;
const TAUNTS = [["तुम कुछ नहीं जानते!", "You know nothing!"], ["मेरे शब्द, मेरे!", "My words, mine!"], ["हा! फिर कोशिश करो!", "Ha! Try again!"], ["मैं अजेय हूँ!", "I am invincible!"], ["जल्दी करो!", "Hurry up!"]];
function startBattle() {
  B = { boss:100, you:100, infinite:!!save.perks.laddu, left:QUESTION_TIME, untilHit:BOSS_EVERY, timer:null, q:null };
  if (B.infinite) { save.perks.laddu = false; persist(); }
  for (const [id, i] of [["bYou", 88], ["bBoss", 110]]) {
    const c = $w(id).getContext("2d"); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 16, 16); drawTileOn(c, i);
  }
  $w("battle").hidden = false; battleTurn();
  B.timer = setInterval(tick, 100);
}
function drawTileOn(c, i) { c.drawImage(dung, (i % 12) * TS, Math.floor(i / 12) * TS, TS, TS, 0, 0, TS, TS); }
function bars() {
  $w("bBossHp").style.width = B.boss + "%";
  $w("bYouHp").style.width = (B.infinite ? 100 : B.you) + "%";
}
// runs 10x a second: question countdown + the boss's own attacks
function tick() {
  if (!B || B.over) return;
  B.left -= .1; B.untilHit -= .1;
  const t = $w("bTime"); if (t) t.style.width = Math.max(0, 100 * B.left / QUESTION_TIME) + "%";
  if (B.untilHit <= 0) { B.untilHit = BOSS_EVERY; bossStrike(HIT.auto, ["राक्षस का पंजा!", "Rakshasa's claw!"]); }
  if (B.over) return;
  if (B.left <= 0) { bossStrike(HIT.timeout, ["बहुत धीमे!", "Too slow!"]); if (!B.over) battleTurn(); }
}
function bossStrike(dmg, [hi, en]) {
  replay($w("bBoss"), "lunge"); replay($w("bYou"), "shake"); replay($w("battle"), "hurt");
  if (!B.infinite) B.you = Math.max(0, B.you - dmg);
  floatDmg(B.infinite ? "🛡 0" : `-${dmg}`);
  $w("bTaunt").innerHTML = `<b>राक्षस:</b> ${hi} <small>${en}</small>`;
  chime([330, 262]); bars();
  if (B.you <= 0) endBattle(false);
}
function floatDmg(text) {
  const d = document.createElement("div"); d.className = "dmg"; d.textContent = text;
  $w("bYou").parentElement.appendChild(d); setTimeout(() => d.remove(), 900);
}
function battleTurn() {
  bars();
  B.left = QUESTION_TIME;
  const item = ALL[Math.floor(Math.random() * ALL.length)];
  const q = B.q = makeQuestion(shuffle(["letter", "read", "pick"])[0], item);
  const prompt = q.type === "letter" ? ["What sound?", item[0]] : q.type === "read" ? ["Meaning?", item[2]] : ["Which word means…", item[4]];
  $w("bQ").innerHTML = `<div class="btimer"><i id="bTime"></i></div>
    <div class="bprompt">⚔️ Attack! ${prompt[0]}</div><div class="bbig">${esc(prompt[1])}</div>
    <div class="opts">${q.options.map((o, i) => `<button class="bopt" data-i="${i}">${esc(o)}</button>`).join("")}</div>`;
  if (save.perks.owl) shuffle([...$w("bQ").querySelectorAll(".bopt")].filter(b => q.options[+b.dataset.i] !== q.answer)).slice(0, 2).forEach(b => b.disabled = true);
  $w("bQ").querySelectorAll(".bopt").forEach(b => b.onclick = () => attack(q.options[+b.dataset.i] === q.answer));
}
function attack(ok) {
  if (!B || B.over) return;
  if (ok) {
    const fast = B.left > QUESTION_TIME - 3;                // answered within 3 s = critical hit
    const dmg = (YOUR_HIT + (fast ? CRIT_BONUS : 0)) * xpMultiplier();
    B.boss = Math.max(0, B.boss - dmg); replay($w("bBoss"), "flash"); chime();
    $w("bTaunt").innerHTML = fast ? `<b>⚡ CRITICAL! -${dmg}</b>` : `<b>💥 -${dmg}</b>`;
    if (B.boss <= 0) return endBattle(true);
  } else {
    bossStrike(HIT.wrong, ["ग़लत! हा हा!", "Wrong! Ha ha!"]);
    if (B.over) return;
  }
  battleTurn();
}
function endBattle(won) {
  B.over = true; clearInterval(B.timer); bars();
  if (won) {
    W.won = true; const got = addXP(100); persist(); confettiBurst(true); chime([523, 659, 784, 1047]);
    $w("bQ").innerHTML = `<h2>🏆 Victory! +${got} XP</h2><p>The words are free. The bazaar speaks again!</p><button class="bopt" id="bDone">Back to the world</button>`;
  } else {
    $w("bQ").innerHTML = `<h2>💔 Defeated</h2><p>Practise in the Dojo (or find the Lucky Laddu 🍬) and try again.</p><button class="bopt" id="bDone">Back</button>`;
  }
  $w("bDone").onclick = () => { $w("battle").hidden = true; if (won) goTo("bazaar", 9, 7); else goTo("lair", 10, 10); };
}

// ---- bag ----
function openBag() {
  const perks = SECRETS.filter(s => W.found.includes(s.id));
  $w("bagBody").innerHTML =
    `<div class="bagrow"><span>💵 Money</span><b>₹${W.money}</b></div>
     <div class="bagrow"><span>💎 Word-gems</span><b>${W.gems.length}/3</b></div>` +
    W.items.map(i => `<div class="bagrow"><span>${esc(i)}</span></div>`).join("") +
    perks.map(p => `<div class="bagrow"><span>${p.name}</span><small>${p.desc}</small></div>`).join("") +
    (perks.length < SECRETS.length ? `<p class="sub">${SECRETS.length - perks.length} secret perk(s) still hidden… look for sparkles ✨</p>` : "");
  $w("bag").hidden = false;
}
$w("wBag").onclick = openBag;
$w("bagClose").onclick = () => { $w("bag").hidden = true; };

function hud() {
  $w("wArea").textContent = area().name;
  $w("wQuest").textContent = W.won ? "🏆 Rakshasa beaten" : `💎 ${W.gems.length}/3`;
  $w("wMoney").textContent = `₹${W.money}`;
  $w("wChai").hidden = xpMultiplier() < 2;
}
setInterval(hud, 5000);

// ---- World / Classic mode + building doors ----
let mode = "world";
try { mode = localStorage.getItem("varnamala-mode") || "world"; } catch {}
function setMode(m) {
  mode = m; try { localStorage.setItem("varnamala-mode", m); } catch {}
  document.body.classList.toggle("worldmode", m === "world");
  $w("mode").textContent = m === "world" ? "📚" : "🗺️";
  $w("mode").title = m === "world" ? "Switch to Classic" : "Switch to World";
  $w("backWorld").hidden = true;
  if (m === "world") { document.querySelectorAll("main").forEach(el => el.hidden = el.id !== "world"); }
  else showTab("alphabet");
}
function enterBuilding(tab) {
  showTab(tab);
  $w("backWorld").hidden = false;
  W.y += 1; anim = { px:W.x, py:W.y, fx:W.x, fy:W.y, t:1 }; persist();   // step back out of the door
}
$w("backWorld").onclick = () => setMode("world");
$w("mode").onclick = () => setMode(mode === "world" ? "classic" : "world");

// ---- input ----
const KEYS = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0], w:[0,-1], s:[0,1], a:[-1,0], d:[1,0] };
document.addEventListener("keydown", e => {
  if ($w("world").hidden || e.target.closest?.("input")) return;
  if (KEYS[e.key]) { e.preventDefault(); move(...KEYS[e.key]); }
  if (e.key === " " || e.key === "Enter" || e.key === "e") {
    e.preventDefault();
    if (talking && !(talking.opts || []).length) closeTalk(); else interact();
  }
  if (e.key === "Escape") { closeTalk(); $w("bag").hidden = true; }
  if (/^[1-4]$/.test(e.key) && talking && talking.opts[+e.key - 1]) choose(talking.opts[+e.key - 1]);
});
document.querySelectorAll(".dpad button").forEach(b => {
  const d = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] }[b.dataset.d];
  let t = null;
  b.onpointerdown = e => { e.preventDefault(); move(...d); t = setInterval(() => move(...d), 180); };
  b.onpointerup = b.onpointerleave = () => clearInterval(t);
});
$w("wA").onclick = interact;

setMode(mode); hud();
Promise.all([town, dung].map(i => i.decode())).then(() => requestAnimationFrame(draw));
})();
