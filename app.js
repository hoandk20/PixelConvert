const state = {
  pixelItems: [],
  sheetItems: [],
  sheetOutputUrl: "",
  sheetJsonUrl: "",
};

const elements = {
  tabButtons: [...document.querySelectorAll(".tab-button")],
  tabPanels: {
    pixel: document.querySelector("#pixelTab"),
    spritesheet: document.querySelector("#spritesheetTab"),
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
  cardTemplate: document.querySelector("#cardTemplate"),
  frameTemplate: document.querySelector("#frameTemplate"),
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFileBase(name) {
  const lastDot = name.lastIndexOf(".");
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  return base.replace(/[^\w-]+/g, "_");
}

function sanitizeName(name) {
  return `${sanitizeFileBase(name)}_pixel.png`;
}

function getSpritesheetJsonFilename(format) {
  if (format === "phaser-array") return "spritesheet.json";
  if (format === "phaser-hash") return "spritesheet-hash.json";
  return "spritesheet.json";
}

function revokeIfExists(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function updatePixelStatus(message) {
  elements.pixel.statusText.textContent = message;
}

function updateSheetStatus(message) {
  elements.sheet.statusText.textContent = message;
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

function updatePixelCounters() {
  const total = state.pixelItems.length;
  const converted = state.pixelItems.filter((item) => item.outputUrl).length;

  elements.pixel.fileCount.textContent =
    total === 0
      ? "No images added yet"
      : `${total} images added, ${converted} converted`;

  elements.pixel.emptyState.hidden = total > 0;
  elements.pixel.downloadAllBtn.disabled = converted === 0;
}

function updateSheetCounters() {
  const total = state.sheetItems.length;

  elements.sheet.count.textContent =
    total === 0 ? "No frames added yet" : `${total} frames added`;
  elements.sheet.framesEmpty.hidden = total > 0;
  elements.sheet.emptyState.hidden = Boolean(state.sheetOutputUrl);
  elements.sheet.previewWrap.hidden = !state.sheetOutputUrl;
  elements.sheet.downloadBtn.disabled = !state.sheetOutputUrl;
  elements.sheet.downloadJsonBtn.disabled = !state.sheetJsonUrl;
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
      file: frame.file,
      baseName: frame.baseName,
      frame: frame.frame,
      sourceSize: frame.sourceSize,
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
      filename: frame.name,
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
    frames[frame.name] = {
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

function bindSheetCard(item) {
  const fragment = elements.frameTemplate.content.cloneNode(true);
  const preview = fragment.querySelector(".frame-preview");
  const name = fragment.querySelector(".frame-name");
  const info = fragment.querySelector(".frame-info");

  preview.src = item.sourceUrl;
  preview.alt = item.file.name;
  name.textContent = item.file.name;
  info.textContent = `${item.image.width}x${item.image.height} • ${formatBytes(
    item.file.size,
  )}`;

  elements.sheet.framesGrid.append(fragment);
}

async function addPixelFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith("image/"));

  if (files.length === 0) {
    updatePixelStatus("No valid image files found.");
    return;
  }

  updatePixelStatus(`Loading ${files.length} image(s)...`);

  for (const file of files) {
    const duplicate = state.pixelItems.some(
      (item) => item.file.name === file.name && item.file.size === file.size,
    );

    if (duplicate) continue;

    try {
      const { image, objectUrl } = await loadImage(file);
      const item = {
        file,
        image,
        sourceUrl: objectUrl,
        outputUrl: "",
        previewCanvas: null,
        downloadBtn: null,
      };

      state.pixelItems.push(item);
      bindPixelCard(item);
    } catch (error) {
      updatePixelStatus(error.message);
    }
  }

  updatePixelCounters();
  updatePixelStatus("Images are ready. Click convert to create pixel art.");
}

async function addSheetFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith("image/"));

  if (files.length === 0) {
    updateSheetStatus("No valid image files found.");
    return;
  }

  updateSheetStatus(`Loading ${files.length} frame(s)...`);

  for (const file of files) {
    const duplicate = state.sheetItems.some(
      (item) => item.file.name === file.name && item.file.size === file.size,
    );

    if (duplicate) continue;

    try {
      const { image, objectUrl } = await loadImage(file);
      const item = { file, image, sourceUrl: objectUrl };
      state.sheetItems.push(item);
      bindSheetCard(item);
    } catch (error) {
      updateSheetStatus(error.message);
    }
  }

  revokeIfExists(state.sheetJsonUrl);
  state.sheetOutputUrl = "";
  state.sheetJsonUrl = "";
  updateSheetCounters();
  updateSheetStatus("Frames are ready. Click build spritesheet.");
}

function convertPixelItem(item) {
  const size = Number(elements.pixel.sizeSelect.value);
  const fit = elements.pixel.fitSelect.value;
  const backgroundMode = elements.pixel.backgroundMode.value;
  const backgroundColor = elements.pixel.backgroundColor.value;

  const outputCanvas = drawPixelImage(
    item.image,
    size,
    fit,
    backgroundMode,
    backgroundColor,
  );

  item.previewCanvas.width = size;
  item.previewCanvas.height = size;

  const previewCtx = item.previewCanvas.getContext("2d", { alpha: true });
  previewCtx.clearRect(0, 0, size, size);
  previewCtx.imageSmoothingEnabled = false;
  previewCtx.drawImage(outputCanvas, 0, 0);

  item.outputUrl = outputCanvas.toDataURL("image/png");
  item.downloadBtn.disabled = false;
}

function convertAllPixels() {
  if (state.pixelItems.length === 0) {
    updatePixelStatus("Add images before converting.");
    return;
  }

  updatePixelStatus(`Converting ${state.pixelItems.length} image(s)...`);

  for (const item of state.pixelItems) {
    convertPixelItem(item);
  }

  updatePixelCounters();
  updatePixelStatus(
    "Conversion complete. You can download each image or download all.",
  );
}

async function downloadAllPixels() {
  const convertedItems = state.pixelItems.filter((item) => item.outputUrl);

  if (convertedItems.length === 0) {
    updatePixelStatus("No converted images available yet.");
    return;
  }

  updatePixelStatus(`Downloading ${convertedItems.length} image(s)...`);

  for (const [index, item] of convertedItems.entries()) {
    triggerDownload(item.outputUrl, sanitizeName(item.file.name));
    await new Promise((resolve) => window.setTimeout(resolve, index === 0 ? 0 : 180));
  }

  updatePixelStatus("Batch download request sent.");
}

function clearPixelItems() {
  state.pixelItems.forEach((item) => URL.revokeObjectURL(item.sourceUrl));
  state.pixelItems = [];
  elements.pixel.resultsGrid.innerHTML = "";
  updatePixelCounters();
  updatePixelStatus("Image list cleared.");
}

function buildSpritesheet() {
  if (state.sheetItems.length === 0) {
    updateSheetStatus("Add frames before building a spritesheet.");
    return;
  }

  const columns = Math.max(1, Number(elements.sheet.columns.value) || 1);
  const cellSize = Math.max(1, Number(elements.sheet.cellSize.value) || 32);
  const padding = Math.max(0, Number(elements.sheet.padding.value) || 0);
  const jsonFormat = elements.sheet.jsonFormat.value;
  const fit = elements.sheet.fitSelect.value;
  const backgroundMode = elements.sheet.backgroundMode.value;
  const backgroundColor = elements.sheet.backgroundColor.value;
  const rows = Math.ceil(state.sheetItems.length / columns);
  const width = columns * cellSize + Math.max(0, columns - 1) * padding;
  const height = rows * cellSize + Math.max(0, rows - 1) * padding;
  const frameData = [];

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

  state.sheetItems.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * (cellSize + padding);
    const y = row * (cellSize + padding);

    ctx.save();
    ctx.translate(x, y);
    drawFittedImage(ctx, item.image, cellSize, fit);
    ctx.restore();

    frameData.push({
      index,
      name: item.file.name,
      file: item.file.name,
      baseName: sanitizeFileBase(item.file.name),
      frame: {
        x,
        y,
        w: cellSize,
        h: cellSize,
      },
      sourceSize: {
        w: item.image.width,
        h: item.image.height,
      },
      grid: {
        row,
        column,
      },
    });
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
    `Spritesheet ${width}x${height} built with ${state.sheetItems.length} frame(s). PNG and ${jsonFormat} JSON are ready.`,
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
  revokeIfExists(state.sheetJsonUrl);
  state.sheetItems = [];
  state.sheetOutputUrl = "";
  state.sheetJsonUrl = "";
  elements.sheet.framesGrid.innerHTML = "";
  updateSheetCounters();
  updateSheetStatus("Frame list cleared.");
}

function attachDropzone(dropzone, fileInput, onFiles) {
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", (event) => {
    onFiles(event.target.files);
    event.target.value = "";
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (event) => {
    onFiles(event.dataTransfer.files);
  });
}

elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

attachDropzone(elements.pixel.dropzone, elements.pixel.fileInput, addPixelFiles);
attachDropzone(elements.sheet.dropzone, elements.sheet.fileInput, addSheetFiles);

elements.pixel.convertBtn.addEventListener("click", convertAllPixels);
elements.pixel.downloadAllBtn.addEventListener("click", downloadAllPixels);
elements.pixel.clearBtn.addEventListener("click", clearPixelItems);

elements.sheet.buildBtn.addEventListener("click", buildSpritesheet);
elements.sheet.downloadBtn.addEventListener("click", downloadSpritesheet);
elements.sheet.downloadJsonBtn.addEventListener("click", downloadSpritesheetJson);
elements.sheet.clearBtn.addEventListener("click", clearSheetItems);

updatePixelCounters();
updateSheetCounters();
