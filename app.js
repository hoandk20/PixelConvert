/* eslint-disable no-console */

// Vanilla SPA (hash-based) that loads `data/outsystems-techlead/exams.json` and runs exam/practice sessions.
// Data model is intentionally separated: content in JSON, UI in HTML/CSS, logic here.

const DATA_URL = "data/outsystems-techlead/exams.json";
const STORAGE_KEY = "examPractice:lastSession:v1";

const appEl = document.getElementById("app");
const dataStatusEl = document.getElementById("dataStatus");
const resumeBtn = document.getElementById("resumeBtn");

/** @type {{dataset: any|null, session: any|null}} */
const state = { dataset: null, session: null };

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatPercent(n) {
  return `${Math.round(n)}%`;
}

function nowIso() {
  return new Date().toISOString();
}

function parseHash() {
  const raw = window.location.hash || "#/";
  const cleaned = raw.replace(/^#/, "");
  const [path, query] = cleaned.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(query || "");
  return { raw, parts, params };
}

function setHash(path) {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

function focusFirstHeading() {
  const h = qs("h1, h2, [data-autofocus]");
  if (h) h.focus?.();
}

function htmlToText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").replace(/\s+/g, " ").trim();
}

function mulberry32(seed) {
  // Deterministic small PRNG for reproducible shuffle orders per session.
  // https://stackoverflow.com/a/47593316
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? safeJsonParse(raw) : null;
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  syncResumeButton();
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  state.session = null;
  syncResumeButton();
}

function syncResumeButton() {
  const s = loadSession();
  const show = !!(s && s.examId && !s.submitted);
  resumeBtn.hidden = !show;
  if (show) {
    resumeBtn.onclick = () => {
      state.session = s;
      setHash(`/take/${encodeURIComponent(s.examId)}`);
    };
  } else {
    resumeBtn.onclick = null;
  }
}

function getExamById(examId) {
  return state.dataset?.exams?.find((e) => e.id === examId) || null;
}

function getQuestionById(exam, qid) {
  return exam.questions.find((q) => q.id === qid) || null;
}

function gradeSession(session, exam) {
  const detailsByQ = {};
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const qid of session.questionOrder) {
    const q = getQuestionById(exam, qid);
    const chosen = session.answersByQuestion?.[qid] ?? null;
    const correctIds = q?.correctOptionIds || [];
    const isAnswered = chosen !== null && chosen !== undefined && chosen !== "";
    const isCorrect = isAnswered && correctIds.includes(chosen);

    if (!isAnswered) unanswered++;
    else if (isCorrect) correct++;
    else incorrect++;

    detailsByQ[qid] = { chosen, correctIds, isAnswered, isCorrect };
  }

  const total = session.questionOrder.length;
  const percent = total ? (correct / total) * 100 : 0;
  return { correct, incorrect, unanswered, total, percent, detailsByQ };
}

function render(htmlString) {
  appEl.innerHTML = htmlString;
  focusFirstHeading();
}

function renderError(title, message, extraHtml = "") {
  render(`
    <section class="hero">
      <h1 tabindex="-1">${title}</h1>
      <p class="muted">${message}</p>
    </section>
    <div class="card">
      <div class="card__body">
        ${extraHtml}
        <div class="btnrow" style="margin-top:12px">
          <button class="btn" type="button" id="goHomeBtn">Go home</button>
        </div>
      </div>
    </div>
  `);
  qs("#goHomeBtn")?.addEventListener("click", () => setHash("/"));
}

function renderHome() {
  const exams = state.dataset?.exams || [];

  const groups = groupExamsByCourse(exams);

  render(`
    <section class="hero">
      <h1 tabindex="-1">Practice exams</h1>
      <p>Pick an exam set, choose your mode, and start practicing.</p>
    </section>

    <div class="grid">
      <div class="col-12 col-8">
        <div class="card">
          <div class="card__body">
            <div class="split">
              <div class="pill"><strong>${exams.length}</strong> exam sets</div>
              <div class="pill"><strong>${countQuestions(exams)}</strong> questions</div>
            </div>

            <div class="list" style="margin-top:14px">
              ${groups
                .map((g) => {
                  const groupTitle = htmlEscape(g.title);
                  const groupMeta = `${g.exams.length} sets • ${g.totalQuestions} questions`;
                  return `
                    <div class="card exam-card" style="padding:16px">
                      <div class="split">
                        <div>
                          <div class="exam-card__title">${groupTitle}</div>
                          <div class="exam-card__meta">${groupMeta}</div>
                        </div>
                      </div>
                      <div class="list" style="margin-top:12px">
                        ${g.exams
                          .map((e) => {
                            const qCount = e.questions?.length || 0;
                            const short = getSetLabelFromTitle(e.title) || e.title;
                            return `
                              <div class="card exam-card" style="box-shadow:none">
                                <div class="exam-card__title">${htmlEscape(short)}</div>
                                <div class="exam-card__meta">${qCount} questions</div>
                                <div class="exam-card__actions">
                                  <a class="btn btn--primary" href="#/exam/${encodeURIComponent(e.id)}">Start</a>
                                </div>
                              </div>
                            `;
                          })
                          .join("")}
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
}

function groupExamsByCourse(exams) {
  /** @type {Map<string, {title: string, exams: any[], totalQuestions: number}>} */
  const map = new Map();

  for (const e of exams) {
    const raw = (e.tags && e.tags[0]) || "Ungrouped";
    let title = String(raw).replaceAll("Outsystems", "OutSystems").trim();
    // Make the group title cleaner for the UI (keeps the group stable and English-only).
    title = title.replace(/\s*\(O11\)\s*/gi, "").trim();
    const key = title.toLowerCase();
    const entry = map.get(key) || { title, exams: [], totalQuestions: 0 };
    entry.exams.push(e);
    entry.totalQuestions += e.questions?.length || 0;
    map.set(key, entry);
  }

  const groups = Array.from(map.values());
  groups.sort((a, b) => a.title.localeCompare(b.title));
  for (const g of groups) {
    g.exams.sort((a, b) => a.title.localeCompare(b.title));
  }
  return groups;
}

function getSetLabelFromTitle(title) {
  const m = String(title).match(/Set\\s+(\\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return `Set ${String(n).padStart(2, "0")}`;
}

function renderExamSetup(examId) {
  const exam = getExamById(examId);
  if (!exam) return renderError("Not found", "That exam set does not exist.");

  const qCount = exam.questions.length;
  render(`
    <section class="hero">
      <h1 tabindex="-1">${htmlEscape(exam.title)}</h1>
      <p>${qCount} questions • Choose your settings, then start.</p>
    </section>

    <div class="grid">
      <div class="col-12 col-8">
        <div class="card">
          <div class="card__body">
            <div class="field">
              <label for="modeSelect">Mode</label>
              <select id="modeSelect">
                <option value="exam">Exam mode (submit at the end)</option>
                <option value="practice">Practice mode (one question at a time)</option>
              </select>
            </div>

            <div style="height:12px"></div>

            <div class="checks" role="group" aria-label="Options">
              <label class="check">
                <input type="checkbox" id="shuffleQuestions" checked />
                <span><strong>Randomize</strong> question order</span>
              </label>
              <label class="check">
                <input type="checkbox" id="shuffleOptions" checked />
                <span><strong>Randomize</strong> answer choices</span>
              </label>
              <label class="check">
                <input type="checkbox" id="practiceInstant" />
                <span><strong>Instant feedback</strong> in practice mode</span>
              </label>
              <label class="check">
                <input type="checkbox" id="persistProgress" checked />
                <span><strong>Save progress</strong> to localStorage</span>
              </label>
            </div>

            <div style="height:14px"></div>

            <div class="btnrow">
              <button class="btn btn--primary" id="startBtn" type="button">Start</button>
              <a class="btn" href="#/">Back</a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-4">
        <div class="card">
          <div class="card__body">
            <h2 style="margin:0 0 6px; font-size:1.05rem">Tip</h2>
            <p class="muted" style="margin:0">
              Use <span class="kbd">J</span>/<span class="kbd">K</span> to move next/previous question during a session.
            </p>
          </div>
        </div>
      </div>
    </div>
  `);

  qs("#startBtn")?.addEventListener("click", () => {
    const mode = qs("#modeSelect")?.value || "exam";
    const shuffleQ = qs("#shuffleQuestions")?.checked ?? true;
    const shuffleO = qs("#shuffleOptions")?.checked ?? true;
    const instant = qs("#practiceInstant")?.checked ?? false;
    const persist = qs("#persistProgress")?.checked ?? true;

    const session = createSession(exam, {
      mode,
      shuffleQuestions: shuffleQ,
      shuffleOptions: shuffleO,
      practiceInstantFeedback: instant,
      persistProgress: persist,
    });

    state.session = session;
    if (persist) saveSession(session);
    setHash(`/take/${encodeURIComponent(exam.id)}`);
  });
}

function createSession(exam, settings) {
  const seed = Date.now() >>> 0;
  const rng = mulberry32(seed);

  const originalQuestionIds = exam.questions.map((q) => q.id);
  const questionOrder = settings.shuffleQuestions ? shuffle(originalQuestionIds, rng) : originalQuestionIds;

  const optionOrderByQuestion = {};
  for (const q of exam.questions) {
    const ids = q.options.map((o) => o.id);
    optionOrderByQuestion[q.id] = settings.shuffleOptions ? shuffle(ids, rng) : ids;
  }

  return {
    schemaVersion: 1,
    seed,
    examId: exam.id,
    mode: settings.mode,
    settings: {
      shuffleQuestions: !!settings.shuffleQuestions,
      shuffleOptions: !!settings.shuffleOptions,
      practiceInstantFeedback: !!settings.practiceInstantFeedback,
      persistProgress: !!settings.persistProgress,
    },
    startedAt: nowIso(),
    completedAt: null,
    submitted: false,
    currentIndex: 0,
    questionOrder,
    optionOrderByQuestion,
    answersByQuestion: {},
    checkedByQuestion: {}, // used in practice mode to reveal correctness per question
    lastViewedAt: nowIso(),
  };
}

function renderTake(examId) {
  const exam = getExamById(examId);
  if (!exam) return renderError("Not found", "That exam set does not exist.");

  const session = state.session || loadSession();
  if (!session || session.examId !== examId) {
    return renderError("No active session", "Start an exam set first.", `<a class="btn btn--primary" href="#/exam/${encodeURIComponent(examId)}">Go to setup</a>`);
  }

  state.session = session;
  const total = session.questionOrder.length;
  const idx = clamp(session.currentIndex || 0, 0, total - 1);
  session.currentIndex = idx;

  const qid = session.questionOrder[idx];
  const question = getQuestionById(exam, qid);
  if (!question) return renderError("Data error", "Question not found in dataset.");

  const optionOrder = session.optionOrderByQuestion?.[qid] || question.options.map((o) => o.id);
  const chosen = session.answersByQuestion?.[qid] ?? "";

  const practice = session.mode === "practice";
  const checked = !!session.checkedByQuestion?.[qid];
  const showInstant = practice && session.settings?.practiceInstantFeedback;

  const showReveal = practice && (checked || showInstant);
  const correctIds = question.correctOptionIds || [];

  const answeredCount = session.questionOrder.reduce((acc, id) => acc + (session.answersByQuestion?.[id] ? 1 : 0), 0);
  const progressPct = total ? (answeredCount / total) * 100 : 0;

  render(`
    <section class="hero">
      <div class="split">
        <div>
          <h1 tabindex="-1" style="margin:0 0 6px">${htmlEscape(exam.title)}</h1>
          <p class="muted" style="margin:0">
            ${practice ? "Practice mode" : "Exam mode"} • Question <strong>${idx + 1}</strong> / ${total}
          </p>
        </div>
        <div class="btnrow right">
          <a class="btn" href="#/">Exit</a>
          <button class="btn btn--danger" id="resetBtn" type="button">Reset</button>
          <button class="btn btn--primary" id="submitBtn" type="button">${practice ? "Finish" : "Submit exam"}</button>
        </div>
      </div>

      <div style="height:10px"></div>
      <div class="progress" aria-label="Progress">
        <div style="width:${progressPct.toFixed(2)}%"></div>
      </div>
      <div style="height:10px"></div>
      <div class="split">
        <div class="pill"><strong>${answeredCount}</strong> answered</div>
        <div class="pill"><strong>${total - answeredCount}</strong> unanswered</div>
        ${question.category ? `<div class="pill">Category: <strong>${htmlEscape(question.category)}</strong></div>` : ""}
      </div>
    </section>

    <div class="card">
      <div class="card__body">
        <div class="q">
          <div class="q__prompt" id="prompt" data-autofocus tabindex="-1"></div>
          <div class="options" role="radiogroup" aria-label="Answer choices">
            ${optionOrder
              .map((oid) => {
                const opt = question.options.find((o) => o.id === oid);
                if (!opt) return "";

                const isChosen = chosen === oid;
                const isCorrect = correctIds.includes(oid);
                const classes = [
                  "option",
                  showReveal && isCorrect ? "option--correct" : "",
                  showReveal && isChosen && !isCorrect ? "option--wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return `
                  <label class="${classes}">
                    <input type="radio" name="answer" value="${oid}" ${isChosen ? "checked" : ""} />
                    <div class="option__body" data-opt="${oid}"></div>
                  </label>
                `;
              })
              .join("")}
          </div>

          <div style="height:14px"></div>

          <div class="split">
            <div class="btnrow">
              <button class="btn" type="button" id="prevBtn" ${idx === 0 ? "disabled" : ""}>Prev</button>
              <button class="btn" type="button" id="nextBtn" ${idx === total - 1 ? "disabled" : ""}>Next</button>
              <button class="btn" type="button" id="jumpBtn">Jump…</button>
            </div>
            <div class="btnrow right">
              ${
                practice
                  ? `
                    <button class="btn btn--primary" type="button" id="checkBtn" ${chosen ? "" : "disabled"}>
                      ${showReveal ? "Hide answer" : "Check answer"}
                    </button>
                  `
                  : ""
              }
            </div>
          </div>

          <div id="jumpPanel" class="review" hidden></div>
        </div>
      </div>
    </div>
  `);

  // Render prompt/options as HTML from dataset (keeps rich text/images if present).
  qs("#prompt").innerHTML = question.promptHtml;
  for (const optId of optionOrder) {
    const opt = question.options.find((o) => o.id === optId);
    const el = qs(`[data-opt="${cssEscape(optId)}"]`);
    if (el && opt) el.innerHTML = opt.html;
  }

  // Option selection.
  appEl.addEventListener(
    "change",
    (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name !== "answer") return;
      const value = target.value;
      session.answersByQuestion[qid] = value;
      session.lastViewedAt = nowIso();

      if (practice && showInstant) {
        session.checkedByQuestion[qid] = true;
      }
      if (session.settings?.persistProgress) saveSession(session);

      // Rerender to reflect correctness styles (practice) or enable buttons.
      renderTake(examId);
    },
    { once: true }
  );

  // Navigation.
  qs("#prevBtn")?.addEventListener("click", () => {
    session.currentIndex = clamp(session.currentIndex - 1, 0, total - 1);
    session.lastViewedAt = nowIso();
    if (session.settings?.persistProgress) saveSession(session);
    renderTake(examId);
  });

  qs("#nextBtn")?.addEventListener("click", () => {
    session.currentIndex = clamp(session.currentIndex + 1, 0, total - 1);
    session.lastViewedAt = nowIso();
    if (session.settings?.persistProgress) saveSession(session);
    renderTake(examId);
  });

  // Jump panel (question list).
  qs("#jumpBtn")?.addEventListener("click", () => {
    const panel = qs("#jumpPanel");
    const isHidden = panel.hasAttribute("hidden");
    if (!isHidden) {
      panel.setAttribute("hidden", "");
      panel.innerHTML = "";
      return;
    }
    panel.removeAttribute("hidden");
    panel.innerHTML = renderJumpList(session, idx);
    panel.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-jump"));
        session.currentIndex = clamp(i, 0, total - 1);
        session.lastViewedAt = nowIso();
        if (session.settings?.persistProgress) saveSession(session);
        renderTake(examId);
      });
    });
  });

  // Practice: reveal/hide answer.
  qs("#checkBtn")?.addEventListener("click", () => {
    if (showReveal) delete session.checkedByQuestion[qid];
    else session.checkedByQuestion[qid] = true;
    session.lastViewedAt = nowIso();
    if (session.settings?.persistProgress) saveSession(session);
    renderTake(examId);
  });

  // Submit / finish.
  qs("#submitBtn")?.addEventListener("click", () => {
    session.submitted = true;
    session.completedAt = nowIso();
    session.lastViewedAt = nowIso();
    if (session.settings?.persistProgress) saveSession(session);
    setHash(`/result/${encodeURIComponent(examId)}`);
  });

  qs("#resetBtn")?.addEventListener("click", () => {
    // This is intentionally destructive; keep it scoped to this app’s localStorage key.
    clearSession();
    setHash(`/exam/${encodeURIComponent(examId)}`);
  });

  // Keyboard shortcuts: J/K for next/prev.
  window.onkeydown = (e) => {
    if (e.key.toLowerCase() === "j") {
      if (idx < total - 1) qs("#nextBtn")?.click();
    } else if (e.key.toLowerCase() === "k") {
      if (idx > 0) qs("#prevBtn")?.click();
    }
  };
}

function renderJumpList(session, currentIndex) {
  const buttons = session.questionOrder
    .map((qid, i) => {
      const answered = session.answersByQuestion?.[qid] ? "✓" : "•";
      const isCurrent = i === currentIndex;
      return `<button class="btn" type="button" data-jump="${i}" ${isCurrent ? "disabled" : ""}>${i + 1} ${answered}</button>`;
    })
    .join(" ");

  return `
    <div class="card__body" style="padding:0">
      <div class="muted" style="margin-bottom:10px">Jump to question (✓ answered, • unanswered)</div>
      <div class="btnrow">${buttons}</div>
    </div>
  `;
}

function renderResult(examId) {
  const exam = getExamById(examId);
  if (!exam) return renderError("Not found", "That exam set does not exist.");

  const session = state.session || loadSession();
  if (!session || session.examId !== examId || !session.submitted) {
    return renderError("No results", "Submit an exam session first.", `<a class="btn btn--primary" href="#/exam/${encodeURIComponent(examId)}">Start</a>`);
  }

  state.session = session;
  const grade = gradeSession(session, exam);

  render(`
    <section class="hero">
      <h1 tabindex="-1">Results</h1>
      <p>${htmlEscape(exam.title)} • ${session.mode === "practice" ? "Practice" : "Exam"} mode</p>
    </section>

    <div class="grid">
      <div class="col-12 col-8">
        <div class="card">
          <div class="card__body">
            <div class="split">
              <div class="pill">Score: <strong>${grade.correct} / ${grade.total}</strong></div>
              <div class="pill">Accuracy: <strong>${formatPercent(grade.percent)}</strong></div>
            </div>
            <div style="height:12px"></div>
            <div class="split">
              <div class="pill">Correct: <strong style="color:var(--ok)">${grade.correct}</strong></div>
              <div class="pill">Incorrect: <strong style="color:var(--danger)">${grade.incorrect}</strong></div>
              <div class="pill">Unanswered: <strong style="color:var(--warn)">${grade.unanswered}</strong></div>
            </div>

            <div style="height:14px"></div>
            <div class="btnrow">
              <a class="btn btn--primary" href="#/review/${encodeURIComponent(examId)}">Review answers</a>
              <button class="btn" type="button" id="retryBtn">Retry</button>
              <a class="btn" href="#/">Home</a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-4">
        <div class="card">
          <div class="card__body">
            <h2 style="margin:0 0 6px; font-size:1.05rem">Saved</h2>
            <p class="muted" style="margin:0">
              Results are stored locally in your browser (localStorage) when “Save progress” is enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  `);

  qs("#retryBtn")?.addEventListener("click", () => {
    clearSession();
    setHash(`/exam/${encodeURIComponent(examId)}`);
  });
}

function renderReview(examId) {
  const exam = getExamById(examId);
  if (!exam) return renderError("Not found", "That exam set does not exist.");

  const session = state.session || loadSession();
  if (!session || session.examId !== examId || !session.submitted) {
    return renderError("No review", "Submit an exam session first.", `<a class="btn btn--primary" href="#/exam/${encodeURIComponent(examId)}">Start</a>`);
  }

  const grade = gradeSession(session, exam);
  const incorrectOnly = (parseHash().params.get("filter") || "") === "incorrect";

  const items = session.questionOrder.filter((qid) => {
    if (!incorrectOnly) return true;
    const d = grade.detailsByQ[qid];
    return d.isAnswered && !d.isCorrect;
  });

  render(`
    <section class="hero">
      <div class="split">
        <div>
          <h1 tabindex="-1">Review</h1>
          <p class="muted" style="margin:0">${htmlEscape(exam.title)} • ${items.length} questions shown</p>
        </div>
        <div class="btnrow right">
          <a class="btn" href="#/result/${encodeURIComponent(examId)}">Back to results</a>
          <a class="btn" href="#/">Home</a>
        </div>
      </div>
      <div style="height:10px"></div>
      <div class="btnrow">
        <a class="btn ${!incorrectOnly ? "btn--primary" : ""}" href="#/review/${encodeURIComponent(examId)}">All</a>
        <a class="btn ${incorrectOnly ? "btn--primary" : ""}" href="#/review/${encodeURIComponent(examId)}?filter=incorrect">Incorrect only</a>
      </div>
    </section>

    <div class="card">
      <div class="card__body">
        <div class="review">
          ${items
            .map((qid, i) => {
              const q = getQuestionById(exam, qid);
              const d = grade.detailsByQ[qid];
              const chosen = d.chosen;
              const correctId = d.correctIds[0];
              const chosenText = chosen ? (q.options.find((o) => o.id === chosen)?.text || chosen) : "—";
              const correctText = correctId ? (q.options.find((o) => o.id === correctId)?.text || correctId) : "—";
              const status = !d.isAnswered ? "Unanswered" : d.isCorrect ? "Correct" : "Incorrect";
              const statusColor = !d.isAnswered ? "var(--warn)" : d.isCorrect ? "var(--ok)" : "var(--danger)";
              const snippetSource = q.promptText || htmlToText(q.promptHtml);
              const snippet =
                snippetSource.length > 90 ? `${snippetSource.slice(0, 90)}…` : snippetSource;

              return `
                <details class="review-item">
                  <summary>
                    <span class="muted">#${i + 1}</span>
                    <span style="color:${statusColor}; margin-left:10px; font-weight:800">${status}</span>
                    <span class="muted" style="margin-left:10px">${htmlEscape(snippet)}</span>
                  </summary>
                  <div style="height:10px"></div>
                  <div class="muted">Your answer: <strong style="color:var(--text)">${htmlEscape(chosenText)}</strong></div>
                  <div class="muted">Correct answer: <strong style="color:var(--text)">${htmlEscape(correctText)}</strong></div>
                  <div style="height:10px"></div>
                  <div class="q__prompt"></div>
                </details>
              `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `);

  // Inject full prompt HTML after render to keep the template concise.
  const detailEls = Array.from(appEl.querySelectorAll(".review-item"));
  for (let i = 0; i < items.length; i++) {
    const qid = items[i];
    const q = getQuestionById(exam, qid);
    const promptEl = detailEls[i]?.querySelector(".q__prompt");
    if (promptEl) promptEl.innerHTML = q.promptHtml;
  }
}

function htmlEscape(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cssEscape(s) {
  // Basic CSS.escape substitute for IDs like "A", "B", ...
  return String(s).replaceAll('"', '\\"');
}

function countQuestions(exams) {
  return exams.reduce((acc, e) => acc + (e.questions?.length || 0), 0);
}

async function loadDataset() {
  dataStatusEl.textContent = "Loading data…";
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    dataStatusEl.textContent = `Loaded ${data.exams?.length || 0} exams`;
    return data;
  } catch (err) {
    console.error(err);
    dataStatusEl.textContent = "Failed to load data";

    const help = `
      <div class="callout">
        <strong>Data load failed.</strong> Your browser likely blocked <code>fetch()</code> from a <code>file://</code> page.
        <div style="height:10px"></div>
        Run a local server: <span class="kbd">python3 -m http.server</span> then open
        <span class="kbd">http://localhost:8000</span>.
      </div>
    `;
    renderError("Cannot load dataset", "This app needs to fetch JSON.", help);
    return null;
  }
}

function route() {
  const { parts } = parseHash();
  const [root, id] = parts;

  if (!state.dataset) {
    render(`
      <section class="hero">
        <h1 tabindex="-1">Loading…</h1>
        <p class="muted">Fetching dataset from <code>${DATA_URL}</code></p>
      </section>
    `);
    return;
  }

  if (!root) return renderHome();

  if (root === "exam" && id) return renderExamSetup(decodeURIComponent(id));
  if (root === "take" && id) return renderTake(decodeURIComponent(id));
  if (root === "result" && id) return renderResult(decodeURIComponent(id));
  if (root === "review" && id) return renderReview(decodeURIComponent(id));

  return renderError("Not found", "That page does not exist.");
}

async function init() {
  syncResumeButton();
  state.dataset = await loadDataset();
  // If dataset failed to load, loadDataset() already rendered an error.
  if (!state.dataset) return;

  // Restore session (if any).
  const s = loadSession();
  if (s && s.examId && !s.submitted) state.session = s;
  syncResumeButton();

  window.addEventListener("hashchange", route);
  route();
}

init();
