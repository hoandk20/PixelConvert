const LEGACY_STORAGE_KEY = "pixel-map-editor-project";
const PROJECTS_STORAGE_KEY = "pixel-map-editor-projects";
const ACTIVE_PROJECT_STORAGE_KEY = "pixel-map-editor-active-project";
const UI_LANGUAGE_STORAGE_KEY = "pixel-map-editor-ui-language";
const DEFAULT_UI_LANGUAGE = "en";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.2;
const KEYBOARD_PAN_STEP = 48;
const DEFAULT_TILE_SIZE = 16;
const DEFAULT_MAP_COLUMNS = 32;
const DEFAULT_MAP_ROWS = 20;
const DEFAULT_MAP_BACKGROUND = "#141220";
const DEFAULT_GRID_COLOR = "#7f7895";
const DEFAULT_PROJECT_NAME = "Untitled project";
const PROJECT_DATA_VERSION = 6;
const UNDO_LIMIT = 50;
const DEFAULT_LAYOUT_NAME = "Layout";
const DEFAULT_PROJECT_TILESET_URL = "./zombie_woman.png";

const editorState = {
  tool: "brush",
  showGrid: true,
  isPointerDown: false,
  isPanning: false,
  spacePressed: false,
  hoveredCell: null,
  selectedTileIndex: -1,
  selectedTileIndices: [],
  selectedTilePaintCursor: 0,
  camera: {
    zoom: 1.25,
    offsetX: 24,
    offsetY: 24,
  },
  tileset: {
    name: "tileset",
    reference: "tileset.png",
    tileWidth: DEFAULT_TILE_SIZE,
    tileHeight: DEFAULT_TILE_SIZE,
    spacing: 0,
    margin: 0,
    columns: 0,
    rows: 0,
    count: 0,
    imageSrc: "",
    image: null,
    sources: [],
    tiles: [],
  },
  map: {
    columns: 32,
    rows: 20,
    tileWidth: DEFAULT_TILE_SIZE,
    tileHeight: DEFAULT_TILE_SIZE,
    backgroundColor: DEFAULT_MAP_BACKGROUND,
    gridColor: DEFAULT_GRID_COLOR,
    layers: [
      {
        id: "base",
        name: "Base",
        block: false,
        data: [],
      },
    ],
    activeLayer: 0,
  },
  render: {
    dirty: true,
    rafId: 0,
  },
  history: {
    undoStack: [],
    redoStack: [],
  },
  project: {
    id: "",
    name: DEFAULT_PROJECT_NAME,
    isOpen: false,
  },
};

const elements = {
  languageSelect: document.querySelector("#languageSelect"),
  undoBtn: document.querySelector("#undoBtn"),
  redoBtn: document.querySelector("#redoBtn"),
  brushToolBtn: document.querySelector("#brushToolBtn"),
  rectangleToolBtn: document.querySelector("#rectangleToolBtn"),
  eraseToolBtn: document.querySelector("#eraseToolBtn"),
  zoomOutBtn: document.querySelector("#zoomOutBtn"),
  zoomInBtn: document.querySelector("#zoomInBtn"),
  resetViewBtn: document.querySelector("#resetViewBtn"),
  toggleGridBtn: document.querySelector("#toggleGridBtn"),
  fullscreenBtn: document.querySelector("#fullscreenBtn"),
  appShell: document.querySelector(".map-editor-page"),
  openProjectsPopupBtn: document.querySelector("#openProjectsPopupBtn"),
  closeProjectsPopupBtn: document.querySelector("#closeProjectsPopupBtn"),
  projectsPopup: document.querySelector("#projectsPopup"),
  projectsPopupBackdrop: document.querySelector("#projectsPopupBackdrop"),
  openShortcutsPopupBtn: document.querySelector("#openShortcutsPopupBtn"),
  closeShortcutsPopupBtn: document.querySelector("#closeShortcutsPopupBtn"),
  shortcutsPopup: document.querySelector("#shortcutsPopup"),
  shortcutsPopupBackdrop: document.querySelector("#shortcutsPopupBackdrop"),
  openImportPopupBtn: document.querySelector("#openImportPopupBtn"),
  closeImportPopupBtn: document.querySelector("#closeImportPopupBtn"),
  importPopup: document.querySelector("#importPopup"),
  importPopupBackdrop: document.querySelector("#importPopupBackdrop"),
  openExportPopupBtn: document.querySelector("#openExportPopupBtn"),
  deleteLocalProjectBtn: document.querySelector("#deleteLocalProjectBtn"),
  closeExportPopupBtn: document.querySelector("#closeExportPopupBtn"),
  exportPopup: document.querySelector("#exportPopup"),
  exportPopupBackdrop: document.querySelector("#exportPopupBackdrop"),
  exportEditorJsonBtn: document.querySelector("#exportEditorJsonBtn"),
  exportGameJsonBtn: document.querySelector("#exportGameJsonBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  importJsonBtn: document.querySelector("#importJsonBtn"),
  importJsonInput: document.querySelector("#importJsonInput"),
  tilesheetInput: document.querySelector("#tilesheetInput"),
  tilesetNameInput: document.querySelector("#tilesetNameInput"),
  tileSpacingInput: document.querySelector("#tileSpacingInput"),
  tileMarginInput: document.querySelector("#tileMarginInput"),
  sliceTilesheetBtn: document.querySelector("#sliceTilesheetBtn"),
  clearTilesetBtn: document.querySelector("#clearTilesetBtn"),
  tilePalette: document.querySelector("#tilePalette"),
  paletteEmptyState: document.querySelector("#paletteEmptyState"),
  tilesetMetaText: document.querySelector("#tilesetMetaText"),
  layerList: document.querySelector("#layerList"),
  addLayerBtn: document.querySelector("#addLayerBtn"),
  mapColumnsInput: document.querySelector("#mapColumnsInput"),
  mapRowsInput: document.querySelector("#mapRowsInput"),
  engineFormatSelect: document.querySelector("#engineFormatSelect"),
  tilesetReferenceInput: document.querySelector("#tilesetReferenceInput"),
  mapBackgroundColorInput: document.querySelector("#mapBackgroundColorInput"),
  gridColorInput: document.querySelector("#gridColorInput"),
  applyMapSizeBtn: document.querySelector("#applyMapSizeBtn"),
  clearMapBtn: document.querySelector("#clearMapBtn"),
  resetSetupBtn: document.querySelector("#resetSetupBtn"),
  projectNameInput: document.querySelector("#projectNameInput"),
  createProjectBtn: document.querySelector("#createProjectBtn"),
  projectSelect: document.querySelector("#projectSelect"),
  loadProjectBtn: document.querySelector("#loadProjectBtn"),
  saveLocalBtn: document.querySelector("#saveLocalBtn"),
  mapMetaText: document.querySelector("#mapMetaText"),
  mapStatusText: document.querySelector("#mapStatusText"),
  selectedTileText: document.querySelector("#selectedTileText"),
  hoverTileText: document.querySelector("#hoverTileText"),
  mapViewport: document.querySelector("#mapViewport"),
  mapCanvas: document.querySelector("#mapCanvas"),
};

const offscreenCanvas = document.createElement("canvas");
const tilesetInteractionState = {
  isPointerDown: false,
  isDragging: false,
  isPanning: false,
  startX: 0,
  startY: 0,
  startClientX: 0,
  startClientY: 0,
  pointerId: null,
  startScrollLeft: 0,
  startScrollTop: 0,
  zoom: 1,
  gestureActive: false,
  gestureStartZoom: 1,
  gestureStartDistance: 0,
  gestureStartCenterX: 0,
  gestureStartCenterY: 0,
  gestureStartOffsetX: 0,
  gestureStartOffsetY: 0,
  gestureStartScrollLeft: 0,
  gestureStartScrollTop: 0,
  touchPointers: new Map(),
  viewport: null,
  stage: null,
  canvas: null,
  overlayCanvas: null,
};

const mapTouchGestureState = {
  active: false,
  startZoom: 1,
  startOffsetX: 0,
  startOffsetY: 0,
  startCenterX: 0,
  startCenterY: 0,
  startDistance: 0,
  pointers: new Map(),
  paintArmed: false,
  paintPointerId: null,
  paintStartClientX: 0,
  paintStartClientY: 0,
};

const mapRectangleState = {
  isDragging: false,
  startCell: null,
  currentCell: null,
  pointerId: null,
};

function createProjectId() {
  return `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getProjectName(value) {
  return value?.trim() || DEFAULT_PROJECT_NAME;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read default tileset image."));
    reader.readAsDataURL(blob);
  });
}

async function loadDefaultTilesetImageDataUrl() {
  const response = await fetch(DEFAULT_PROJECT_TILESET_URL);
  if (!response.ok) {
    throw new Error("Could not load the default tileset image.");
  }

  return blobToDataUrl(await response.blob());
}

function getSafeFileBaseName(value) {
  return getProjectName(value)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getExportProjectBaseName() {
  return getSafeFileBaseName(editorState.project.name || DEFAULT_PROJECT_NAME);
}

function getExportTilesetReference() {
  return `${getExportProjectBaseName()}.png`;
}

function getLayoutBaseName(value) {
  return value?.trim() || DEFAULT_LAYOUT_NAME;
}

const UI_TRANSLATIONS = {
  en: {
    pageTitle: "Pixel Tools | 2D Tile Map Editor",
    backLink: "Back to main tools",
    pageEyebrow: "Tile Map Editor",
    projects: "Projects",
    shortcuts: "Shortcuts",
    import: "Import",
    export: "Export",
    deleteLocal: "Delete local",
    tilesetSection: "Tileset",
    clearTileset: "Clear tileset",
    tilesetHint: "Click, Ctrl/Cmd-click, or drag on the tileset to select multiple tiles.",
    tilesetEmptyState: "Import a spritesheet to build the selectable tileset.",
    noSpritesheetLoaded: "No spritesheet loaded",
    layoutsSection: "Layouts",
    layoutOrderHint: "Lower layer draws first. Higher layer draws later.",
    blockLayerHint: "Use Block to mark a collision / solid layer.",
    showLayout: "Show",
    hideLayout: "Hide",
    renameLayout: "Rename layout",
    deleteLayout: "Delete layout",
    addLayout: "Add layout",
    canvasSection: "Canvas",
    toolsSection: "Tools",
    controlsSection: "Controls",
    undo: "Undo",
    redo: "Redo",
    brush: "Brush",
    rectangle: "Rectangle",
    erase: "Erase",
    zoomOut: "Zoom -",
    zoomIn: "Zoom +",
    resetView: "Reset View",
    gridOn: "Grid On",
    gridOff: "Grid Off",
    fullscreenEnter: "Fullscreen",
    fullscreenExit: "Exit Fullscreen",
    mapInstruction:
      "Drag to paint. Right click the map to pick a tile. Hold space and drag to pan. Shortcuts: B brush, R rectangle, E erase, G grid.",
    mapSetupSection: "Map Setup",
    mapMeta: (columns, rows, tileWidth, tileHeight) => `${columns} x ${rows} tiles • ${tileWidth}x${tileHeight}px`,
    selectedTileNone: "Selected tile: none",
    selectedTileOne: (index) => `Selected tile: #${index}`,
    selectedTiles: (preview, extra) => `Selected tiles: ${preview}${extra}`,
    hoverNone: "Hover: -, -",
    hover: (column, row) => `Hover: ${column}, ${row}`,
    columns: "Columns",
    rows: "Rows",
    background: "Background",
    gridColor: "Grid color",
    applyMapSize: "Apply map size",
    resetSetup: "Reset setup",
    clearMap: "Clear map",
    saveLocal: "Save local",
    projectsPopupEyebrow: "Projects",
    projectsPopupTitle: "Choose a project",
    close: "Close",
    createProjectTitle: "Create Project",
    createProjectDescription: "Start a new tilemap project and save it in this browser.",
    projectName: "Project name",
    projectNamePlaceholder: "Project name",
    createProject: "Create project",
    openSavedProjectTitle: "Open Saved Project",
    openSavedProjectDescription: "Select one of the projects already stored in this browser.",
    savedProjects: "Saved projects",
    openProject: "Open project",
    shortcutsPopupEyebrow: "Help",
    shortcutsPopupTitle: "Keyboard shortcuts",
    shortcutsToolsTitle: "Tools",
    shortcutsZoomTitle: "Zoom",
    shortcutsNavigationTitle: "Navigation",
    shortcutsToolsHtml:
      "<p><strong>B</strong> switch to Brush</p><p><strong>R</strong> switch to Rectangle</p><p><strong>E</strong> switch to Erase</p><p><strong>G</strong> toggle Grid</p><p><strong>Ctrl/Cmd + Z</strong> undo</p><p><strong>Ctrl/Cmd + Shift + Z</strong> redo</p><p><strong>Ctrl + Y</strong> redo on Windows</p>",
    shortcutsZoomHtml:
      "<p><strong>Q</strong> zoom out on the map</p><p><strong>W</strong> zoom in on the map</p><p><strong>0</strong> reset the view</p>",
    shortcutsNavigationHtml:
      "<p><strong>Arrow Left</strong> move camera left</p><p><strong>Arrow Right</strong> move camera right</p><p><strong>Arrow Up</strong> move camera up</p><p><strong>Arrow Down</strong> move camera down</p><p><strong>Space + Drag</strong> pan with the mouse</p>",
    importPopupEyebrow: "Import",
    importPopupTitle: "Load tiles or project data",
    importSpritesheetTitle: "Import Spritesheet",
    importSpritesheetDescription:
      "Load one or more PNG spritesheets and rebuild the tileset palette for this map.",
    importSpritesheetHint: "Hold Cmd/Ctrl to select multiple files at once.",
    spritesheetPng: "Spritesheet PNG",
    tilesetName: "Tileset name",
    spacing: "Spacing",
    margin: "Margin",
    loadTilesets: "Load tilesets",
    importProjectJsonTitle: "Import Project JSON",
    importProjectJsonDescription:
      "Import a previously saved editor project and redraw the tilemap.",
    importProjectJsonButton: "Import Project JSON",
    exportPopupEyebrow: "Export",
    exportPopupTitle: "Download your tilemap",
    saveProjectJsonTitle: "Save Project JSON",
    saveProjectJsonDescription:
      "Keeps editor data so you can import the project back into this tool later.",
    saveProjectJsonButton: "Save Project JSON",
    engineBundleTitle: "Export Engine Bundle",
    engineBundleDescription:
      "Exports a tilemap JSON and bundles it with the spritesheet PNG.",
    engineFormat: "Engine format",
    phaserStandard: "Phaser standard",
    tiledJson: "Tiled JSON",
    unityJson: "Unity JSON",
    exportEngineZip: "Export Engine ZIP",
    csvBundleTitle: "Export CSV Bundle",
    csvBundleDescription:
      "Downloads the active layer CSV bundled with the spritesheet PNG.",
    exportCsvZip: "Export CSV ZIP",
    tilesetMetaOneSheet: (count, cols) => `${count} tiles • ${cols} cols`,
    tilesetMetaMultiSheet: (count, sheets) => `${count} tiles • ${sheets} sheets`,
  },
  vi: {
    pageTitle: "Pixel Tools | Trình chỉnh sửa bản đồ 2D",
    backLink: "Quay lại công cụ chính",
    pageEyebrow: "Trình chỉnh sửa bản đồ",
    projects: "Dự án",
    shortcuts: "Phím tắt",
    import: "Nhập",
    export: "Xuất",
    deleteLocal: "Xóa local",
    tilesetSection: "Tileset",
    clearTileset: "Xóa tileset",
    tilesetHint: "Nhấn, Ctrl/Cmd-click hoặc kéo trên tileset để chọn nhiều tile.",
    tilesetEmptyState: "Nhập spritesheet để tạo tileset có thể chọn.",
    noSpritesheetLoaded: "Chưa có spritesheet",
    layoutsSection: "Layout",
    layoutOrderHint: "Layer ở dưới được vẽ trước. Layer ở trên được vẽ sau.",
    blockLayerHint: "Bật Block để đánh dấu layer va chạm / solid.",
    showLayout: "Hiện",
    hideLayout: "Ẩn",
    renameLayout: "Đổi tên layout",
    deleteLayout: "Xóa layout",
    addLayout: "Thêm layout",
    canvasSection: "Canvas",
    toolsSection: "Công cụ",
    controlsSection: "Điều khiển",
    undo: "Hoàn tác",
    redo: "Làm lại",
    brush: "Cọ vẽ",
    rectangle: "Hình chữ nhật",
    erase: "Xóa",
    zoomOut: "Thu phóng -",
    zoomIn: "Thu phóng +",
    resetView: "Đặt lại khung nhìn",
    gridOn: "Lưới bật",
    gridOff: "Lưới tắt",
    fullscreenEnter: "Toàn màn hình",
    fullscreenExit: "Thoát toàn màn hình",
    mapInstruction:
      "Kéo để vẽ. Nhấp chuột phải lên bản đồ để lấy tile. Giữ phím cách và kéo để di chuyển. Phím tắt: B cọ vẽ, R hình chữ nhật, E xóa, G lưới.",
    mapSetupSection: "Thiết lập bản đồ",
    mapMeta: (columns, rows, tileWidth, tileHeight) => `${columns} x ${rows} ô • ${tileWidth}x${tileHeight}px`,
    selectedTileNone: "Tile đã chọn: không có",
    selectedTileOne: (index) => `Tile đã chọn: #${index}`,
    selectedTiles: (preview, extra) => `Các tile đã chọn: ${preview}${extra}`,
    hoverNone: "Di chuột: -, -",
    hover: (column, row) => `Di chuột: ${column}, ${row}`,
    columns: "Cột",
    rows: "Hàng",
    background: "Nền",
    gridColor: "Màu lưới",
    applyMapSize: "Áp dụng kích thước",
    resetSetup: "Đặt lại thiết lập",
    clearMap: "Xóa bản đồ",
    saveLocal: "Lưu local",
    projectsPopupEyebrow: "Dự án",
    projectsPopupTitle: "Chọn dự án",
    close: "Đóng",
    createProjectTitle: "Tạo dự án",
    createProjectDescription: "Bắt đầu một dự án bản đồ mới và lưu trong trình duyệt này.",
    projectName: "Tên dự án",
    projectNamePlaceholder: "Tên dự án",
    createProject: "Tạo dự án",
    openSavedProjectTitle: "Mở dự án đã lưu",
    openSavedProjectDescription: "Chọn một dự án đã được lưu trong trình duyệt này.",
    savedProjects: "Dự án đã lưu",
    openProject: "Mở dự án",
    shortcutsPopupEyebrow: "Trợ giúp",
    shortcutsPopupTitle: "Phím tắt",
    shortcutsToolsTitle: "Công cụ",
    shortcutsZoomTitle: "Thu phóng",
    shortcutsNavigationTitle: "Điều hướng",
    shortcutsToolsHtml:
      "<p><strong>B</strong> chuyển sang Cọ vẽ</p><p><strong>R</strong> chuyển sang Hình chữ nhật</p><p><strong>E</strong> chuyển sang Xóa</p><p><strong>G</strong> bật/tắt Lưới</p><p><strong>Ctrl/Cmd + Z</strong> hoàn tác</p><p><strong>Ctrl/Cmd + Shift + Z</strong> làm lại</p><p><strong>Ctrl + Y</strong> làm lại trên Windows</p>",
    shortcutsZoomHtml:
      "<p><strong>Q</strong> thu nhỏ trên bản đồ</p><p><strong>W</strong> phóng to trên bản đồ</p><p><strong>0</strong> đặt lại khung nhìn</p>",
    shortcutsNavigationHtml:
      "<p><strong>Mũi tên trái</strong> di chuyển camera sang trái</p><p><strong>Mũi tên phải</strong> di chuyển camera sang phải</p><p><strong>Mũi tên lên</strong> di chuyển camera lên</p><p><strong>Mũi tên xuống</strong> di chuyển camera xuống</p><p><strong>Phím cách + kéo</strong> di chuyển bằng chuột</p>",
    importPopupEyebrow: "Nhập",
    importPopupTitle: "Tải tiles hoặc dữ liệu dự án",
    importSpritesheetTitle: "Nhập Spritesheet",
    importSpritesheetDescription:
      "Tải một hoặc nhiều PNG spritesheet và tạo lại tileset cho bản đồ này.",
    importSpritesheetHint: "Giữ Cmd/Ctrl để chọn nhiều file cùng lúc.",
    spritesheetPng: "PNG spritesheet",
    tilesetName: "Tên tileset",
    spacing: "Khoảng cách",
    margin: "Lề",
    loadTilesets: "Tải tileset",
    importProjectJsonTitle: "Nhập JSON dự án",
    importProjectJsonDescription:
      "Nhập dự án editor đã lưu trước đó và vẽ lại tilemap.",
    importProjectJsonButton: "Nhập JSON dự án",
    exportPopupEyebrow: "Xuất",
    exportPopupTitle: "Tải tilemap của bạn",
    saveProjectJsonTitle: "Lưu JSON dự án",
    saveProjectJsonDescription:
      "Giữ lại dữ liệu editor để bạn có thể nhập lại dự án sau này.",
    saveProjectJsonButton: "Lưu JSON dự án",
    engineBundleTitle: "Xuất gói engine",
    engineBundleDescription:
      "Xuất JSON tilemap và gộp kèm PNG spritesheet.",
    engineFormat: "Định dạng engine",
    phaserStandard: "Phaser standard",
    tiledJson: "Tiled JSON",
    unityJson: "Unity JSON",
    exportEngineZip: "Xuất ZIP engine",
    csvBundleTitle: "Xuất gói CSV",
    csvBundleDescription:
      "Tải CSV của layer đang hoạt động kèm theo PNG spritesheet.",
    exportCsvZip: "Xuất ZIP CSV",
    tilesetMetaOneSheet: (count, cols) => `${count} tile • ${cols} cột`,
    tilesetMetaMultiSheet: (count, sheets) => `${count} tile • ${sheets} sheet`,
  },
};

function getUiLanguage() {
  return window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY) || DEFAULT_UI_LANGUAGE;
}

function setUiText(selector, value, index = 0) {
  const nodes = document.querySelectorAll(selector);
  const node = nodes[index];
  if (node && typeof value === "string") {
    node.textContent = value;
  }
}

function applyLanguage(language = DEFAULT_UI_LANGUAGE) {
  const key = UI_TRANSLATIONS[language] ? language : DEFAULT_UI_LANGUAGE;
  const copy = UI_TRANSLATIONS[key];

  document.documentElement.lang = key === "vi" ? "vi" : "en";
  document.body.dataset.uiLanguage = key;
  document.title = copy.pageTitle;
  elements.languageSelect.value = key;

  setUiText(".hero .text-link", copy.backLink);
  setUiText(".hero .eyebrow", copy.pageEyebrow);
  elements.openProjectsPopupBtn.textContent = copy.projects;
  elements.openShortcutsPopupBtn.textContent = copy.shortcuts;
  elements.openImportPopupBtn.textContent = copy.import;
  elements.openExportPopupBtn.textContent = copy.export;
  elements.deleteLocalProjectBtn.textContent = copy.deleteLocal;

  setUiText(".map-sidebar .panel .eyebrow", copy.tilesetSection, 0);
  elements.clearTilesetBtn.textContent = copy.clearTileset;
  setUiText(".tileset-hint", copy.tilesetHint);
  setUiText("#paletteEmptyState", copy.tilesetEmptyState);

  setUiText(".map-layers-panel .section-heading .eyebrow", copy.layoutsSection);
  const layoutHints = document.querySelectorAll(".map-layers-panel .layer-help");
  if (layoutHints[0]) layoutHints[0].setAttribute("data-tooltip", copy.layoutOrderHint);
  if (layoutHints[1]) layoutHints[1].setAttribute("data-tooltip", copy.blockLayerHint);
  elements.addLayerBtn.textContent = copy.addLayout;

  setUiText(".map-main-column .results .eyebrow", copy.canvasSection);
  setUiText(".tool-fab-menu .eyebrow", copy.toolsSection);
  setUiText("#undoBtn", copy.undo);
  setUiText("#redoBtn", copy.redo);
  setUiText("#brushToolBtn", copy.brush);
  setUiText("#rectangleToolBtn", copy.rectangle);
  setUiText("#eraseToolBtn", copy.erase);

  setUiText(".control-fab-menu .eyebrow", copy.controlsSection);
  setUiText("#zoomOutBtn", copy.zoomOut);
  setUiText("#zoomInBtn", copy.zoomIn);
  setUiText("#resetViewBtn", copy.resetView);
  setUiText("#toggleGridBtn", copy.gridOn);
  setUiText("#fullscreenBtn", copy.fullscreenEnter);

  setUiText(".map-instruction", copy.mapInstruction);
  setUiText(".map-setup-panel .eyebrow", copy.mapSetupSection);
  const mapFieldLabels = document.querySelectorAll(".map-bottom-dock-fields .field > span");
  if (mapFieldLabels[0]) mapFieldLabels[0].textContent = copy.columns;
  if (mapFieldLabels[1]) mapFieldLabels[1].textContent = copy.rows;
  if (mapFieldLabels[2]) mapFieldLabels[2].textContent = copy.background;
  if (mapFieldLabels[3]) mapFieldLabels[3].textContent = copy.gridColor;
  setUiText("#applyMapSizeBtn", copy.applyMapSize);
  setUiText("#resetSetupBtn", copy.resetSetup);
  setUiText("#clearMapBtn", copy.clearMap);
  setUiText("#saveLocalBtn", copy.saveLocal);

  setUiText("#projectsPopup .eyebrow", copy.projectsPopupEyebrow);
  setUiText("#projectsPopupTitle", copy.projectsPopupTitle);
  elements.closeProjectsPopupBtn.textContent = copy.close;
  const projectArticles = document.querySelectorAll("#projectsPopup .export-option");
  if (projectArticles[0]) {
    projectArticles[0].querySelector("h3").textContent = copy.createProjectTitle;
    projectArticles[0].querySelector("p").textContent = copy.createProjectDescription;
    projectArticles[0].querySelector(".field span").textContent = copy.projectName;
    projectArticles[0].querySelector("input").placeholder = copy.projectNamePlaceholder;
    projectArticles[0].querySelector("button").textContent = copy.createProject;
  }
  if (projectArticles[1]) {
    projectArticles[1].querySelector("h3").textContent = copy.openSavedProjectTitle;
    projectArticles[1].querySelector("p").textContent = copy.openSavedProjectDescription;
    projectArticles[1].querySelector(".field span").textContent = copy.savedProjects;
    projectArticles[1].querySelector("select").setAttribute("aria-label", copy.savedProjects);
    projectArticles[1].querySelector("button").textContent = copy.openProject;
  }

  setUiText("#shortcutsPopup .eyebrow", copy.shortcutsPopupEyebrow);
  setUiText("#shortcutsPopupTitle", copy.shortcutsPopupTitle);
  elements.closeShortcutsPopupBtn.textContent = copy.close;
  const shortcutArticles = document.querySelectorAll("#shortcutsPopup .export-option");
  if (shortcutArticles[0]) {
    shortcutArticles[0].querySelector("h3").textContent = copy.shortcutsToolsTitle;
    shortcutArticles[0].innerHTML =
      `<h3>${copy.shortcutsToolsTitle}</h3>${copy.shortcutsToolsHtml}`;
  }
  if (shortcutArticles[1]) {
    shortcutArticles[1].querySelector("h3").textContent = copy.shortcutsZoomTitle;
    shortcutArticles[1].innerHTML =
      `<h3>${copy.shortcutsZoomTitle}</h3>${copy.shortcutsZoomHtml}`;
  }
  if (shortcutArticles[2]) {
    shortcutArticles[2].querySelector("h3").textContent = copy.shortcutsNavigationTitle;
    shortcutArticles[2].innerHTML =
      `<h3>${copy.shortcutsNavigationTitle}</h3>${copy.shortcutsNavigationHtml}`;
  }

  setUiText("#importPopup .eyebrow", copy.importPopupEyebrow);
  setUiText("#importPopupTitle", copy.importPopupTitle);
  elements.closeImportPopupBtn.textContent = copy.close;
  const importArticles = document.querySelectorAll("#importPopup .export-option");
  if (importArticles[0]) {
    importArticles[0].querySelector("h3").textContent = copy.importSpritesheetTitle;
    importArticles[0].querySelector("p").textContent = copy.importSpritesheetDescription;
    importArticles[0].querySelector(".tileset-hint").textContent = copy.importSpritesheetHint;
    const importLabels = importArticles[0].querySelectorAll(".field span");
    if (importLabels[0]) importLabels[0].textContent = copy.spritesheetPng;
    if (importLabels[1]) importLabels[1].textContent = copy.tilesetName;
    if (importLabels[2]) importLabels[2].textContent = copy.spacing;
    if (importLabels[3]) importLabels[3].textContent = copy.margin;
    importArticles[0].querySelector("#sliceTilesheetBtn").textContent = copy.loadTilesets;
  }
  if (importArticles[1]) {
    importArticles[1].querySelector("h3").textContent = copy.importProjectJsonTitle;
    importArticles[1].querySelector("p").textContent = copy.importProjectJsonDescription;
    importArticles[1].querySelector("button").textContent = copy.importProjectJsonButton;
  }

  setUiText("#exportPopup .eyebrow", copy.exportPopupEyebrow);
  setUiText("#exportPopupTitle", copy.exportPopupTitle);
  elements.closeExportPopupBtn.textContent = copy.close;
  const exportArticles = document.querySelectorAll("#exportPopup .export-option");
  if (exportArticles[0]) {
    exportArticles[0].querySelector("h3").textContent = copy.saveProjectJsonTitle;
    exportArticles[0].querySelector("p").textContent = copy.saveProjectJsonDescription;
    exportArticles[0].querySelector("button").textContent = copy.saveProjectJsonButton;
  }
  if (exportArticles[1]) {
    exportArticles[1].querySelector("h3").textContent = copy.engineBundleTitle;
    exportArticles[1].querySelector("p").textContent = copy.engineBundleDescription;
    exportArticles[1].querySelector(".field span").textContent = copy.engineFormat;
    const options = exportArticles[1].querySelectorAll("option");
    if (options[0]) options[0].textContent = copy.phaserStandard;
    if (options[1]) options[1].textContent = copy.tiledJson;
    if (options[2]) options[2].textContent = copy.unityJson;
    exportArticles[1].querySelector("#exportGameJsonBtn").textContent = copy.exportEngineZip;
  }
  if (exportArticles[2]) {
    exportArticles[2].querySelector("h3").textContent = copy.csvBundleTitle;
    exportArticles[2].querySelector("p").textContent = copy.csvBundleDescription;
    exportArticles[2].querySelector("#exportCsvBtn").textContent = copy.exportCsvZip;
  }

  const tilesetMetaText = elements.tilesetMetaText;
  if (tilesetMetaText && editorState.tileset.count > 0) {
    tilesetMetaText.textContent =
      editorState.tileset.sources.length > 1
        ? copy.tilesetMetaMultiSheet(editorState.tileset.count, editorState.tileset.sources.length)
        : copy.tilesetMetaOneSheet(editorState.tileset.count, editorState.tileset.columns);
  } else if (tilesetMetaText) {
    tilesetMetaText.textContent = copy.noSpritesheetLoaded;
  }

  syncToolbarState();
}

function setUiLanguage(language, { persist = true } = {}) {
  const key = UI_TRANSLATIONS[language] ? language : DEFAULT_UI_LANGUAGE;
  if (persist) {
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, key);
  }
  applyLanguage(key);
}

function getUiCopy() {
  return UI_TRANSLATIONS[getUiLanguage()] || UI_TRANSLATIONS[DEFAULT_UI_LANGUAGE];
}

function getUniqueLayoutName(desiredName, excludeIndex = -1) {
  const baseName = getLayoutBaseName(desiredName);
  const usedNames = new Set(
    editorState.map.layers
      .filter((_, index) => index !== excludeIndex)
      .map((layer) => layer.name.trim().toLowerCase()),
  );

  if (!usedNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;
  while (usedNames.has(`${baseName} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${baseName} ${suffix}`;
}

function normalizeLayerNames() {
  const usedNames = new Set();

  editorState.map.layers.forEach((layer, index) => {
    const baseName = getLayoutBaseName(layer.name);
    let nextName = baseName;
    let suffix = 2;

    while (usedNames.has(nextName.toLowerCase())) {
      nextName = `${baseName} ${suffix}`;
      suffix += 1;
    }

    layer.name = nextName;
    usedNames.add(nextName.toLowerCase());
  });
}

function createDefaultProjectData(name = DEFAULT_PROJECT_NAME, id = createProjectId()) {
  return {
    version: PROJECT_DATA_VERSION,
    editor: "Pixel Tools Studio",
    project: {
      id,
      name: getProjectName(name),
    },
    tileset: {
      name: "tileset",
      reference: "tileset.png",
      imageSrc: "",
      tileWidth: DEFAULT_TILE_SIZE,
      tileHeight: DEFAULT_TILE_SIZE,
      spacing: 0,
      margin: 0,
      columns: 0,
      rows: 0,
      count: 0,
      sources: [],
    },
    map: {
      columns: 32,
      rows: 20,
      tileWidth: DEFAULT_TILE_SIZE,
      tileHeight: DEFAULT_TILE_SIZE,
      backgroundColor: DEFAULT_MAP_BACKGROUND,
      gridColor: DEFAULT_GRID_COLOR,
      layers: [
        {
          id: "base",
          name: "Base",
          block: false,
          data: createLayerData(32, 20),
        },
      ],
    },
    selectedTileIndex: -1,
    selectedTileIndices: [],
    showGrid: true,
  };
}

async function createProjectDataWithDefaultTileset(name = DEFAULT_PROJECT_NAME, id = createProjectId()) {
  const imageSrc = await loadDefaultTilesetImageDataUrl();
  const image = await createImage(imageSrc);
  const source = createTilesetSource(image, {}, 0);

  return {
    version: PROJECT_DATA_VERSION,
    editor: "Pixel Tools Studio",
    project: {
      id,
      name: getProjectName(name),
    },
    tileset: {
      name: "zombie_woman",
      reference: "zombie_woman.png",
      imageSrc,
      tileWidth: source.tileWidth,
      tileHeight: source.tileHeight,
      spacing: source.spacing,
      margin: source.margin,
      columns: source.columns,
      rows: source.rows,
      count: source.count,
      sources: [
        {
          id: "sheet_1",
          offsetY: 0,
          width: image.width,
          height: image.height,
          spacing: source.spacing,
          margin: source.margin,
          columns: source.columns,
          rows: source.rows,
          count: source.count,
        },
      ],
    },
    map: {
      columns: 32,
      rows: 20,
      tileWidth: DEFAULT_TILE_SIZE,
      tileHeight: DEFAULT_TILE_SIZE,
      backgroundColor: DEFAULT_MAP_BACKGROUND,
      gridColor: DEFAULT_GRID_COLOR,
      layers: [
        {
          id: "base",
          name: "Base",
          block: false,
          data: createLayerData(32, 20),
        },
      ],
    },
    selectedTileIndex: source.count > 0 ? 0 : -1,
    selectedTileIndices: source.count > 0 ? [0] : [],
    showGrid: true,
  };
}

function getStoredProjects() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PROJECTS_STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function setStoredProjects(projects) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function refreshProjectSelect() {
  const projects = getStoredProjects();
  elements.projectSelect.innerHTML = "";

  if (projects.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved projects yet";
    elements.projectSelect.append(option);
    elements.loadProjectBtn.disabled = true;
    return;
  }

  elements.loadProjectBtn.disabled = false;

  for (const project of projects) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    option.selected = project.id === editorState.project.id;
    elements.projectSelect.append(option);
  }
}

function setActiveProjectMeta({ id, name }) {
  editorState.project.id = id;
  editorState.project.name = getProjectName(name);
  editorState.project.isOpen = true;
  elements.projectNameInput.value = editorState.project.name;
  window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, editorState.project.id);
  refreshProjectSelect();
}

function syncProjectControls() {
  elements.projectNameInput.value = DEFAULT_PROJECT_NAME;
  refreshProjectSelect();
}

function clampActiveLayerIndex() {
  if (editorState.map.layers.length === 0) {
    editorState.map.activeLayer = 0;
    return;
  }

  editorState.map.activeLayer = Math.max(
    0,
    Math.min(editorState.map.activeLayer, editorState.map.layers.length - 1),
  );
}

function setActiveLayer(index) {
  if (index < 0 || index >= editorState.map.layers.length) {
    return;
  }

  editorState.map.activeLayer = index;
  renderLayerList();
  persistProject();
  markDirty();
}

function addLayout() {
  pushUndoState();
  const nextIndex = editorState.map.layers.length + 1;
  const nextName = getUniqueLayoutName(`${DEFAULT_LAYOUT_NAME} ${nextIndex}`);
  editorState.map.layers.push(
    createLayer(
      nextName,
      editorState.map.columns,
      editorState.map.rows,
    ),
  );
  editorState.map.activeLayer = editorState.map.layers.length - 1;
  renderLayerList();
  persistProject();
  updateStatus(`Created ${editorState.map.layers[editorState.map.activeLayer].name}.`);
  markDirty();
}

function deleteLayout(index) {
  if (editorState.map.layers.length <= 1) {
    updateStatus("Keep at least one layout.");
    return;
  }

  const layer = editorState.map.layers[index];
  if (!layer) {
    return;
  }

  const confirmed = window.confirm(`Delete layout "${layer.name}"? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  pushUndoState();
  const activeLayerId = editorState.map.layers[editorState.map.activeLayer]?.id;
  editorState.map.layers.splice(index, 1);

  if (editorState.map.activeLayer >= editorState.map.layers.length) {
    editorState.map.activeLayer = editorState.map.layers.length - 1;
  }

  if (editorState.map.layers[editorState.map.activeLayer]?.id === activeLayerId) {
    clampActiveLayerIndex();
  } else {
    editorState.map.activeLayer = editorState.map.layers.findIndex(
      (entry) => entry.id === activeLayerId,
    );
    clampActiveLayerIndex();
  }

  rebuildMapSurface();
  renderLayerList();
  persistProject();
  updateStatus(`Deleted layout "${layer.name}".`);
  markDirty();
}

function renameLayout(index) {
  const layer = editorState.map.layers[index];
  if (!layer) {
    return;
  }

  const nextName = window.prompt("Rename layout", layer.name);
  if (nextName === null) {
    return;
  }

  const trimmedName = nextName.trim();
  if (!trimmedName) {
    updateStatus("Layout name cannot be empty.");
    return;
  }

  pushUndoState();
  layer.name = getUniqueLayoutName(trimmedName, index);
  renderLayerList();
  persistProject();
  updateStatus(`Renamed layout to "${layer.name}".`);
  markDirty();
}

function reorderLayout(fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= editorState.map.layers.length ||
    toIndex >= editorState.map.layers.length
  ) {
    return;
  }

  pushUndoState();
  const activeLayerId = editorState.map.layers[editorState.map.activeLayer]?.id;
  const [moved] = editorState.map.layers.splice(fromIndex, 1);
  editorState.map.layers.splice(toIndex, 0, moved);
  editorState.map.activeLayer = editorState.map.layers.findIndex(
    (layer) => layer.id === activeLayerId,
  );
  clampActiveLayerIndex();
  rebuildMapSurface();
  renderLayerList();
  persistProject();
  updateStatus("Layout order updated.");
  markDirty();
}

function renderLayerList() {
  const copy = getUiCopy();
  elements.layerList.innerHTML = "";

  editorState.map.layers.forEach((layer, index) => {
    const item = document.createElement("div");
    item.className = "layer-item";
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.draggable = true;
    item.classList.toggle("is-active", index === editorState.map.activeLayer);
    item.classList.toggle("is-blocked", Boolean(layer.block));
    item.dataset.layerIndex = String(index);

    const order = document.createElement("span");
    order.className = "layer-order";
    order.textContent = `${index + 1}`;

    const label = document.createElement("span");
    label.className = "layer-name";
    label.textContent = layer.name;

    const block = document.createElement("div");
    block.className = "layer-block";

    const blockCheckbox = document.createElement("input");
    blockCheckbox.type = "checkbox";
    blockCheckbox.className = "layer-block-checkbox";
    blockCheckbox.checked = Boolean(layer.block);
    blockCheckbox.setAttribute("aria-label", `${copy.blockLayerHint}: ${layer.name}`);
    blockCheckbox.title = copy.blockLayerHint;

    const visibility = document.createElement("button");
    visibility.type = "button";
    visibility.className = "layer-visibility";
    visibility.setAttribute(
      "aria-label",
      layer.hidden ? `${copy.showLayout} ${layer.name}` : `${copy.hideLayout} ${layer.name}`,
    );
    visibility.setAttribute("aria-pressed", String(!layer.hidden));
    visibility.title = layer.hidden ? copy.showLayout : copy.hideLayout;
    visibility.append(
      createLayerIcon(
        "M12 5C6.5 5 2.1 8.4 1 12c1.1 3.6 5.5 7 11 7s9.9-3.4 11-7c-1.1-3.6-5.5-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
      ),
    );
    visibility.classList.toggle("is-hidden", Boolean(layer.hidden));

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "layer-edit";
    edit.append(
      createLayerIcon(
        "M3 17.25V21h3.75L18.8 8.95l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l9.55-9.55.92.92-9.55 9.55z",
      ),
    );
    edit.setAttribute("aria-label", `${copy.renameLayout} ${layer.name}`);
    edit.title = copy.renameLayout;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "layer-remove";
    remove.append(
      createLayerIcon(
        "M9 3.75h6l1 .75h3v1.5H5v-1.5h3l1-.75zm-3 4.5h12l-1 12h-10l-1-12zm4 2.25v7.5h1.5v-7.5H10zm3 0v7.5h1.5v-7.5H13z",
      ),
    );
    remove.setAttribute("aria-label", `${copy.deleteLayout} ${layer.name}`);
    remove.title = copy.deleteLayout;

    const drag = document.createElement("span");
    drag.className = "layer-drag";
    drag.classList.add("sr-only");
    drag.textContent = "Drag";

    block.append(blockCheckbox);
    item.append(order, label, block, edit, visibility, remove, drag);
    item.addEventListener("click", () => {
      setActiveLayer(index);
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveLayer(index);
      }
    });
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      item.classList.add("is-dragging");
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("is-dragging");
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
      reorderLayout(fromIndex, index);
    });

    blockCheckbox.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    blockCheckbox.addEventListener("change", (event) => {
      event.stopPropagation();
      pushUndoState();
      layer.block = blockCheckbox.checked;
      item.classList.toggle("is-blocked", Boolean(layer.block));
      blockCheckbox.title = layer.block ? "Blocked layout" : "Not blocked";
      persistProject();
      updateStatus(
        layer.block
          ? `${layer.name} marked as blocked.`
          : `${layer.name} unmarked as blocked.`,
      );
      markDirty();
    });

    visibility.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      pushUndoState();
      layer.hidden = !layer.hidden;
      rebuildMapSurface();
      renderLayerList();
      persistProject();
      updateStatus(
        layer.hidden ? `${layer.name} hidden.` : `${layer.name} shown.`,
      );
      markDirty();
    });

    edit.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      renameLayout(index);
    });

    remove.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteLayout(index);
    });

    elements.layerList.append(item);
  });
}

function upsertStoredProject(projectData) {
  const projects = getStoredProjects();
  const summary = {
    id: projectData.project.id,
    name: getProjectName(projectData.project.name),
    updatedAt: new Date().toISOString(),
    data: projectData,
  };
  const existingIndex = projects.findIndex((project) => project.id === summary.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = summary;
  } else {
    projects.unshift(summary);
  }

  setStoredProjects(projects);
}

function applyProjectData(
  raw,
  {
    persist = false,
    statusMessage = "",
    closeImport = false,
    resetHistory = true,
    preserveView = false,
  } = {},
) {
  const projectId = raw.project?.id || createProjectId();
  const projectName = getProjectName(raw.project?.name);
  const viewSnapshot = preserveView
    ? {
        zoom: editorState.camera.zoom,
        offsetX: editorState.camera.offsetX,
        offsetY: editorState.camera.offsetY,
      }
    : null;

  if (resetHistory) {
    editorState.history.undoStack = [];
    editorState.history.redoStack = [];
  }

  editorState.project.id = projectId;
  editorState.project.name = projectName;
  editorState.map.columns = Number(raw.map.columns) || 32;
  editorState.map.rows = Number(raw.map.rows) || 20;
  editorState.map.tileWidth = DEFAULT_TILE_SIZE;
  editorState.map.tileHeight = DEFAULT_TILE_SIZE;
  editorState.map.backgroundColor = raw.map.backgroundColor || DEFAULT_MAP_BACKGROUND;
  editorState.map.gridColor = raw.map.gridColor || DEFAULT_GRID_COLOR;
  editorState.map.layers = (raw.map.layers || []).map((layer, index) => ({
    id: layer.id || `layer_${index}`,
    name: getLayoutBaseName(layer.name || `Layout ${index + 1}`),
    hidden: Boolean(layer.hidden),
    block: Boolean(layer.block),
    data: normalizeLayerData(layer.data, Number(raw.map.columns) || 32, Number(raw.map.rows) || 20),
  }));

  if (editorState.map.layers.length === 0) {
    resetLayerData();
  }

  normalizeLayerNames();

  editorState.map.activeLayer = Number(raw.map.activeLayer ?? 0) || 0;
  clampActiveLayerIndex();
  editorState.selectedTileIndices = normalizeTileIndices(
    raw.selectedTileIndices ?? (Number(raw.selectedTileIndex) >= 0 ? [Number(raw.selectedTileIndex)] : []),
    Number(raw.tileset?.count) || 0,
  );
  editorState.selectedTileIndex =
    editorState.selectedTileIndices.at(-1) ??
    (Number(raw.selectedTileIndex) >= 0 ? Number(raw.selectedTileIndex) : -1);
  editorState.selectedTilePaintCursor = 0;

  editorState.showGrid = raw.showGrid ?? true;
  editorState.hoveredCell = null;
  if (viewSnapshot) {
    editorState.camera.zoom = viewSnapshot.zoom;
    editorState.camera.offsetX = viewSnapshot.offsetX;
    editorState.camera.offsetY = viewSnapshot.offsetY;
  } else {
    editorState.camera.zoom = 1;
    editorState.camera.offsetX = 24;
    editorState.camera.offsetY = 24;
  }

  if (raw.tileset.imageSrc) {
    return createImage(raw.tileset.imageSrc).then((image) => {
      const sources = Array.isArray(raw.tileset.sources) && raw.tileset.sources.length > 0
        ? raw.tileset.sources
        : [
            {
              id: "sheet_1",
              offsetY: 0,
              width: image.width,
              height: image.height,
              spacing: Number(raw.tileset.spacing) || 0,
              margin: Number(raw.tileset.margin) || 0,
              columns: 1,
              rows: 1,
              count: 0,
            },
          ];
      const rebuilt = rebuildTilesetFromSources(image, sources, raw.tileset);
      const defaultSource = rebuilt.sources[0];
      editorState.tileset = {
        ...editorState.tileset,
        name: (raw.tileset.name ?? editorState.tileset.name) || "tileset",
        reference:
          (raw.tileset.reference ?? editorState.tileset.reference ?? "tileset.png") ||
          "tileset.png",
        tileWidth: defaultSource?.tileWidth || Number(raw.tileset.tileWidth) || DEFAULT_TILE_SIZE,
        tileHeight:
          defaultSource?.tileHeight || Number(raw.tileset.tileHeight) || DEFAULT_TILE_SIZE,
        spacing: defaultSource?.spacing || 0,
        margin: defaultSource?.margin || 0,
        columns: defaultSource?.columns || 0,
        rows: defaultSource?.rows || 0,
        count: rebuilt.tiles.length,
        imageSrc: image.src,
        image,
        sources: rebuilt.sources,
        tiles: rebuilt.tiles,
      };
      editorState.map.tileWidth = editorState.tileset.tileWidth;
      editorState.map.tileHeight = editorState.tileset.tileHeight;
      tilesetInteractionState.zoom = 1;
      syncMapInputs();
      syncToolbarState();
      syncProjectControls();
      renderLayerList();
      rebuildMapSurface();
      renderTilesetPalette();
      if (persist) {
        persistProject();
      }
      if (statusMessage) {
        updateStatus(statusMessage);
      }
      if (closeImport) {
        closeImportPopup();
      }
      markDirty();
    });
  }

  editorState.tileset = {
    ...editorState.tileset,
    ...raw.tileset,
    imageSrc: "",
    image: null,
    sources: Array.isArray(raw.tileset.sources) ? raw.tileset.sources : [],
    tiles: [],
  };
  tilesetInteractionState.zoom = 1;

  syncMapInputs();
  syncToolbarState();
  syncProjectControls();
  renderLayerList();
  rebuildMapSurface();
  renderTilesetPalette();
  if (persist) {
    persistProject();
  }
  if (statusMessage) {
    updateStatus(statusMessage);
  }
  if (closeImport) {
    closeImportPopup();
  }
  markDirty();
  return Promise.resolve();
}

async function createProject(name = DEFAULT_PROJECT_NAME) {
  try {
    const projectData = await createProjectDataWithDefaultTileset(name);
    await applyProjectData(projectData, {
      persist: true,
      statusMessage: `Created project "${projectData.project.name}" with the default tileset.`,
    });
    editorState.project.isOpen = true;
    closeProjectsPopup();
  } catch (error) {
    const projectData = createDefaultProjectData(name);
    await applyProjectData(projectData, {
      persist: true,
      statusMessage: error?.message || `Created project "${projectData.project.name}".`,
    });
    editorState.project.isOpen = true;
    closeProjectsPopup();
  }
}

async function loadStoredProject(projectId, statusMessage = "Project loaded.") {
  const project = getStoredProjects().find((entry) => entry.id === projectId);
  if (!project) {
    updateStatus("Selected project was not found in browser storage.");
    return;
  }

  await applyProjectData(project.data, {
    persist: false,
    statusMessage,
  });
  editorState.project.isOpen = true;
  window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, projectId);
  closeProjectsPopup();
}

async function deleteCurrentProjectFromLocal() {
  const currentProjectId = editorState.project.id;
  const projects = getStoredProjects();
  const currentProject = projects.find((entry) => entry.id === currentProjectId);

  if (!currentProject) {
    updateStatus("Current project is not saved in this browser.");
    return;
  }

  const confirmed = window.confirm(
    `Delete "${currentProject.name}" from this browser? This cannot be undone.`,
  );
  if (!confirmed) {
    return;
  }

  const remainingProjects = projects.filter((entry) => entry.id !== currentProjectId);
  setStoredProjects(remainingProjects);

  if (remainingProjects.length > 0) {
    await loadStoredProject(
      remainingProjects[0].id,
      `Deleted "${currentProject.name}" from this browser.`,
    );
    openProjectsPopup();
    return;
  }

  window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
  await applyProjectData(createDefaultProjectData(DEFAULT_PROJECT_NAME), {
    persist: false,
    statusMessage: `Deleted "${currentProject.name}" from this browser.`,
  });
  editorState.project.isOpen = false;
  syncProjectControls();
  openProjectsPopup();
}

function migrateLegacyProject() {
  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy || getStoredProjects().length > 0) {
    return;
  }

  try {
    const raw = JSON.parse(legacy);
    const migrated = {
      ...raw,
      project: {
        id: createProjectId(),
        name: getProjectName(raw.project?.name || "Migrated project"),
      },
    };
    upsertStoredProject(migrated);
    window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, migrated.project.id);
  } catch {
    // Ignore unreadable legacy data.
  }
}

function getActiveLayer() {
  return editorState.map.layers[editorState.map.activeLayer];
}

function createLayerData(columns, rows, fill = -1) {
  return Array.from({ length: rows }, () => Array(columns).fill(fill));
}

function normalizeTileIndices(indices, maxTiles) {
  const seen = new Set();
  const nextIndices = [];

  for (const value of Array.isArray(indices) ? indices : []) {
    const index = Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= maxTiles || seen.has(index)) {
      continue;
    }

    seen.add(index);
    nextIndices.push(index);
  }

  return nextIndices;
}

function getSelectedTileIndices() {
  return normalizeTileIndices(
    editorState.selectedTileIndices.length > 0
      ? editorState.selectedTileIndices
      : editorState.selectedTileIndex >= 0
        ? [editorState.selectedTileIndex]
        : [],
    editorState.tileset.tiles.length,
  );
}

function getSelectedRectangleTileIndex() {
  const selectedTileIndices = getSelectedTileIndices();
  return selectedTileIndices.at(-1) ?? -1;
}

function getCellBounds(startCell, endCell) {
  if (!startCell || !endCell) {
    return null;
  }

  return {
    minColumn: Math.min(startCell.column, endCell.column),
    maxColumn: Math.max(startCell.column, endCell.column),
    minRow: Math.min(startCell.row, endCell.row),
    maxRow: Math.max(startCell.row, endCell.row),
  };
}

function resetRectangleDragState() {
  mapRectangleState.isDragging = false;
  mapRectangleState.startCell = null;
  mapRectangleState.currentCell = null;
  mapRectangleState.pointerId = null;
}

function collapseTilesetSelectionForRectangle() {
  const selectedTileIndices = getSelectedTileIndices();
  if (selectedTileIndices.length <= 1) {
    return;
  }

  const keepIndex = editorState.selectedTileIndex >= 0
    ? editorState.selectedTileIndex
    : selectedTileIndices.at(-1);

  if (keepIndex < 0) {
    return;
  }

  setSelectedTiles([keepIndex], {
    primaryIndex: keepIndex,
    statusMessage: "Rectangle tool uses one tile. Selection reset.",
  });
}

function createTilesetSource(image, config = {}, offsetY = 0) {
  const tileWidth = DEFAULT_TILE_SIZE;
  const tileHeight = DEFAULT_TILE_SIZE;
  const spacing = Math.max(
    0,
    Number(config.spacing ?? elements.tileSpacingInput.value) || 0,
  );
  const margin = Math.max(
    0,
    Number(config.margin ?? elements.tileMarginInput.value) || 0,
  );
  const tiles = [];
  let index = 0;

  for (
    let y = margin;
    y + tileHeight <= image.height - margin;
    y += tileHeight + spacing
  ) {
    for (
      let x = margin;
      x + tileWidth <= image.width - margin;
      x += tileWidth + spacing
    ) {
      tiles.push({
        index,
        sourceX: x,
        sourceY: y + offsetY,
        sourceWidth: tileWidth,
        sourceHeight: tileHeight,
      });
      index += 1;
    }
  }

  return {
    offsetY,
    width: image.width,
    height: image.height,
    tileWidth,
    tileHeight,
    spacing,
    margin,
    columns: Math.max(
      1,
      Math.floor((image.width - margin * 2 + spacing) / (tileWidth + spacing)),
    ),
    rows: Math.ceil(tiles.length / Math.max(
      1,
      Math.floor((image.width - margin * 2 + spacing) / (tileWidth + spacing)),
    )),
    count: tiles.length,
    tiles,
  };
}

function getTilesetSourceImage(source, atlasImage) {
  if (source?.image) {
    return source.image;
  }

  const width = Math.max(1, Number(source?.width) || Number(atlasImage?.width) || DEFAULT_TILE_SIZE);
  const height = Math.max(1, Number(source?.height) || DEFAULT_TILE_SIZE);
  const offsetY = Math.max(0, Number(source?.offsetY) || 0);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;

  const ctx = sourceCanvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);

  if (atlasImage) {
    ctx.drawImage(
      atlasImage,
      0,
      offsetY,
      width,
      height,
      0,
      0,
      width,
      height,
    );
  }

  return sourceCanvas;
}

function padTilesetSourceImage(image, slotWidth, slotHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, slotWidth);
  canvas.height = Math.max(1, slotHeight);

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  return canvas;
}

function rebuildTilesetFromSources(image, sources, config = {}) {
  const sourceInputs = (Array.isArray(sources) ? sources : []).map((source, index) => ({
    ...source,
    id: source.id || `sheet_${index + 1}`,
    image: getTilesetSourceImage(source, image),
    spacing: Number(source.spacing ?? config.spacing) || 0,
    margin: Number(source.margin ?? config.margin) || 0,
  }));

  if (sourceInputs.length === 0) {
    return {
      image,
      tiles: [],
      sources: [],
      nextIndex: 0,
      config,
    };
  }

  const gridSources = sourceInputs.map((source) => {
    const paddedImage = padTilesetSourceImage(
      source.image,
      Math.max(1, Number(source.slotWidth) || Number(source.width) || source.image.width || DEFAULT_TILE_SIZE),
      Math.max(1, Number(source.slotHeight) || Number(source.height) || source.image.height || DEFAULT_TILE_SIZE),
    );
    const slice = createTilesetSource(paddedImage, source, 0);
    return {
      ...source,
      image: paddedImage,
      tileWidth: slice.tileWidth,
      tileHeight: slice.tileHeight,
      columns: slice.columns,
      rows: slice.rows,
      count: slice.count,
    };
  });

  const slotWidth = Math.max(
    ...gridSources.map((source) =>
      Math.max(
        1,
        Number(source.slotWidth) ||
          Number(source.width) ||
          source.image.width ||
          DEFAULT_TILE_SIZE,
      ),
    ),
  );
  const slotHeight = Math.max(
    ...gridSources.map((source) =>
      Math.max(
        1,
        Number(source.slotHeight) ||
          Number(source.height) ||
          source.image.height ||
          DEFAULT_TILE_SIZE,
      ),
    ),
  );

  const normalizedSources = [];
  const tiles = [];
  let nextIndex = 0;
  let nextImage = null;

  gridSources.forEach((source, index) => {
    const offsetY = index * slotHeight;
    const paddedImage = padTilesetSourceImage(source.image, slotWidth, slotHeight);
    nextImage = composeTilesetAtlas(nextImage, paddedImage);

    const slice = createTilesetSource(paddedImage, source, offsetY);
    for (const tile of slice.tiles) {
      tiles.push({
        ...tile,
        index: nextIndex,
      });
      nextIndex += 1;
    }

    normalizedSources.push({
      id: source.id || `sheet_${index + 1}`,
      offsetY,
      width: Number(source.width) || source.image.width || slotWidth,
      height: Number(source.height) || source.image.height || slotHeight,
      slotWidth,
      slotHeight,
      tileWidth: slice.tileWidth,
      tileHeight: slice.tileHeight,
      spacing: Number(source.spacing) || 0,
      margin: Number(source.margin) || 0,
      columns: slice.columns,
      rows: slice.rows,
      count: slice.count,
    });
  });

  return {
    image: nextImage,
    tiles,
    sources: normalizedSources,
    nextIndex,
    config: {
      ...config,
      slotWidth,
      slotHeight,
    },
  };
}

function composeTilesetAtlas(existingImage, incomingImage) {
  const atlas = document.createElement("canvas");
  atlas.width = Math.max(existingImage?.width || 0, incomingImage.width);
  atlas.height = (existingImage?.height || 0) + incomingImage.height;

  const atlasCtx = atlas.getContext("2d", { alpha: true });
  atlasCtx.imageSmoothingEnabled = false;
  atlasCtx.clearRect(0, 0, atlas.width, atlas.height);

  if (existingImage) {
    atlasCtx.drawImage(existingImage, 0, 0);
  }

  atlasCtx.drawImage(incomingImage, 0, existingImage?.height || 0);
  return atlas;
}

function getSelectedTileStamp() {
  const selectedIndices = getSelectedTileIndices();
  if (selectedIndices.length === 0) {
    return [];
  }

  const stepX = editorState.tileset.tileWidth + editorState.tileset.spacing;
  const stepY = editorState.tileset.tileHeight + editorState.tileset.spacing;
  const selectedTiles = selectedIndices
    .map((index) => editorState.tileset.tiles[index])
    .filter(Boolean)
    .map((tile) => ({
      ...tile,
      gridColumn: Math.round((tile.sourceX - editorState.tileset.margin) / stepX),
      gridRow: Math.round((tile.sourceY - editorState.tileset.margin) / stepY),
    }));

  if (selectedTiles.length === 0) {
    return [];
  }

  const baseColumn = Math.min(...selectedTiles.map((tile) => tile.gridColumn));
  const baseRow = Math.min(...selectedTiles.map((tile) => tile.gridRow));

  return selectedTiles
    .map((tile) => ({
      tileIndex: tile.index,
      offsetColumn: tile.gridColumn - baseColumn,
      offsetRow: tile.gridRow - baseRow,
    }))
    .sort((a, b) => a.offsetRow - b.offsetRow || a.offsetColumn - b.offsetColumn);
}

function drawTilesetGridOverlay(ctx, overlayCanvas, selectionState) {
  const gridStepX = Math.max(1, Number(selectionState.gridStepX) || DEFAULT_TILE_SIZE);
  const gridStepY = Math.max(1, Number(selectionState.gridStepY) || DEFAULT_TILE_SIZE);
  const gridOffsetX = Math.max(0, Number(selectionState.gridOffsetX) || 0);
  const gridOffsetY = Math.max(0, Number(selectionState.gridOffsetY) || 0);
  const gridColor = selectionState.gridColor || "rgba(255, 255, 255, 0.12)";

  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  const sources =
    Array.isArray(editorState.tileset.sources) && editorState.tileset.sources.length > 0
      ? editorState.tileset.sources
      : [
          {
            offsetY: 0,
            slotHeight: overlayCanvas.height,
          },
        ];

  const canvasWidth = overlayCanvas.width;
  for (const source of sources) {
    const sourceTop = Math.max(0, Number(source.offsetY) || 0);
    const sourceHeight = Math.max(
      1,
      Number(source.slotHeight) || Number(source.height) || overlayCanvas.height,
    );
    const startY = sourceTop + gridOffsetY;
    const endY = sourceTop + sourceHeight;

    for (let x = gridOffsetX; x <= canvasWidth; x += gridStepX) {
      const snappedX = Math.round(x) + 0.5;
      ctx.beginPath();
      ctx.moveTo(snappedX, startY);
      ctx.lineTo(snappedX, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridStepY) {
      const snappedY = Math.round(y) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gridOffsetX, snappedY);
      ctx.lineTo(canvasWidth, snappedY);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawTilesetSelectionOverlay(overlayCanvas, selectionState) {
  const ctx = overlayCanvas.getContext("2d", { alpha: true });
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  drawTilesetGridOverlay(ctx, overlayCanvas, selectionState);

  if (!selectionState.isDragging) {
    return;
  }

  const x = Math.min(selectionState.startX, selectionState.currentX);
  const y = Math.min(selectionState.startY, selectionState.currentY);
  const width = Math.abs(selectionState.currentX - selectionState.startX);
  const height = Math.abs(selectionState.currentY - selectionState.startY);

  ctx.save();
  ctx.fillStyle = "rgba(241, 138, 91, 0.14)";
  ctx.strokeStyle = "#f6cb7d";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.restore();
}

function drawMapRectanglePreview(ctx, startCell, endCell) {
  const bounds = getCellBounds(startCell, endCell);
  if (!bounds) {
    return;
  }

  const { tileWidth, tileHeight } = editorState.map;
  const zoom = editorState.camera.zoom;
  const x = editorState.camera.offsetX + bounds.minColumn * tileWidth * zoom;
  const y = editorState.camera.offsetY + bounds.minRow * tileHeight * zoom;
  const width = (bounds.maxColumn - bounds.minColumn + 1) * tileWidth * zoom;
  const height = (bounds.maxRow - bounds.minRow + 1) * tileHeight * zoom;

  ctx.save();
  ctx.fillStyle = "rgba(246, 203, 125, 0.14)";
  ctx.strokeStyle = "#f6cb7d";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.restore();
}

function setSelectedTiles(
  nextIndices,
  {
    primaryIndex = -1,
    persist = true,
    statusMessage = "",
    rerender = true,
  } = {},
) {
  let normalized = normalizeTileIndices(nextIndices, editorState.tileset.tiles.length);
  if (editorState.tool === "rectangle" && normalized.length > 1) {
    const keepIndex =
      primaryIndex >= 0 && normalized.includes(primaryIndex)
        ? primaryIndex
        : normalized.at(-1) ?? -1;
    normalized = keepIndex >= 0 ? [keepIndex] : [];
  }
  editorState.selectedTileIndices = normalized;
  editorState.selectedTileIndex =
    normalized.length === 0
      ? -1
      : primaryIndex >= 0 && normalized.includes(primaryIndex)
        ? primaryIndex
        : normalized.at(-1) ?? -1;
  editorState.selectedTilePaintCursor = 0;

  if (rerender) {
    syncToolbarState();
    renderTilesetPalette();
  }

  if (persist) {
    persistProject();
  }

  if (statusMessage) {
    updateStatus(statusMessage);
  }

  markDirty();
}

function createLayerIcon(pathData) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("layer-icon");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  svg.append(path);

  return svg;
}

function normalizeLayerData(data, columns, rows) {
  const nextData = createLayerData(columns, rows);
  if (!Array.isArray(data)) {
    return nextData;
  }

  for (let row = 0; row < Math.min(rows, data.length); row += 1) {
    const sourceRow = Array.isArray(data[row]) ? data[row] : [];
    for (let column = 0; column < Math.min(columns, sourceRow.length); column += 1) {
      nextData[row][column] = Number(sourceRow[column]);
    }
  }

  return nextData;
}

function createLayer(name, columns, rows) {
  return {
    id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    hidden: false,
    block: false,
    data: createLayerData(columns, rows),
  };
}

function resetLayerData() {
  editorState.map.layers = [
    {
      id: "base",
      name: DEFAULT_LAYOUT_NAME,
      hidden: false,
      block: false,
      data: createLayerData(editorState.map.columns, editorState.map.rows),
    },
  ];
  editorState.map.activeLayer = 0;
}

function syncMapInputs() {
  elements.mapColumnsInput.value = editorState.map.columns;
  elements.mapRowsInput.value = editorState.map.rows;
  elements.mapBackgroundColorInput.value = editorState.map.backgroundColor;
  elements.gridColorInput.value = editorState.map.gridColor;
  elements.tilesetNameInput.value = editorState.tileset.name;
  elements.tileSpacingInput.value = editorState.tileset.spacing;
  elements.tileMarginInput.value = editorState.tileset.margin;
  if (elements.tilesetReferenceInput) {
    elements.tilesetReferenceInput.value = editorState.tileset.reference;
  }
}

function updateStatus(message) {
  elements.mapStatusText.textContent = message;
}

function cloneProjectSnapshot() {
  return JSON.parse(JSON.stringify(buildEditorProject()));
}

function pushUndoState() {
  const snapshot = cloneProjectSnapshot();
  const undoStack = editorState.history.undoStack;
  const previous = undoStack[undoStack.length - 1];

  if (previous && JSON.stringify(previous) === JSON.stringify(snapshot)) {
    return;
  }

  editorState.history.redoStack.length = 0;
  undoStack.push(snapshot);
  if (undoStack.length > UNDO_LIMIT) {
    undoStack.shift();
  }
  syncToolbarState();
}

async function undoLastAction() {
  const snapshot = editorState.history.undoStack.pop();
  if (!snapshot) {
    updateStatus("Nothing to undo.");
    return;
  }

  editorState.history.redoStack.push(cloneProjectSnapshot());
  if (editorState.history.redoStack.length > UNDO_LIMIT) {
    editorState.history.redoStack.shift();
  }

  await applyProjectData(snapshot, {
    persist: false,
    resetHistory: false,
    preserveView: true,
    statusMessage: "Undo applied.",
  });
  persistProject();
  syncToolbarState();
}

async function redoLastAction() {
  const snapshot = editorState.history.redoStack.pop();
  if (!snapshot) {
    updateStatus("Nothing to redo.");
    return;
  }

  editorState.history.undoStack.push(cloneProjectSnapshot());
  if (editorState.history.undoStack.length > UNDO_LIMIT) {
    editorState.history.undoStack.shift();
  }

  await applyProjectData(snapshot, {
    persist: false,
    resetHistory: false,
    preserveView: true,
    statusMessage: "Redo applied.",
  });
  persistProject();
  syncToolbarState();
}

function openExportPopup() {
  elements.exportPopup.hidden = false;
  elements.openExportPopupBtn.setAttribute("aria-expanded", "true");
}

function closeExportPopup() {
  elements.exportPopup.hidden = true;
  elements.openExportPopupBtn.setAttribute("aria-expanded", "false");
}

function openImportPopup() {
  elements.importPopup.hidden = false;
  elements.openImportPopupBtn.setAttribute("aria-expanded", "true");
}

function closeImportPopup() {
  elements.importPopup.hidden = true;
  elements.openImportPopupBtn.setAttribute("aria-expanded", "false");
}

function openProjectsPopup() {
  syncProjectControls();
  elements.closeProjectsPopupBtn.hidden = !editorState.project.isOpen;
  elements.projectsPopup.hidden = false;
  elements.openProjectsPopupBtn.setAttribute("aria-expanded", "true");
}

function closeProjectsPopup() {
  if (!editorState.project.id) {
    return;
  }

  elements.projectsPopup.hidden = true;
  elements.openProjectsPopupBtn.setAttribute("aria-expanded", "false");
}

function openShortcutsPopup() {
  elements.shortcutsPopup.hidden = false;
  elements.openShortcutsPopupBtn.setAttribute("aria-expanded", "true");
}

function closeShortcutsPopup() {
  elements.shortcutsPopup.hidden = true;
  elements.openShortcutsPopupBtn.setAttribute("aria-expanded", "false");
}

function updateMetaText() {
  const copy = getUiCopy();
  const { columns, rows, tileWidth, tileHeight } = editorState.map;
  elements.mapMetaText.textContent = copy.mapMeta(columns, rows, tileWidth, tileHeight);

  const selectedTiles =
    editorState.selectedTileIndices.length > 0
      ? editorState.selectedTileIndices
      : editorState.selectedTileIndex >= 0
        ? [editorState.selectedTileIndex]
        : [];
  if (selectedTiles.length === 0) {
    elements.selectedTileText.textContent = copy.selectedTileNone;
  } else if (selectedTiles.length === 1) {
    elements.selectedTileText.textContent = copy.selectedTileOne(selectedTiles[0]);
  } else {
    const preview = selectedTiles.slice(0, 4).map((index) => `#${index}`).join(", ");
    const extra = selectedTiles.length > 4 ? ` +${selectedTiles.length - 4}` : "";
    elements.selectedTileText.textContent = copy.selectedTiles(preview, extra);
  }

  if (editorState.hoveredCell) {
    const { column, row } = editorState.hoveredCell;
    elements.hoverTileText.textContent = copy.hover(column, row);
  } else {
    elements.hoverTileText.textContent = copy.hoverNone;
  }

  elements.tilesetMetaText.textContent =
    editorState.tileset.count > 0
      ? editorState.tileset.sources.length > 1
        ? copy.tilesetMetaMultiSheet(editorState.tileset.count, editorState.tileset.sources.length)
        : copy.tilesetMetaOneSheet(editorState.tileset.count, editorState.tileset.columns)
      : copy.noSpritesheetLoaded;
}

function markDirty() {
  editorState.render.dirty = true;

  if (editorState.render.rafId) {
    return;
  }

  editorState.render.rafId = window.requestAnimationFrame(() => {
    editorState.render.rafId = 0;
    if (!editorState.render.dirty) return;
    renderEditor();
    editorState.render.dirty = false;
  });
}

function triggerDownload(blobOrUrl, filename) {
  const url =
    typeof blobOrUrl === "string"
      ? blobOrUrl
      : URL.createObjectURL(blobOrUrl);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  if (typeof blobOrUrl !== "string") {
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }
}

function getCurrentTilesetPngDataUrl() {
  if (!editorState.tileset.image) {
    return "";
  }

  const source = editorState.tileset.image;
  let dataUrl = "";

  if (typeof source.toDataURL === "function") {
    dataUrl = source.toDataURL("image/png");
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d", { alpha: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0);
    dataUrl = canvas.toDataURL("image/png");
  }

  return dataUrl || "";
}

function downloadCurrentTilesetPng(filename) {
  const dataUrl = getCurrentTilesetPngDataUrl();
  if (!dataUrl) {
    return false;
  }

  triggerDownload(dataUrl, filename);
  return true;
}

async function downloadZipBundle({
  zipFilename,
  mainFilename,
  mainContent,
  imageFilename,
}) {
  const dataUrl = getCurrentTilesetPngDataUrl();
  if (!window.JSZip) {
    return false;
  }

  const zip = new window.JSZip();
  zip.file(mainFilename, mainContent);

  if (dataUrl) {
    zip.file(imageFilename, dataUrl.split(",")[1], { base64: true });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, zipFilename);
  return true;
}

function flattenLayerDataForTiled(layerData) {
  const flattened = [];

  for (const row of layerData) {
    for (const tileIndex of row) {
      flattened.push(tileIndex < 0 ? 0 : tileIndex + 1);
    }
  }

  return flattened;
}

function getExportTilesetGeometry() {
  const tilesetImage = editorState.tileset.image;
  const tileWidth = Math.max(1, Number(editorState.tileset.tileWidth) || DEFAULT_TILE_SIZE);
  const tileHeight = Math.max(1, Number(editorState.tileset.tileHeight) || DEFAULT_TILE_SIZE);
  const imageWidth = Math.max(
    tileWidth,
    Number(tilesetImage?.width) || editorState.tileset.columns * tileWidth || tileWidth,
  );
  const imageHeight = Math.max(
    tileHeight,
    Number(tilesetImage?.height) || editorState.tileset.rows * tileHeight || tileHeight,
  );

  const columns = Math.max(1, Math.floor(imageWidth / tileWidth));
  const rows = Math.max(1, Math.floor(imageHeight / tileHeight));

  return {
    tileWidth,
    tileHeight,
    imageWidth,
    imageHeight,
    columns,
    rows,
    tilecount: columns * rows,
  };
}

function buildTiledMapExport() {
  const geometry = getExportTilesetGeometry();
  const layerIds = editorState.map.layers.map((_, index) => index + 1);

  return {
    compressionlevel: -1,
    height: editorState.map.rows,
    infinite: false,
    layers: editorState.map.layers.map((layer, index) => ({
      id: layerIds[index],
      name: layer.name,
      opacity: 1.0,
      type: "tilelayer",
      visible: !layer.hidden,
      x: 0,
      y: 0,
      width: editorState.map.columns,
      height: editorState.map.rows,
      data: flattenLayerDataForTiled(layer.data),
      properties: [
        {
          name: "collider",
          type: "bool",
          value: Boolean(layer.block),
        },
        {
          name: "block",
          type: "bool",
          value: Boolean(layer.block),
        },
      ],
    })),
    nextlayerid: editorState.map.layers.length + 1,
    nextobjectid: 1,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.11.0",
    tileheight: geometry.tileHeight,
    tilesets: [
      {
        firstgid: 1,
        name: editorState.tileset.name || "tileset",
        tilewidth: geometry.tileWidth,
        tileheight: geometry.tileHeight,
        margin: editorState.tileset.margin,
        spacing: editorState.tileset.spacing,
        columns: geometry.columns,
        tilecount: geometry.tilecount,
        image: getExportTilesetReference(),
        imagewidth: geometry.imageWidth,
        imageheight: geometry.imageHeight,
      },
    ],
    tilewidth: geometry.tileWidth,
    type: "map",
    version: 1.1,
    width: editorState.map.columns,
  };
}

function buildPhaserMapExport() {
  return {
    type: "tilemap",
    engine: "phaser",
    width: editorState.map.columns,
    height: editorState.map.rows,
    tileWidth: editorState.map.tileWidth,
    tileHeight: editorState.map.tileHeight,
    tileset: {
      name: editorState.tileset.name,
      reference: getExportTilesetReference(),
      columns: editorState.tileset.columns,
      tileWidth: editorState.tileset.tileWidth,
      tileHeight: editorState.tileset.tileHeight,
      count: editorState.tileset.count,
    },
    layers: editorState.map.layers.map((layer, index) => ({
      id: layer.id,
      name: layer.name,
      hidden: Boolean(layer.hidden),
      block: Boolean(layer.block),
      index,
      width: editorState.map.columns,
      height: editorState.map.rows,
      data: layer.data.flat(),
    })),
    note: "Tile indices are zero-based. Empty cells use -1.",
  };
}

function buildUnityMapExport() {
  return {
    type: "tilemap",
    engine: "unity",
    width: editorState.map.columns,
    height: editorState.map.rows,
    tileWidth: editorState.map.tileWidth,
    tileHeight: editorState.map.tileHeight,
    tileset: {
      name: editorState.tileset.name,
      reference: getExportTilesetReference(),
      columns: editorState.tileset.columns,
      tileWidth: editorState.tileset.tileWidth,
      tileHeight: editorState.tileset.tileHeight,
      count: editorState.tileset.count,
    },
    layers: editorState.map.layers.map((layer, index) => ({
      id: layer.id,
      name: layer.name,
      hidden: Boolean(layer.hidden),
      block: Boolean(layer.block),
      index,
      width: editorState.map.columns,
      height: editorState.map.rows,
      data: layer.data.flat(),
    })),
    note: "Tile indices are zero-based. Empty cells use -1.",
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

function getMapPixelSize() {
  return {
    width: editorState.map.columns * editorState.map.tileWidth,
    height: editorState.map.rows * editorState.map.tileHeight,
  };
}

// Offscreen canvas keeps the full tilemap pre-rendered for smoother pan/zoom.
function rebuildMapSurface() {
  const { width, height } = getMapPixelSize();
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  const ctx = offscreenCanvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = editorState.map.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  for (const layer of editorState.map.layers) {
    if (layer.hidden) continue;

    for (let row = 0; row < editorState.map.rows; row += 1) {
      for (let column = 0; column < editorState.map.columns; column += 1) {
        const tileIndex = layer.data[row][column];
        if (tileIndex < 0) continue;

        const tile = editorState.tileset.tiles[tileIndex];
        if (!tile || !editorState.tileset.image) continue;

        ctx.drawImage(
          editorState.tileset.image,
          tile.sourceX,
          tile.sourceY,
          tile.sourceWidth,
          tile.sourceHeight,
          column * editorState.map.tileWidth,
          row * editorState.map.tileHeight,
          editorState.map.tileWidth,
          editorState.map.tileHeight,
        );
      }
    }
  }
}

function renderGrid(ctx, width, height) {
  if (!editorState.showGrid) return;

  ctx.save();
  ctx.strokeStyle = editorState.map.gridColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.28;

  for (let column = 0; column <= editorState.map.columns; column += 1) {
    const x = Math.round(
      editorState.camera.offsetX +
        column * editorState.map.tileWidth * editorState.camera.zoom,
    ) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, editorState.camera.offsetY);
    ctx.lineTo(x, editorState.camera.offsetY + height * editorState.camera.zoom);
    ctx.stroke();
  }

  for (let row = 0; row <= editorState.map.rows; row += 1) {
    const y = Math.round(
      editorState.camera.offsetY +
        row * editorState.map.tileHeight * editorState.camera.zoom,
    ) + 0.5;
    ctx.beginPath();
    ctx.moveTo(editorState.camera.offsetX, y);
    ctx.lineTo(editorState.camera.offsetX + width * editorState.camera.zoom, y);
    ctx.stroke();
  }

  ctx.restore();
}

function renderHover(ctx) {
  const hoveredCell = editorState.hoveredCell;
  const rectanglePreviewCell =
    editorState.tool === "rectangle" && mapRectangleState.startCell
      ? mapRectangleState.currentCell ?? hoveredCell ?? mapRectangleState.startCell
      : null;

  if (!hoveredCell && !rectanglePreviewCell) return;

  const activeCell = rectanglePreviewCell ?? hoveredCell;
  if (!activeCell) return;

  const { column, row } = activeCell;
  const { tileWidth, tileHeight } = editorState.map;
  const x = editorState.camera.offsetX + column * tileWidth * editorState.camera.zoom;
  const y = editorState.camera.offsetY + row * tileHeight * editorState.camera.zoom;
  const width = tileWidth * editorState.camera.zoom;
  const height = tileHeight * editorState.camera.zoom;

  ctx.save();
  if (rectanglePreviewCell) {
    drawMapRectanglePreview(ctx, mapRectangleState.startCell, rectanglePreviewCell);
    ctx.restore();
    return;
  }

  ctx.strokeStyle = "#f6cb7d";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);

  if (editorState.tool === "brush" && editorState.tileset.image) {
    const selectedTileStamp = getSelectedTileStamp();

    if (selectedTileStamp.length === 1) {
      const tile = editorState.tileset.tiles[selectedTileStamp[0].tileIndex];
      if (tile) {
        ctx.globalAlpha = 0.4;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          editorState.tileset.image,
          tile.sourceX,
          tile.sourceY,
          tile.sourceWidth,
          tile.sourceHeight,
          x,
          y,
          width,
          height,
        );
      }
    } else if (selectedTileStamp.length > 1) {
      ctx.globalAlpha = 0.38;
      ctx.imageSmoothingEnabled = false;
      for (const stampCell of selectedTileStamp) {
        const tile = editorState.tileset.tiles[stampCell.tileIndex];
        if (!tile) continue;

        const cellX = editorState.camera.offsetX + (column + stampCell.offsetColumn) * tileWidth * editorState.camera.zoom;
        const cellY = editorState.camera.offsetY + (row + stampCell.offsetRow) * tileHeight * editorState.camera.zoom;

        ctx.drawImage(
          editorState.tileset.image,
          tile.sourceX,
          tile.sourceY,
          tile.sourceWidth,
          tile.sourceHeight,
          cellX,
          cellY,
          width,
          height,
        );
        ctx.strokeStyle = "rgba(246, 203, 125, 0.8)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, width - 1, height - 1);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#f6cb7d";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    }
  }

  ctx.restore();
}

function renderEditor() {
  updateMetaText();

  const canvas = elements.mapCanvas;
  const ctx = canvas.getContext("2d", { alpha: true });
  const viewport = elements.mapViewport.getBoundingClientRect();
  const width = Math.max(320, Math.floor(viewport.width));
  const height = Math.max(320, Math.floor(viewport.height));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  const mapPixelSize = getMapPixelSize();
  ctx.drawImage(
    offscreenCanvas,
    0,
    0,
    mapPixelSize.width,
    mapPixelSize.height,
    editorState.camera.offsetX,
    editorState.camera.offsetY,
    mapPixelSize.width * editorState.camera.zoom,
    mapPixelSize.height * editorState.camera.zoom,
  );

  renderGrid(ctx, mapPixelSize.width, mapPixelSize.height);
  renderHover(ctx);
}

function updateToolButtons() {
  const brushActive = editorState.tool === "brush";
  const rectangleActive = editorState.tool === "rectangle";
  const eraseActive = editorState.tool === "erase";

  elements.brushToolBtn.classList.toggle("is-active", brushActive);
  elements.rectangleToolBtn.classList.toggle("is-active", rectangleActive);
  elements.eraseToolBtn.classList.toggle("is-active", eraseActive);

  elements.brushToolBtn.setAttribute("aria-pressed", String(brushActive));
  elements.rectangleToolBtn.setAttribute("aria-pressed", String(rectangleActive));
  elements.eraseToolBtn.setAttribute("aria-pressed", String(eraseActive));
}

function setTool(tool, { silent = false } = {}) {
  resetRectangleDragState();
  if (tool === "rectangle") {
    collapseTilesetSelectionForRectangle();
  }

  editorState.tool = tool;
  updateToolButtons();
  if (!silent) {
    const toolLabel =
      tool === "brush" ? "Brush" : tool === "erase" ? "Erase" : "Rectangle";
    updateStatus(`${toolLabel} tool selected.`);
  }
  markDirty();
}

function syncToolbarState() {
  const copy = getUiCopy();
  elements.toggleGridBtn.textContent = editorState.showGrid ? copy.gridOn : copy.gridOff;
  const isFullscreen = isEditorFullscreenActive();
  elements.fullscreenBtn.textContent = isFullscreen ? copy.fullscreenExit : copy.fullscreenEnter;
  elements.fullscreenBtn.setAttribute("aria-pressed", String(isFullscreen));
  elements.undoBtn.disabled = editorState.history.undoStack.length === 0;
  elements.redoBtn.disabled = editorState.history.redoStack.length === 0;
  updateToolButtons();
}

function isIpadLikeDevice() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isEditorFullscreenActive() {
  return (
    document.fullscreenElement === elements.appShell ||
    elements.appShell.classList.contains("is-editor-fullscreen")
  );
}

async function toggleFullscreenMode() {
  const target = elements.appShell;
  if (!target) {
    return;
  }

  try {
    if (isIpadLikeDevice()) {
      const nextState = !target.classList.contains("is-editor-fullscreen");
      target.classList.toggle("is-editor-fullscreen", nextState);
      document.body.classList.toggle("no-scroll", nextState);
      syncToolbarState();
      markDirty();
      return;
    }

    if (document.fullscreenElement === target) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else if (target.requestFullscreen) {
      await target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
    } else {
      updateStatus("Fullscreen is not supported in this browser.");
      return;
    }
  } catch {
    updateStatus("Fullscreen could not be changed.");
  }
}

function resizeMapPreservingData({ skipHistory = false } = {}) {
  if (!skipHistory) {
    pushUndoState();
  }

  const nextColumns = Math.max(1, Number(elements.mapColumnsInput.value) || 1);
  const nextRows = Math.max(1, Number(elements.mapRowsInput.value) || 1);

  const nextLayers = editorState.map.layers.map((layer) => {
    const nextData = createLayerData(nextColumns, nextRows);

    for (let row = 0; row < Math.min(editorState.map.rows, nextRows); row += 1) {
      for (
        let column = 0;
        column < Math.min(editorState.map.columns, nextColumns);
        column += 1
      ) {
        nextData[row][column] = layer.data[row][column];
      }
    }

    return {
      ...layer,
      data: nextData,
    };
  });

  editorState.map.columns = nextColumns;
  editorState.map.rows = nextRows;
  editorState.map.tileWidth = DEFAULT_TILE_SIZE;
  editorState.map.tileHeight = DEFAULT_TILE_SIZE;
  editorState.map.backgroundColor = elements.mapBackgroundColorInput.value;
  editorState.map.gridColor = elements.gridColorInput.value;
  editorState.map.layers = nextLayers;

  rebuildMapSurface();
  persistProject();
  updateStatus("Map size updated.");
  markDirty();
}

function resetMapSetup() {
  const confirmed = window.confirm(
    "Reset map setup to default columns, rows, background, and grid color?",
  );
  if (!confirmed) {
    return;
  }

  pushUndoState();
  elements.mapColumnsInput.value = DEFAULT_MAP_COLUMNS;
  elements.mapRowsInput.value = DEFAULT_MAP_ROWS;
  elements.mapBackgroundColorInput.value = DEFAULT_MAP_BACKGROUND;
  elements.gridColorInput.value = DEFAULT_GRID_COLOR;
  resizeMapPreservingData({ skipHistory: true });
  updateStatus("Map setup reset to defaults.");
}

function screenToCell(clientX, clientY) {
  const rect = elements.mapCanvas.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const worldX = (localX - editorState.camera.offsetX) / editorState.camera.zoom;
  const worldY = (localY - editorState.camera.offsetY) / editorState.camera.zoom;
  const column = Math.floor(worldX / editorState.map.tileWidth);
  const row = Math.floor(worldY / editorState.map.tileHeight);

  if (
    column < 0 ||
    row < 0 ||
    column >= editorState.map.columns ||
    row >= editorState.map.rows
  ) {
    return null;
  }

  return {
    column,
    row,
    value: getActiveLayer().data[row][column],
  };
}

// Only the changed cell is redrawn to the map surface for better paint performance.
function drawCellToSurface(column, row) {
  const ctx = offscreenCanvas.getContext("2d", { alpha: true });
  const x = column * editorState.map.tileWidth;
  const y = row * editorState.map.tileHeight;

  ctx.fillStyle = editorState.map.backgroundColor;
  ctx.fillRect(x, y, editorState.map.tileWidth, editorState.map.tileHeight);

  for (const layer of editorState.map.layers) {
    if (layer.hidden) continue;

    const tileIndex = layer.data[row][column];
    if (tileIndex < 0) continue;

    const tile = editorState.tileset.tiles[tileIndex];
    if (!tile || !editorState.tileset.image) continue;

    ctx.drawImage(
      editorState.tileset.image,
      tile.sourceX,
      tile.sourceY,
      tile.sourceWidth,
      tile.sourceHeight,
      x,
      y,
      editorState.map.tileWidth,
      editorState.map.tileHeight,
    );
  }
}

function rectangleWouldChange(startCell, endCell, tileIndex) {
  const bounds = getCellBounds(startCell, endCell);
  if (!bounds || tileIndex < 0) {
    return false;
  }

  const layer = getActiveLayer();
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
      if (layer.data[row][column] !== tileIndex) {
        return true;
      }
    }
  }

  return false;
}

function applyRectangleToCells(startCell, endCell, tileIndex) {
  const bounds = getCellBounds(startCell, endCell);
  if (!bounds || tileIndex < 0) {
    return false;
  }

  const layer = getActiveLayer();
  let changed = false;

  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
      if (layer.data[row][column] === tileIndex) {
        continue;
      }

      layer.data[row][column] = tileIndex;
      drawCellToSurface(column, row);
      changed = true;
    }
  }

  if (!changed) {
    return false;
  }

  editorState.hoveredCell = {
    column: bounds.maxColumn,
    row: bounds.maxRow,
    value: tileIndex,
  };
  persistProject();
  markDirty();
  return true;
}

function applyToolToCell(cell) {
  if (!cell) return;
  if (editorState.tool === "rectangle") return;

  const layer = getActiveLayer();
  const currentValue = layer.data[cell.row][cell.column];
  const selectedTileStamp = getSelectedTileStamp();

  if (editorState.tool === "erase") {
    if (currentValue === -1) return;
    layer.data[cell.row][cell.column] = -1;
    editorState.hoveredCell = { ...cell, value: -1 };
    drawCellToSurface(cell.column, cell.row);
    persistProject();
    markDirty();
    return;
  }

  if (selectedTileStamp.length === 0) {
    updateStatus("Select a tile from the tileset first.");
    return;
  }

  if (selectedTileStamp.length === 1) {
    const tileIndex = selectedTileStamp[0].tileIndex;
    if (currentValue === tileIndex) return;
    layer.data[cell.row][cell.column] = tileIndex;
    editorState.hoveredCell = {
      ...cell,
      value: tileIndex,
    };
    drawCellToSurface(cell.column, cell.row);
    persistProject();
    markDirty();
    return;
  }

  let changed = false;

  for (const stampCell of selectedTileStamp) {
    const targetColumn = cell.column + stampCell.offsetColumn;
    const targetRow = cell.row + stampCell.offsetRow;

    if (
      targetColumn < 0 ||
      targetRow < 0 ||
      targetColumn >= editorState.map.columns ||
      targetRow >= editorState.map.rows
    ) {
      continue;
    }

    if (layer.data[targetRow][targetColumn] === stampCell.tileIndex) {
      continue;
    }

    layer.data[targetRow][targetColumn] = stampCell.tileIndex;
    drawCellToSurface(targetColumn, targetRow);
    changed = true;
  }

  if (!changed) {
    return;
  }

  editorState.hoveredCell = {
    ...cell,
    value: selectedTileStamp[0].tileIndex,
  };
  persistProject();
  markDirty();
}

function pickTileFromMap(cell) {
  if (!cell || cell.value < 0) return;
  editorState.selectedTileIndex = cell.value;
  editorState.selectedTileIndices = [cell.value];
  editorState.selectedTilePaintCursor = 0;
  editorState.tool = "brush";
  renderTilesetPalette();
  syncToolbarState();
  persistProject();
  updateStatus(`Picked tile #${cell.value} from the map.`);
}

function zoomAt(factor, clientX, clientY) {
  const previousZoom = editorState.camera.zoom;
  const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, previousZoom * factor));
  if (nextZoom === previousZoom) return;

  const rect = elements.mapCanvas.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const worldX = (localX - editorState.camera.offsetX) / previousZoom;
  const worldY = (localY - editorState.camera.offsetY) / previousZoom;

  editorState.camera.zoom = nextZoom;
  editorState.camera.offsetX = localX - worldX * nextZoom;
  editorState.camera.offsetY = localY - worldY * nextZoom;

  markDirty();
}

function resetCamera() {
  editorState.camera.zoom = 1.25;
  editorState.camera.offsetX = 24;
  editorState.camera.offsetY = 24;
  markDirty();
}

function panCamera(deltaX, deltaY) {
  editorState.camera.offsetX += deltaX;
  editorState.camera.offsetY += deltaY;
  markDirty();
}

function getPointerPairMetrics(pointers) {
  const [first, second] = Array.from(pointers.values());
  if (!first || !second) {
    return null;
  }

  const centerX = (first.clientX + second.clientX) / 2;
  const centerY = (first.clientY + second.clientY) / 2;
  const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);

  return { centerX, centerY, distance };
}

function startMapPinchGesture() {
  const metrics = getPointerPairMetrics(mapTouchGestureState.pointers);
  if (!metrics) {
    return;
  }

  mapTouchGestureState.active = true;
  mapTouchGestureState.paintArmed = false;
  mapTouchGestureState.paintPointerId = null;
  mapTouchGestureState.startZoom = editorState.camera.zoom;
  mapTouchGestureState.startOffsetX = editorState.camera.offsetX;
  mapTouchGestureState.startOffsetY = editorState.camera.offsetY;
  mapTouchGestureState.startCenterX = metrics.centerX;
  mapTouchGestureState.startCenterY = metrics.centerY;
  mapTouchGestureState.startDistance = Math.max(metrics.distance, 1);
  editorState.isPointerDown = false;
  editorState.isPanning = false;
  resetRectangleDragState();
}

function updateMapPinchGesture() {
  if (!mapTouchGestureState.active) {
    return;
  }

  const metrics = getPointerPairMetrics(mapTouchGestureState.pointers);
  if (!metrics) {
    return;
  }

  const scale = metrics.distance / mapTouchGestureState.startDistance;
  const nextZoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, mapTouchGestureState.startZoom * scale),
  );
  const worldX =
    (mapTouchGestureState.startCenterX - mapTouchGestureState.startOffsetX) /
    mapTouchGestureState.startZoom;
  const worldY =
    (mapTouchGestureState.startCenterY - mapTouchGestureState.startOffsetY) /
    mapTouchGestureState.startZoom;

  editorState.camera.zoom = nextZoom;
  editorState.camera.offsetX = metrics.centerX - worldX * nextZoom;
  editorState.camera.offsetY = metrics.centerY - worldY * nextZoom;
  markDirty();
}

function stopMapTouchGesture() {
  if (mapTouchGestureState.pointers.size < 2) {
    mapTouchGestureState.active = false;
  }
  if (mapTouchGestureState.pointers.size === 0) {
    mapTouchGestureState.paintArmed = false;
    mapTouchGestureState.paintPointerId = null;
  }
}

function getTilesetViewportClientPoint(viewport, clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function applyTilesetZoomLayout(zoom = tilesetInteractionState.zoom) {
  const { canvas, overlayCanvas, stage, viewport } = tilesetInteractionState;
  if (!canvas || !overlayCanvas || !stage || !viewport) {
    return;
  }

  const scaledWidth = canvas.width * zoom;
  const scaledHeight = canvas.height * zoom;
  canvas.style.width = `${scaledWidth}px`;
  canvas.style.height = `${scaledHeight}px`;
  overlayCanvas.style.width = `${scaledWidth}px`;
  overlayCanvas.style.height = `${scaledHeight}px`;
  stage.style.width = `${scaledWidth}px`;
  stage.style.height = `${scaledHeight}px`;
}

function setTilesetZoom(nextZoom, clientX, clientY) {
  const viewport = tilesetInteractionState.viewport;
  if (!viewport) {
    return;
  }

  const previousZoom = tilesetInteractionState.zoom;
  const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
  if (clampedZoom === previousZoom) {
    return;
  }

  const rect = viewport.getBoundingClientRect();
  const localX = clientX != null ? clientX - rect.left : rect.width / 2;
  const localY = clientY != null ? clientY - rect.top : rect.height / 2;
  const contentX = (viewport.scrollLeft + localX) / previousZoom;
  const contentY = (viewport.scrollTop + localY) / previousZoom;

  tilesetInteractionState.zoom = clampedZoom;
  applyTilesetZoomLayout(clampedZoom);
  viewport.scrollLeft = contentX * clampedZoom - localX;
  viewport.scrollTop = contentY * clampedZoom - localY;
}

function startTilesetPinchGesture() {
  const metrics = getPointerPairMetrics(tilesetInteractionState.touchPointers);
  if (!metrics) {
    return;
  }

  const viewport = tilesetInteractionState.viewport;
  if (!viewport) {
    return;
  }

  const rect = viewport.getBoundingClientRect();
  const localX = metrics.centerX - rect.left;
  const localY = metrics.centerY - rect.top;

  tilesetInteractionState.gestureActive = true;
  tilesetInteractionState.gestureStartZoom = tilesetInteractionState.zoom;
  tilesetInteractionState.gestureStartDistance = Math.max(metrics.distance, 1);
  tilesetInteractionState.gestureStartCenterX = metrics.centerX;
  tilesetInteractionState.gestureStartCenterY = metrics.centerY;
  tilesetInteractionState.gestureStartOffsetX = localX;
  tilesetInteractionState.gestureStartOffsetY = localY;
  tilesetInteractionState.gestureStartScrollLeft = viewport.scrollLeft;
  tilesetInteractionState.gestureStartScrollTop = viewport.scrollTop;
  tilesetInteractionState.isPointerDown = false;
  tilesetInteractionState.isDragging = false;
  tilesetInteractionState.isPanning = false;
  tilesetInteractionState.pointerId = null;
  drawTilesetSelectionOverlay(tilesetInteractionState.overlayCanvas, tilesetInteractionState);
}

function updateTilesetPinchGesture() {
  if (!tilesetInteractionState.gestureActive) {
    return;
  }

  const metrics = getPointerPairMetrics(tilesetInteractionState.touchPointers);
  const viewport = tilesetInteractionState.viewport;
  if (!metrics || !viewport) {
    return;
  }

  const scale = metrics.distance / tilesetInteractionState.gestureStartDistance;
  const nextZoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, tilesetInteractionState.gestureStartZoom * scale),
  );
  const rect = viewport.getBoundingClientRect();
  const localX = metrics.centerX - rect.left;
  const localY = metrics.centerY - rect.top;
  const contentX =
    (tilesetInteractionState.gestureStartScrollLeft + tilesetInteractionState.gestureStartOffsetX) /
    tilesetInteractionState.gestureStartZoom;
  const contentY =
    (tilesetInteractionState.gestureStartScrollTop + tilesetInteractionState.gestureStartOffsetY) /
    tilesetInteractionState.gestureStartZoom;

  tilesetInteractionState.zoom = nextZoom;
  applyTilesetZoomLayout(nextZoom);
  viewport.scrollLeft = contentX * nextZoom - localX;
  viewport.scrollTop = contentY * nextZoom - localY;
}

function stopTilesetTouchGesture() {
  if (tilesetInteractionState.touchPointers.size < 2) {
    tilesetInteractionState.gestureActive = false;
  }
}

function renderTilesetPalette() {
  const existingViewport = elements.tilePalette.querySelector(".tileset-viewport");
  const previousScrollLeft = existingViewport?.scrollLeft ?? 0;
  const previousScrollTop = existingViewport?.scrollTop ?? 0;

  elements.tilePalette.innerHTML = "";
  const hasTiles = editorState.tileset.tiles.length > 0;
  elements.paletteEmptyState.hidden = hasTiles;
  elements.tilePalette.hidden = !hasTiles;

  if (!hasTiles) {
    updateMetaText();
    return;
  }

  const viewport = document.createElement("div");
  viewport.className = "tileset-viewport";
  viewport.tabIndex = 0;
  viewport.style.touchAction = "none";

  const stage = document.createElement("div");
  stage.className = "tileset-stage";

  const canvas = document.createElement("canvas");
  canvas.className = "tileset-canvas";
  canvas.width = editorState.tileset.image.width;
  canvas.height = editorState.tileset.image.height;
  canvas.setAttribute("aria-label", "Tileset preview");
  canvas.style.touchAction = "none";

  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.className = "tileset-overlay";
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  overlayCanvas.style.touchAction = "none";
  tilesetInteractionState.gridStepX = Math.max(
    1,
    (Number(editorState.tileset.tileWidth) || DEFAULT_TILE_SIZE) +
      (Number(editorState.tileset.spacing) || 0),
  );
  tilesetInteractionState.gridStepY = Math.max(
    1,
    (Number(editorState.tileset.tileHeight) || DEFAULT_TILE_SIZE) +
      (Number(editorState.tileset.spacing) || 0),
  );
  tilesetInteractionState.gridOffsetX = Math.max(0, Number(editorState.tileset.margin) || 0);
  tilesetInteractionState.gridOffsetY = Math.max(0, Number(editorState.tileset.margin) || 0);
  tilesetInteractionState.gridColor = "rgba(255, 255, 255, 0.12)";
  tilesetInteractionState.viewport = viewport;
  tilesetInteractionState.stage = stage;
  tilesetInteractionState.canvas = canvas;
  tilesetInteractionState.overlayCanvas = overlayCanvas;
  applyTilesetZoomLayout();

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(editorState.tileset.image, 0, 0);

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1;

  for (const tile of editorState.tileset.tiles) {
    ctx.strokeRect(
      tile.sourceX + 0.5,
      tile.sourceY + 0.5,
      tile.sourceWidth - 1,
      tile.sourceHeight - 1,
    );
  }

  const selectedTileIndices =
    editorState.selectedTileIndices.length > 0
      ? editorState.selectedTileIndices
      : editorState.selectedTileIndex >= 0
        ? [editorState.selectedTileIndex]
        : [];

  for (const tileIndex of selectedTileIndices) {
    const selectedTile = editorState.tileset.tiles[tileIndex];
    if (!selectedTile) continue;

    ctx.strokeStyle = "#f6cb7d";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      selectedTile.sourceX + 0.5,
      selectedTile.sourceY + 0.5,
      selectedTile.sourceWidth - 1,
      selectedTile.sourceHeight - 1,
    );
  }

  ctx.restore();

  const scrollContainer = viewport;

  const getTileAtPoint = (x, y) =>
    editorState.tileset.tiles.find(
      (entry) =>
        x >= entry.sourceX &&
        x < entry.sourceX + entry.sourceWidth &&
        y >= entry.sourceY &&
        y < entry.sourceY + entry.sourceHeight,
    );

  const getPointFromEvent = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handleTilesetPointerDown = (event) => {
    tilesetInteractionState.isPointerDown = true;
    tilesetInteractionState.isDragging = false;
    tilesetInteractionState.isPanning = editorState.spacePressed || event.button === 1;
    tilesetInteractionState.pointerId = event.pointerId;

    const point = getPointFromEvent(event);
    tilesetInteractionState.startX = point.x;
    tilesetInteractionState.startY = point.y;
    tilesetInteractionState.startClientX = event.clientX;
    tilesetInteractionState.startClientY = event.clientY;
    tilesetInteractionState.currentX = point.x;
    tilesetInteractionState.currentY = point.y;

    if (tilesetInteractionState.isPanning) {
      event.preventDefault();
      tilesetInteractionState.startScrollLeft = scrollContainer.scrollLeft;
      tilesetInteractionState.startScrollTop = scrollContainer.scrollTop;
      return;
    }

    const tile = getTileAtPoint(point.x, point.y);
    if (!tile) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      const nextIndices = editorState.selectedTileIndices.length > 0
        ? [...editorState.selectedTileIndices]
        : editorState.selectedTileIndex >= 0
          ? [editorState.selectedTileIndex]
          : [];
      const existingIndex = nextIndices.indexOf(tile.index);
      if (existingIndex >= 0) {
        nextIndices.splice(existingIndex, 1);
      } else {
        nextIndices.push(tile.index);
      }
      setSelectedTiles(nextIndices, {
        primaryIndex: tile.index,
        statusMessage: `Toggled tile #${tile.index}.`,
      });
      tilesetInteractionState.isPointerDown = false;
    }
  };

  const handleTilesetPointerMove = (event) => {
    if (event.pointerType === "touch" && tilesetInteractionState.touchPointers.has(event.pointerId)) {
      event.preventDefault();
      tilesetInteractionState.touchPointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (tilesetInteractionState.touchPointers.size >= 2) {
        if (!tilesetInteractionState.gestureActive) {
          startTilesetPinchGesture();
        }
        updateTilesetPinchGesture();
        return;
      }
    }

    if (tilesetInteractionState.gestureActive) {
      return;
    }

    if (!tilesetInteractionState.isPointerDown) {
      return;
    }

    if (tilesetInteractionState.isPanning) {
      event.preventDefault();
      scrollContainer.scrollLeft =
        tilesetInteractionState.startScrollLeft -
        (event.clientX - tilesetInteractionState.startClientX);
      scrollContainer.scrollTop =
        tilesetInteractionState.startScrollTop -
        (event.clientY - tilesetInteractionState.startClientY);
      return;
    }

    const point = getPointFromEvent(event);
    tilesetInteractionState.currentX = point.x;
    tilesetInteractionState.currentY = point.y;
    const dx = point.x - tilesetInteractionState.startX;
    const dy = point.y - tilesetInteractionState.startY;
    if (!tilesetInteractionState.isDragging && Math.hypot(dx, dy) > 4) {
      tilesetInteractionState.isDragging = true;
    }
    drawTilesetSelectionOverlay(overlayCanvas, tilesetInteractionState);
  };

  const handleTilesetPointerUp = (event) => {
    if (event.pointerType === "touch") {
      tilesetInteractionState.touchPointers.delete(event.pointerId);
      stopTilesetTouchGesture();
      if (tilesetInteractionState.gestureActive) {
        event.preventDefault();
        return;
      }
    }

    if (!tilesetInteractionState.isPointerDown || tilesetInteractionState.pointerId !== event.pointerId) {
      return;
    }

    if (tilesetInteractionState.isPanning) {
      tilesetInteractionState.isPointerDown = false;
      tilesetInteractionState.isPanning = false;
      drawTilesetSelectionOverlay(overlayCanvas, tilesetInteractionState);
      return;
    }

    const point = getPointFromEvent(event);
    const tile = getTileAtPoint(point.x, point.y);

    if (!tilesetInteractionState.isDragging) {
      if (!tile) {
        tilesetInteractionState.isPointerDown = false;
        return;
      }

      setSelectedTiles([tile.index], {
        primaryIndex: tile.index,
        statusMessage: `Selected tile #${tile.index}.`,
      });
      editorState.tool = "brush";
      tilesetInteractionState.isPointerDown = false;
      drawTilesetSelectionOverlay(overlayCanvas, tilesetInteractionState);
      return;
    }

    const minX = Math.min(tilesetInteractionState.startX, point.x);
    const maxX = Math.max(tilesetInteractionState.startX, point.x);
    const minY = Math.min(tilesetInteractionState.startY, point.y);
    const maxY = Math.max(tilesetInteractionState.startY, point.y);
    const nextIndices = editorState.tileset.tiles
      .filter((entry) =>
        entry.sourceX < maxX &&
        entry.sourceX + entry.sourceWidth > minX &&
        entry.sourceY < maxY &&
        entry.sourceY + entry.sourceHeight > minY,
      )
      .map((entry) => entry.index);

    if (nextIndices.length > 0) {
      setSelectedTiles(nextIndices, {
        primaryIndex: nextIndices.at(-1) ?? -1,
        statusMessage:
          nextIndices.length === 1
            ? `Selected tile #${nextIndices[0]}.`
            : `Selected ${nextIndices.length} tiles.`,
      });
      editorState.tool = "brush";
    }

    tilesetInteractionState.isPointerDown = false;
    tilesetInteractionState.isDragging = false;
    drawTilesetSelectionOverlay(overlayCanvas, tilesetInteractionState);
  };

  const handleTilesetPointerLeave = (event) => {
    if (event?.type === "pointerleave" && tilesetInteractionState.touchPointers.size > 0) {
      return;
    }

    tilesetInteractionState.isPointerDown = false;
    tilesetInteractionState.isDragging = false;
    tilesetInteractionState.isPanning = false;
    tilesetInteractionState.pointerId = null;
    tilesetInteractionState.gestureActive = false;
    tilesetInteractionState.touchPointers.clear();
    drawTilesetSelectionOverlay(overlayCanvas, tilesetInteractionState);
  };

  [canvas, viewport].forEach((target) => {
    target.addEventListener("pointerdown", (event) => {
      if (target === viewport && event.target !== viewport) {
        return;
      }

      if (target === canvas) {
        canvas.setPointerCapture(event.pointerId);
      } else if (event.pointerType === "touch") {
        viewport.setPointerCapture(event.pointerId);
      } else if (!editorState.spacePressed && event.button !== 1 && event.pointerType !== "touch") {
        return;
      }

      if (event.pointerType === "touch") {
        event.preventDefault();
        tilesetInteractionState.touchPointers.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
        if (tilesetInteractionState.touchPointers.size === 2) {
          startTilesetPinchGesture();
          return;
        }
      }

      handleTilesetPointerDown(event);
    });
  });

  viewport.addEventListener("pointermove", handleTilesetPointerMove);
  viewport.addEventListener("pointerup", handleTilesetPointerUp);
  viewport.addEventListener("pointercancel", handleTilesetPointerLeave);
  viewport.addEventListener("pointerleave", handleTilesetPointerLeave);

  stage.append(canvas, overlayCanvas);
  viewport.append(stage);
  elements.tilePalette.append(viewport);
  viewport.scrollLeft = previousScrollLeft;
  viewport.scrollTop = previousScrollTop;
  drawTilesetSelectionOverlay(overlayCanvas, tilesetInteractionState);
  updateMetaText();
}

function sliceTilesetFromImage(image, config = {}) {
  const existingSources = Array.isArray(editorState.tileset.sources)
    ? editorState.tileset.sources
    : [];
  const combinedSources = existingSources.concat({
    id: `sheet_${existingSources.length + 1}`,
    image,
    width: image.width,
    height: image.height,
    spacing: Number(config.spacing ?? elements.tileSpacingInput.value) || 0,
    margin: Number(config.margin ?? elements.tileMarginInput.value) || 0,
  });
  const rebuilt = rebuildTilesetFromSources(editorState.tileset.image, combinedSources, config);
  const primarySource = rebuilt.sources[0] || rebuilt.sources.at(-1) || null;

  editorState.tileset = {
    name: (config.name ?? elements.tilesetNameInput.value.trim()) || "tileset",
    reference:
      (config.reference ?? editorState.tileset.reference ?? "tileset.png") || "tileset.png",
    tileWidth: primarySource?.tileWidth || DEFAULT_TILE_SIZE,
    tileHeight: primarySource?.tileHeight || DEFAULT_TILE_SIZE,
    spacing: primarySource?.spacing || 0,
    margin: primarySource?.margin || 0,
    columns: primarySource?.columns || 0,
    rows: primarySource?.rows || 0,
    count: rebuilt.tiles.length,
    imageSrc: rebuilt.image ? rebuilt.image.toDataURL("image/png") : "",
    image: rebuilt.image,
    sources: rebuilt.sources,
    tiles: rebuilt.tiles,
  };

  editorState.map.tileWidth = primarySource?.tileWidth || DEFAULT_TILE_SIZE;
  editorState.map.tileHeight = primarySource?.tileHeight || DEFAULT_TILE_SIZE;
  syncMapInputs();

  if (editorState.selectedTileIndex >= rebuilt.tiles.length) {
    editorState.selectedTileIndex = rebuilt.tiles.length > 0 ? 0 : -1;
  }

  if (editorState.selectedTileIndex < 0 && rebuilt.tiles.length > 0) {
    editorState.selectedTileIndex = 0;
  }

  editorState.selectedTileIndices = normalizeTileIndices(
    editorState.selectedTileIndices,
    rebuilt.tiles.length,
  );
  if (editorState.selectedTileIndices.length === 0 && editorState.selectedTileIndex >= 0) {
    editorState.selectedTileIndices = [editorState.selectedTileIndex];
  }
  if (editorState.selectedTileIndices.length === 0 && rebuilt.tiles.length > 0) {
    editorState.selectedTileIndices = [0];
    editorState.selectedTileIndex = 0;
  }
  editorState.selectedTileIndex =
    editorState.selectedTileIndices.at(-1) ?? editorState.selectedTileIndex;
  editorState.selectedTilePaintCursor = 0;
}

async function appendTilesetFromFile(file) {
  const src = await readFileAsDataUrl(file);
  const image = await createImage(src);
  sliceTilesetFromImage(image);
}

async function loadTilesetFromFile(file) {
  return loadTilesetsFromFiles([file]);
}

async function loadTilesetsFromFiles(files) {
  const nextFiles = Array.from(files || []).filter(Boolean);
  if (nextFiles.length === 0) {
    updateStatus("Choose one or more spritesheets first.");
    return;
  }

  const startTileCount = editorState.tileset.count;
  const startSheetCount = editorState.tileset.sources.length;
  const failures = [];

  const validSheets = [];
  for (const file of nextFiles) {
    try {
      const src = await readFileAsDataUrl(file);
      const image = await createImage(src);
      validSheets.push({ file, image });
    } catch (error) {
      failures.push(`${file.name}: ${error?.message || "Could not load spritesheet."}`);
    }
  }

  if (validSheets.length === 0) {
    throw new Error(failures[0] || "Could not load any spritesheets.");
  }

  const baseImage = editorState.tileset.image;
  const baseSources = Array.isArray(editorState.tileset.sources) ? [...editorState.tileset.sources] : [];
  const name = elements.tilesetNameInput.value.trim() || editorState.tileset.name || "tileset";
  const reference = editorState.tileset.reference || "tileset.png";

  const combinedSources = baseSources.concat(
    validSheets.map(({ file, image }, index) => ({
      id: `sheet_${baseSources.length + index + 1}`,
      image,
      width: image.width,
      height: image.height,
      spacing: Number(elements.tileSpacingInput.value) || 0,
      margin: Number(elements.tileMarginInput.value) || 0,
      name: file.name,
    })),
  );
  const rebuilt = rebuildTilesetFromSources(baseImage, combinedSources, {
    name,
    reference,
    spacing: Number(elements.tileSpacingInput.value) || 0,
    margin: Number(elements.tileMarginInput.value) || 0,
  });
  const primarySource = rebuilt.sources[0] || rebuilt.sources.at(-1) || null;

  editorState.tileset = {
    ...editorState.tileset,
    name,
    reference,
    tileWidth: primarySource?.tileWidth || editorState.tileset.tileWidth || DEFAULT_TILE_SIZE,
    tileHeight: primarySource?.tileHeight || editorState.tileset.tileHeight || DEFAULT_TILE_SIZE,
    spacing: primarySource?.spacing || 0,
    margin: primarySource?.margin || 0,
    columns: primarySource?.columns || 0,
    rows: primarySource?.rows || 0,
    count: rebuilt.tiles.length,
    imageSrc: rebuilt.image ? rebuilt.image.toDataURL("image/png") : "",
    image: rebuilt.image,
    sources: rebuilt.sources,
    tiles: rebuilt.tiles,
  };
  editorState.selectedTileIndices = normalizeTileIndices(
    editorState.selectedTileIndices,
    rebuilt.tiles.length,
  );
  if (editorState.selectedTileIndices.length === 0 && editorState.selectedTileIndex >= 0) {
    editorState.selectedTileIndices = [editorState.selectedTileIndex];
  }
  if (editorState.selectedTileIndices.length === 0 && rebuilt.tiles.length > 0) {
    editorState.selectedTileIndices = [0];
    editorState.selectedTileIndex = 0;
  }
  editorState.selectedTileIndex =
    editorState.selectedTileIndices.at(-1) ?? editorState.selectedTileIndex;
  editorState.selectedTilePaintCursor = 0;

  tilesetInteractionState.zoom = 1;
  rebuildMapSurface();
  renderTilesetPalette();
  persistProject();

  const addedSheets = editorState.tileset.sources.length - startSheetCount;
  const addedTiles = editorState.tileset.count - startTileCount;
  const sheetLabel = addedSheets === 1 ? "spritesheet" : "spritesheets";
  const tileLabel = addedTiles === 1 ? "tile" : "tiles";
  const summary = `Appended ${addedSheets} ${sheetLabel} (${addedTiles} ${tileLabel}).`;
  updateStatus(
    failures.length > 0
      ? `${summary} Skipped ${failures.length} file${failures.length === 1 ? "" : "s"}.`
      : summary,
  );
  closeImportPopup();
  elements.tilesheetInput.value = "";
  markDirty();
}

function clearTileset() {
  const confirmed = window.confirm(
    "Clear the current tileset? This will remove the loaded spritesheet and reset the tile selection.",
  );
  if (!confirmed) {
    return;
  }

  pushUndoState();
  editorState.tileset = {
    name: "tileset",
    reference: "tileset.png",
    tileWidth: editorState.map.tileWidth,
    tileHeight: editorState.map.tileHeight,
    spacing: 0,
    margin: 0,
    columns: 0,
    rows: 0,
    count: 0,
    imageSrc: "",
    image: null,
    sources: [],
    tiles: [],
  };
  editorState.selectedTileIndex = -1;
  editorState.selectedTileIndices = [];
  editorState.selectedTilePaintCursor = 0;
  tilesetInteractionState.zoom = 1;
  resetLayerData();
  rebuildMapSurface();
  renderLayerList();
  renderTilesetPalette();
  persistProject();
  updateStatus("Tileset cleared.");
  closeImportPopup();
  markDirty();
}

function clearMap() {
  pushUndoState();
  for (const layer of editorState.map.layers) {
    layer.data = createLayerData(editorState.map.columns, editorState.map.rows);
  }

  rebuildMapSurface();
  renderLayerList();
  persistProject();
  updateStatus("Map cleared.");
  markDirty();
}

function buildEditorProject() {
  return {
    version: PROJECT_DATA_VERSION,
    editor: "Pixel Tools Studio",
    project: {
      id: editorState.project.id,
      name: editorState.project.name,
    },
    tileset: {
      name: editorState.tileset.name,
      reference: editorState.tileset.reference,
      imageSrc: editorState.tileset.imageSrc,
      tileWidth: editorState.tileset.tileWidth,
      tileHeight: editorState.tileset.tileHeight,
      spacing: editorState.tileset.spacing,
      margin: editorState.tileset.margin,
      columns: editorState.tileset.columns,
      rows: editorState.tileset.rows,
      count: editorState.tileset.count,
      sources: editorState.tileset.sources,
    },
    map: {
      columns: editorState.map.columns,
      rows: editorState.map.rows,
      tileWidth: editorState.map.tileWidth,
      tileHeight: editorState.map.tileHeight,
      backgroundColor: editorState.map.backgroundColor,
      gridColor: editorState.map.gridColor,
      activeLayer: editorState.map.activeLayer,
      layers: editorState.map.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        hidden: Boolean(layer.hidden),
        block: Boolean(layer.block),
        data: layer.data,
      })),
    },
    selectedTileIndex: editorState.selectedTileIndex,
    selectedTileIndices: editorState.selectedTileIndices,
    showGrid: editorState.showGrid,
  };
}

function buildExportEditorProject() {
  const project = buildEditorProject();
  project.tileset.reference = getExportTilesetReference();
  return project;
}

function exportEditorJson() {
  const blob = new Blob([JSON.stringify(buildExportEditorProject(), null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, `${getExportProjectBaseName()}.json`);
  updateStatus("Editor JSON exported.");
  closeExportPopup();
}

function buildGameExport(format) {
  if (format === "phaser") {
    return buildTiledMapExport();
  }

  if (format === "tiled") {
    return buildTiledMapExport();
  }

  if (format === "unity") {
    return buildUnityMapExport();
  }

  return buildTiledMapExport();
}

async function exportGameJson() {
  const format = elements.engineFormatSelect.value;
  const baseName = getExportProjectBaseName();
  const mainFilename = `${baseName}.json`;
  const imageFilename = `${baseName}.png`;
  const mainContent = JSON.stringify(buildGameExport(format), null, 2);
  const zipFilename = `${baseName}.zip`;

  const zipped = await downloadZipBundle({
    zipFilename,
    mainFilename,
    mainContent,
    imageFilename,
  });

  if (!zipped) {
    const blob = new Blob([mainContent], { type: "application/json" });
    triggerDownload(blob, mainFilename);
    downloadCurrentTilesetPng(imageFilename);
  }

  const formatLabel =
    format === "phaser"
      ? "Phaser standard"
      : format === "tiled"
        ? "Tiled JSON"
        : "Unity";
  updateStatus(
    `${formatLabel} ZIP exported.`,
  );
  closeExportPopup();
}

async function exportCsv() {
  const lines = getActiveLayer().data.map((row) => row.join(","));
  const baseName = getExportProjectBaseName();
  const mainFilename = `${baseName}.csv`;
  const imageFilename = `${baseName}.png`;
  const mainContent = lines.join("\n");
  const zipFilename = `${baseName}.zip`;

  const zipped = await downloadZipBundle({
    zipFilename,
    mainFilename,
    mainContent,
    imageFilename,
  });

  if (!zipped) {
    const blob = new Blob([mainContent], { type: "text/csv" });
    triggerDownload(blob, mainFilename);
    downloadCurrentTilesetPng(imageFilename);
  }

  updateStatus("CSV ZIP exported.");
  closeExportPopup();
}

async function importProject(file) {
  const raw = JSON.parse(await file.text());

  if (!raw.map || !raw.tileset) {
    throw new Error("Unsupported JSON structure.");
  }

  pushUndoState();
  const rawLayers = Array.isArray(raw.map.layers) ? raw.map.layers : [];
  await applyProjectData(
    {
      ...raw,
      project: {
        id: editorState.project.id || createProjectId(),
        name: getProjectName(raw.project?.name || editorState.project.name),
      },
      map: {
        ...raw.map,
        layers: rawLayers,
        activeLayer: Number.isInteger(raw.map.activeLayer) ? raw.map.activeLayer : 0,
      },
    },
    {
      persist: true,
      statusMessage: "Project imported.",
      closeImport: true,
    },
  );
  editorState.project.isOpen = true;
}

function persistProject() {
  const project = buildEditorProject();
  upsertStoredProject(project);
  setActiveProjectMeta(project.project);
}

async function loadFromLocalStorage() {
  const projectId = elements.projectSelect.value || editorState.project.id;
  if (!projectId) {
    updateStatus("No saved project found in this browser.");
    return;
  }

  await loadStoredProject(projectId, "Selected project loaded.");
}

async function restoreStartupProject() {
  migrateLegacyProject();

  const projects = getStoredProjects();
  const activeProjectId = window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const starterProject = activeProject?.data || createDefaultProjectData(DEFAULT_PROJECT_NAME);

  try {
    await applyProjectData(starterProject, {
      persist: false,
      statusMessage:
        projects.length > 0
          ? "Choose a saved project or create a new one."
          : "Create your first project to begin.",
    });
    editorState.project.isOpen = projects.length > 0;
    openProjectsPopup();
  } catch {
    await applyProjectData(createDefaultProjectData(DEFAULT_PROJECT_NAME), {
      persist: false,
      statusMessage: "Choose a saved project or create a new one.",
    });
    editorState.project.isOpen = false;
    openProjectsPopup();
  }
}

function handlePointerMove(event) {
  if (event.pointerType === "touch") {
    const touchPoint = mapTouchGestureState.pointers.get(event.pointerId);
    if (touchPoint) {
      touchPoint.clientX = event.clientX;
      touchPoint.clientY = event.clientY;
      if (mapTouchGestureState.pointers.size >= 2) {
        updateMapPinchGesture();
        return;
      }
      if (mapTouchGestureState.paintArmed && mapTouchGestureState.paintPointerId === event.pointerId) {
        const movedDistance = Math.hypot(
          event.clientX - mapTouchGestureState.paintStartClientX,
          event.clientY - mapTouchGestureState.paintStartClientY,
        );
        if (movedDistance < 6) {
          return;
        }
        editorState.isPointerDown = true;
      }
    }
  }

  if (mapTouchGestureState.active) {
    return;
  }

  const cell = screenToCell(event.clientX, event.clientY);
  editorState.hoveredCell = cell;

  if (editorState.isPanning) {
    editorState.camera.offsetX += event.movementX;
    editorState.camera.offsetY += event.movementY;
    markDirty();
    return;
  }

  if (editorState.isPointerDown && editorState.tool === "rectangle") {
    if (cell) {
      mapRectangleState.currentCell = cell;
      mapRectangleState.isDragging = true;
    }
    markDirty();
    return;
  }

  if (editorState.isPointerDown && editorState.tool) {
    applyToolToCell(cell);
  } else {
    markDirty();
  }
}

function bindEvents() {
  applyLanguage(getUiLanguage());

  elements.languageSelect.addEventListener("change", () => {
    setUiLanguage(elements.languageSelect.value);
  });

  elements.brushToolBtn.addEventListener("click", () => setTool("brush"));
  elements.rectangleToolBtn.addEventListener("click", () => setTool("rectangle"));
  elements.eraseToolBtn.addEventListener("click", () => setTool("erase"));
  elements.undoBtn.addEventListener("click", () => {
    void undoLastAction();
  });
  elements.redoBtn.addEventListener("click", () => {
    void redoLastAction();
  });
  elements.openProjectsPopupBtn.addEventListener("click", openProjectsPopup);
  elements.closeProjectsPopupBtn.addEventListener("click", closeProjectsPopup);
  elements.projectsPopupBackdrop.addEventListener("click", closeProjectsPopup);
  elements.openShortcutsPopupBtn.addEventListener("click", openShortcutsPopup);
  elements.closeShortcutsPopupBtn.addEventListener("click", closeShortcutsPopup);
  elements.shortcutsPopupBackdrop.addEventListener("click", closeShortcutsPopup);
  elements.openImportPopupBtn.addEventListener("click", openImportPopup);
  elements.closeImportPopupBtn.addEventListener("click", closeImportPopup);
  elements.importPopupBackdrop.addEventListener("click", closeImportPopup);
  elements.openExportPopupBtn.addEventListener("click", openExportPopup);
  elements.deleteLocalProjectBtn.addEventListener("click", async () => {
    await deleteCurrentProjectFromLocal();
  });
  elements.closeExportPopupBtn.addEventListener("click", closeExportPopup);
  elements.exportPopupBackdrop.addEventListener("click", closeExportPopup);
  elements.zoomInBtn.addEventListener("click", () => {
    const rect = elements.mapCanvas.getBoundingClientRect();
    zoomAt(ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  elements.zoomOutBtn.addEventListener("click", () => {
    const rect = elements.mapCanvas.getBoundingClientRect();
    zoomAt(1 / ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  elements.resetViewBtn.addEventListener("click", resetCamera);
  elements.toggleGridBtn.addEventListener("click", () => {
    editorState.showGrid = !editorState.showGrid;
    syncToolbarState();
    persistProject();
    markDirty();
  });
  elements.fullscreenBtn.addEventListener("click", () => {
    void toggleFullscreenMode();
  });
  document.addEventListener("fullscreenchange", () => {
    syncToolbarState();
    markDirty();
  });
  document.addEventListener(
    "touchmove",
    (event) => {
      if (!isIpadLikeDevice() || !isEditorFullscreenActive()) {
        return;
      }

      event.preventDefault();
    },
    { passive: false },
  );

  elements.sliceTilesheetBtn.addEventListener("click", async () => {
    try {
      await loadTilesetsFromFiles(elements.tilesheetInput.files);
    } catch (error) {
      updateStatus(error.message);
    }
  });

  elements.clearTilesetBtn.addEventListener("click", clearTileset);
  elements.addLayerBtn.addEventListener("click", addLayout);
  elements.applyMapSizeBtn.addEventListener("click", resizeMapPreservingData);
  elements.clearMapBtn.addEventListener("click", clearMap);
  elements.resetSetupBtn.addEventListener("click", resetMapSetup);
  elements.createProjectBtn.addEventListener("click", async () => {
    await createProject(elements.projectNameInput.value);
  });
  elements.loadProjectBtn.addEventListener("click", async () => {
    await loadFromLocalStorage();
  });
  elements.saveLocalBtn.addEventListener("click", () => {
    persistProject();
    updateStatus(`Saved "${editorState.project.name}" to this browser.`);
  });

  elements.exportEditorJsonBtn.addEventListener("click", exportEditorJson);
  elements.exportGameJsonBtn.addEventListener("click", exportGameJson);
  elements.exportCsvBtn.addEventListener("click", exportCsv);
  elements.importJsonBtn.addEventListener("click", () => {
    elements.importJsonInput.click();
  });
  elements.importJsonInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;

    try {
      await importProject(file);
    } catch (error) {
      updateStatus(error.message);
    }

    event.target.value = "";
  });

  if (elements.tilesetReferenceInput) {
    elements.tilesetReferenceInput.addEventListener("change", () => {
      editorState.tileset.reference = elements.tilesetReferenceInput.value.trim() || "tileset.png";
      persistProject();
    });
  }

  [elements.mapBackgroundColorInput, elements.gridColorInput].forEach((input) => {
    input.addEventListener("change", () => {
      pushUndoState();
      editorState.map.backgroundColor = elements.mapBackgroundColorInput.value;
      editorState.map.gridColor = elements.gridColorInput.value;
      rebuildMapSurface();
      persistProject();
      markDirty();
    });
  });

  elements.mapCanvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  elements.mapCanvas.addEventListener("pointerdown", (event) => {
    elements.mapCanvas.setPointerCapture(event.pointerId);
    editorState.isPanning = event.button === 1 || editorState.spacePressed;

    if (event.pointerType === "touch") {
      event.preventDefault();
      mapTouchGestureState.pointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
      mapTouchGestureState.paintArmed = true;
      mapTouchGestureState.paintPointerId = event.pointerId;
      mapTouchGestureState.paintStartClientX = event.clientX;
      mapTouchGestureState.paintStartClientY = event.clientY;
      editorState.isPointerDown = false;
      editorState.isPanning = false;
      if (mapTouchGestureState.pointers.size === 2) {
        startMapPinchGesture();
        return;
      }
      event.preventDefault();
      return;
    }

    editorState.isPointerDown = true;

    if (mapTouchGestureState.active) {
      event.preventDefault();
      return;
    }

    const cell = screenToCell(event.clientX, event.clientY);
    editorState.hoveredCell = cell;

    if (event.button === 2) {
      pickTileFromMap(cell);
      editorState.isPointerDown = false;
      markDirty();
      return;
    }

    if (editorState.isPanning || event.buttons === 4) {
      markDirty();
      return;
    }

    if (editorState.tool === "rectangle") {
      const selectedTileIndex = getSelectedRectangleTileIndex();
      if (selectedTileIndex < 0) {
        editorState.isPointerDown = false;
        updateStatus("Select a tile from the tileset first.");
        markDirty();
        return;
      }

      if (!cell) {
        editorState.isPointerDown = false;
        markDirty();
        return;
      }

      mapRectangleState.isDragging = false;
      mapRectangleState.startCell = cell;
      mapRectangleState.currentCell = cell;
      mapRectangleState.pointerId = event.pointerId;
      markDirty();
      return;
    }

    if (cell) {
      const currentValue = getActiveLayer().data[cell.row][cell.column];
      const willErase = editorState.tool === "erase" && currentValue !== -1;
      const willPaint =
        editorState.tool === "brush" &&
        editorState.selectedTileIndex >= 0 &&
        currentValue !== editorState.selectedTileIndex;

      if (willErase || willPaint) {
        pushUndoState();
      }
    }

    applyToolToCell(cell);
  });

  elements.mapCanvas.addEventListener("pointermove", handlePointerMove);
  elements.mapCanvas.addEventListener("pointercancel", (event) => {
    mapTouchGestureState.pointers.delete(event.pointerId);
    if (mapTouchGestureState.paintPointerId === event.pointerId) {
      mapTouchGestureState.paintArmed = false;
      mapTouchGestureState.paintPointerId = null;
    }
    stopMapTouchGesture();
  });
  elements.mapCanvas.addEventListener("pointerleave", () => {
    editorState.hoveredCell = null;
    markDirty();
  });

  window.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") {
      mapTouchGestureState.pointers.delete(event.pointerId);
      if (mapTouchGestureState.paintPointerId === event.pointerId) {
        mapTouchGestureState.paintArmed = false;
        mapTouchGestureState.paintPointerId = null;
      }
      stopMapTouchGesture();
    }

    if (
      editorState.tool === "rectangle" &&
      mapRectangleState.startCell &&
      mapRectangleState.currentCell
    ) {
      const selectedTileIndex = getSelectedRectangleTileIndex();
      const shouldPaint = rectangleWouldChange(
        mapRectangleState.startCell,
        mapRectangleState.currentCell,
        selectedTileIndex,
      );

      if (shouldPaint) {
        pushUndoState();
        applyRectangleToCells(
          mapRectangleState.startCell,
          mapRectangleState.currentCell,
          selectedTileIndex,
        );
      }
    }

    editorState.isPointerDown = false;
    editorState.isPanning = false;
    resetRectangleDragState();
    markDirty();
  });

  elements.mapCanvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomAt(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, event.clientX, event.clientY);
  });

  window.addEventListener("resize", markDirty);

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && event.shiftKey) {
      event.preventDefault();
      redoLastAction();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoLastAction();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoLastAction();
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      editorState.spacePressed = true;
    }

    if (event.key === "b" || event.key === "B") {
      setTool("brush");
    } else if (event.key === "r" || event.key === "R") {
      setTool("rectangle");
    } else if (event.key === "e" || event.key === "E") {
      setTool("erase");
    } else if (event.key === "q" || event.key === "Q") {
      event.preventDefault();
      const rect = elements.mapCanvas.getBoundingClientRect();
      zoomAt(1 / ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else if (event.key === "w" || event.key === "W") {
      event.preventDefault();
      const rect = elements.mapCanvas.getBoundingClientRect();
      zoomAt(ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else if (event.key === "g" || event.key === "G") {
      editorState.showGrid = !editorState.showGrid;
      syncToolbarState();
      persistProject();
      markDirty();
    } else if (event.key === "0") {
      resetCamera();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      panCamera(KEYBOARD_PAN_STEP, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      panCamera(-KEYBOARD_PAN_STEP, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      panCamera(0, KEYBOARD_PAN_STEP);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      panCamera(0, -KEYBOARD_PAN_STEP);
    } else if (event.key === "Escape") {
      if (!elements.projectsPopup.hidden) {
        closeProjectsPopup();
      }

      if (!elements.shortcutsPopup.hidden) {
        closeShortcutsPopup();
      }

      if (!elements.importPopup.hidden) {
        closeImportPopup();
      }

      if (!elements.exportPopup.hidden) {
        closeExportPopup();
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      editorState.spacePressed = false;
    }
  });
}

bindEvents();
restoreStartupProject();
