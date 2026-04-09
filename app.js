const state = {
  pixelItems: [],
  sheetItems: [],
  resizeItems: [],
  sheetOutputUrl: "",
  sheetJsonUrl: "",
};

const elements = {
  tabButtons: [...document.querySelectorAll(".tab-button")],
  tabPanels: {
    pixel: document.querySelector("#pixelTab"),
    spritesheet: document.querySelector("#spritesheetTab"),
    resize: document.querySelector("#resizeTab"),
  },
  pixel: {
    dropzone: document.querySelector("#dropzone"),
    fileInput: document.querySelector("#fileInput"),
    sizeSelect: document.querySelector("#sizeSelect"),
    fitSelect: document.querySelector("#fitSelect"),
    backgroundMode: document.querySelector("#backgroundMode"),
    backgroundColor: document.querySelector("#backgroundColor"),
    convertBtn: document.querySelector("#convertBtn"),
    downloadAllBtn: document.querySelector("#downloadAllBtn"),
    clearBtn: document.querySelector("#clearBtn"),
    fileCount: document.querySelector("#fileCount"),
    statusText: document.querySelector("#statusText"),
    emptyState: document.querySelector("#emptyState"),
    resultsGrid: document.querySelector("#resultsGrid"),
  },
  sheet: {
    dropzone: document.querySelector("#sheetDropzone"),
    fileInput: document.querySelector("#sheetFileInput"),
    columns: document.querySelector("#sheetColumns"),
    cellSize: document.querySelector("#sheetCellSize"),
    sizingMode: document.querySelector("#sheetSizingMode"),
    padding: document.querySelector("#sheetPadding"),
    jsonFormat: document.querySelector("#sheetJsonFormat"),
    fitSelect: document.querySelector("#sheetFitSelect"),
    backgroundMode: document.querySelector("#sheetBackgroundMode"),
    backgroundColor: document.querySelector("#sheetBackgroundColor"),
    buildBtn: document.querySelector("#buildSheetBtn"),
    downloadBtn: document.querySelector("#downloadSheetBtn"),
    downloadJsonBtn: document.querySelector("#downloadSheetJsonBtn"),
    clearBtn: document.querySelector("#clearSheetBtn"),
    count: document.querySelector("#sheetCount"),
    statusText: document.querySelector("#sheetStatusText"),
    emptyState: document.querySelector("#sheetEmptyState"),
    previewWrap: document.querySelector("#sheetPreviewWrap"),
    previewCanvas: document.querySelector("#sheetPreviewCanvas"),
    framesGrid: document.querySelector("#sheetFramesGrid"),
    framesEmpty: document.querySelector("#sheetFramesEmpty"),
  },
  resize: {
    dropzone: document.querySelector("#resizeDropzone"),
    fileInput: document.querySelector("#resizeFileInput"),
    width: document.querySelector("#resizeWidth"),
    height: document.querySelector("#resizeHeight"),
    resizeBtn: document.querySelector("#resizeBtn"),
    downloadAllBtn: document.querySelector("#downloadResizeAllBtn"),
    clearBtn: document.querySelector("#clearResizeBtn"),
    count: document.querySelector("#resizeCount"),
    statusText: document.querySelector("#resizeStatusText"),
    emptyState: document.querySelector("#resizeEmptyState"),
    resultsGrid: document.querySelector("#resizeResultsGrid"),
  },
  cardTemplate: document.querySelector("#cardTemplate"),
  frameTemplate: document.querySelector("#frameTemplate"),
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function syncBackgroundFieldVisibility() {
  updateBackgroundColorVisibility(elements.pixel.backgroundMode, elements.pixel.backgroundColor);
  updateBackgroundColorVisibility(elements.sheet.backgroundMode, elements.sheet.backgroundColor);
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to read image ${file.name}`));
    };

    image.src = objectUrl;
  });
}

function drawFittedImage(ctx, image, size, fit) {
  if (fit === "stretch") {
    ctx.drawImage(image, 0, 0, size, size);
    return;
  }

  const sourceRatio = image.width / image.height;
  const targetRatio = 1;

  if (fit === "contain") {
    let drawWidth = size;
    let drawHeight = size;
    let offsetX = 0;
    let offsetY = 0;

    if (sourceRatio > targetRatio) {
      drawHeight = Math.round(size / sourceRatio);
      offsetY = Math.floor((size - drawHeight) / 2);
    } else {
      drawWidth = Math.round(size * sourceRatio);
      offsetX = Math.floor((size - drawWidth) / 2);
    }

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    return;
  }

  let srcX = 0;
  let srcY = 0;
  let srcWidth = image.width;
  let srcHeight = image.height;

  if (sourceRatio > targetRatio) {
    srcWidth = image.height * targetRatio;
    srcX = Math.floor((image.width - srcWidth) / 2);
  } else {
    srcHeight = image.width / targetRatio;
    srcY = Math.floor((image.height - srcHeight) / 2);
  }

  ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight, 0, 0, size, size);
}

function drawPixelImage(image, size, fit, backgroundMode, backgroundColor) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);

  if (backgroundMode === "solid") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  drawFittedImage(ctx, image, size, fit);
  return canvas;
}

function isPixelTabActive() {
  return elements.tabPanels.pixel?.classList.contains("is-active");
}

function isSpritesheetTabActive() {
  return elements.tabPanels.spritesheet?.classList.contains("is-active");
}

function isResizeTabActive() {
  return elements.tabPanels.resize?.classList.contains("is-active");
}

function isEditablePasteTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  );
}

function extractClipboardImageFiles(clipboardData) {
  if (!clipboardData) return [];

  const files = [];
  const timestamp = Date.now();

  for (const item of clipboardData.items ?? []) {
    if (!item.type.startsWith("image/")) continue;

    const file = item.getAsFile();
    if (!file) continue;

    const extension = (file.type.split("/")[1] || "png").replace(/[^\w-]+/g, "");
    const namedFile =
      file.name && file.name.trim()
        ? file
        : new File([file], `clipboard-image-${timestamp}.${extension}`, {
            type: file.type || "image/png",
          });

    files.push(namedFile);
  }

  return files;
}

function switchTab(tabName) {
  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(elements.tabPanels).forEach(([name, panel]) => {
    panel.classList.toggle("is-active", name === tabName);
  });
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

function buildCustomSpritesheetMetadata({
  width,
  height,
  columns,
  rows,
  cellSize,
  padding,
  fit,
  backgroundMode,
  backgroundColor,
  frameData,
}) {
  return {
    meta: {
      app: "Pixel Tools Studio",
      image: "spritesheet.png",
      format: "RGBA8888",
      size: { w: width, h: height },
      scale: 1,
      columns,
      rows,
      cellSize,
      padding,
      fitMode: fit,
      backgroundMode,
      backgroundColor: backgroundMode === "solid" ? backgroundColor : null,
      frameCount: frameData.length,
      jsonFormat: "custom",
    },
    frames: frameData.map((frame) => ({
      index: frame.index,
      name: frame.name,
      exportName: frame.exportName,
      file: frame.file,
      baseName: frame.baseName,
      frame: frame.frame,
      atlasFrame: frame.frame,
      inputSize: frame.inputSize,
      renderSize: frame.renderSize,
      grid: frame.grid,
    })),
  };
}

function buildPhaserArrayMetadata({
  width,
  height,
  backgroundColor,
  frameData,
}) {
  return {
    frames: frameData.map((frame) => ({
      filename: frame.exportName,
      frame: {
        x: frame.frame.x,
        y: frame.frame.y,
        w: frame.frame.w,
        h: frame.frame.h,
      },
      rotated: false,
      trimmed: false,
      spriteSourceSize: {
        x: 0,
        y: 0,
        w: frame.frame.w,
        h: frame.frame.h,
      },
      sourceSize: {
        w: frame.frame.w,
        h: frame.frame.h,
      },
      inputSize: frame.inputSize,
      renderSize: frame.renderSize,
      pivot: {
        x: 0.5,
        y: 0.5,
      },
    })),
    meta: {
      app: "Pixel Tools Studio",
      version: "1.0.0",
      image: "spritesheet.png",
      format: "RGBA8888",
      size: { w: width, h: height },
      scale: 1,
      smartupdate: backgroundColor ?? "",
    },
  };
}

function buildPhaserHashMetadata({
  width,
  height,
  backgroundColor,
  frameData,
}) {
  const frames = {};

  frameData.forEach((frame) => {
    frames[frame.exportName] = {
      frame: {
        x: frame.frame.x,
        y: frame.frame.y,
        w: frame.frame.w,
        h: frame.frame.h,
      },
      rotated: false,
      trimmed: false,
      spriteSourceSize: {
        x: 0,
        y: 0,
        w: frame.frame.w,
        h: frame.frame.h,
      },
      sourceSize: {
        w: frame.frame.w,
        h: frame.frame.h,
      },
      inputSize: frame.inputSize,
      renderSize: frame.renderSize,
      pivot: {
        x: 0.5,
        y: 0.5,
      },
    };
  });

  return {
    frames,
    meta: {
      app: "Pixel Tools Studio",
      version: "1.0.0",
      image: "spritesheet.png",
      format: "RGBA8888",
      size: { w: width, h: height },
      scale: 1,
      smartupdate: backgroundColor ?? "",
    },
  };
}

function buildSpritesheetMetadata(options) {
  const format = options.jsonFormat;

  if (format === "phaser-array") {
    return buildPhaserArrayMetadata(options);
  }

  if (format === "phaser-hash") {
    return buildPhaserHashMetadata(options);
  }

  return buildCustomSpritesheetMetadata(options);
}

function bindPixelCard(item) {
  const fragment = elements.cardTemplate.content.cloneNode(true);
  const sourcePreview = fragment.querySelector(".source-preview");
  const pixelPreview = fragment.querySelector(".pixel-preview");
  const fileName = fragment.querySelector(".file-name");
  const fileInfo = fragment.querySelector(".file-info");
  const downloadBtn = fragment.querySelector(".download-btn");

  sourcePreview.src = item.sourceUrl;
  sourcePreview.alt = item.file.name;
  fileName.textContent = item.file.name;
  fileInfo.textContent = `${formatBytes(item.file.size)} • ${
    item.file.type || "image"
  }`;

  item.previewCanvas = pixelPreview;
  item.downloadBtn = downloadBtn;

  downloadBtn.addEventListener("click", () => {
    if (!item.outputUrl) return;
    triggerDownload(item.outputUrl, sanitizeName(item.file.name));
  });

  elements.pixel.resultsGrid.append(fragment);
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

function clearPixelItems() {
  state.pixelItems.forEach((item) => URL.revokeObjectURL(item.sourceUrl));
  state.pixelItems = [];
  elements.pixel.resultsGrid.innerHTML = "";
  updatePixelCounters();
  updatePixelStatus("Image list cleared.");
}

function clearResizeItems() {
  state.resizeItems.forEach((item) => URL.revokeObjectURL(item.sourceUrl));
  state.resizeItems = [];
  elements.resize.resultsGrid.innerHTML = "";
  updateResizeCounters();
  updateResizeStatus("Image list cleared.");
}

function buildSpritesheet() {
  if (state.sheetItems.length === 0) {
    updateSheetStatus("Add frames before building a spritesheet.");
    return;
  }

  const columns = Math.max(1, Number(elements.sheet.columns.value) || 1);
  const cellSize = Math.max(1, Number(elements.sheet.cellSize.value) || 32);
  const sizingMode = elements.sheet.sizingMode.value;
  const padding = Math.max(0, Number(elements.sheet.padding.value) || 0);
  const jsonFormat = elements.sheet.jsonFormat.value;
  const fit = elements.sheet.fitSelect.value;
  const backgroundMode = elements.sheet.backgroundMode.value;
  const backgroundColor = elements.sheet.backgroundColor.value;
  const rows = Math.ceil(state.sheetItems.length / columns);
  const frameData = [];
  const usedFrameNames = new Set();

  const framesPerRow = [];
  for (let start = 0; start < state.sheetItems.length; start += columns) {
    framesPerRow.push(state.sheetItems.slice(start, start + columns));
  }

  const rowHeights = framesPerRow.map((rowItems) =>
    Math.max(
      ...rowItems.map((item) =>
        sizingMode === "original" ? item.image.height : cellSize,
      ),
    ),
  );

  const rowWidths = framesPerRow.map((rowItems) => {
    const contentWidth = rowItems.reduce(
      (total, item) =>
        total + (sizingMode === "original" ? item.image.width : cellSize),
      0,
    );
    return contentWidth + Math.max(0, rowItems.length - 1) * padding;
  });

  const width = rowWidths.length > 0 ? Math.max(...rowWidths) : 0;
  const height =
    rowHeights.reduce((total, rowHeight) => total + rowHeight, 0) +
    Math.max(0, rowHeights.length - 1) * padding;

  const canvas = elements.sheet.previewCanvas;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  if (backgroundMode === "solid") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  let yCursor = 0;

  framesPerRow.forEach((rowItems, row) => {
    let xCursor = 0;

    rowItems.forEach((item, column) => {
      const index = row * columns + column;
      const frameWidth = sizingMode === "original" ? item.image.width : cellSize;
      const frameHeight = sizingMode === "original" ? item.image.height : cellSize;
      const x = xCursor;
      const y = yCursor;

      if (sizingMode === "original") {
        ctx.drawImage(item.image, x, y, frameWidth, frameHeight);
      } else {
        ctx.save();
        ctx.translate(x, y);
        drawFittedImage(ctx, item.image, cellSize, fit);
        ctx.restore();
      }

      frameData.push({
        index,
        name: item.file.name,
        exportName: getUniqueFrameExportName(item.file.name, usedFrameNames),
        file: item.file.name,
        baseName: sanitizeFileBase(item.file.name),
        frame: {
          x,
          y,
          w: frameWidth,
          h: frameHeight,
        },
        inputSize: {
          w: item.image.width,
          h: item.image.height,
        },
        renderSize: {
          w: frameWidth,
          h: frameHeight,
        },
        grid: {
          row,
          column,
        },
      });

      xCursor += frameWidth + padding;
    });

    yCursor += rowHeights[row] + padding;
  });

  state.sheetOutputUrl = canvas.toDataURL("image/png");
  revokeIfExists(state.sheetJsonUrl);

  const metadata = buildSpritesheetMetadata({
    width,
    height,
    columns,
    rows,
    cellSize,
    padding,
    sizingMode,
    fit,
    backgroundMode,
    backgroundColor,
    frameData,
    jsonFormat,
  });

  state.sheetJsonUrl = URL.createObjectURL(
    new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    }),
  );
  updateSheetCounters();
  updateSheetStatus(
    `Spritesheet ${width}x${height} built with ${state.sheetItems.length} frame(s) using ${sizingMode} sizing. PNG and ${jsonFormat} JSON are ready.`,
  );
}

function downloadSpritesheet() {
  if (!state.sheetOutputUrl) {
    updateSheetStatus("No spritesheet available to download.");
    return;
  }

  triggerDownload(state.sheetOutputUrl, "spritesheet.png");
}

function downloadSpritesheetJson() {
  if (!state.sheetJsonUrl) {
    updateSheetStatus("No spritesheet JSON available to download.");
    return;
  }

  triggerDownload(
    state.sheetJsonUrl,
    getSpritesheetJsonFilename(elements.sheet.jsonFormat.value),
  );
}

function clearSheetItems() {
  state.sheetItems.forEach((item) => URL.revokeObjectURL(item.sourceUrl));
  state.sheetItems = [];
  clearSheetOutputs();
  elements.sheet.framesGrid.innerHTML = "";
  updateSheetCounters();
  updateSheetStatus("Frame list cleared.");
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
