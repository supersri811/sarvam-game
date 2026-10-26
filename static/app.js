// =====================================================================
// Varnamala: Alphabet tab + Practice lessons.
// Plain JS, no build step. Loaded by index.html (deferred).
// =====================================================================

// letter, hint (romanised), example word, word hint, meaning
const VOWELS = [
  ["अ","a","अनार","anaar","pomegranate"], ["आ","aa","आम","aam","mango"], ["इ","i","इमली","imli","tamarind"],
  ["ई","ee","ईख","eekh","sugarcane"], ["उ","u","उल्लू","ullu","owl"], ["ऊ","oo","ऊन","oon","wool"],
  ["ए","e","एक","ek","one"], ["ऐ","ai","ऐनक","ainak","glasses"], ["ओ","o","ओस","os","dew"], ["औ","au","औरत","aurat","woman"],
];
const CONSONANTS = [
  ["क","ka","कमल","kamal","lotus"], ["ख","kha","खरगोश","khargosh","rabbit"], ["ग","ga","गाय","gaay","cow"],
  ["घ","gha","घर","ghar","house"], ["च","cha","चम्मच","chammach","spoon"], ["ज","ja","जल","jal","water"],
  ["ट","ta","टमाटर","tamaatar","tomato"], ["त","ta","तारा","taara","star"], ["द","da","दूध","doodh","milk"],
  ["न","na","नमक","namak","salt"], ["प","pa","पानी","paani","water"], ["ब","ba","बकरी","bakri","goat"],
  ["म","ma","मछली","machhli","fish"], ["र","ra","रोटी","roti","bread"], ["ल","la","लड्डू","laddu","sweet ball"],
  ["व","va","वन","van","forest"], ["स","sa","सेब","seb","apple"], ["ह","ha","हाथी","haathi","elephant"],
];
const ALL = [...VOWELS, ...CONSONANTS];
const PASS_SCORE = 70;

// Practice lesson settings (change these to tune the game)
const LESSON_LENGTH = 8;     // questions per lesson
const SAY_COUNT = 1;         // "say it" questions per lesson (each one costs a paid STT call; keep <= 2)
const MAX_HEARTS = 5;
const XP_PER_CORRECT = 2;
const XP_LESSON_BONUS = 5;
const SLOW_PACE = 0.7;

// ---------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const shuffle = list => {            // Fisher-Yates, returns a new array
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
// restart a CSS animation on an element that already has the class
function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

// ---- saved progress (browser only) ----
const todayStr = () => new Date().toDateString();
let save = { xp:0, learned:[], streak:0, lastDay:"" };
try { Object.assign(save, JSON.parse(localStorage.getItem("varnamala") || "{}")); } catch {}
const persist = () => { try { localStorage.setItem("varnamala", JSON.stringify(save)); } catch {} };

function renderStats() {
  $("xp").textContent = save.xp;
  $("streak").textContent = save.streak;
  $("level").textContent = 1 + Math.floor(save.xp / 50);
  $("count").textContent = save.learned.length;
  $("total").textContent = ALL.length;
  $("bar").style.width = (100 * save.learned.length / ALL.length) + "%";
  document.querySelectorAll(".tile").forEach(t => t.classList.toggle("done", save.learned.includes(t.dataset.letter)));
  $("learnedNote").textContent = save.learned.length
    ? `Lessons favour the ${save.learned.length} letters you've learned.`
    : "Tip: learn a few letters in the Alphabet tab first. Lessons use those first.";
}

function bumpStreak() {
  if (save.lastDay === todayStr()) return;
  const yesterday = new Date(Date.now() - 864e5).toDateString();
  save.streak = save.lastDay === yesterday ? save.streak + 1 : 1;
  save.lastDay = todayStr();
}

// floating "+10 XP" text
function pop(text) {
  const d = document.createElement("div");
  d.className = "pop"; d.textContent = text;
  document.body.appendChild(d); setTimeout(() => d.remove(), 1200);
}

// little arpeggio; pass other frequencies for a sad "wrong" sound
function chime(freqs = [523, 659, 784]) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(.15, ctx.currentTime + i * .12);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .12 + .2);
      o.start(ctx.currentTime + i * .12); o.stop(ctx.currentTime + i * .12 + .2);
    });
  } catch {}
}

// canvas-confetti comes from a CDN; if it didn't load (offline) we just skip it.
// disableForReducedMotion keeps it off for people who asked their OS for less motion.
function confettiBurst(big) {
  if (typeof confetti !== "function") return;
  const base = { disableForReducedMotion:true, zIndex:100 };
  confetti({ ...base, particleCount: big ? 120 : 60, spread: big ? 80 : 60, origin:{ y:.65 } });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount:70, angle:60, spread:60, origin:{ x:0, y:.7 } }), 250);
    setTimeout(() => confetti({ ...base, particleCount:70, angle:120, spread:60, origin:{ x:1, y:.7 } }), 450);
  }
}

// ---------------------------------------------------------------------
// light / dark theme (the early script in <head> already applied a saved choice)
// ---------------------------------------------------------------------
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const effectiveTheme = () => document.documentElement.dataset.theme || (darkQuery.matches ? "dark" : "light");
// the button shows the mode you would switch TO
const paintThemeButton = () => { $("theme").textContent = effectiveTheme() === "dark" ? "☀️" : "🌙"; };
$("theme").onclick = () => {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("varnamala-theme", next); } catch {}
  paintThemeButton();
};
darkQuery.addEventListener("change", paintThemeButton);
paintThemeButton();

// ---------------------------------------------------------------------
// tabs
// ---------------------------------------------------------------------
function showTab(name) {
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll("main").forEach(m => { m.hidden = m.id !== name; }); // un-hiding replays the fade-in
}
document.querySelectorAll("nav button:not(:disabled)").forEach(b => { b.onclick = () => showTab(b.dataset.tab); });

// ---------------------------------------------------------------------
// shared: server errors, text-to-speech, recording, speech-to-text, scoring
// (used by both the Alphabet sheet and the Practice lessons)
// ---------------------------------------------------------------------

// server errors may be JSON {error} or plain text
async function errorText(res) {
  const text = await res.text();
  try { return JSON.parse(text).error || text; } catch { return `${res.status}: ${text.slice(0, 80)}`; }
}

// Sarvam text-to-speech. Throws on failure; callers decide how to show the error.
let player = null, playToken = 0;
const audioCache = new Map();           // "text|pace" -> Blob, so a replay doesn't hit the network again
async function playText(text, pace = 1) {
  const mine = ++playToken;             // if the user moves on while we fetch, don't play stale audio
  if (player) player.pause();
  const key = `${text}|${pace}`;
  if (!audioCache.has(key)) {
    const res = await fetch("/api/tts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ text, pace }) });
    if (!res.ok) throw new Error(await errorText(res));
    audioCache.set(key, await res.blob());
  }
  if (mine !== playToken) return;
  const url = URL.createObjectURL(audioCache.get(key));
  player = new Audio(url);
  player.onended = () => URL.revokeObjectURL(url);
  await player.play();
}
function stopAudio() { playToken++; if (player) player.pause(); }

// Microphone recording: tap to start, tap again (or 6 s) to stop.
// onStart/onStop update the button; onBlob receives the recorded audio.
// Throws if the mic is blocked.
let recorder = null, chunks = [], stopTimer = null;
function stopRecording(discard) {
  clearTimeout(stopTimer);
  if (recorder && recorder.state === "recording") { recorder.discard = discard; recorder.stop(); }
}
async function toggleRecording({ onStart, onStop, onBlob }) {
  if (recorder && recorder.state === "recording") return stopRecording(false);
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  chunks = [];
  const rec = recorder = new MediaRecorder(stream);
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    onStop();
    if (!rec.discard) onBlob(new Blob(chunks, { type: rec.mimeType }));
  };
  rec.start();
  onStart();
  stopTimer = setTimeout(() => stopRecording(false), 6000);
}

// Sarvam speech-to-text: returns the transcript text (throws on failure)
async function transcribe(blob) {
  const form = new FormData(); form.append("audio", blob, "speech.webm");
  const res = await fetch("/api/stt", { method:"POST", body:form });
  if (!res.ok) throw new Error(await errorText(res));
  return (await res.json()).transcript || "";
}

// similarity 0-100 using edit distance on the Devanagari text
function similarity(a, b) {
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  const d = Array.from({ length:m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return Math.round(100 * (1 - d[m][n] / Math.max(m, n)));
}
const clean = s => s.replace(/[^ऀ-ॿ]/g, "");

// best match of the target against the whole transcript or any single word in it
function speechScore(transcript, target) {
  const t = clean(target);
  const words = transcript.split(/\s+/).map(clean).filter(Boolean);
  return Math.max(similarity(clean(transcript), t), ...words.map(w => similarity(w, t)), 0);
}

// ---------------------------------------------------------------------
// ALPHABET TAB
// ---------------------------------------------------------------------
function buildGrid(id, list, startIndex) {
  const el = $(id);
  list.forEach((item, n) => {
    const t = document.createElement("div");
    t.className = "tile"; t.dataset.letter = item[0];
    t.style.setProperty("--i", startIndex + n);        // staggers the pop-in animation
    t.innerHTML = `<b>${item[0]}</b><span>${item[1]}</span>`;
    t.onclick = () => openLesson(item);
    el.appendChild(t);
  });
}
buildGrid("vowels", VOWELS, 0); buildGrid("consonants", CONSONANTS, VOWELS.length);

let current = null;

function openLesson(item) {
  current = item;
  $("lessonTitle").textContent = `Letter ${ALL.indexOf(item) + 1} of ${ALL.length}`;
  $("letter").textContent = item[0];
  $("hint").textContent = `sounds like “${item[1]}”`;
  $("word").textContent = item[2];
  $("meaning").textContent = `${item[3]} · ${item[4]}`;
  applyHints(); showResult("", "");
  $("lesson").classList.add("open");
}
const applyHints = () => {
  const on = $("hintsOn").checked;
  $("hint").classList.toggle("hidden", !on);
  $("meaning").style.visibility = on ? "visible" : "hidden";
};
$("hintsOn").onchange = applyHints;
$("close").onclick = () => { $("lesson").classList.remove("open"); stopRecording(true); };

function showResult(kind, html) {
  const r = $("result"); r.className = kind; r.innerHTML = html;
}

async function speak(text, pace, btn) {
  btn.disabled = true;
  try { await playText(text, pace); }
  catch (e) { showResult("err", `<b>Couldn't play audio</b><small>${esc(e.message)}</small>`); }
  btn.disabled = false;
}
$("hearLetter").onclick = e => speak(current[0], 1.0, e.currentTarget);
$("hearWord").onclick = e => speak(current[2], 1.0, e.currentTarget);
$("hearSlow").onclick = e => speak(current[2], SLOW_PACE, e.currentTarget);

$("mic").onclick = async () => {
  try {
    await toggleRecording({
      onStart: () => { $("mic").className = "btn rec"; $("mic").textContent = "⏹ Tap when done"; showResult("", ""); },
      onStop: () => { $("mic").className = "btn green"; $("mic").textContent = "🎤 Say the word"; },
      onBlob: grade,
    });
  } catch { showResult("err", "<b>Microphone blocked</b><small>Allow mic access in your browser and try again.</small>"); }
};

async function grade(blob) {
  $("mic").disabled = true; showResult("", ""); $("mic").textContent = "Listening…";
  try {
    const transcript = await transcribe(blob);
    const score = speechScore(transcript, current[2]);
    if (score >= PASS_SCORE) {
      const first = !save.learned.includes(current[0]);
      if (first) save.learned.push(current[0]);
      save.xp += first ? 10 : 2; bumpStreak(); persist(); renderStats();
      pop(first ? "+10 XP" : "+2 XP"); chime();
      if (first) confettiBurst(false);               // celebrate a brand-new letter
      showResult("ok", `<b>Great! ${score}%</b><small>I heard: ${esc(transcript || "…")}</small>`);
    } else {
      showResult("bad", `<b>Almost – ${score}%</b><small>I heard: ${esc(transcript || "nothing")}. Listen again and retry.</small>`);
    }
  } catch (e) { showResult("err", `<b>Couldn't check your voice</b><small>${esc(e.message)}</small>`); }
  $("mic").disabled = false; $("mic").textContent = "🎤 Say the word";
}

// ---------------------------------------------------------------------
// PRACTICE TAB: Duolingo-style lessons
// Question shapes (item = one row of VOWELS/CONSONANTS):
//   letter: { type, item, options, answer }  letter -> romanised sound
//   read:   { type, item, options, answer }  Devanagari word -> English meaning
//   listen: { type, item, options, answer }  audio -> Devanagari word
//   say:    { type, item }                   English meaning -> speak it (paid STT call)
// ---------------------------------------------------------------------
let Q = null;   // state of the lesson in progress (null when no lesson is open)

// 4 options: the right one plus 3 different-looking wrong ones (key() decides what "different" means,
// e.g. two letters both sounding "ta" must not both appear as options)
function makeOptions(item, key) {
  const options = [key(item)], seen = new Set(options);
  for (const other of shuffle(ALL)) {
    const k = key(other);
    if (!seen.has(k)) { seen.add(k); options.push(k); }
    if (options.length === 4) break;
  }
  return shuffle(options);
}

function makeQuestion(type, item) {
  if (type === "letter") return { type, item, options: makeOptions(item, i => i[1]), answer: item[1] };
  if (type === "read")   return { type, item, options: makeOptions(item, i => i[4]), answer: item[4] };
  if (type === "listen") return { type, item, options: makeOptions(item, i => i[2]), answer: item[2] };
  return { type, item };
}

function buildLesson() {
  // prefer letters the learner already knows, then fill up from the rest
  const known = ALL.filter(i => save.learned.includes(i[0]));
  const rest = ALL.filter(i => !save.learned.includes(i[0]));
  const items = [...shuffle(known), ...shuffle(rest)].slice(0, LESSON_LENGTH);
  // every type at least twice (so at least once), "say" capped by SAY_COUNT, the remainder is random free types
  const types = ["letter","letter","read","read","listen","listen", ...Array(SAY_COUNT).fill("say")];
  while (types.length < LESSON_LENGTH) types.push(shuffle(["letter","read","listen"])[0]);
  return shuffle(types.slice(0, LESSON_LENGTH)).map((t, i) => makeQuestion(t, items[i]));
}

function startLesson() {
  const queue = buildLesson();
  Q = { queue, total:queue.length, resolved:0, hearts:MAX_HEARTS, combo:0, bestCombo:0,
        right:0, wrong:0, xp:0, q:null, checked:false, picked:null };
  $("quiz").className = "open";
  nextQuestion();
}

function nextQuestion() {
  if (!Q.queue.length) return finishLesson();
  Q.q = Q.queue.shift();
  renderQuestion();
}

// top bar: progress (wrong answers add a retry to `total`, so the bar accounts for them), hearts, combo
function renderHud() {
  $("qBar").style.width = (100 * Q.resolved / Q.total) + "%";
  $("qHearts").textContent = `${Q.hearts > 0 ? "❤️" : "💔"} ${Q.hearts}`;
  const combo = $("qCombo");
  combo.hidden = Q.combo < 3;
  if (!combo.hidden) { combo.textContent = `🔥 ${Q.combo} combo`; replay(combo, "combo"); }
}

function renderQuestion() {
  const { q } = Q;
  Q.checked = false; Q.picked = null;
  $("qFoot").className = "qfoot"; $("fb").innerHTML = "";
  const act = $("qAction");
  act.textContent = "Check"; act.className = "btn green"; act.disabled = true;
  renderHud();

  const item = q.item;
  const opts = cls => `<div class="opts" id="qOpts">${q.options.map((o, i) =>
    `<button class="opt ${cls}" style="--i:${i}" data-i="${i}">${esc(o)}</button>`).join("")}</div>`;
  let html = "";
  if (q.type === "letter") {
    html = `<p class="qprompt">What sound does this letter make?</p><div class="qbig">${item[0]}</div>${opts("")}`;
  } else if (q.type === "read") {
    html = `<p class="qprompt">What does this word mean?</p><div class="qbig word">${item[2]}</div>${opts("")}`;
  } else if (q.type === "listen") {
    html = `<p class="qprompt">Tap the word you hear</p>
      <div class="listen"><button class="roundbtn" id="qPlay" aria-label="Play word">🔊</button>
      <button class="roundbtn slow" id="qSlow" aria-label="Play slowly">🐢</button></div>${opts("deva")}`;
  } else { // say
    html = `<p class="qprompt">Say this word in Hindi</p>
      <div class="qbig meaning">${esc(item[4])}</div><div class="qhint">sounds like “${esc(item[3])}”</div>
      <button class="btn green qmic" id="qMic">🎤 Tap to speak</button>
      <button class="linkbtn" id="qSkip">Can't speak now</button>`;
  }
  $("qBody").innerHTML = `<div class="qcontent">${html}<div class="qmsg" id="qMsg" aria-live="polite"></div></div>`;

  if (q.type === "listen") {
    $("qPlay").onclick = e => quizSpeak(1.0, e.currentTarget);
    $("qSlow").onclick = e => quizSpeak(SLOW_PACE, e.currentTarget);
    quizSpeak(1.0, $("qPlay"));            // auto-play once
  }
  if (q.type === "say") {
    $("qMic").onclick = quizMic;
    $("qSkip").onclick = skipQuestion;
  }
}

function quizMsg(kind, html) { const m = $("qMsg"); if (m) { m.className = "qmsg " + kind; m.innerHTML = html; } }

async function quizSpeak(pace, btn) {
  const q = Q.q;
  btn.disabled = true;
  try { await playText(q.item[2], pace); }
  catch (e) {
    if (Q && Q.q === q) quizMsg("err", `<b>Couldn't play audio</b><small>${esc(e.message)}. Tap 🔊 to try again.</small>`);
  }
  btn.disabled = false;
}

// pick an option (tapping an option only selects; CHECK does the grading)
$("qBody").addEventListener("click", e => {
  const btn = e.target.closest(".opt");
  if (!btn || !Q || Q.checked) return;
  document.querySelectorAll(".opt").forEach(o => o.classList.toggle("sel", o === btn));
  Q.picked = +btn.dataset.i;
  $("qAction").disabled = false;
  $("qAction").focus();                      // so Enter confirms
});

$("qAction").onclick = () => {
  if (!Q) return;
  if (Q.checked) return afterFeedback();
  const q = Q.q;
  const picked = q.options[Q.picked];
  // colour the options: green for the right one, red shake for a wrong pick
  document.querySelectorAll(".opt").forEach(o => {
    const val = q.options[+o.dataset.i];
    o.classList.remove("sel");
    if (val === q.answer) o.classList.add("right");
    else if (+o.dataset.i === Q.picked) o.classList.add("wrong");
  });
  $("qOpts").classList.add("locked");
  finishCheck(picked === q.answer);
};

// ---- say-it question: record -> transcribe -> score ----
async function quizMic() {
  const q = Q.q;
  try {
    await toggleRecording({
      onStart: () => { const b = $("qMic"); if (b) { b.className = "btn rec qmic"; b.textContent = "⏹ Tap when done"; } quizMsg("", ""); },
      onStop: () => { const b = $("qMic"); if (b) { b.className = "btn green qmic"; b.textContent = "🎤 Tap to speak"; } },
      onBlob: blob => gradeSpeech(q, blob),
    });
  } catch { quizMsg("err", "<b>Microphone blocked</b><small>Allow mic access in your browser, or tap “Can't speak now”.</small>"); }
}

async function gradeSpeech(q, blob) {
  const mic = $("qMic"), skip = $("qSkip");
  mic.disabled = skip.disabled = true; mic.textContent = "Listening…"; quizMsg("", "");
  try {
    const transcript = await transcribe(blob);
    if (!Q || Q.q !== q) return;                         // lesson was closed meanwhile
    const score = speechScore(transcript, q.item[2]);
    finishCheck(score >= PASS_SCORE, `I heard: ${esc(transcript || "nothing")} (${score}%)`);
  } catch (e) {
    // an error is not the learner's fault: no heart lost, they can retry or skip
    if (!Q || Q.q !== q) return;
    quizMsg("err", `<b>Couldn't check your voice</b><small>${esc(e.message)}</small>`);
    mic.disabled = skip.disabled = false; mic.textContent = "🎤 Tap to speak";
  }
}

// skipping a "say it" question costs nothing and isn't counted in accuracy
function skipQuestion() {
  stopRecording(true);
  Q.resolved++;
  renderHud();
  nextQuestion();
}

// ---- shared result handling for every question type ----
function finishCheck(ok, note = "") {
  const q = Q.q;
  Q.checked = true;
  if (ok) {
    Q.right++; Q.resolved++; Q.combo++; Q.bestCombo = Math.max(Q.bestCombo, Q.combo);
    Q.xp += XP_PER_CORRECT; save.xp += XP_PER_CORRECT; bumpStreak(); persist(); renderStats();
    pop(`+${XP_PER_CORRECT} XP`); chime();
  } else {
    Q.wrong++; Q.hearts--; Q.combo = 0;
    Q.queue.push({ ...q, options: q.options && shuffle(q.options) });  // asked again at the end
    Q.total++;                                                         // progress bar now has one more to go
    chime([330, 262]);
  }
  renderHud();
  if (!ok) replay($("qHearts"), "hit");

  // feedback panel (slides up from the bottom)
  const item = q.item;
  const answerLine = q.type === "letter"
    ? `${item[0]} · “${item[1]}”`
    : item[2];
  const detail = q.type === "letter"
    ? `${item[2]} (${item[3]}) · ${item[4]}`
    : `${item[3]} · ${item[4]}`;
  $("fb").innerHTML = ok
    ? `<div class="fb-title">🎉 Correct!</div>${Q.combo >= 3 ? `<small>🔥 ${Q.combo} in a row!</small>` : ""}${note ? `<small>${note}</small>` : ""}`
    : `<div class="fb-title">Not quite</div><div class="fb-label">Correct answer:</div>
       <div class="fb-answer">${answerLine}</div><small>${detail}</small>${note ? `<small>${note}</small>` : ""}`;
  $("qFoot").className = "qfoot " + (ok ? "ok" : "bad");
  const act = $("qAction");
  act.textContent = "Continue"; act.className = "btn " + (ok ? "green" : "red"); act.disabled = false;
  act.focus();
}

function afterFeedback() {
  if (Q.hearts <= 0) return outOfHearts();
  nextQuestion();
}

// ---- end screens ----
function finishLesson() {
  Q.xp += XP_LESSON_BONUS; save.xp += XP_LESSON_BONUS; bumpStreak(); persist(); renderStats();
  const tries = Q.right + Q.wrong;
  const accuracy = tries ? Math.round(100 * Q.right / tries) : 100;
  $("qBar").style.width = "100%";
  $("quiz").classList.add("ended");
  $("qBody").innerHTML = `<div class="qcontent endcard">
    <span class="trophy">🏆</span><h1>Lesson complete!</h1>
    <p class="sub">+${XP_LESSON_BONUS} XP bonus for finishing</p>
    <div class="stats3">
      <div class="stat3 xp" style="--i:0"><small>XP earned</small><b>⭐ ${Q.xp}</b></div>
      <div class="stat3 acc" style="--i:1"><small>Accuracy</small><b>${accuracy}%</b></div>
      <div class="stat3 combo" style="--i:2"><small>Best combo</small><b>🔥 ${Q.bestCombo}</b></div>
    </div>
    <button class="btn green" id="endDone">Continue</button>
    <button class="btn ghost" id="endAgain">Practice again</button></div>`;
  $("endDone").onclick = closeQuiz;
  $("endAgain").onclick = startLesson;
  chime([523, 659, 784, 1047]); confettiBurst(true);
}

function outOfHearts() {
  $("quiz").classList.add("ended");
  $("qBody").innerHTML = `<div class="qcontent endcard">
    <span class="trophy">💔</span><h1>Out of hearts</h1>
    <p class="sub">No worries, mistakes are how we learn. You earned ⭐ ${Q.xp} XP this round.</p>
    <button class="btn green" id="endAgain">Try again</button>
    <button class="btn ghost" id="endDone">Back</button></div>`;
  $("endDone").onclick = closeQuiz;
  $("endAgain").onclick = startLesson;
}

// ---- closing ----
function closeQuiz() {
  stopRecording(true); stopAudio();
  $("quitSheet").hidden = true;
  $("quiz").className = "";
  Q = null;
}
// the X asks first, unless the lesson is already over
$("qClose").onclick = () => {
  if (!Q) return;
  if ($("quiz").classList.contains("ended")) return closeQuiz();
  $("quitSheet").hidden = false;
};
$("quitKeep").onclick = () => { $("quitSheet").hidden = true; };
$("quitYes").onclick = closeQuiz;
$("startLesson").onclick = startLesson;

// keyboard: 1-4 pick an option; Enter confirms when focus isn't already on a button
document.addEventListener("keydown", e => {
  if (!Q || !$("quiz").classList.contains("open") || !$("quitSheet").hidden) return;
  if (/^[1-4]$/.test(e.key) && !Q.checked) {
    const o = document.querySelectorAll(".opt")[+e.key - 1];
    if (o) o.click();
  } else if (e.key === "Enter" && !e.target.closest("button") && !$("qAction").disabled) {
    $("qAction").click();
  }
});

renderStats();
