const $ = (id) => document.getElementById(id);
const THEME_STORAGE_KEY = "horizon-theme";
const BRAND_LOGO = "./assets/horizon-brand-premium.jpeg";
const THEME_LOGOS = {
  light: BRAND_LOGO,
  dark: BRAND_LOGO,
};
const BROWSER_MODE_NOTICE_KEY = "horizon-browser-mode-notice-v1";
const PRINT_JOB_STORAGE_KEY = "horizon-print-jobs-v1";
const PRINT_JOB_TTL_MS = 15 * 60 * 1000;
const PRINT_PAGE_FILENAME = "print.html";
const SIDEBAR_STORAGE_KEY = "horizon-sidebar-mode";
const DASHBOARD_FILTERS_STORAGE_KEY = "horizon-dashboard-filters-v2";
const SIDEBAR_MOBILE_MAX_WIDTH = 780;
const SIDEBAR_TABLET_MAX_WIDTH = 1100;
const runtimeState = {
  apiMode: null,
  apiProbe: null,
  sidebarViewport: null,
  sidebarMode: "expanded",
  sidebarOpen: false,
};
const UI_ICONS = {
  dashboard:
    '<path d="M4 19.5h16" /><path d="M7 16V10" /><path d="M12 16V5" /><path d="M17 16v-7" />',
  notes:
    '<rect x="5" y="3.75" width="14" height="16.5" rx="2.5" /><path d="M9 8.5h6" /><path d="M9 12h6" /><path d="M9 15.5h4" />',
  inventory:
    '<path d="M4.75 8.25 12 4l7.25 4.25v7.5L12 20l-7.25-4.25z" /><path d="M12 20v-7.5" /><path d="M4.75 8.25 12 12.5l7.25-4.25" />',
  fuel:
    '<path d="M7 20V7.5A2.5 2.5 0 0 1 9.5 5H14a2 2 0 0 1 2 2v13" /><path d="M7 11h9" /><path d="M16 8h1.5a2.5 2.5 0 0 1 2.5 2.5V17a2 2 0 0 1-2 2h-1" /><path d="M18.5 8V5.5" />',
  schedules:
    '<rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3.5v3" /><path d="M16 3.5v3" /><path d="M4 9.5h16" /><path d="M8.5 13h3" /><path d="M14 13h1.5" /><path d="M8.5 16h7" />',
  fines:
    '<path d="M12 4.5 20 19H4L12 4.5Z" /><path d="M12 10v4.5" /><path d="M12 17.2h.01" />',
  checklists:
    '<rect x="6" y="4.5" width="12" height="15.5" rx="2.5" /><path d="M9 4.5h6v3H9z" /><path d="m9.5 13 1.8 1.8 3.7-4" />',
  emails:
    '<rect x="4" y="6" width="16" height="12" rx="2.5" /><path d="m5 8 7 5 7-5" />',
  admin:
    '<circle cx="12" cy="12" r="3.25" /><path d="M12 2.75v2.1" /><path d="M12 19.15v2.1" /><path d="m4.93 4.93 1.49 1.49" /><path d="m17.58 17.58 1.49 1.49" /><path d="M2.75 12h2.1" /><path d="M19.15 12h2.1" /><path d="m4.93 19.07 1.49-1.49" /><path d="m17.58 6.42 1.49-1.49" />',
  analytics:
    '<path d="M4 19.5h16" /><path d="m6.5 15.5 3.4-3.4 2.7 2.7 4.9-5.3" /><path d="M17.5 9.5H20V12" />',
  efficiency:
    '<path d="M5 16a7 7 0 1 1 14 0" /><path d="m12 12 3.5-3.5" /><path d="M12 16.25h.01" />',
  vehicle:
    '<path d="M3.5 7.5h11v8h-11z" /><path d="M14.5 10h3l2 2.5v3H14.5z" /><circle cx="7.25" cy="17.5" r="1.75" /><circle cx="17.25" cy="17.5" r="1.75" />',
  alert:
    '<path d="M12 4.5 20 19H4L12 4.5Z" /><path d="M12 10v4.5" /><path d="M12 17.2h.01" />',
  team:
    '<circle cx="9" cy="9" r="2.25" /><circle cx="16.5" cy="10.5" r="1.75" /><path d="M5.5 18a3.5 3.5 0 0 1 7 0" /><path d="M13.75 18a2.75 2.75 0 0 1 5.5 0" />',
  search:
    '<circle cx="11" cy="11" r="5.5" /><path d="m15 15 4 4" />',
  refresh:
    '<path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M7.5 9A6.5 6.5 0 0 1 18.2 6.8L20 8" /><path d="M16.5 15A6.5 6.5 0 0 1 5.8 17.2L4 16" />',
  menu:
    '<path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />',
  moon:
    '<path d="M18 14.5A6.5 6.5 0 0 1 9.5 6a7.5 7.5 0 1 0 8.5 8.5Z" />',
  sun:
    '<circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2.25" /><path d="M12 19.25v2.25" /><path d="m4.93 4.93 1.59 1.59" /><path d="m17.48 17.48 1.59 1.59" /><path d="M2.5 12h2.25" /><path d="M19.25 12h2.25" /><path d="m4.93 19.07 1.59-1.59" /><path d="m17.48 6.52 1.59-1.59" />',
  logout:
    '<path d="M14 5.5h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3" /><path d="M10 8.5 13.5 12 10 15.5" /><path d="M13.5 12H5" />',
};
const NAV_ICONS = {
  dashboard: "dashboard",
  notes: "notes",
  inventory: "inventory",
  vehicles: "vehicle",
  dossier: "vehicle",
  fuel: "fuel",
  reports: "notes",
  schedules: "schedules",
  fines: "fines",
  checklists: "checklists",
  emails: "emails",
  admin: "admin",
};
const SECTION_ICONS = {
  dashboard: "dashboard",
  notes: "notes",
  inventory: "inventory",
  vehicles: "vehicle",
  dossier: "vehicle",
  fuel: "fuel",
  reports: "notes",
  schedules: "schedules",
  fines: "fines",
  checklists: "checklists",
  emails: "emails",
  admin: "admin",
};
const DASHBOARD_TITLE_ICONS = ["analytics", "efficiency", "vehicle", "fuel", "notes", "alert", "schedules"];
const SECTION_META = {
  dashboard: { title: "Dashboard", subtitle: "Visao geral da operacao" },
  notes: { title: "Notas fiscais", subtitle: "Financeiro, DANFE e rastreabilidade" },
  inventory: { title: "Estoque", subtitle: "Controle de estoque e movimentacoes" },
  vehicles: { title: "Veiculos", subtitle: "Frota ativa e dados por placa" },
  dossier: { title: "Dossie do Veiculo", subtitle: "Historico completo por veiculo" },
  fuel: { title: "Combustivel", subtitle: "Kardex e abastecimento da frota" },
  reports: { title: "Relatorios", subtitle: "Prestacao de contas e ficha Kardex" },
  schedules: { title: "Escala", subtitle: "Planejamento e documento operacional" },
  fines: { title: "Multas", subtitle: "Ocorrencias e tratativas da frota" },
  checklists: { title: "Checklists", subtitle: "Inspecao operacional da saida" },
  emails: { title: "Central de Emails", subtitle: "Processamento e leitura automatica" },
  admin: { title: "Gestao", subtitle: "Usuarios, perfis e auditoria" },
};
const TOPBAR_SEARCH_TARGETS = {
  dashboard: "#dashboard-data-filter, #dashboard-plate-filter, #dashboard-date-from",
  notes: "#notes-search",
  inventory: "#movement-barcode-input, #movement-product-select, #product-form input[name='name']",
  vehicles: "#vehicle-form input[name='plate']",
  dossier: "#dossier-plate-search",
  fuel: "#fuel-filter-plate, #fuel-storage-select, #fuel-vehicle-select",
  reports: "#kardex-product-select, #kardex-form input[type='date']",
  schedules: "#schedule-history-plate, #schedule-date-filter",
  fines: "#fine-form input[name='plate']",
  checklists: "#checklist-form input[name='vehicle']",
  emails: "#email-form input[name='sender'], #email-form input[name='subject']",
  admin: "#admin-user-form input[name='name'], #admin-user-form input[name='email']",
};
const TOPBAR_FALLBACK_FOCUS_SELECTOR = [
  "input[type='search']:not([disabled])",
  "input[list]:not([disabled])",
  "input[type='text']:not([disabled]):not([type='hidden'])",
  "input[type='date']:not([disabled])",
  "input[type='datetime-local']:not([disabled])",
  "input[type='number']:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
].join(", ");
const DASHBOARD_VIEW_META = {
  overview: {
    label: "Visao Geral",
    description: "Combustivel, eficiencia media e alertas com foco na decisao rapida do dia.",
  },
  fuel: {
    label: "Combustivel",
    description: "Tanques, consumo por tipo e equilibrio do estoque operacional.",
  },
  efficiency: {
    label: "Eficiencia",
    description: "KM/L por placa com conferencia dos ultimos abastecimentos e ajuste manual de KM.",
  },
};

const state = {
  user: null,
  section: "dashboard",
  authMode: "login",
  company: {
    companyName: "Empresa cliente",
    logoDataUrl: "",
    cnpj: "",
    address: "",
    phone: "",
    email: "",
    primaryColor: "#c40000",
    documentFooter: "Gerado pelo sistema Horizon",
  },
  notes: [],
  notesUi: {
    editingId: null,
    importSummary: null,
    workflow: "ACTIVE",
  },
  products: [],
  vehicles: [],
  inventoryMovements: [],
  fuelRecords: [],
  fuelStorages: [],
  schedules: [],
  schedule: {
    dayId: null,
    day: null,
    history: [],
    suggestions: {
      vehicles: [],
      drivers: [],
      assistants: [],
      locations: [],
      documentTitles: [],
    },
    draftLines: [],
    previewVisible: false,
    lineCounter: 0,
    hasUnsavedChanges: false,
  },
  fines: [],
  checklists: [],
  checklistTemplate: [],
  checklistDraftItems: [],
  checklistCollapsedCategories: {},
  emails: [],
  adminUsers: [],
  logs: [],
  dashboard: {
    view: "overview",
    lazy: {
      fuelChartLoaded: false,
    },
    filters: {
      quickPeriodDays: 30,
      selectedPlate: "",
      focusPlate: "",
      useCustomRange: false,
      dateFrom: "",
      dateTo: "",
    },
    cache: new Map(),
    requestToken: 0,
    metrics: {
      pendingNotes: 0,
      waitingRecognition: 0,
      sentToFinance: 0,
      fuelBalance: 0,
      periodFuelConsumption: 0,
      averageDailyConsumption: 0,
      averageKmPerLiter: 0,
      activeVehicles: 0,
      criticalAlertCount: 0,
    },
    analytics: {
      periodDays: 30,
      periodStart: "",
      periodEnd: "",
      isCustomRange: false,
      selectedPlate: "",
      availablePlates: [],
      consumptionSeries: [],
      efficiencyRanking: [],
      efficiencySummary: {
        totalDistanceKm: 0,
        totalLiters: 0,
        vehicleCount: 0,
        averageKmPerLiter: 0,
      },
      selectedVehicle: null,
      topConsumers: [],
      recentFuelRecords: [],
      noteStatuses: [],
      fuelMix: [],
      operationalAlerts: [],
      alertSummary: {
        total: 0,
        critical: 0,
        kmErrors: 0,
        outliers: 0,
        missingOdometer: 0,
        suspiciousRecords: 0,
      },
      odometerCoverage: {
        totalRecords: 0,
        withOdometer: 0,
        percent: 0,
      },
      stockHealth: {
        totalBalance: 0,
        totalMinimumBalance: 0,
        lowStorageCount: 0,
        storageCount: 0,
        percent: 0,
      },
    },
    alerts: [],
    todaySchedules: [],
  },
  scanner: {
    stream: null,
    timer: null,
    targetId: null,
    detector: null,
    engine: "",
    sessionId: 0,
    isClosing: false,
    controls: null,
    codeReader: null,
    lastValue: "",
    lastDetectedAt: 0,
  },
  kardexReport: null,
  theme: "light",
};

state.fuelHistory = {
  items: [],
  users: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  },
  activeItem: null,
  audits: [],
  panelMode: "details",
  selectedHistoryId: "",
  isLoading: false,
};

const statusMeta = {
  NEW: { label: "Nova", className: "status-gray" },
  PENDING_ACK: { label: "Aguardando reconhecimento", className: "status-yellow" },
  ACKNOWLEDGED: { label: "Reconhecida", className: "status-green" },
  SENT_FINANCE: { label: "Enviada ao financeiro", className: "status-red" },
  FINALIZED: { label: "Finalizada", className: "status-green" },
  LOGISTICS: { label: "Logística", className: "status-red" },
  OTHER: { label: "Outros", className: "status-gray" },
  IN: { label: "Entrada", className: "status-green" },
  OUT: { label: "Saída", className: "status-red" },
  ENTRY: { label: "Entrada", className: "status-green" },
  EXIT: { label: "Saída", className: "status-red" },
  OPEN: { label: "Aberto", className: "status-yellow" },
  OK: { label: "OK", className: "status-green" },
  ISSUES: { label: "Com problemas", className: "status-red" },
  CONTESTING: { label: "Contestando", className: "status-yellow" },
  PAID: { label: "Paga", className: "status-green" },
  REVIEW: { label: "Revisar", className: "status-yellow" },
  SPAM: { label: "Spam", className: "status-red" },
  RECEIVED: { label: "Recebido", className: "status-gray" },
  XML_IDENTIFIED: { label: "XML identificado", className: "status-green" },
  PENDING: { label: "Pendente", className: "status-yellow" },
  ACTIVE: { label: "Ativo", className: "status-green" },
  BLOCKED: { label: "Bloqueado", className: "status-red" },
};

Object.assign(statusMeta, {
  CANCELLED: { label: "Cancelado", className: "status-gray" },
  ADJUSTMENT: { label: "Ajuste", className: "status-yellow" },
  INITIAL_BALANCE: { label: "Saldo inicial", className: "status-gray" },
  CORRECTION: { label: "Correcao", className: "status-blue" },
  OPERATIONAL_EXIT: { label: "Saida operacional", className: "status-red" },
  CORRECTED: { label: "Corrigido", className: "status-blue" },
  SUSPECT: { label: "Suspeito", className: "status-yellow" },
});

const roleLabels = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  OPERATIONAL: "Operacional",
};

const CHECKLIST_STATUS_META = {
  OK: { label: "OK", className: "status-green" },
  ATTENTION: { label: "Atencao", className: "status-yellow" },
  CRITICAL: { label: "Critico", className: "status-red" },
};

const CHECKLIST_CATEGORY_ORDER = [
  "Seguranca",
  "Mecanica",
  "Eletrica",
  "Documentacao",
  "Carroceria/Bau",
  "Conservacao",
  "Outros",
];

const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    key: "freios",
    label: "Freios",
    description: "Verificar funcionamento do sistema de freios.",
    category: "Seguranca",
    required: true,
    active: true,
  },
  {
    key: "luzes",
    label: "Luzes",
    description: "Farol, seta, luz de freio e re.",
    category: "Eletrica",
    required: true,
    active: true,
  },
  {
    key: "buzina",
    label: "Buzina",
    description: "Verificar funcionamento da buzina.",
    category: "Seguranca",
    required: true,
    active: true,
  },
  {
    key: "cinto",
    label: "Cinto de seguranca",
    description: "Verificar condicoes do cinto.",
    category: "Seguranca",
    required: true,
    active: true,
  },
  {
    key: "pneus",
    label: "Pneus",
    description: "Estado geral e calibragem visual.",
    category: "Mecanica",
    required: true,
    active: true,
  },
  {
    key: "estepe",
    label: "Estepe",
    description: "Verificar estepe e ferramentas.",
    category: "Mecanica",
    required: false,
    active: true,
  },
  {
    key: "triangulo",
    label: "Triangulo",
    description: "Verificar presenca do triangulo.",
    category: "Documentacao",
    required: true,
    active: true,
  },
  {
    key: "extintor",
    label: "Extintor",
    description: "Verificar validade e pressao.",
    category: "Seguranca",
    required: false,
    active: false,
  },
];

const refs = {
  authScreen: $("auth-screen"),
  appShell: $("app-shell"),
  appSidebar: $("app-sidebar"),
  sidebarBackdrop: $("sidebar-backdrop"),
  sidebarToggleButton: $("sidebar-toggle-button"),
  loginCard: $("login-form"),
  activationCard: $("activation-form"),
  loginForm: $("login-form"),
  activationForm: $("activation-form"),
  showActivationButton: $("show-activation-button"),
  showLoginButton: $("show-login-button"),
  logoutButton: $("logout-button"),
  refreshAllButton: $("refresh-all-button"),
  appTopbar: $("app-topbar"),
  topbarSearchButton: $("topbar-search-button"),
  topbarThemeButton: $("topbar-theme-button"),
  topbarPageTitle: $("topbar-page-title"),
  topbarPageSubtitle: $("topbar-page-subtitle"),
  topbarUserAvatar: $("topbar-user-avatar"),
  topbarUserName: $("topbar-user-name"),
  topbarUserRole: $("topbar-user-role"),
  adminNavButton: $("admin-nav-button"),
  dashboardViewSwitcher: $("dashboard-view-switcher"),
  dashboardContextTitle: $("dashboard-context-title"),
  dashboardContextDescription: $("dashboard-context-description"),
  dashboardSummary: $("dashboard-summary"),
  dashboardPrimary: $("dashboard-primary"),
  dashboardDetail: $("dashboard-detail"),
  dashboardQuickPeriodGroup: $("dashboard-quick-period-group"),
  dashboardVehicleGroup: $("dashboard-vehicle-group"),
  dashboardPeriodRangeGroup: $("dashboard-period-range-group"),
  dashboardPeriodActions: $("dashboard-period-actions"),
  dashboardPlateFilter: $("dashboard-plate-filter"),
  dashboardPeriodFilter: $("dashboard-period-filter"),
  dashboardDataFilter: $("dashboard-data-filter"),
  dashboardDateFrom: $("dashboard-date-from"),
  dashboardDateTo: $("dashboard-date-to"),
  dashboardPeriodApplyButton: $("dashboard-period-apply-button"),
  dashboardPeriodResetButton: $("dashboard-period-reset-button"),
  noteForm: $("note-form"),
  noteResetButton: $("note-reset-button"),
  notesSearch: $("notes-search"),
  notesWorkflowFilter: $("notes-workflow-filter"),
  notesStatusFilter: $("notes-status-filter"),
  notesCategoryFilter: $("notes-category-filter"),
  notesSummaryCards: $("notes-summary-cards"),
  notesImportSummary: $("notes-import-summary"),
  notesTableBody: $("notes-table-body"),
  xmlImportInput: $("xml-import-input"),
  xmlImportButton: $("xml-import-button"),
  spreadsheetImportInput: $("spreadsheet-import-input"),
  spreadsheetImportButton: $("spreadsheet-import-button"),
  productForm: $("product-form"),
  productResetButton: $("product-reset-button"),
  productsTableBody: $("products-table-body"),
  vehiclesSummaryCards: $("vehicles-summary-cards"),
  vehicleForm: $("vehicle-form"),
  vehicleResetButton: $("vehicle-reset-button"),
  vehiclesTableBody: $("vehicles-table-body"),
  movementForm: $("inventory-movement-form"),
  movementProductSelect: $("movement-product-select"),
  inventoryMovementsBody: $("inventory-movements-body"),
  movementBarcodeInput: $("movement-barcode-input"),
  lookupBarcodeButton: $("lookup-barcode-button"),
  barcodeImageInput: $("barcode-image-input"),
  fuelStockForm: $("fuel-stock-form"),
  fuelStockProductSelect: $("fuel-launch-stock-product-select"),
  fuelForm: $("fuel-launch-form"),
  fuelStorageSelect: $("fuel-launch-storage-select"),
  fuelVehicleSelect: $("fuel-launch-vehicle-id"),
  fuelVehicleInput: $("fuel-launch-plate-input"),
  fuelVehicleList: $("fuel-launch-vehicle-list"),
  fuelComposerModeButtons: $("fuel-launch-mode-buttons"),
  fuelContextHint: $("fuel-launch-context-hint"),
  fuelNotesLabel: $("fuel-launch-notes-label"),
  fuelBatchPanel: $("fuel-batch-panel"),
  fuelBatchRowsBody: $("fuel-batch-rows-body"),
  fuelBatchAddRowButton: $("fuel-batch-add-row-button"),
  fuelBatchClearButton: $("fuel-batch-clear-button"),
  fuelBatchSaveButton: $("fuel-batch-save-button"),
  fuelBatchPreview: $("fuel-batch-preview"),
  fuelBatchSummary: $("fuel-batch-summary"),
  fuelBatchTableWrapper: $("fuel-batch-table-wrapper"),
  fuelBatchPlateList: $("fuel-batch-plate-list"),
  fuelPrintSheetButton: $("fuel-print-sheet-button"),
  fuelFilterStorage: $("fuel-filter-storage"),
  fuelFilterFrom: $("fuel-filter-from"),
  fuelFilterTo: $("fuel-filter-to"),
  fuelFilterPlate: $("fuel-filter-plate"),
  fuelKpiGrid: $("fuel-kpi-grid"),
  fuelStocksGrid: $("fuel-stocks-grid"),
  fuelInventoryMovementsBody: $("fuel-inventory-movements-body"),
  fuelTableBody: $("fuel-table-body"),
  fuelConsumptionChart: $("fuel-consumption-chart"),
  fuelTopVehicles: $("fuel-top-vehicles"),
  fuelSideInsights: $("fuel-side-insights"),
  scheduleForm: $("schedule-form"),
  scheduleResetButton: $("schedule-reset-button"),
  scheduleAddLineButton: $("schedule-add-line-button"),
  scheduleDuplicatePreviousButton: $("schedule-duplicate-previous-button"),
  scheduleExportExcelButton: $("schedule-export-excel-button"),
  scheduleExportPdfButton: $("schedule-export-pdf-button"),
  scheduleGenerateDocumentButton: $("schedule-generate-document-button"),
  schedulePrintButton: $("schedule-print-button"),
  scheduleLinesContainer: $("schedule-lines-container"),
  scheduleDocumentPreview: $("schedule-document-preview"),
  scheduleHistoryDate: $("schedule-history-date"),
  scheduleHistoryPlate: $("schedule-history-plate"),
  scheduleHistoryDriver: $("schedule-history-driver"),
  scheduleHistoryClearButton: $("schedule-history-clear-button"),
  scheduleHistoryTableBody: $("schedule-history-table-body"),
  schedulesTableBody: $("schedules-table-body"),
  scheduleSummaryCards: $("schedule-summary-cards"),
  scheduleNotesFeed: $("schedule-notes-feed"),
  fineForm: $("fine-form"),
  fineResetButton: $("fine-reset-button"),
  finesTableBody: $("fines-table-body"),
  checklistForm: $("checklist-form"),
  checklistResetButton: $("checklist-reset-button"),
  checklistMarkAllOkButton: $("checklist-mark-all-ok-button"),
  checklistTemporaryItemInput: $("checklist-temporary-item-input"),
  checklistAddTemporaryItemButton: $("checklist-add-temporary-item-button"),
  checklistsTableBody: $("checklists-table-body"),
  checklistItemsBuilder: $("checklist-items-builder"),
  checklistSummaryCards: $("checklist-summary-cards"),
  checklistHistoryFeed: $("checklist-history-feed"),
  checklistTemplatePanel: $("checklist-template-panel"),
  checklistTemplateForm: $("checklist-template-form"),
  checklistTemplateResetButton: $("checklist-template-reset-button"),
  checklistTemplateTableBody: $("checklist-template-table-body"),
  kardexForm: $("kardex-form"),
  kardexStockType: $("kardex-stock-type"),
  kardexProductSelect: $("kardex-product-select"),
  kardexViewButton: $("kardex-view-button"),
  kardexPdfButton: $("kardex-pdf-button"),
  kardexPrintButton: $("kardex-print-button"),
  kardexPreview: $("kardex-preview"),
  emailForm: $("email-form"),
  emailsTableBody: $("emails-table-body"),
  adminUserForm: $("admin-user-form"),
  adminUserResetButton: $("admin-user-reset-button"),
  adminUsersTableBody: $("admin-users-table-body"),
  adminCompanyCard: $("admin-company-card"),
  adminCompanyForm: $("admin-company-form"),
  adminCompanyLogoInput: $("admin-company-logo-input"),
  adminCompanyClearLogoButton: $("admin-company-clear-logo-button"),
  adminCompanyLogoPreview: $("admin-company-logo-preview"),
  logsTableBody: $("logs-table-body"),
  scannerModal: $("scanner-modal"),
  scannerVideo: $("scanner-video"),
  scannerStatus: $("scanner-status"),
  scannerCloseButton: $("scanner-close-button"),
  themeSwitcher: document.querySelector(".theme-switcher"),
  themeLightButton: $("theme-light-button"),
  themeDarkButton: $("theme-dark-button"),
  siteFavicon: $("site-favicon"),
  toastRoot: $("toast-root"),
  appLoading: $("app-loading"),
};

Object.assign(refs, {
  fuelHistoryMovementKind: $("fuel-history-movement-kind"),
  fuelHistoryUser: $("fuel-history-user"),
  fuelHistoryDocument: $("fuel-history-document"),
  fuelHistoryStatus: $("fuel-history-status"),
  fuelHistorySearch: $("fuel-history-search"),
  fuelHistoryApplyButton: $("fuel-history-apply-button"),
  fuelHistoryClearButton: $("fuel-history-clear-button"),
  fuelHistorySummary: $("fuel-history-summary"),
  fuelHistoryTableBody: $("fuel-history-table-body"),
  fuelHistoryPagination: $("fuel-history-pagination"),
  fuelHistoryDetailPanel: $("fuel-history-detail-panel"),
  fuelHistoryDetailTitle: $("fuel-history-detail-title"),
  fuelHistoryDetailContent: $("fuel-history-detail-content"),
});

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  applyTheme(resolveInitialTheme());
  syncThemeSwitcherPlacement();
  decorateStaticInterface();
  updateTopbarContext();
  bindEvents();
  syncSidebarLayout();
  switchAuthMode("login");
  applyDefaultFormValues();
  await maybeShowBrowserModeNotice();

  try {
    const response = await api("/api/auth/me", { suppressAuthRedirect: true });
    setUser(response.user || null);

    if (response.user) {
      await refreshAll();
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideAppLoading();
  }
}

function switchAuthMode(mode) {
  const nextMode = mode === "activation" ? "activation" : "login";
  state.authMode = nextMode;
  refs.loginCard?.classList.toggle("hidden", nextMode !== "login");
  refs.activationCard?.classList.toggle("hidden", nextMode !== "activation");
}

async function maybeShowBrowserModeNotice() {
  const alreadyShown = window.localStorage.getItem(BROWSER_MODE_NOTICE_KEY) === "1";
  if (alreadyShown) {
    return;
  }

  const mode = await resolveApiMode();
  if (mode !== "browser") {
    return;
  }

  window.localStorage.setItem(BROWSER_MODE_NOTICE_KEY, "1");
  showToast("Modo site ativo: dados salvos neste navegador.");
}

async function resolveApiMode() {
  if (runtimeState.apiMode) {
    return runtimeState.apiMode;
  }

  const localApi = window.HorizonLocalApi;
  if (!localApi) {
    runtimeState.apiMode = "server";
    return runtimeState.apiMode;
  }

  if (localApi.preferredMode === "browser") {
    runtimeState.apiMode = "browser";
    return runtimeState.apiMode;
  }

  if (localApi.preferredMode === "server") {
    runtimeState.apiMode = "server";
    return runtimeState.apiMode;
  }

  if (!runtimeState.apiProbe) {
    runtimeState.apiProbe = (async () => {
      try {
        const healthUrl = new URL("api/health", window.location.href);
        const response = await fetch(healthUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        return response.ok ? "server" : "browser";
      } catch (error) {
        return "browser";
      }
    })().then((mode) => {
      runtimeState.apiMode = mode;
      return mode;
    });
  }

  return runtimeState.apiProbe;
}

function bindEvents() {
  refs.loginForm.addEventListener("submit", handleLoginSubmit);
  refs.activationForm.addEventListener("submit", handleActivationSubmit);
  refs.showActivationButton?.addEventListener("click", () => switchAuthMode("activation"));
  refs.showLoginButton?.addEventListener("click", () => switchAuthMode("login"));
  refs.logoutButton.addEventListener("click", handleLogout);
  refs.refreshAllButton.addEventListener("click", refreshAll);
  refs.topbarSearchButton?.addEventListener("click", handleTopbarSearch);
  refs.topbarThemeButton?.addEventListener("click", toggleTheme);
  refs.sidebarToggleButton?.addEventListener("click", toggleSidebar);
  refs.sidebarBackdrop?.addEventListener("click", closeSidebarOverlay);
  refs.dashboardViewSwitcher?.addEventListener("click", handleDashboardViewSwitch);
  refs.dashboardPlateFilter?.addEventListener("change", handleDashboardPlateFilterChange);
  refs.dashboardPeriodFilter?.addEventListener("change", handleDashboardQuickPeriodChange);
  refs.dashboardDataFilter?.addEventListener("change", handleDashboardDataFilterChange);
  refs.dashboardPeriodApplyButton?.addEventListener("click", handleDashboardPeriodApply);
  refs.dashboardPeriodResetButton?.addEventListener("click", handleDashboardPeriodReset);
  refs.noteForm.addEventListener("submit", handleNoteSubmit);
  refs.noteResetButton.addEventListener("click", () => resetNoteForm());
  refs.xmlImportButton.addEventListener("click", handleXmlImport);
  refs.spreadsheetImportButton.addEventListener("click", handleSpreadsheetImport);
  refs.notesSearch.addEventListener("input", debounce(refreshNotes, 250));
  refs.notesWorkflowFilter?.addEventListener("change", () => {
    state.notesUi.workflow = refs.notesWorkflowFilter.value || "ACTIVE";
    refreshNotes();
  });
  refs.notesStatusFilter.addEventListener("change", refreshNotes);
  refs.notesCategoryFilter.addEventListener("change", refreshNotes);
  refs.productForm.addEventListener("submit", handleProductSubmit);
  refs.productForm.elements.stockType?.addEventListener("change", syncProductFormState);
  refs.productResetButton.addEventListener("click", resetProductForm);
  refs.vehicleForm.addEventListener("submit", handleVehicleSubmit);
  refs.vehicleResetButton.addEventListener("click", resetVehicleForm);
  refs.movementForm.addEventListener("submit", handleMovementSubmit);
  refs.lookupBarcodeButton.addEventListener("click", lookupProductByBarcode);
  refs.fuelStockForm?.addEventListener("submit", handleFuelStockMovementSubmit);
  refs.fuelForm?.addEventListener("submit", handleFuelSubmit);
  refs.fuelForm?.elements?.type?.addEventListener("change", syncFuelFormState);
  refs.fuelStorageSelect?.addEventListener("change", syncFuelFormState);
  refs.fuelVehicleInput?.addEventListener("input", handleFuelVehicleInputChange);
  refs.fuelVehicleInput?.addEventListener("change", handleFuelVehicleInputChange);
  refs.fuelComposerModeButtons?.addEventListener("click", handleFuelComposerModeClick);
  refs.fuelBatchAddRowButton?.addEventListener("click", () => addFuelBatchRow());
  refs.fuelBatchClearButton?.addEventListener("click", () => resetFuelBatchComposer(true));
  refs.fuelBatchSaveButton?.addEventListener("click", handleFuelBatchSubmit);
  refs.fuelBatchRowsBody?.addEventListener("input", handleFuelBatchRowInput);
  refs.fuelBatchRowsBody?.addEventListener("keydown", handleFuelBatchRowKeydown);
  refs.fuelBatchRowsBody?.addEventListener("click", handleFuelBatchRowClick);
  refs.fuelBatchTableWrapper?.addEventListener("paste", handleFuelBatchPaste);
  refs.fuelPrintSheetButton?.addEventListener("click", handleFuelDailySheetPrint);
  refs.fuelFilterStorage.addEventListener("change", refreshFuel);
  refs.fuelFilterFrom.addEventListener("change", refreshFuel);
  refs.fuelFilterTo.addEventListener("change", refreshFuel);
  refs.fuelFilterPlate?.addEventListener("change", renderFuel);
  refs.scheduleForm.addEventListener("submit", handleScheduleSubmit);
  refs.scheduleResetButton.addEventListener("click", resetScheduleForm);
  refs.scheduleForm.elements.scheduledDate?.addEventListener("change", refreshSchedules);
  refs.scheduleAddLineButton?.addEventListener("click", () => addScheduleDraftLine());
  refs.scheduleDuplicatePreviousButton?.addEventListener("click", handleScheduleDuplicatePrevious);
  refs.scheduleExportExcelButton?.addEventListener("click", handleScheduleExportExcel);
  refs.scheduleExportPdfButton?.addEventListener("click", () => handleSchedulePrint("pdf"));
  refs.scheduleGenerateDocumentButton?.addEventListener("click", handleScheduleGenerateDocument);
  refs.schedulePrintButton?.addEventListener("click", () => handleSchedulePrint("print"));
  refs.scheduleHistoryDate?.addEventListener("change", refreshSchedules);
  refs.scheduleHistoryPlate?.addEventListener("input", debounce(refreshSchedules, 250));
  refs.scheduleHistoryDriver?.addEventListener("input", debounce(refreshSchedules, 250));
  refs.scheduleHistoryClearButton?.addEventListener("click", clearScheduleHistoryFilters);
  refs.fineForm.addEventListener("submit", handleFineSubmit);
  refs.fineResetButton.addEventListener("click", resetFineForm);
  refs.checklistForm.addEventListener("submit", handleChecklistSubmit);
  refs.checklistResetButton.addEventListener("click", resetChecklistForm);
  refs.checklistMarkAllOkButton?.addEventListener("click", markChecklistDraftAsOk);
  refs.checklistAddTemporaryItemButton?.addEventListener("click", addTemporaryChecklistItem);
  refs.kardexForm?.addEventListener("submit", handleKardexView);
  refs.kardexStockType?.addEventListener("change", syncKardexFormState);
  refs.kardexForm?.elements.fuelKind?.addEventListener("change", updateKardexProductSelect);
  refs.kardexPdfButton?.addEventListener("click", () => handleKardexPrint("pdf"));
  refs.kardexPrintButton?.addEventListener("click", () => handleKardexPrint("print"));
  refs.emailForm.addEventListener("submit", handleEmailSubmit);
  refs.adminUserForm.addEventListener("submit", handleAdminUserSubmit);
  refs.adminUserResetButton?.addEventListener("click", resetAdminUserForm);
  refs.adminCompanyForm?.addEventListener("submit", handleCompanySettingsSubmit);
  refs.adminCompanyLogoInput?.addEventListener("change", handleCompanyLogoInputChange);
  refs.adminCompanyClearLogoButton?.addEventListener("click", clearCompanyLogoSelection);
  refs.checklistTemplateForm?.addEventListener("submit", handleChecklistTemplateSubmit);
  refs.checklistTemplateResetButton?.addEventListener("click", resetChecklistTemplateForm);
  refs.scannerCloseButton.addEventListener("click", closeScanner);
  refs.themeLightButton.addEventListener("click", () => applyTheme("light"));
  refs.themeDarkButton.addEventListener("click", () => applyTheme("dark"));
  window.addEventListener("resize", syncSidebarLayout);
  document.addEventListener("keydown", handleGlobalKeydown);

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setSection(button.dataset.section));
  });

  document.body.addEventListener("click", handleRowActions);
  document.body.addEventListener("click", handleInteractivePanels);
  document.body.addEventListener("change", handleInteractiveChanges);
  document.body.addEventListener("input", handleInteractiveInputs);

  document.querySelectorAll("[data-scan-target]").forEach((button) => {
    button.addEventListener("click", () => openScanner(button.dataset.scanTarget));
  });
  document.querySelectorAll("[data-scan-image-target]").forEach((button) => {
    button.addEventListener("click", () => openBarcodeImagePicker(button.dataset.scanImageTarget));
  });
  refs.barcodeImageInput?.addEventListener("change", handleBarcodeImageSelection);
  bindFuelHistoryEvents();
}

function resolveInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "dark";
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  state.theme = nextTheme;
  document.body.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

  refs.themeLightButton.classList.toggle("is-active", nextTheme === "light");
  refs.themeDarkButton.classList.toggle("is-active", nextTheme === "dark");
  refs.themeLightButton.setAttribute("aria-pressed", nextTheme === "light" ? "true" : "false");
  refs.themeDarkButton.setAttribute("aria-pressed", nextTheme === "dark" ? "true" : "false");
  syncTopbarThemeButton();

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", nextTheme === "dark" ? "#0d1117" : "#121820");
  }

  const nextLogo = THEME_LOGOS[nextTheme];
  document.querySelectorAll("[data-theme-logo]").forEach((image) => {
    image.setAttribute("src", nextLogo);
  });

  if (refs.siteFavicon) {
    refs.siteFavicon.setAttribute("href", nextLogo);
  }
}

function syncThemeSwitcherPlacement() {
  if (!refs.themeSwitcher) {
    return;
  }

  if (refs.authScreen && refs.themeSwitcher.parentElement !== document.body) {
    document.body.insertBefore(refs.themeSwitcher, refs.authScreen);
  }

  if (state.user) {
    refs.themeSwitcher.classList.add("hidden");
    refs.themeSwitcher.dataset.context = "hidden";
    return;
  }

  refs.themeSwitcher.classList.remove("hidden");
  refs.themeSwitcher.dataset.context = "floating";
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

function syncTopbarThemeButton() {
  if (!refs.topbarThemeButton) {
    return;
  }

  const isDark = state.theme === "dark";
  const activeLabel = isDark ? "Dark" : "Light";
  const nextThemeLabel = isDark ? "claro" : "escuro";
  const iconSlot = refs.topbarThemeButton.querySelector("[data-topbar-theme-icon]");
  const labelSlot = refs.topbarThemeButton.querySelector(".topbar-action-button__label");
  const buttonLabel = `Tema ativo ${activeLabel}. Alternar para tema ${nextThemeLabel}.`;

  if (iconSlot) {
    iconSlot.innerHTML = iconMarkup(isDark ? "moon" : "sun");
  }

  if (labelSlot) {
    labelSlot.textContent = activeLabel;
  }

  refs.topbarThemeButton.classList.toggle("is-dark", isDark);
  refs.topbarThemeButton.classList.toggle("is-light", !isDark);
  refs.topbarThemeButton.setAttribute("aria-label", buttonLabel);
  refs.topbarThemeButton.setAttribute("title", buttonLabel);
  refs.topbarThemeButton.setAttribute("aria-pressed", isDark ? "true" : "false");
}

function buildUserInitials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "--";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function updateTopbarContext(section = state.section) {
  if (!refs.topbarPageTitle || !refs.topbarPageSubtitle) {
    return;
  }

  const sectionMeta = resolveSectionMeta(section);
  refs.topbarPageTitle.textContent = sectionMeta.title;
  refs.topbarPageSubtitle.textContent = sectionMeta.subtitle || "";
  refs.topbarPageSubtitle.classList.toggle("hidden", !sectionMeta.subtitle);
  refs.appTopbar?.setAttribute("data-section", section || "dashboard");
}

function resolveSectionMeta(section = state.section) {
  const fallback = SECTION_META.dashboard;
  const panel = document.getElementById(`${section}-section`);
  const titleNode = panel?.querySelector(".section-header h2, .section-header h1, .section-header h3");
  const subtitleNode = panel?.querySelector(".section-header .section-description, .section-header .eyebrow");
  const mappedMeta = SECTION_META[section] || {};

  return {
    title: mappedMeta.title || titleNode?.textContent?.trim() || fallback.title,
    subtitle: mappedMeta.subtitle || subtitleNode?.textContent?.trim() || fallback.subtitle,
  };
}

function isElementVisible(element) {
  return Boolean(element) && !element.closest(".hidden") && element.getClientRects().length > 0;
}

function findTopbarSearchTarget() {
  const activeSection = document.getElementById(`${state.section}-section`);
  if (!activeSection) {
    return null;
  }

  const preferredSelector = TOPBAR_SEARCH_TARGETS[state.section];
  const preferredTarget =
    preferredSelector &&
    Array.from(activeSection.querySelectorAll(preferredSelector)).find((element) => isElementVisible(element) && !element.disabled);

  if (preferredTarget) {
    return preferredTarget;
  }

  return Array.from(activeSection.querySelectorAll(TOPBAR_FALLBACK_FOCUS_SELECTOR)).find(
    (element) => isElementVisible(element) && !element.disabled
  );
}

function handleTopbarSearch() {
  const target = findTopbarSearchTarget();
  if (!target) {
    showToast("Nenhum campo de busca disponivel nesta pagina.", "info");
    return;
  }

  scrollToElement(target, "center");
  target.focus({ preventScroll: true });
  if (typeof target.select === "function" && /^(INPUT|TEXTAREA)$/.test(target.tagName)) {
    target.select();
  }
}

function resolveSidebarViewport() {
  if (window.innerWidth <= SIDEBAR_MOBILE_MAX_WIDTH) {
    return "mobile";
  }

  if (window.innerWidth <= SIDEBAR_TABLET_MAX_WIDTH) {
    return "tablet";
  }

  return "desktop";
}

function readStoredSidebarMode(viewport) {
  const storageKey = `${SIDEBAR_STORAGE_KEY}:${viewport}`;
  const storedMode = window.localStorage.getItem(storageKey);
  if (storedMode === "expanded" || storedMode === "compact") {
    return storedMode;
  }
  return storedMode === "hidden" ? "compact" : null;
}

function resolveSidebarModeForViewport(viewport) {
  if (viewport === "mobile") {
    return "hidden";
  }

  return readStoredSidebarMode(viewport) || (viewport === "tablet" ? "compact" : "expanded");
}

function syncSidebarLayout() {
  const nextViewport = resolveSidebarViewport();
  const previousViewport = runtimeState.sidebarViewport;

  runtimeState.sidebarViewport = nextViewport;

  if (nextViewport === "mobile") {
    runtimeState.sidebarOpen = previousViewport === "mobile" ? runtimeState.sidebarOpen : false;
    applySidebarLayout();
    return;
  }

  runtimeState.sidebarMode = resolveSidebarModeForViewport(nextViewport);
  runtimeState.sidebarOpen = false;
  applySidebarLayout();
}

function applySidebarLayout() {
  const viewport = runtimeState.sidebarViewport || resolveSidebarViewport();
  const mode = viewport === "mobile" ? "hidden" : runtimeState.sidebarMode === "expanded" ? "expanded" : "compact";
  const isOverlayOpen = viewport === "mobile" && runtimeState.sidebarOpen;
  const isExpanded = viewport === "mobile" ? isOverlayOpen : mode === "expanded";
  const isSidebarInteractive = viewport !== "mobile" || isOverlayOpen;
  const toggleLabel =
    viewport === "mobile"
      ? isOverlayOpen
        ? "Fechar menu lateral"
        : "Abrir menu lateral"
      : mode === "expanded"
        ? "Recolher menu lateral"
        : "Expandir menu lateral";

  refs.appShell?.setAttribute("data-sidebar-mode", mode);
  refs.appShell?.setAttribute("data-sidebar-open", isOverlayOpen ? "true" : "false");
  refs.appShell?.setAttribute("data-sidebar-viewport", viewport);
  refs.appSidebar?.setAttribute("aria-hidden", isSidebarInteractive ? "false" : "true");
  refs.appSidebar?.toggleAttribute("inert", !isSidebarInteractive);
  refs.sidebarBackdrop?.setAttribute("aria-hidden", isOverlayOpen ? "false" : "true");
  refs.sidebarToggleButton?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  refs.sidebarToggleButton?.setAttribute("aria-label", toggleLabel);
  refs.sidebarToggleButton?.setAttribute("title", toggleLabel);
  document.body.classList.toggle("sidebar-mobile-open", isOverlayOpen);
}

function focusSidebarPrimaryAction() {
  const focusTarget = refs.appSidebar?.querySelector(".nav-item.active, .nav-item");
  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }
}

function toggleSidebar() {
  if (runtimeState.sidebarViewport === "mobile") {
    runtimeState.sidebarOpen = !runtimeState.sidebarOpen;
    applySidebarLayout();
    if (runtimeState.sidebarOpen) {
      window.requestAnimationFrame(focusSidebarPrimaryAction);
    }
    return;
  }

  runtimeState.sidebarMode = runtimeState.sidebarMode === "expanded" ? "compact" : "expanded";
  window.localStorage.setItem(`${SIDEBAR_STORAGE_KEY}:${runtimeState.sidebarViewport}`, runtimeState.sidebarMode);
  applySidebarLayout();
}

function closeSidebarOverlay() {
  if (runtimeState.sidebarViewport !== "mobile" || !runtimeState.sidebarOpen) {
    return;
  }

  runtimeState.sidebarOpen = false;
  applySidebarLayout();
  refs.sidebarToggleButton?.focus();
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    closeSidebarOverlay();
  }
}

async function api(url, options = {}) {
  const { body, suppressAuthRedirect = false, ...fetchOptions } = options;
  const mode = await resolveApiMode();

  if (mode === "browser" && window.HorizonLocalApi?.request) {
    try {
      return await window.HorizonLocalApi.request(url, {
        ...fetchOptions,
        method: fetchOptions.method || "GET",
        body,
      });
    } catch (error) {
      if (error.status === 401 && !suppressAuthRedirect) {
        setUser(null);
      }
      const requestError = new Error(error.message || "Falha no modo navegador.");
      requestError.status = error.status || 500;
      requestError.data = error.data || {};
      throw requestError;
    }
  }

  const request = {
    method: fetchOptions.method || "GET",
    headers: {
      Accept: "application/json",
      ...(fetchOptions.headers || {}),
    },
  };

  if (body !== undefined) {
    request.headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(body);
  }

  const response = await fetch(url, request);
  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const message = data.error || "Falha na comunicação com o servidor.";
    if (response.status === 401 && !suppressAuthRedirect) {
      setUser(null);
    }
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.data = data;
    throw requestError;
  }

  return data;
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  refs.toastRoot.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2800);
}

function debounce(callback, delay = 300) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });
}

function normalizeClientKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sanitizeBrazilianNumberString(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/R\$/gi, "")
    .replace(/[^\d,.\-+]/g, "");

  if (!normalized) {
    return "";
  }

  if (normalized.includes(",")) {
    return normalized.replace(/\./g, "").replace(",", ".");
  }

  if (/^[+-]?\d{1,3}(?:\.\d{3})+$/.test(normalized)) {
    return normalized.replace(/\./g, "");
  }

  return normalized;
}

function parseBrazilianNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  const normalized = sanitizeBrazilianNumberString(value);
  if (!normalized) {
    return Number.NaN;
  }

  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalized)) {
    return Number.NaN;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function toClientNumber(value, fallback = 0) {
  const parsed = parseBrazilianNumber(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numbersMatch(left, right, tolerance = 0.000001) {
  const leftValue = parseBrazilianNumber(left);
  const rightValue = parseBrazilianNumber(right);
  if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
    return false;
  }
  return Math.abs(leftValue - rightValue) <= tolerance;
}

function readBrazilianNumberField(input, { label, required = false, min = null } = {}) {
  const rawValue = input?.value?.trim?.() ?? "";
  if (!rawValue) {
    if (required) {
      throw new Error(`Informe ${label}.`);
    }
    return null;
  }

  const parsed = parseBrazilianNumber(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Informe ${label} valido.`);
  }

  if (min !== null && parsed < min) {
    if (min > 0) {
      throw new Error(`${label} deve ser maior que zero.`);
    }
    throw new Error(`${label} nao pode ser negativo.`);
  }

  return parsed;
}

function formatDecimalInputValue(value, digits = 2) {
  const parsed = parseBrazilianNumber(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(parsed);
}

function confirmSuspiciousFuelValues(warnings = []) {
  if (!warnings.length) {
    return true;
  }

  return window.confirm(`${warnings.join("\n")}\n\nConfirme se o lançamento está correto.`);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toClientNumber(value, 0));
}

function formatLiters(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toClientNumber(value, 0));
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("pt-BR");
}

function formatDateOnly(value) {
  if (!value) {
    return "-";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("pt-BR");
}

function formatNumber(value, minimumFractionDigits = 0, maximumFractionDigits = minimumFractionDigits) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(toClientNumber(value, 0));
}

function formatPercent(value, digits = 0) {
  return `${formatNumber(value, digits, digits)}%`;
}

function formatDistance(value) {
  return `${formatNumber(value, 0, 0)} km`;
}

function formatKmPerLiter(value) {
  return toClientNumber(value, 0) > 0 ? `${formatNumber(value, 2, 2)} km/L` : "-";
}

function formatKmPerLiterText(value) {
  return toClientNumber(value, 0) > 0 ? `${formatNumber(value, 2, 2)} km por litro` : "-";
}

function formatShortDate(value) {
  if (!value) {
    return "-";
  }
  const normalized = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-");
    return `${day}/${month}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 5)
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function clampPercent(value) {
  return Math.min(Math.max(Number(value || 0), 0), 100);
}

function renderDashboardEmpty(title, description) {
  return `
    <div class="dashboard-empty">
      <strong>${escapeHtml(title)}</strong>
      <p class="muted">${escapeHtml(description)}</p>
    </div>
  `;
}

function buildChartLine(points) {
  if (!points.length) {
    return "";
  }
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildChartArea(points, baselineY) {
  if (!points.length) {
    return "";
  }
  return `M ${points[0].x} ${baselineY} ${points
    .map((point) => `L ${point.x} ${point.y}`)
    .join(" ")} L ${points[points.length - 1].x} ${baselineY} Z`;
}

function renderConsumptionChart(analytics) {
  const series = analytics.consumptionSeries || [];
  const totalConsumption = Number(analytics.totalConsumptionLiters || 0);
  if (!series.length || totalConsumption <= 0) {
    return renderDashboardEmpty(
      "Sem consumo no periodo",
      "Assim que houver saidas de combustivel, o grafico passa a mostrar a curva diaria."
    );
  }

  const width = 760;
  const height = 240;
  const paddingX = 18;
  const paddingTop = 18;
  const paddingBottom = 34;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;
  const maxValue = Math.max(...series.map((item) => Number(item.total || 0)), 1);
  const denominator = Math.max(series.length - 1, 1);
  const points = series.map((item, index) => ({
    x: paddingX + (chartWidth * index) / denominator,
    y: paddingTop + chartHeight - (Number(item.total || 0) / maxValue) * chartHeight,
    total: Number(item.total || 0),
    date: item.date,
  }));
  const gridValues = Array.from({ length: 4 }, (_, index) => maxValue * (1 - index / 3));
  const xLabelStep = Math.max(Math.floor(series.length / 6), 1);
  const fuelMixMap = new Map((analytics.fuelMix || []).map((item) => [item.fuelKind, Number(item.total || 0)]));
  const peak = analytics.peakConsumption || { date: "", total: 0 };

  return `
    <div class="chart-highlight-row">
      <div class="chart-highlight">
        <span class="eyebrow">Total no periodo</span>
        <strong>${escapeHtml(`${formatLiters(totalConsumption)} L`)}</strong>
      </div>
      <div class="chart-highlight">
        <span class="eyebrow">Pico diario</span>
        <strong>${escapeHtml(`${formatLiters(peak.total || 0)} L`)}</strong>
        <span class="muted">${escapeHtml(formatShortDate(peak.date))}</span>
      </div>
      <div class="chart-highlight">
        <span class="eyebrow">Mix</span>
        <strong>${escapeHtml(`${formatLiters(fuelMixMap.get("S500") || 0)} L`)}</strong>
        <span class="muted">S-500</span>
      </div>
      <div class="chart-highlight">
        <span class="eyebrow">Mix</span>
        <strong>${escapeHtml(`${formatLiters(fuelMixMap.get("S10") || 0)} L`)}</strong>
        <span class="muted">S-10</span>
      </div>
    </div>
    <div class="dashboard-chart-shell">
      <svg class="dashboard-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafico de consumo de combustivel">
        <defs>
          <linearGradient id="consumptionAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c40000" stop-opacity="0.38" />
            <stop offset="100%" stop-color="#c40000" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        ${gridValues
          .map((gridValue, index) => {
            const y = paddingTop + (chartHeight * index) / 3;
            return `
              <line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" class="dashboard-chart-grid" />
              <text x="${paddingX}" y="${Math.max(y - 6, 12)}" class="dashboard-chart-grid-label">${escapeHtml(
                formatLiters(gridValue)
              )}</text>
            `;
          })
          .join("")}
        <path d="${buildChartArea(points, height - paddingBottom)}" class="dashboard-chart-area" />
        <path d="${buildChartLine(points)}" class="dashboard-chart-line" />
        ${points
          .map(
            (point) => `
              <circle cx="${point.x}" cy="${point.y}" r="4.5" class="dashboard-chart-dot">
                <title>${escapeHtml(`${formatShortDate(point.date)}: ${formatLiters(point.total)} L`)}</title>
              </circle>
            `
          )
          .join("")}
      </svg>
      <div class="dashboard-chart-labels">
        ${series
          .filter((_, index) => index % xLabelStep === 0 || index === series.length - 1)
          .map(
            (item) => `
              <span>${escapeHtml(formatShortDate(item.date))}</span>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderMeterList(items, options = {}) {
  const {
    emptyTitle = "Sem dados",
    emptyDescription = "Ainda nao ha informacoes suficientes para exibir este bloco.",
    valueFormatter = (value) => formatNumber(value),
    secondaryFormatter = () => "",
  } = options;

  if (!items.length) {
    return renderDashboardEmpty(emptyTitle, emptyDescription);
  }

  const maxValue = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return `
    <div class="dashboard-meter-list">
      ${items
        .map((item) => {
          const width = Math.max((Number(item.value || 0) / maxValue) * 100, 6);
          const secondary = secondaryFormatter(item);
          return `
            <article class="dashboard-meter">
              <div class="dashboard-meter__head">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(valueFormatter(item.value, item))}</span>
              </div>
              <div class="dashboard-meter__track">
                <span style="width:${width}%"></span>
              </div>
              ${
                secondary
                  ? `<div class="dashboard-meter__meta muted">${escapeHtml(secondary)}</div>`
                  : ""
              }
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderOperationalInsights(analytics) {
  const coverage = analytics.odometerCoverage || { percent: 0, withOdometer: 0, totalRecords: 0 };
  const stockHealth = analytics.stockHealth || {
    percent: 0,
    lowStorageCount: 0,
    totalMinimumBalance: 0,
  };

  return `
    <div class="dashboard-insight-grid">
      ${buildStatCard({
        className: "dashboard-insight-card",
        label: "Hodometro capturado",
        value: formatPercent(coverage.percent || 0, 0),
        note: `${coverage.withOdometer || 0} de ${coverage.totalRecords || 0} saidas no periodo`,
        icon: "analytics",
        tone: "brand",
      })}
      ${buildStatCard({
        className: "dashboard-insight-card",
        label: "Saude do estoque",
        value: formatPercent(Math.min(stockHealth.percent || 0, 999), 0),
        note:
          stockHealth.totalMinimumBalance > 0
            ? `${stockHealth.lowStorageCount || 0} estoque(s) abaixo do minimo`
            : "Configure estoque minimo para monitorar cobertura",
        icon: "inventory",
        tone: stockHealth.lowStorageCount ? "warning" : "success",
      })}
    </div>
  `;
}

function formatFuelKindLabel(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "S10") {
    return "S-10";
  }
  if (normalized === "S500") {
    return "S-500";
  }
  return value || "-";
}

function normalizeClientFuelKind(value, fallback = "") {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
  if (normalized.includes("S500")) {
    return "S500";
  }
  if (normalized.includes("S10")) {
    return "S10";
  }
  return fallback;
}

function inferClientFuelKind(value, fallback = "") {
  return normalizeClientFuelKind(value, fallback);
}

function formatVehicleFuelProfile(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "BOTH") {
    return "S-500 e S-10";
  }
  return formatFuelKindLabel(normalized);
}

function normalizeClientStockType(value, fallback = "COMMON") {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (normalized === "FUEL" || normalized === "COMBUSTIVEL" || normalized === "COMBUSTIBLE") {
    return "FUEL";
  }
  if (normalized === "COMMON" || normalized === "COMUM" || normalized === "ESTOQUE_COMUM") {
    return "COMMON";
  }
  return fallback;
}

function formatStockTypeLabel(value) {
  return normalizeClientStockType(value, "COMMON") === "FUEL" ? "Combustivel" : "Estoque comum";
}

function getProductsByStockType(stockType) {
  const normalizedStockType = normalizeClientStockType(stockType, "COMMON");
  return state.products.filter(
    (product) => normalizeClientStockType(product.stockType, "COMMON") === normalizedStockType
  );
}

function getInventoryMovementsByStockType(stockType) {
  const normalizedStockType = normalizeClientStockType(stockType, "COMMON");
  return state.inventoryMovements.filter(
    (movement) => normalizeClientStockType(movement.productStockType, "COMMON") === normalizedStockType
  );
}

function getFilteredFuelInventoryMovements() {
  const selectedStorage = state.fuelStorages.find(
    (storage) => String(storage.id) === String(refs.fuelFilterStorage?.value || "")
  );
  const from = refs.fuelFilterFrom?.value ? toIsoDateTime(refs.fuelFilterFrom.value) : "";
  const to = refs.fuelFilterTo?.value ? toIsoDateTime(refs.fuelFilterTo.value) : "";

  return getInventoryMovementsByStockType("FUEL").filter((movement) => {
    if (selectedStorage) {
      const selectedProductId = Number(selectedStorage.productId || 0);
      const movementProductId = Number(movement.productId || 0);
      const fuelKindMatches =
        !selectedStorage.fuelKind ||
        String(movement.fuelKind || "").trim().toUpperCase() ===
          String(selectedStorage.fuelKind || "").trim().toUpperCase();

      if (selectedProductId) {
        if (movementProductId) {
          if (movementProductId !== selectedProductId) {
            return false;
          }
        } else if (!fuelKindMatches) {
          return false;
        }
      } else if (!fuelKindMatches) {
        return false;
      }
    }

    const occurredAt = String(movement.occurredAt || "");
    if (from && occurredAt && occurredAt < from) {
      return false;
    }
    if (to && occurredAt && occurredAt > to) {
      return false;
    }

    return true;
  });
}

function toLocalDateTimeInput(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function currentLocalDateTime() {
  return toLocalDateTimeInput(new Date().toISOString());
}

function currentLocalDate() {
  return toLocalDateTimeInput(new Date().toISOString()).slice(0, 10);
}

function shiftDateString(value, offsetDays) {
  if (!value) {
    return "";
  }

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + Number(offsetDays || 0));
  return date.toISOString().slice(0, 10);
}

function statusBadge(value) {
  const meta = statusMeta[value] || { label: value || "-", className: "status-gray" };
  return `<span class="status-badge ${meta.className}">${escapeHtml(meta.label)}</span>`;
}

function emptyRow(message, columns) {
  return `<tr><td colspan="${columns}" class="muted">${escapeHtml(message)}</td></tr>`;
}

function buildRowActionButton(action, id, label, iconHtml, extraClass = "") {
  const className = extraClass ? `row-button ${extraClass}` : "row-button";
  return `
    <button
      class="${className}"
      type="button"
      data-action="${action}"
      data-id="${id}"
      title="${escapeHtml(label)}"
      aria-label="${escapeHtml(label)}"
    >
      ${iconHtml}
    </button>
  `;
}

function syncResponsiveTableLabels(root = document) {
  root.querySelectorAll(".table-wrapper table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th")).map((cell) => cell.textContent.trim());
    if (!headers.length) {
      return;
    }

    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (!(cell instanceof HTMLElement) || cell.tagName !== "TD") {
          return;
        }
        if (Number(cell.colSpan || 0) > 1) {
          cell.removeAttribute("data-label");
          return;
        }
        cell.setAttribute("data-label", headers[Math.min(index, headers.length - 1)] || "");
      });
    });
  });
}

function scrollToElement(element, block = "start") {
  if (!element?.scrollIntoView) {
    return;
  }
  element.scrollIntoView({ block });
}

function iconMarkup(name, className = "ui-icon") {
  const body = UI_ICONS[name] || UI_ICONS.dashboard;
  return `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${body}
    </svg>
  `;
}

function buildIconBadge(icon, tone = "brand") {
  return `<span class="ui-icon-badge ui-icon-badge--${tone}">${iconMarkup(icon)}</span>`;
}

function buildStatCard({ className, label, value, note = "", icon = "", tone = "brand", extra = "" }) {
  return `
    <article class="${className}">
      ${icon ? buildIconBadge(icon, tone) : ""}
      <span class="eyebrow">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${note ? `<span class="muted">${escapeHtml(note)}</span>` : ""}
      ${extra}
    </article>
  `;
}

function decorateStaticInterface() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    if (button.dataset.decorated === "true") {
      return;
    }

    const section = button.dataset.section;
    const label = button.textContent.trim();
    button.dataset.tooltip = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.innerHTML = `
      <span class="nav-item__icon">${iconMarkup(NAV_ICONS[section] || "dashboard")}</span>
      <span class="nav-item__label">${escapeHtml(label)}</span>
    `;
    button.dataset.decorated = "true";
  });

  const topbarSystemLabel = refs.appTopbar?.querySelector(".topbar-system-copy .eyebrow");
  if (topbarSystemLabel) {
    topbarSystemLabel.textContent = "Painel operacional";
    topbarSystemLabel.classList.add("topbar-system-label");
  }

  if (refs.sidebarToggleButton && refs.sidebarToggleButton.dataset.decorated !== "true") {
    refs.sidebarToggleButton.innerHTML = iconMarkup("menu");
    refs.sidebarToggleButton.dataset.decorated = "true";
  }

  [
    [refs.topbarSearchButton, "search"],
    [refs.refreshAllButton, "refresh"],
    [refs.logoutButton, "logout"],
  ].forEach(([button, icon]) => {
    if (!button || button.dataset.decorated === "true") {
      return;
    }

    const iconSlot = button.querySelector("[data-topbar-icon]");
    if (iconSlot) {
      iconSlot.innerHTML = iconMarkup(icon);
    }
    button.dataset.decorated = "true";
  });

  syncTopbarThemeButton();

  document.querySelectorAll(".content-section").forEach((panel) => {
    const header = panel.querySelector(".section-header > div:first-child");
    const title = header?.querySelector("h2");
    if (!header || !title || header.dataset.decorated === "true") {
      return;
    }

    const section = panel.id.replace(/-section$/, "");
    const titleLabel = title.textContent.trim();
    title.classList.add("section-heading");
    title.innerHTML = `
      <span class="section-heading__icon">${iconMarkup(SECTION_ICONS[section] || "dashboard")}</span>
      <span>${escapeHtml(titleLabel)}</span>
    `;
    header.dataset.decorated = "true";
  });

  document.querySelectorAll("#dashboard-section .dashboard-grid > article .card-title").forEach((title, index) => {
    if (title.dataset.decorated === "true") {
      return;
    }

    title.classList.add("card-title--with-icon");
    title.insertAdjacentHTML(
      "afterbegin",
      `<span class="card-title__icon">${iconMarkup(DASHBOARD_TITLE_ICONS[index] || "dashboard")}</span>`
    );
    title.dataset.decorated = "true";
  });
}

function hideAppLoading() {
  if (!refs.appLoading) {
    return;
  }

  window.requestAnimationFrame(() => {
    refs.appLoading.classList.add("is-hidden");
    refs.appLoading.setAttribute("aria-hidden", "true");
  });
}

function setUser(user) {
  state.user = user;
  const canAccessAdmin = user && user.role === "ADMIN";

  if (!user) {
    runtimeState.sidebarOpen = false;
  }

  refs.authScreen.classList.toggle("hidden", Boolean(user));
  refs.appShell.classList.toggle("hidden", !user);
  refs.adminNavButton.classList.toggle("hidden", !canAccessAdmin);
  syncThemeSwitcherPlacement();
  syncSidebarLayout();

  if (!canAccessAdmin) {
    state.adminUsers = [];
    state.logs = [];
    renderAdmin();
  }

  if (!user) {
    state.section = "dashboard";
    switchAuthMode("login");
    refs.loginForm.reset();
    refs.activationForm.reset();
    if (refs.topbarUserAvatar) {
      refs.topbarUserAvatar.textContent = "--";
      refs.topbarUserAvatar.setAttribute("title", "Nenhum usuario conectado");
    }
    refs.topbarUserName.textContent = "-";
    refs.topbarUserRole.textContent = "-";
    setSection("dashboard");
    return;
  }

  if (refs.topbarUserAvatar) {
    refs.topbarUserAvatar.textContent = buildUserInitials(user.name);
    refs.topbarUserAvatar.setAttribute("title", user.name);
  }
  refs.topbarUserName.textContent = user.name;
  refs.topbarUserRole.textContent = roleLabels[user.role] || user.role;
  updateTopbarContext(state.section);

  if (!canAccessAdmin && state.section === "admin") {
    setSection("dashboard");
  }
}

function setSection(section) {
  const nextSection = section === "admin" && state.user?.role !== "ADMIN" ? "dashboard" : section;
  state.section = nextSection;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === nextSection);
  });

  document.querySelectorAll(".content-section").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${nextSection}-section`);
  });

  updateTopbarContext(nextSection);
  closeSidebarOverlay();
}

function normalizeDashboardPeriodDays(value) {
  const safeValue = Number(value || 30);
  return [1, 7, 30].includes(safeValue) ? safeValue : 30;
}

function persistDashboardFilters() {
  const filters = state.dashboard.filters || {};
  window.localStorage.setItem(
    DASHBOARD_FILTERS_STORAGE_KEY,
    JSON.stringify({
      quickPeriodDays: normalizeDashboardPeriodDays(filters.quickPeriodDays),
      selectedPlate: filters.selectedPlate || "",
      focusPlate: filters.focusPlate || "",
      view: normalizeDashboardView(state.dashboard.view),
    })
  );
}

function readStoredDashboardFilters() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(DASHBOARD_FILTERS_STORAGE_KEY) || "{}");
    return {
      quickPeriodDays: normalizeDashboardPeriodDays(stored.quickPeriodDays),
      selectedPlate: String(stored.selectedPlate || "").trim().toUpperCase(),
      focusPlate: String(stored.focusPlate || "").trim().toUpperCase(),
      view: normalizeDashboardView(stored.view),
    };
  } catch (error) {
    return {
      quickPeriodDays: 30,
      selectedPlate: "",
      focusPlate: "",
      view: "overview",
    };
  }
}

function applyDefaultFormValues() {
  const storedDashboardFilters = readStoredDashboardFilters();
  state.dashboard.view = storedDashboardFilters.view || state.dashboard.view || "overview";
  state.dashboard.filters.quickPeriodDays =
    normalizeDashboardPeriodDays(storedDashboardFilters.quickPeriodDays || state.dashboard.filters.quickPeriodDays || 30);
  state.dashboard.filters.selectedPlate = storedDashboardFilters.selectedPlate || state.dashboard.filters.selectedPlate || "";
  state.dashboard.filters.focusPlate = storedDashboardFilters.focusPlate || state.dashboard.filters.focusPlate || "";
  state.dashboard.filters.dateTo = state.dashboard.filters.dateTo || currentLocalDate();
  state.dashboard.filters.dateFrom = state.dashboard.filters.dateFrom || shiftDateString(currentLocalDate(), -29);
  if (refs.dashboardPeriodFilter) {
    refs.dashboardPeriodFilter.value = String(state.dashboard.filters.quickPeriodDays || 30);
  }
  if (refs.dashboardDataFilter) {
    refs.dashboardDataFilter.value = normalizeDashboardView(state.dashboard.view);
  }
  if (refs.dashboardDateTo) {
    refs.dashboardDateTo.value = state.dashboard.filters.dateTo;
  }
  if (refs.dashboardDateFrom) {
    refs.dashboardDateFrom.value = state.dashboard.filters.dateFrom;
  }
  refs.noteForm.elements.status.value = "NEW";
  refs.noteForm.elements.category.value = "LOGISTICS";
  refs.noteForm.elements.issueDate.value = currentLocalDateTime();
  refs.productForm.elements.stockType.value = "COMMON";
  refs.fuelForm.elements.occurredAt.value = currentLocalDateTime();
  refs.fuelForm.elements.type.value = "EXIT";
  if (refs.fuelStockForm) {
    refs.fuelStockForm.elements.type.value = "IN";
    refs.fuelStockForm.elements.occurredAt.value = currentLocalDateTime();
  }
  refs.movementForm.elements.occurredAt.value = currentLocalDateTime();
  refs.scheduleForm.elements.scheduledDate.value = currentLocalDate();
  refs.scheduleForm.elements.responsibleName.value = state.user?.name || "";
  refs.fineForm.elements.fineDate.value = currentLocalDate();
  refs.checklistForm.elements.checklistDate.value = currentLocalDateTime();
  refs.checklistForm.elements.checklistType.value = "PRE_USE";
  if (refs.checklistForm.elements.temporaryIssue) {
    refs.checklistForm.elements.temporaryIssue.value = "";
  }
  refs.emailForm.elements.receivedAt.value = currentLocalDateTime();
  if (refs.kardexForm) {
    refs.kardexForm.elements.stockType.value = "COMMON";
    refs.kardexForm.elements.from.value = currentLocalDate().slice(0, 8) + "01";
    refs.kardexForm.elements.to.value = currentLocalDate();
  }
  resetAdminUserForm();
  resetChecklistTemplateForm();
  resetVehicleForm();
  state.checklistDraftItems = cloneChecklistTemplate();
  renderChecklistComposer();
  syncProductFormState();
  syncFuelFormState();
  syncKardexFormState();
}

async function refreshAll() {
  if (!state.user) {
    return;
  }

  await Promise.all([refreshCompanySettings(), refreshChecklistTemplate()]);

  const tasks = [
    refreshDashboard(),
    refreshNotes(),
    refreshProducts(),
    refreshVehicles(),
    refreshFuel(),
    refreshSchedules(),
    refreshFines(),
    refreshChecklists(),
    refreshEmails(),
  ];

  if (state.user.role === "ADMIN") {
    tasks.push(refreshAdmin());
  }

  const results = await Promise.allSettled(tasks);
  try {
    await refreshInventoryMovements();
  } catch (error) {
    showToast(error.message, "error");
  }

  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    showToast(failed.reason.message, "error");
  }
}

function buildDashboardCacheKey() {
  const filters = state.dashboard.filters || {};
  return JSON.stringify({
    days: normalizeDashboardPeriodDays(filters.quickPeriodDays),
    selectedPlate: filters.selectedPlate || "",
    focusPlate: filters.selectedPlate || filters.focusPlate || "",
    useCustomRange: Boolean(filters.useCustomRange),
    dateFrom: filters.dateFrom || "",
    dateTo: filters.dateTo || "",
  });
}

async function refreshDashboard(options = {}) {
  const { useCache = false, invalidateCache = false } = options;
  const query = buildDashboardRequestParams();
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const cacheKey = buildDashboardCacheKey();

  if (invalidateCache || !useCache) {
    state.dashboard.cache.clear();
  }

  if (useCache && state.dashboard.cache.has(cacheKey)) {
    const cached = state.dashboard.cache.get(cacheKey);
    state.dashboard = {
      ...state.dashboard,
      metrics: cached.metrics || state.dashboard.metrics,
      analytics: cached.analytics || state.dashboard.analytics,
      alerts: Array.isArray(cached.alerts) ? cached.alerts : [],
      todaySchedules: Array.isArray(cached.todaySchedules) ? cached.todaySchedules : [],
    };
    renderDashboard();
    return;
  }

  const requestToken = Number(state.dashboard.requestToken || 0) + 1;
  state.dashboard.requestToken = requestToken;
  const response = await api(`/api/dashboard${suffix}`);
  if (requestToken !== state.dashboard.requestToken) {
    return;
  }

  state.dashboard.cache.set(cacheKey, {
    metrics: response.metrics || state.dashboard.metrics,
    analytics: response.analytics || state.dashboard.analytics,
    alerts: Array.isArray(response.alerts) ? response.alerts : [],
    todaySchedules: Array.isArray(response.todaySchedules) ? response.todaySchedules : [],
  });
  state.dashboard = {
    ...state.dashboard,
    metrics: response.metrics || state.dashboard.metrics,
    analytics: response.analytics || state.dashboard.analytics,
    alerts: Array.isArray(response.alerts) ? response.alerts : [],
    todaySchedules: Array.isArray(response.todaySchedules) ? response.todaySchedules : [],
  };
  renderDashboard();
  renderVehicles();
}

async function refreshNotes() {
  const search = refs.notesSearch.value.trim();
  const status = refs.notesStatusFilter.value;
  const category = refs.notesCategoryFilter.value;
  const query = new URLSearchParams();

  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (category) query.set("category", category);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await api(`/api/notes${suffix}`);
  state.notes = response.items || [];
  renderNotes();
}

async function refreshProducts() {
  const response = await api("/api/products");
  state.products = response.items || [];
  renderProducts();
  updateMovementProductSelect();
  updateFuelStockProductSelect();
  updateKardexProductSelect();
}

async function refreshCompanySettings() {
  const response = await api("/api/settings/company");
  state.company = {
    ...state.company,
    ...(response.item || {}),
  };
  renderAdmin();
}

async function refreshChecklistTemplate() {
  const response = await api("/api/checklists/template");
  state.checklistTemplate = Array.isArray(response.items) ? response.items : [];
  const shouldResetDraft =
    !state.checklistDraftItems.length ||
    (state.section !== "checklists" && !refs.checklistForm?.elements?.id?.value);
  if (shouldResetDraft) {
    state.checklistDraftItems = cloneChecklistTemplate();
  }
  renderChecklists();
}

async function refreshInventoryMovements() {
  const response = await api("/api/inventory/movements");
  state.inventoryMovements = response.items || [];
  renderInventoryMovements();
  renderFuelInventoryMovements();
}

async function refreshVehicles() {
  const response = await api("/api/vehicles");
  state.vehicles = response.items || [];
  renderVehicles();
  renderFuelVehicleOptions();
}

async function refreshFuel() {
  const query = new URLSearchParams();
  if (refs.fuelFilterStorage.value) query.set("storageId", refs.fuelFilterStorage.value);
  if (refs.fuelFilterFrom.value) query.set("from", toIsoDateTime(refs.fuelFilterFrom.value));
  if (refs.fuelFilterTo.value) query.set("to", toIsoDateTime(refs.fuelFilterTo.value));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await api(`/api/fuel${suffix}`);
  state.fuelRecords = response.items || [];
  state.fuelStorages = response.storages || [];
  renderFuel();
  renderFuelStorageOptions();
  renderFuelVehicleOptions();
  updateFuelStockProductSelect();
  updateKardexProductSelect();
  syncFuelFormState();
  renderVehicles();
}

async function refreshSchedules() {
  const response = await api("/api/schedules");
  state.schedules = response.items || [];
  renderSchedules();
}

async function refreshFines() {
  const response = await api("/api/fines");
  state.fines = response.items || [];
  renderFines();
}

async function refreshChecklists() {
  const response = await api("/api/checklists");
  state.checklists = response.items || [];
  renderChecklists();
}

async function refreshEmails() {
  const response = await api("/api/emails");
  state.emails = response.items || [];
  renderEmails();
}

async function refreshAdmin() {
  if (state.user?.role !== "ADMIN") {
    state.adminUsers = [];
    state.logs = [];
    renderAdmin();
    return;
  }

  const [logsResponse, usersResponse] = await Promise.all([
    api("/api/admin/logs?limit=120"),
    api("/api/admin/users"),
  ]);
  state.logs = logsResponse.items || [];
  state.adminUsers = usersResponse?.items || [];
  renderAdmin();
}

async function maybeRefreshAdmin() {
  if (state.user?.role === "ADMIN") {
    await refreshAdmin();
  }
}

function renderDashboard() {
  const fuelByKind = state.dashboard.metrics.fuelByKind || {};
  const metrics = [
    {
      label: "Notas pendentes",
      value: state.dashboard.metrics.pendingNotes,
    },
    {
      label: "Aguardando reconhecimento",
      value: state.dashboard.metrics.waitingRecognition,
    },
    {
      label: "Enviadas ao financeiro",
      value: state.dashboard.metrics.sentToFinance,
    },
    {
      label: "Estoque de combustível",
      value: `${formatLiters(state.dashboard.metrics.fuelBalance || 0)} L`,
    },
  ];

  metrics.push(
    {
      label: "S-500",
      value: `${formatLiters(fuelByKind.S500 || 0)} L`,
    },
    {
      label: "S-10",
      value: `${formatLiters(fuelByKind.S10 || 0)} L`,
    }
  );

  refs.dashboardMetrics.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <span class="eyebrow">${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>
      `
    )
    .join("");

  refs.dashboardAlerts.innerHTML = state.dashboard.alerts.length
    ? state.dashboard.alerts
        .map(
          (alert) => `
            <article class="stack-item">
              <strong>${escapeHtml(alert.title)}</strong>
              <p class="muted">${escapeHtml(alert.description)}</p>
            </article>
          `
        )
        .join("")
    : `<div class="stack-item"><strong>Sem alertas críticos</strong><p class="muted">Tudo sob controle neste momento.</p></div>`;

  refs.dashboardSchedules.innerHTML = state.dashboard.todaySchedules.length
    ? state.dashboard.todaySchedules
        .map(
          (item) => `
            <article class="stack-item">
              <strong>${escapeHtml(item.vehicle)}</strong>
              <p class="muted">${escapeHtml(item.driver)}${item.assistant ? ` • ${escapeHtml(item.assistant)}` : ""}</p>
            </article>
          `
        )
        .join("")
    : `<div class="stack-item"><strong>Nenhuma escala para hoje</strong><p class="muted">Cadastre a programação do dia para aparecer aqui.</p></div>`;
}

function renderDashboard() {
  const metricsState = state.dashboard.metrics || {};
  const analytics = state.dashboard.analytics || {};
  const fuelByKind = metricsState.fuelByKind || {};
  const selectedPlate = analytics.selectedPlate || "";
  const availablePlates = analytics.availablePlates || [];
  const selectedVehicle = analytics.selectedVehicle || null;
  const recentVehicleRecords = (analytics.recentFuelRecords || []).filter((item) =>
    selectedVehicle ? item.plate === selectedVehicle.plate : true
  );
  const bestVehicle = (analytics.efficiencyRanking || [])[0] || null;
  const periodDays = Number(analytics.periodDays || refs.dashboardPeriodFilter.value || 30);

  refs.dashboardPeriodFilter.value = String(periodDays);
  refs.dashboardPlateFilter.innerHTML = [
    `<option value="">Todas as placas</option>`,
    ...availablePlates.map(
      (plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`
    ),
  ].join("");
  refs.dashboardPlateFilter.value =
    selectedPlate && availablePlates.includes(selectedPlate) ? selectedPlate : "";

  refs.dashboardSummary.innerHTML = `
    <article class="dashboard-hero-card">
      <div class="dashboard-hero-card__header">
        ${buildIconBadge(selectedPlate ? "vehicle" : "dashboard", selectedPlate ? "danger" : "brand")}
        <div>
          <span class="eyebrow">Leitura operacional</span>
          <h3>${escapeHtml(selectedPlate ? `Analise focada em ${selectedPlate}` : "Visao consolidada da logistica")}</h3>
          <p class="muted">
            ${
              selectedPlate
                ? escapeHtml(`Indicadores filtrados para a placa ${selectedPlate} nos ultimos ${periodDays} dias.`)
                : escapeHtml(`Consumos, eficiencia e gargalos do abastecimento nos ultimos ${periodDays} dias.`)
            }
          </p>
        </div>
      </div>
      <div class="dashboard-chip-row">
        <span class="dashboard-chip">${escapeHtml(`S-500 ${formatLiters(fuelByKind.S500 || 0)} L`)}</span>
        <span class="dashboard-chip">${escapeHtml(`S-10 ${formatLiters(fuelByKind.S10 || 0)} L`)}</span>
        <span class="dashboard-chip">${escapeHtml(`${metricsState.alertCount || 0} alerta(s) ativos`)}</span>
      </div>
    </article>
    <div class="dashboard-summary-stack">
      ${buildStatCard({
        className: "dashboard-summary-stat",
        label: "Consumo no periodo",
        value: `${formatLiters(metricsState.periodFuelConsumption || 0)} L`,
        note: "Saidas registradas no intervalo atual",
        icon: "fuel",
        tone: "brand",
      })}
      ${buildStatCard({
        className: "dashboard-summary-stat",
        label: "Media diaria",
        value: `${formatLiters(metricsState.averageDailyConsumption || 0)} L`,
        note: "Consumo medio por dia dentro do filtro",
        icon: "analytics",
        tone: "neutral",
      })}
      ${buildStatCard({
        className: "dashboard-summary-stat",
        label: "Melhor eficiencia",
        value: bestVehicle ? formatKmPerLiter(bestVehicle.kmPerLiter) : "-",
        note: bestVehicle ? `Placa ${bestVehicle.plate}` : "Aguardando hodometro valido",
        icon: "efficiency",
        tone: bestVehicle ? "success" : "warning",
      })}
    </div>
  `;

  const metrics = [
    {
      label: "Notas pendentes",
      value: formatNumber(metricsState.pendingNotes || 0),
      icon: "notes",
      tone: "warning",
    },
    {
      label: "Aguardando reconhecimento",
      value: formatNumber(metricsState.waitingRecognition || 0),
      icon: "alert",
      tone: "danger",
    },
    {
      label: "Enviadas ao financeiro",
      value: formatNumber(metricsState.sentToFinance || 0),
      icon: "emails",
      tone: "brand",
    },
    {
      label: "Saldo combustivel",
      value: `${formatLiters(metricsState.fuelBalance || 0)} L`,
      icon: "fuel",
      tone: "brand",
    },
    {
      label: "Estoque minimo em alerta",
      value: formatNumber(metricsState.lowStockCount || 0),
      icon: "inventory",
      tone: metricsState.lowStockCount ? "danger" : "success",
    },
    {
      label: "Veiculos monitorados",
      value: formatNumber(metricsState.monitoredVehicles || 0),
      icon: "vehicle",
      tone: "neutral",
    },
  ];

  refs.dashboardMetrics.innerHTML = metrics
    .map((metric) =>
      buildStatCard({
        className: "metric-card metric-card--dashboard",
        label: metric.label,
        value: metric.value,
        icon: metric.icon,
        tone: metric.tone,
      })
    )
    .join("");

  refs.dashboardConsumptionChart.innerHTML = renderConsumptionChart(analytics);

  refs.dashboardEfficiencySpotlight.innerHTML = selectedVehicle
    ? `
        <div class="dashboard-spotlight">
          <div class="dashboard-spotlight__header">
            <div>
              <span class="eyebrow">Placa em foco</span>
              <h4>${escapeHtml(selectedVehicle.plate)}</h4>
              <p class="muted">Media calculada apenas com saidas que possuem hodometro registrado.</p>
            </div>
            <div class="dashboard-spotlight__metric">
              <strong>${escapeHtml(formatKmPerLiter(selectedVehicle.kmPerLiter))}</strong>
              <span>${escapeHtml(
                selectedVehicle.samples
                  ? `${selectedVehicle.samples} leitura(s) validas`
                  : "Aguardando mais uma leitura com hodometro"
              )}</span>
            </div>
          </div>
          <div class="dashboard-spotlight__stats">
            <article class="dashboard-mini-stat">
              <span class="eyebrow">Distancia analisada</span>
              <strong>${escapeHtml(formatDistance(selectedVehicle.totalDistanceKm || 0))}</strong>
            </article>
            <article class="dashboard-mini-stat">
              <span class="eyebrow">Litros analisados</span>
              <strong>${escapeHtml(`${formatLiters(selectedVehicle.totalLiters || 0)} L`)}</strong>
            </article>
            <article class="dashboard-mini-stat">
              <span class="eyebrow">Ultimo hodometro</span>
              <strong>${escapeHtml(
                selectedVehicle.lastOdometerKm ? formatDistance(selectedVehicle.lastOdometerKm) : "-"
              )}</strong>
            </article>
          </div>
          ${
            (selectedVehicle.segments || []).length
              ? `
                  <div class="dashboard-segment-list">
                    ${selectedVehicle.segments
                      .slice()
                      .reverse()
                      .map(
                        (segment) => `
                          <article class="dashboard-segment-item">
                            <strong>${escapeHtml(formatShortDate(segment.date))}</strong>
                            <span>${escapeHtml(formatKmPerLiter(segment.kmPerLiter))}</span>
                            <span class="muted">${escapeHtml(
                              `${formatDistance(segment.distanceKm)} em ${formatLiters(segment.liters)} L`
                            )}</span>
                          </article>
                        `
                      )
                      .join("")}
                  </div>
                `
              : `<div class="dashboard-empty dashboard-empty--compact"><strong>Sem historico suficiente</strong><p class="muted">Registre ao menos duas saidas com hodometro para liberar a media por placa.</p></div>`
          }
          ${
            recentVehicleRecords.length
              ? `
                  <div class="dashboard-recent-list">
                    ${recentVehicleRecords
                      .slice(0, 3)
                      .map(
                        (record) => `
                          <article class="dashboard-recent-item">
                            <strong>${escapeHtml(`${formatLiters(record.quantity)} L`)}</strong>
                            <span>${escapeHtml(formatFuelKindLabel(record.fuelKind))}</span>
                            <span class="muted">${escapeHtml(formatDateTime(record.occurredAt))}</span>
                          </article>
                        `
                      )
                      .join("")}
                  </div>
                `
              : ""
          }
        </div>
      `
    : renderDashboardEmpty(
        "Eficiência indisponivel",
        "Preencha o hodometro nas saidas para calcular media km/L real por placa."
      );

  refs.dashboardKmReview.innerHTML = selectedVehicle
    ? (() => {
        const segments = (selectedVehicle.segments || []).slice().reverse().slice(0, 4);
        const reviewCards = segments.length
          ? segments.map((segment) => {
              const isHigh = Number(segment.kmPerLiter || 0) >= 8;
              const isLow = Number(segment.kmPerLiter || 0) > 0 && Number(segment.kmPerLiter || 0) <= 2.5;
              const toneLabel = isHigh
                ? "Revisar media alta"
                : isLow
                  ? "Revisar media baixa"
                  : "Faixa operacional";

              return `
                <article class="stack-item">
                  <strong>${escapeHtml(`${selectedVehicle.plate} • ${formatShortDate(segment.date)}`)}</strong>
                  <p class="muted">${escapeHtml(
                    `${formatDistance(segment.distanceKm)} rodados com ${formatLiters(segment.liters)} L`
                  )}</p>
                  <p class="muted">${escapeHtml(`Media apurada: ${formatKmPerLiter(segment.kmPerLiter)} • ${toneLabel}`)}</p>
                </article>
              `;
            })
          : [
              `<article class="stack-item"><strong>Sem pares suficientes</strong><p class="muted">Sao necessarios pelo menos dois abastecimentos com KM para conferir a media real.</p></article>`,
            ];

        const latestRecords = recentVehicleRecords.slice(0, 3).map(
          (record) => `
            <article class="stack-item">
              <strong>${escapeHtml(`${formatFuelKindLabel(record.fuelKind)} • ${formatLiters(record.quantity)} L`)}</strong>
              <p class="muted">${escapeHtml(formatDateTime(record.occurredAt))}</p>
              <p class="muted">${escapeHtml(
                record.odometerKm !== null && record.odometerKm !== undefined
                  ? `KM informado: ${formatDistance(record.odometerKm)}`
                  : "KM nao informado neste abastecimento"
              )}</p>
            </article>
          `
        );

        return [...reviewCards, ...latestRecords].join("");
      })()
    : `<article class="stack-item"><strong>Selecione uma placa</strong><p class="muted">Filtre um veiculo para conferir rapidamente as ultimas medias de KM/L.</p></article>`;

  refs.dashboardRanking.innerHTML = renderMeterList(
    (analytics.efficiencyRanking || []).slice(0, 5).map((item) => ({
      label: item.plate,
      value: item.kmPerLiter,
      totalDistanceKm: item.totalDistanceKm,
      totalLiters: item.totalLiters,
      samples: item.samples,
    })),
    {
      emptyTitle: "Sem eficiencia calculada",
      emptyDescription: "Assim que os abastecimentos tiverem hodometro, o ranking por placa aparece aqui.",
      valueFormatter: (value) => formatKmPerLiter(value),
      secondaryFormatter: (item) =>
        `${formatDistance(item.totalDistanceKm)} • ${formatLiters(item.totalLiters)} L • ${item.samples} leitura(s)`,
    }
  );

  refs.dashboardTopConsumers.innerHTML = renderMeterList(
    (analytics.topConsumers || []).map((item) => ({
      label: item.plate,
      value: item.totalLiters,
      records: item.records,
      lastAt: item.lastAt,
    })),
    {
      emptyTitle: "Sem consumo registrado",
      emptyDescription: "Nao houve saidas de combustivel dentro do periodo selecionado.",
      valueFormatter: (value) => `${formatLiters(value)} L`,
      secondaryFormatter: (item) =>
        `${item.records} lancamento(s) • ultimo em ${formatShortDate(item.lastAt)}`,
    }
  );

  refs.dashboardNoteFlow.innerHTML = `
    ${renderMeterList(
      (analytics.noteStatuses || []).map((item) => ({
        label: statusMeta[item.status]?.label || item.status,
        value: item.total,
      })),
      {
        emptyTitle: "Sem fluxo de notas",
        emptyDescription: "Cadastre ou importe notas para acompanhar o funil operacional.",
        valueFormatter: (value) => formatNumber(value),
        secondaryFormatter: () => "Volume acumulado na base",
      }
    )}
    ${renderOperationalInsights(analytics)}
  `;

  refs.dashboardAlerts.innerHTML = state.dashboard.alerts.length
    ? state.dashboard.alerts
        .map(
          (alert) => `
            <article class="stack-item">
              <strong>${escapeHtml(alert.title)}</strong>
              <p class="muted">${escapeHtml(alert.description)}</p>
            </article>
          `
        )
        .join("")
    : `<div class="stack-item"><strong>Sem alertas criticos</strong><p class="muted">Tudo sob controle neste momento.</p></div>`;

  refs.dashboardSchedules.innerHTML = state.dashboard.todaySchedules.length
    ? state.dashboard.todaySchedules
        .map(
          (item) => `
            <article class="stack-item">
              <strong>${escapeHtml(item.vehicle)}</strong>
              <p class="muted">${escapeHtml(item.driver)}${item.assistant ? ` • ${escapeHtml(item.assistant)}` : ""}</p>
            </article>
          `
        )
        .join("")
    : `<div class="stack-item"><strong>Nenhuma escala para hoje</strong><p class="muted">Cadastre a programacao do dia para aparecer aqui.</p></div>`;
}

function normalizeDashboardView(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return DASHBOARD_VIEW_META[normalized] ? normalized : "overview";
}

function getDashboardViewMeta(view = state.dashboard.view) {
  return DASHBOARD_VIEW_META[normalizeDashboardView(view)] || DASHBOARD_VIEW_META.overview;
}

function buildDashboardRequestParams() {
  const query = new URLSearchParams();
  const filters = state.dashboard.filters || {};

  if (filters.useCustomRange && filters.dateFrom && filters.dateTo) {
    query.set("from", filters.dateFrom);
    query.set("to", filters.dateTo);
  } else {
    query.set("days", String(normalizeDashboardPeriodDays(filters.quickPeriodDays)));
  }

  if (filters.selectedPlate) {
    query.set("plate", filters.selectedPlate);
  }

  if (filters.selectedPlate || filters.focusPlate) {
    query.set("focusPlate", filters.selectedPlate || filters.focusPlate);
  }

  return query;
}

function syncDashboardDateInputsWithQuickPeriod(days) {
  const safeDays = Math.max(Number(days || 30), 1);
  const endDate = currentLocalDate();
  const startDate = shiftDateString(endDate, -(safeDays - 1));
  state.dashboard.filters.dateFrom = startDate;
  state.dashboard.filters.dateTo = endDate;

  if (refs.dashboardDateFrom) {
    refs.dashboardDateFrom.value = startDate;
  }
  if (refs.dashboardDateTo) {
    refs.dashboardDateTo.value = endDate;
  }
}

function syncDashboardFilterInputs() {
  const view = normalizeDashboardView(state.dashboard.view);
  const meta = getDashboardViewMeta(view);
  const analytics = state.dashboard.analytics || {};
  const filters = state.dashboard.filters || {};
  const availablePlates = Array.isArray(analytics.availablePlates) ? analytics.availablePlates : [];
  const selectedPlate = availablePlates.includes(filters.selectedPlate) ? filters.selectedPlate : "";
  const fallbackFocusPlate =
    analytics.focusPlate || analytics.selectedVehicle?.plate || availablePlates[0] || "";
  const focusPlate =
    selectedPlate ||
    (availablePlates.includes(filters.focusPlate) ? filters.focusPlate : fallbackFocusPlate);

  state.dashboard.filters.selectedPlate = selectedPlate;
  state.dashboard.filters.focusPlate = focusPlate;
  refs.dashboardContextTitle.textContent = meta.label;
  refs.dashboardContextDescription.textContent = meta.description;

  document.querySelectorAll("[data-dashboard-view]").forEach((button) => {
    const isActive = button.dataset.dashboardView === view;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (refs.dashboardPeriodFilter) {
    refs.dashboardPeriodFilter.value = String(
      normalizeDashboardPeriodDays(filters.quickPeriodDays || analytics.periodDays || 30)
    );
  }

  if (refs.dashboardDataFilter) {
    refs.dashboardDataFilter.value = view;
  }

  if (refs.dashboardPlateFilter) {
    refs.dashboardPlateFilter.innerHTML = [
      `<option value="">Todas as placas</option>`,
      ...availablePlates.map(
        (plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`
      ),
    ].join("");
    refs.dashboardPlateFilter.value = selectedPlate;
  }

  const defaultFrom = filters.dateFrom || analytics.periodStart || shiftDateString(currentLocalDate(), -29);
  const defaultTo = filters.dateTo || analytics.periodEnd || currentLocalDate();
  if (refs.dashboardDateFrom) {
    refs.dashboardDateFrom.value = defaultFrom;
  }
  if (refs.dashboardDateTo) {
    refs.dashboardDateTo.value = defaultTo;
  }

  persistDashboardFilters();
}

async function setDashboardView(view) {
  const nextView = normalizeDashboardView(view);
  state.dashboard.view = nextView;
  syncDashboardFilterInputs();
  renderDashboard();
}

async function handleDashboardViewSwitch(event) {
  const button = event.target.closest("[data-dashboard-view]");
  if (!button) {
    return;
  }

  await setDashboardView(button.dataset.dashboardView);
}

async function handleDashboardQuickPeriodChange() {
  state.dashboard.filters.quickPeriodDays = normalizeDashboardPeriodDays(
    refs.dashboardPeriodFilter?.value || 30
  );
  state.dashboard.filters.useCustomRange = false;
  state.dashboard.lazy.fuelChartLoaded = false;
  syncDashboardDateInputsWithQuickPeriod(state.dashboard.filters.quickPeriodDays);
  persistDashboardFilters();
  await refreshDashboard({ useCache: true });
}

async function handleDashboardPlateFilterChange() {
  state.dashboard.filters.selectedPlate = refs.dashboardPlateFilter?.value || "";
  if (state.dashboard.filters.selectedPlate) {
    state.dashboard.filters.focusPlate = state.dashboard.filters.selectedPlate;
  }
  state.dashboard.lazy.fuelChartLoaded = false;
  persistDashboardFilters();
  await refreshDashboard({ useCache: true });
}

async function handleDashboardPeriodApply() {
  const dateFrom = refs.dashboardDateFrom?.value || "";
  const dateTo = refs.dashboardDateTo?.value || "";
  if (!dateFrom || !dateTo) {
    showToast("Informe a data inicial e final para aplicar o periodo.", "error");
    return;
  }
  if (dateFrom > dateTo) {
    showToast("A data inicial nao pode ser maior que a data final.", "error");
    return;
  }
  state.dashboard.filters.dateFrom = dateFrom;
  state.dashboard.filters.dateTo = dateTo;
  state.dashboard.filters.useCustomRange = true;
  state.dashboard.lazy.fuelChartLoaded = false;
  await refreshDashboard({ useCache: true });
}

async function handleDashboardPeriodReset() {
  state.dashboard.filters.quickPeriodDays = 30;
  state.dashboard.filters.useCustomRange = false;
  if (refs.dashboardPeriodFilter) {
    refs.dashboardPeriodFilter.value = "30";
  }
  syncDashboardDateInputsWithQuickPeriod(30);
  state.dashboard.lazy.fuelChartLoaded = false;
  persistDashboardFilters();
  await refreshDashboard({ useCache: true });
}

async function handleDashboardDataFilterChange() {
  await setDashboardView(refs.dashboardDataFilter?.value || "overview");
}

async function handleDashboardFocusPlateChange(value) {
  if (state.dashboard.filters.selectedPlate) {
    return;
  }

  state.dashboard.filters.focusPlate = String(value || "").trim().toUpperCase();
  persistDashboardFilters();
  await refreshDashboard({ useCache: true });
}

async function saveDashboardOdometerChange(recordId, clearValue = false) {
  const safeRecordId = Number(recordId || 0);
  if (!safeRecordId) {
    return;
  }

  const odometerInput = document.querySelector(`[data-dashboard-odometer-input="${safeRecordId}"]`);
  const reasonInput = document.querySelector(`[data-dashboard-odometer-reason="${safeRecordId}"]`);
  const panel = document.querySelector(`[data-dashboard-correction-panel="${safeRecordId}"]`);
  const rawValue = clearValue ? "" : odometerInput?.value?.trim() || "";
  const nextValue = rawValue === "" ? null : parseBrazilianNumber(rawValue);
  const currentValue = odometerInput?.dataset.currentValue ?? "";
  const originalValue = odometerInput?.dataset.originalKm ?? "";
  const currentReason = reasonInput?.dataset.currentReason ?? "";
  const originalWasMissing = odometerInput?.dataset.originalWasMissing === "true";
  const reason = reasonInput?.value?.trim() || "";
  const sameValue =
    (rawValue === "" && currentValue === "") ||
    (rawValue !== "" && currentValue !== "" && numbersMatch(nextValue, currentValue));
  const sameReason = reason === currentReason;

  if (rawValue && (!Number.isFinite(nextValue) || nextValue < 0)) {
    showToast("Informe um KM valido para salvar a correcao.", "error");
    odometerInput?.focus();
    return;
  }

  if (!clearValue && sameValue && sameReason) {
    cancelDashboardOdometerEditor(safeRecordId);
    return;
  }

  const restoringOriginal =
    !originalWasMissing &&
    rawValue !== "" &&
    originalValue !== "" &&
    numbersMatch(nextValue, originalValue);
  const requiresReason = !clearValue && nextValue !== null && (originalWasMissing || !restoringOriginal);

  if (requiresReason && !reason) {
    showToast("Informe o motivo da correcao manual.", "error");
    reasonInput?.focus();
    return;
  }

  if (panel) {
    panel.classList.add("is-saving");
  }

  await api(`/api/dashboard/fuel-records/${safeRecordId}/odometer`, {
    method: "PUT",
    body: {
      odometerKm: nextValue,
      reason,
    },
  });

  state.dashboard.cache.clear();
  await refreshDashboard({ useCache: false });
  showToast(clearValue ? "Leitura de KM restaurada." : "Leitura corrigida e recalculada.");
}

function toggleDashboardOdometerEditor(recordId) {
  const safeRecordId = Number(recordId || 0);
  const card = document.querySelector(`[data-dashboard-record-id="${safeRecordId}"]`);
  const panel = document.querySelector(`[data-dashboard-correction-panel="${safeRecordId}"]`);
  const input = document.querySelector(`[data-dashboard-odometer-input="${safeRecordId}"]`);
  if (!card || !panel) {
    return;
  }

  const willOpen = panel.classList.contains("hidden");
  document.querySelectorAll("[data-dashboard-correction-panel]").forEach((element) => {
    element.classList.add("hidden");
    element.classList.remove("is-saving");
  });
  document.querySelectorAll("[data-dashboard-record-id]").forEach((element) => {
    element.classList.remove("is-editing");
  });

  if (willOpen) {
    panel.classList.remove("hidden");
    card.classList.add("is-editing");
    window.requestAnimationFrame(() => input?.focus());
  }
}

function cancelDashboardOdometerEditor(recordId) {
  const safeRecordId = Number(recordId || 0);
  const card = document.querySelector(`[data-dashboard-record-id="${safeRecordId}"]`);
  const panel = document.querySelector(`[data-dashboard-correction-panel="${safeRecordId}"]`);
  const odometerInput = document.querySelector(`[data-dashboard-odometer-input="${safeRecordId}"]`);
  const reasonInput = document.querySelector(`[data-dashboard-odometer-reason="${safeRecordId}"]`);

  if (odometerInput) {
    odometerInput.value = odometerInput.dataset.currentValue ?? "";
  }
  if (reasonInput) {
    reasonInput.value = reasonInput.dataset.currentReason ?? "";
  }
  if (panel) {
    panel.classList.add("hidden");
    panel.classList.remove("is-saving");
  }
  card?.classList.remove("is-editing");
}

function buildDashboardPeriodLabel(analytics = state.dashboard.analytics) {
  if (analytics?.isCustomRange && analytics.periodStart && analytics.periodEnd) {
    return `${formatDateOnly(analytics.periodStart)} a ${formatDateOnly(analytics.periodEnd)}`;
  }

  const periodDays = Number(analytics?.periodDays || state.dashboard.filters.quickPeriodDays || 30);
  if (periodDays <= 1) {
    return "hoje";
  }

  return `ultimos ${formatNumber(periodDays)} dias`;
}

function buildDashboardPanelHeader(eyebrow, title, description = "") {
  return `
    <div class="dashboard-block__header">
      <div>
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h3>${escapeHtml(title)}</h3>
        ${description ? `<p class="muted">${escapeHtml(description)}</p>` : ""}
      </div>
    </div>
  `;
}

function buildDashboardTable(headers, rows, emptyTitle, emptyDescription) {
  if (!rows.length) {
    return renderDashboardEmpty(emptyTitle, emptyDescription);
  }

  return `
    <div class="table-wrapper">
      <table class="dashboard-compact-table">
        <thead>
          <tr>
            ${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (cells) => `
                <tr>
                  ${cells.map((cell) => `<td>${cell}</td>`).join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function buildDashboardSeverityBadge(severity) {
  const normalized = String(severity || "INFO").toUpperCase();
  const label =
    normalized === "CRITICAL" ? "Critico" : normalized === "WARNING" ? "Atencao" : "Info";
  const className =
    normalized === "CRITICAL" ? "status-red" : normalized === "WARNING" ? "status-yellow" : "status-gray";
  return `<span class="status-badge ${className}">${escapeHtml(label)}</span>`;
}

function buildDashboardAlertFeed(alerts, emptyTitle, emptyDescription) {
  if (!alerts.length) {
    return renderDashboardEmpty(emptyTitle, emptyDescription);
  }

  return `
    <div class="dashboard-alert-feed">
      ${alerts
        .map((alert) => {
          const meta = [
            alert.plate ? `Placa ${alert.plate}` : "",
            alert.occurredAt ? formatDateTime(alert.occurredAt) : "",
          ]
            .filter(Boolean)
            .join(" | ");

          return `
            <article class="dashboard-alert-item">
              <div class="dashboard-alert-item__top">
                <strong>${escapeHtml(alert.title || "Alerta operacional")}</strong>
                ${buildDashboardSeverityBadge(alert.severity)}
              </div>
              <p class="muted">${escapeHtml(alert.description || "Sem descricao.")}</p>
              ${meta ? `<span class="dashboard-alert-item__meta">${escapeHtml(meta)}</span>` : ""}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function buildDashboardRecentFuelFeed(records, emptyTitle, emptyDescription) {
  if (!records.length) {
    return renderDashboardEmpty(emptyTitle, emptyDescription);
  }

  return `
    <div class="dashboard-recent-feed">
      ${records
        .map(
          (record) => `
            <article class="dashboard-recent-feed__item">
              <div>
                <strong>${escapeHtml(record.plate || formatFuelKindLabel(record.fuelKind))}</strong>
                <p class="muted">${escapeHtml(formatDateTime(record.occurredAt))}</p>
              </div>
              <div class="dashboard-recent-feed__metric">
                <strong>${escapeHtml(`${formatLiters(record.quantity || 0)} L`)}</strong>
                <span>${escapeHtml(formatFuelKindLabel(record.fuelKind))}</span>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function buildDashboardDerivedState() {
  const metricsState = state.dashboard.metrics || {};
  const analytics = state.dashboard.analytics || {};
  const filters = state.dashboard.filters || {};
  const selectedVehicle = analytics.selectedVehicle || null;
  const fuelByKind = metricsState.fuelByKind || {};
  const fuelMixMap = new Map((analytics.fuelMix || []).map((item) => [item.fuelKind, Number(item.total || 0)]));
  const tankCapacity = 5200;
  const periodDays = Math.max(Number(analytics.periodDays || filters.quickPeriodDays || 30), 1);
  const selectedPlate = filters.selectedPlate || "";
  const focusPlate = selectedPlate || filters.focusPlate || analytics.focusPlate || selectedVehicle?.plate || "";
  const selectedVehicleRecords = Array.isArray(selectedVehicle?.records) ? selectedVehicle.records : [];
  const recentValidRecords = selectedVehicleRecords.filter((record) => Boolean(record.usedInAverage)).slice(0, 3);
  const currentVehicleKmPerLiter = Number(
    selectedVehicle?.currentKmPerLiter || recentValidRecords[0]?.averageKmPerLiter || selectedVehicle?.kmPerLiter || 0
  );
  const recentAverageKmPerLiter = Number(
    selectedVehicle?.recentAverageKmPerLiter ||
      (recentValidRecords.length
        ? recentValidRecords.reduce((total, record) => total + Number(record.averageKmPerLiter || 0), 0) /
          recentValidRecords.length
        : 0)
  );
  const totalConsumption = Number(metricsState.periodFuelConsumption || 0);
  const s500Balance = Number(fuelByKind.S500 || 0);
  const s10Balance = Number(fuelByKind.S10 || 0);
  const s500Consumption = Number(fuelMixMap.get("S500") || 0);
  const s10Consumption = Number(fuelMixMap.get("S10") || 0);

  return {
    metricsState,
    analytics,
    filters,
    selectedVehicle,
    selectedVehicleRecords,
    recentValidRecords,
    currentVehicleKmPerLiter,
    recentAverageKmPerLiter,
    selectedPlate,
    focusPlate,
    periodDays,
    periodLabel: buildDashboardPeriodLabel(analytics),
    tankCapacity,
    totalConsumption,
    s500Balance,
    s10Balance,
    s500Consumption,
    s10Consumption,
    s500DailyAverage: periodDays ? s500Consumption / periodDays : 0,
    s10DailyAverage: periodDays ? s10Consumption / periodDays : 0,
    s500Percent: (s500Balance / tankCapacity) * 100,
    s10Percent: (s10Balance / tankCapacity) * 100,
    s500Participation: totalConsumption > 0 ? (s500Consumption / totalConsumption) * 100 : 0,
    s10Participation: totalConsumption > 0 ? (s10Consumption / totalConsumption) * 100 : 0,
    focusAlerts: (analytics.operationalAlerts || [])
      .filter((alert) => !focusPlate || alert.plate === focusPlate)
      .slice(0, 4),
    topAlerts: (state.dashboard.alerts || []).slice(0, 4),
  };
}

function getDashboardTankMeta(percent) {
  if (percent >= 70) {
    return { tone: "ok", label: "Nivel estavel" };
  }
  if (percent >= 30) {
    return { tone: "warning", label: "Atencao de nivel" };
  }
  return { tone: "danger", label: "Reserva critica" };
}

function getDashboardRecordStatus(record) {
  const toneToClassName = {
    success: "status-green",
    warning: "status-yellow",
    danger: "status-red",
    neutral: "status-gray",
  };

  if (record.statusLabel) {
    return {
      className: toneToClassName[record.statusTone] || "status-gray",
      label: record.statusLabel,
      tone: record.statusTone || "neutral",
      description: record.statusDescription || "",
    };
  }

  if (record.kmInconsistent) {
    return {
      className: "status-red",
      label: "Erro de KM",
      tone: "danger",
      description: "KM atual menor ou igual ao abastecimento anterior.",
    };
  }
  if (record.averageOutOfPattern) {
    return {
      className: "status-yellow",
      label: "Possivel erro",
      tone: "warning",
      description: "Consumo fora da faixa esperada. Confira KM e litros.",
    };
  }
  if (record.usedInAverage) {
    return {
      className: "status-green",
      label: "Valido",
      tone: "success",
      description: "Par consistente usado no consumo medio.",
    };
  }
  if (record.effectiveKm === null || record.effectiveKm === undefined) {
    return {
      className: "status-gray",
      label: "Aguardando KM",
      tone: "neutral",
      description: "Informe o KM atual para liberar o calculo.",
    };
  }
  return {
    className: "status-gray",
    label: "Aguardando par",
    tone: "neutral",
    description: "Este abastecimento precisa de um anterior para comparar o consumo.",
  };
}

function buildDashboardTankCard(label, balance, dailyAverage, consumption, participation, capacity, averageKmPerLiter = 0) {
  const percent = capacity > 0 ? (Number(balance || 0) / Number(capacity || 1)) * 100 : 0;
  const tankMeta = getDashboardTankMeta(percent);
  const visualPercent = clampPercent(percent);
  const remainingDays = dailyAverage > 0 ? balance / dailyAverage : 0;
  const estimatedAutonomyKm = Number(balance || 0) * Number(averageKmPerLiter || 0);

  return `
    <article class="dashboard-tank-card dashboard-tank-card--${tankMeta.tone}">
      <div class="dashboard-tank-card__head">
        <div>
          <span class="eyebrow">${escapeHtml(label)}</span>
          <h4>${escapeHtml(`Diesel ${label}`)}</h4>
        </div>
        <span class="dashboard-status-pill dashboard-status-pill--${tankMeta.tone}">${escapeHtml(tankMeta.label)}</span>
      </div>
      <div class="dashboard-tank-card__body">
        <div class="dashboard-tank-visual">
          <span class="dashboard-tank-visual__cap">${escapeHtml(`${formatLiters(capacity)} L`)}</span>
          <div class="dashboard-tank-visual__shell">
            <span class="dashboard-tank-visual__fill dashboard-tank-visual__fill--${tankMeta.tone}" style="height:${visualPercent}%"></span>
          </div>
          <span class="dashboard-tank-visual__base">0 L</span>
        </div>
        <div class="dashboard-tank-card__stats">
          <article>
            <span class="eyebrow">Volume atual</span>
            <strong>${escapeHtml(`${formatLiters(balance)} L`)}</strong>
          </article>
          <article>
            <span class="eyebrow">Consumo medio/dia</span>
            <strong>${escapeHtml(`${formatLiters(dailyAverage)} L`)}</strong>
          </article>
          <article>
            <span class="eyebrow">Percentual do tanque</span>
            <strong>${escapeHtml(formatPercent(visualPercent, 0))}</strong>
          </article>
          <article>
            <span class="eyebrow">Consumo no periodo</span>
            <strong>${escapeHtml(`${formatLiters(consumption)} L`)}</strong>
          </article>
          <article>
            <span class="eyebrow">Autonomia estimada</span>
            <strong>${escapeHtml(
              estimatedAutonomyKm > 0 ? formatDistance(estimatedAutonomyKm) : "-"
            )}</strong>
          </article>
          <article>
            <span class="eyebrow">Dias restantes</span>
            <strong>${escapeHtml(
              remainingDays > 0 ? `${formatNumber(remainingDays, 1, 1)} dia(s)` : "-"
            )}</strong>
          </article>
        </div>
      </div>
      <div class="dashboard-tank-card__footer">
        <span>${escapeHtml(`Participacao: ${formatPercent(participation, 0)}`)}</span>
        <span>${escapeHtml(`Capacidade fixa: ${formatLiters(capacity)} L`)}</span>
      </div>
    </article>
  `;
}

function buildDashboardOverviewView(derived) {
  const rankingItems = (derived.analytics.efficiencyRanking || []).slice(0, 5);
  const recentFuelRecords = (derived.analytics.recentFuelRecords || []).slice(0, 5);

  return {
    primary: `
      ${buildDashboardPanelHeader(
        "Prioridade alta",
        "Combustivel e eficiencia",
        "A leitura principal combina status dos tanques, consumo do periodo e resposta da frota."
      )}
      <div class="dashboard-stage-grid dashboard-stage-grid--overview">
        <section class="dashboard-tank-grid">
          ${buildDashboardTankCard(
            "S-500",
            derived.s500Balance,
            derived.s500DailyAverage,
            derived.s500Consumption,
            derived.s500Participation,
            derived.tankCapacity,
            derived.metricsState.averageKmPerLiter
          )}
          ${buildDashboardTankCard(
            "S-10",
            derived.s10Balance,
            derived.s10DailyAverage,
            derived.s10Consumption,
            derived.s10Participation,
            derived.tankCapacity,
            derived.metricsState.averageKmPerLiter
          )}
        </section>

        <article class="dashboard-priority-card">
          <div class="dashboard-priority-card__top">
            <div>
              <span class="eyebrow">Eficiencia em foco</span>
              <h4>${escapeHtml(
                derived.focusPlate ? `Leitura operacional de ${derived.focusPlate}` : "Media operacional da frota"
              )}</h4>
              <p class="muted">O dashboard destaca a melhor leitura disponivel sem esconder alertas de consistencia.</p>
            </div>
            ${buildIconBadge("efficiency", derived.currentVehicleKmPerLiter ? "success" : "warning")}
          </div>
          <div class="dashboard-kpi-hero">
            <article>
              <span class="eyebrow">KM/L atual</span>
              <strong>${escapeHtml(formatKmPerLiter(derived.currentVehicleKmPerLiter))}</strong>
              <span class="muted">${escapeHtml(derived.selectedVehicle?.lastFuelAt ? formatDateTime(derived.selectedVehicle.lastFuelAt) : "Sem leitura recente")}</span>
            </article>
            <article>
              <span class="eyebrow">Media recente</span>
              <strong>${escapeHtml(formatKmPerLiter(derived.recentAverageKmPerLiter))}</strong>
              <span class="muted">${escapeHtml(`${formatNumber(derived.recentValidRecords.length)} leitura(s) recentes usadas`)}</span>
            </article>
          </div>
          <div class="dashboard-mini-kpi-grid">
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Media da frota",
              value: formatKmPerLiter(derived.metricsState.averageKmPerLiter || 0),
              note: `${formatNumber(derived.analytics.efficiencySummary?.vehicleCount || 0)} placa(s) validas`,
              icon: "efficiency",
              tone: "success",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Captura de KM",
              value: formatPercent(derived.analytics.odometerCoverage?.percent || 0, 0),
              note: `${formatNumber(derived.analytics.odometerCoverage?.withOdometer || 0)} lancamento(s) completos`,
              icon: "vehicle",
              tone: "neutral",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Pico do periodo",
              value: `${formatLiters(derived.analytics.peakConsumption?.total || 0)} L`,
              note: derived.analytics.peakConsumption?.date ? formatDateOnly(derived.analytics.peakConsumption.date) : "Sem pico",
              icon: "dashboard",
              tone: "warning",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Estoque em alerta",
              value: formatNumber(derived.metricsState.lowStockCount || 0),
              note: "Pontos abaixo do minimo",
              icon: "alert",
              tone: derived.metricsState.lowStockCount ? "danger" : "success",
            })}
          </div>
        </article>
      </div>

      <div class="dashboard-secondary-grid">
        <article class="dashboard-alert-card">
          <span class="eyebrow">Prioridade media</span>
          <h4>Alertas operacionais</h4>
          ${buildDashboardAlertFeed(
            derived.topAlerts,
            "Sem alertas ativos",
            "Nao ha pendencias relevantes para o filtro atual."
          )}
        </article>

        <article class="dashboard-subsection-card">
          <span class="eyebrow">Status operacional</span>
          <h4>Leitura rapida da operacao</h4>
          <div class="dashboard-inline-stats">
            <article>
              <strong>${escapeHtml(formatNumber(derived.metricsState.activeVehicles || 0))}</strong>
              <span>Veiculos ativos</span>
            </article>
            <article>
              <strong>${escapeHtml(formatNumber(state.dashboard.todaySchedules.length || 0))}</strong>
              <span>Escalas no dia</span>
            </article>
            <article>
              <strong>${escapeHtml(`${formatLiters(derived.metricsState.fuelBalance || 0)} L`)}</strong>
              <span>Saldo total</span>
            </article>
            <article>
              <strong>${escapeHtml(formatNumber(derived.analytics.alertSummary?.critical || 0))}</strong>
              <span>Alertas criticos</span>
            </article>
          </div>
        </article>
      </div>
    `,
    detail: `
      ${buildDashboardPanelHeader(
        "Prioridade baixa",
        "Ranking e historico",
        "Rankings e ultimos abastecimentos ficam em segundo plano para nao poluir a decisao principal."
      )}
      <div class="dashboard-detail-stack dashboard-detail-stack--split">
        <div class="dashboard-detail-card">
          <span class="eyebrow">Ranking de eficiencia</span>
          <h4>Melhores medias do periodo</h4>
          ${renderMeterList(
            rankingItems.map((item) => ({
              label: item.plate,
              value: item.kmPerLiter,
              totalDistanceKm: item.totalDistanceKm,
              totalLiters: item.totalLiters,
              samples: item.samples,
            })),
            {
              emptyTitle: "Sem eficiencia calculada",
              emptyDescription: "Assim que houver leituras coerentes, o ranking aparece aqui.",
              valueFormatter: (value) => formatKmPerLiter(value),
              secondaryFormatter: (item) =>
                `${formatDistance(item.totalDistanceKm)} | ${formatLiters(item.totalLiters)} L | ${item.samples} leitura(s)`,
            }
          )}
        </div>
        <div class="dashboard-detail-card">
          <span class="eyebrow">Historico recente</span>
          <h4>Ultimos abastecimentos</h4>
          ${buildDashboardRecentFuelFeed(
            recentFuelRecords,
            "Sem abastecimentos recentes",
            "Nao houve lancamentos suficientes para exibir o historico."
          )}
        </div>
      </div>
    `,
  };
}

function buildDashboardFuelView(derived) {
  const detailRows = (derived.analytics.consumptionSeries || [])
    .filter((item) => Number(item.total || 0) > 0)
    .map((item) => [
      `<strong>${escapeHtml(formatDateOnly(item.date))}</strong>`,
      escapeHtml(`${formatLiters(item.s500 || 0)} L`),
      escapeHtml(`${formatLiters(item.s10 || 0)} L`),
      escapeHtml(`${formatLiters(item.total || 0)} L`),
    ]);

  return {
    primary: `
      ${buildDashboardPanelHeader(
        "Prioridade alta",
        "Abastecimento e nivel dos tanques",
        "Visao direta do saldo atual, consumo diario e participacao entre S-500 e S-10."
      )}
      <section class="dashboard-tank-grid">
          ${buildDashboardTankCard(
            "S-500",
            derived.s500Balance,
            derived.s500DailyAverage,
            derived.s500Consumption,
            derived.s500Participation,
            derived.tankCapacity,
            derived.metricsState.averageKmPerLiter
          )}
          ${buildDashboardTankCard(
            "S-10",
            derived.s10Balance,
            derived.s10DailyAverage,
            derived.s10Consumption,
            derived.s10Participation,
            derived.tankCapacity,
            derived.metricsState.averageKmPerLiter
          )}
      </section>

      <div class="dashboard-secondary-grid">
        <article class="dashboard-focus-card">
          <span class="eyebrow">Complementares</span>
          <h4>Consumo consolidado do periodo</h4>
          <div class="dashboard-mini-kpi-grid">
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Consumo total",
              value: `${formatLiters(derived.totalConsumption)} L`,
              note: derived.periodLabel,
              icon: "fuel",
              tone: "brand",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Media diaria",
              value: `${formatLiters(derived.metricsState.averageDailyConsumption || 0)} L`,
              note: `${formatNumber(derived.periodDays)} dia(s) analisado(s)`,
              icon: "analytics",
              tone: "neutral",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "S-500 no mix",
              value: formatPercent(derived.s500Participation, 0),
              note: `${formatLiters(derived.s500Consumption)} L no periodo`,
              icon: "fuel",
              tone: "warning",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "S-10 no mix",
              value: formatPercent(derived.s10Participation, 0),
              note: `${formatLiters(derived.s10Consumption)} L no periodo`,
              icon: "fuel",
              tone: "success",
            })}
          </div>
        </article>
        <article class="dashboard-alert-card">
          <span class="eyebrow">Prioridade media</span>
          <h4>Pontos que pedem atencao</h4>
          ${buildDashboardAlertFeed(
            derived.topAlerts,
            "Sem alertas de combustivel",
            "Estoques, abastecimentos e pendencias estao dentro do esperado."
          )}
        </article>
      </div>
    `,
    detail: `
      ${buildDashboardPanelHeader(
        "Prioridade baixa",
        "Curva e distribuicao diaria",
        "Detalhamento grafico e tabela resumida para conferencia quando necessario."
      )}
      <div class="dashboard-detail-stack">
        <div class="dashboard-detail-card">
          ${
            state.dashboard.lazy?.fuelChartLoaded
              ? renderConsumptionChart(derived.analytics)
              : `
                  <div class="dashboard-chart-demand">
                    <strong>Grafico sob demanda</strong>
                    <p class="muted">Carregue a curva diaria apenas quando precisar aprofundar a leitura do periodo.</p>
                    <button type="button" class="secondary-button" data-dashboard-load-chart="fuel">Carregar grafico</button>
                  </div>
                `
          }
        </div>
        <div class="dashboard-detail-card">
          <span class="eyebrow">Tabela diaria</span>
          <h4>Distribuicao entre S-500 e S-10</h4>
          ${buildDashboardTable(
            ["Data", "S-500", "S-10", "Total"],
            detailRows,
            "Sem distribuicao diaria",
            "Nao houve consumo suficiente para montar a distribuicao por dia."
          )}
        </div>
      </div>
    `,
  };
}

function buildDashboardEfficiencyView(derived) {
  const selectedVehicle = derived.selectedVehicle;
  const records = derived.selectedVehicleRecords;
  const selectorOptions = (derived.analytics.availablePlates || [])
    .map((plate) => `<option value="${escapeHtml(plate)}"${plate === derived.focusPlate ? " selected" : ""}>${escapeHtml(plate)}</option>`)
    .join("");
  const vehicleSpecificAlerts = derived.focusAlerts;

  if (!derived.analytics.availablePlates?.length) {
    return {
      primary: `
        ${buildDashboardPanelHeader(
          "Prioridade alta",
          "Conferencia de KM/L por placa",
          "Cadastre abastecimentos com placa para liberar a leitura individual de eficiencia."
        )}
        ${renderDashboardEmpty(
          "Sem placas com historico",
          "Assim que houver abastecimentos associados a veiculos, este modulo passa a calcular KM/L."
        )}
      `,
      detail: "",
    };
  }

  const recordsMarkup = records.length
    ? records
        .map((record) => {
          const status = getDashboardRecordStatus(record);
          const effectiveKmValue =
            record.effectiveKm === null || record.effectiveKm === undefined ? "" : String(record.effectiveKm);
          const originalKmValue =
            record.originalKm === null || record.originalKm === undefined ? "" : String(record.originalKm);
          const currentReason = record.correctionReason || "";
          const correctionSummary =
            record.correctedKm !== null && record.correctedKm !== undefined
              ? record.originalWasMissing
                ? "KM incluido manualmente para liberar o calculo."
                : `KM original preservado: ${formatDistance(record.originalKm || 0)}.`
              : status.description;
          const distanceLabel =
            record.distanceKm !== null && record.distanceKm !== undefined
              ? formatDistance(record.distanceKm)
              : "-";
          const averageLabel = formatKmPerLiter(record.averageKmPerLiter || 0);
          const averageTextLabel = formatKmPerLiterText(record.averageKmPerLiter || 0);
          const comparedAt = record.referenceOccurredAt ? formatDateTime(record.referenceOccurredAt) : "";

          return `
            <article class="dashboard-efficiency-record dashboard-efficiency-record--${escapeHtml(status.tone || "neutral")}" data-dashboard-record-id="${record.id}">
              <div class="dashboard-efficiency-record__top">
                <div class="dashboard-efficiency-record__identity">
                  <strong>${escapeHtml(`${formatDateOnly(record.occurredAt)} | ${record.plate || selectedVehicle?.plate || derived.focusPlate}`)}</strong>
                  <p class="muted">${escapeHtml(`${formatDateTime(record.occurredAt)} | ${formatFuelKindLabel(record.fuelKind)} | ${formatLiters(record.quantity || 0)} L`)}</p>
                </div>
                <span class="status-badge ${status.className}">${escapeHtml(status.label)}</span>
              </div>

              <div class="dashboard-efficiency-record__summary">
                <article>
                  <span class="eyebrow">KM inicial</span>
                  <strong>${escapeHtml(
                    record.referenceKmUsed !== null && record.referenceKmUsed !== undefined
                      ? formatDistance(record.referenceKmUsed)
                      : "-"
                  )}</strong>
                  <span class="muted">${escapeHtml(comparedAt ? `Abastecimento anterior: ${comparedAt}` : "Aguardando abastecimento anterior valido")}</span>
                </article>
                <article>
                  <span class="eyebrow">KM final</span>
                  <strong>${escapeHtml(
                    record.effectiveKm !== null && record.effectiveKm !== undefined
                      ? formatDistance(record.effectiveKm)
                      : "-"
                  )}</strong>
                  <span class="muted">${escapeHtml(
                    record.correctedKm !== null && record.correctedKm !== undefined
                      ? "Leitura corrigida manualmente"
                      : "Leitura atual do abastecimento"
                  )}</span>
                </article>
                <article>
                  <span class="eyebrow">Distancia rodada</span>
                  <strong>${escapeHtml(distanceLabel)}</strong>
                  <span class="muted">${escapeHtml(
                    record.distanceKm !== null && record.distanceKm !== undefined
                      ? "Calculado automaticamente"
                      : "Distancia pendente"
                  )}</span>
                </article>
                <article>
                  <span class="eyebrow">Litros abastecidos</span>
                  <strong>${escapeHtml(`${formatLiters(record.quantity || 0)} L`)}</strong>
                  <span class="muted">${escapeHtml("Volume informado no abastecimento")}</span>
                </article>
                <article class="dashboard-efficiency-record__summary-primary">
                  <span class="eyebrow">Consumo medio</span>
                  <strong>${escapeHtml(averageLabel)}</strong>
                  <span class="muted">${escapeHtml(
                    Number(record.averageKmPerLiter || 0) > 0 ? averageTextLabel : status.description
                  )}</span>
                </article>
              </div>

              <div class="dashboard-efficiency-record__meta">
                <span>${escapeHtml(correctionSummary)}</span>
                ${record.correctionReason ? `<span>${escapeHtml(`Motivo: ${record.correctionReason}`)}</span>` : ""}
              </div>

              <div class="dashboard-efficiency-record__toolbar">
                <button type="button" class="secondary-button" data-dashboard-toggle-odometer="${record.id}">Corrigir leitura</button>
              </div>

              <div class="dashboard-efficiency-record__edit hidden" data-dashboard-correction-panel="${record.id}">
                <div class="dashboard-efficiency-record__edit-grid">
                  <label class="dashboard-filter-field">
                    <span>KM correto</span>
                    <input
                      type="text"
                      inputmode="decimal"
                      value="${escapeHtml(effectiveKmValue)}"
                      data-current-value="${escapeHtml(effectiveKmValue)}"
                      data-original-km="${escapeHtml(originalKmValue)}"
                      data-original-was-missing="${record.originalWasMissing ? "true" : "false"}"
                      data-dashboard-odometer-input="${record.id}"
                    />
                  </label>
                  <label class="dashboard-filter-field">
                    <span>Motivo da correcao</span>
                    <input
                      type="text"
                      value="${escapeHtml(currentReason)}"
                      data-current-reason="${escapeHtml(currentReason)}"
                      placeholder="Obrigatorio ao corrigir a leitura"
                      data-dashboard-odometer-reason="${record.id}"
                    />
                  </label>
                </div>
                <div class="dashboard-efficiency-record__actions">
                  <button type="button" class="secondary-button" data-dashboard-save-odometer="${record.id}">Salvar correcao</button>
                  <button type="button" class="ghost-button" data-dashboard-cancel-odometer="${record.id}">Cancelar</button>
                </div>
              </div>
            </article>
          `;
        })
        .join("")
    : renderDashboardEmpty(
        "Sem abastecimentos suficientes",
        "Selecione uma placa com ao menos dois abastecimentos para apurar o KM/L."
      );

  const historyMarkup = records.length
    ? `
        <div class="dashboard-efficiency-history">
          ${records
            .map((record) => {
              const status = getDashboardRecordStatus(record);
              return `
                <article class="dashboard-efficiency-history__item">
                  <div>
                    <strong>${escapeHtml(`${formatDateOnly(record.occurredAt)} | ${record.plate || selectedVehicle?.plate || derived.focusPlate}`)}</strong>
                    <p class="muted">${escapeHtml(`Consumo: ${formatKmPerLiter(record.averageKmPerLiter || 0)}`)}</p>
                  </div>
                  <span class="status-badge ${status.className}">${escapeHtml(status.label)}</span>
                </article>
              `;
            })
            .join("")}
        </div>
      `
    : renderDashboardEmpty(
        "Sem historico para exibir",
        "Os abastecimentos desta placa aparecerao aqui em ordem cronologica."
      );

  return {
    primary: `
      ${buildDashboardPanelHeader(
        "Prioridade alta",
        "Consumo por veiculo",
        "Cada leitura compara o abastecimento atual com o anterior e mostra apenas os dados que o operador precisa entender."
      )}
      <div class="dashboard-stage-grid dashboard-stage-grid--efficiency">
        <article class="dashboard-priority-card">
          <div class="dashboard-priority-card__top">
            <div>
              <span class="eyebrow">Veiculo em foco</span>
              <h4>${escapeHtml(selectedVehicle?.plate || derived.focusPlate || "Selecione uma placa")}</h4>
              <p class="muted">O sistema calcula automaticamente: KM rodado, litros abastecidos e consumo medio do par.</p>
            </div>
            ${buildIconBadge("vehicle", selectedVehicle?.samples ? "success" : "warning")}
          </div>
          <label class="dashboard-filter-field">
            <span>Selecionar veiculo</span>
            <select data-dashboard-focus-plate ${derived.selectedPlate ? "disabled" : ""}>
              ${selectorOptions}
            </select>
          </label>
          ${
            derived.selectedPlate
              ? `<p class="muted">O filtro global por placa esta ativo. Para comparar outro veiculo, limpe o filtro do topo.</p>`
              : ""
          }
          <div class="dashboard-kpi-hero">
            <article>
              <span class="eyebrow">Consumo medio</span>
              <strong>${escapeHtml(formatKmPerLiter(derived.currentVehicleKmPerLiter))}</strong>
              <span class="muted">${escapeHtml(
                Number(derived.currentVehicleKmPerLiter || 0) > 0
                  ? formatKmPerLiterText(derived.currentVehicleKmPerLiter)
                  : "Aguardando par valido para calcular"
              )}</span>
            </article>
            <article>
              <span class="eyebrow">Media recente</span>
              <strong>${escapeHtml(formatKmPerLiter(derived.recentAverageKmPerLiter))}</strong>
              <span class="muted">${escapeHtml(`${formatNumber(derived.recentValidRecords.length)} leitura(s) validas recentes`)}</span>
            </article>
          </div>
          <div class="dashboard-mini-kpi-grid">
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "KM rodado",
              value: formatDistance(selectedVehicle?.totalDistanceKm || 0),
              note: "Somente pares validos",
              icon: "vehicle",
              tone: "neutral",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Litros analisados",
              value: `${formatLiters(selectedVehicle?.totalLiters || 0)} L`,
              note: "Base do calculo",
              icon: "fuel",
              tone: "brand",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Leituras validas",
              value: formatNumber(selectedVehicle?.samples || 0),
              note: "Pares consistentes",
              icon: "analytics",
              tone: selectedVehicle?.samples ? "success" : "warning",
            })}
            ${buildStatCard({
              className: "dashboard-mini-kpi",
              label: "Ultimo KM",
              value:
                selectedVehicle?.lastOdometerKm && Number(selectedVehicle.lastOdometerKm) > 0
                  ? formatDistance(selectedVehicle.lastOdometerKm)
                  : "-",
              note: selectedVehicle?.lastFuelAt ? formatDateTime(selectedVehicle.lastFuelAt) : "Sem leitura recente",
              icon: "efficiency",
              tone: "warning",
            })}
          </div>
        </article>

        <article class="dashboard-subsection-card">
          <span class="eyebrow">Historico limpo</span>
          <h4>Resumo rapido por abastecimento</h4>
          <p class="muted">Data, veiculo, consumo e status em uma leitura curta para a operacao.</p>
          ${historyMarkup}
        </article>
      </div>

      <article class="dashboard-detail-card">
        <span class="eyebrow">Conferencia operacional</span>
        <h4>Detalhes do calculo por abastecimento</h4>
        <p class="muted">Cada card mostra o par usado no calculo e permite corrigir a leitura de KM quando necessario.</p>
        <div class="dashboard-efficiency-records">
          ${recordsMarkup}
        </div>
      </article>
    `,
    detail: `
      ${buildDashboardPanelHeader(
        "Prioridade media e baixa",
        "Alertas e ranking de consumo",
        "Use os alertas para encontrar digitacao suspeita e o ranking para comparar o desempenho da frota."
      )}
      <div class="dashboard-detail-stack dashboard-detail-stack--split">
        <div class="dashboard-detail-card">
          <span class="eyebrow">Alertas da placa</span>
          <h4>Leituras que pedem conferencia</h4>
          ${buildDashboardAlertFeed(
            vehicleSpecificAlerts,
            "Sem alertas para a placa",
            "Nao ha inconsistencias abertas para a placa em foco neste periodo."
          )}
        </div>
        <div class="dashboard-detail-card">
          <span class="eyebrow">Ranking da frota</span>
          <h4>Comparativo de consumo</h4>
          ${renderMeterList(
            (derived.analytics.efficiencyRanking || []).slice(0, 6).map((item) => ({
              label: item.plate,
              value: item.kmPerLiter,
              samples: item.samples,
              totalDistanceKm: item.totalDistanceKm,
            })),
            {
              emptyTitle: "Sem ranking disponivel",
              emptyDescription: "Ainda nao ha leituras coerentes suficientes para ranquear a frota.",
              valueFormatter: (value) => formatKmPerLiter(value),
              secondaryFormatter: (item) =>
                `${formatDistance(item.totalDistanceKm)} | ${item.samples} leitura(s) validas`,
            }
          )}
        </div>
      </div>
    `,
  };
}

function buildDashboardSummaryCards(derived) {
  return [
    buildStatCard({
      className: "dashboard-decision-card",
      label: "Combustivel total",
      value: `${formatLiters(derived.metricsState.fuelBalance || 0)} L`,
      note: "Saldo somado entre S-500 e S-10",
      icon: "fuel",
      tone: "brand",
    }),
    buildStatCard({
      className: "dashboard-decision-card",
      label: "Media KM/L",
      value: formatKmPerLiter(derived.metricsState.averageKmPerLiter || 0),
      note: `${formatNumber(derived.analytics.efficiencySummary?.vehicleCount || 0)} placa(s) com leitura valida`,
      icon: "efficiency",
      tone:
        Number(derived.metricsState.averageKmPerLiter || 0) > 0
          ? "success"
          : "warning",
    }),
    buildStatCard({
      className: "dashboard-decision-card",
      label: "Veiculos ativos",
      value: formatNumber(derived.metricsState.activeVehicles || 0),
      note: "Base operacional pronta para uso",
      icon: "vehicle",
      tone: "neutral",
    }),
    buildStatCard({
      className: "dashboard-decision-card",
      label: "Alertas",
      value: formatNumber(derived.analytics.alertSummary?.total || state.dashboard.alerts.length || 0),
      note: `${formatNumber(derived.analytics.alertSummary?.critical || derived.metricsState.criticalAlertCount || 0)} critico(s) no periodo`,
      icon: "alert",
      tone:
        Number(derived.analytics.alertSummary?.critical || derived.metricsState.criticalAlertCount || 0) > 0
          ? "danger"
          : "success",
    }),
  ].join("");
}

function buildDashboardViewModel(derived) {
  switch (normalizeDashboardView(state.dashboard.view)) {
    case "fuel":
      return buildDashboardFuelView(derived);
    case "efficiency":
      return buildDashboardEfficiencyView(derived);
    case "overview":
    default:
      return buildDashboardOverviewView(derived);
  }
}

function renderDashboard() {
  if (!refs.dashboardSummary || !refs.dashboardPrimary || !refs.dashboardDetail) {
    return;
  }

  syncDashboardFilterInputs();
  const derived = buildDashboardDerivedState();
  refs.dashboardSummary.innerHTML = buildDashboardSummaryCards(derived);

  const viewModel = buildDashboardViewModel(derived);
  refs.dashboardPrimary.innerHTML = viewModel.primary;

  if (viewModel.detail) {
    refs.dashboardDetail.classList.remove("hidden");
    refs.dashboardDetail.innerHTML = viewModel.detail;
  } else {
    refs.dashboardDetail.classList.add("hidden");
    refs.dashboardDetail.innerHTML = "";
  }
}

function renderNotes() {
  refs.notesTableBody.innerHTML = state.notes.length
    ? state.notes
        .map(
          (note) => `
            <tr>
              <td>
                <strong>${escapeHtml(note.supplierName)}</strong>
                <div class="muted">${escapeHtml(formatDateTime(note.issueDate))}</div>
              </td>
              <td>${escapeHtml(note.danfe || "-")}</td>
              <td>${escapeHtml(formatCurrency(note.totalValue))}</td>
              <td>${statusBadge(note.category)}</td>
              <td>${statusBadge(note.status)}</td>
              <td>${escapeHtml(note.source)}</td>
              <td>
                ${note.sentToFinanceAt ? `<div>${escapeHtml(formatDateTime(note.sentToFinanceAt))}</div>` : `<div class="muted">Não enviado</div>`}
                <div class="muted">${escapeHtml(note.sentToFinanceByName || note.financeNotes || "")}</div>
              </td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-note", note.id, "Editar nota", "&#9998;")}
                  ${
                    state.user?.role === "ADMIN"
                      ? buildRowActionButton("delete-note", note.id, "Excluir nota", "&#10005;", "danger")
                      : ""
                  }
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma nota encontrada para os filtros informados.", 8);
}

function renderProducts() {
  refs.productsTableBody.innerHTML = state.products.length
    ? state.products
        .map(
          (product) => `
            <tr>
              <td>
                <strong>${escapeHtml(product.name)}</strong>
                ${product.lowStock ? `<div><span class="status-badge status-red">Estoque mínimo</span></div>` : ""}
              </td>
              <td>${escapeHtml(formatNumber(product.currentStock || 0, 2, 2))} ${escapeHtml(product.unit)}</td>
              <td>${escapeHtml(formatNumber(product.minStock || 0, 2, 2))} ${escapeHtml(product.unit)}</td>
              <td>${escapeHtml(formatCurrency(product.defaultCost || 0))}</td>
              <td>${escapeHtml(product.barcode || "-")}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-product", product.id, "Editar produto", "&#9998;")}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum produto cadastrado.", 6);
}

function renderInventoryMovements() {
  refs.inventoryMovementsBody.innerHTML = state.inventoryMovements.length
    ? state.inventoryMovements
        .map(
          (movement) => `
            <tr>
              <td>${escapeHtml(movement.productName)}</td>
              <td>${statusBadge(movement.type)}</td>
              <td>${escapeHtml(formatNumber(movement.quantity || 0, 2, 2))}</td>
              <td>${escapeHtml(movement.document || "-")}</td>
              <td>${escapeHtml(formatCurrency(movement.unitCost || 0))}</td>
              <td>${escapeHtml(formatCurrency(movement.totalCost || 0))}</td>
              <td>${escapeHtml(formatNumber(movement.balanceAfter || 0, 2, 2))}</td>
              <td>${escapeHtml(movement.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(movement.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma movimentação registrada.", 9);
}

function renderVehicles() {
  refs.vehiclesTableBody.innerHTML = state.vehicles.length
    ? state.vehicles
        .map(
          (vehicle) => `
            <tr>
              <td>
                <strong>${escapeHtml(vehicle.plate)}</strong>
                <div class="muted">${escapeHtml(vehicle.notes || "-")}</div>
              </td>
              <td>${escapeHtml(formatVehicleFuelProfile(vehicle.fuelProfile))}</td>
              <td>${escapeHtml([vehicle.brand, vehicle.model].filter(Boolean).join(" / ") || "-")}</td>
              <td>${escapeHtml(vehicle.sector || "-")}</td>
              <td>${vehicle.active ? `<span class="status-badge status-green">Ativo</span>` : `<span class="status-badge status-gray">Inativo</span>`}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-vehicle", vehicle.id, "Editar veiculo", "&#9998;")}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum veiculo cadastrado.", 6);
}

function renderFuelStorageOptions() {
  const optionsHtml = state.fuelStorages.length
    ? state.fuelStorages
        .map(
          (storage) => `
            <option value="${storage.id}">
              ${escapeHtml(storage.name)} | ${escapeHtml(formatFuelKindLabel(storage.fuelKind))} | ${escapeHtml(formatLiters(storage.currentBalance))} L
            </option>
          `
        )
        .join("")
    : `<option value="">Nenhum estoque disponivel</option>`;

  const currentFormValue = refs.fuelStorageSelect.value;
  refs.fuelStorageSelect.innerHTML = optionsHtml;
  if (
    currentFormValue &&
    state.fuelStorages.some((storage) => String(storage.id) === String(currentFormValue))
  ) {
    refs.fuelStorageSelect.value = currentFormValue;
  } else if (state.fuelStorages.length) {
    refs.fuelStorageSelect.value = String(state.fuelStorages[0].id);
  }

  const currentFilterValue = refs.fuelFilterStorage.value;
  refs.fuelFilterStorage.innerHTML = `<option value="">Todos os combustíveis</option>${optionsHtml}`;
  if (
    currentFilterValue &&
    state.fuelStorages.some((storage) => String(storage.id) === String(currentFilterValue))
  ) {
    refs.fuelFilterStorage.value = currentFilterValue;
  }
}

function updateKardexProductSelect() {
  if (!refs.kardexProductSelect) {
    return;
  }

  const currentValue = refs.kardexProductSelect.value;
  refs.kardexProductSelect.innerHTML = state.products.length
    ? `<option value="">Selecione um produto</option>${state.products
        .map(
          (product) => `
            <option value="${product.id}">
              ${escapeHtml(product.name)} (${escapeHtml(product.unit)})
            </option>
          `
        )
        .join("")}`
    : `<option value="">Cadastre um produto primeiro</option>`;

  if (currentValue && state.products.some((product) => String(product.id) === String(currentValue))) {
    refs.kardexProductSelect.value = currentValue;
  }
}

function getActiveFuelVehicles() {
  const selectedStorage = state.fuelStorages.find(
    (storage) => String(storage.id) === String(refs.fuelStorageSelect.value || "")
  );
  const selectedFuelKind = selectedStorage?.fuelKind || "";

  return state.vehicles.filter((vehicle) => {
    if (!vehicle.active) {
      return false;
    }
    if (!selectedFuelKind) {
      return true;
    }
    return vehicle.fuelProfile === "BOTH" || vehicle.fuelProfile === selectedFuelKind;
  });
}

function renderFuelVehicleOptions() {
  if (!refs.fuelVehicleSelect) {
    return;
  }

  const currentValue = refs.fuelVehicleSelect.value;
  const vehicles = getActiveFuelVehicles();
  refs.fuelVehicleSelect.innerHTML = vehicles.length
    ? `<option value="">Selecione um veiculo</option>${vehicles
        .map(
          (vehicle) => `
            <option value="${vehicle.id}">
              ${escapeHtml(vehicle.plate)} | ${escapeHtml([vehicle.brand, vehicle.model].filter(Boolean).join(" ")) || "Sem descricao"}
            </option>
          `
        )
        .join("")}`
    : `<option value="">Nenhum veiculo ativo compativel</option>`;

  if (currentValue && vehicles.some((vehicle) => String(vehicle.id) === String(currentValue))) {
    refs.fuelVehicleSelect.value = currentValue;
  }
}

function syncFuelFormState() {
  if (!refs.fuelForm || !refs.fuelVehicleSelect) {
    return;
  }

  renderFuelVehicleOptions();
  const isExit = refs.fuelForm.elements.type.value === "EXIT";
  refs.fuelVehicleSelect.disabled = !isExit;
  refs.fuelVehicleSelect.required = isExit;
  refs.fuelForm.elements.odometerKm.required = false;
  refs.fuelForm.elements.odometerKm.disabled = !isExit;

  if (!isExit) {
    refs.fuelVehicleSelect.value = "";
    refs.fuelForm.elements.odometerKm.value = "";
  }
}

function renderFuel() {
  refs.fuelStocksGrid.innerHTML = state.fuelStorages.length
    ? state.fuelStorages
        .map(
          (storage) => {
            const isEmpty = Number(storage.currentBalance || 0) <= 0;
            const isLow =
              !isEmpty &&
              Number(storage.minBalance || 0) > 0 &&
              Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0);
            const statusLabel = isEmpty ? "Sem saldo" : isLow ? "Abaixo do minimo" : "Operacional";
            const toneClass = isEmpty ? "is-empty" : isLow ? "is-low" : "is-ok";

            return `
            <article class="fuel-stock-card ${toneClass}">
              <div class="fuel-stock-card__top">
                <span class="fuel-stock-card__kind">${escapeHtml(formatFuelKindLabel(storage.fuelKind))}</span>
                <span class="fuel-stock-card__status">${escapeHtml(statusLabel)}</span>
              </div>
              <div class="fuel-stock-card__value-row">
                <strong class="fuel-stock-card__value">${escapeHtml(formatLiters(storage.currentBalance))}</strong>
                <span class="fuel-stock-card__unit">L</span>
              </div>
              <div class="fuel-stock-card__footer">
                <strong>${escapeHtml(storage.name)}</strong>
                <span>Saldo disponivel agora</span>
              </div>
            </article>
          `;
          }
        )
        .join("")
    : `<div class="stack-item"><strong>Nenhum estoque configurado</strong><p class="muted">Cadastre ou revise os estoques principais de combustível.</p></div>`;

  refs.fuelTableBody.innerHTML = state.fuelRecords.length
    ? state.fuelRecords
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.storageName || "-")}</td>
              <td>${escapeHtml(formatFuelKindLabel(item.fuelKind))}</td>
              <td>${statusBadge(item.type)}</td>
              <td>${escapeHtml(item.plate)}</td>
              <td>${escapeHtml(formatNumber(item.quantity || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}</td>
              <td>${escapeHtml(formatNumber(item.balanceBefore || 0, 2, 2))} L</td>
              <td>${escapeHtml(formatNumber(item.balanceAfter || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(item.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum abastecimento registrado.", 10);
}

function renderSchedules() {
  refs.schedulesTableBody.innerHTML = state.schedules.length
    ? state.schedules
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateOnly(item.scheduledDate))}</td>
              <td>${escapeHtml(item.vehicle)}</td>
              <td>${escapeHtml(item.driver)}</td>
              <td>${escapeHtml(item.assistant || "-")}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-schedule", item.id, "Editar escala", "&#9998;")}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma escala cadastrada.", 5);
}

function renderFines() {
  refs.finesTableBody.innerHTML = state.fines.length
    ? state.fines
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateOnly(item.fineDate))}</td>
              <td>${escapeHtml(item.plate)}</td>
              <td>${escapeHtml(item.driver)}</td>
              <td>${statusBadge(item.status)}</td>
              <td>${escapeHtml(formatCurrency(item.amount))}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-fine", item.id, "Editar multa", "&#9998;")}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma multa cadastrada.", 6);

  syncResponsiveTableLabels();
}

function renderChecklists() {
  refs.checklistsTableBody.innerHTML = state.checklists.length
    ? state.checklists
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateOnly(item.checklistDate))}</td>
              <td>${escapeHtml(item.vehicle)}</td>
              <td>${statusBadge(item.status)}</td>
              <td>${escapeHtml(item.items.join(", "))}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-checklist", item.id, "Editar checklist", "&#9998;")}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum checklist cadastrado.", 5);
}

function renderEmails() {
  refs.emailsTableBody.innerHTML = state.emails.length
    ? state.emails
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateTime(item.receivedAt))}</td>
              <td>${escapeHtml(item.sender)}</td>
              <td>${escapeHtml(item.subject)}</td>
              <td>${item.hasXml ? statusBadge("XML_IDENTIFIED") : statusBadge(item.status)}</td>
              <td>${statusBadge(item.classification)}</td>
              <td>
                ${
                  item.linkedNoteId
                    ? `<strong>#${escapeHtml(item.linkedNoteId)}</strong><div class="muted">${escapeHtml(item.linkedNoteDanfe || "")}</div>`
                    : `<span class="muted">Não gerada</span>`
                }
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum email processado.", 6);

  syncResponsiveTableLabels();
}

function renderAdmin() {
  if (state.user?.role !== "ADMIN") {
    refs.adminUsersTableBody.innerHTML = emptyRow("Acesso restrito aos administradores.", 6);
    refs.logsTableBody.innerHTML = emptyRow("Acesso restrito aos administradores.", 5);
    refs.adminCompanyCard?.classList.add("hidden");
    refs.checklistTemplatePanel?.classList.add("hidden");
    return;
  }

  refs.adminCompanyCard?.classList.remove("hidden");
  refs.checklistTemplatePanel?.classList.remove("hidden");

  if (refs.adminCompanyForm) {
    refs.adminCompanyForm.elements.companyName.value = state.company.companyName || "";
    refs.adminCompanyForm.elements.cnpj.value = state.company.cnpj || "";
    refs.adminCompanyForm.elements.address.value = state.company.address || "";
    refs.adminCompanyForm.elements.phone.value = state.company.phone || "";
    refs.adminCompanyForm.elements.email.value = state.company.email || "";
    refs.adminCompanyForm.elements.primaryColor.value = state.company.primaryColor || "#c40000";
    refs.adminCompanyForm.elements.documentFooter.value = state.company.documentFooter || "";
    refs.adminCompanyForm.elements.logoDataUrl.value = state.company.logoDataUrl || "";
  }

  if (refs.adminCompanyLogoPreview) {
    refs.adminCompanyLogoPreview.innerHTML = state.company.logoDataUrl
      ? `<img src="${state.company.logoDataUrl}" alt="Logo da empresa" />`
      : `<span class="muted">Sem logo configurada</span>`;
  }

  refs.adminUsersTableBody.innerHTML = state.adminUsers.length
    ? state.adminUsers
        .map(
          (item) => `
            <tr>
              <td>
                <strong>${escapeHtml(item.name)}</strong>
                <div class="muted">${escapeHtml(formatDateTime(item.createdAt))}</div>
              </td>
              <td>${escapeHtml(item.email)}</td>
              <td>${escapeHtml(roleLabels[item.role] || item.role)}</td>
              <td>${statusBadge(item.status)}</td>
              <td class="muted">${escapeHtml(renderAdminUserCodeState(item))}</td>
              <td>
                <div class="row-actions">
                  ${renderAdminUserActions(item)}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum usuario administravel cadastrado.", 6);

  refs.logsTableBody.innerHTML = state.logs.length
    ? state.logs
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
              <td>${escapeHtml(item.userName)}</td>
              <td>${escapeHtml(item.action)}</td>
              <td>${escapeHtml(item.entityType)} ${escapeHtml(item.entityId || "")}</td>
              <td>${escapeHtml(formatAdminLogDetails(item.details))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum log disponível.", 5);
}

function renderAdminUserActions(item) {
  const actions = [buildRowActionButton("edit-user", item.id, "Editar usuario", "&#9998;")];

  if (item.status === "BLOCKED") {
    actions.push(buildRowActionButton("unblock-user", item.id, "Desbloquear usuario", "&#10003;"));
  } else {
    actions.push(
      buildRowActionButton(
        item.status === "ACTIVE" ? "reset-user-password" : "issue-user-code",
        item.id,
        item.status === "ACTIVE" ? "Redefinir senha por codigo" : "Emitir codigo de ativacao",
        "&#35;"
      )
    );
    actions.push(buildRowActionButton("block-user", item.id, "Bloquear usuario", "&#10005;", "danger"));
  }

  return actions.join("");
}

function renderAdminUserCodeState(item) {
  if (item.hasActiveActivationCode && item.activationCodeExpiresAt) {
    return `Codigo ativo ate ${formatDateTime(item.activationCodeExpiresAt)}`;
  }
  if (item.status === "PENDING") {
    return "Aguardando emissao de codigo";
  }
  if (item.status === "BLOCKED") {
    return "Usuario bloqueado";
  }
  return "Sem codigo pendente";
}

async function handleCompanySettingsSubmit(event) {
  event.preventDefault();

  const payload = {
    companyName: refs.adminCompanyForm.elements.companyName.value,
    cnpj: refs.adminCompanyForm.elements.cnpj.value,
    address: refs.adminCompanyForm.elements.address.value,
    phone: refs.adminCompanyForm.elements.phone.value,
    email: refs.adminCompanyForm.elements.email.value,
    primaryColor: refs.adminCompanyForm.elements.primaryColor.value,
    documentFooter: refs.adminCompanyForm.elements.documentFooter.value,
    logoDataUrl: refs.adminCompanyForm.elements.logoDataUrl.value,
  };

  try {
    await api("/api/settings/company", { method: "PUT", body: payload });
    await refreshCompanySettings();
    showToast("Configuracao da empresa salva com sucesso.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleCompanyLogoInputChange(event) {
  const [file] = Array.from(event.target.files || []);
  if (!file) {
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    if (refs.adminCompanyForm?.elements.logoDataUrl) {
      refs.adminCompanyForm.elements.logoDataUrl.value = dataUrl;
    }
    state.company = {
      ...state.company,
      logoDataUrl: dataUrl,
    };
    renderAdmin();
  } catch (error) {
    showToast("Nao foi possivel carregar a logo selecionada.", "error");
  }
}

function clearCompanyLogoSelection() {
  if (refs.adminCompanyForm?.elements.logoDataUrl) {
    refs.adminCompanyForm.elements.logoDataUrl.value = "";
  }
  if (refs.adminCompanyLogoInput) {
    refs.adminCompanyLogoInput.value = "";
  }
  state.company = {
    ...state.company,
    logoDataUrl: "",
  };
  renderAdmin();
}

async function handleChecklistTemplateSubmit(event) {
  event.preventDefault();

  const id = refs.checklistTemplateForm.elements.id.value;
  const payload = {
    name: refs.checklistTemplateForm.elements.name.value,
    description: refs.checklistTemplateForm.elements.description.value,
    category: refs.checklistTemplateForm.elements.category.value,
    required: refs.checklistTemplateForm.elements.required.value === "true",
    active: refs.checklistTemplateForm.elements.active.value === "true",
    vehicleType: refs.checklistTemplateForm.elements.vehicleType.value,
    sortOrder: refs.checklistTemplateForm.elements.sortOrder.value,
    itemKey: refs.checklistTemplateForm.elements.itemKey.value,
  };

  try {
    await api(id ? `/api/checklists/template/${id}` : "/api/checklists/template", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetChecklistTemplateForm();
    await refreshChecklistTemplate();
    showToast(id ? "Item de checklist atualizado com sucesso." : "Item de checklist criado com sucesso.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function resetChecklistTemplateForm() {
  if (!refs.checklistTemplateForm) {
    return;
  }

  refs.checklistTemplateForm.reset();
  refs.checklistTemplateForm.elements.id.value = "";
  refs.checklistTemplateForm.elements.required.value = "true";
  refs.checklistTemplateForm.elements.active.value = "true";
  refs.checklistTemplateForm.elements.category.value = "Seguranca";
  refs.checklistTemplateForm.elements.sortOrder.value = String(state.checklistTemplate.length + 1 || 1);
}

function editChecklistTemplate(id) {
  const item = state.checklistTemplate.find((entry) => String(entry.id) === String(id));
  if (!item || !refs.checklistTemplateForm) {
    return;
  }

  refs.checklistTemplateForm.elements.id.value = item.id;
  refs.checklistTemplateForm.elements.name.value = item.name || item.label || "";
  refs.checklistTemplateForm.elements.itemKey.value = item.itemKey || item.key || "";
  refs.checklistTemplateForm.elements.description.value = item.description || "";
  refs.checklistTemplateForm.elements.category.value = item.category || "Outros";
  refs.checklistTemplateForm.elements.required.value = item.required === false ? "false" : "true";
  refs.checklistTemplateForm.elements.active.value = item.active === false ? "false" : "true";
  refs.checklistTemplateForm.elements.vehicleType.value = item.vehicleType || "";
  refs.checklistTemplateForm.elements.sortOrder.value = item.sortOrder || 1;
  scrollToElement(refs.checklistTemplateForm);
}

async function toggleChecklistTemplate(id) {
  const item = state.checklistTemplate.find((entry) => String(entry.id) === String(id));
  if (!item) {
    return;
  }

  try {
    await api(`/api/checklists/template/${id}`, {
      method: "PUT",
      body: {
        ...item,
        active: item.active === false,
      },
    });
    await refreshChecklistTemplate();
    if (!refs.checklistForm.elements.id.value) {
      state.checklistDraftItems = cloneChecklistTemplate();
      renderChecklistComposer();
    }
    showToast(item.active === false ? "Item reativado com sucesso." : "Item desativado com sucesso.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function formatAdminLogDetails(details) {
  if (!details) {
    return "-";
  }
  return typeof details === "object" ? JSON.stringify(details) : String(details);
}

function updateMovementProductSelect() {
  refs.movementProductSelect.innerHTML = state.products.length
    ? state.products
        .map(
          (product) => `
            <option value="${product.id}">
              ${escapeHtml(product.name)} (${escapeHtml(formatNumber(product.currentStock || 0, 2, 2))} ${escapeHtml(product.unit)})
            </option>
          `
        )
        .join("")
    : `<option value="">Cadastre um produto primeiro</option>`;
}

function findById(collection, id) {
  return collection.find((item) => item.id === Number(id));
}

function handleRowActions(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "edit-note") editNote(id);
  if (action === "delete-note") deleteNote(id);
  if (action === "edit-product") editProduct(id);
  if (action === "edit-vehicle") editVehicle(id);
  if (action === "edit-schedule") editSchedule(id);
  if (action === "edit-fine") editFine(id);
  if (action === "edit-checklist") editChecklist(id);
  if (action === "edit-checklist-template") editChecklistTemplate(id);
  if (action === "toggle-checklist-template") toggleChecklistTemplate(id);
  if (action === "edit-user") editAdminUser(id);
  if (action === "issue-user-code") issueAdminUserCode(id, "ACTIVATION");
  if (action === "reset-user-password") issueAdminUserCode(id, "RESET_PASSWORD");
  if (action === "block-user") updateAdminUserStatus(id, "BLOCKED");
  if (action === "unblock-user") updateAdminUserStatus(id, "ACTIVE");
}

function editNote(id) {
  const note = findById(state.notes, id);
  if (!note) return;

  refs.noteForm.elements.id.value = note.id;
  refs.noteForm.elements.supplierName.value = note.supplierName;
  refs.noteForm.elements.totalValue.value = note.totalValue;
  refs.noteForm.elements.danfe.value = note.danfe || "";
  refs.noteForm.elements.issueDate.value = toLocalDateTimeInput(note.issueDate);
  refs.noteForm.elements.category.value = note.category;
  refs.noteForm.elements.status.value = note.status;
  refs.noteForm.elements.sentToFinanceAt.value = toLocalDateTimeInput(note.sentToFinanceAt);
  refs.noteForm.elements.financeNotes.value = note.financeNotes || "";
  setSection("notes");
}

function editProduct(id) {
  const product = findById(state.products, id);
  if (!product) return;

  refs.productForm.elements.id.value = product.id;
  refs.productForm.elements.name.value = product.name;
  refs.productForm.elements.unit.value = product.unit;
  refs.productForm.elements.barcode.value = product.barcode || "";
  refs.productForm.elements.minStock.value = product.minStock;
  refs.productForm.elements.defaultCost.value = product.defaultCost || 0;
  refs.productForm.elements.initialStock.value = 0;
  refs.productForm.elements.initialStock.disabled = true;
  setSection("inventory");
}

function editVehicle(id) {
  const vehicle = findById(state.vehicles, id);
  if (!vehicle) return;

  refs.vehicleForm.elements.id.value = vehicle.id;
  refs.vehicleForm.elements.plate.value = vehicle.plate;
  refs.vehicleForm.elements.fuelProfile.value = vehicle.fuelProfile;
  refs.vehicleForm.elements.brand.value = vehicle.brand || "";
  refs.vehicleForm.elements.model.value = vehicle.model || "";
  refs.vehicleForm.elements.sector.value = vehicle.sector || "";
  refs.vehicleForm.elements.status.value = vehicle.active ? "ACTIVE" : "INACTIVE";
  refs.vehicleForm.elements.notes.value = vehicle.notes || "";
  setSection("vehicles");
}

function editSchedule(id) {
  const item = findById(state.schedules, id);
  if (!item) return;

  refs.scheduleForm.elements.id.value = item.id;
  refs.scheduleForm.elements.scheduledDate.value = item.scheduledDate;
  refs.scheduleForm.elements.vehicle.value = item.vehicle;
  refs.scheduleForm.elements.driver.value = item.driver;
  refs.scheduleForm.elements.assistant.value = item.assistant || "";
  refs.scheduleForm.elements.notes.value = item.notes || "";
  setSection("schedules");
}

function editFine(id) {
  const item = findById(state.fines, id);
  if (!item) return;

  refs.fineForm.elements.id.value = item.id;
  refs.fineForm.elements.fineDate.value = item.fineDate;
  refs.fineForm.elements.plate.value = item.plate;
  refs.fineForm.elements.driver.value = item.driver;
  refs.fineForm.elements.status.value = item.status;
  refs.fineForm.elements.amount.value = item.amount;
  refs.fineForm.elements.notes.value = item.notes || "";
  setSection("fines");
}

function editChecklist(id) {
  const item = findById(state.checklists, id);
  if (!item) return;

  refs.checklistForm.elements.id.value = item.id;
  refs.checklistForm.elements.vehicle.value = item.vehicle;
  refs.checklistForm.elements.checklistDate.value = item.checklistDate;
  refs.checklistForm.elements.status.value = item.status;
  refs.checklistForm.elements.items.value = item.items.join("\n");
  refs.checklistForm.elements.problems.value = item.problems || "";
  setSection("checklists");
}

function editAdminUser(id) {
  const item = findById(state.adminUsers, id);
  if (!item) return;

  refs.adminUserForm.elements.id.value = item.id;
  refs.adminUserForm.elements.name.value = item.name;
  refs.adminUserForm.elements.email.value = item.email;
  refs.adminUserForm.elements.role.value = item.role;
  setSection("admin");
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  try {
    const payload = Object.fromEntries(new FormData(refs.loginForm).entries());
    const response = await api("/api/auth/login", { method: "POST", body: payload });
    refs.loginForm.reset();
    setUser(response.user);
    applyDefaultFormValues();
    await refreshAll();
    showToast("Login realizado com sucesso.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleActivationSubmit(event) {
  event.preventDefault();

  try {
    const payload = Object.fromEntries(new FormData(refs.activationForm).entries());
    await api("/api/auth/activate", { method: "POST", body: payload });
    refs.activationForm.reset();
    switchAuthMode("login");
    showToast("Conta ativada. Entre com seu email e nova senha.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleAdminUserSubmit(event) {
  event.preventDefault();
  const id = refs.adminUserForm.elements.id.value;
  const payload = {
    name: refs.adminUserForm.elements.name.value,
    email: refs.adminUserForm.elements.email.value,
    role: refs.adminUserForm.elements.role.value,
  };

  try {
    await api(id ? `/api/admin/users/${id}` : "/api/admin/users", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetAdminUserForm();
    await refreshAdmin();
    showToast(id ? "Usuario atualizado." : "Usuario criado com sucesso.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function copyTextToClipboard(value) {
  if (!value) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (error) {
    // segue para o fallback
  }

  const hiddenInput = document.createElement("textarea");
  hiddenInput.value = value;
  hiddenInput.setAttribute("readonly", "true");
  hiddenInput.style.position = "fixed";
  hiddenInput.style.opacity = "0";
  document.body.appendChild(hiddenInput);
  hiddenInput.select();
  hiddenInput.setSelectionRange(0, hiddenInput.value.length);
  const copied = document.execCommand("copy");
  hiddenInput.remove();
  return copied;
}

async function issueAdminUserCode(id, purpose) {
  try {
    const response = await api(`/api/admin/users/${id}/activation-code`, {
      method: "POST",
      body: { purpose },
    });
    const copied = await copyTextToClipboard(response.code);
    await refreshAdmin();
    if (!copied) {
      showToast("Nao foi possivel copiar o codigo. Gere um novo codigo apos liberar a area de transferencia.", "error");
      return;
    }
    showToast(
      purpose === "RESET_PASSWORD"
        ? "Codigo de redefinicao copiado para a area de transferencia."
        : "Codigo de ativacao copiado para a area de transferencia."
    );
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function updateAdminUserStatus(id, status) {
  try {
    await api(`/api/admin/users/${id}/status`, {
      method: "POST",
      body: { status },
    });
    await refreshAdmin();
    showToast(status === "BLOCKED" ? "Usuario bloqueado." : "Usuario desbloqueado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleLogout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    closeScanner();
    setUser(null);
    showToast("Sessão encerrada.");
  }
}

async function handleNoteSubmit(event) {
  event.preventDefault();
  const id = refs.noteForm.elements.id.value;

  const payload = {
    supplierName: refs.noteForm.elements.supplierName.value,
    totalValue: refs.noteForm.elements.totalValue.value,
    danfe: refs.noteForm.elements.danfe.value,
    issueDate: toIsoDateTime(refs.noteForm.elements.issueDate.value),
    category: refs.noteForm.elements.category.value,
    status: refs.noteForm.elements.status.value,
    sentToFinanceAt: toIsoDateTime(refs.noteForm.elements.sentToFinanceAt.value),
    financeNotes: refs.noteForm.elements.financeNotes.value,
  };

  try {
    await api(id ? `/api/notes/${id}` : "/api/notes", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetNoteForm();
    await Promise.all([refreshNotes(), refreshDashboard()]);
    showToast(id ? "Nota atualizada." : "Nota cadastrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteNote(id) {
  if (!window.confirm("Confirma a exclusão desta nota fiscal?")) {
    return;
  }

  try {
    await api(`/api/notes/${id}`, { method: "DELETE" });
    await Promise.all([refreshNotes(), refreshDashboard(), refreshAdmin()]);
    showToast("Nota excluída.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleXmlImport() {
  const files = Array.from(refs.xmlImportInput.files || []);
  if (!files.length) {
    showToast("Selecione ao menos um XML.", "error");
    return;
  }

  try {
    const payloadFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await file.text(),
      }))
    );

    await api("/api/notes/import/xml", {
      method: "POST",
      body: { files: payloadFiles },
    });

    refs.xmlImportInput.value = "";
    await Promise.all([refreshNotes(), refreshDashboard(), maybeRefreshAdmin()]);
    showToast(`${files.length} XML(s) importado(s).`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

async function handleSpreadsheetImport() {
  const file = refs.spreadsheetImportInput.files?.[0];
  if (!file) {
    showToast("Selecione uma planilha.", "error");
    return;
  }

  try {
    const contentBase64 = await fileToBase64(file);
    await api("/api/notes/import/spreadsheet", {
      method: "POST",
      body: {
        fileName: file.name,
        contentBase64,
      },
    });

    refs.spreadsheetImportInput.value = "";
    await Promise.all([refreshNotes(), refreshDashboard(), maybeRefreshAdmin()]);
    showToast(`Planilha ${file.name} importada.`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const id = refs.productForm.elements.id.value;

  const payload = {
    name: refs.productForm.elements.name.value,
    unit: refs.productForm.elements.unit.value,
    barcode: refs.productForm.elements.barcode.value,
    minStock: refs.productForm.elements.minStock.value,
    defaultCost: refs.productForm.elements.defaultCost.value,
    initialStock: refs.productForm.elements.initialStock.value,
  };

  try {
    await api(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetProductForm();
    await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);
    showToast(id ? "Produto atualizado." : "Produto cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleVehicleSubmit(event) {
  event.preventDefault();
  const id = refs.vehicleForm.elements.id.value;

  const payload = {
    plate: refs.vehicleForm.elements.plate.value,
    fuelProfile: refs.vehicleForm.elements.fuelProfile.value,
    brand: refs.vehicleForm.elements.brand.value,
    model: refs.vehicleForm.elements.model.value,
    sector: refs.vehicleForm.elements.sector.value,
    status: refs.vehicleForm.elements.status.value,
    notes: refs.vehicleForm.elements.notes.value,
  };

  try {
    await api(id ? `/api/vehicles/${id}` : "/api/vehicles", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetVehicleForm();
    await Promise.all([refreshVehicles(), refreshFuel(), refreshDashboard()]);
    showToast(id ? "Veiculo atualizado." : "Veiculo cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleMovementSubmit(event) {
  event.preventDefault();

  const payload = {
    productId: refs.movementForm.elements.productId.value,
    type: refs.movementForm.elements.type.value,
    quantity: refs.movementForm.elements.quantity.value,
    document: refs.movementForm.elements.document.value,
    branchName: refs.movementForm.elements.branchName.value,
    supplierName: refs.movementForm.elements.supplierName.value,
    fuelKind: refs.movementForm.elements.fuelKind.value,
    unitCost: refs.movementForm.elements.unitCost.value,
    occurredAt: toIsoDateTime(refs.movementForm.elements.occurredAt.value),
    notes: refs.movementForm.elements.notes.value,
  };

  try {
    await api("/api/inventory/movements", { method: "POST", body: payload });
    refs.movementForm.reset();
    refs.movementForm.elements.occurredAt.value = currentLocalDateTime();
    refs.movementBarcodeInput.value = "";
    await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);
    showToast("Movimentação registrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function lookupProductByBarcode() {
  const barcode = refs.movementBarcodeInput.value.trim();
  if (!barcode) {
    showToast("Informe um código de barras.", "error");
    return;
  }

  try {
    const response = await api(`/api/products/barcode/${encodeURIComponent(barcode)}`);
    refs.movementProductSelect.value = String(response.item.id);
    showToast(`Produto encontrado: ${response.item.name}`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleFuelSubmit(event) {
  event.preventDefault();
  const isExit = refs.fuelForm.elements.type.value === "EXIT";
  const selectedVehicle =
    isExit && refs.fuelForm.elements.vehicleId.value
      ? state.vehicles.find((item) => String(item.id) === String(refs.fuelForm.elements.vehicleId.value))
      : null;

  let quantity = 0;
  let odometerKm = null;

  try {
    quantity = readBrazilianNumberField(refs.fuelForm.elements.quantity, {
      label: "litros",
      required: true,
      min: 0.000001,
    });
    odometerKm = readBrazilianNumberField(refs.fuelForm.elements.odometerKm, {
      label: "KM",
      min: 0,
    });
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const warnings = [];
  if (isExit && quantity > 500) {
    warnings.push("Valor de litros muito alto. Confirme se o lançamento está correto.");
  }
  if (!confirmSuspiciousFuelValues(warnings)) {
    return;
  }

  const payload = {
    storageId: refs.fuelForm.elements.storageId.value,
    type: refs.fuelForm.elements.type.value,
    vehicleId: isExit ? refs.fuelForm.elements.vehicleId.value : "",
    quantity,
    odometerKm,
    occurredAt: toIsoDateTime(refs.fuelForm.elements.occurredAt.value),
    notes: refs.fuelForm.elements.notes.value,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshDashboard()]);
    showToast("Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  const id = refs.scheduleForm.elements.id.value;

  const payload = {
    scheduledDate: refs.scheduleForm.elements.scheduledDate.value,
    vehicle: refs.scheduleForm.elements.vehicle.value,
    driver: refs.scheduleForm.elements.driver.value,
    assistant: refs.scheduleForm.elements.assistant.value,
    notes: refs.scheduleForm.elements.notes.value,
  };

  try {
    await api(id ? `/api/schedules/${id}` : "/api/schedules", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetScheduleForm();
    await Promise.all([refreshSchedules(), refreshDashboard(), maybeRefreshAdmin()]);

    if (state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(payload.vehicle)) {
      await loadVehicleDossierByPlate(payload.vehicle, { silent: true });
    }

    showToast(id ? "Escala atualizada." : "Escala cadastrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function renderFuel() {
  const analytics = buildFuelPageAnalytics(state.fuelRecords);
  const currentPlate = refs.fuelFilterPlate?.value || "";
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.innerHTML = `<option value="">Todos os veiculos</option>${analytics.plates
      .map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`)
      .join("")}`;
    refs.fuelFilterPlate.value = analytics.plates.includes(currentPlate) ? currentPlate : "";
  }

  refs.fuelKpiGrid.innerHTML = [
    {
      label: "Abastecimentos",
      value: formatNumber(analytics.monthExitRecords.length),
      note: "Saidas no mes atual",
      icon: "fuel",
      tone: "brand",
    },
    {
      label: "Total de litros",
      value: `${formatLiters(analytics.monthLiters)} L`,
      note: "Consumo do mes atual",
      icon: "analytics",
      tone: "neutral",
    },
    {
      label: "Media por lancamento",
      value: `${formatLiters(analytics.avgLiters)} L`,
      note: "Considerando apenas saidas",
      icon: "dashboard",
      tone: "warning",
    },
    {
      label: "Media km/L",
      value: formatKmPerLiter(analytics.avgKmPerLiter),
      note: "Com base nos hodometros informados",
      icon: "efficiency",
      tone: "success",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card",
        label: item.label,
        value: item.value,
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.fuelStocksGrid.innerHTML = state.fuelStorages.length
    ? state.fuelStorages
        .map((storage) => {
          const isEmpty = Number(storage.currentBalance || 0) <= 0;
          const isLow =
            !isEmpty &&
            Number(storage.minBalance || 0) > 0 &&
            Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0);
          const statusLabel = isEmpty ? "Sem saldo" : isLow ? "Abaixo do minimo" : "Operacional";
          const toneClass = isEmpty ? "is-empty" : isLow ? "is-low" : "is-ok";

          return `
            <article class="fuel-stock-card ${toneClass}">
              <div class="fuel-stock-card__top">
                <span class="fuel-stock-card__kind">${escapeHtml(formatFuelKindLabel(storage.fuelKind))}</span>
                <span class="fuel-stock-card__status">${escapeHtml(statusLabel)}</span>
              </div>
              <div class="fuel-stock-card__value-row">
                <strong class="fuel-stock-card__value">${escapeHtml(formatLiters(storage.currentBalance))}</strong>
                <span class="fuel-stock-card__unit">L</span>
              </div>
              <div class="fuel-stock-card__footer">
                <strong>${escapeHtml(storage.name)}</strong>
                <span>Saldo disponivel agora</span>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="stack-item"><strong>Nenhum estoque configurado</strong><p class="muted">Cadastre ou revise os estoques principais de combustivel.</p></div>`;

  renderFuelHistoryTable();
  renderFuelComposerMode();
  syncFuelFormState();
  renderFuelBatchComposer();

  refs.fuelConsumptionChart.innerHTML = renderConsumptionChart({
    consumptionSeries: analytics.consumptionSeries,
    totalConsumptionLiters: analytics.consumptionSeries.reduce((total, item) => total + item.total, 0),
    peakConsumption: analytics.peakConsumption,
    fuelMix: analytics.fuelMix,
  });

  refs.fuelTopVehicles.innerHTML = renderMeterList(
    analytics.topVehicles.map((item) => ({
      label: item.plate,
      value: item.liters,
      count: item.count,
    })),
    {
      emptyTitle: "Sem consumo no periodo",
      emptyDescription: "Assim que houver saidas registradas, os veiculos de maior consumo aparecem aqui.",
      valueFormatter: (value) => `${formatLiters(value)} L`,
      secondaryFormatter: (item) => `${item.count} lancamento(s)`,
    }
  );

  refs.fuelSideInsights.innerHTML = buildFuelSideInsights(analytics);
  syncResponsiveTableLabels();
}

async function handleFuelSubmit(event) {
  event.preventDefault();
  if (!refs.fuelForm) {
    return;
  }

  const movementType = refs.fuelForm.elements.type.value || "OPERATIONAL_EXIT";
  const occurredAt = toIsoDateTime(refs.fuelForm.elements.occurredAt.value);

  if (!occurredAt) {
    showToast("Informe uma data e hora valida.", "error");
    return;
  }

  let quantity = 0;
  let unitCost = null;
  let odometerKm = null;

  try {
    quantity = readBrazilianNumberField(refs.fuelForm.elements.quantity, {
      label: "quantidade",
      required: true,
      min: 0.000001,
    });

    if (movementType === "STOCK_ENTRY") {
      unitCost = readBrazilianNumberField(refs.fuelForm.elements.unitCost, {
        label: "valor unitario",
        min: 0,
      });
    }

    if (movementType === "OPERATIONAL_EXIT" && String(refs.fuelForm.elements.odometerKm.value || "").trim()) {
      odometerKm = readBrazilianNumberField(refs.fuelForm.elements.odometerKm, {
        label: "KM",
        min: 0,
      });
    }
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const warnings = [];
  if (quantity > 500) {
    warnings.push("Valor de litros muito alto. Confirme se o lancamento esta correto.");
  }
  if (unitCost !== null && unitCost > 20) {
    warnings.push("Valor unitario acima de R$ 20,00. Confirme se o lancamento esta correto.");
  }
  if (!confirmSuspiciousFuelValues(warnings)) {
    return;
  }

  if (movementType === "STOCK_ENTRY") {
    if (!refs.fuelForm.elements.productId.value) {
      showToast("Selecione o combustivel da entrada no estoque.", "error");
      return;
    }

    const payload = {
      productId: refs.fuelForm.elements.productId.value,
      stockType: "FUEL",
      type: "IN",
      quantity,
      unitCost,
      document: refs.fuelForm.elements.document.value,
      supplierName: refs.fuelForm.elements.supplierName.value,
      occurredAt,
      notes: refs.fuelForm.elements.notes.value,
    };

    try {
      await api("/api/inventory/movements", { method: "POST", body: payload });
      resetFuelForm();
      await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshFuel(), refreshDashboard()]);
      showToast("Entrada de combustivel registrada.");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const selectedVehicle = resolveFuelVehicleByPlate(refs.fuelVehicleInput?.value || "");
  if (movementType === "OPERATIONAL_EXIT" && !selectedVehicle) {
    showToast("Selecione uma placa cadastrada para o abastecimento.", "error");
    return;
  }

  const isAdjustment = movementType === "BALANCE_ADJUSTMENT";
  const storageId = refs.fuelForm.elements.storageId.value;
  if (!storageId) {
    showToast("Selecione o combustivel da movimentacao.", "error");
    return;
  }
  const adjustmentKind = refs.fuelForm.elements.adjustmentType.value || "DECREASE";
  const payload = isAdjustment
    ? {
        storageId,
        type: adjustmentKind === "INCREASE" ? "ENTRY" : "EXIT",
        operationKind: "ADJUSTMENT",
        adjustmentKind,
        quantity,
        occurredAt,
        notes: refs.fuelForm.elements.notes.value,
        entryOrigin: "MANUAL",
      }
    : {
        storageId,
        type: "EXIT",
        operationKind: "OPERATIONAL",
        vehicleId: selectedVehicle ? selectedVehicle.id : "",
        plate: selectedVehicle ? selectedVehicle.plate : refs.fuelVehicleInput.value,
        quantity,
        odometerKm,
        occurredAt,
        notes: refs.fuelForm.elements.notes.value,
        entryOrigin: "MANUAL",
      };

  payload.rawPayload = {
    plate: refs.fuelVehicleInput?.value || "",
    storageId,
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    unitCost: refs.fuelForm.elements.unitCost.value,
    type: movementType,
    occurredAt,
    notes: refs.fuelForm.elements.notes.value,
  };

  payload.normalizedPayload = {
    storageId,
    vehicleId: selectedVehicle ? selectedVehicle.id : null,
    plate: selectedVehicle ? selectedVehicle.plate : "",
    quantity,
    odometerKm,
    type: payload.type,
    operationKind: payload.operationKind,
    adjustmentKind: payload.adjustmentKind || "",
    occurredAt,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    if (
      selectedVehicle &&
      state.dossier.selectedPlate &&
      normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(selectedVehicle.plate)
    ) {
      await loadVehicleDossierByPlate(selectedVehicle.plate, { silent: true });
    }

    showToast(isAdjustment ? "Ajuste de saldo registrado." : "Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function bindFuelHistoryEvents() {
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.addEventListener("change", () => {
      refreshFuelHistory({ resetPage: true }).catch((error) => showToast(error.message, "error"));
    });
  }

  refs.fuelHistoryApplyButton?.addEventListener("click", () => {
    refreshFuelHistory({ resetPage: true }).catch((error) => showToast(error.message, "error"));
  });
  refs.fuelHistoryClearButton?.addEventListener("click", () => {
    clearFuelHistoryFilters();
  });

  [
    refs.fuelHistoryMovementKind,
    refs.fuelHistoryUser,
    refs.fuelHistoryStatus,
  ].forEach((input) => {
    input?.addEventListener("change", () => {
      refreshFuelHistory({ resetPage: true }).catch((error) => showToast(error.message, "error"));
    });
  });

  const debouncedRefresh = debounce(() => {
    refreshFuelHistory({ resetPage: true }).catch((error) => showToast(error.message, "error"));
  }, 250);

  [refs.fuelHistoryDocument, refs.fuelHistorySearch].forEach((input) => {
    input?.addEventListener("input", debouncedRefresh);
  });

  refs.fuelHistoryTableBody?.addEventListener("click", handleFuelHistoryActionClick);
  refs.fuelHistoryPagination?.addEventListener("click", handleFuelHistoryPaginationClick);
  refs.fuelHistoryDetailContent?.addEventListener("click", handleFuelHistoryActionClick);
  refs.fuelHistoryDetailContent?.addEventListener("submit", handleFuelHistoryDetailSubmit);
}

function getFuelHistoryState() {
  if (!state.fuelHistory) {
    state.fuelHistory = {
      items: [],
      users: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
      },
      activeItem: null,
      audits: [],
      panelMode: "details",
      selectedHistoryId: "",
      isLoading: false,
    };
  }

  return state.fuelHistory;
}

function getFuelHistorySelectedKey(sourceKind, sourceId) {
  return `${String(sourceKind || "").toUpperCase()}:${Number(sourceId || 0)}`;
}

function buildFuelHistoryQueryString({ page, resetPage = false } = {}) {
  const historyState = getFuelHistoryState();
  const query = new URLSearchParams();

  if (refs.fuelFilterStorage?.value) query.set("storageId", refs.fuelFilterStorage.value);
  if (refs.fuelFilterFrom?.value) query.set("from", toIsoDateTime(refs.fuelFilterFrom.value));
  if (refs.fuelFilterTo?.value) query.set("to", toIsoDateTime(refs.fuelFilterTo.value));
  if (refs.fuelFilterPlate?.value) query.set("plate", refs.fuelFilterPlate.value);
  if (refs.fuelHistoryMovementKind?.value) query.set("movementKind", refs.fuelHistoryMovementKind.value);
  if (refs.fuelHistoryUser?.value) query.set("user", refs.fuelHistoryUser.value);
  if (refs.fuelHistoryDocument?.value?.trim()) query.set("document", refs.fuelHistoryDocument.value.trim());
  if (refs.fuelHistoryStatus?.value) query.set("status", refs.fuelHistoryStatus.value);
  if (refs.fuelHistorySearch?.value?.trim()) query.set("search", refs.fuelHistorySearch.value.trim());

  const nextPage =
    page !== undefined && page !== null
      ? Math.max(1, Number(page) || 1)
      : resetPage
        ? 1
        : Math.max(1, Number(historyState.pagination?.page || 1));
  query.set("page", String(nextPage));
  query.set("pageSize", String(Math.max(5, Number(historyState.pagination?.pageSize || 20))));

  return query.toString();
}

function applyFuelHistoryResponse(response = {}) {
  const historyState = getFuelHistoryState();
  historyState.items = Array.isArray(response.items) ? response.items : [];
  historyState.users = Array.isArray(response.users) ? response.users : [];
  historyState.pagination = {
    page: Number(response.pagination?.page || 1),
    pageSize: Number(response.pagination?.pageSize || historyState.pagination?.pageSize || 20),
    total: Number(response.pagination?.total || 0),
    totalPages: Number(response.pagination?.totalPages || 1),
  };

  if (
    historyState.selectedHistoryId &&
    !historyState.items.some((item) => getFuelHistorySelectedKey(item.sourceKind, item.sourceId) === historyState.selectedHistoryId)
  ) {
    historyState.selectedHistoryId = historyState.activeItem
      ? getFuelHistorySelectedKey(historyState.activeItem.sourceKind, historyState.activeItem.sourceId)
      : "";
  }

  populateFuelHistoryUserOptions(historyState.users);
}

function populateFuelHistoryUserOptions(users = []) {
  if (!refs.fuelHistoryUser) {
    return;
  }

  const currentValue = refs.fuelHistoryUser.value || "";
  const options = Array.from(new Set(users.filter(Boolean))).sort((left, right) => left.localeCompare(right));
  refs.fuelHistoryUser.innerHTML = `<option value="">Todos</option>${options
    .map((userName) => `<option value="${escapeHtml(userName)}">${escapeHtml(userName)}</option>`)
    .join("")}`;
  refs.fuelHistoryUser.value = options.includes(currentValue) ? currentValue : "";
}

async function refreshFuelHistory({ page, resetPage = false } = {}) {
  if (!refs.fuelHistoryTableBody) {
    return;
  }

  const historyState = getFuelHistoryState();
  historyState.isLoading = true;
  renderFuelHistoryTable();

  const suffix = buildFuelHistoryQueryString({ page, resetPage });
  const response = await api(`/api/fuel/history${suffix ? `?${suffix}` : ""}`);
  applyFuelHistoryResponse(response);
  historyState.isLoading = false;
  renderFuelHistoryTable();
}

function clearFuelHistoryFilters() {
  if (refs.fuelFilterStorage) refs.fuelFilterStorage.value = "";
  if (refs.fuelFilterFrom) refs.fuelFilterFrom.value = "";
  if (refs.fuelFilterTo) refs.fuelFilterTo.value = "";
  if (refs.fuelFilterPlate) refs.fuelFilterPlate.value = "";
  if (refs.fuelHistoryMovementKind) refs.fuelHistoryMovementKind.value = "";
  if (refs.fuelHistoryUser) refs.fuelHistoryUser.value = "";
  if (refs.fuelHistoryDocument) refs.fuelHistoryDocument.value = "";
  if (refs.fuelHistoryStatus) refs.fuelHistoryStatus.value = "";
  if (refs.fuelHistorySearch) refs.fuelHistorySearch.value = "";

  const historyState = getFuelHistoryState();
  historyState.selectedHistoryId = "";
  historyState.activeItem = null;
  historyState.audits = [];
  historyState.panelMode = "details";

  refreshFuel().catch((error) => showToast(error.message, "error"));
}

function buildFuelHistorySummaryText() {
  const historyState = getFuelHistoryState();
  const totalRows = Number(historyState.pagination?.total || 0);
  const liters = historyState.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const cancelledCount = historyState.items.filter((item) => item.status === "CANCELLED").length;
  const suspiciousCount = historyState.items.filter((item) => item.suspicious).length;
  return `${formatNumber(totalRows)} registro(s) | ${formatLiters(liters)} L na pagina | ${cancelledCount} cancelado(s) | ${suspiciousCount} suspeito(s)`;
}

function buildFuelHistoryBadges(item) {
  const badges = [statusBadge(item.movementKind)];
  if (item.corrected) {
    badges.push(statusBadge("CORRECTED"));
  }
  if (item.status === "CANCELLED") {
    badges.push(statusBadge("CANCELLED"));
  }
  if (item.suspicious) {
    badges.push(statusBadge("SUSPECT"));
  }
  return `<div class="fuel-history-kind-badges">${badges.join("")}</div>`;
}

function buildFuelHistoryRowActions(item) {
  const sourceKind = escapeHtml(item.sourceKind);
  const sourceId = escapeHtml(String(item.sourceId));
  const buttons = [
    `<button type="button" class="ghost-button" data-fuel-history-action="details" data-source-kind="${sourceKind}" data-source-id="${sourceId}">Ver detalhes</button>`,
  ];

  if (item.status !== "CANCELLED") {
    buttons.push(
      `<button type="button" class="ghost-button" data-fuel-history-action="edit" data-source-kind="${sourceKind}" data-source-id="${sourceId}">Editar</button>`,
      `<button type="button" class="ghost-button" data-fuel-history-action="correct" data-source-kind="${sourceKind}" data-source-id="${sourceId}">Corrigir</button>`,
      `<button type="button" class="ghost-button" data-fuel-history-action="cancel" data-source-kind="${sourceKind}" data-source-id="${sourceId}">Cancelar</button>`
    );
  }

  return `<div class="fuel-history-row-actions">${buttons.join("")}</div>`;
}

function renderFuelHistoryTable() {
  if (!refs.fuelHistoryTableBody) {
    return;
  }

  const historyState = getFuelHistoryState();
  if (refs.fuelHistorySummary) {
    refs.fuelHistorySummary.textContent = historyState.isLoading
      ? "Atualizando historico operacional..."
      : buildFuelHistorySummaryText();
  }

  if (historyState.isLoading && !historyState.items.length) {
    refs.fuelHistoryTableBody.innerHTML = emptyRow("Carregando historico operacional...", 13);
    renderFuelHistoryPagination();
    renderFuelHistoryDetailPanel();
    return;
  }

  refs.fuelHistoryTableBody.innerHTML = historyState.items.length
    ? historyState.items
        .map((item) => {
          const rowClasses = [
            "fuel-history-row",
            historyState.selectedHistoryId === getFuelHistorySelectedKey(item.sourceKind, item.sourceId) ? "fuel-history-row--selected" : "",
            item.status === "CANCELLED" ? "fuel-history-row--cancelled" : "",
            item.suspicious ? "fuel-history-row--suspicious" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const vehicleSummary = [item.plate || "-", item.vehicleLabel || ""].filter(Boolean).join(" | ");
          const documentSummary = [item.document || "-", item.originLabel || ""].filter(Boolean).join(" | ");

          return `
            <tr class="${rowClasses}">
              <td>${escapeHtml(formatDateTime(item.occurredAt))}</td>
              <td>
                <div class="fuel-history-row-main">
                  <strong>${escapeHtml(formatFuelKindLabel(item.fuelKind || ""))}</strong>
                  <span class="fuel-history-row-subtitle">${escapeHtml(item.storageName || "-")}</span>
                </div>
              </td>
              <td>${buildFuelHistoryBadges(item)}</td>
              <td>
                <div class="fuel-history-row-main">
                  <strong>${escapeHtml(item.plate || "-")}</strong>
                  <span class="fuel-history-row-subtitle">${escapeHtml(item.vehicleLabel || "Sem veiculo informado")}</span>
                </div>
              </td>
              <td>${escapeHtml(item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}</td>
              <td>${escapeHtml(`${formatNumber(item.quantity || 0, 2, 2)} L`)}</td>
              <td>${escapeHtml(formatCurrency(item.unitCost || 0))}</td>
              <td>${escapeHtml(formatCurrency(item.totalCost || 0))}</td>
              <td>${escapeHtml(`${formatNumber(item.balanceBefore || 0, 2, 2)} L`)}</td>
              <td>${escapeHtml(`${formatNumber(item.balanceAfter || 0, 2, 2)} L`)}</td>
              <td>
                <div class="fuel-history-row-main">
                  <strong>${escapeHtml(item.document || "-")}</strong>
                  <span class="fuel-history-row-subtitle">${escapeHtml(item.originLabel || "-")}</span>
                </div>
              </td>
              <td>${escapeHtml(item.userName || "-")}</td>
              <td>${buildFuelHistoryRowActions(item)}</td>
            </tr>
          `;
        })
        .join("")
    : emptyRow("Nenhuma movimentacao encontrada para os filtros informados.", 13);

  renderFuelHistoryPagination();
  renderFuelHistoryDetailPanel();
  syncResponsiveTableLabels();
}

function renderFuelHistoryPagination() {
  if (!refs.fuelHistoryPagination) {
    return;
  }

  const historyState = getFuelHistoryState();
  const page = Number(historyState.pagination?.page || 1);
  const totalPages = Math.max(1, Number(historyState.pagination?.totalPages || 1));
  const total = Number(historyState.pagination?.total || 0);

  refs.fuelHistoryPagination.innerHTML = `
    <span class="muted">Pagina ${escapeHtml(String(page))} de ${escapeHtml(String(totalPages))} | ${escapeHtml(
      formatNumber(total)
    )} registro(s)</span>
    <div class="fuel-history-pagination-actions">
      <button type="button" class="ghost-button" data-fuel-history-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>Anterior</button>
      <button type="button" class="ghost-button" data-fuel-history-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>Proxima</button>
    </div>
  `;
}

function renderFuelHistoryDetailPanel() {
  if (!refs.fuelHistoryDetailPanel || !refs.fuelHistoryDetailContent || !refs.fuelHistoryDetailTitle) {
    return;
  }

  const historyState = getFuelHistoryState();
  const item = historyState.activeItem;
  if (!item) {
    refs.fuelHistoryDetailPanel.classList.add("hidden");
    refs.fuelHistoryDetailContent.innerHTML = "";
    return;
  }

  const mode = historyState.panelMode || "details";
  refs.fuelHistoryDetailPanel.classList.remove("hidden");
  refs.fuelHistoryDetailTitle.textContent =
    mode === "cancel"
      ? "Cancelar lancamento"
      : mode === "edit" || mode === "correct"
        ? "Correcao segura do lancamento"
        : "Detalhes do lancamento";

  if (historyState.isLoading) {
    refs.fuelHistoryDetailContent.innerHTML = `<div class="fuel-history-empty"><strong>Carregando dados do lancamento...</strong></div>`;
    return;
  }

  const panelActions = `
    <div class="fuel-history-panel-actions">
      <div class="fuel-history-inline-badges">${buildFuelHistoryBadges(item)}</div>
      <div class="fuel-history-row-actions">
        <button type="button" class="ghost-button" data-fuel-history-action="details" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(String(item.sourceId))}">Ver detalhes</button>
        ${
          item.status !== "CANCELLED"
            ? `
              <button type="button" class="ghost-button" data-fuel-history-action="edit" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(String(item.sourceId))}">Editar</button>
              <button type="button" class="ghost-button" data-fuel-history-action="correct" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(String(item.sourceId))}">Corrigir</button>
              <button type="button" class="ghost-button" data-fuel-history-action="cancel" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(String(item.sourceId))}">Cancelar</button>
            `
            : ""
        }
        <button type="button" class="ghost-button" data-fuel-history-action="close">Fechar</button>
      </div>
    </div>
  `;

  const detailsSection = `
    <div class="fuel-history-detail-sections">
      ${panelActions}
      <div class="fuel-history-detail-grid">
        ${buildFuelHistoryDetailCard("Data/hora", formatDateTime(item.occurredAt))}
        ${buildFuelHistoryDetailCard("Combustivel", `${formatFuelKindLabel(item.fuelKind || "")} | ${item.storageName || "-"}`)}
        ${buildFuelHistoryDetailCard("Placa / veiculo", [item.plate || "-", item.vehicleLabel || ""].filter(Boolean).join(" | "))}
        ${buildFuelHistoryDetailCard("KM", item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}
        ${buildFuelHistoryDetailCard("Documento", item.document || "-")}
        ${buildFuelHistoryDetailCard("Origem", item.originLabel || "-")}
        ${buildFuelHistoryDetailCard("Usuario", item.userName || "-")}
        ${buildFuelHistoryDetailCard("Observacao", item.notes || "-")}
      </div>
      <div class="fuel-history-impact-grid">
        ${buildFuelHistoryImpactCard("Litros", `${formatNumber(item.quantity || 0, 2, 2)} L`, item.suspicious ? "danger" : "")}
        ${buildFuelHistoryImpactCard("Valor unitario", formatCurrency(item.unitCost || 0))}
        ${buildFuelHistoryImpactCard("Valor total", formatCurrency(item.totalCost || 0))}
        ${buildFuelHistoryImpactCard("Saldo antes", `${formatNumber(item.balanceBefore || 0, 2, 2)} L`)}
        ${buildFuelHistoryImpactCard("Saldo depois", `${formatNumber(item.balanceAfter || 0, 2, 2)} L`)}
        ${buildFuelHistoryImpactCard("Status", item.status === "CANCELLED" ? "Cancelado" : item.corrected ? "Corrigido" : "Ativo")}
      </div>
      ${
        item.cancelReason
          ? `<div class="fuel-history-detail-card"><strong>Motivo do cancelamento</strong><span>${escapeHtml(item.cancelReason)}</span></div>`
          : ""
      }
      ${
        item.suspicious && Array.isArray(item.suspiciousReasons) && item.suspiciousReasons.length
          ? `<div class="fuel-history-detail-card"><strong>Motivos de suspeita</strong><span>${escapeHtml(item.suspiciousReasons.join(" | "))}</span></div>`
          : ""
      }
      ${buildFuelHistoryAuditSection(historyState.audits)}
      ${buildFuelHistoryPayloadSection(item)}
    </div>
  `;

  refs.fuelHistoryDetailContent.innerHTML =
    mode === "cancel"
      ? `${panelActions}${buildFuelHistoryCancelForm(item)}`
      : mode === "edit" || mode === "correct"
        ? `${panelActions}${buildFuelHistoryEditForm(item, mode)}`
        : detailsSection;
}

function buildFuelHistoryDetailCard(label, value) {
  return `
    <article class="fuel-history-detail-card">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value || "-")}</span>
    </article>
  `;
}

function buildFuelHistoryImpactCard(label, value, tone = "") {
  return `
    <article class="fuel-history-impact-card ${tone ? `fuel-history-impact-card--${tone}` : ""}">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value || "-")}</span>
    </article>
  `;
}

function buildFuelHistoryAuditSection(audits = []) {
  if (!audits.length) {
    return `<div class="fuel-history-empty"><strong>Sem eventos de auditoria ainda.</strong><p class="muted">As proximas correcoes e cancelamentos ficam registrados aqui.</p></div>`;
  }

  return `
    <section class="fuel-history-detail-sections">
      <div class="card-title">
        <span class="eyebrow">Auditoria</span>
        <h3>Historico de alteracoes</h3>
      </div>
      <div class="fuel-history-audit-list">
        ${audits
          .map(
            (audit) => `
              <article class="fuel-history-audit-item">
                <header>
                  <strong>${escapeHtml(audit.actionType || "EDIT")}</strong>
                  <span class="muted">${escapeHtml(`${audit.userName || "Usuario nao identificado"} | ${formatDateTime(audit.createdAt)}`)}</span>
                </header>
                <p><strong>Motivo:</strong> ${escapeHtml(audit.reason || "-")}</p>
                ${
                  audit.oldPayload || audit.newPayload
                    ? `
                      <div class="fuel-history-detail-grid">
                        ${
                          audit.oldPayload
                            ? `<article class="fuel-history-json-card"><strong>Valor antigo</strong><pre>${escapeHtml(
                                JSON.stringify(audit.oldPayload, null, 2)
                              )}</pre></article>`
                            : ""
                        }
                        ${
                          audit.newPayload
                            ? `<article class="fuel-history-json-card"><strong>Valor novo</strong><pre>${escapeHtml(
                                JSON.stringify(audit.newPayload, null, 2)
                              )}</pre></article>`
                            : ""
                        }
                      </div>
                    `
                    : ""
                }
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function buildFuelHistoryPayloadSection(item) {
  const blocks = [];
  if (item.rawPayload) {
    blocks.push(buildFuelHistoryJsonCard("Dados originais informados", item.rawPayload));
  }
  if (item.normalizedPayload) {
    blocks.push(buildFuelHistoryJsonCard("Dados normalizados salvos", item.normalizedPayload));
  }

  return blocks.length ? `<section class="fuel-history-detail-sections">${blocks.join("")}</section>` : "";
}

function buildFuelHistoryJsonCard(title, payload) {
  return `
    <article class="fuel-history-json-card">
      <strong>${escapeHtml(title)}</strong>
      <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
    </article>
  `;
}

function buildFuelHistoryEditForm(item, mode = "edit") {
  const isInventoryEntry = item.sourceKind === "INVENTORY_MOVEMENT";
  const isAdjustment = item.movementKind === "ADJUSTMENT";
  return `
    <form class="fuel-history-form" data-fuel-history-submit="edit" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(
      String(item.sourceId)
    )}">
      <p class="fuel-history-detail-hint">Toda correcao exige motivo e gera auditoria com valor antigo e novo.</p>
      <div class="form-grid">
        ${
          isInventoryEntry
            ? `
              <label>
                <span>Quantidade (L)</span>
                <input type="text" name="quantity" inputmode="decimal" value="${escapeHtml(formatDecimalInputValue(item.quantity || 0, 2))}" required />
              </label>
              <label>
                <span>Valor unitario</span>
                <input type="text" name="unitCost" inputmode="decimal" value="${escapeHtml(formatDecimalInputValue(item.unitCost || 0, 2))}" />
              </label>
              <label>
                <span>Documento</span>
                <input type="text" name="document" value="${escapeHtml(item.document || "")}" />
              </label>
              <label>
                <span>Fornecedor</span>
                <input type="text" name="supplierName" value="${escapeHtml(item.supplierName || "")}" />
              </label>
            `
            : isAdjustment
              ? `
                <label class="full-width">
                  <span>Observacao / justificativa</span>
                  <textarea name="notes" rows="4">${escapeHtml(item.notes || "")}</textarea>
                </label>
              `
              : `
                <label>
                  <span>KM</span>
                  <input type="text" name="odometerKm" inputmode="decimal" value="${escapeHtml(
                    item.odometerKm === null || item.odometerKm === undefined ? "" : formatDecimalInputValue(item.odometerKm, 0)
                  )}" />
                </label>
                <label>
                  <span>Litros</span>
                  <input type="text" name="quantity" inputmode="decimal" value="${escapeHtml(formatDecimalInputValue(item.quantity || 0, 2))}" required />
                </label>
                <label>
                  <span>Documento</span>
                  <input type="text" name="document" value="${escapeHtml(item.document || "")}" />
                </label>
                <label class="full-width">
                  <span>Observacao</span>
                  <textarea name="notes" rows="4">${escapeHtml(item.notes || "")}</textarea>
                </label>
              `
        }
        ${
          isInventoryEntry
            ? `<label class="full-width"><span>Observacao</span><textarea name="notes" rows="4">${escapeHtml(item.notes || "")}</textarea></label>`
            : ""
        }
        <label class="full-width">
          <span>Motivo obrigatorio da correcao</span>
          <textarea name="reason" rows="3" placeholder="${
            mode === "correct" ? "Explique a divergencia encontrada." : "Explique por que este lancamento esta sendo alterado."
          }" required></textarea>
        </label>
      </div>
      <div class="form-actions">
        <button type="submit" class="primary-button">Salvar correcao</button>
        <button type="button" class="ghost-button" data-fuel-history-action="details" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(
          String(item.sourceId)
        )}">Voltar</button>
      </div>
    </form>
  `;
}

function buildFuelHistoryCancelForm(item) {
  return `
    <form class="fuel-history-form" data-fuel-history-submit="cancel" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(
      String(item.sourceId)
    )}">
      <div class="fuel-history-impact-grid">
        ${buildFuelHistoryImpactCard("Saldo antes", `${formatNumber(item.balanceBefore || 0, 2, 2)} L`)}
        ${buildFuelHistoryImpactCard("Saldo depois atual", `${formatNumber(item.balanceAfter || 0, 2, 2)} L`, "danger")}
        ${buildFuelHistoryImpactCard("Litros do lancamento", `${formatNumber(item.quantity || 0, 2, 2)} L`)}
      </div>
      <label class="full-width">
        <span>Motivo obrigatorio do cancelamento</span>
        <textarea name="reason" rows="4" placeholder="Descreva por que este lancamento deve ser cancelado." required></textarea>
      </label>
      <div class="form-actions">
        <button type="submit" class="primary-button">Confirmar cancelamento</button>
        <button type="button" class="ghost-button" data-fuel-history-action="details" data-source-kind="${escapeHtml(item.sourceKind)}" data-source-id="${escapeHtml(
          String(item.sourceId)
        )}">Voltar</button>
      </div>
    </form>
  `;
}

function getPreviousFuelRecordForPlate(item) {
  if (!item?.plate) {
    return null;
  }

  return state.fuelRecords
    .filter(
      (record) =>
        normalizeClientPlateKey(record.plate || "") === normalizeClientPlateKey(item.plate || "") &&
        Number(record.id) !== Number(item.sourceId) &&
        record.odometerKm !== null &&
        record.odometerKm !== undefined &&
        String(record.occurredAt || "") < String(item.occurredAt || "")
    )
    .sort(
      (left, right) =>
        String(right.occurredAt || "").localeCompare(String(left.occurredAt || "")) || Number(right.id) - Number(left.id)
    )[0] || null;
}

function buildFuelHistoryWarnings(item, payload) {
  const warnings = [];
  if (payload.quantity !== undefined && Number.isFinite(payload.quantity) && payload.quantity > 500) {
    warnings.push("Litros muito altos. Confirme se o lancamento esta correto.");
  }
  if (payload.unitCost !== undefined && Number.isFinite(payload.unitCost) && payload.unitCost > 20) {
    warnings.push("Valor unitario acima do padrao. Confirme antes de salvar.");
  }
  if (payload.odometerKm !== undefined && payload.odometerKm !== null && Number.isFinite(payload.odometerKm)) {
    const previousRecord = getPreviousFuelRecordForPlate(item);
    if (previousRecord && payload.odometerKm < Number(previousRecord.odometerKm || 0)) {
      warnings.push(`KM menor que o abastecimento anterior da placa ${item.plate}.`);
    }
  }
  return warnings;
}

async function openFuelHistoryItem(sourceKind, sourceId, mode = "details") {
  const historyState = getFuelHistoryState();
  historyState.selectedHistoryId = getFuelHistorySelectedKey(sourceKind, sourceId);
  historyState.panelMode = mode;
  historyState.isLoading = true;
  renderFuelHistoryTable();

  const response = await api(`/api/fuel/history/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}`);
  historyState.activeItem = response.item || null;
  historyState.audits = Array.isArray(response.audits) ? response.audits : [];
  historyState.selectedHistoryId = historyState.activeItem
    ? getFuelHistorySelectedKey(historyState.activeItem.sourceKind, historyState.activeItem.sourceId)
    : historyState.selectedHistoryId;
  historyState.isLoading = false;
  renderFuelHistoryTable();
  scrollToElement(refs.fuelHistoryDetailPanel);
}

function closeFuelHistoryPanel() {
  const historyState = getFuelHistoryState();
  historyState.activeItem = null;
  historyState.audits = [];
  historyState.panelMode = "details";
  historyState.selectedHistoryId = "";
  historyState.isLoading = false;
  renderFuelHistoryTable();
}

function handleFuelHistoryActionClick(event) {
  const actionButton = event.target.closest("[data-fuel-history-action]");
  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.fuelHistoryAction;
  if (action === "close") {
    closeFuelHistoryPanel();
    return;
  }

  const sourceKind = actionButton.dataset.sourceKind;
  const sourceId = actionButton.dataset.sourceId;
  if (!sourceKind || !sourceId) {
    return;
  }

  const nextMode =
    action === "edit" ? "edit" : action === "correct" ? "correct" : action === "cancel" ? "cancel" : "details";
  openFuelHistoryItem(sourceKind, sourceId, nextMode).catch((error) => showToast(error.message, "error"));
}

function handleFuelHistoryPaginationClick(event) {
  const button = event.target.closest("[data-fuel-history-page]");
  if (!button || button.disabled) {
    return;
  }

  const nextPage = Number(button.dataset.fuelHistoryPage || 1);
  refreshFuelHistory({ page: nextPage }).catch((error) => showToast(error.message, "error"));
}

async function handleFuelHistoryDetailSubmit(event) {
  const form = event.target.closest("[data-fuel-history-submit]");
  if (!form) {
    return;
  }

  event.preventDefault();
  const historyState = getFuelHistoryState();
  const item = historyState.activeItem;
  if (!item) {
    showToast("Nenhum lancamento selecionado.", "error");
    return;
  }

  const action = form.dataset.fuelHistorySubmit;
  const sourceKind = form.dataset.sourceKind;
  const sourceId = form.dataset.sourceId;
  const reason = normalizeText(form.elements.reason?.value);
  if (!reason) {
    showToast("Informe o motivo obrigatorio da alteracao.", "error");
    return;
  }

  if (action === "cancel") {
    try {
      const response = await api(`/api/fuel/history/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}/cancel`, {
        method: "POST",
        body: { reason },
      });
      historyState.activeItem = response.item || null;
      historyState.audits = Array.isArray(response.audits) ? response.audits : [];
      historyState.panelMode = "details";
      await finalizeFuelHistoryMutation(historyState.activeItem);
      renderFuelHistoryTable();
      showToast("Lancamento cancelado com rastreabilidade preservada.");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const payload = { reason };

  try {
    if (item.sourceKind === "INVENTORY_MOVEMENT") {
      payload.quantity = readBrazilianNumberField(form.elements.quantity, {
        label: "quantidade",
        required: true,
        min: 0.000001,
      });
      payload.unitCost = readBrazilianNumberField(form.elements.unitCost, {
        label: "valor unitario",
        min: 0,
      }) ?? 0;
      payload.document = normalizeText(form.elements.document?.value);
      payload.supplierName = normalizeText(form.elements.supplierName?.value);
      payload.notes = normalizeText(form.elements.notes?.value);
    } else if (item.movementKind === "ADJUSTMENT") {
      payload.notes = normalizeText(form.elements.notes?.value);
    } else {
      payload.quantity = readBrazilianNumberField(form.elements.quantity, {
        label: "litros",
        required: true,
        min: 0.000001,
      });
      const nextOdometerKm = readBrazilianNumberField(form.elements.odometerKm, {
        label: "KM",
        min: 0,
      });
      payload.odometerKm = nextOdometerKm === null || nextOdometerKm === undefined ? "" : nextOdometerKm;
      payload.document = normalizeText(form.elements.document?.value);
      payload.notes = normalizeText(form.elements.notes?.value);
    }
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const warnings = buildFuelHistoryWarnings(item, payload);
  if (warnings.length && !window.confirm(`${warnings.join("\n")}\n\nDeseja continuar com a correcao?`)) {
    return;
  }

  try {
    const response = await api(`/api/fuel/history/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}`, {
      method: "PUT",
      body: payload,
    });
    historyState.activeItem = response.item || null;
    historyState.audits = Array.isArray(response.audits) ? response.audits : [];
    historyState.panelMode = "details";
    await finalizeFuelHistoryMutation(historyState.activeItem);
    renderFuelHistoryTable();
    showToast("Lancamento corrigido com auditoria registrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function finalizeFuelHistoryMutation(item) {
  await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

  if (
    item?.plate &&
    state.dossier?.selectedPlate &&
    normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(item.plate)
  ) {
    await loadVehicleDossierByPlate(item.plate, { silent: true });
  }
}

async function refreshFuel() {
  const query = new URLSearchParams();
  if (refs.fuelFilterStorage?.value) query.set("storageId", refs.fuelFilterStorage.value);
  if (refs.fuelFilterFrom?.value) query.set("from", toIsoDateTime(refs.fuelFilterFrom.value));
  if (refs.fuelFilterTo?.value) query.set("to", toIsoDateTime(refs.fuelFilterTo.value));

  const fuelSuffix = query.toString() ? `?${query.toString()}` : "";
  const historySuffix = buildFuelHistoryQueryString();

  const [response, historyResponse] = await Promise.all([
    api(`/api/fuel${fuelSuffix}`),
    api(`/api/fuel/history${historySuffix ? `?${historySuffix}` : ""}`),
  ]);

  state.fuelRecords = response.items || [];
  state.fuelStorages = response.storages || [];
  applyFuelHistoryResponse(historyResponse);
  renderFuel();
  renderFuelStorageOptions();
  renderFuelVehicleOptions();
  updateFuelStockProductSelect();
  updateKardexProductSelect();
  syncFuelFormState();
  renderVehicles();
}

function renderFuel() {
  const analytics = buildFuelPageAnalytics(state.fuelRecords);
  const currentPlate = refs.fuelFilterPlate?.value || "";
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.innerHTML = `<option value="">Todos os veiculos</option>${analytics.plates
      .map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`)
      .join("")}`;
    refs.fuelFilterPlate.value = analytics.plates.includes(currentPlate) ? currentPlate : "";
  }

  refs.fuelKpiGrid.innerHTML = [
    {
      label: "Abastecimentos",
      value: formatNumber(analytics.monthExitRecords.length),
      note: "Saidas no mes atual",
      icon: "fuel",
      tone: "brand",
    },
    {
      label: "Total de litros",
      value: `${formatLiters(analytics.monthLiters)} L`,
      note: "Consumo do mes atual",
      icon: "analytics",
      tone: "neutral",
    },
    {
      label: "Media por lancamento",
      value: `${formatLiters(analytics.avgLiters)} L`,
      note: "Considerando apenas saidas",
      icon: "dashboard",
      tone: "warning",
    },
    {
      label: "Media km/L",
      value: formatKmPerLiter(analytics.avgKmPerLiter),
      note: "Com base nos hodometros informados",
      icon: "efficiency",
      tone: "success",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card",
        label: item.label,
        value: item.value,
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.fuelStocksGrid.innerHTML = state.fuelStorages.length
    ? state.fuelStorages
        .map((storage) => {
          const isEmpty = Number(storage.currentBalance || 0) <= 0;
          const isLow =
            !isEmpty &&
            Number(storage.minBalance || 0) > 0 &&
            Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0);
          const statusLabel = isEmpty ? "Sem saldo" : isLow ? "Abaixo do minimo" : "Operacional";
          const toneClass = isEmpty ? "is-empty" : isLow ? "is-low" : "is-ok";

          return `
            <article class="fuel-stock-card ${toneClass}">
              <div class="fuel-stock-card__top">
                <span class="fuel-stock-card__kind">${escapeHtml(formatFuelKindLabel(storage.fuelKind))}</span>
                <span class="fuel-stock-card__status">${escapeHtml(statusLabel)}</span>
              </div>
              <div class="fuel-stock-card__value-row">
                <strong class="fuel-stock-card__value">${escapeHtml(formatLiters(storage.currentBalance))}</strong>
                <span class="fuel-stock-card__unit">L</span>
              </div>
              <div class="fuel-stock-card__footer">
                <strong>${escapeHtml(storage.name)}</strong>
                <span>Saldo disponivel agora</span>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="stack-item"><strong>Nenhum estoque configurado</strong><p class="muted">Cadastre ou revise os estoques principais de combustivel.</p></div>`;

  renderFuelHistoryTable();

  refs.fuelConsumptionChart.innerHTML = renderConsumptionChart({
    consumptionSeries: analytics.consumptionSeries,
    totalConsumptionLiters: analytics.consumptionSeries.reduce((total, item) => total + item.total, 0),
    peakConsumption: analytics.peakConsumption,
    fuelMix: analytics.fuelMix,
  });

  refs.fuelTopVehicles.innerHTML = renderMeterList(
    analytics.topVehicles.map((item) => ({
      label: item.plate,
      value: item.liters,
      count: item.count,
    })),
    {
      emptyTitle: "Sem consumo no periodo",
      emptyDescription: "Assim que houver saidas registradas, os veiculos de maior consumo aparecem aqui.",
      valueFormatter: (value) => `${formatLiters(value)} L`,
      secondaryFormatter: (item) => `${item.count} lancamento(s)`,
    }
  );

  refs.fuelSideInsights.innerHTML = buildFuelSideInsights(analytics);
  syncResponsiveTableLabels();
}

function ensureFuelUiState() {
  if (!state.fuelUi) {
    state.fuelUi = {
      composerMode: "single",
      batchRows: [],
      batchCounter: 0,
      lastBatchResult: null,
    };
  }

  if (!Array.isArray(state.fuelUi.batchRows)) {
    state.fuelUi.batchRows = [];
  }

  if (!Number.isInteger(state.fuelUi.batchCounter)) {
    state.fuelUi.batchCounter = 0;
  }

  return state.fuelUi;
}

function nextFuelBatchRowId() {
  const ui = ensureFuelUiState();
  ui.batchCounter += 1;
  return `fuel-batch-${ui.batchCounter}`;
}

function normalizeFuelDateTimeInput(value, fallback = currentLocalDateTime()) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
    return normalized.slice(0, 16);
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(normalized)) {
    return normalized.replace(" ", "T").slice(0, 16);
  }

  const brazilianMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (brazilianMatch) {
    const [, day, month, year, hour = "00", minute = "00"] = brazilianMatch;
    return `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const parsed = new Date(normalized);
  if (Number.isFinite(parsed.getTime())) {
    return toLocalDateTimeInput(parsed.toISOString()).slice(0, 16);
  }

  return fallback;
}

function createFuelBatchRow(partial = {}) {
  return {
    id: partial.id || nextFuelBatchRowId(),
    plate: String(partial.plate || "").trim().toUpperCase(),
    storageId: partial.storageId ? String(partial.storageId) : "",
    odometerKm: String(partial.odometerKm || "").trim(),
    quantity: String(partial.quantity || "").trim(),
    occurredAt: normalizeFuelDateTimeInput(partial.occurredAt, currentLocalDateTime()),
    notes: String(partial.notes || "").trim(),
  };
}

function getFuelStorageById(storageId) {
  return state.fuelStorages.find((item) => String(item.id) === String(storageId || "")) || null;
}

function getFuelStorageByKind(fuelKind) {
  const normalizedFuelKind = normalizeClientFuelKind(fuelKind, "");
  if (!normalizedFuelKind) {
    return null;
  }
  return state.fuelStorages.find((item) => normalizeClientFuelKind(item.fuelKind, "") === normalizedFuelKind) || null;
}

function resolveFuelVehicleByPlate(value) {
  const normalizedKey = normalizeClientPlateKey(value);
  if (!normalizedKey) {
    return null;
  }
  return (
    state.vehicles.find(
      (item) => item.active && normalizeClientPlateKey(item.plate) === normalizedKey
    ) || null
  );
}

function getPreferredFuelStorageForVehicle(vehicle) {
  if (!vehicle) {
    return state.fuelStorages[0] || null;
  }
  if (vehicle.supportsS10 && !vehicle.supportsS500) {
    return getFuelStorageByKind("S10") || state.fuelStorages[0] || null;
  }
  if (vehicle.supportsS500 && !vehicle.supportsS10) {
    return getFuelStorageByKind("S500") || state.fuelStorages[0] || null;
  }
  return getFuelStorageByKind(vehicle.fuelProfile) || getFuelStorageByKind("S500") || state.fuelStorages[0] || null;
}

function doesVehicleSupportStorage(vehicle, storage) {
  if (!vehicle || !storage) {
    return true;
  }
  const normalizedFuelKind = normalizeClientFuelKind(storage.fuelKind, "");
  if (normalizedFuelKind === "S10") {
    return Boolean(vehicle.supportsS10);
  }
  if (normalizedFuelKind === "S500") {
    return Boolean(vehicle.supportsS500);
  }
  return true;
}

function ensureFuelBatchRows(minimum = 1) {
  const ui = ensureFuelUiState();
  while (ui.batchRows.length < minimum) {
    ui.batchRows.push(createFuelBatchRow());
  }
  return ui.batchRows;
}

function fuelBatchRowHasContent(row) {
  return Boolean(
    String(row?.plate || "").trim() ||
      String(row?.storageId || "").trim() ||
      String(row?.odometerKm || "").trim() ||
      String(row?.quantity || "").trim() ||
      String(row?.notes || "").trim()
  );
}

function ensureTrailingFuelBatchRow() {
  const rows = ensureFuelBatchRows(1);
  const lastRow = rows[rows.length - 1];
  if (!lastRow || fuelBatchRowHasContent(lastRow)) {
    rows.push(createFuelBatchRow());
  }
  return rows;
}

function autofillFuelBatchRow(row) {
  const nextRow = createFuelBatchRow({
    ...row,
    id: row.id || nextFuelBatchRowId(),
    occurredAt: row.occurredAt || currentLocalDateTime(),
  });
  const vehicle = resolveFuelVehicleByPlate(nextRow.plate);
  const selectedStorage = getFuelStorageById(nextRow.storageId);

  if (vehicle && (!selectedStorage || !doesVehicleSupportStorage(vehicle, selectedStorage))) {
    const preferredStorage = getPreferredFuelStorageForVehicle(vehicle);
    nextRow.storageId = preferredStorage ? String(preferredStorage.id) : "";
  }

  return nextRow;
}

function setFuelComposerMode(mode) {
  const ui = ensureFuelUiState();
  ui.composerMode = mode === "batch" ? "batch" : "single";
  renderFuelComposerMode();
  if (ui.composerMode === "batch") {
    ensureTrailingFuelBatchRow();
    renderFuelBatchComposer();
    refs.fuelBatchPanel?.scrollIntoView?.({ block: "start" });
  }
}

function renderFuelComposerMode() {
  const ui = ensureFuelUiState();
  refs.fuelComposerModeButtons?.querySelectorAll("[data-fuel-composer-mode]").forEach((button) => {
    const isActive = button.dataset.fuelComposerMode === ui.composerMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (refs.fuelBatchPanel) {
    refs.fuelBatchPanel.classList.toggle("hidden", ui.composerMode !== "batch");
  }
}

function formatFuelOriginLabel(origin) {
  return origin === "BATCH" ? "Lote" : "Manual";
}

function formatFuelRecordFlowLabel(record = {}) {
  if (record.operationKind === "ADJUSTMENT") {
    return record.adjustmentKind === "INCREASE" ? "Ajuste +" : "Ajuste -";
  }
  if (record.type === "EXIT") {
    return "Operacional";
  }
  return "Entrada";
}

function calculateClientFuelBalance(balance, type, quantity) {
  const numericBalance = toClientNumber(balance);
  const numericQuantity = toClientNumber(quantity);
  const normalizedType = String(type || "").trim().toUpperCase();
  return normalizedType === "EXIT" || normalizedType === "OUT" ? numericBalance - numericQuantity : numericBalance + numericQuantity;
}

function handleFuelComposerModeClick(event) {
  const button = event.target.closest("[data-fuel-composer-mode]");
  if (!button) {
    return;
  }
  setFuelComposerMode(button.dataset.fuelComposerMode);
}

function handleFuelVehicleInputChange(options = {}) {
  if (!refs.fuelVehicleInput || !refs.fuelForm) {
    return;
  }

  const vehicle = resolveFuelVehicleByPlate(refs.fuelVehicleInput.value);
  if (refs.fuelVehicleSelect) {
    refs.fuelVehicleSelect.value = vehicle ? String(vehicle.id) : "";
  }

  if (vehicle) {
    refs.fuelVehicleInput.value = vehicle.plate;
    const currentStorage = getFuelStorageById(refs.fuelStorageSelect?.value || "");
    if (!currentStorage || !doesVehicleSupportStorage(vehicle, currentStorage)) {
      const preferredStorage = getPreferredFuelStorageForVehicle(vehicle);
      if (preferredStorage && refs.fuelStorageSelect) {
        refs.fuelStorageSelect.value = String(preferredStorage.id);
      }
    }
  }

  if (!options.silent) {
    syncFuelFormState();
  }
}

function renderFuelVehicleOptions() {
  const activeVehicles = state.vehicles
    .filter((item) => item.active)
    .slice()
    .sort((left, right) => String(left.plate || "").localeCompare(String(right.plate || "")));
  const optionsHtml = activeVehicles
    .map(
      (vehicle) =>
        `<option value="${escapeHtml(vehicle.plate)}">${escapeHtml(vehicle.displayName || [vehicle.plate, vehicle.brand, vehicle.model].filter(Boolean).join(" - "))}</option>`
    )
    .join("");

  if (refs.fuelVehicleList) {
    refs.fuelVehicleList.innerHTML = optionsHtml;
  }
  if (refs.fuelBatchPlateList) {
    refs.fuelBatchPlateList.innerHTML = optionsHtml;
  }

  handleFuelVehicleInputChange({ silent: true });
  renderFuelBatchComposer();
}

function syncFuelFormState() {
  if (!refs.fuelForm) {
    return;
  }

  const movementType = refs.fuelForm.elements.type.value || "OPERATIONAL_EXIT";
  const isStockEntry = movementType === "STOCK_ENTRY";
  const isOperationalExit = movementType === "OPERATIONAL_EXIT";
  const isAdjustment = movementType === "BALANCE_ADJUSTMENT";
  const fieldVisibility = {
    stockProduct: isStockEntry,
    storage: !isStockEntry,
    plate: isOperationalExit,
    odometer: isOperationalExit,
    quantity: true,
    unitCost: isStockEntry,
    document: isStockEntry,
    supplier: isStockEntry,
    adjustmentType: isAdjustment,
    occurredAt: true,
    notes: true,
  };

  refs.fuelForm.querySelectorAll("[data-fuel-field]").forEach((field) => {
    const fieldKey = field.dataset.fuelField;
    const isVisible = Boolean(fieldVisibility[fieldKey]);
    field.classList.toggle("hidden", !isVisible);
    field.querySelectorAll("input, select, textarea").forEach((input) => {
      if (input.name === "quantity" || input.name === "occurredAt" || input.name === "notes") {
        input.disabled = false;
        return;
      }
      input.disabled = !isVisible;
    });
  });

  if (refs.fuelVehicleInput) {
    refs.fuelVehicleInput.required = isOperationalExit;
    if (!isOperationalExit) {
      refs.fuelVehicleInput.value = "";
    }
  }
  if (refs.fuelVehicleSelect) {
    refs.fuelVehicleSelect.value = isOperationalExit ? refs.fuelVehicleSelect.value : "";
  }

  refs.fuelForm.elements.quantity.required = true;
  refs.fuelForm.elements.occurredAt.required = true;
  refs.fuelForm.elements.productId.required = isStockEntry;
  refs.fuelForm.elements.storageId.required = !isStockEntry;
  refs.fuelForm.elements.adjustmentType.required = isAdjustment;
  refs.fuelForm.elements.notes.required = isAdjustment;

  if (!isOperationalExit) {
    refs.fuelForm.elements.odometerKm.value = "";
  }

  if (isStockEntry) {
    refs.fuelNotesLabel.textContent = "Observacao";
    refs.fuelForm.elements.notes.placeholder = "Observacoes da entrada no estoque";
    refs.fuelContextHint.textContent = "Entrada no estoque atualiza o Kardex de combustivel, custo unitario e saldo do tanque vinculado.";
  } else if (isAdjustment) {
    refs.fuelNotesLabel.textContent = "Justificativa";
    refs.fuelForm.elements.notes.placeholder = "Explique o motivo do ajuste de saldo";
    refs.fuelContextHint.textContent = "Use ajuste apenas para acertos manuais. O sistema registra o tipo de ajuste e a trilha bruta/normalizada.";
  } else {
    refs.fuelNotesLabel.textContent = "Observacao";
    refs.fuelForm.elements.notes.placeholder = "Observacoes do abastecimento";
    refs.fuelContextHint.textContent = "Placa com autocomplete, combustivel sugerido automaticamente e alerta preventivo para litros fora do padrao.";
    handleFuelVehicleInputChange({ silent: true });
  }

  renderFuelComposerMode();
}

function resetFuelForm() {
  if (!refs.fuelForm) {
    return;
  }

  refs.fuelForm.reset();
  refs.fuelForm.elements.type.value = "OPERATIONAL_EXIT";
  refs.fuelForm.elements.occurredAt.value = currentLocalDateTime();
  if (refs.fuelVehicleSelect) {
    refs.fuelVehicleSelect.value = "";
  }
  if (refs.fuelVehicleInput) {
    refs.fuelVehicleInput.value = "";
  }
  syncFuelFormState();
}

function normalizeFuelBatchHeader(cells = []) {
  const headerMap = {};
  cells.forEach((cell, index) => {
    const key = normalizeKey(cell);
    if (key.includes("placa")) {
      headerMap.plate = index;
    } else if (key === "km" || key.includes("hodomet") || key.includes("odomet")) {
      headerMap.odometerKm = index;
    } else if (key.includes("litro") || key.includes("quantidade") || key === "qtd") {
      headerMap.quantity = index;
    } else if (key.includes("combust")) {
      headerMap.fuelKind = index;
    } else if (key.includes("data") || key.includes("hora")) {
      headerMap.occurredAt = index;
    } else if (key.includes("obs")) {
      headerMap.notes = index;
    }
  });

  return headerMap.plate !== undefined && headerMap.quantity !== undefined ? headerMap : null;
}

function looksLikeFuelCell(value) {
  return Boolean(normalizeClientFuelKind(value, "")) || /diesel|gasolina|etanol|s-?10|s-?500/i.test(String(value || ""));
}

function inferFuelBatchColumnMap(cells = []) {
  if (cells.length <= 4) {
    return { plate: 0, odometerKm: 1, quantity: 2, notes: 3 };
  }

  if (cells.length === 5) {
    if (looksLikeFuelCell(cells[1])) {
      return { plate: 0, fuelKind: 1, odometerKm: 2, quantity: 3, notes: 4 };
    }
    return { plate: 0, odometerKm: 1, quantity: 2, occurredAt: 3, notes: 4 };
  }

  return { plate: 0, fuelKind: 1, odometerKm: 2, quantity: 3, occurredAt: 4, notes: 5 };
}

function parseFuelBatchClipboard(text) {
  const rawLines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim());

  if (!rawLines.length) {
    return [];
  }

  const matrix = rawLines.map((line) => line.split("\t").map((cell) => cell.trim()));
  const headerMap = normalizeFuelBatchHeader(matrix[0]);
  const columnMap = headerMap || inferFuelBatchColumnMap(matrix[0]);
  const dataRows = headerMap ? matrix.slice(1) : matrix;

  return dataRows
    .map((cells) => {
      const partial = {
        plate: cells[columnMap.plate] || "",
        odometerKm: cells[columnMap.odometerKm] || "",
        quantity: cells[columnMap.quantity] || "",
        occurredAt: normalizeFuelDateTimeInput(cells[columnMap.occurredAt] || "", currentLocalDateTime()),
        notes: cells[columnMap.notes] || "",
      };
      const storage = getFuelStorageByKind(cells[columnMap.fuelKind] || "");
      if (storage) {
        partial.storageId = String(storage.id);
      } else {
        const vehicle = resolveFuelVehicleByPlate(partial.plate);
        const preferredStorage = getPreferredFuelStorageForVehicle(vehicle);
        partial.storageId = preferredStorage ? String(preferredStorage.id) : "";
      }
      return partial;
    })
    .filter((row) => fuelBatchRowHasContent(row));
}

function mergeFuelBatchRows(startIndex, incomingRows = []) {
  const ui = ensureFuelUiState();
  ensureFuelBatchRows(Math.max(1, startIndex + incomingRows.length));

  incomingRows.forEach((incomingRow, offset) => {
    const index = startIndex + offset;
    const currentRow = ui.batchRows[index] || createFuelBatchRow();
    ui.batchRows[index] = autofillFuelBatchRow({
      ...currentRow,
      ...incomingRow,
      id: currentRow.id,
    });
  });

  ensureTrailingFuelBatchRow();
  renderFuelBatchComposer();
}

function addFuelBatchRow(partial = {}, focusField = "plate") {
  const ui = ensureFuelUiState();
  const lastRow = ensureFuelBatchRows(1)[ensureFuelBatchRows(1).length - 1];
  if (!fuelBatchRowHasContent(partial) && lastRow && !fuelBatchRowHasContent(lastRow)) {
    requestAnimationFrame(() => {
      const target = refs.fuelBatchRowsBody?.querySelector(
        `[data-fuel-batch-row-id="${lastRow.id}"] [data-fuel-batch-field="${focusField}"]`
      );
      target?.focus?.();
    });
    return;
  }

  const newRow = autofillFuelBatchRow(createFuelBatchRow(partial));
  ui.batchRows.push(newRow);
  ensureTrailingFuelBatchRow();
  renderFuelBatchComposer();
  requestAnimationFrame(() => {
    const target = refs.fuelBatchRowsBody?.querySelector(
      `[data-fuel-batch-row-id="${newRow.id}"] [data-fuel-batch-field="${focusField}"]`
    );
    target?.focus?.();
  });
}

function resetFuelBatchComposer(clearResult = false) {
  const ui = ensureFuelUiState();
  ui.batchRows = [createFuelBatchRow()];
  if (clearResult) {
    ui.lastBatchResult = null;
  }
  renderFuelBatchComposer();
}

function getFuelBatchValidation() {
  const rows = ensureTrailingFuelBatchRow();
  const reservedBalances = new Map(
    state.fuelStorages.map((storage) => [String(storage.id), toClientNumber(storage.currentBalance || 0)])
  );

  let totalLiters = 0;
  let validRows = 0;
  let warningRows = 0;
  let errorRows = 0;

  const evaluatedRows = rows.map((sourceRow, index) => {
    const row = autofillFuelBatchRow(sourceRow);
    const vehicle = resolveFuelVehicleByPlate(row.plate);
    const storage = getFuelStorageById(row.storageId);
    const quantityText = String(row.quantity || "").trim();
    const odometerText = String(row.odometerKm || "").trim();
    const hasContent = fuelBatchRowHasContent(row);
    const quantity = quantityText ? parseBrazilianNumber(quantityText) : null;
    const odometerKm = odometerText ? parseBrazilianNumber(odometerText) : null;
    const occurredAt = row.occurredAt ? toIsoDateTime(row.occurredAt) : "";
    const errors = [];
    const warnings = [];

    if (hasContent) {
      if (!String(row.plate || "").trim()) {
        errors.push("Informe a placa.");
      }
      if (!vehicle) {
        errors.push("Placa nao cadastrada.");
      }
      if (!storage) {
        errors.push("Selecione o combustivel.");
      }
      if (storage && vehicle && !doesVehicleSupportStorage(vehicle, storage)) {
        errors.push("Combustivel incompativel com o veiculo.");
      }
      if (!quantityText || !Number.isFinite(quantity) || quantity <= 0) {
        errors.push("Litros invalidos.");
      }
      if (odometerText && (!Number.isFinite(odometerKm) || odometerKm < 0)) {
        errors.push("KM invalido.");
      }
      if (!row.occurredAt || !occurredAt) {
        errors.push("Data/hora invalida.");
      }
      if (Number.isFinite(quantity) && quantity > 500) {
        warnings.push("Litros acima de 500 L.");
      }
    }

    let projectedBalance = storage ? toClientNumber(storage.currentBalance || 0) : 0;
    if (hasContent && !errors.length && storage && Number.isFinite(quantity)) {
      const currentReservedBalance = toClientNumber(reservedBalances.get(String(storage.id)) || 0);
      projectedBalance = calculateClientFuelBalance(currentReservedBalance, "EXIT", quantity);
      if (projectedBalance < -0.0001) {
        errors.push(`Saldo insuficiente em ${storage.name}.`);
        projectedBalance = currentReservedBalance;
      } else {
        reservedBalances.set(String(storage.id), Number(projectedBalance.toFixed(3)));
        totalLiters += quantity;
      }
    }

    const status = !hasContent ? "draft" : errors.length ? "error" : warnings.length ? "warning" : "valid";
    if (status === "error") {
      errorRows += 1;
    } else if (status === "warning") {
      warningRows += 1;
      validRows += 1;
    } else if (status === "valid") {
      validRows += 1;
    }

    return {
      index,
      sourceRow: row,
      vehicle,
      storage,
      quantity,
      odometerKm,
      occurredAt,
      errors,
      warnings,
      status,
      isSubmittable: status === "valid" || status === "warning",
      projectedBalance,
    };
  });

  const projectedBalances = state.fuelStorages.map((storage) => {
    const currentBalance = toClientNumber(storage.currentBalance || 0);
    const nextBalance = toClientNumber(reservedBalances.get(String(storage.id)) ?? currentBalance);
    return {
      storageId: String(storage.id),
      storageName: storage.name,
      fuelKind: storage.fuelKind,
      currentBalance,
      nextBalance,
      deltaLiters: Number((currentBalance - nextBalance).toFixed(3)),
    };
  });

  return {
    rows: evaluatedRows,
    totalRows: evaluatedRows.filter((item) => fuelBatchRowHasContent(item.sourceRow)).length,
    validRows,
    warningRows,
    errorRows,
    totalLiters,
    projectedBalances,
  };
}

function renderFuelBatchPreview(validation = getFuelBatchValidation()) {
  if (!refs.fuelBatchPreview) {
    return;
  }

  refs.fuelBatchPreview.innerHTML = `
    <div class="fuel-batch-preview-grid">
      ${validation.projectedBalances
        .map(
          (item) => `
            <article class="fuel-batch-preview-card">
              <span class="eyebrow">${escapeHtml(formatFuelKindLabel(item.fuelKind))}</span>
              <strong>${escapeHtml(formatLiters(item.nextBalance))} L</strong>
              <span class="muted">Saldo atual: ${escapeHtml(formatLiters(item.currentBalance))} L</span>
              <span class="muted">Saldo final previsto: ${escapeHtml(formatLiters(item.nextBalance))} L</span>
            </article>
          `
        )
        .join("")}
      <article class="fuel-batch-preview-card fuel-batch-preview-card--total">
        <span class="eyebrow">Total do lote</span>
        <strong>${escapeHtml(formatLiters(validation.totalLiters))} L</strong>
        <span class="muted">${escapeHtml(`${formatNumber(validation.validRows)} linha(s) pronta(s) para envio`)}</span>
      </article>
    </div>
  `;
}

function renderFuelBatchSummary(validation = getFuelBatchValidation()) {
  if (!refs.fuelBatchSummary) {
    return;
  }

  const ui = ensureFuelUiState();
  const lastResult = ui.lastBatchResult;
  const runtimeSummary = [
    `${formatNumber(validation.validRows)} linha(s) validas`,
    `${formatNumber(validation.errorRows)} com erro`,
    `${formatNumber(validation.warningRows)} com alerta`,
    `${formatLiters(validation.totalLiters)} L previstos`,
  ].join(" | ");

  const lastSaveSummary = lastResult
    ? `Ultimo envio: ${formatNumber(lastResult.savedRows || 0)} salvo(s), ${formatNumber(lastResult.errorRows || 0)} com erro.`
    : "Cole do Excel ou digite linha por linha para validar antes de salvar.";

  refs.fuelBatchSummary.innerHTML = `<strong>${escapeHtml(runtimeSummary)}</strong><br />${escapeHtml(lastSaveSummary)}`;
}

function buildFuelBatchStorageOptions(selectedValue = "") {
  const currentValue = String(selectedValue || "");
  return `<option value="">Selecione</option>${state.fuelStorages
    .map(
      (storage) => `
        <option value="${storage.id}" ${String(storage.id) === currentValue ? "selected" : ""}>
          ${escapeHtml(`${formatFuelKindLabel(storage.fuelKind)} | ${storage.name}`)}
        </option>
      `
    )
    .join("")}`;
}

function renderFuelBatchComposer() {
  if (!refs.fuelBatchRowsBody) {
    return;
  }

  const activeElement = document.activeElement;
  const activeField = activeElement?.dataset?.fuelBatchField || "";
  const activeRowId = activeElement?.closest?.("[data-fuel-batch-row-id]")?.dataset?.fuelBatchRowId || "";
  const validation = getFuelBatchValidation();
  refs.fuelBatchRowsBody.innerHTML = validation.rows.length
    ? validation.rows
        .map((row) => {
          const statusTone =
            row.status === "error" ? "status-red" : row.status === "warning" ? "status-yellow" : row.status === "valid" ? "status-green" : "status-gray";
          const statusLabel =
            row.status === "error"
              ? row.errors.join(" | ")
              : row.status === "warning"
                ? row.warnings.join(" | ")
                : row.status === "valid"
                  ? "Linha pronta para salvar."
                  : "Aguardando dados.";

          return `
            <tr class="fuel-batch-row fuel-batch-row--${row.status}" data-fuel-batch-row-id="${row.sourceRow.id}">
              <td>
                <input type="text" list="fuel-batch-plate-list" data-fuel-batch-field="plate" value="${escapeHtml(row.sourceRow.plate)}" placeholder="ABC1D23" />
              </td>
              <td>
                <select data-fuel-batch-field="storageId">
                  ${buildFuelBatchStorageOptions(row.sourceRow.storageId)}
                </select>
              </td>
              <td>
                <input type="text" inputmode="decimal" data-fuel-batch-field="odometerKm" value="${escapeHtml(row.sourceRow.odometerKm)}" placeholder="0" />
              </td>
              <td>
                <input type="text" inputmode="decimal" data-fuel-batch-field="quantity" value="${escapeHtml(row.sourceRow.quantity)}" placeholder="0,00" />
              </td>
              <td>
                <input type="datetime-local" data-fuel-batch-field="occurredAt" value="${escapeHtml(row.sourceRow.occurredAt)}" />
              </td>
              <td>
                <input type="text" data-fuel-batch-field="notes" value="${escapeHtml(row.sourceRow.notes)}" placeholder="Opcional" />
              </td>
              <td>
                <span class="status-badge ${statusTone}">${escapeHtml(row.status === "draft" ? "Rascunho" : row.status === "valid" ? "Valida" : row.status === "warning" ? "Alerta" : "Erro")}</span>
                <div class="muted fuel-batch-status-text">${escapeHtml(statusLabel)}</div>
              </td>
              <td>
                <button type="button" class="row-button" data-action="remove-fuel-batch-row" data-row-id="${row.sourceRow.id}" aria-label="Remover linha">
                  Remover
                </button>
              </td>
            </tr>
          `;
        })
        .join("")
    : "";

  renderFuelBatchPreview(validation);
  renderFuelBatchSummary(validation);
  syncResponsiveTableLabels(refs.fuelBatchTableWrapper || document);

  if (activeField && activeRowId) {
    requestAnimationFrame(() => {
      const target = refs.fuelBatchRowsBody?.querySelector(
        `[data-fuel-batch-row-id="${activeRowId}"] [data-fuel-batch-field="${activeField}"]`
      );
      target?.focus?.();
    });
  }
}

function updateFuelBatchRow(rowId, patch = {}) {
  const ui = ensureFuelUiState();
  ui.batchRows = ensureFuelBatchRows(1).map((row) =>
    row.id === rowId
      ? autofillFuelBatchRow({
          ...row,
          ...patch,
          occurredAt:
            patch.occurredAt === undefined
              ? row.occurredAt
              : normalizeFuelDateTimeInput(patch.occurredAt, row.occurredAt || currentLocalDateTime()),
        })
      : row
  );
  ensureTrailingFuelBatchRow();
  renderFuelBatchComposer();
}

function handleFuelBatchRowInput(event) {
  const field = event.target?.dataset?.fuelBatchField;
  const rowId = event.target?.closest("[data-fuel-batch-row-id]")?.dataset?.fuelBatchRowId;
  if (!field || !rowId) {
    return;
  }

  updateFuelBatchRow(rowId, { [field]: event.target.value });
}

function handleFuelBatchRowKeydown(event) {
  const field = event.target?.dataset?.fuelBatchField;
  const rowId = event.target?.closest("[data-fuel-batch-row-id]")?.dataset?.fuelBatchRowId;
  if (event.key !== "Enter" || !field || !rowId) {
    return;
  }

  event.preventDefault();
  const rows = ensureFuelBatchRows(1);
  const currentIndex = rows.findIndex((row) => row.id === rowId);
  if (currentIndex === -1) {
    return;
  }

  if (currentIndex >= rows.length - 1) {
    addFuelBatchRow({}, "plate");
    return;
  }

  const nextRow = rows[currentIndex + 1];
  requestAnimationFrame(() => {
    const target = refs.fuelBatchRowsBody?.querySelector(
      `[data-fuel-batch-row-id="${nextRow.id}"] [data-fuel-batch-field="plate"]`
    );
    target?.focus?.();
  });
}

function handleFuelBatchRowClick(event) {
  const button = event.target.closest('[data-action="remove-fuel-batch-row"]');
  if (!button) {
    return;
  }

  const rowId = button.dataset.rowId;
  const ui = ensureFuelUiState();
  ui.batchRows = ensureFuelBatchRows(1).filter((row) => row.id !== rowId);
  if (!ui.batchRows.length) {
    ui.batchRows = [createFuelBatchRow()];
  }
  ensureTrailingFuelBatchRow();
  renderFuelBatchComposer();
}

function handleFuelBatchPaste(event) {
  const clipboardText = event.clipboardData?.getData("text/plain") || "";
  if (!clipboardText || (!clipboardText.includes("\t") && !clipboardText.includes("\n"))) {
    return;
  }

  const parsedRows = parseFuelBatchClipboard(clipboardText);
  if (!parsedRows.length) {
    return;
  }

  event.preventDefault();
  const targetRowId = event.target.closest("[data-fuel-batch-row-id]")?.dataset?.fuelBatchRowId;
  const rows = ensureFuelBatchRows(1);
  const startIndex = targetRowId ? Math.max(rows.findIndex((row) => row.id === targetRowId), 0) : 0;
  mergeFuelBatchRows(startIndex, parsedRows);
  showToast(`${formatNumber(parsedRows.length)} linha(s) inserida(s) no lote.`);
}

function buildFuelBatchPayload(validation = getFuelBatchValidation()) {
  return validation.rows
    .filter((row) => row.isSubmittable)
    .map((row) => ({
      clientRowIndex: row.index,
      plate: row.vehicle?.plate || row.sourceRow.plate,
      vehicleId: row.vehicle?.id || "",
      storageId: row.storage?.id || row.sourceRow.storageId,
      fuelKind: row.storage?.fuelKind || "",
      km: row.sourceRow.odometerKm,
      liters: row.sourceRow.quantity,
      occurredAt: row.occurredAt,
      notes: row.sourceRow.notes,
    }));
}

async function handleFuelBatchSubmit() {
  const validation = getFuelBatchValidation();
  const validRows = validation.rows.filter((row) => row.isSubmittable);
  if (!validRows.length) {
    showToast("Nenhuma linha valida para salvar no lote.", "error");
    return;
  }

  const warnings = Array.from(
    new Set(
      validRows.flatMap((row) =>
        row.warnings.map((warning) => `${row.vehicle?.plate || row.sourceRow.plate || "Sem placa"}: ${warning}`)
      )
    )
  );
  if (!confirmSuspiciousFuelValues(warnings)) {
    return;
  }

  const payload = { rows: buildFuelBatchPayload(validation) };
  const ui = ensureFuelUiState();

  try {
    const response = await api("/api/fuel/batch", { method: "POST", body: payload });
    ui.lastBatchResult = response;

    const resultMap = new Map((response.results || []).map((item) => [Number(item.lineIndex), item]));
    const remainingRows = validation.rows
      .filter((row) => {
        const result = resultMap.get(Number(row.index));
        return !result || result.status !== "saved";
      })
      .map((row) => createFuelBatchRow({ ...row.sourceRow, id: row.sourceRow.id }));

    ui.batchRows = remainingRows.length ? remainingRows : [createFuelBatchRow()];
    ensureTrailingFuelBatchRow();

    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    const savedPlate = validRows.find(
      (row) =>
        row.vehicle &&
        state.dossier.selectedPlate &&
        normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(row.vehicle.plate)
    );
    if (savedPlate?.vehicle?.plate) {
      await loadVehicleDossierByPlate(savedPlate.vehicle.plate, { silent: true });
    }

    renderFuelBatchComposer();
    showToast(
      `${formatNumber(response.savedRows || 0)} lancamento(s) salvo(s)` +
        ((response.errorRows || 0) > 0 ? `, ${formatNumber(response.errorRows || 0)} com erro.` : ".")
    );
  } catch (error) {
    showToast(error.message, "error");
  }
}

function renderFuel() {
  const analytics = buildFuelPageAnalytics(state.fuelRecords);
  const currentPlate = refs.fuelFilterPlate?.value || "";
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.innerHTML = `<option value="">Todos os veiculos</option>${analytics.plates
      .map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`)
      .join("")}`;
    refs.fuelFilterPlate.value = analytics.plates.includes(currentPlate) ? currentPlate : "";
  }

  const visibleRecords =
    refs.fuelFilterPlate?.value
      ? state.fuelRecords.filter((item) => item.plate === refs.fuelFilterPlate.value)
      : state.fuelRecords;

  refs.fuelKpiGrid.innerHTML = [
    {
      label: "Abastecimentos",
      value: formatNumber(analytics.monthExitRecords.length),
      note: "Saidas no mes atual",
      icon: "fuel",
      tone: "brand",
    },
    {
      label: "Total de litros",
      value: `${formatLiters(analytics.monthLiters)} L`,
      note: "Consumo do mes atual",
      icon: "analytics",
      tone: "neutral",
    },
    {
      label: "Media por lancamento",
      value: `${formatLiters(analytics.avgLiters)} L`,
      note: "Considerando apenas saidas",
      icon: "dashboard",
      tone: "warning",
    },
    {
      label: "Media km/L",
      value: formatKmPerLiter(analytics.avgKmPerLiter),
      note: "Com base nos hodometros informados",
      icon: "efficiency",
      tone: "success",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card",
        label: item.label,
        value: item.value,
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.fuelStocksGrid.innerHTML = state.fuelStorages.length
    ? state.fuelStorages
        .map((storage) => {
          const isEmpty = Number(storage.currentBalance || 0) <= 0;
          const isLow =
            !isEmpty &&
            Number(storage.minBalance || 0) > 0 &&
            Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0);
          const statusLabel = isEmpty ? "Sem saldo" : isLow ? "Abaixo do minimo" : "Operacional";
          const toneClass = isEmpty ? "is-empty" : isLow ? "is-low" : "is-ok";

          return `
            <article class="fuel-stock-card ${toneClass}">
              <div class="fuel-stock-card__top">
                <span class="fuel-stock-card__kind">${escapeHtml(formatFuelKindLabel(storage.fuelKind))}</span>
                <span class="fuel-stock-card__status">${escapeHtml(statusLabel)}</span>
              </div>
              <div class="fuel-stock-card__value-row">
                <strong class="fuel-stock-card__value">${escapeHtml(formatLiters(storage.currentBalance))}</strong>
                <span class="fuel-stock-card__unit">L</span>
              </div>
              <div class="fuel-stock-card__footer">
                <strong>${escapeHtml(storage.name)}</strong>
                <span>Saldo disponivel agora</span>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="stack-item"><strong>Nenhum estoque configurado</strong><p class="muted">Cadastre ou revise os estoques principais de combustivel.</p></div>`;

  renderFuelInventoryMovements();
  renderFuelComposerMode();
  syncFuelFormState();
  renderFuelBatchComposer();

  refs.fuelTableBody.innerHTML = visibleRecords.length
    ? visibleRecords
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.storageName || "-")}</td>
              <td>${escapeHtml(formatFuelKindLabel(item.fuelKind))}</td>
              <td>
                ${statusBadge(item.type)}
                <div class="fuel-record-badges">
                  <span class="dashboard-chip">${escapeHtml(formatFuelRecordFlowLabel(item))}</span>
                  <span class="dashboard-chip">${escapeHtml(formatFuelOriginLabel(item.entryOrigin))}</span>
                  ${item.suspicious ? `<span class="status-badge status-yellow">Suspeito</span>` : ""}
                </div>
              </td>
              <td>${escapeHtml(item.vehicleId ? [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(" / ") || "Veiculo cadastrado" : item.operationKind === "ADJUSTMENT" ? "Ajuste manual" : "-")}</td>
              <td>${escapeHtml(item.plate || "-")}</td>
              <td>${escapeHtml(formatNumber(item.quantity || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}</td>
              <td>${escapeHtml(formatNumber(item.balanceBefore || 0, 2, 2))} L</td>
              <td>${escapeHtml(formatNumber(item.balanceAfter || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.userName || "-")}</td>
              <td>
                <div>${escapeHtml(formatDateTime(item.occurredAt))}</div>
                ${item.suspicious ? `<div class="muted">${escapeHtml(item.suspiciousReasons.join(" | "))}</div>` : ""}
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum abastecimento registrado.", 11);

  refs.fuelConsumptionChart.innerHTML = renderConsumptionChart({
    consumptionSeries: analytics.consumptionSeries,
    totalConsumptionLiters: analytics.consumptionSeries.reduce((total, item) => total + item.total, 0),
    peakConsumption: analytics.peakConsumption,
    fuelMix: analytics.fuelMix,
  });

  refs.fuelTopVehicles.innerHTML = renderMeterList(
    analytics.topVehicles.map((item) => ({
      label: item.plate,
      value: item.liters,
      count: item.count,
    })),
    {
      emptyTitle: "Sem consumo no periodo",
      emptyDescription: "Assim que houver saidas registradas, os veiculos de maior consumo aparecem aqui.",
      valueFormatter: (value) => `${formatLiters(value)} L`,
      secondaryFormatter: (item) => `${item.count} lancamento(s)`,
    }
  );

  refs.fuelSideInsights.innerHTML = buildFuelSideInsights(analytics);
  syncResponsiveTableLabels();
}

async function handleFuelSubmit(event) {
  event.preventDefault();
  if (!refs.fuelForm) {
    return;
  }

  const movementType = refs.fuelForm.elements.type.value || "OPERATIONAL_EXIT";
  const occurredAt = toIsoDateTime(refs.fuelForm.elements.occurredAt.value);

  if (!occurredAt) {
    showToast("Informe uma data e hora valida.", "error");
    return;
  }

  let quantity = 0;
  let unitCost = null;
  let odometerKm = null;

  try {
    quantity = readBrazilianNumberField(refs.fuelForm.elements.quantity, {
      label: "quantidade",
      required: true,
      min: 0.000001,
    });

    if (movementType === "STOCK_ENTRY") {
      unitCost = readBrazilianNumberField(refs.fuelForm.elements.unitCost, {
        label: "valor unitario",
        min: 0,
      });
    }

    if (movementType === "OPERATIONAL_EXIT" && String(refs.fuelForm.elements.odometerKm.value || "").trim()) {
      odometerKm = readBrazilianNumberField(refs.fuelForm.elements.odometerKm, {
        label: "KM",
        min: 0,
      });
    }
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const warnings = [];
  if (quantity > 500) {
    warnings.push("Valor de litros muito alto. Confirme se o lancamento esta correto.");
  }
  if (unitCost !== null && unitCost > 20) {
    warnings.push("Valor unitario acima de R$ 20,00. Confirme se o lancamento esta correto.");
  }
  if (!confirmSuspiciousFuelValues(warnings)) {
    return;
  }

  if (movementType === "STOCK_ENTRY") {
    if (!refs.fuelForm.elements.productId.value) {
      showToast("Selecione o combustivel da entrada no estoque.", "error");
      return;
    }

    const payload = {
      productId: refs.fuelForm.elements.productId.value,
      stockType: "FUEL",
      type: "IN",
      quantity,
      unitCost,
      document: refs.fuelForm.elements.document.value,
      supplierName: refs.fuelForm.elements.supplierName.value,
      occurredAt,
      notes: refs.fuelForm.elements.notes.value,
    };

    try {
      await api("/api/inventory/movements", { method: "POST", body: payload });
      resetFuelForm();
      await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshFuel(), refreshDashboard()]);
      showToast("Entrada de combustivel registrada.");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const selectedVehicle = resolveFuelVehicleByPlate(refs.fuelVehicleInput?.value || "");
  if (movementType === "OPERATIONAL_EXIT" && !selectedVehicle) {
    showToast("Selecione uma placa cadastrada para o abastecimento.", "error");
    return;
  }

  const isAdjustment = movementType === "BALANCE_ADJUSTMENT";
  const storageId = refs.fuelForm.elements.storageId.value;
  if (!storageId) {
    showToast("Selecione o combustivel da movimentacao.", "error");
    return;
  }
  const adjustmentKind = refs.fuelForm.elements.adjustmentType.value || "DECREASE";
  const payload = isAdjustment
    ? {
        storageId,
        type: adjustmentKind === "INCREASE" ? "ENTRY" : "EXIT",
        operationKind: "ADJUSTMENT",
        adjustmentKind,
        quantity,
        occurredAt,
        notes: refs.fuelForm.elements.notes.value,
        entryOrigin: "MANUAL",
      }
    : {
        storageId,
        type: "EXIT",
        operationKind: "OPERATIONAL",
        vehicleId: selectedVehicle ? selectedVehicle.id : "",
        plate: selectedVehicle ? selectedVehicle.plate : refs.fuelVehicleInput.value,
        quantity,
        odometerKm,
        occurredAt,
        notes: refs.fuelForm.elements.notes.value,
        entryOrigin: "MANUAL",
      };

  payload.rawPayload = {
    plate: refs.fuelVehicleInput?.value || "",
    storageId,
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    unitCost: refs.fuelForm.elements.unitCost.value,
    type: movementType,
    occurredAt,
    notes: refs.fuelForm.elements.notes.value,
  };

  payload.normalizedPayload = {
    storageId,
    vehicleId: selectedVehicle ? selectedVehicle.id : null,
    plate: selectedVehicle ? selectedVehicle.plate : "",
    quantity,
    odometerKm,
    type: payload.type,
    operationKind: payload.operationKind,
    adjustmentKind: payload.adjustmentKind || "",
    occurredAt,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    if (
      selectedVehicle &&
      state.dossier.selectedPlate &&
      normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(selectedVehicle.plate)
    ) {
      await loadVehicleDossierByPlate(selectedVehicle.plate, { silent: true });
    }

    showToast(isAdjustment ? "Ajuste de saldo registrado." : "Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function formatNoteSourceLabel(source) {
  const normalized = String(source || "").trim().toUpperCase();
  if (normalized === "PLANILHA" || normalized === "SPREADSHEET") {
    return "PLANILHA";
  }
  if (normalized === "XML") {
    return "XML";
  }
  if (normalized === "SISTEC") {
    return "SISTEC";
  }
  return normalized || "MANUAL";
}

function getNoteWorkflowMeta(note) {
  if (note.archivedAt) {
    return {
      label: "Baixada",
      className: "status-green",
      detail: `Arquivada em ${formatDateTime(note.archivedAt)}`,
    };
  }

  if (!note.sentToFinanceAt) {
    return {
      label: "Ativa",
      className: "status-gray",
      detail: "Aguardando envio ao financeiro",
    };
  }

  const sentAt = Date.parse(note.sentToFinanceAt);
  if (!Number.isFinite(sentAt)) {
    return {
      label: "Financeiro",
      className: "status-yellow",
      detail: "Data de envio em revisao",
    };
  }

  const deadline = sentAt + 14 * 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));

  if (daysRemaining < 0) {
    return {
      label: "Vencido",
      className: "status-red",
      detail: `Enviado em ${formatDateTime(note.sentToFinanceAt)}`,
    };
  }

  if (daysRemaining === 0) {
    return {
      label: "Vence hoje",
      className: "status-red",
      detail: `Enviado em ${formatDateTime(note.sentToFinanceAt)}`,
    };
  }

  return {
    label: `${daysRemaining} dia(s) restantes`,
    className: daysRemaining > 7 ? "status-green" : daysRemaining >= 3 ? "status-yellow" : "status-red",
    detail: `Enviado em ${formatDateTime(note.sentToFinanceAt)}`,
  };
}

function renderNotesSummary() {
  if (!refs.notesSummaryCards) {
    return;
  }

  const activeCount = state.notes.filter((item) => !item.sentToFinanceAt && !item.archivedAt).length;
  const financeCount = state.notes.filter((item) => item.sentToFinanceAt && !item.archivedAt).length;
  const archivedCount = state.notes.filter((item) => item.archivedAt).length;

  refs.notesSummaryCards.innerHTML = [
    { label: "Notas visiveis", value: state.notes.length, note: "Filtros atuais", icon: "notes", tone: "brand" },
    { label: "Ativas", value: activeCount, note: "Sem envio ao financeiro", icon: "alert", tone: "neutral" },
    { label: "Financeiro", value: financeCount, note: "Sob acompanhamento", icon: "analytics", tone: "warning" },
    { label: "Historico", value: archivedCount, note: "Ja arquivadas", icon: "dashboard", tone: "success" },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card operations-kpi-card--compact",
        label: item.label,
        value: formatNumber(item.value),
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");
}

function renderNotesImportSummary() {
  if (!refs.notesImportSummary) {
    return;
  }

  const summary = state.notesUi.importSummary;
  if (!summary) {
    refs.notesImportSummary.textContent =
      "Reimportacoes duplicadas serao ignoradas automaticamente e o resumo aparecera aqui.";
    refs.notesImportSummary.dataset.tone = "neutral";
    return;
  }

  refs.notesImportSummary.textContent =
    `${summary.imported || 0} importada(s) | ${summary.ignored || 0} ignorada(s) | ${summary.errors || 0} erro(s)`;
  refs.notesImportSummary.dataset.tone = Number(summary.errors || 0) > 0 ? "critical" : "positive";
}

function buildInlineNoteEditor(note) {
  return `
    <tr class="note-inline-editor-row">
      <td colspan="8">
        <div class="note-inline-editor">
          <div class="note-inline-editor__summary">
            <article>
              <span>Fornecedor</span>
              <strong>${escapeHtml(note.supplierName)}</strong>
            </article>
            <article>
              <span>Valor</span>
              <strong>${escapeHtml(formatCurrency(note.totalValue))}</strong>
            </article>
            <article>
              <span>Emissao</span>
              <strong>${escapeHtml(note.issueDate ? formatDateTime(note.issueDate) : "Nao informada")}</strong>
            </article>
          </div>
          <div class="note-inline-editor__grid">
            <label>
              <span>DANFE</span>
              <input id="note-inline-danfe-${note.id}" type="text" value="${escapeHtml(note.danfe || "")}" />
            </label>
            <label>
              <span>Envio ao financeiro</span>
              <input
                id="note-inline-sent-${note.id}"
                type="datetime-local"
                value="${escapeHtml(toLocalDateTimeInput(note.sentToFinanceAt).slice(0, 16))}"
              />
            </label>
            <label class="full-width">
              <span>Observacoes financeiras</span>
              <textarea id="note-inline-finance-notes-${note.id}" rows="3">${escapeHtml(note.financeNotes || "")}</textarea>
            </label>
          </div>
          <div class="note-inline-editor__actions">
            <button type="button" class="ghost-button" data-note-set-finance-today="${note.id}">Marcar agora</button>
            <button type="button" class="secondary-button" data-note-inline-save="${note.id}">Salvar ajustes</button>
            <button type="button" class="ghost-button" data-note-inline-cancel="true">Fechar</button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

async function refreshNotes() {
  const search = refs.notesSearch.value.trim();
  const status = refs.notesStatusFilter.value;
  const category = refs.notesCategoryFilter.value;
  const workflow = refs.notesWorkflowFilter?.value || state.notesUi.workflow || "ACTIVE";
  const query = new URLSearchParams();

  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (category) query.set("category", category);
  if (workflow) query.set("workflow", workflow);

  state.notesUi.workflow = workflow;
  if (refs.notesWorkflowFilter) {
    refs.notesWorkflowFilter.value = workflow;
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await api(`/api/notes${suffix}`);
  state.notes = response.items || [];
  renderNotes();
}

function renderNotes() {
  renderNotesSummary();
  renderNotesImportSummary();

  refs.notesTableBody.innerHTML = state.notes.length
    ? state.notes
        .map((note) => {
          const workflow = getNoteWorkflowMeta(note);
          const isEditing = Number(state.notesUi.editingId || 0) === Number(note.id);

          return `
            <tr class="${isEditing ? "is-editing" : ""}">
              <td>
                <strong>${escapeHtml(note.supplierName)}</strong>
                <div class="muted">${escapeHtml(note.issueDate ? formatDateTime(note.issueDate) : "Data nao informada")}</div>
                <div class="muted">${escapeHtml(`${formatNoteSourceLabel(note.source)}${note.supplierTaxId ? ` • ${note.supplierTaxId}` : ""}`)}</div>
              </td>
              <td>${escapeHtml(note.danfe || "-")}</td>
              <td>${escapeHtml(formatCurrency(note.totalValue))}</td>
              <td>${statusBadge(note.category)}</td>
              <td>${statusBadge(note.status)}</td>
              <td>
                <span class="status-badge ${workflow.className}">${escapeHtml(workflow.label)}</span>
                <div class="muted">${escapeHtml(workflow.detail)}</div>
              </td>
              <td>
                ${note.sentToFinanceAt ? `<div>${escapeHtml(formatDateTime(note.sentToFinanceAt))}</div>` : `<div class="muted">Nao enviado</div>`}
                <div class="muted">${escapeHtml(note.sentToFinanceByName || note.financeNotes || "")}</div>
              </td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-note", note.id, "Editar nota", "&#9998;")}
                  ${
                    state.user?.role === "ADMIN"
                      ? buildRowActionButton("delete-note", note.id, "Excluir nota", "&#10005;", "danger")
                      : ""
                  }
                </div>
              </td>
            </tr>
            ${isEditing ? buildInlineNoteEditor(note) : ""}
          `;
        })
        .join("")
    : emptyRow("Nenhuma nota encontrada para os filtros informados.", 8);

  syncResponsiveTableLabels();
}

function editNote(id) {
  const note = findById(state.notes, id);
  if (!note) {
    return;
  }

  state.notesUi.editingId = Number(note.id);
  renderNotes();
}

function resetNoteForm() {
  refs.noteForm.reset();
  refs.noteForm.elements.id.value = "";
  refs.noteForm.elements.status.value = "NEW";
  refs.noteForm.elements.category.value = "LOGISTICS";
  refs.noteForm.elements.issueDate.value = currentLocalDateTime();
  state.notesUi.editingId = null;
}

function cancelInlineNoteEditing() {
  state.notesUi.editingId = null;
  renderNotes();
}

function setInlineNoteFinanceNow(noteId) {
  const input = $(`note-inline-sent-${noteId}`);
  if (!input) {
    return;
  }

  input.value = currentLocalDateTime().slice(0, 16);
}

async function saveInlineNoteEditing(noteId) {
  const note = findById(state.notes, noteId);
  if (!note) {
    return;
  }

  const sentToFinanceAt = toIsoDateTime($(`note-inline-sent-${noteId}`)?.value || "");
  const payload = {
    supplierName: note.supplierName,
    supplierTaxId: note.supplierTaxId,
    totalValue: note.totalValue,
    issueDate: note.issueDate,
    category: note.category,
    status: sentToFinanceAt ? (note.archivedAt ? "FINALIZED" : "SENT_FINANCE") : note.status === "SENT_FINANCE" ? "ACKNOWLEDGED" : note.status,
    danfe: $(`note-inline-danfe-${noteId}`)?.value || "",
    sentToFinanceAt,
    financeNotes: $(`note-inline-finance-notes-${noteId}`)?.value || "",
    archivedAt: note.archivedAt || "",
  };

  try {
    await api(`/api/notes/${noteId}`, {
      method: "PUT",
      body: payload,
    });
    state.notesUi.editingId = null;
    await Promise.all([refreshNotes(), refreshDashboard(), maybeRefreshAdmin()]);
    showToast("Nota atualizada na propria listagem.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleXmlImport() {
  const files = Array.from(refs.xmlImportInput.files || []);
  if (!files.length) {
    showToast("Selecione ao menos um XML.", "error");
    return;
  }

  try {
    const payloadFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        content: await file.text(),
      }))
    );

    const response = await api("/api/notes/import/xml", {
      method: "POST",
      body: { files: payloadFiles },
    });

    state.notesUi.importSummary = response.summary || null;
    refs.xmlImportInput.value = "";
    await Promise.all([refreshNotes(), refreshDashboard(), maybeRefreshAdmin()]);
    showToast(
      `${response.summary?.imported || 0} XML(s) importado(s) | ${response.summary?.ignored || 0} ignorado(s) | ${response.summary?.errors || 0} erro(s).`
    );
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleSpreadsheetImport() {
  const file = refs.spreadsheetImportInput.files?.[0];
  if (!file) {
    showToast("Selecione uma planilha.", "error");
    return;
  }

  try {
    const contentBase64 = await fileToBase64(file);
    const response = await api("/api/notes/import/spreadsheet", {
      method: "POST",
      body: {
        fileName: file.name,
        contentBase64,
      },
    });

    state.notesUi.importSummary = response.summary || null;
    refs.spreadsheetImportInput.value = "";
    await Promise.all([refreshNotes(), refreshDashboard(), maybeRefreshAdmin()]);
    showToast(
      `${response.summary?.imported || 0} linha(s) importada(s) | ${response.summary?.ignored || 0} ignorada(s) | ${response.summary?.errors || 0} erro(s).`
    );
  } catch (error) {
    showToast(error.message, "error");
  }
}

function createScheduleDraftLine(line = {}) {
  state.schedule.lineCounter = Number(state.schedule.lineCounter || 0) + 1;
  return {
    localId: line.localId || `schedule-line-${state.schedule.lineCounter}`,
    id: line.id ? Number(line.id) : null,
    lineOrder: Number(line.lineOrder || line.line_order || 0) || state.schedule.lineCounter,
    vehicle: line.vehicle || "",
    location: line.location || "",
    driver: line.driver || "",
    assistant: line.assistant || "",
    departureTime: line.departureTime || line.departure_time || "",
    notes: line.notes || "",
  };
}

function normalizeScheduleDraftLines(lines = []) {
  const normalized = lines.map((line, index) => ({
    ...createScheduleDraftLine(line),
    lineOrder: index + 1,
  }));
  return normalized.length ? normalized : [createScheduleDraftLine({ lineOrder: 1 })];
}

function getSchedulePreviewItems() {
  const draftLines = Array.isArray(state.schedule?.draftLines) ? state.schedule.draftLines : [];
  const meaningfulDraft = draftLines.filter((line) =>
    [line.vehicle, line.location, line.driver, line.assistant, line.departureTime, line.notes].some((value) =>
      String(value || "").trim()
    )
  );

  if (meaningfulDraft.length) {
    return meaningfulDraft;
  }

  return Array.isArray(state.schedules) ? state.schedules : [];
}

function renderScheduleSuggestions() {
  const suggestions = state.schedule.suggestions || {};
  const targets = [
    ["schedule-vehicle-list", suggestions.vehicles || []],
    ["schedule-driver-list", suggestions.drivers || []],
    ["schedule-assistant-list", suggestions.assistants || []],
    ["schedule-location-list", suggestions.locations || []],
  ];

  targets.forEach(([id, values]) => {
    const target = $(id);
    if (!target) {
      return;
    }
    target.innerHTML = (values || []).map((item) => `<option value="${escapeHtml(item)}"></option>`).join("");
  });
}

function renderScheduleLinesEditor() {
  if (!refs.scheduleLinesContainer) {
    return;
  }

  const lines = normalizeScheduleDraftLines(state.schedule.draftLines || []);
  state.schedule.draftLines = lines;

  refs.scheduleLinesContainer.innerHTML = lines
    .map(
      (line, index) => `
        <article class="schedule-line-card" data-schedule-line-card="${escapeHtml(line.localId)}">
          <div class="container-linha-escala">
            <div class="schedule-line-number">#${escapeHtml(formatNumber(index + 1))}</div>
            <label class="schedule-line-field">
              <span>Placa</span>
              <input
                class="input-escala"
                type="text"
                value="${escapeHtml(line.vehicle)}"
                list="schedule-vehicle-list"
                data-schedule-line-field="vehicle"
                data-schedule-line-id="${escapeHtml(line.localId)}"
              />
            </label>
            <label class="schedule-line-field">
              <span>Local / rota</span>
              <input
                class="input-escala"
                type="text"
                value="${escapeHtml(line.location)}"
                list="schedule-location-list"
                data-schedule-line-field="location"
                data-schedule-line-id="${escapeHtml(line.localId)}"
              />
            </label>
            <label class="schedule-line-field">
              <span>Motorista</span>
              <input
                class="input-escala"
                type="text"
                value="${escapeHtml(line.driver)}"
                list="schedule-driver-list"
                data-schedule-line-field="driver"
                data-schedule-line-id="${escapeHtml(line.localId)}"
              />
            </label>
            <label class="schedule-line-field">
              <span>Ajudante</span>
              <input
                class="input-escala"
                type="text"
                value="${escapeHtml(line.assistant)}"
                list="schedule-assistant-list"
                data-schedule-line-field="assistant"
                data-schedule-line-id="${escapeHtml(line.localId)}"
              />
            </label>
            <div class="schedule-line-meta">
              <label class="schedule-line-time">
                <span>Horario</span>
                <input
                  class="input-escala"
                  type="time"
                  value="${escapeHtml(line.departureTime || "")}"
                  data-schedule-line-field="departureTime"
                  data-schedule-line-id="${escapeHtml(line.localId)}"
                />
              </label>
              <div class="schedule-line-actions">
                <button type="button" class="ghost-button" data-schedule-line-duplicate="${escapeHtml(line.localId)}">Duplicar</button>
                <button type="button" class="ghost-button" data-schedule-line-remove="${escapeHtml(line.localId)}">Remover</button>
              </div>
            </div>
            <label class="schedule-line-notes observacao-linha">
              <span>Observacao da linha</span>
              <textarea
                class="textarea-escala"
                rows="3"
                data-schedule-line-field="notes"
                data-schedule-line-id="${escapeHtml(line.localId)}"
              >${escapeHtml(line.notes || "")}</textarea>
            </label>
          </div>
        </article>
      `
    )
    .join("");
}

function buildScheduleDraftModel(sourceDay = null) {
  if (sourceDay) {
    return {
      id: sourceDay.id || null,
      scheduledDate: sourceDay.scheduledDate || currentLocalDate(),
      documentTitle: sourceDay.documentTitle || refs.scheduleForm.elements.documentTitle.value || "ESCALA OPERACIONAL DIARIA",
      responsibleName: sourceDay.responsibleName || refs.scheduleForm.elements.responsibleName.value || "",
      generalNotes: sourceDay.generalNotes || "",
      documentMode: refs.scheduleForm.elements.documentMode?.value || "filled",
      entries: normalizeScheduleDraftLines(sourceDay.entries || []),
    };
  }

  return {
    id: state.schedule.dayId || null,
    scheduledDate: refs.scheduleForm.elements.scheduledDate.value || currentLocalDate(),
    documentTitle: refs.scheduleForm.elements.documentTitle.value || "ESCALA OPERACIONAL DIARIA",
    responsibleName: refs.scheduleForm.elements.responsibleName.value || state.user?.name || "",
    generalNotes: refs.scheduleForm.elements.generalNotes.value || "",
    documentMode: refs.scheduleForm.elements.documentMode?.value || "filled",
    entries: normalizeScheduleDraftLines(state.schedule.draftLines || []).filter((line) =>
      [line.vehicle, line.location, line.driver, line.assistant, line.departureTime, line.notes].some((value) => String(value || "").trim())
    ),
  };
}

function buildSchedulePreviewMarkup(model) {
  const company = getDocumentCompany();
  const mode = model.documentMode === "blank" ? "blank" : "filled";
  const printableEntries = (model.entries || []).map((entry, index) =>
    mode === "blank"
      ? {
          ...entry,
          lineOrder: index + 1,
          vehicle: "",
          location: "",
          driver: "",
          assistant: "",
          departureTime: "",
          notes: "",
        }
      : { ...entry, lineOrder: index + 1 }
  );

  const uniqueVehicles = new Set((model.entries || []).map((item) => item.vehicle).filter(Boolean));
  const uniqueDrivers = new Set((model.entries || []).map((item) => item.driver).filter(Boolean));

  return `
    <article class="schedule-paper">
      <header class="schedule-paper__header">
        <div class="schedule-paper__brand">
          ${
            company.logoDataUrl
              ? `<img src="${company.logoDataUrl}" alt="Logo da empresa" />`
              : `<strong>${escapeHtml(company.companyName)}</strong>`
          }
        </div>
        <div class="schedule-paper__title">
          <span>${escapeHtml(company.companyName)}</span>
          <h4>${escapeHtml(model.documentTitle || "ESCALA OPERACIONAL DIARIA")}</h4>
          <span>${escapeHtml(mode === "blank" ? "Modo manual para preenchimento em campo" : "Modo auto preenchido")}</span>
        </div>
        <div class="schedule-paper__meta">
          <span>Data</span>
          <strong>${escapeHtml(formatDateOnly(model.scheduledDate))}</strong>
          <span>Responsavel</span>
          <strong>${escapeHtml(model.responsibleName || "-")}</strong>
        </div>
      </header>
      <div class="schedule-paper__summary">
        <div><span>Linhas</span><strong>${escapeHtml(formatNumber((model.entries || []).length))}</strong></div>
        <div><span>Placas</span><strong>${escapeHtml(formatNumber(uniqueVehicles.size))}</strong></div>
        <div><span>Motoristas</span><strong>${escapeHtml(formatNumber(uniqueDrivers.size))}</strong></div>
        <div><span>Modo</span><strong>${escapeHtml(mode === "blank" ? "Manual" : "Auto")}</strong></div>
      </div>
      <table class="schedule-paper__table">
        <thead>
          <tr>
            <th>#</th>
            <th>Placa</th>
            <th>Local / rota</th>
            <th>Motorista</th>
            <th>Ajudante</th>
            <th>Hora</th>
            <th>Observacao</th>
          </tr>
        </thead>
        <tbody>
          ${
            printableEntries.length
              ? printableEntries
                  .map(
                    (entry, index) => `
                      <tr>
                        <td>${escapeHtml(formatNumber(index + 1))}</td>
                        <td>${escapeHtml(entry.vehicle || "")}</td>
                        <td>${escapeHtml(entry.location || "")}</td>
                        <td>${escapeHtml(entry.driver || "")}</td>
                        <td>${escapeHtml(entry.assistant || "")}</td>
                        <td>${escapeHtml(entry.departureTime || "")}</td>
                        <td>${escapeHtml(entry.notes || "")}</td>
                      </tr>
                    `
                  )
                  .join("")
              : `
                  <tr>
                    <td>1</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                `
          }
        </tbody>
      </table>
      <div class="schedule-paper__notes">
        <div>
          <span>Observacao geral</span>
          <p>${escapeHtml(model.generalNotes || "Sem observacoes gerais registradas.")}</p>
        </div>
      </div>
      <footer class="schedule-paper__footer">
        <div>
          <span>Rodape</span>
          <p>${escapeHtml(company.documentFooter)}</p>
        </div>
        <div>
          <span>Gerado em</span>
          <p>${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
        </div>
      </footer>
    </article>
  `;
}

function buildSchedulePrintDocument(model) {
  return `
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #ffffff; color: #101828; }
      .schedule-paper { display: grid; gap: 14px; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; box-sizing: border-box; }
      .schedule-paper__header { display: grid; grid-template-columns: 28mm minmax(0, 1fr) auto; gap: 10px; align-items: center; }
      .schedule-paper__brand { display: flex; align-items: center; justify-content: center; min-height: 22mm; border: 1.4px solid #111; padding: 2mm; box-sizing: border-box; }
      .schedule-paper__brand img { max-width: 100%; max-height: 100%; object-fit: contain; }
      .schedule-paper__title { display: grid; gap: 2px; }
      .schedule-paper__title span, .schedule-paper__meta span, .schedule-paper__footer span { font-size: 10px; color: #475467; }
      .schedule-paper__title h4 { margin: 0; font-size: 16px; line-height: 1.1; letter-spacing: 0.06em; text-transform: uppercase; }
      .schedule-paper__meta { display: grid; gap: 2px; justify-items: end; text-align: right; font-size: 11px; }
      .schedule-paper__meta strong { font-size: 11px; }
      .schedule-paper__summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      .schedule-paper__summary div, .schedule-paper__notes div { border: 1.5px solid #111; padding: 8px 9px; border-radius: 0; }
      .schedule-paper__summary strong { display: block; margin-top: 2px; font-size: 14px; color: #111; }
      .schedule-paper__table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .schedule-paper__table th, .schedule-paper__table td { border: 1.5px solid #111; padding: 7px 6px; font-size: 10px; vertical-align: top; }
      .schedule-paper__table th { background: #f4f4f5; text-transform: uppercase; letter-spacing: 0.04em; }
      .schedule-paper__table td { min-height: 9mm; }
      .schedule-paper__table th:nth-child(1), .schedule-paper__table td:nth-child(1) { width: 5.5%; }
      .schedule-paper__table th:nth-child(2), .schedule-paper__table td:nth-child(2) { width: 15%; }
      .schedule-paper__table th:nth-child(3), .schedule-paper__table td:nth-child(3) { width: 27%; }
      .schedule-paper__table th:nth-child(4), .schedule-paper__table td:nth-child(4) { width: 17%; }
      .schedule-paper__table th:nth-child(5), .schedule-paper__table td:nth-child(5) { width: 14%; }
      .schedule-paper__table th:nth-child(6), .schedule-paper__table td:nth-child(6) { width: 9%; }
      .schedule-paper__table th:nth-child(7), .schedule-paper__table td:nth-child(7) { width: 12.5%; }
      .schedule-paper__notes p, .schedule-paper__footer p { margin: 4px 0 0; font-size: 10px; line-height: 1.45; }
      .schedule-paper__footer { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      @page { size: A4 portrait; margin: 10mm; }
    </style>
    ${buildSchedulePreviewMarkup(model)}
  `;
}

function renderScheduleDocumentPreview(forceVisible = false) {
  if (!refs.scheduleDocumentPreview) {
    return;
  }

  if (forceVisible) {
    state.schedule.previewVisible = true;
  }

  const model = buildScheduleDraftModel();
  if (!state.schedule.previewVisible && !(state.schedule.dayId && model.entries.length)) {
    refs.scheduleDocumentPreview.innerHTML = `
      <div class="dashboard-empty">
        <strong>Documento ainda nao gerado</strong>
        <p class="muted">Preencha a escala e gere o documento para revisar o layout antes de imprimir.</p>
      </div>
    `;
    return;
  }

  refs.scheduleDocumentPreview.innerHTML = buildSchedulePreviewMarkup(model);
}

function renderScheduleHistory() {
  if (!refs.scheduleHistoryTableBody) {
    return;
  }

  refs.scheduleHistoryTableBody.innerHTML = (state.schedule.history || []).length
    ? state.schedule.history
        .map(
          (day) => `
            <tr>
              <td>${escapeHtml(formatDateOnly(day.scheduledDate))}</td>
              <td>
                <strong>${escapeHtml(day.documentTitle || "ESCALA OPERACIONAL DIARIA")}</strong>
                <div class="muted">${escapeHtml(day.responsibleName || "-")}</div>
              </td>
              <td>${escapeHtml(`${formatNumber(day.totals?.lines || 0)} linha(s) • ${formatNumber(day.totals?.vehicles || 0)} placa(s)` )}</td>
              <td>${escapeHtml(day.updatedByName || day.createdByName || "-")}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="ghost-button compact-button" data-schedule-history-open="${day.id}">Abrir</button>
                  <button type="button" class="ghost-button compact-button" data-schedule-history-duplicate="${day.id}">Duplicar</button>
                  <button type="button" class="ghost-button compact-button" data-schedule-history-print="${day.id}">PDF</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma escala historica encontrada para os filtros informados.", 5);

  syncResponsiveTableLabels();
}

function refreshScheduleSummary() {
  const items = getSchedulePreviewItems();
  const uniqueVehicles = new Set(items.map((item) => item.vehicle).filter(Boolean));
  const uniqueDrivers = new Set(items.map((item) => item.driver).filter(Boolean));
  const assistants = items.filter((item) => item.assistant).length;

  refs.scheduleSummaryCards.innerHTML = [
    { label: "Linhas do dia", value: items.length, icon: "schedules", tone: "brand" },
    { label: "Placas", value: uniqueVehicles.size, icon: "vehicle", tone: "neutral" },
    { label: "Motoristas", value: uniqueDrivers.size, icon: "team", tone: "warning" },
    { label: "Ajudantes", value: assistants, icon: "dashboard", tone: "success" },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card operations-kpi-card--compact",
        label: item.label,
        value: formatNumber(item.value),
        note: "Baseado na edicao atual",
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.scheduleNotesFeed.innerHTML = items.length
    ? items
        .filter((item) => item.notes)
        .slice(0, 4)
        .map(
          (item) => `
            <article class="stack-item">
              <strong>${escapeHtml(item.vehicle || "Sem placa")}</strong>
              <p class="muted">${escapeHtml(item.location || "Rota nao informada")}</p>
              <p class="muted">${escapeHtml(item.notes)}</p>
            </article>
          `
        )
        .join("") ||
      `<div class="stack-item"><strong>Sem observacoes adicionais</strong><p class="muted">Cadastre notas operacionais na escala para aparecerem aqui.</p></div>`
    : `<div class="stack-item"><strong>Nenhuma escala do dia</strong><p class="muted">Adicione linhas para visualizar o resumo operacional.</p></div>`;
}

function renderSchedules() {
  const items = getSchedulePreviewItems();
  refs.schedulesTableBody.innerHTML = items.length
    ? items
        .map(
          (item, index) => `
            <tr>
              <td>${escapeHtml(formatNumber(index + 1))}</td>
              <td>
                <strong>${escapeHtml(item.vehicle || "-")}</strong>
                <div class="muted">${escapeHtml(formatDateOnly(refs.scheduleForm.elements.scheduledDate.value || currentLocalDate()))}</div>
              </td>
              <td>${escapeHtml(item.location || "Rota nao informada")}</td>
              <td>${escapeHtml(item.driver || "-")}</td>
              <td>${escapeHtml(item.assistant || "-")}</td>
              <td>${escapeHtml(item.departureTime || "-")}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="ghost-button compact-button" data-schedule-focus-line="${escapeHtml(item.localId || String(item.id || ""))}">Editar</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma linha adicionada para a escala selecionada.", 7);

  refreshScheduleSummary();
}

function addScheduleDraftLine(seed = {}) {
  const nextLines = [...normalizeScheduleDraftLines(state.schedule.draftLines || []), createScheduleDraftLine(seed)];
  state.schedule.draftLines = nextLines.map((line, index) => ({ ...line, lineOrder: index + 1 }));
  state.schedule.hasUnsavedChanges = true;
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleDocumentPreview();
}

function removeScheduleDraftLine(localId) {
  const current = normalizeScheduleDraftLines(state.schedule.draftLines || []);
  if (current.length <= 1) {
    showToast("Mantenha ao menos uma linha operacional.", "error");
    return;
  }

  state.schedule.draftLines = current.filter((line) => line.localId !== localId).map((line, index) => ({
    ...line,
    lineOrder: index + 1,
  }));
  state.schedule.hasUnsavedChanges = true;
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleDocumentPreview();
}

function duplicateScheduleDraftLine(localId) {
  const current = normalizeScheduleDraftLines(state.schedule.draftLines || []);
  const source = current.find((line) => line.localId === localId);
  if (!source) {
    return;
  }

  state.schedule.draftLines = current
    .flatMap((line) => (line.localId === localId ? [line, createScheduleDraftLine({ ...source, id: null })] : [line]))
    .map((line, index) => ({ ...line, lineOrder: index + 1 }));
  state.schedule.hasUnsavedChanges = true;
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleDocumentPreview();
}

function updateScheduleDraftField(localId, field, value) {
  state.schedule.draftLines = normalizeScheduleDraftLines(state.schedule.draftLines || []).map((line) =>
    line.localId === localId ? { ...line, [field]: value } : line
  );
  state.schedule.hasUnsavedChanges = true;
  renderSchedules();
  if (state.schedule.previewVisible) {
    renderScheduleDocumentPreview();
  }
}

function focusScheduleLine(localId) {
  const lineCard = document.querySelector(`[data-schedule-line-card="${String(localId || "").replace(/"/g, '\\"')}"]`);
  if (!lineCard) {
    return;
  }

  scrollToElement(lineCard, "center");
  lineCard.querySelector("input, textarea")?.focus();
}

function hydrateScheduleWorkspaceFromDay(day, options = {}) {
  refs.scheduleForm.elements.id.value = day?.id ? String(day.id) : "";
  refs.scheduleForm.elements.scheduledDate.value = day?.scheduledDate || refs.scheduleForm.elements.scheduledDate.value || currentLocalDate();
  refs.scheduleForm.elements.documentTitle.value = day?.documentTitle || "ESCALA OPERACIONAL DIARIA";
  refs.scheduleForm.elements.responsibleName.value = day?.responsibleName || state.user?.name || "";
  refs.scheduleForm.elements.generalNotes.value = day?.generalNotes || "";

  state.schedule.dayId = day?.id || null;
  state.schedule.day = day || null;
  state.schedule.draftLines = normalizeScheduleDraftLines(day?.entries || []);
  state.schedule.hasUnsavedChanges = false;
  state.schedule.previewVisible = options.preservePreview ? state.schedule.previewVisible : Boolean(day?.entries?.length);

  renderScheduleSuggestions();
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleHistory();
  renderScheduleDocumentPreview();
}

function clearScheduleHistoryFilters() {
  if (refs.scheduleHistoryDate) refs.scheduleHistoryDate.value = "";
  if (refs.scheduleHistoryPlate) refs.scheduleHistoryPlate.value = "";
  if (refs.scheduleHistoryDriver) refs.scheduleHistoryDriver.value = "";
  refreshSchedules().catch((error) => showToast(error.message, "error"));
}

async function refreshSchedules() {
  const query = new URLSearchParams();
  const selectedDate = refs.scheduleForm?.elements.scheduledDate?.value || currentLocalDate();
  query.set("date", selectedDate);
  if (refs.scheduleHistoryDate?.value) query.set("historyDate", refs.scheduleHistoryDate.value);
  if (refs.scheduleHistoryPlate?.value.trim()) query.set("plate", refs.scheduleHistoryPlate.value.trim());
  if (refs.scheduleHistoryDriver?.value.trim()) query.set("driver", refs.scheduleHistoryDriver.value.trim());

  const response = await api(`/api/schedules?${query.toString()}`);
  state.schedules = response.items || [];
  state.schedule.history = response.history || [];
  state.schedule.suggestions = response.suggestions || state.schedule.suggestions;

  const currentSelectedDate = refs.scheduleForm?.elements.scheduledDate?.value || selectedDate;
  const shouldHydrate =
    !state.schedule.hasUnsavedChanges ||
    currentSelectedDate !== (state.schedule.day?.scheduledDate || "") ||
    Number(response.day?.id || 0) !== Number(state.schedule.dayId || 0);

  if (response.day && shouldHydrate) {
    hydrateScheduleWorkspaceFromDay(response.day);
    return;
  }

  if (!response.day && shouldHydrate) {
    refs.scheduleForm.elements.id.value = "";
    refs.scheduleForm.elements.scheduledDate.value = response.selectedDate || selectedDate;
    if (!refs.scheduleForm.elements.documentTitle.value) {
      refs.scheduleForm.elements.documentTitle.value = "ESCALA OPERACIONAL DIARIA";
    }
    if (!refs.scheduleForm.elements.responsibleName.value) {
      refs.scheduleForm.elements.responsibleName.value = state.user?.name || "";
    }
    state.schedule.dayId = null;
    state.schedule.day = null;
    state.schedule.draftLines = normalizeScheduleDraftLines([]);
    state.schedule.hasUnsavedChanges = false;
    state.schedule.previewVisible = false;
  }

  renderScheduleSuggestions();
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleHistory();
  renderScheduleDocumentPreview();
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  const model = buildScheduleDraftModel();
  const payload = {
    scheduledDate: model.scheduledDate,
    documentTitle: model.documentTitle,
    responsibleName: model.responsibleName,
    generalNotes: model.generalNotes,
    entries: model.entries.map((entry, index) => ({
      vehicle: entry.vehicle,
      location: entry.location,
      driver: entry.driver,
      assistant: entry.assistant,
      departureTime: entry.departureTime,
      notes: entry.notes,
      lineOrder: index + 1,
    })),
  };

  if (!payload.entries.length) {
    showToast("Adicione ao menos uma linha operacional para salvar a escala.", "error");
    return;
  }

  try {
    const scheduleDayId = state.schedule.dayId || refs.scheduleForm.elements.id.value;
    await api(scheduleDayId ? `/api/schedules/${scheduleDayId}` : "/api/schedules", {
      method: scheduleDayId ? "PUT" : "POST",
      body: payload,
    });
    state.schedule.previewVisible = true;
    await Promise.all([refreshSchedules(), refreshDashboard(), maybeRefreshAdmin()]);

    if (
      state.dossier.selectedPlate &&
      payload.entries.some((entry) => normalizeClientPlateKey(entry.vehicle) === normalizeClientPlateKey(state.dossier.selectedPlate))
    ) {
      await loadVehicleDossierByPlate(state.dossier.selectedPlate, { silent: true });
    }

    showToast(scheduleDayId ? "Escala atualizada com sucesso." : "Escala salva com sucesso.");
  } catch (error) {
    if (error.status === 409 && error.data?.day) {
      hydrateScheduleWorkspaceFromDay(error.data.day, { preservePreview: true });
      showToast("Ja existe uma escala para esta data. A versao salva foi carregada para revisao.", "error");
      return;
    }
    showToast(error.message || "Falha ao salvar a escala.", "error");
  }
}

function editSchedule(id) {
  const line = getSchedulePreviewItems().find(
    (item) => Number(item.id || 0) === Number(id) || String(item.localId || "") === String(id)
  );
  if (!line) {
    return;
  }
  focusScheduleLine(line.localId || String(id));
}

function resetScheduleForm() {
  refs.scheduleForm.reset();
  refs.scheduleForm.elements.id.value = "";
  refs.scheduleForm.elements.scheduledDate.value = currentLocalDate();
  refs.scheduleForm.elements.documentTitle.value = "ESCALA OPERACIONAL DIARIA";
  refs.scheduleForm.elements.responsibleName.value = state.user?.name || "";
  refs.scheduleForm.elements.documentMode.value = "filled";
  state.schedule.dayId = null;
  state.schedule.day = null;
  state.schedule.draftLines = normalizeScheduleDraftLines([]);
  state.schedule.previewVisible = false;
  state.schedule.hasUnsavedChanges = false;
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleDocumentPreview();
}

async function handleScheduleDuplicatePrevious() {
  const currentDate = refs.scheduleForm.elements.scheduledDate.value || currentLocalDate();
  const previousDay = (state.schedule.history || []).find((day) => String(day.scheduledDate || "") < currentDate);

  if (!previousDay) {
    showToast("Nenhuma escala anterior disponivel para duplicacao.", "error");
    return;
  }

  refs.scheduleForm.elements.id.value = "";
  refs.scheduleForm.elements.documentTitle.value = previousDay.documentTitle || "ESCALA OPERACIONAL DIARIA";
  refs.scheduleForm.elements.responsibleName.value = previousDay.responsibleName || state.user?.name || "";
  refs.scheduleForm.elements.generalNotes.value = previousDay.generalNotes || "";
  state.schedule.dayId = null;
  state.schedule.day = null;
  state.schedule.draftLines = normalizeScheduleDraftLines(
    (previousDay.entries || []).map((entry) => ({
      ...entry,
      id: null,
      localId: "",
    }))
  );
  state.schedule.previewVisible = true;
  state.schedule.hasUnsavedChanges = true;
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleDocumentPreview();
  showToast("Escala anterior carregada para o dia atual.");
}

async function handleSchedulePrint(mode = "print", sourceDay = null) {
  const model = buildScheduleDraftModel(sourceDay);
  if (!(model.entries || []).length) {
    showToast("Nao ha linhas suficientes para gerar o documento.", "error");
    return;
  }

  try {
    await runPrintWorkflow({
      type: "schedule-document",
      mode,
      placeholderTitle: "Preparando documento da escala",
      buildJob: async () => ({
        title: `${model.documentTitle || "Escala"} - ${model.scheduledDate}`,
        html: buildSchedulePrintDocument(model),
      }),
    });
    showToast(mode === "pdf" ? "Documento pronto. Na impressao, escolha Salvar como PDF." : "Documento da escala pronto para impressao.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function handleScheduleGenerateDocument() {
  state.schedule.previewVisible = true;
  renderScheduleDocumentPreview(true);
  showToast("Preview da escala atualizado.");
}

function handleScheduleExportExcel() {
  const model = buildScheduleDraftModel();
  if (!(model.entries || []).length) {
    showToast("Nao ha linhas para exportar.", "error");
    return;
  }

  const rows = [
    ["Data", "Placa", "Local/Rota", "Motorista", "Ajudante", "Horario", "Observacao"].map(csvEscape).join(";"),
    ...model.entries.map((entry) =>
      [
        model.scheduledDate,
        entry.vehicle,
        entry.location,
        entry.driver,
        entry.assistant,
        entry.departureTime,
        entry.notes,
      ]
        .map(csvEscape)
        .join(";")
    ),
  ];

  const blob = new Blob(["\ufeff", rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `escala-${(model.scheduledDate || currentLocalDate()).toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Arquivo CSV exportado. Ele pode ser aberto no Excel.");
}

async function openScheduleHistoryDay(scheduleDayId, options = {}) {
  const response = await api(`/api/schedules/${scheduleDayId}`);
  const day = response.day;
  if (!day) {
    throw new Error("Escala historica nao encontrada.");
  }

  if (options.printMode) {
    await handleSchedulePrint(options.printMode, {
      ...day,
      documentMode: refs.scheduleForm.elements.documentMode?.value || "filled",
    });
    return;
  }

  if (options.duplicate) {
    refs.scheduleForm.elements.id.value = "";
    refs.scheduleForm.elements.documentTitle.value = day.documentTitle || "ESCALA OPERACIONAL DIARIA";
    refs.scheduleForm.elements.responsibleName.value = day.responsibleName || state.user?.name || "";
    refs.scheduleForm.elements.generalNotes.value = day.generalNotes || "";
    state.schedule.dayId = null;
    state.schedule.day = null;
    state.schedule.draftLines = normalizeScheduleDraftLines(
      (day.entries || []).map((entry) => ({ ...entry, id: null, localId: "" }))
    );
    state.schedule.previewVisible = true;
    state.schedule.hasUnsavedChanges = true;
    renderScheduleLinesEditor();
    renderSchedules();
    renderScheduleDocumentPreview();
    showToast("Historico carregado como nova base de escala.");
    return;
  }

  refs.scheduleForm.elements.scheduledDate.value = day.scheduledDate || currentLocalDate();
  hydrateScheduleWorkspaceFromDay(day);
  setSection("schedules");
}

function openBarcodeImagePicker(targetId) {
  if (!refs.barcodeImageInput) {
    showToast("Selecao por imagem indisponivel neste navegador.", "error");
    return;
  }

  refs.barcodeImageInput.dataset.targetId = targetId;
  refs.barcodeImageInput.value = "";
  refs.barcodeImageInput.click();
}

async function decodeBarcodeFromImageFile(file) {
  if (!("BarcodeDetector" in window) || !("createImageBitmap" in window)) {
    throw new Error("Leitura por imagem indisponivel neste navegador.");
  }

  const detector = new window.BarcodeDetector({
    formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e"],
  });
  const bitmap = await createImageBitmap(file);
  try {
    const results = await detector.detect(bitmap);
    if (!results.length || !results[0].rawValue) {
      throw new Error("Nenhum codigo de barras foi encontrado na imagem selecionada.");
    }
    return String(results[0].rawValue || "").trim();
  } finally {
    bitmap.close?.();
  }
}

async function handleBarcodeImageSelection(event) {
  const file = event.target.files?.[0];
  const targetId = event.target.dataset.targetId || "";
  event.target.value = "";
  delete event.target.dataset.targetId;

  if (!file || !targetId) {
    return;
  }

  try {
    const barcode = await decodeBarcodeFromImageFile(file);
    const target = $(targetId);
    if (target) {
      target.value = barcode;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (targetId === "movement-barcode-input") {
      try {
        const item = await lookupProductByBarcodeValue(barcode, { stockType: "COMMON" });
        showToast(`Produto encontrado: ${item.name}`);
      } catch (error) {
        if (isBarcodeNotFoundError(error)) {
          await prepareNewProductFromBarcode(barcode);
          return;
        }
        throw error;
      }
      return;
    }

    if (targetId === "product-barcode-input") {
      await handleBarcodeForProductRegistration(barcode);
      return;
    }

    showToast(`Codigo lido: ${barcode}`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function openScanner(targetId) {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
    showToast("Seu navegador nao permite acesso a camera. Use a digitacao manual.", "error");
    return;
  }

  try {
    closeScanner();
    refs.scannerModal.classList.remove("hidden");
    refs.scannerStatus.textContent = "Preparando leitura por camera...";
    state.scanner = {
      ...state.scanner,
      targetId,
      engine: "",
      controls: null,
      codeReader: null,
      detector: null,
      stream: null,
      timer: null,
      sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      isClosing: false,
      lastValue: "",
      lastDetectedAt: 0,
    };

    if ("BarcodeDetector" in window) {
      try {
        await startNativeBarcodeScanner(targetId);
        return;
      } catch (nativeError) {
        if (getScannerFallbackReader()) {
          refs.scannerStatus.textContent = "Leitor nativo indisponivel. Ativando modo alternativo...";
          closeScanner();
          refs.scannerModal.classList.remove("hidden");
          state.scanner = {
            ...state.scanner,
            targetId,
            sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            isClosing: false,
            lastValue: "",
            lastDetectedAt: 0,
          };
          await startFallbackBarcodeScanner(targetId);
          return;
        }
        throw nativeError;
      }
    }

    await startFallbackBarcodeScanner(targetId);
  } catch (error) {
    showToast(describeScannerError(error), "error");
    closeScanner();
  }
}

async function scanLoop() {
  if (
    state.scanner.engine !== "native" ||
    !state.scanner.detector ||
    !refs.scannerVideo?.srcObject ||
    state.scanner.isClosing
  ) {
    return;
  }

  try {
    const results = await state.scanner.detector.detect(refs.scannerVideo);
    if (results.length) {
      refs.scannerStatus.textContent = "Codigo detectado. Validando item...";
      await handleScannerBarcodeDetected(results[0].rawValue || "", state.scanner.sessionId);
      return;
    }
  } catch (error) {
    refs.scannerStatus.textContent = "Camera ativa. Ajuste o foco ou aproxime o codigo.";
  }

  state.scanner.timer = window.setTimeout(scanLoop, 260);
}

function closeScanner() {
  state.scanner.isClosing = true;

  if (state.scanner.timer) {
    window.clearTimeout(state.scanner.timer);
  }

  try {
    state.scanner.controls?.stop?.();
  } catch (error) {
    // Ignora falhas ao interromper o leitor.
  }

  try {
    state.scanner.codeReader?.reset?.();
  } catch (error) {
    // Ignora falhas ao limpar o leitor alternativo.
  }

  state.scanner.stream?.getTracks?.().forEach((track) => track.stop());
  if (refs.scannerVideo) {
    refs.scannerVideo.pause?.();
    refs.scannerVideo.srcObject = null;
  }

  refs.scannerModal.classList.add("hidden");
  refs.scannerStatus.textContent = "Aguardando camera...";
  state.scanner = {
    stream: null,
    timer: null,
    targetId: null,
    detector: null,
    engine: "",
    sessionId: 0,
    isClosing: false,
    controls: null,
    codeReader: null,
    lastValue: "",
    lastDetectedAt: 0,
  };
}

async function lookupProductByBarcode() {
  const barcode = refs.movementBarcodeInput.value.trim();
  if (!barcode) {
    showToast("Informe um codigo de barras.", "error");
    return;
  }

  try {
    const item = await lookupProductByBarcodeValue(barcode, { stockType: "COMMON" });
    showToast(`Produto encontrado: ${item.name}`);
  } catch (error) {
    if (isBarcodeNotFoundError(error)) {
      await prepareNewProductFromBarcode(barcode);
      return;
    }
    showToast(error.message, "error");
  }
}

function handleInteractivePanels(event) {
  const dashboardActionButton = event.target.closest(
    "[data-dashboard-save-odometer], [data-dashboard-clear-odometer], [data-dashboard-toggle-odometer], [data-dashboard-cancel-odometer]"
  );
  if (dashboardActionButton) {
    if (dashboardActionButton.dataset.dashboardToggleOdometer) {
      toggleDashboardOdometerEditor(dashboardActionButton.dataset.dashboardToggleOdometer);
      return;
    }

    if (dashboardActionButton.dataset.dashboardCancelOdometer) {
      cancelDashboardOdometerEditor(dashboardActionButton.dataset.dashboardCancelOdometer);
      return;
    }

    const recordId =
      dashboardActionButton.dataset.dashboardSaveOdometer ||
      dashboardActionButton.dataset.dashboardClearOdometer ||
      "";
    saveDashboardOdometerChange(recordId, dashboardActionButton.hasAttribute("data-dashboard-clear-odometer")).catch(
      (error) => showToast(error.message, "error")
    );
    return;
  }

  const dashboardLazyButton = event.target.closest("[data-dashboard-load-chart]");
  if (dashboardLazyButton) {
    if (dashboardLazyButton.dataset.dashboardLoadChart === "fuel") {
      state.dashboard.lazy.fuelChartLoaded = true;
      renderDashboard();
    }
    return;
  }

  const noteSaveButton = event.target.closest("[data-note-inline-save]");
  if (noteSaveButton) {
    saveInlineNoteEditing(noteSaveButton.dataset.noteInlineSave).catch((error) => showToast(error.message, "error"));
    return;
  }

  const noteCancelButton = event.target.closest("[data-note-inline-cancel]");
  if (noteCancelButton) {
    cancelInlineNoteEditing();
    return;
  }

  const noteFinanceNowButton = event.target.closest("[data-note-set-finance-today]");
  if (noteFinanceNowButton) {
    setInlineNoteFinanceNow(noteFinanceNowButton.dataset.noteSetFinanceToday);
    return;
  }

  const scheduleDuplicateLineButton = event.target.closest("[data-schedule-line-duplicate]");
  if (scheduleDuplicateLineButton) {
    duplicateScheduleDraftLine(scheduleDuplicateLineButton.dataset.scheduleLineDuplicate);
    return;
  }

  const scheduleRemoveLineButton = event.target.closest("[data-schedule-line-remove]");
  if (scheduleRemoveLineButton) {
    removeScheduleDraftLine(scheduleRemoveLineButton.dataset.scheduleLineRemove);
    return;
  }

  const scheduleFocusLineButton = event.target.closest("[data-schedule-focus-line]");
  if (scheduleFocusLineButton) {
    focusScheduleLine(scheduleFocusLineButton.dataset.scheduleFocusLine);
    return;
  }

  const scheduleHistoryOpenButton = event.target.closest("[data-schedule-history-open]");
  if (scheduleHistoryOpenButton) {
    openScheduleHistoryDay(scheduleHistoryOpenButton.dataset.scheduleHistoryOpen).catch((error) =>
      showToast(error.message, "error")
    );
    return;
  }

  const scheduleHistoryDuplicateButton = event.target.closest("[data-schedule-history-duplicate]");
  if (scheduleHistoryDuplicateButton) {
    openScheduleHistoryDay(scheduleHistoryDuplicateButton.dataset.scheduleHistoryDuplicate, { duplicate: true }).catch(
      (error) => showToast(error.message, "error")
    );
    return;
  }

  const scheduleHistoryPrintButton = event.target.closest("[data-schedule-history-print]");
  if (scheduleHistoryPrintButton) {
    openScheduleHistoryDay(scheduleHistoryPrintButton.dataset.scheduleHistoryPrint, { printMode: "pdf" }).catch(
      (error) => showToast(error.message, "error")
    );
    return;
  }

  const dossierNavigationButton = event.target.closest("[data-dossier-navigate]");
  if (dossierNavigationButton) {
    navigateVehicleDossierContext(dossierNavigationButton.dataset.dossierNavigate);
    return;
  }

  const shortcut = event.target.closest("[data-fuel-shortcut]");
  if (shortcut) {
    const action = shortcut.dataset.fuelShortcut;
    if (action === "new") {
      scrollToElement(refs.fuelForm);
      refs.fuelForm.elements.vehicleId.focus();
    }

    if (action === "last7") {
      const end = currentLocalDateTime();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      refs.fuelFilterFrom.value = toLocalDateTimeInput(startDate.toISOString()).slice(0, 16);
      refs.fuelFilterTo.value = end;
      refreshFuel();
    }

    if (action === "today") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      refs.fuelFilterFrom.value = toLocalDateTimeInput(start.toISOString()).slice(0, 16);
      refs.fuelFilterTo.value = currentLocalDateTime();
      refreshFuel();
    }

    if (action === "clear") {
      clearFuelHistoryFilters();
    }
    return;
  }

  const categoryToggle = event.target.closest("[data-checklist-category-toggle]");
  if (categoryToggle) {
    const category = categoryToggle.dataset.checklistCategoryToggle;
    state.checklistCollapsedCategories = {
      ...state.checklistCollapsedCategories,
      [category]: !state.checklistCollapsedCategories[category],
    };
    renderChecklistComposer();
    return;
  }

  const checklistStatusButton = event.target.closest("[data-checklist-status-button]");
  if (!checklistStatusButton) {
    return;
  }

  const { checklistKey, checklistStatus } = checklistStatusButton.dataset;
  state.checklistDraftItems = ensureChecklistDraft().map((item) =>
    item.key === checklistKey ? { ...item, status: checklistStatus } : item
  );
  renderChecklistComposer();
}

function handleInteractiveChanges(event) {
  const focusPlateField = event.target.closest("[data-dashboard-focus-plate]");
  if (focusPlateField) {
    handleDashboardFocusPlateChange(focusPlateField.value).catch((error) => showToast(error.message, "error"));
    return;
  }

  const scheduleField = event.target.closest("[data-schedule-line-field]");
  if (scheduleField) {
    updateScheduleDraftField(
      scheduleField.dataset.scheduleLineId,
      scheduleField.dataset.scheduleLineField,
      scheduleField.value
    );
  }
}

function handleInteractiveInputs(event) {
  const scheduleField = event.target.closest("[data-schedule-line-field]");
  if (scheduleField) {
    updateScheduleDraftField(
      scheduleField.dataset.scheduleLineId,
      scheduleField.dataset.scheduleLineField,
      scheduleField.value
    );
    return;
  }

  const notesField = event.target.closest("[data-checklist-item-notes]");
  if (!notesField) {
    return;
  }

  const checklistKey = notesField.dataset.checklistItemNotes;
  state.checklistDraftItems = ensureChecklistDraft().map((item) =>
    item.key === checklistKey ? { ...item, notes: notesField.value } : item
  );
}

async function handleFineSubmit(event) {
  event.preventDefault();
  const id = refs.fineForm.elements.id.value;

  const payload = {
    fineDate: refs.fineForm.elements.fineDate.value,
    plate: refs.fineForm.elements.plate.value,
    driver: refs.fineForm.elements.driver.value,
    status: refs.fineForm.elements.status.value,
    amount: refs.fineForm.elements.amount.value,
    notes: refs.fineForm.elements.notes.value,
  };

  try {
    await api(id ? `/api/fines/${id}` : "/api/fines", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetFineForm();
    await Promise.all([refreshFines(), maybeRefreshAdmin()]);
    showToast(id ? "Multa atualizada." : "Multa cadastrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleChecklistSubmit(event) {
  event.preventDefault();
  const id = refs.checklistForm.elements.id.value;

  const payload = {
    vehicle: refs.checklistForm.elements.vehicle.value,
    checklistDate: refs.checklistForm.elements.checklistDate.value,
    status: refs.checklistForm.elements.status.value,
    items: refs.checklistForm.elements.items.value,
    problems: refs.checklistForm.elements.problems.value,
  };

  try {
    await api(id ? `/api/checklists/${id}` : "/api/checklists", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetChecklistForm();
    await Promise.all([refreshChecklists(), maybeRefreshAdmin()]);
    showToast(id ? "Checklist atualizado." : "Checklist cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleEmailSubmit(event) {
  event.preventDefault();

  const payload = {
    sender: refs.emailForm.elements.sender.value,
    subject: refs.emailForm.elements.subject.value,
    receivedAt: toIsoDateTime(refs.emailForm.elements.receivedAt.value),
    body: refs.emailForm.elements.body.value,
    xmlContent: refs.emailForm.elements.xmlContent.value,
    rawEml: refs.emailForm.elements.rawEml.value,
  };

  try {
    await api("/api/emails/process", { method: "POST", body: payload });
    refs.emailForm.reset();
    refs.emailForm.elements.receivedAt.value = currentLocalDateTime();
    await Promise.all([refreshEmails(), refreshNotes(), refreshDashboard(), maybeRefreshAdmin()]);
    showToast("Email processado com sucesso.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function resetAdminUserForm() {
  refs.adminUserForm.reset();
  refs.adminUserForm.elements.id.value = "";
  refs.adminUserForm.elements.role.value = "OPERATIONAL";
}

function resetNoteForm() {
  refs.noteForm.reset();
  refs.noteForm.elements.id.value = "";
  refs.noteForm.elements.status.value = "NEW";
  refs.noteForm.elements.category.value = "LOGISTICS";
  refs.noteForm.elements.issueDate.value = currentLocalDateTime();
}

function resetProductForm() {
  refs.productForm.reset();
  refs.productForm.elements.id.value = "";
  refs.productForm.elements.unit.value = "UN";
  refs.productForm.elements.minStock.value = 0;
  refs.productForm.elements.defaultCost.value = 0;
  refs.productForm.elements.initialStock.value = 0;
  refs.productForm.elements.initialStock.disabled = false;
}

function resetVehicleForm() {
  if (!refs.vehicleForm) {
    return;
  }

  refs.vehicleForm.reset();
  refs.vehicleForm.elements.id.value = "";
  refs.vehicleForm.elements.fuelProfile.value = "S500";
  refs.vehicleForm.elements.status.value = "ACTIVE";
}

function resetFuelForm() {
  refs.fuelForm.reset();
  refs.fuelForm.elements.type.value = "EXIT";
  refs.fuelForm.elements.occurredAt.value = currentLocalDateTime();
  syncFuelFormState();
}

function resetScheduleForm() {
  refs.scheduleForm.reset();
  refs.scheduleForm.elements.id.value = "";
  refs.scheduleForm.elements.scheduledDate.value = currentLocalDate();
}

function resetFineForm() {
  refs.fineForm.reset();
  refs.fineForm.elements.id.value = "";
  refs.fineForm.elements.fineDate.value = currentLocalDate();
}

function resetChecklistForm() {
  refs.checklistForm.reset();
  refs.checklistForm.elements.id.value = "";
  refs.checklistForm.elements.checklistDate.value = currentLocalDateTime();
}

function buildKardexRequestPayload() {
  const stockType = normalizeClientStockType(refs.kardexForm.elements.stockType.value, "COMMON");
  return {
    productId: refs.kardexForm.elements.productId.value,
    stockType,
    from: refs.kardexForm.elements.from.value ? `${refs.kardexForm.elements.from.value}T00:00:00` : "",
    to: refs.kardexForm.elements.to.value ? `${refs.kardexForm.elements.to.value}T23:59:59` : "",
    branchName: refs.kardexForm.elements.branchName.value,
    fuelKind: stockType === "FUEL" ? normalizeClientFuelKind(refs.kardexForm.elements.fuelKind.value, "") : "",
    document: refs.kardexForm.elements.document.value,
    supplierName: refs.kardexForm.elements.supplierName.value,
  };
}

async function fetchKardexReport() {
  const payload = buildKardexRequestPayload();
  if (!payload.productId || !payload.from || !payload.to) {
    throw new Error("Selecione produto, data inicial e data final.");
  }

  const query = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const response = await api(`/api/reports/kardex?${query.toString()}`);
  state.kardexReport = response.report || null;
  renderKardexPreview();
  return state.kardexReport;
}

function renderKardexPreview() {
  if (!refs.kardexPreview) {
    return;
  }

  const report = state.kardexReport;
  if (!report) {
    refs.kardexPreview.innerHTML = `
      <div class="dashboard-empty">
        <strong>Ficha Kardex pronta para consulta</strong>
        <p class="muted">Selecione o produto e o periodo para visualizar, gerar PDF ou imprimir.</p>
      </div>
    `;
    return;
  }

  refs.kardexPreview.innerHTML = `
    <div class="kardex-preview">
      <div class="kardex-preview__header">
        <div>
          <span class="eyebrow">Relatorio</span>
          <h3>${escapeHtml(report.reportName)}</h3>
          <p class="muted">${escapeHtml(`${formatDateOnly(report.period.from)} a ${formatDateOnly(report.period.to)}`)}</p>
        </div>
        <div class="kardex-preview__meta">
          <span><strong>Emissao:</strong> ${escapeHtml(formatDateTime(report.issuedAt))}</span>
          <span><strong>Produto:</strong> ${escapeHtml(report.product.name)}</span>
          <span><strong>Unidade:</strong> ${escapeHtml(report.product.unit)}</span>
          <span><strong>Custo:</strong> ${escapeHtml(formatCurrency(report.currentCost || 0))}</span>
          <span><strong>Saldo anterior:</strong> ${escapeHtml(`${formatNumber(report.openingBalance || 0, 2, 2)} ${report.product.unit}`)}</span>
        </div>
      </div>
      <div class="kardex-filter-summary">
        <span class="dashboard-chip">Filial/unidade: ${escapeHtml(report.filters.branchName || "Todas")}</span>
        <span class="dashboard-chip">Combustivel: ${escapeHtml(report.filters.fuelKind ? formatFuelKindLabel(report.filters.fuelKind) : "Todos")}</span>
        <span class="dashboard-chip">Documento: ${escapeHtml(report.filters.document || "Todos")}</span>
        <span class="dashboard-chip">Fornecedor: ${escapeHtml(report.filters.supplierName || "Todos")}</span>
      </div>
      ${
        report.lastPurchase
          ? `<div class="stack-item">
              <strong>Ultima compra</strong>
              <p class="muted">${escapeHtml(
                `${formatDateTime(report.lastPurchase.date)} | ${report.lastPurchase.document || "Sem documento"} | ${report.lastPurchase.supplierName || "Sem fornecedor"}`
              )}</p>
            </div>`
          : ""
      }
      <div class="table-wrapper">
        <table class="kardex-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Data</th>
              <th>Entradas</th>
              <th>Saidas</th>
              <th>Unitario</th>
              <th>Valor total</th>
              <th>Saldo</th>
              <th>Observacao</th>
            </tr>
          </thead>
          <tbody>
            <tr class="kardex-table__opening-row">
              <td colspan="6"><strong>Saldo anterior ao periodo</strong></td>
              <td><strong>${escapeHtml(`${formatNumber(report.openingBalance || 0, 2, 2)} ${report.product.unit}`)}</strong></td>
              <td>Base do saldo acumulado</td>
            </tr>
            ${
              report.rows.length
                ? report.rows
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.document || "-")}</td>
                          <td>${escapeHtml(formatDateTime(row.date))}</td>
                          <td>${escapeHtml(row.entryQuantity ? formatNumber(row.entryQuantity, 2, 2) : "-")}</td>
                          <td>${escapeHtml(row.exitQuantity ? formatNumber(row.exitQuantity, 2, 2) : "-")}</td>
                          <td>${escapeHtml(formatCurrency(row.unitCost || 0))}</td>
                          <td>${escapeHtml(formatCurrency(row.totalCost || 0))}</td>
                          <td>${escapeHtml(`${formatNumber(row.balance || 0, 2, 2)} ${report.product.unit}`)}</td>
                          <td>${escapeHtml(row.notes || "-")}</td>
                        </tr>
                      `
                    )
                    .join("")
                : `<tr><td colspan="8" class="muted">Nenhuma movimentacao encontrada para os filtros informados.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Totais do periodo</strong></td>
              <td><strong>${escapeHtml(formatNumber(report.totals.entries || 0, 2, 2))}</strong></td>
              <td><strong>${escapeHtml(formatNumber(report.totals.exits || 0, 2, 2))}</strong></td>
              <td colspan="2"><strong>Saldo final</strong></td>
              <td><strong>${escapeHtml(`${formatNumber(report.totals.finalBalance || 0, 2, 2)} ${report.product.unit}`)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

async function handleKardexView(event) {
  event.preventDefault();

  try {
    await fetchKardexReport();
    showToast("Ficha Kardex atualizada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleChecklistSubmit(event) {
  event.preventDefault();
  const id = refs.checklistForm.elements.id.value;
  const itemsDetailed = ensureChecklistDraft();
  const payload = {
    vehicle: refs.checklistForm.elements.vehicle.value,
    checklistDate: toIsoDateTime(refs.checklistForm.elements.checklistDate.value),
    checklistType: refs.checklistForm.elements.checklistType.value,
    driverName: refs.checklistForm.elements.driverName.value,
    odometerKm: refs.checklistForm.elements.odometerKm.value,
    signatureName: refs.checklistForm.elements.signatureName.value,
    temporaryIssue: refs.checklistForm.elements.temporaryIssue?.value || "",
    status: deriveChecklistOverallStatus(itemsDetailed),
    items: itemsDetailed.map((item) => item.label).join("\n"),
    itemsDetailed,
    problems: refs.checklistForm.elements.problems.value,
  };

  try {
    await api(id ? `/api/checklists/${id}` : "/api/checklists", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetChecklistForm();
    await Promise.all([refreshChecklists(), maybeRefreshAdmin()]);

    if (state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(payload.vehicle)) {
      await loadVehicleDossierByPlate(payload.vehicle, { silent: true });
    }

    showToast(id ? "Checklist atualizado." : "Checklist cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleFuelSubmit(event) {
  event.preventDefault();
  const isExit = refs.fuelForm.elements.type.value === "EXIT";
  const selectedVehicle =
    isExit && refs.fuelForm.elements.vehicleId.value
      ? state.vehicles.find((item) => String(item.id) === String(refs.fuelForm.elements.vehicleId.value))
      : null;

  const payload = {
    storageId: refs.fuelForm.elements.storageId.value,
    type: refs.fuelForm.elements.type.value,
    vehicleId: isExit ? refs.fuelForm.elements.vehicleId.value : "",
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    occurredAt: toIsoDateTime(refs.fuelForm.elements.occurredAt.value),
    notes: refs.fuelForm.elements.notes.value,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    if (selectedVehicle && state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(selectedVehicle.plate)) {
      await loadVehicleDossierByPlate(selectedVehicle.plate, { silent: true });
    }

    showToast("Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleChecklistSubmit(event) {
  event.preventDefault();
  const id = refs.checklistForm.elements.id.value;
  const itemsDetailed = ensureChecklistDraft();
  const payload = {
    vehicle: refs.checklistForm.elements.vehicle.value,
    checklistDate: toIsoDateTime(refs.checklistForm.elements.checklistDate.value),
    checklistType: refs.checklistForm.elements.checklistType.value,
    driverName: refs.checklistForm.elements.driverName.value,
    odometerKm: refs.checklistForm.elements.odometerKm.value,
    signatureName: refs.checklistForm.elements.signatureName.value,
    temporaryIssue: refs.checklistForm.elements.temporaryIssue?.value || "",
    status: deriveChecklistOverallStatus(itemsDetailed),
    items: itemsDetailed.map((item) => item.label).join("\n"),
    itemsDetailed,
    problems: refs.checklistForm.elements.problems.value,
  };

  try {
    await api(id ? `/api/checklists/${id}` : "/api/checklists", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetChecklistForm();
    await Promise.all([refreshChecklists(), maybeRefreshAdmin()]);

    if (state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(payload.vehicle)) {
      await loadVehicleDossierByPlate(payload.vehicle, { silent: true });
    }

    showToast(id ? "Checklist atualizado." : "Checklist cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleFuelSubmit(event) {
  event.preventDefault();
  const isExit = refs.fuelForm.elements.type.value === "EXIT";
  const selectedVehicle =
    isExit && refs.fuelForm.elements.vehicleId.value
      ? state.vehicles.find((item) => String(item.id) === String(refs.fuelForm.elements.vehicleId.value))
      : null;

  const payload = {
    storageId: refs.fuelForm.elements.storageId.value,
    type: refs.fuelForm.elements.type.value,
    vehicleId: isExit ? refs.fuelForm.elements.vehicleId.value : "",
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    occurredAt: toIsoDateTime(refs.fuelForm.elements.occurredAt.value),
    notes: refs.fuelForm.elements.notes.value,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    if (selectedVehicle && state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(selectedVehicle.plate)) {
      await loadVehicleDossierByPlate(selectedVehicle.plate, { silent: true });
    }

    showToast("Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

Object.assign(statusMeta, {
  INACTIVE: { label: "Inativo", className: "status-gray" },
  AVAILABLE: { label: "Disponivel", className: "status-green" },
  MAINTENANCE: { label: "Em manutencao", className: "status-yellow" },
  WAITING_DRIVER: { label: "Aguardando condutor", className: "status-yellow" },
  PENDING_PAYMENT: { label: "Pendente de pagamento", className: "status-red" },
  ATTENTION: { label: "Atencao", className: "status-yellow" },
  CRITICAL: { label: "Critico", className: "status-red" },
  OVERDUE: { label: "Vencido", className: "status-red" },
  REPLACE_RECOMMENDED: { label: "Troca recomendada", className: "status-yellow" },
  DISCARDED: { label: "Descartado", className: "status-gray" },
});

Object.assign(NAV_ICONS, {
  dossier: "vehicle",
});

Object.assign(SECTION_ICONS, {
  dossier: "vehicle",
});

state.dossier = {
  selectedPlate: "",
  item: null,
  isLoading: false,
  error: "",
};

Object.assign(refs, {
  dossierSearchForm: $("dossier-search-form"),
  dossierPlateSearch: $("dossier-plate-search"),
  dossierVehicleList: $("dossier-vehicle-list"),
  dossierClearButton: $("dossier-clear-button"),
  dossierSearchFeedback: $("dossier-search-feedback"),
  dossierEmptyState: $("dossier-empty-state"),
  dossierContent: $("dossier-content"),
  dossierSummaryShell: $("dossier-summary-shell"),
  dossierAlertCards: $("dossier-alert-cards"),
  dossierSections: $("dossier-sections"),
});

document.addEventListener("DOMContentLoaded", initializeVehicleDossierModule);

function initializeVehicleDossierModule() {
  refs.dossierSearchForm?.addEventListener("submit", handleVehicleDossierSearchSubmit);
  refs.dossierPlateSearch?.addEventListener("change", handleVehicleDossierPlateChange);
  refs.dossierPlateSearch?.addEventListener("input", debounce(handleVehicleDossierPlateInput, 180));
  refs.dossierClearButton?.addEventListener("click", () => clearVehicleDossier(false));
  refs.dossierSections?.addEventListener("click", handleVehicleDossierSectionActions);
  renderVehicleDossierVehicleList();
  renderVehicleDossier();
}

function normalizeClientPlateKey(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function findRegisteredVehicleByPlate(value) {
  const normalizedKey = normalizeClientPlateKey(value);
  if (!normalizedKey) {
    return null;
  }
  return state.vehicles.find((item) => normalizeClientPlateKey(item.plate) === normalizedKey) || null;
}

function setVehicleDossierFeedback(message, tone = "muted") {
  if (!refs.dossierSearchFeedback) {
    return;
  }
  refs.dossierSearchFeedback.textContent = message;
  refs.dossierSearchFeedback.dataset.tone = tone;
}

function renderVehicleDossierVehicleList() {
  if (!refs.dossierVehicleList) {
    return;
  }

  refs.dossierVehicleList.innerHTML = state.vehicles
    .slice()
    .sort((left, right) => String(left.plate || "").localeCompare(String(right.plate || "")))
    .map(
      (vehicle) =>
        `<option value="${escapeHtml(vehicle.plate)}">${escapeHtml(
          [vehicle.brand, vehicle.model, vehicle.sector].filter(Boolean).join(" | ") || vehicle.plate
        )}</option>`
    )
    .join("");
}

function clearVehicleDossier(preserveInput = false, message = "Selecione uma placa cadastrada para abrir o dossie completo do veiculo.") {
  state.dossier = {
    ...state.dossier,
    selectedPlate: "",
    item: null,
    isLoading: false,
    error: "",
  };
  if (!preserveInput && refs.dossierPlateSearch) {
    refs.dossierPlateSearch.value = "";
  }
  setVehicleDossierFeedback(message, message === "Veiculo nao cadastrado." ? "error" : "muted");
  renderVehicleDossier();
}

function handleVehicleDossierPlateInput() {
  const rawValue = refs.dossierPlateSearch?.value || "";
  if (!rawValue.trim()) {
    setVehicleDossierFeedback("Selecione uma placa cadastrada para abrir o dossie completo do veiculo.", "muted");
    return;
  }

  const match = findRegisteredVehicleByPlate(rawValue);
  setVehicleDossierFeedback(match ? "Placa localizada. O dossie sera carregado ao confirmar a selecao." : "Veiculo nao cadastrado.", match ? "info" : "error");
}

async function handleVehicleDossierPlateChange() {
  const rawValue = refs.dossierPlateSearch?.value || "";
  const match = findRegisteredVehicleByPlate(rawValue);
  if (!match) {
    if (rawValue.trim()) {
      clearVehicleDossier(true, "Veiculo nao cadastrado.");
    }
    return;
  }

  await loadVehicleDossierByPlate(match.plate);
}

async function handleVehicleDossierSearchSubmit(event) {
  event.preventDefault();
  const rawValue = refs.dossierPlateSearch?.value || "";
  const match = findRegisteredVehicleByPlate(rawValue);

  if (!match) {
    clearVehicleDossier(true, "Veiculo nao cadastrado.");
    return;
  }

  await loadVehicleDossierByPlate(match.plate);
}

async function loadVehicleDossierByPlate(plate, options = {}) {
  const match = findRegisteredVehicleByPlate(plate);
  if (!match) {
    clearVehicleDossier(true, "Veiculo nao cadastrado.");
    return null;
  }

  state.dossier = {
    ...state.dossier,
    selectedPlate: match.plate,
    isLoading: true,
    error: "",
  };
  if (refs.dossierPlateSearch) {
    refs.dossierPlateSearch.value = match.plate;
  }
  if (!options.silent) {
    setVehicleDossierFeedback("Carregando dossie do veiculo...", "info");
  }
  renderVehicleDossier();

  try {
    const response = await api(`/api/vehicles/dossier/${encodeURIComponent(match.plate)}`);
    state.dossier = {
      ...state.dossier,
      selectedPlate: match.plate,
      item: response.item || null,
      isLoading: false,
      error: "",
    };
    setVehicleDossierFeedback(`Dossie atualizado para a placa ${match.plate}.`, "success");
    renderVehicleDossier();
    return state.dossier.item;
  } catch (error) {
    state.dossier = {
      ...state.dossier,
      item: null,
      isLoading: false,
      error: error.message,
    };
    setVehicleDossierFeedback(error.message || "Falha ao carregar o dossie.", "error");
    renderVehicleDossier();
    return null;
  }
}

function dossierAlertToneClass(status) {
  if (status === "CRITICAL" || status === "OVERDUE") {
    return "dossier-alert-card--critical";
  }
  if (status === "ATTENTION") {
    return "dossier-alert-card--attention";
  }
  return "dossier-alert-card--ok";
}

function buildVehicleDossierEmptyState(title, description) {
  return `
    <div class="dashboard-empty">
      <strong>${escapeHtml(title)}</strong>
      <p class="muted">${escapeHtml(description)}</p>
    </div>
  `;
}

function formatOptionalDistance(value) {
  return value === null || value === undefined ? "-" : formatDistance(value);
}

function formatOptionalDateTime(value) {
  return value ? formatDateTime(value) : "-";
}

function formatOptionalDate(value) {
  return value ? formatDateOnly(value) : "-";
}

function formatChecklistSnapshot(item) {
  if (!item) {
    return "Sem checklist recente.";
  }
  return `${item.itemSummary?.ok || 0} OK • ${item.itemSummary?.attention || 0} atencao • ${item.itemSummary?.critical || 0} critico`;
}

function getVehicleDossierOverallStatusMeta(dossier) {
  const alerts = Array.isArray(dossier?.alerts) ? dossier.alerts : [];
  if (alerts.some((item) => item.status === "CRITICAL" || item.status === "OVERDUE")) {
    return { key: "danger", label: "Critico", detail: "Existe pendencia com impacto operacional imediato." };
  }
  if (alerts.some((item) => item.status === "ATTENTION") || dossier?.summary?.status === "MAINTENANCE") {
    return { key: "warning", label: "Atencao", detail: "O veiculo exige conferencia antes da decisao final." };
  }
  return { key: "ok", label: "OK", detail: "Sem bloqueio critico consolidado no momento." };
}

function buildVehicleDossierActionState(title, description, actionLabel, action) {
  return `
    <div class="dashboard-empty">
      <strong>${escapeHtml(title)}</strong>
      <p class="muted">${escapeHtml(description)}</p>
      ${
        actionLabel && action
          ? `<button type="button" class="secondary-button" data-dossier-navigate="${escapeHtml(action)}">${escapeHtml(actionLabel)}</button>`
          : ""
      }
    </div>
  `;
}

function buildVehicleDossierSummary(dossier) {
  const summary = dossier.summary || {};
  const vehicle = dossier.vehicle || {};
  const scheduleEntry = dossier.todaySchedule?.entries?.[0] || null;
  const lastRecord = dossier.fuel?.lastRecord || null;
  const statusMeta = getVehicleDossierOverallStatusMeta(dossier);
  const fuelRecordsCount = Array.isArray(dossier.fuel?.records) ? dossier.fuel.records.length : 0;
  const scheduleValue = scheduleEntry?.driver || "Sem escala";
  const scheduleNote = scheduleEntry
    ? [scheduleEntry.location || "Rota nao informada", scheduleEntry.assistant || "Sem ajudante", scheduleEntry.departureTime || ""]
        .filter(Boolean)
        .join(" | ")
    : "Veiculo sem escala ativa hoje.";
  const sectorNote = [summary.sector || "Setor nao informado", summary.brandModel || ""].filter(Boolean).join(" | ");
  const kmSinceLastFuel =
    lastRecord &&
    Number.isFinite(Number(lastRecord.effectiveKm)) &&
    Number.isFinite(Number(lastRecord.referenceKmUsed))
      ? Math.max(Number(lastRecord.effectiveKm) - Number(lastRecord.referenceKmUsed), 0)
      : null;

  return `
    <div class="dossier-summary-top">
      <div>
        <span class="eyebrow">Placa consultada</span>
        <h3>${escapeHtml(vehicle.plate || "-")}</h3>
        <p class="muted">${escapeHtml(summary.brandModel || "Sem marca/modelo cadastrado.")}</p>
        <p class="muted">${escapeHtml(statusMeta.detail)}</p>
      </div>
      <div class="dossier-summary-badges">
        <span class="dashboard-status-pill dashboard-status-pill--${escapeHtml(statusMeta.key)}">${escapeHtml(statusMeta.label)}</span>
        ${statusBadge(summary.status)}
        ${
          summary.isAvailableToday
            ? `<span class="status-badge status-green">Disponivel hoje</span>`
            : `<span class="status-badge status-yellow">Com restricao hoje</span>`
        }
      </div>
    </div>
    <div class="dossier-summary-grid">
      <article class="dossier-summary-card">
        <span class="eyebrow">KM atual</span>
        <strong>${escapeHtml(formatOptionalDistance(summary.lastKnownKm))}</strong>
        <p class="muted">${escapeHtml(summary.lastKmSource ? `Fonte consolidada: ${summary.lastKmSource}` : "Sem KM consolidado ainda.")}</p>
      </article>
      <article class="dossier-summary-card">
        <span class="eyebrow">KM desde o ultimo abastecimento</span>
        <strong>${escapeHtml(kmSinceLastFuel === null ? "-" : formatDistance(kmSinceLastFuel))}</strong>
        <p class="muted">${escapeHtml(lastRecord ? `Baseado em ${formatOptionalDateTime(lastRecord.occurredAt)}` : "Sem abastecimento recente para comparar.")}</p>
      </article>
      <article class="dossier-summary-card">
        <span class="eyebrow">Media KM/L real</span>
        <strong>${escapeHtml(formatKmPerLiter(dossier.fuel?.averageKmPerLiter || 0))}</strong>
        <p class="muted">${escapeHtml(fuelRecordsCount ? `Leitura consolidada em ${formatNumber(fuelRecordsCount)} abastecimento(s).` : "Aguardando historico suficiente de abastecimento.")}</p>
      </article>
      <article class="dossier-summary-card">
        <span class="eyebrow">Status geral</span>
        <strong>${escapeHtml(statusMeta.label)}</strong>
        <p class="muted">${escapeHtml(
          `${statusMeta.detail}${Number(summary.criticalAlertCount || 0) ? ` ${formatNumber(summary.criticalAlertCount || 0)} alerta(s) critico(s) em aberto.` : ""}`
        )}</p>
      </article>
      <article class="dossier-summary-card">
        <span class="eyebrow">Operacao do dia</span>
        <strong>${escapeHtml(scheduleValue)}</strong>
        <p class="muted">${escapeHtml(scheduleNote)}</p>
      </article>
      <article class="dossier-summary-card">
        <span class="eyebrow">Combustivel / operacao</span>
        <strong>${escapeHtml(formatVehicleFuelProfile(summary.fuelProfile))}</strong>
        <p class="muted">${escapeHtml(sectorNote || "Sem setor principal informado.")}</p>
      </article>
    </div>
    <div class="dossier-summary-actions">
      <button type="button" class="dossier-action-card" data-dossier-navigate="fuel">Ver abastecimento</button>
      <button type="button" class="dossier-action-card" data-dossier-navigate="checklist">Registrar checklist</button>
      <button type="button" class="dossier-action-card" data-dossier-navigate="schedule">Abrir escala</button>
      <button type="button" class="dossier-action-card" data-dossier-navigate="fine">Registrar multa</button>
    </div>
  `;
}

function buildVehicleDossierAlertCards(dossier) {
  if (!Array.isArray(dossier.alerts) || !dossier.alerts.length) {
    return buildVehicleDossierEmptyState("Sem alertas cadastrados", "Os status principais do veiculo aparecem aqui.");
  }

  return dossier.alerts
    .map(
      (alert) => `
        <article class="dossier-alert-card ${dossierAlertToneClass(alert.status)}">
          <div class="dossier-alert-card__head">
            <span class="eyebrow">${escapeHtml(alert.label)}</span>
            ${statusBadge(alert.status)}
          </div>
          <strong>${escapeHtml(alert.summary || "-")}</strong>
        </article>
      `
    )
    .join("");
}

function buildVehicleDossierKeyFacts(items = []) {
  return `
    <div class="dossier-facts-grid">
      ${items
        .map(
          (item) => `
            <article class="dossier-fact-card">
              <span class="eyebrow">${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value || "-")}</strong>
              ${item.note ? `<p class="muted">${escapeHtml(item.note)}</p>` : ""}
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function buildVehicleDossierTable(headers = [], rowsHtml = "", emptyMessage = "Sem registros.") {
  return `
    <div class="table-wrapper dossier-table-wrapper">
      <table class="dashboard-compact-table">
        <thead>
          <tr>
            ${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="${headers.length}" class="muted">${escapeHtml(emptyMessage)}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function buildVehicleDossierSection(title, description, content, open = false) {
  return `
    <details class="dossier-section-panel" ${open ? "open" : ""}>
      <summary>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(description)}</p>
        </div>
      </summary>
      <div class="dossier-section-panel__body">
        ${content}
      </div>
    </details>
  `;
}

function buildVehicleDossierSummarySection(dossier) {
  const summary = dossier.summary || {};
  const checklist = dossier.checklist?.last || null;
  const lastFine = dossier.fines?.records?.[0] || null;
  const firstAlert = (dossier.alerts || []).find((item) => item.status === "CRITICAL" || item.status === "OVERDUE") || null;

  return buildVehicleDossierSection(
    "Resumo",
    "Leitura geral para responder rapido se o veiculo pode operar hoje.",
    `
      ${buildVehicleDossierKeyFacts([
        {
          label: "Disponibilidade hoje",
          value: summary.isAvailableToday ? "Disponivel" : "Com restricao",
          note: summary.isAvailableToday ? "Sem bloqueio critico e sem escala em aberto." : "Verifique alertas, escala e status operacional.",
        },
        {
          label: "Condutor de hoje",
          value: dossier.todaySchedule?.entries?.[0]?.driver || "Sem motorista escalado",
          note: dossier.todaySchedule?.entries?.[0]?.assistant || "Sem ajudante informado",
        },
        {
          label: "Checklist atual",
          value: formatChecklistSnapshot(checklist),
          note: checklist ? formatOptionalDateTime(checklist.checklistDate) : "Sem checklist recente.",
        },
        {
          label: "Principal pendencia",
          value: firstAlert?.label || "Sem criticidade ativa",
          note: firstAlert?.summary || "Sem bloqueio critico consolidado.",
        },
        {
          label: "Ultima multa",
          value: lastFine ? statusMeta[lastFine.status]?.label || lastFine.status : "Sem multas",
          note: lastFine ? `${formatOptionalDate(lastFine.fineDate)} • ${formatCurrency(lastFine.amount || 0)}` : "Sem multas registradas.",
        },
        {
          label: "Consumo medio",
          value: formatKmPerLiter(dossier.fuel?.averageKmPerLiter || 0),
          note: `Base do periodo analisado: ${dossier.fuel?.periodDays || 90} dias`,
        },
      ])}
    `,
    true
  );
}

function buildVehicleDossierTodayScheduleSection(dossier) {
  const entries = dossier.todaySchedule?.entries || [];
  if (!entries.length) {
    return buildVehicleDossierSection(
      "Escala de hoje",
      "Consulta se o veiculo esta escalado na data atual.",
      buildVehicleDossierActionState(
        "Veiculo sem escala para a data atual.",
        "Nao ha motorista, ajudante ou rota vinculados para hoje.",
        "Abrir escala",
        "schedule"
      )
    );
  }

  return buildVehicleDossierSection(
    "Escala de hoje",
    "Consulta se o veiculo esta escalado na data atual.",
    `
      <div class="dossier-card-stack">
        ${entries
          .map(
            (entry) => `
              <article class="dossier-stack-card">
                <div class="dossier-stack-card__top">
                  <strong>${escapeHtml(formatOptionalDate(entry.scheduledDate))}</strong>
                  <span class="muted">${escapeHtml(entry.departureTime || "Hora nao informada")}</span>
                </div>
                <p><strong>Motorista:</strong> ${escapeHtml(entry.driver || "-")}</p>
                <p><strong>Ajudante:</strong> ${escapeHtml(entry.assistant || "-")}</p>
                <p><strong>Local / rota:</strong> ${escapeHtml(entry.location || "-")}</p>
                <p><strong>Observacao:</strong> ${escapeHtml(entry.notes || entry.dayNotes || "-")}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `
  );
}

function buildVehicleDossierFuelSection(dossier) {
  const fuel = dossier.fuel || {};
  const lastRecord = fuel.lastRecord || null;
  const fuelWarnings = [];

  if (Number(fuel.inconsistentCount || 0) > 0) {
    fuelWarnings.push(`${fuel.inconsistentCount} abastecimento(s) com KM inconsistente.`);
  }
  if (Number(fuel.outlierCount || 0) > 0) {
    fuelWarnings.push(`${fuel.outlierCount} media(s) KM/L fora do padrao.`);
  }

  return buildVehicleDossierSection(
    "Abastecimento",
    "Ultimos abastecimentos, media KM/L, KM corrigido e anomalias de consumo.",
    `
      ${buildVehicleDossierKeyFacts([
        {
          label: "Ultimo abastecimento",
          value: lastRecord ? formatOptionalDateTime(lastRecord.occurredAt) : "Sem abastecimento registrado",
          note: lastRecord ? `${formatLiters(lastRecord.quantity)} L de ${formatFuelKindLabel(lastRecord.fuelKind)}` : "Sem historico de abastecimento.",
        },
        {
          label: "KM utilizado",
          value: lastRecord ? formatOptionalDistance(lastRecord.effectiveKm) : "-",
          note: lastRecord && lastRecord.correctedKm !== null ? `KM original preservado: ${formatOptionalDistance(lastRecord.originalKm)}` : "Sem correcao de KM neste abastecimento.",
        },
        {
          label: "Media KM/L",
          value: formatKmPerLiter(fuel.averageKmPerLiter || 0),
          note: `Periodo consolidado: ${fuel.periodDays || 90} dias`,
        },
        {
          label: "Total abastecido",
          value: `${formatLiters(fuel.totalPeriodLiters || 0)} L`,
          note: `${formatOptionalDate(fuel.periodStart)} ate ${formatOptionalDate(fuel.periodEnd)}`,
        },
      ])}
      ${
        fuelWarnings.length
          ? `<div class="dossier-inline-notes">${fuelWarnings
              .map((item) => `<article class="dossier-inline-note">${escapeHtml(item)}</article>`)
              .join("")}</div>`
          : ""
      }
      ${buildVehicleDossierTable(
        ["Data", "Combustivel", "Litros", "KM usado", "KM original", "Media KM/L", "Status"],
        (fuel.records || [])
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(formatOptionalDateTime(item.occurredAt))}</td>
                <td>${escapeHtml(formatFuelKindLabel(item.fuelKind))}</td>
                <td>${escapeHtml(`${formatLiters(item.quantity)} L`)}</td>
                <td>${escapeHtml(formatOptionalDistance(item.effectiveKm))}</td>
                <td>${escapeHtml(formatOptionalDistance(item.originalKm))}</td>
                <td>${escapeHtml(formatKmPerLiter(item.averageKmPerLiter || 0))}</td>
                <td>${statusBadge(item.kmInconsistent ? "CRITICAL" : item.averageOutOfPattern ? "ATTENTION" : "OK")}</td>
              </tr>
            `
          )
          .join(""),
        "Sem abastecimentos vinculados ao veiculo."
      )}
    `
  );
}

function buildVehicleDossierMaintenanceSection(dossier) {
  const maintenance = dossier.maintenance || {};
  const oilChange = maintenance.oilChange || null;
  const others = maintenance.others || [];

  return buildVehicleDossierSection(
    "Manutencao",
    "Troca de oleo, manutencoes preventivas e distancia restante para vencimento.",
    `
      ${buildVehicleDossierKeyFacts([
        {
          label: "Ultima troca de oleo",
          value: oilChange?.performedAt ? formatOptionalDateTime(oilChange.performedAt) : "Sem manutencao registrada",
          note: oilChange?.odometerKm !== null && oilChange?.odometerKm !== undefined ? `KM da troca: ${formatOptionalDistance(oilChange.odometerKm)}` : oilChange?.message || "Sem manutencao registrada.",
        },
        {
          label: "Proxima troca",
          value: oilChange?.dueKm !== null && oilChange?.dueKm !== undefined ? formatOptionalDistance(oilChange.dueKm) : "-",
          note: oilChange?.message || "Sem previsao de troca configurada.",
        },
        {
          label: "KM atual",
          value: formatOptionalDistance(maintenance.currentKm),
          note: "Consolidado pelo ultimo KM confiavel do dossie.",
        },
        {
          label: "Status do oleo",
          value: statusMeta[oilChange?.status || "ATTENTION"]?.label || "Atencao",
          note: oilChange?.message || "Sem manutencao registrada.",
        },
      ])}
      ${buildVehicleDossierTable(
        ["Data", "Tipo", "Servico", "KM", "Proximo vencimento", "Status"],
        others
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(formatOptionalDateTime(item.performedAt))}</td>
                <td>${escapeHtml(item.maintenanceType)}</td>
                <td>${escapeHtml(item.title || "-")}</td>
                <td>${escapeHtml(formatOptionalDistance(item.odometerKm))}</td>
                <td>${escapeHtml(formatOptionalDistance(item.dueKm))}</td>
                <td>${statusBadge(item.status || "ATTENTION")}</td>
              </tr>
            `
          )
          .join(""),
        "Sem outras manutencoes preventivas cadastradas."
      )}
    `
  );
}

function buildVehicleDossierTireSection(dossier) {
  const tires = dossier.tires || {};
  const installed = tires.installed || [];

  return buildVehicleDossierSection(
    "Pneus",
    "Controle dos pneus instalados, retirados, em estoque e historico de troca ou rodizio.",
    `
      ${
        installed.length
          ? `<div class="dossier-card-grid dossier-card-grid--tires">
              ${installed
                .map(
                  (tire) => `
                    <article class="dossier-tire-card">
                      <div class="dossier-tire-card__head">
                        <strong>${escapeHtml(tire.code)}</strong>
                        ${statusBadge(tire.status)}
                      </div>
                      <p><strong>Tipo:</strong> ${escapeHtml(tire.tireType === "RECAP" ? "Recapado" : "Novo")}</p>
                      <p><strong>Posicao:</strong> ${escapeHtml(tire.position || "-")}</p>
                      <p><strong>KM instalacao:</strong> ${escapeHtml(formatOptionalDistance(tire.installedKm))}</p>
                      <p><strong>KM atual:</strong> ${escapeHtml(formatOptionalDistance(tire.currentKm))}</p>
                      <p><strong>KM rodado:</strong> ${escapeHtml(formatOptionalDistance(tire.kmDriven))}</p>
                      <p><strong>KM restante:</strong> ${escapeHtml(formatOptionalDistance(tire.estimatedRemainingKm))}</p>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : buildVehicleDossierEmptyState("Sem pneus vinculados.", "Vincule pneus ao veiculo para acompanhar desgaste, troca e rodizio.")
      }
      ${buildVehicleDossierTable(
        ["Data", "Evento", "Pneu", "Origem", "Destino", "KM", "Usuario"],
        (tires.history || [])
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(formatOptionalDateTime(item.occurredAt))}</td>
                <td>${escapeHtml(item.eventType)}</td>
                <td>${escapeHtml(item.tireCode || "-")}</td>
                <td>${escapeHtml(item.positionFrom || "-")}</td>
                <td>${escapeHtml(item.positionTo || "-")}</td>
                <td>${escapeHtml(formatOptionalDistance(item.odometerKm))}</td>
                <td>${escapeHtml(item.userName || "-")}</td>
              </tr>
            `
          )
          .join(""),
        "Sem historico de troca ou rodizio."
      )}
      ${buildVehicleDossierTable(
        ["Pneu", "Status", "Saida", "KM remocao"],
        (tires.removed || [])
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.code)}</td>
                <td>${statusBadge(item.status)}</td>
                <td>${escapeHtml(formatOptionalDateTime(item.removedAt))}</td>
                <td>${escapeHtml(formatOptionalDistance(item.removedKm))}</td>
              </tr>
            `
          )
          .join(""),
        "Sem pneus removidos."
      )}
      ${buildVehicleDossierTable(
        ["Pneu", "Tipo", "Status", "Observacao"],
        (tires.stock || [])
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.code)}</td>
                <td>${escapeHtml(item.tireType === "RECAP" ? "Recapado" : "Novo")}</td>
                <td>${statusBadge(item.status)}</td>
                <td>${escapeHtml(item.notes || "-")}</td>
              </tr>
            `
          )
          .join(""),
        "Sem pneus em estoque vinculados."
      )}
    `
  );
}

function buildVehicleDossierChecklistSection(dossier) {
  const checklist = dossier.checklist?.last || null;
  const highlights = dossier.checklist?.highlights || [];

  if (!checklist) {
    return buildVehicleDossierSection(
      "Checklist",
      "Ultima vistoria do veiculo, itens em atencao e observacoes principais.",
      buildVehicleDossierActionState(
        "Sem checklist recente",
        "Registre a vistoria para liberar uma leitura operacional mais confiavel da placa.",
        "Registrar checklist",
        "checklist"
      )
    );
  }

  return buildVehicleDossierSection(
    "Checklist",
    "Ultima vistoria do veiculo, itens em atencao e observacoes principais.",
    `
      ${buildVehicleDossierKeyFacts([
        {
          label: "Ultimo checklist",
          value: checklist ? formatOptionalDateTime(checklist.checklistDate) : "Sem checklist recente",
          note: checklist ? checklist.driverName || "Motorista nao informado" : "Sem checklist recente.",
        },
        {
          label: "Status geral",
          value: checklist ? statusMeta[checklist.status]?.label || checklist.status : "-",
          note: checklist ? `${checklist.checklistType || "PRE_USE"}` : "Sem checklist recente.",
        },
        {
          label: "Itens OK",
          value: checklist ? formatNumber(checklist.itemSummary?.ok || 0) : "0",
          note: "Itens aprovados na ultima vistoria",
        },
        {
          label: "Itens em atencao",
          value: checklist ? formatNumber(checklist.itemSummary?.attention || 0) : "0",
          note: "Pendencias de media prioridade",
        },
        {
          label: "Itens criticos",
          value: checklist ? formatNumber(checklist.itemSummary?.critical || 0) : "0",
          note: "Pendencias com impacto operacional",
        },
        {
          label: "KM informado",
          value: checklist ? formatOptionalDistance(checklist.odometerKm) : "-",
          note: checklist?.signatureName || "Sem assinatura registrada.",
        },
      ])}
      ${
        highlights.length
          ? `<div class="dossier-inline-notes">
              ${highlights.map((item) => `<article class="dossier-inline-note">${escapeHtml(item)}</article>`).join("")}
            </div>`
          : buildVehicleDossierActionState(
              "Sem observacoes criticas.",
              "O ultimo checklist nao trouxe pendencias adicionais. Se necessario, registre uma nova conferencia.",
              "Registrar checklist",
              "checklist"
            )
      }
    `
  );
}

function buildVehicleDossierFinesSection(dossier) {
  const fines = dossier.fines || {};
  const summary = fines.summary || {};
  const records = fines.records || [];

  return buildVehicleDossierSection(
    "Multas",
    "Pendencias por placa, status financeiro e documentos vinculados quando existirem.",
    `
      ${buildVehicleDossierKeyFacts([
        {
          label: "Multas abertas",
          value: formatNumber(summary.openCount || 0),
          note: "Ocorrencias ainda sem encerramento",
        },
        {
          label: "Aguardando condutor",
          value: formatNumber(summary.waitingDriverCount || 0),
          note: "Dependem de identificacao ou retorno do condutor",
        },
        {
          label: "Pendentes de pagamento",
          value: formatNumber(summary.pendingPaymentCount || 0),
          note: "Demandam tratativa financeira",
        },
      ])}
      ${
        records.length
          ? buildVehicleDossierTable(
              ["Data", "Condutor", "Valor", "Status", "Observacao", "Documento"],
              records
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHtml(formatOptionalDate(item.fineDate))}</td>
                      <td>${escapeHtml(item.driver || "-")}</td>
                      <td>${escapeHtml(formatCurrency(item.amount || 0))}</td>
                      <td>${statusBadge(item.status)}</td>
                      <td>${escapeHtml(item.notes || "-")}</td>
                      <td>${escapeHtml(item.documentName || item.documentUrl || "-")}</td>
                    </tr>
                  `
                )
                .join(""),
              "Sem multas em aberto."
            )
          : buildVehicleDossierActionState(
              "Sem multas vinculadas",
              "Quando houver autuacao ou divergencia financeira, registre a multa para acompanhar por placa.",
              "Registrar multa",
              "fine"
            )
      }
    `
  );
}

function buildVehicleDossierTimelineSection(dossier) {
  const timeline = dossier.timeline || [];
  return buildVehicleDossierSection(
    "Historico",
    "Linha do tempo operacional do veiculo com eventos dos modulos integrados.",
    timeline.length
      ? `
          <div class="dossier-timeline">
            ${timeline
              .map(
                (item) => `
                  <article class="dossier-timeline__item">
                    <div class="dossier-timeline__meta">
                      <strong>${escapeHtml(formatOptionalDateTime(item.occurredAt))}</strong>
                      <span>${escapeHtml(item.type)}</span>
                    </div>
                    <p>${escapeHtml(item.description || "-")}</p>
                    <span class="muted">${escapeHtml(item.userName || "Sistema")}</span>
                  </article>
                `
              )
              .join("")}
          </div>
        `
      : buildVehicleDossierEmptyState("Sem historico operacional.", "Os eventos consolidados do veiculo aparecem aqui.")
  );
}

function buildVehicleDossierDocumentsSection() {
  return buildVehicleDossierSection(
    "Documentos",
    "Geracao do PDF, impressao do dossie e exportacao do historico do veiculo.",
    `
      <div class="dossier-document-actions">
        <button type="button" class="secondary-button" data-dossier-action="pdf">Gerar PDF do dossie</button>
        <button type="button" class="ghost-button" data-dossier-action="print">Imprimir dossie</button>
        <button type="button" class="ghost-button" data-dossier-action="export-history">Exportar historico</button>
        <button type="button" class="ghost-button" data-dossier-action="related-report">Ver Kardex/relatorio relacionado</button>
      </div>
      <p class="muted">O PDF usa a identidade visual configurada da empresa. Na impressao, selecione a opcao Salvar como PDF se quiser o arquivo final.</p>
    `
  );
}

function renderVehicleDossier() {
  if (!refs.dossierEmptyState || !refs.dossierContent || !refs.dossierSummaryShell || !refs.dossierAlertCards || !refs.dossierSections) {
    return;
  }

  if (state.dossier.isLoading) {
    refs.dossierEmptyState.classList.remove("hidden");
    refs.dossierEmptyState.innerHTML = buildVehicleDossierEmptyState("Carregando dossie", "Consolidando abastecimento, escala, checklist, multas, manutencao e pneus do veiculo.");
    refs.dossierContent.classList.add("hidden");
    return;
  }

  const dossier = state.dossier.item;
  if (!dossier) {
    refs.dossierEmptyState.classList.remove("hidden");
    refs.dossierEmptyState.innerHTML = buildVehicleDossierEmptyState(
      state.dossier.error ? "Falha ao carregar o dossie" : "Dossie pronto para consulta",
      state.dossier.error || "Ao selecionar uma placa valida, o sistema consolida todos os modulos do veiculo em uma unica tela."
    );
    refs.dossierContent.classList.add("hidden");
    refs.dossierSummaryShell.innerHTML = "";
    refs.dossierAlertCards.innerHTML = "";
    refs.dossierSections.innerHTML = "";
    return;
  }

  refs.dossierEmptyState.classList.add("hidden");
  refs.dossierContent.classList.remove("hidden");
  refs.dossierSummaryShell.innerHTML = buildVehicleDossierSummary(dossier);
  refs.dossierAlertCards.innerHTML = buildVehicleDossierAlertCards(dossier);
  refs.dossierSections.innerHTML = `
    <div class="dossier-group-grid">
      <section class="panel dossier-group-panel">
        <div class="dossier-group-panel__title">
          <span class="eyebrow">Status</span>
          <h4>KM, consumo e condicao</h4>
          <p class="muted">Leitura consolidada para decidir rapido se a placa pode operar.</p>
        </div>
        ${buildVehicleDossierSummarySection(dossier)}
        ${buildVehicleDossierFuelSection(dossier)}
      </section>
      <section class="panel dossier-group-panel">
        <div class="dossier-group-panel__title">
          <span class="eyebrow">Operacao</span>
          <h4>Escala e checklist</h4>
          <p class="muted">Equipe, rota e conferencia do dia na mesma area.</p>
        </div>
        ${buildVehicleDossierTodayScheduleSection(dossier)}
        ${buildVehicleDossierChecklistSection(dossier)}
      </section>
      <section class="panel dossier-group-panel">
        <div class="dossier-group-panel__title">
          <span class="eyebrow">Financeiro</span>
          <h4>Multas e pendencias</h4>
          <p class="muted">Tudo o que impacta baixa, tratativa e rastreabilidade financeira.</p>
        </div>
        ${buildVehicleDossierFinesSection(dossier)}
      </section>
      <section class="panel dossier-group-panel">
        <div class="dossier-group-panel__title">
          <span class="eyebrow">Manutencao</span>
          <h4>Preventiva, oleo e pneus</h4>
          <p class="muted">Base para manter a frota confiavel e sem surpresa no campo.</p>
        </div>
        ${buildVehicleDossierMaintenanceSection(dossier)}
        ${buildVehicleDossierTireSection(dossier)}
      </section>
      <section class="panel dossier-group-panel">
        <div class="dossier-group-panel__title">
          <span class="eyebrow">Historico</span>
          <h4>Rastreabilidade completa</h4>
          <p class="muted">Linha do tempo, exportacao e documento consolidado do veiculo.</p>
        </div>
        ${buildVehicleDossierTimelineSection(dossier)}
        ${buildVehicleDossierDocumentsSection(dossier)}
      </section>
    </div>
  `;
  syncResponsiveTableLabels(refs.dossierContent);
}

function handleVehicleDossierSectionActions(event) {
  const button = event.target.closest("[data-dossier-action]");
  if (!button || !state.dossier.item) {
    return;
  }

  const action = button.dataset.dossierAction;
  if (action === "pdf") {
    handleVehicleDossierPrint("pdf");
  }
  if (action === "print") {
    handleVehicleDossierPrint("print");
  }
  if (action === "export-history") {
    exportVehicleDossierHistory();
  }
  if (action === "related-report") {
    openVehicleDossierRelatedReport();
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportVehicleDossierHistory() {
  const dossier = state.dossier.item;
  if (!dossier) {
    showToast("Selecione um veiculo para exportar o historico.", "error");
    return;
  }

  const lines = [
    ["Data/Hora", "Tipo", "Descricao", "Usuario"].map(csvEscape).join(";"),
    ...(dossier.timeline || []).map((item) =>
      [
        formatOptionalDateTime(item.occurredAt),
        item.type,
        item.description || "",
        item.userName || "",
      ]
        .map(csvEscape)
        .join(";")
    ),
  ];

  const blob = new Blob(["\ufeff", lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dossie-${(dossier.vehicle?.plate || "veiculo").toLowerCase()}-historico.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Historico exportado em CSV.");
}

function buildVehicleDossierPrintDocument(dossier) {
  const company = getDocumentCompany();
  const vehicle = dossier.vehicle || {};
  const summary = dossier.summary || {};
  const fuel = dossier.fuel || {};
  const maintenance = dossier.maintenance || {};
  const checklist = dossier.checklist?.last || null;
  const tires = dossier.tires?.installed || [];
  const fines = dossier.fines?.records || [];
  const timeline = (dossier.timeline || []).slice(0, 12);

  return `
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 0; }
      .print-report { padding: 14mm 12mm; }
      .print-report__grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 12px; }
      .print-report__card { border: 1px solid #d4d4d8; border-radius: 12px; padding: 10px 12px; break-inside: avoid; }
      .print-report__card strong { display: block; margin-bottom: 3px; font-size: 14px; }
      .print-report__card p { margin: 0; font-size: 11px; line-height: 1.4; }
      .print-report__section { margin-bottom: 14px; break-inside: avoid; }
      .print-report__section h2 { margin: 0 0 6px; font-size: 15px; }
      .print-report__section p { margin: 0 0 4px; font-size: 11px; line-height: 1.45; }
      .print-report__alerts { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .print-report__alert { border: 1px solid #d4d4d8; border-radius: 12px; padding: 8px 10px; }
      .print-report__alert strong { display: block; font-size: 12px; margin-bottom: 2px; }
      .print-report__table { width: 100%; border-collapse: collapse; }
      .print-report__table th, .print-report__table td { border: 1px solid #d4d4d8; padding: 6px 7px; font-size: 10px; text-align: left; vertical-align: top; }
      .print-report__table th { background: #f4f4f5; text-transform: uppercase; letter-spacing: 0.04em; }
      .print-report__footer-note { margin-top: 14px; font-size: 10px; color: #52525b; }
    </style>
    <main class="print-report">
      ${buildPrintableCompanyHeader(company, `Dossie do Veiculo - ${vehicle.plate || "-"}`, `Emitido em ${formatDateTime(new Date().toISOString())}`)}
      <section class="print-report__section">
        <h2>Resumo do veiculo</h2>
        <div class="print-report__grid">
          <article class="print-report__card">
            <strong>Veiculo</strong>
            <p>${escapeHtml(vehicle.plate || "-")}</p>
            <p>${escapeHtml(summary.brandModel || "Sem marca/modelo cadastrado.")}</p>
            <p>${escapeHtml(summary.sector || "-")}</p>
          </article>
          <article class="print-report__card">
            <strong>Status operacional</strong>
            <p>${escapeHtml(statusMeta[summary.status]?.label || summary.status || "-")}</p>
            <p>Ultimo KM: ${escapeHtml(formatOptionalDistance(summary.lastKnownKm))}</p>
            <p>Ultima atualizacao: ${escapeHtml(formatOptionalDateTime(summary.lastUpdateAt))}</p>
          </article>
        </div>
      </section>
      <section class="print-report__section">
        <h2>Alertas principais</h2>
        <div class="print-report__alerts">
          ${(dossier.alerts || [])
            .map(
              (item) => `
                <article class="print-report__alert">
                  <strong>${escapeHtml(item.label)}</strong>
                  <p>${escapeHtml(statusMeta[item.status]?.label || item.status)}</p>
                  <p>${escapeHtml(item.summary || "-")}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="print-report__section">
        <h2>Abastecimento</h2>
        <p>Ultimo abastecimento: ${escapeHtml(fuel.lastRecord ? formatOptionalDateTime(fuel.lastRecord.occurredAt) : "Sem abastecimento registrado")}</p>
        <p>Total do periodo: ${escapeHtml(`${formatLiters(fuel.totalPeriodLiters || 0)} L`)} | Media KM/L: ${escapeHtml(formatKmPerLiter(fuel.averageKmPerLiter || 0))}</p>
      </section>
      <section class="print-report__section">
        <h2>Manutencao e pneus</h2>
        <p>${escapeHtml(maintenance.oilChange?.message || "Sem manutencao registrada.")}</p>
        <p>Pneus instalados: ${escapeHtml(formatNumber(tires.length))}</p>
      </section>
      <section class="print-report__section">
        <h2>Checklist e multas</h2>
        <p>Checklist: ${escapeHtml(checklist ? `${formatOptionalDateTime(checklist.checklistDate)} • ${formatChecklistSnapshot(checklist)}` : "Sem checklist recente.")}</p>
        <p>Multas registradas: ${escapeHtml(formatNumber(fines.length))}</p>
      </section>
      <section class="print-report__section">
        <h2>Historico resumido</h2>
        <table class="print-report__table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Tipo</th>
              <th>Descricao</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            ${
              timeline.length
                ? timeline
                    .map(
                      (item) => `
                        <tr>
                          <td>${escapeHtml(formatOptionalDateTime(item.occurredAt))}</td>
                          <td>${escapeHtml(item.type)}</td>
                          <td>${escapeHtml(item.description || "-")}</td>
                          <td>${escapeHtml(item.userName || "-")}</td>
                        </tr>
                      `
                    )
                    .join("")
                : `<tr><td colspan="4">Sem historico resumido.</td></tr>`
            }
          </tbody>
        </table>
      </section>
      <div class="print-report__footer-note">${escapeHtml(company.documentFooter)}</div>
    </main>
  `;
}

async function handleVehicleDossierPrint(mode = "print") {
  const dossier = state.dossier.item;
  if (!dossier) {
    showToast("Selecione uma placa para gerar o dossie.", "error");
    return;
  }

  try {
    await runPrintWorkflow({
      type: "vehicle-dossier",
      mode,
      placeholderTitle: "Preparando Dossie do Veiculo",
      buildJob: async () => ({
        title: `Dossie do Veiculo - ${dossier.vehicle?.plate || "-"}`,
        html: buildVehicleDossierPrintDocument(dossier),
      }),
    });
    showToast(mode === "pdf" ? "Na impressao, escolha Salvar como PDF." : "Dossie aberto para impressao.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function openVehicleDossierRelatedReport() {
  const plate = state.dossier.item?.vehicle?.plate;
  if (!plate) {
    showToast("Selecione um veiculo antes de abrir o relatorio relacionado.", "error");
    return;
  }

  setSection("fuel");
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.value = plate;
  }
  renderFuel();
  scrollToElement(document.getElementById("fuel-section"));
  showToast("Modulo Combustivel filtrado para a placa selecionada.");
}

function navigateVehicleDossierContext(action) {
  const plate = state.dossier.item?.vehicle?.plate || state.dossier.selectedPlate || "";
  const scheduleEntry = state.dossier.item?.todaySchedule?.entries?.[0] || null;
  if (!plate) {
    showToast("Selecione um veiculo antes de abrir o modulo relacionado.", "error");
    return;
  }

  if (action === "fuel") {
    openVehicleDossierRelatedReport();
    return;
  }

  if (action === "checklist") {
    setSection("checklists");
    if (refs.checklistForm?.elements?.vehicle) {
      refs.checklistForm.elements.vehicle.value = plate;
    }
    if (!refs.checklistForm?.elements?.driverName?.value && scheduleEntry?.driver) {
      refs.checklistForm.elements.driverName.value = scheduleEntry.driver;
    }
    scrollToElement(refs.checklistForm);
    refs.checklistForm?.elements?.vehicle?.focus();
    showToast("Checklist preparado para a placa selecionada.");
    return;
  }

  if (action === "fine") {
    setSection("fines");
    if (refs.fineForm?.elements?.plate) {
      refs.fineForm.elements.plate.value = plate;
    }
    if (!refs.fineForm?.elements?.driver?.value && scheduleEntry?.driver) {
      refs.fineForm.elements.driver.value = scheduleEntry.driver;
    }
    scrollToElement(refs.fineForm);
    refs.fineForm?.elements?.plate?.focus();
    showToast("Formulario de multa preparado para a placa selecionada.");
    return;
  }

  if (action === "schedule") {
    setSection("schedules");
    const currentLines = normalizeScheduleDraftLines(state.schedule.draftLines || []);
    const existingLine = currentLines.find(
      (line) => normalizeClientPlateKey(line.vehicle) === normalizeClientPlateKey(plate)
    );
    const emptyLine = currentLines.find(
      (line) =>
        ![line.vehicle, line.location, line.driver, line.assistant, line.departureTime, line.notes].some((value) =>
          String(value || "").trim()
        )
    );

    let targetLineId = existingLine?.localId || "";
    if (existingLine) {
      state.schedule.draftLines = currentLines;
    } else if (emptyLine) {
      state.schedule.draftLines = currentLines.map((line) =>
        line.localId === emptyLine.localId
          ? {
              ...line,
              vehicle: plate,
              location: line.location || scheduleEntry?.location || "",
              driver: line.driver || scheduleEntry?.driver || "",
              assistant: line.assistant || scheduleEntry?.assistant || "",
            }
          : line
      );
      targetLineId = emptyLine.localId;
    } else {
      const newLine = createScheduleDraftLine({
        vehicle: plate,
        location: scheduleEntry?.location || "",
        driver: scheduleEntry?.driver || "",
        assistant: scheduleEntry?.assistant || "",
      });
      state.schedule.draftLines = [...currentLines, newLine].map((line, index) => ({ ...line, lineOrder: index + 1 }));
      targetLineId = newLine.localId;
    }

    state.schedule.previewVisible = true;
    state.schedule.hasUnsavedChanges = true;
    renderScheduleLinesEditor();
    renderSchedules();
    renderScheduleDocumentPreview();
    if (targetLineId) {
      focusScheduleLine(targetLineId);
    }
    showToast("Escala do dia preparada para a placa selecionada.");
  }
}

function openVehicleDossierFromList(id) {
  const vehicle = findById(state.vehicles, id);
  if (!vehicle) {
    return;
  }
  setSection("dossier");
  loadVehicleDossierByPlate(vehicle.plate);
}

async function refreshVehicles() {
  const response = await api("/api/vehicles");
  state.vehicles = response.items || [];
  renderVehicles();
  renderFuelVehicleOptions();
  renderVehicleDossierVehicleList();

  if (state.dossier.selectedPlate) {
    const registered = findRegisteredVehicleByPlate(state.dossier.selectedPlate);
    if (!registered) {
      clearVehicleDossier(true, "Veiculo nao cadastrado.");
    } else if (state.section === "dossier") {
      state.dossier.selectedPlate = registered.plate;
    }
  }
}

function getVehicleOperationalSnapshot(vehicle) {
  const plateKey = normalizeClientPlateKey(vehicle?.plate);
  const efficiency =
    (state.dashboard.analytics?.efficiencyRanking || []).find(
      (item) => normalizeClientPlateKey(item.plate) === plateKey
    ) || null;
  const plateAlerts = (state.dashboard.analytics?.operationalAlerts || []).filter(
    (item) => normalizeClientPlateKey(item.plate) === plateKey
  );
  const criticalAlerts = plateAlerts.filter((item) => item.severity === "CRITICAL").length;
  const warningAlerts = plateAlerts.filter((item) => item.severity === "WARNING").length;
  const todaySchedule =
    (state.dashboard.todaySchedules || []).find(
      (item) => normalizeClientPlateKey(item.vehicle) === plateKey
    ) || null;
  const currentKm =
    efficiency && Number(efficiency.lastOdometerKm || 0) > 0 ? Number(efficiency.lastOdometerKm) : null;
  const averageKmPerLiter = Number(
    efficiency?.recentAverageKmPerLiter || efficiency?.kmPerLiter || efficiency?.currentKmPerLiter || 0
  );

  let healthTone = "success";
  let healthLabel = "OK";
  let healthDetail = "Operacao estavel no periodo.";
  if (vehicle?.status === "INACTIVE") {
    healthTone = "danger";
    healthLabel = "Critico";
    healthDetail = "Veiculo marcado como inativo.";
  } else if (vehicle?.status === "MAINTENANCE" || criticalAlerts > 0) {
    healthTone = "danger";
    healthLabel = "Critico";
    healthDetail =
      vehicle?.status === "MAINTENANCE"
        ? "Veiculo em manutencao."
        : `${formatNumber(criticalAlerts)} alerta(s) critico(s) vinculado(s).`;
  } else if (warningAlerts > 0 || vehicle?.status === "AVAILABLE") {
    healthTone = "warning";
    healthLabel = "Atencao";
    healthDetail =
      warningAlerts > 0
        ? `${formatNumber(warningAlerts)} alerta(s) em atencao.`
        : "Disponivel, mas exige conferencia operacional.";
  }

  return {
    currentKm,
    averageKmPerLiter,
    todaySchedule,
    criticalAlerts,
    warningAlerts,
    healthTone,
    healthLabel,
    healthDetail,
  };
}

function renderVehicleSummaryCards(snapshots = []) {
  if (!refs.vehiclesSummaryCards) {
    return;
  }

  const criticalCount = snapshots.filter((item) => item.healthTone === "danger").length;
  const attentionCount = snapshots.filter((item) => item.healthTone === "warning").length;
  const withKmCount = snapshots.filter((item) => item.currentKm !== null).length;

  refs.vehiclesSummaryCards.innerHTML = [
    {
      label: "Veiculos ativos",
      value: formatNumber(state.vehicles.filter((item) => item.active).length),
      note: "Base operacional disponivel",
      icon: "vehicle",
      tone: "brand",
    },
    {
      label: "Com KM atualizado",
      value: formatNumber(withKmCount),
      note: "Leitura consolidada por placa",
      icon: "analytics",
      tone: "neutral",
    },
    {
      label: "Media da frota",
      value: formatKmPerLiter(state.dashboard.analytics?.efficiencySummary?.averageKmPerLiter || 0),
      note: "KM/L valido no periodo",
      icon: "efficiency",
      tone: "success",
    },
    {
      label: "Atenção / critico",
      value: `${formatNumber(attentionCount)} / ${formatNumber(criticalCount)}`,
      note: "Status geral por placa",
      icon: "alert",
      tone: criticalCount > 0 ? "danger" : attentionCount > 0 ? "warning" : "success",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card operations-kpi-card--compact",
        label: item.label,
        value: item.value,
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");
}

function renderVehicles() {
  const rows = state.vehicles.map((vehicle) => ({
    vehicle,
    snapshot: getVehicleOperationalSnapshot(vehicle),
  }));
  renderVehicleSummaryCards(rows.map((item) => item.snapshot));

  refs.vehiclesTableBody.innerHTML = rows.length
    ? state.vehicles
        .map((vehicle) => {
          const snapshot = rows.find((item) => item.vehicle.id === vehicle.id)?.snapshot || getVehicleOperationalSnapshot(vehicle);
          const operationCopy = [
            [vehicle.brand, vehicle.model].filter(Boolean).join(" / "),
            vehicle.sector || "",
            snapshot.todaySchedule?.driver ? `Motorista: ${snapshot.todaySchedule.driver}` : "",
          ]
            .filter(Boolean)
            .join(" | ");

          return `
            <tr>
              <td>
                <strong>${escapeHtml(vehicle.plate)}</strong>
                <div class="muted">${escapeHtml(vehicle.notes || "Sem observacao operacional.")}</div>
              </td>
              <td>
                <strong>${escapeHtml(snapshot.currentKm !== null ? formatDistance(snapshot.currentKm) : "-")}</strong>
                <div class="muted">${escapeHtml(
                  snapshot.todaySchedule?.location || "Sem rota do dia vinculada"
                )}</div>
              </td>
              <td>
                <strong>${escapeHtml(formatKmPerLiter(snapshot.averageKmPerLiter || 0))}</strong>
                <div class="muted">${escapeHtml(
                  snapshot.averageKmPerLiter ? "Media real dos ultimos abastecimentos coerentes" : "Aguardando historico suficiente"
                )}</div>
              </td>
              <td>
                <span class="status-badge status-${snapshot.healthTone === "danger" ? "red" : snapshot.healthTone === "warning" ? "yellow" : "green"}">${escapeHtml(snapshot.healthLabel)}</span>
                <div class="muted">${escapeHtml(snapshot.healthDetail)}</div>
              </td>
              <td>${escapeHtml(operationCopy || "Sem escala ou operacao vinculada")}</td>
              <td>${escapeHtml(formatVehicleFuelProfile(vehicle.fuelProfile))}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="ghost-button compact-button" data-action="open-dossier" data-id="${vehicle.id}">
                    Ver dossie completo
                  </button>
                  ${buildRowActionButton("edit-vehicle", vehicle.id, "Editar veiculo", "&#9998;")}
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : emptyRow("Nenhum veiculo cadastrado.", 7);

  syncResponsiveTableLabels();
}

function handleRowActions(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "edit-note") editNote(id);
  if (action === "delete-note") deleteNote(id);
  if (action === "edit-product") editProduct(id);
  if (action === "edit-vehicle") editVehicle(id);
  if (action === "open-dossier") openVehicleDossierFromList(id);
  if (action === "edit-schedule") editSchedule(id);
  if (action === "edit-fine") editFine(id);
  if (action === "edit-checklist") editChecklist(id);
  if (action === "edit-checklist-template") editChecklistTemplate(id);
  if (action === "toggle-checklist-template") toggleChecklistTemplate(id);
  if (action === "edit-user") editAdminUser(id);
  if (action === "issue-user-code") issueAdminUserCode(id, "ACTIVATION");
  if (action === "reset-user-password") issueAdminUserCode(id, "RESET_PASSWORD");
  if (action === "block-user") updateAdminUserStatus(id, "BLOCKED");
  if (action === "unblock-user") updateAdminUserStatus(id, "ACTIVE");
}

function editVehicle(id) {
  const vehicle = findById(state.vehicles, id);
  if (!vehicle) return;

  refs.vehicleForm.elements.id.value = vehicle.id;
  refs.vehicleForm.elements.plate.value = vehicle.plate;
  refs.vehicleForm.elements.fuelProfile.value = vehicle.fuelProfile;
  refs.vehicleForm.elements.brand.value = vehicle.brand || "";
  refs.vehicleForm.elements.model.value = vehicle.model || "";
  refs.vehicleForm.elements.sector.value = vehicle.sector || "";
  refs.vehicleForm.elements.status.value = vehicle.status || (vehicle.active ? "ACTIVE" : "INACTIVE");
  refs.vehicleForm.elements.notes.value = vehicle.notes || "";
  setSection("vehicles");
}

function resetVehicleForm() {
  if (!refs.vehicleForm) {
    return;
  }

  refs.vehicleForm.reset();
  refs.vehicleForm.elements.id.value = "";
  refs.vehicleForm.elements.fuelProfile.value = "S500";
  refs.vehicleForm.elements.status.value = "ACTIVE";
}

async function handleVehicleSubmit(event) {
  event.preventDefault();
  const id = refs.vehicleForm.elements.id.value;
  const previousVehicle = id ? findById(state.vehicles, id) : null;

  const payload = {
    plate: refs.vehicleForm.elements.plate.value,
    fuelProfile: refs.vehicleForm.elements.fuelProfile.value,
    brand: refs.vehicleForm.elements.brand.value,
    model: refs.vehicleForm.elements.model.value,
    sector: refs.vehicleForm.elements.sector.value,
    status: refs.vehicleForm.elements.status.value,
    notes: refs.vehicleForm.elements.notes.value,
  };

  try {
    await api(id ? `/api/vehicles/${id}` : "/api/vehicles", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetVehicleForm();
    await Promise.all([refreshVehicles(), refreshFuel(), refreshDashboard()]);

    const shouldRefreshDossier =
      state.dossier.selectedPlate &&
      normalizeClientPlateKey(state.dossier.selectedPlate) ===
        normalizeClientPlateKey(previousVehicle?.plate || payload.plate);
    if (shouldRefreshDossier) {
      await loadVehicleDossierByPlate(payload.plate, { silent: true });
    }

    showToast(id ? "Veiculo atualizado." : "Veiculo cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function editFine(id) {
  const item = findById(state.fines, id);
  if (!item) return;

  refs.fineForm.elements.id.value = item.id;
  refs.fineForm.elements.fineDate.value = item.fineDate;
  refs.fineForm.elements.plate.value = item.plate;
  refs.fineForm.elements.driver.value = item.driver;
  refs.fineForm.elements.status.value = item.status;
  refs.fineForm.elements.amount.value = item.amount;
  refs.fineForm.elements.documentName.value = item.documentName || "";
  refs.fineForm.elements.documentUrl.value = item.documentUrl || "";
  refs.fineForm.elements.notes.value = item.notes || "";
  setSection("fines");
}

function resetFineForm() {
  refs.fineForm.reset();
  refs.fineForm.elements.id.value = "";
  refs.fineForm.elements.fineDate.value = currentLocalDate();
  refs.fineForm.elements.status.value = "OPEN";
}

async function handleFineSubmit(event) {
  event.preventDefault();
  const id = refs.fineForm.elements.id.value;

  const payload = {
    fineDate: refs.fineForm.elements.fineDate.value,
    plate: refs.fineForm.elements.plate.value,
    driver: refs.fineForm.elements.driver.value,
    status: refs.fineForm.elements.status.value,
    amount: refs.fineForm.elements.amount.value,
    documentName: refs.fineForm.elements.documentName.value,
    documentUrl: refs.fineForm.elements.documentUrl.value,
    notes: refs.fineForm.elements.notes.value,
  };

  try {
    await api(id ? `/api/fines/${id}` : "/api/fines", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetFineForm();
    await Promise.all([refreshFines(), maybeRefreshAdmin()]);

    if (state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(payload.plate)) {
      await loadVehicleDossierByPlate(payload.plate, { silent: true });
    }

    showToast(id ? "Multa atualizada." : "Multa cadastrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleChecklistSubmit(event) {
  event.preventDefault();
  const id = refs.checklistForm.elements.id.value;
  const itemsDetailed = ensureChecklistDraft();
  const payload = {
    vehicle: refs.checklistForm.elements.vehicle.value,
    checklistDate: toIsoDateTime(refs.checklistForm.elements.checklistDate.value),
    checklistType: refs.checklistForm.elements.checklistType.value,
    driverName: refs.checklistForm.elements.driverName.value,
    odometerKm: refs.checklistForm.elements.odometerKm.value,
    signatureName: refs.checklistForm.elements.signatureName.value,
    temporaryIssue: refs.checklistForm.elements.temporaryIssue?.value || "",
    status: deriveChecklistOverallStatus(itemsDetailed),
    items: itemsDetailed.map((item) => item.label).join("\n"),
    itemsDetailed,
    problems: refs.checklistForm.elements.problems.value,
  };

  try {
    await api(id ? `/api/checklists/${id}` : "/api/checklists", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetChecklistForm();
    await Promise.all([refreshChecklists(), maybeRefreshAdmin()]);

    if (state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(payload.vehicle)) {
      await loadVehicleDossierByPlate(payload.vehicle, { silent: true });
    }

    showToast(id ? "Checklist atualizado." : "Checklist cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleFuelSubmit(event) {
  event.preventDefault();
  const isExit = refs.fuelForm.elements.type.value === "EXIT";
  const selectedVehicle =
    isExit && refs.fuelForm.elements.vehicleId.value
      ? state.vehicles.find((item) => String(item.id) === String(refs.fuelForm.elements.vehicleId.value))
      : null;

  const payload = {
    storageId: refs.fuelForm.elements.storageId.value,
    type: refs.fuelForm.elements.type.value,
    vehicleId: isExit ? refs.fuelForm.elements.vehicleId.value : "",
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    occurredAt: toIsoDateTime(refs.fuelForm.elements.occurredAt.value),
    notes: refs.fuelForm.elements.notes.value,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    if (selectedVehicle && state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(selectedVehicle.plate)) {
      await loadVehicleDossierByPlate(selectedVehicle.plate, { silent: true });
    }

    showToast("Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

const fuelHistoryRenderOverride = function () {
  const analytics = buildFuelPageAnalytics(state.fuelRecords);
  const currentPlate = refs.fuelFilterPlate?.value || "";
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.innerHTML = `<option value="">Todos os veiculos</option>${analytics.plates
      .map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`)
      .join("")}`;
    refs.fuelFilterPlate.value = analytics.plates.includes(currentPlate) ? currentPlate : "";
  }

  refs.fuelKpiGrid.innerHTML = [
    {
      label: "Abastecimentos",
      value: formatNumber(analytics.monthExitRecords.length),
      note: "Saidas no mes atual",
      icon: "fuel",
      tone: "brand",
    },
    {
      label: "Total de litros",
      value: `${formatLiters(analytics.monthLiters)} L`,
      note: "Consumo do mes atual",
      icon: "analytics",
      tone: "neutral",
    },
    {
      label: "Media por lancamento",
      value: `${formatLiters(analytics.avgLiters)} L`,
      note: "Considerando apenas saidas",
      icon: "dashboard",
      tone: "warning",
    },
    {
      label: "Media km/L",
      value: formatKmPerLiter(analytics.avgKmPerLiter),
      note: "Com base nos hodometros informados",
      icon: "efficiency",
      tone: "success",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card",
        label: item.label,
        value: item.value,
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.fuelStocksGrid.innerHTML = state.fuelStorages.length
    ? state.fuelStorages
        .map((storage) => {
          const isEmpty = Number(storage.currentBalance || 0) <= 0;
          const isLow =
            !isEmpty &&
            Number(storage.minBalance || 0) > 0 &&
            Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0);
          const statusLabel = isEmpty ? "Sem saldo" : isLow ? "Abaixo do minimo" : "Operacional";
          const toneClass = isEmpty ? "is-empty" : isLow ? "is-low" : "is-ok";

          return `
            <article class="fuel-stock-card ${toneClass}">
              <div class="fuel-stock-card__top">
                <span class="fuel-stock-card__kind">${escapeHtml(formatFuelKindLabel(storage.fuelKind))}</span>
                <span class="fuel-stock-card__status">${escapeHtml(statusLabel)}</span>
              </div>
              <div class="fuel-stock-card__value-row">
                <strong class="fuel-stock-card__value">${escapeHtml(formatLiters(storage.currentBalance))}</strong>
                <span class="fuel-stock-card__unit">L</span>
              </div>
              <div class="fuel-stock-card__footer">
                <strong>${escapeHtml(storage.name)}</strong>
                <span>Saldo disponivel agora</span>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="stack-item"><strong>Nenhum estoque configurado</strong><p class="muted">Cadastre ou revise os estoques principais de combustivel.</p></div>`;

  renderFuelHistoryTable();
  renderFuelComposerMode();
  syncFuelFormState();
  renderFuelBatchComposer();

  refs.fuelConsumptionChart.innerHTML = renderConsumptionChart({
    consumptionSeries: analytics.consumptionSeries,
    totalConsumptionLiters: analytics.consumptionSeries.reduce((total, item) => total + item.total, 0),
    peakConsumption: analytics.peakConsumption,
    fuelMix: analytics.fuelMix,
  });

  refs.fuelTopVehicles.innerHTML = renderMeterList(
    analytics.topVehicles.map((item) => ({
      label: item.plate,
      value: item.liters,
      count: item.count,
    })),
    {
      emptyTitle: "Sem consumo no periodo",
      emptyDescription: "Assim que houver saidas registradas, os veiculos de maior consumo aparecem aqui.",
      valueFormatter: (value) => `${formatLiters(value)} L`,
      secondaryFormatter: (item) => `${item.count} lancamento(s)`,
    }
  );

  refs.fuelSideInsights.innerHTML = buildFuelSideInsights(analytics);
  syncResponsiveTableLabels();
};

const fuelHistorySubmitOverride = async function (event) {
  event.preventDefault();
  if (!refs.fuelForm) {
    return;
  }

  const movementType = refs.fuelForm.elements.type.value || "OPERATIONAL_EXIT";
  const occurredAt = toIsoDateTime(refs.fuelForm.elements.occurredAt.value);

  if (!occurredAt) {
    showToast("Informe uma data e hora valida.", "error");
    return;
  }

  let quantity = 0;
  let unitCost = null;
  let odometerKm = null;

  try {
    quantity = readBrazilianNumberField(refs.fuelForm.elements.quantity, {
      label: "quantidade",
      required: true,
      min: 0.000001,
    });

    if (movementType === "STOCK_ENTRY") {
      unitCost = readBrazilianNumberField(refs.fuelForm.elements.unitCost, {
        label: "valor unitario",
        min: 0,
      });
    }

    if (movementType === "OPERATIONAL_EXIT" && String(refs.fuelForm.elements.odometerKm.value || "").trim()) {
      odometerKm = readBrazilianNumberField(refs.fuelForm.elements.odometerKm, {
        label: "KM",
        min: 0,
      });
    }
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const warnings = [];
  if (quantity > 500) {
    warnings.push("Valor de litros muito alto. Confirme se o lancamento esta correto.");
  }
  if (unitCost !== null && unitCost > 20) {
    warnings.push("Valor unitario acima de R$ 20,00. Confirme se o lancamento esta correto.");
  }
  if (!confirmSuspiciousFuelValues(warnings)) {
    return;
  }

  if (movementType === "STOCK_ENTRY") {
    if (!refs.fuelForm.elements.productId.value) {
      showToast("Selecione o combustivel da entrada no estoque.", "error");
      return;
    }

    const payload = {
      productId: refs.fuelForm.elements.productId.value,
      stockType: "FUEL",
      type: "IN",
      quantity,
      unitCost,
      document: refs.fuelForm.elements.document.value,
      supplierName: refs.fuelForm.elements.supplierName.value,
      occurredAt,
      notes: refs.fuelForm.elements.notes.value,
    };

    try {
      await api("/api/inventory/movements", { method: "POST", body: payload });
      resetFuelForm();
      await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshFuel(), refreshDashboard()]);
      showToast("Entrada de combustivel registrada.");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  const selectedVehicle = resolveFuelVehicleByPlate(refs.fuelVehicleInput?.value || "");
  if (movementType === "OPERATIONAL_EXIT" && !selectedVehicle) {
    showToast("Selecione uma placa cadastrada para o abastecimento.", "error");
    return;
  }

  const isAdjustment = movementType === "BALANCE_ADJUSTMENT";
  const storageId = refs.fuelForm.elements.storageId.value;
  if (!storageId) {
    showToast("Selecione o combustivel da movimentacao.", "error");
    return;
  }
  const adjustmentKind = refs.fuelForm.elements.adjustmentType.value || "DECREASE";
  const payload = isAdjustment
    ? {
        storageId,
        type: adjustmentKind === "INCREASE" ? "ENTRY" : "EXIT",
        operationKind: "ADJUSTMENT",
        adjustmentKind,
        quantity,
        occurredAt,
        notes: refs.fuelForm.elements.notes.value,
        entryOrigin: "MANUAL",
      }
    : {
        storageId,
        type: "EXIT",
        operationKind: "OPERATIONAL",
        vehicleId: selectedVehicle ? selectedVehicle.id : "",
        plate: selectedVehicle ? selectedVehicle.plate : refs.fuelVehicleInput.value,
        quantity,
        odometerKm,
        occurredAt,
        notes: refs.fuelForm.elements.notes.value,
        entryOrigin: "MANUAL",
      };

  payload.rawPayload = {
    plate: refs.fuelVehicleInput?.value || "",
    storageId,
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    unitCost: refs.fuelForm.elements.unitCost.value,
    type: movementType,
    occurredAt,
    notes: refs.fuelForm.elements.notes.value,
  };

  payload.normalizedPayload = {
    storageId,
    vehicleId: selectedVehicle ? selectedVehicle.id : null,
    plate: selectedVehicle ? selectedVehicle.plate : "",
    quantity,
    odometerKm,
    type: payload.type,
    operationKind: payload.operationKind,
    adjustmentKind: payload.adjustmentKind || "",
    occurredAt,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    if (
      selectedVehicle &&
      state.dossier.selectedPlate &&
      normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(selectedVehicle.plate)
    ) {
      await loadVehicleDossierByPlate(selectedVehicle.plate, { silent: true });
    }

    showToast(isAdjustment ? "Ajuste de saldo registrado." : "Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
};

renderFuel = fuelHistoryRenderOverride;
handleFuelSubmit = fuelHistorySubmitOverride;

function isBarcodeNotFoundError(error) {
  return /produto nao encontrado|codigo de barras/i.test(String(error?.message || ""));
}

function describeScannerError(error) {
  const code = String(error?.name || error?.code || "").toLowerCase();
  if (code.includes("notallowed") || code.includes("permission") || code.includes("security")) {
    return "A camera foi bloqueada. Libere a permissao no navegador e tente novamente.";
  }
  if (code.includes("notfound") || code.includes("devicesnotfound")) {
    return "Nenhuma camera compativel foi encontrada neste dispositivo.";
  }
  if (code.includes("notreadable") || code.includes("trackstart")) {
    return "A camera esta ocupada por outro aplicativo. Feche o outro app e tente novamente.";
  }
  if (code.includes("overconstrained")) {
    return "Nao foi possivel usar a camera traseira. Tente novamente ou use a digitacao manual.";
  }
  return error?.message || "Nao foi possivel iniciar a leitura por camera.";
}

function getScannerFallbackReader() {
  return window.ZXingBrowser?.BrowserMultiFormatReader || null;
}

async function waitForScannerVideoReady() {
  if (!refs.scannerVideo) {
    return;
  }

  if (refs.scannerVideo.readyState >= 2) {
    return;
  }

  await new Promise((resolve) => {
    const handleReady = () => {
      refs.scannerVideo.removeEventListener("loadedmetadata", handleReady);
      refs.scannerVideo.removeEventListener("canplay", handleReady);
      resolve();
    };

    refs.scannerVideo.addEventListener("loadedmetadata", handleReady, { once: true });
    refs.scannerVideo.addEventListener("canplay", handleReady, { once: true });
  });
}

async function lookupProductByBarcodeValue(barcode, options = {}) {
  const trimmedBarcode = String(barcode || "").trim();
  const stockType = options.stockType || "COMMON";

  if (!trimmedBarcode) {
    throw new Error("Informe um codigo de barras.");
  }

  const response = await api(
    `/api/products/barcode/${encodeURIComponent(trimmedBarcode)}?${new URLSearchParams({ stockType }).toString()}`
  );

  if (stockType === "COMMON" && refs.movementProductSelect) {
    refs.movementBarcodeInput.value = trimmedBarcode;
    refs.movementProductSelect.value = String(response.item.id);
  }

  return response.item;
}

async function prepareNewProductFromBarcode(barcode) {
  setSection("inventory");
  resetProductForm();
  refs.productForm.elements.stockType.value = "COMMON";
  refs.productForm.elements.barcode.value = barcode;
  refs.productForm.elements.name.focus();
  showToast("Codigo lido. Produto nao encontrado; preencha o cadastro para criar um novo item.", "error");
}

async function handleBarcodeForProductRegistration(barcode) {
  try {
    const item = await lookupProductByBarcodeValue(barcode, { stockType: "COMMON" });
    if (!state.products.some((product) => Number(product.id) === Number(item.id))) {
      await refreshProducts();
    }
    editProduct(item.id);
    refs.productForm.elements.barcode.value = barcode;
    refs.productForm.elements.name.focus();
    showToast(`Produto encontrado: ${item.name}`);
  } catch (error) {
    if (isBarcodeNotFoundError(error)) {
      await prepareNewProductFromBarcode(barcode);
      return;
    }
    throw error;
  }
}

async function handleScannerBarcodeDetected(barcode, sessionId) {
  const normalizedBarcode = String(barcode || "").trim();
  if (!normalizedBarcode || state.scanner.sessionId !== sessionId) {
    return;
  }

  const lastValue = String(state.scanner.lastValue || "");
  const lastDetectedAt = Number(state.scanner.lastDetectedAt || 0);
  if (lastValue === normalizedBarcode && Date.now() - lastDetectedAt < 1200) {
    return;
  }

  state.scanner.lastValue = normalizedBarcode;
  state.scanner.lastDetectedAt = Date.now();

  const targetId = state.scanner.targetId;
  const input = $(targetId);
  if (input) {
    input.value = normalizedBarcode;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  closeScanner();

  try {
    if (targetId === "movement-barcode-input") {
      const item = await lookupProductByBarcodeValue(normalizedBarcode, { stockType: "COMMON" });
      showToast(`Produto encontrado: ${item.name}`);
      return;
    }

    if (targetId === "product-barcode-input") {
      await handleBarcodeForProductRegistration(normalizedBarcode);
      return;
    }

    showToast(`Codigo lido: ${normalizedBarcode}`);
  } catch (error) {
    if (targetId === "movement-barcode-input" && isBarcodeNotFoundError(error)) {
      await prepareNewProductFromBarcode(normalizedBarcode);
      return;
    }
    showToast(error.message, "error");
  }
}

async function startNativeBarcodeScanner(targetId) {
  refs.scannerStatus.textContent = "Inicializando camera traseira...";
  state.scanner.engine = "native";
  state.scanner.targetId = targetId;
  state.scanner.detector = new window.BarcodeDetector({
    formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e"],
  });
  state.scanner.stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  refs.scannerVideo.srcObject = state.scanner.stream;
  await refs.scannerVideo.play().catch(() => {});
  await waitForScannerVideoReady();
  refs.scannerStatus.textContent = "Aponte a camera para o codigo de barras.";
  scanLoop();
}

async function startFallbackBarcodeScanner(targetId) {
  const ReaderClass = getScannerFallbackReader();
  if (!ReaderClass) {
    throw new Error("Leitura por camera indisponivel neste navegador. Use a digitacao manual.");
  }

  refs.scannerStatus.textContent = "Inicializando leitor alternativo...";
  state.scanner.engine = "zxing";
  state.scanner.targetId = targetId;
  state.scanner.codeReader = new ReaderClass();
  const sessionId = state.scanner.sessionId;
  state.scanner.controls = await state.scanner.codeReader.decodeFromConstraints(
    {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    refs.scannerVideo,
    async (result, error) => {
      if (state.scanner.sessionId !== sessionId || state.scanner.isClosing) {
        return;
      }

      if (result) {
        refs.scannerStatus.textContent = "Codigo detectado. Validando item...";
        await handleScannerBarcodeDetected(result.getText?.() || result.text || "", sessionId);
        return;
      }

      if (error?.name && !/notfound/i.test(error.name)) {
        refs.scannerStatus.textContent = "Camera ativa. Ajuste o foco ou aproxime o codigo.";
      }
    }
  );
  refs.scannerStatus.textContent = "Aponte a camera para o codigo de barras.";
}

async function openScanner(targetId) {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
    showToast("Seu navegador nao permite acesso a camera. Use a digitacao manual.", "error");
    return;
  }

  try {
    closeScanner();
    refs.scannerModal.classList.remove("hidden");
    refs.scannerStatus.textContent = "Preparando leitura por camera...";
    state.scanner = {
      ...state.scanner,
      targetId,
      engine: "",
      controls: null,
      codeReader: null,
      sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      isClosing: false,
      lastValue: "",
      lastDetectedAt: 0,
    };

    if ("BarcodeDetector" in window) {
      try {
        await startNativeBarcodeScanner(targetId);
        return;
      } catch (nativeError) {
        if (getScannerFallbackReader()) {
          refs.scannerStatus.textContent = "Leitor nativo indisponivel. Ativando modo alternativo...";
          closeScanner();
          refs.scannerModal.classList.remove("hidden");
          state.scanner = {
            ...state.scanner,
            targetId,
            sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            isClosing: false,
            lastValue: "",
            lastDetectedAt: 0,
          };
          await startFallbackBarcodeScanner(targetId);
          return;
        }
        throw nativeError;
      }
    }

    await startFallbackBarcodeScanner(targetId);
  } catch (error) {
    showToast(describeScannerError(error), "error");
    closeScanner();
  }
}

async function scanLoop() {
  if (
    state.scanner.engine !== "native" ||
    !state.scanner.detector ||
    !refs.scannerVideo?.srcObject ||
    state.scanner.isClosing
  ) {
    return;
  }

  try {
    const results = await state.scanner.detector.detect(refs.scannerVideo);
    if (results.length) {
      refs.scannerStatus.textContent = "Codigo detectado. Validando item...";
      await handleScannerBarcodeDetected(results[0].rawValue || "", state.scanner.sessionId);
      return;
    }
  } catch (error) {
    refs.scannerStatus.textContent = "Camera ativa. Ajuste o foco ou aproxime o codigo.";
  }

  state.scanner.timer = window.setTimeout(scanLoop, 260);
}

async function lookupProductByBarcode() {
  const barcode = refs.movementBarcodeInput.value.trim();
  if (!barcode) {
    showToast("Informe um codigo de barras.", "error");
    return;
  }

  try {
    const item = await lookupProductByBarcodeValue(barcode, { stockType: "COMMON" });
    showToast(`Produto encontrado: ${item.name}`);
  } catch (error) {
    if (isBarcodeNotFoundError(error)) {
      await prepareNewProductFromBarcode(barcode);
      return;
    }
    showToast(error.message, "error");
  }
}

function closeScanner() {
  state.scanner.isClosing = true;

  if (state.scanner.timer) {
    window.clearTimeout(state.scanner.timer);
  }

  try {
    state.scanner.controls?.stop?.();
  } catch (error) {
    // Mantem o fluxo de encerramento mesmo se o leitor alternativo ja estiver parado.
  }

  try {
    state.scanner.codeReader?.reset?.();
  } catch (error) {
    // Nao bloqueia o fechamento.
  }

  state.scanner.stream?.getTracks?.().forEach((track) => track.stop());
  if (refs.scannerVideo) {
    refs.scannerVideo.pause?.();
    refs.scannerVideo.srcObject = null;
  }
  refs.scannerModal.classList.add("hidden");
  refs.scannerStatus.textContent = "Aguardando camera...";
  state.scanner = {
    stream: null,
    timer: null,
    targetId: null,
    detector: null,
    controls: null,
    codeReader: null,
    engine: "",
    sessionId: null,
    isClosing: false,
    lastValue: "",
    lastDetectedAt: 0,
  };
}

async function handleKardexPrint(mode = "print") {
  try {
    const report = await runPrintWorkflow({
      type: "kardex",
      mode,
      placeholderTitle: "Preparando Ficha Kardex",
      buildJob: async () => {
        const report = await fetchKardexReport();
        return {
          title: `${report.reportName} - ${report.product.name}`,
          html: buildKardexPrintDocument(report, mode),
        };
      },
    });
    showToast(mode === "pdf" ? "Na impressao, escolha Salvar como PDF." : "Janela de impressao aberta.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleFuelDailySheetPrint() {
  try {
    await runPrintWorkflow({
      type: "fuel-daily-sheet",
      mode: "print",
      placeholderTitle: "Preparando folha diaria",
      buildJob: async () => {
        if (!state.vehicles.length) {
          await refreshVehicles();
        }

        const activeVehicles = state.vehicles.filter((vehicle) => vehicle.active);
        const grouped = {
          s500: activeVehicles.filter((vehicle) => vehicle.supportsS500),
          s10: activeVehicles.filter((vehicle) => vehicle.supportsS10),
        };

        return {
          title: `Controle diario de abastecimento - ${currentLocalDate()}`,
          html: buildFuelDailySheetDocument(grouped),
        };
      },
    });
    showToast("Folha diaria pronta para impressao.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function createPrintJobId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredPrintJobs() {
  try {
    return JSON.parse(window.localStorage.getItem(PRINT_JOB_STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function writeStoredPrintJobs(jobs) {
  window.localStorage.setItem(PRINT_JOB_STORAGE_KEY, JSON.stringify(jobs));
}

function cleanupStoredPrintJobs(existingJobs = readStoredPrintJobs()) {
  const now = Date.now();
  const nextJobs = Object.entries(existingJobs).reduce((result, [jobId, job]) => {
    const updatedAt = Number(job?.updatedAt || 0);
    if (updatedAt && now - updatedAt <= PRINT_JOB_TTL_MS) {
      result[jobId] = job;
    }
    return result;
  }, {});

  if (JSON.stringify(nextJobs) !== JSON.stringify(existingJobs)) {
    writeStoredPrintJobs(nextJobs);
  }

  return nextJobs;
}

function storePrintJob(job) {
  const jobs = cleanupStoredPrintJobs();
  jobs[job.id] = {
    ...jobs[job.id],
    ...job,
    updatedAt: Date.now(),
  };
  writeStoredPrintJobs(jobs);
  return jobs[job.id];
}

function removeStoredPrintJob(jobId) {
  const jobs = readStoredPrintJobs();
  if (!jobs[jobId]) {
    return;
  }
  delete jobs[jobId];
  writeStoredPrintJobs(jobs);
}

function buildPrintPageUrl(type, jobId) {
  const url = new URL(PRINT_PAGE_FILENAME, window.location.href);
  url.searchParams.set("type", type);
  url.searchParams.set("job", jobId);
  return url.toString();
}

function openPrintWindow(type, jobId) {
  const popup = window.open(
    buildPrintPageUrl(type, jobId),
    `horizon-print-${jobId}`,
    "width=1080,height=900,resizable=yes,scrollbars=yes"
  );

  if (!popup || popup.closed) {
    throw new Error("O navegador bloqueou a janela de impressao. Libere pop-ups para este site e tente novamente.");
  }

  return popup;
}

async function runPrintWorkflow({ type, mode = "print", placeholderTitle, buildJob }) {
  const jobId = createPrintJobId(type);
  const createdAt = new Date().toISOString();

  storePrintJob({
    id: jobId,
    type,
    mode,
    title: placeholderTitle,
    message: "Montando o documento para impressao...",
    html: "",
    status: "loading",
    autoClose: true,
    createdAt,
  });

  let popup;
  try {
    popup = openPrintWindow(type, jobId);
  } catch (error) {
    removeStoredPrintJob(jobId);
    throw error;
  }

  try {
    const result = await buildJob();
    storePrintJob({
      id: jobId,
      type,
      mode,
      title: result.title,
      html: result.html,
      status: "ready",
      message: "",
      autoClose: result.autoClose !== false,
      createdAt,
    });

    try {
      popup.focus();
    } catch (error) {
      // Mantem a impressao ativa mesmo se o navegador recusar o foco.
    }

    return result;
  } catch (error) {
    storePrintJob({
      id: jobId,
      type,
      mode,
      title: placeholderTitle,
      html: "",
      status: "error",
      message: error.message || "Falha ao preparar o documento para impressao.",
      autoClose: false,
      createdAt,
    });

    try {
      popup.focus();
    } catch (focusError) {
      // Mantem o fluxo mesmo se o navegador recusar o foco.
    }

    throw error;
  }
}

function buildFuelDailySheetRows(vehicles = []) {
  if (!vehicles.length) {
    return `
      <tr class="print-sheet__empty-row">
        <td colspan="4">Nenhum veiculo cadastrado para este combustivel.</td>
      </tr>
    `;
  }

  return vehicles
    .slice()
    .sort((left, right) => String(left.plate || "").localeCompare(String(right.plate || "")))
    .map(
      (vehicle) => `
        <tr>
          <td>${escapeHtml(vehicle.plate)}</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `
    )
    .join("");
}

function resolveFuelDailySheetDensity(groupedVehicles = {}) {
  const s500Count = Array.isArray(groupedVehicles.s500) ? groupedVehicles.s500.length : 0;
  const s10Count = Array.isArray(groupedVehicles.s10) ? groupedVehicles.s10.length : 0;
  const totalRows = s500Count + s10Count;

  if (totalRows >= 32) {
    return "print-sheet--dense";
  }
  if (totalRows >= 22) {
    return "print-sheet--compact";
  }
  return "";
}

function buildFuelDailySheetBlock(title, vehicles, pumpLabel, tankLabel, extraClass = "") {
  return `
    <section class="print-sheet__block ${extraClass}">
      <header class="print-sheet__block-header">
        <h2>${escapeHtml(title)}</h2>
      </header>
      <table class="print-sheet__table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>KM</th>
            <th>Litros</th>
            <th>Observacao</th>
          </tr>
        </thead>
        <tbody>
          ${buildFuelDailySheetRows(vehicles)}
        </tbody>
      </table>
      <footer class="print-sheet__footer">
        <div><strong>${escapeHtml(pumpLabel)}:</strong><span aria-hidden="true"></span></div>
        <div><strong>${escapeHtml(tankLabel)}:</strong><span aria-hidden="true"></span></div>
        <div><strong>KM:</strong><span aria-hidden="true"></span></div>
      </footer>
    </section>
  `;
}

function buildFuelDailySheetDocument(groupedVehicles) {
  const densityClass = resolveFuelDailySheetDensity(groupedVehicles);
  const company = getDocumentCompany();

  return `
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 0; }
      .print-sheet { width: 100%; min-height: 100%; margin: 0 auto; padding: 0; box-sizing: border-box; }
      .print-brand { margin-bottom: 4.5mm; border-bottom: 1.4px solid #111; padding-bottom: 2.8mm; }
      .print-brand__identity { display: flex; gap: 10px; align-items: center; }
      .print-brand__logo { width: 26mm; height: 17mm; border: 1.3px solid #111; display: flex; align-items: center; justify-content: center; padding: 2px; box-sizing: border-box; }
      .print-brand__logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
      .print-brand__copy { display: grid; gap: 1px; }
      .print-brand__copy h1 { margin: 0; font-size: 16.8px; line-height: 1.05; }
      .print-brand__copy p { margin: 0; font-size: 9.7px; }
      .print-sheet__block { margin-bottom: 5.2mm; break-inside: avoid; page-break-inside: avoid; }
      .print-sheet__block:last-of-type { margin-bottom: 0; }
      .print-sheet__block-header { border-bottom: 1.2px solid #111; margin-bottom: 2.3mm; padding-bottom: 1.2mm; }
      .print-sheet__block-header h2 { margin: 0; font-size: 12.4px; line-height: 1.1; }
      .print-sheet__table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .print-sheet__table th, .print-sheet__table td { border: 1.7px solid #111; padding: 3.5px 5px; font-size: 9.8px; line-height: 1.15; vertical-align: middle; }
      .print-sheet__table th { background: #ececec; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
      .print-sheet__table tbody td { height: 10.5mm; }
      .print-sheet__table th:nth-child(1), .print-sheet__table td:nth-child(1) { width: 19%; }
      .print-sheet__table th:nth-child(2), .print-sheet__table td:nth-child(2) { width: 25%; font-size: 11.5px; font-weight: 700; text-align: center; }
      .print-sheet__table th:nth-child(3), .print-sheet__table td:nth-child(3) { width: 25%; font-size: 11.5px; font-weight: 700; text-align: center; }
      .print-sheet__table th:nth-child(4), .print-sheet__table td:nth-child(4) { width: 31%; }
      .print-sheet__empty-row td { height: auto; padding: 5px; text-align: center; font-style: italic; }
      .print-sheet__footer { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 2.4mm; font-size: 9.7px; }
      .print-sheet__footer div { display: flex; align-items: center; gap: 6px; }
      .print-sheet__footer strong { white-space: nowrap; }
      .print-sheet__footer span { flex: 1; border-bottom: 1.6px solid #111; height: 0; }
      .print-sheet__document-footer { margin-top: 3.6mm; display: flex; justify-content: space-between; gap: 10px; font-size: 8.9px; }
      .print-sheet--compact .print-sheet__block { margin-bottom: 4.1mm; }
      .print-sheet--compact .print-sheet__table th,
      .print-sheet--compact .print-sheet__table td { padding: 2.5px 4px; font-size: 8.9px; }
      .print-sheet--compact .print-sheet__table tbody td { height: 8mm; }
      .print-sheet--compact .print-sheet__table th:nth-child(2),
      .print-sheet--compact .print-sheet__table td:nth-child(2),
      .print-sheet--compact .print-sheet__table th:nth-child(3),
      .print-sheet--compact .print-sheet__table td:nth-child(3) { font-size: 10.4px; }
      .print-sheet--compact .print-sheet__footer { margin-top: 1.8mm; font-size: 8.9px; }
      .print-sheet--dense .print-sheet__block { margin-bottom: 3.4mm; }
      .print-sheet--dense .print-sheet__header h1 { font-size: 14px; }
      .print-sheet--dense .print-sheet__block-header { margin-bottom: 1.6mm; }
      .print-sheet--dense .print-sheet__block-header h2 { font-size: 11px; }
      .print-sheet--dense .print-sheet__table th,
      .print-sheet--dense .print-sheet__table td { padding: 2px 3px; font-size: 8.1px; }
      .print-sheet--dense .print-sheet__table tbody td { height: 6.8mm; }
      .print-sheet--dense .print-sheet__table th:nth-child(2),
      .print-sheet--dense .print-sheet__table td:nth-child(2),
      .print-sheet--dense .print-sheet__table th:nth-child(3),
      .print-sheet--dense .print-sheet__table td:nth-child(3) { font-size: 9.3px; }
      .print-sheet--dense .print-sheet__footer { gap: 6px; margin-top: 1.2mm; font-size: 8.1px; }
      @media print {
        body { margin: 0; }
        .print-sheet { width: auto; }
      }
      @page { size: A4 portrait; margin: 10mm; }
    </style>
    <main class="print-sheet ${densityClass}">
      ${buildPrintableCompanyHeader(
        company,
        "Controle diario de abastecimento",
        `Data de emissao: ${formatDateOnly(currentLocalDate())}`
      )}
      ${buildFuelDailySheetBlock("Bloco 1 - Diesel S-500", groupedVehicles.s500 || [], "Bomba S-500", "Litros tanque")}
      ${buildFuelDailySheetBlock("Bloco 2 - Diesel S-10", groupedVehicles.s10 || [], "Bomba S-10", "Litros tanque")}
      <footer class="print-sheet__document-footer">
        <span>${escapeHtml(company.documentFooter)}</span>
        <span>Documento pronto para preenchimento manual.</span>
      </footer>
    </main>
  `;
}

function buildKardexPrintDocument(report, mode) {
  return `
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 0; }
      .print-report { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; box-sizing: border-box; }
      .print-report__header { display: grid; gap: 4px; margin-bottom: 6mm; }
      .print-report__header h1 { margin: 0; font-size: 18px; }
      .print-report__header p { margin: 0; font-size: 11px; }
      .print-report__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 18px; margin: 4mm 0 6mm; font-size: 11px; }
      .print-report__hint { margin-bottom: 4mm; font-size: 11px; }
      .print-report__table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .print-report__table th, .print-report__table td { border: 1px solid #111; padding: 5px 6px; font-size: 10px; vertical-align: top; }
      .print-report__table th:nth-child(1), .print-report__table td:nth-child(1) { width: 14%; }
      .print-report__table th:nth-child(2), .print-report__table td:nth-child(2) { width: 14%; }
      .print-report__table th:nth-child(3), .print-report__table td:nth-child(3) { width: 10%; }
      .print-report__table th:nth-child(4), .print-report__table td:nth-child(4) { width: 10%; }
      .print-report__table th:nth-child(5), .print-report__table td:nth-child(5) { width: 11%; }
      .print-report__table th:nth-child(6), .print-report__table td:nth-child(6) { width: 13%; }
      .print-report__table th:nth-child(7), .print-report__table td:nth-child(7) { width: 12%; }
      .print-report__table th:nth-child(8), .print-report__table td:nth-child(8) { width: 16%; }
      .print-report__footer { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 6mm; font-size: 11px; }
      @page { size: A4 portrait; margin: 10mm; }
    </style>
    <main class="print-report">
      <header class="print-report__header">
        <p>${escapeHtml(report.companyName || "HORIZON")}</p>
        <h1>${escapeHtml(report.reportName)}</h1>
        <p>Periodo: ${escapeHtml(formatDateOnly(report.period.from))} a ${escapeHtml(formatDateOnly(report.period.to))}</p>
        <p>Emissao: ${escapeHtml(formatDateTime(report.issuedAt))}</p>
      </header>
      <div class="print-report__meta">
        <div><strong>Produto:</strong> ${escapeHtml(report.product.name)}</div>
        <div><strong>Unidade de medida:</strong> ${escapeHtml(report.product.unit)}</div>
        <div><strong>Filial/unidade:</strong> ${escapeHtml(report.filters.branchName || "Todas")}</div>
        <div><strong>Custo:</strong> ${escapeHtml(formatCurrency(report.currentCost || 0))}</div>
        <div><strong>Ultima compra:</strong> ${escapeHtml(
          report.lastPurchase ? `${formatDateTime(report.lastPurchase.date)} - ${report.lastPurchase.document || "Sem documento"}` : "Nao informada"
        )}</div>
        <div><strong>Fornecedor:</strong> ${escapeHtml(report.filters.supplierName || report.lastPurchase?.supplierName || "-")}</div>
      </div>
      <div class="print-report__hint">
        ${escapeHtml(mode === "pdf" ? "Use o dialogo de impressao para salvar como PDF." : "Documento pronto para impressao administrativa.")}
      </div>
      <table class="print-report__table">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Data</th>
            <th>Entradas</th>
            <th>Saidas</th>
            <th>Unitario</th>
            <th>Valor total</th>
            <th>Saldo</th>
            <th>Observacao</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="6"><strong>Saldo anterior ao periodo</strong></td>
            <td><strong>${escapeHtml(`${formatNumber(report.openingBalance || 0, 2, 2)} ${report.product.unit}`)}</strong></td>
            <td></td>
          </tr>
          ${
            report.rows.length
              ? report.rows
                  .map(
                    (row) => `
                      <tr>
                        <td>${escapeHtml(row.document || "-")}</td>
                        <td>${escapeHtml(formatDateTime(row.date))}</td>
                        <td>${escapeHtml(row.entryQuantity ? formatNumber(row.entryQuantity, 2, 2) : "-")}</td>
                        <td>${escapeHtml(row.exitQuantity ? formatNumber(row.exitQuantity, 2, 2) : "-")}</td>
                        <td>${escapeHtml(formatCurrency(row.unitCost || 0))}</td>
                        <td>${escapeHtml(formatCurrency(row.totalCost || 0))}</td>
                        <td>${escapeHtml(`${formatNumber(row.balance || 0, 2, 2)} ${report.product.unit}`)}</td>
                        <td>${escapeHtml(row.notes || "-")}</td>
                      </tr>
                    `
                  )
                  .join("")
              : `<tr><td colspan="8">Nenhuma movimentacao encontrada no periodo.</td></tr>`
          }
        </tbody>
      </table>
      <footer class="print-report__footer">
        <div><strong>Total entradas:</strong> ${escapeHtml(formatNumber(report.totals.entries || 0, 2, 2))}</div>
        <div><strong>Total saidas:</strong> ${escapeHtml(formatNumber(report.totals.exits || 0, 2, 2))}</div>
        <div><strong>Saldo final:</strong> ${escapeHtml(`${formatNumber(report.totals.finalBalance || 0, 2, 2)} ${report.product.unit}`)}</div>
      </footer>
    </main>
  `;
}

function getChecklistTemplateSource(includeInactive = false) {
  const source = (state.checklistTemplate.length ? state.checklistTemplate : DEFAULT_CHECKLIST_TEMPLATE).map(
    (item, index) => ({
      id: item.id ?? null,
      key: item.key || item.itemKey || normalizeClientKey(item.label || item.name || `item_${index + 1}`),
      label: item.label || item.name || `Item ${index + 1}`,
      description: item.description || "",
      category: item.category || "Outros",
      required: item.required !== false,
      active: item.active !== false,
      vehicleType: item.vehicleType || item.vehicle_type || "",
      sortOrder: Number(item.sortOrder || index + 1),
    })
  );

  const visibleItems = includeInactive ? source : source.filter((item) => item.active !== false);
  return visibleItems.sort((left, right) => {
    const leftCategoryIndex = CHECKLIST_CATEGORY_ORDER.indexOf(left.category);
    const rightCategoryIndex = CHECKLIST_CATEGORY_ORDER.indexOf(right.category);
    const safeLeftIndex = leftCategoryIndex === -1 ? CHECKLIST_CATEGORY_ORDER.length : leftCategoryIndex;
    const safeRightIndex = rightCategoryIndex === -1 ? CHECKLIST_CATEGORY_ORDER.length : rightCategoryIndex;
    if (safeLeftIndex !== safeRightIndex) {
      return safeLeftIndex - safeRightIndex;
    }
    return Number(left.sortOrder || 0) - Number(right.sortOrder || 0) || left.label.localeCompare(right.label);
  });
}

function cloneChecklistTemplate() {
  return getChecklistTemplateSource().map((item) => ({
    ...item,
    notes: "",
    status: "OK",
  }));
}

function buildChecklistDraftFromRecord(record) {
  const baseItems = cloneChecklistTemplate();
  const incomingItems = Array.isArray(record?.itemsDetailed)
    ? record.itemsDetailed
    : Array.isArray(record?.items)
      ? record.items.map((label) => ({ label, status: record.status === "ISSUES" ? "ATTENTION" : "OK" }))
      : [];

  const merged = incomingItems.reduce((map, item, index) => {
    const key = normalizeClientKey(item.key || item.label || `item_${index + 1}`);
    map.set(key, {
      key,
      label: item.label || `Item ${index + 1}`,
      description: item.description || "",
      category: item.category || "Outros",
      required: item.required !== false,
      active: item.active !== false,
      vehicleType: item.vehicleType || item.vehicle_type || "",
      notes: item.notes || item.observation || "",
      status:
        item.status === "CRITICAL" || item.status === "ATTENTION" || item.status === "OK"
          ? item.status
          : "OK",
    });
    return map;
  }, new Map());

  const result = baseItems.map((item) => ({ ...item, ...(merged.get(item.key) || {}) }));
  const extras = Array.from(merged.values()).filter((item) => !result.some((current) => current.key === item.key));
  return [...result, ...extras];
}

function summarizeChecklistDraft(items) {
  return items.reduce(
    (summary, item) => {
      if (item.status === "CRITICAL") summary.critical += 1;
      else if (item.status === "ATTENTION") summary.attention += 1;
      else summary.ok += 1;
      return summary;
    },
    { ok: 0, attention: 0, critical: 0 }
  );
}

function deriveChecklistOverallStatus(items) {
  const summary = summarizeChecklistDraft(items);
  if (summary.critical > 0) return "ISSUES";
  if (summary.attention > 0) return "OPEN";
  return "OK";
}

function ensureChecklistDraft() {
  if (!state.checklistDraftItems.length) {
    state.checklistDraftItems = cloneChecklistTemplate();
  }
  return state.checklistDraftItems;
}

function groupChecklistDraftItems(items) {
  const grouped = items.reduce((map, item) => {
    const category = item.category || "Outros";
    const current = map.get(category) || [];
    current.push(item);
    map.set(category, current);
    return map;
  }, new Map());

  return Array.from(grouped.entries())
    .sort((left, right) => {
      const leftIndex = CHECKLIST_CATEGORY_ORDER.indexOf(left[0]);
      const rightIndex = CHECKLIST_CATEGORY_ORDER.indexOf(right[0]);
      const safeLeftIndex = leftIndex === -1 ? CHECKLIST_CATEGORY_ORDER.length : leftIndex;
      const safeRightIndex = rightIndex === -1 ? CHECKLIST_CATEGORY_ORDER.length : rightIndex;
      return safeLeftIndex - safeRightIndex || left[0].localeCompare(right[0]);
    })
    .map(([category, categoryItems]) => ({
      category,
      items: categoryItems,
    }));
}

function renderChecklistTemplateTable() {
  if (!refs.checklistTemplateTableBody) {
    return;
  }

  refs.checklistTemplateTableBody.innerHTML = state.checklistTemplate.length
    ? state.checklistTemplate
        .map(
          (item) => `
            <tr>
              <td>
                <strong>${escapeHtml(item.name || item.label)}</strong>
                <div class="muted">${escapeHtml(item.description || "Sem descricao operacional.")}</div>
              </td>
              <td>${escapeHtml(item.category || "Outros")}</td>
              <td>${item.required === false ? "Opcional" : "Obrigatorio"}</td>
              <td>${statusBadge(item.active === false ? "BLOCKED" : "ACTIVE")}</td>
              <td>${escapeHtml(item.vehicleType || "-")}</td>
              <td>${escapeHtml(formatNumber(item.sortOrder || 0))}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-checklist-template", item.id, "Editar item", "&#9998;")}
                  ${buildRowActionButton(
                    "toggle-checklist-template",
                    item.id,
                    item.active === false ? "Ativar item" : "Desativar item",
                    item.active === false ? "&#10003;" : "&#10005;"
                  )}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum item de checklist configurado.", 7);
}

function renderChecklistComposer() {
  const items = ensureChecklistDraft();
  const summary = summarizeChecklistDraft(items);
  const groupedItems = groupChecklistDraftItems(items);
  refs.checklistForm.elements.items.value = items.map((item) => item.label).join("\n");
  refs.checklistForm.elements.status.value = deriveChecklistOverallStatus(items);
  renderChecklistTemplateTable();

  refs.checklistItemsBuilder.innerHTML = groupedItems
    .map(({ category, items: categoryItems }) => {
      const collapsed = state.checklistCollapsedCategories[category] === true;
      return `
        <section class="checklist-category-card ${collapsed ? "is-collapsed" : ""}">
          <header class="checklist-category-card__header">
            <div>
              <strong>${escapeHtml(category)}</strong>
              <p class="muted">${escapeHtml(`${categoryItems.length} item(ns) para conferencia rapida.`)}</p>
            </div>
            <button
              type="button"
              class="ghost-button"
              data-checklist-category-toggle="${escapeHtml(category)}"
            >
              ${collapsed ? "Expandir" : "Recolher"}
            </button>
          </header>
          <div class="checklist-category-card__items">
            ${categoryItems
              .map(
                (item) => `
                  <article class="checklist-item-card">
                    <div class="checklist-item-card__header">
                      <div class="checklist-item-card__body">
                        <strong>${escapeHtml(item.label)}</strong>
                        <p class="muted">${escapeHtml(item.description || "Verificacao operacional padrao.")}</p>
                      </div>
                      <div class="checklist-item-card__chips">
                        <span class="status-badge ${item.required === false ? "status-gray" : "status-red"}">
                          ${escapeHtml(item.required === false ? "Opcional" : "Obrigatorio")}
                        </span>
                        ${
                          item.vehicleType
                            ? `<span class="status-badge status-gray">${escapeHtml(item.vehicleType)}</span>`
                            : ""
                        }
                      </div>
                    </div>
                    <div class="checklist-status-row">
                      ${["OK", "ATTENTION", "CRITICAL"]
                        .map((status) => {
                          const meta = CHECKLIST_STATUS_META[status];
                          const activeClass = item.status === status ? "is-active" : "";
                          return `
                            <button
                              type="button"
                              class="checklist-status-button ${meta.className} ${activeClass}"
                              data-checklist-status-button="true"
                              data-checklist-key="${escapeHtml(item.key)}"
                              data-checklist-status="${status}"
                            >
                              ${escapeHtml(meta.label)}
                            </button>
                          `;
                        })
                        .join("")}
                    </div>
                    <label class="checklist-item-card__notes">
                      <span>Observacao do item</span>
                      <textarea
                        rows="2"
                        data-checklist-item-notes="${escapeHtml(item.key)}"
                        placeholder="Descreva apenas quando houver detalhe relevante."
                      >${escapeHtml(item.notes || "")}</textarea>
                    </label>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");

  refs.checklistSummaryCards.innerHTML = [
    {
      label: "Itens OK",
      value: formatNumber(summary.ok),
      toneClass: "status-green",
      tone: "success",
      icon: "checklists",
    },
    {
      label: "Atencao",
      value: formatNumber(summary.attention),
      toneClass: "status-yellow",
      tone: "warning",
      icon: "alert",
    },
    {
      label: "Criticos",
      value: formatNumber(summary.critical),
      toneClass: "status-red",
      tone: "danger",
      icon: "fines",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card operations-kpi-card--compact",
        label: item.label,
        value: item.value,
        icon: item.icon,
        tone: item.tone,
        extra: `<span class="status-badge ${item.toneClass}">${escapeHtml(item.label)}</span>`,
      })
    )
    .join("");

  const recentChecklists = state.checklists.slice(0, 4);
  refs.checklistHistoryFeed.innerHTML = recentChecklists.length
    ? recentChecklists
        .map(
          (item) => `
            <article class="stack-item">
              <strong>${escapeHtml(item.vehicle)}</strong>
              <p class="muted">${escapeHtml(formatDateTime(item.checklistDate))}</p>
              ${
                item.temporaryIssue
                  ? `<p class="muted">${escapeHtml(`Item temporario: ${item.temporaryIssue}`)}</p>`
                  : ""
              }
              <p class="muted">${escapeHtml(
                item.problems || "Sem observacoes criticas registradas."
              )}</p>
            </article>
          `
        )
        .join("")
    : `<div class="stack-item"><strong>Nenhum checklist recente</strong><p class="muted">Os ultimos registros aparecerao aqui.</p></div>`;
}

function buildFuelPageAnalytics(records) {
  const selectedPlate = refs.fuelFilterPlate?.value || "";
  const filteredRecords = selectedPlate ? records.filter((item) => item.plate === selectedPlate) : records;
  const exitRecords = filteredRecords.filter((item) => item.type === "EXIT");
  const plates = Array.from(new Set(records.map((item) => item.plate).filter(Boolean))).sort();
  const today = currentLocalDate();
  const monthPrefix = today.slice(0, 7);
  const monthExitRecords = filteredRecords.filter(
    (item) => item.type === "EXIT" && String(item.occurredAt || "").slice(0, 7) === monthPrefix
  );
  const monthLiters = monthExitRecords.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const avgLiters = monthExitRecords.length ? monthLiters / monthExitRecords.length : 0;

  const groupedByDay = new Map();
  for (const item of exitRecords) {
    const day = String(item.occurredAt || "").slice(0, 10);
    const current = groupedByDay.get(day) || { date: day, total: 0, s500: 0, s10: 0 };
    current.total += Number(item.quantity || 0);
    if (String(item.fuelKind || "").toUpperCase() === "S500") current.s500 += Number(item.quantity || 0);
    if (String(item.fuelKind || "").toUpperCase() === "S10") current.s10 += Number(item.quantity || 0);
    groupedByDay.set(day, current);
  }

  const consumptionSeries = Array.from(groupedByDay.values()).sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  const fuelMix = [
    { fuelKind: "S500", total: consumptionSeries.reduce((total, item) => total + item.s500, 0) },
    { fuelKind: "S10", total: consumptionSeries.reduce((total, item) => total + item.s10, 0) },
  ];
  const peakConsumption = consumptionSeries.reduce(
    (highest, item) => (item.total > highest.total ? item : highest),
    { date: "", total: 0, s500: 0, s10: 0 }
  );

  const topVehiclesMap = new Map();
  for (const item of exitRecords) {
    const current = topVehiclesMap.get(item.plate) || { plate: item.plate, liters: 0, count: 0 };
    current.liters += Number(item.quantity || 0);
    current.count += 1;
    topVehiclesMap.set(item.plate, current);
  }
  const topVehicles = Array.from(topVehiclesMap.values())
    .sort((left, right) => right.liters - left.liters || left.plate.localeCompare(right.plate))
    .slice(0, 5);

  const previousByPlate = new Map();
  const efficiencySamples = [];
  for (const item of exitRecords
    .filter((record) => record.odometerKm !== null && record.odometerKm !== undefined)
    .sort((left, right) => String(left.occurredAt).localeCompare(String(right.occurredAt)))) {
    const previous = previousByPlate.get(item.plate);
    if (previous && Number(item.odometerKm) > Number(previous.odometerKm) && Number(item.quantity || 0) > 0) {
      efficiencySamples.push((Number(item.odometerKm) - Number(previous.odometerKm)) / Number(item.quantity || 0));
    }
    previousByPlate.set(item.plate, item);
  }

  const avgKmPerLiter = efficiencySamples.length
    ? efficiencySamples.reduce((total, value) => total + value, 0) / efficiencySamples.length
    : 0;

  return {
    selectedPlate,
    plates,
    filteredRecords,
    exitRecords,
    monthExitRecords,
    monthLiters,
    avgLiters,
    avgKmPerLiter,
    consumptionSeries,
    fuelMix,
    peakConsumption,
    topVehicles,
  };
}

function buildFuelSideInsights(analytics) {
  const lowStorages = state.fuelStorages.filter(
    (storage) =>
      Number(storage.minBalance || 0) > 0 &&
      Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0)
  );
  const suspiciousAlerts = (state.dashboard.analytics?.operationalAlerts || [])
    .filter((item) => item.type === "SUSPICIOUS_FUEL_RECORD")
    .slice(0, 3);
  const cards = [];

  if (lowStorages.length) {
    cards.push(
      ...lowStorages.map(
        (storage) => `
          <article class="stack-item">
            <strong>${escapeHtml(storage.name)}</strong>
            <p class="muted">${escapeHtml(
              `${formatFuelKindLabel(storage.fuelKind)} abaixo do minimo com ${formatLiters(
                storage.currentBalance
              )} L`
            )}</p>
          </article>
        `
      )
    );
  }

  if (analytics.topVehicles.length) {
    cards.push(`
      <article class="stack-item">
        <strong>Veiculo com maior consumo</strong>
        <p class="muted">${escapeHtml(
          `${analytics.topVehicles[0].plate} com ${formatLiters(analytics.topVehicles[0].liters)} L no periodo`
        )}</p>
      </article>
    `);
  }

  if (suspiciousAlerts.length) {
    cards.push(
      ...suspiciousAlerts.map(
        (alert) => `
          <article class="stack-item">
            <strong>${escapeHtml(alert.title || "Lancamento suspeito")}</strong>
            <p class="muted">${escapeHtml(alert.description || "Revise o historico deste abastecimento.")}</p>
          </article>
        `
      )
    );
  }

  if (!cards.length) {
    cards.push(
      `<article class="stack-item"><strong>Sem alertas de abastecimento</strong><p class="muted">Os principais destaques operacionais aparecerao aqui.</p></article>`
    );
  }

  return cards.join("");
}

function getDocumentCompany(company = {}) {
  return {
    companyName: company.companyName || company.name || state.company.companyName || "Empresa cliente",
    logoDataUrl: company.logoDataUrl || company.logo || state.company.logoDataUrl || "",
    cnpj: company.cnpj || state.company.cnpj || "",
    address: company.address || state.company.address || "",
    phone: company.phone || state.company.phone || "",
    email: company.email || state.company.email || "",
    primaryColor: company.primaryColor || state.company.primaryColor || "#c40000",
    documentFooter: company.documentFooter || state.company.documentFooter || "Gerado pelo sistema Horizon",
  };
}

function buildPrintableCompanyHeader(company, title, subtitle = "") {
  const infoLine = [company.cnpj, company.address, company.phone, company.email].filter(Boolean).join(" | ");
  return `
    <header class="print-brand">
      <div class="print-brand__identity">
        ${
          company.logoDataUrl
            ? `<div class="print-brand__logo"><img src="${company.logoDataUrl}" alt="Logo da empresa" /></div>`
            : ""
        }
        <div class="print-brand__copy">
          <p>${escapeHtml(company.companyName)}</p>
          <h1>${escapeHtml(title)}</h1>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
          ${infoLine ? `<p>${escapeHtml(infoLine)}</p>` : ""}
        </div>
      </div>
    </header>
  `;
}

function handleInteractivePanels(event) {
  const dashboardActionButton = event.target.closest(
    "[data-dashboard-save-odometer], [data-dashboard-clear-odometer], [data-dashboard-toggle-odometer], [data-dashboard-cancel-odometer]"
  );
  if (dashboardActionButton) {
    if (dashboardActionButton.dataset.dashboardToggleOdometer) {
      toggleDashboardOdometerEditor(dashboardActionButton.dataset.dashboardToggleOdometer);
      return;
    }

    if (dashboardActionButton.dataset.dashboardCancelOdometer) {
      cancelDashboardOdometerEditor(dashboardActionButton.dataset.dashboardCancelOdometer);
      return;
    }

    const recordId =
      dashboardActionButton.dataset.dashboardSaveOdometer ||
      dashboardActionButton.dataset.dashboardClearOdometer ||
      "";
    saveDashboardOdometerChange(recordId, dashboardActionButton.hasAttribute("data-dashboard-clear-odometer")).catch(
      (error) => showToast(error.message, "error")
    );
    return;
  }

  const dashboardLazyButton = event.target.closest("[data-dashboard-load-chart]");
  if (dashboardLazyButton) {
    if (dashboardLazyButton.dataset.dashboardLoadChart === "fuel") {
      state.dashboard.lazy.fuelChartLoaded = true;
      renderDashboard();
    }
    return;
  }

  const noteSaveButton = event.target.closest("[data-note-inline-save]");
  if (noteSaveButton) {
    saveInlineNoteEditing(noteSaveButton.dataset.noteInlineSave).catch((error) => showToast(error.message, "error"));
    return;
  }

  const noteCancelButton = event.target.closest("[data-note-inline-cancel]");
  if (noteCancelButton) {
    cancelInlineNoteEditing();
    return;
  }

  const noteFinanceNowButton = event.target.closest("[data-note-set-finance-today]");
  if (noteFinanceNowButton) {
    setInlineNoteFinanceNow(noteFinanceNowButton.dataset.noteSetFinanceToday);
    return;
  }

  const scheduleDuplicateLineButton = event.target.closest("[data-schedule-line-duplicate]");
  if (scheduleDuplicateLineButton) {
    duplicateScheduleDraftLine(scheduleDuplicateLineButton.dataset.scheduleLineDuplicate);
    return;
  }

  const scheduleRemoveLineButton = event.target.closest("[data-schedule-line-remove]");
  if (scheduleRemoveLineButton) {
    removeScheduleDraftLine(scheduleRemoveLineButton.dataset.scheduleLineRemove);
    return;
  }

  const scheduleFocusLineButton = event.target.closest("[data-schedule-focus-line]");
  if (scheduleFocusLineButton) {
    focusScheduleLine(scheduleFocusLineButton.dataset.scheduleFocusLine);
    return;
  }

  const scheduleHistoryOpenButton = event.target.closest("[data-schedule-history-open]");
  if (scheduleHistoryOpenButton) {
    openScheduleHistoryDay(scheduleHistoryOpenButton.dataset.scheduleHistoryOpen).catch((error) =>
      showToast(error.message, "error")
    );
    return;
  }

  const scheduleHistoryDuplicateButton = event.target.closest("[data-schedule-history-duplicate]");
  if (scheduleHistoryDuplicateButton) {
    openScheduleHistoryDay(scheduleHistoryDuplicateButton.dataset.scheduleHistoryDuplicate, { duplicate: true }).catch(
      (error) => showToast(error.message, "error")
    );
    return;
  }

  const scheduleHistoryPrintButton = event.target.closest("[data-schedule-history-print]");
  if (scheduleHistoryPrintButton) {
    openScheduleHistoryDay(scheduleHistoryPrintButton.dataset.scheduleHistoryPrint, { printMode: "pdf" }).catch(
      (error) => showToast(error.message, "error")
    );
    return;
  }

  const dossierNavigationButton = event.target.closest("[data-dossier-navigate]");
  if (dossierNavigationButton) {
    navigateVehicleDossierContext(dossierNavigationButton.dataset.dossierNavigate);
    return;
  }

  const shortcut = event.target.closest("[data-fuel-shortcut]");
  if (shortcut) {
    const action = shortcut.dataset.fuelShortcut;
    if (action === "new") {
      scrollToElement(refs.fuelForm);
      refs.fuelForm.elements.vehicleId.focus();
    }

    if (action === "last7") {
      const end = currentLocalDateTime();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      refs.fuelFilterFrom.value = toLocalDateTimeInput(startDate.toISOString()).slice(0, 16);
      refs.fuelFilterTo.value = end;
      refreshFuel();
    }

    if (action === "today") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      refs.fuelFilterFrom.value = toLocalDateTimeInput(start.toISOString()).slice(0, 16);
      refs.fuelFilterTo.value = currentLocalDateTime();
      refreshFuel();
    }

    if (action === "clear") {
      clearFuelHistoryFilters();
    }
    return;
  }

  const categoryToggle = event.target.closest("[data-checklist-category-toggle]");
  if (categoryToggle) {
    const category = categoryToggle.dataset.checklistCategoryToggle;
    state.checklistCollapsedCategories = {
      ...state.checklistCollapsedCategories,
      [category]: !state.checklistCollapsedCategories[category],
    };
    renderChecklistComposer();
    return;
  }

  const checklistStatusButton = event.target.closest("[data-checklist-status-button]");
  if (!checklistStatusButton) {
    return;
  }

  const { checklistKey, checklistStatus } = checklistStatusButton.dataset;
  state.checklistDraftItems = ensureChecklistDraft().map((item) =>
    item.key === checklistKey ? { ...item, status: checklistStatus } : item
  );
  renderChecklistComposer();
}

function handleInteractiveChanges(event) {
  const focusPlateField = event.target.closest("[data-dashboard-focus-plate]");
  if (focusPlateField) {
    handleDashboardFocusPlateChange(focusPlateField.value).catch((error) => showToast(error.message, "error"));
    return;
  }

  const scheduleField = event.target.closest("[data-schedule-line-field]");
  if (scheduleField) {
    updateScheduleDraftField(
      scheduleField.dataset.scheduleLineId,
      scheduleField.dataset.scheduleLineField,
      scheduleField.value
    );
  }
}

function handleInteractiveInputs(event) {
  const scheduleField = event.target.closest("[data-schedule-line-field]");
  if (scheduleField) {
    updateScheduleDraftField(
      scheduleField.dataset.scheduleLineId,
      scheduleField.dataset.scheduleLineField,
      scheduleField.value
    );
    return;
  }

  const notesField = event.target.closest("[data-checklist-item-notes]");
  if (!notesField) {
    return;
  }

  const checklistKey = notesField.dataset.checklistItemNotes;
  state.checklistDraftItems = ensureChecklistDraft().map((item) =>
    item.key === checklistKey ? { ...item, notes: notesField.value } : item
  );
}

function markChecklistDraftAsOk() {
  state.checklistDraftItems = ensureChecklistDraft().map((item) => ({
    ...item,
    status: "OK",
  }));
  renderChecklistComposer();
}

function addTemporaryChecklistItem() {
  const label = refs.checklistTemporaryItemInput?.value?.trim() || "";
  if (!label) {
    showToast("Informe o problema ou item temporario que deseja acompanhar.", "error");
    return;
  }

  const key = normalizeClientKey(label);
  const alreadyExists = ensureChecklistDraft().some((item) => item.key === key);
  if (alreadyExists) {
    showToast("Esse item temporario ja esta na conferencia atual.", "error");
    return;
  }

  state.checklistDraftItems = [
    ...ensureChecklistDraft(),
    {
      key,
      label,
      description: "Item temporario adicionado para a conferencia atual.",
      category: "Outros",
      required: false,
      active: true,
      vehicleType: "",
      notes: "",
      status: "ATTENTION",
    },
  ];
  if (refs.checklistTemporaryItemInput) {
    refs.checklistTemporaryItemInput.value = "";
  }
  renderChecklistComposer();
}

function refreshScheduleSummary() {
  const items = getSchedulePreviewItems();
  const uniqueVehicles = new Set(items.map((item) => item.vehicle).filter(Boolean));
  const uniqueDrivers = new Set(items.map((item) => item.driver).filter(Boolean));
  const assistants = items.filter((item) => item.assistant).length;

  refs.scheduleSummaryCards.innerHTML = [
    { label: "Linhas do dia", value: items.length, icon: "schedules", tone: "brand" },
    { label: "Placas", value: uniqueVehicles.size, icon: "vehicle", tone: "neutral" },
    { label: "Motoristas", value: uniqueDrivers.size, icon: "team", tone: "warning" },
    { label: "Ajudantes", value: assistants, icon: "dashboard", tone: "success" },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card operations-kpi-card--compact",
        label: item.label,
        value: formatNumber(item.value),
        note: "Baseado na edicao atual",
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.scheduleNotesFeed.innerHTML = items.length
    ? items
        .filter((item) => item.notes)
        .slice(0, 4)
        .map(
          (item) => `
            <article class="stack-item">
              <strong>${escapeHtml(item.vehicle || "Sem placa")}</strong>
              <p class="muted">${escapeHtml(item.location || "Rota nao informada")}</p>
              <p class="muted">${escapeHtml(item.notes)}</p>
            </article>
          `
        )
        .join("") ||
      `<div class="stack-item"><strong>Sem observacoes adicionais</strong><p class="muted">Cadastre notas operacionais na escala para aparecerem aqui.</p></div>`
    : `<div class="stack-item"><strong>Nenhuma escala do dia</strong><p class="muted">Adicione linhas para visualizar o resumo operacional.</p></div>`;
}

function renderFuel() {
  const analytics = buildFuelPageAnalytics(state.fuelRecords);
  const currentPlate = refs.fuelFilterPlate?.value || "";
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.innerHTML = `<option value="">Todos os veiculos</option>${analytics.plates
      .map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`)
      .join("")}`;
    refs.fuelFilterPlate.value = analytics.plates.includes(currentPlate) ? currentPlate : "";
  }

  const visibleRecords =
    refs.fuelFilterPlate?.value
      ? state.fuelRecords.filter((item) => item.plate === refs.fuelFilterPlate.value)
      : state.fuelRecords;

  refs.fuelKpiGrid.innerHTML = [
    {
      label: "Abastecimentos",
      value: formatNumber(analytics.monthExitRecords.length),
      note: "Saidas no mes atual",
      icon: "fuel",
      tone: "brand",
    },
    {
      label: "Total de litros",
      value: `${formatLiters(analytics.monthLiters)} L`,
      note: "Consumo do mes atual",
      icon: "analytics",
      tone: "neutral",
    },
    {
      label: "Media por lancamento",
      value: `${formatLiters(analytics.avgLiters)} L`,
      note: "Considerando apenas saidas",
      icon: "dashboard",
      tone: "warning",
    },
    {
      label: "Media km/L",
      value: formatKmPerLiter(analytics.avgKmPerLiter),
      note: "Com base nos hodometros informados",
      icon: "efficiency",
      tone: "success",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card",
        label: item.label,
        value: item.value,
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.fuelStocksGrid.innerHTML = state.fuelStorages.length
    ? state.fuelStorages
        .map((storage) => {
          const isEmpty = Number(storage.currentBalance || 0) <= 0;
          const isLow =
            !isEmpty &&
            Number(storage.minBalance || 0) > 0 &&
            Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0);
          const statusLabel = isEmpty ? "Sem saldo" : isLow ? "Abaixo do minimo" : "Operacional";
          const toneClass = isEmpty ? "is-empty" : isLow ? "is-low" : "is-ok";

          return `
            <article class="fuel-stock-card ${toneClass}">
              <div class="fuel-stock-card__top">
                <span class="fuel-stock-card__kind">${escapeHtml(formatFuelKindLabel(storage.fuelKind))}</span>
                <span class="fuel-stock-card__status">${escapeHtml(statusLabel)}</span>
              </div>
              <div class="fuel-stock-card__value-row">
                <strong class="fuel-stock-card__value">${escapeHtml(formatLiters(storage.currentBalance))}</strong>
                <span class="fuel-stock-card__unit">L</span>
              </div>
              <div class="fuel-stock-card__footer">
                <strong>${escapeHtml(storage.name)}</strong>
                <span>Saldo disponivel agora</span>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="stack-item"><strong>Nenhum estoque configurado</strong><p class="muted">Cadastre ou revise os estoques principais de combustivel.</p></div>`;

  refs.fuelTableBody.innerHTML = visibleRecords.length
    ? visibleRecords
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.storageName || "-")}</td>
              <td>${escapeHtml(formatFuelKindLabel(item.fuelKind))}</td>
              <td>${statusBadge(item.type)}</td>
              <td>${escapeHtml(item.vehicleId ? [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(" / ") || "Veiculo cadastrado" : "-")}</td>
              <td>
                <div>${escapeHtml(item.plate || "-")}</div>
                ${
                  item.suspicious
                    ? `<div><span class="status-badge status-yellow">Suspeito</span></div><div class="muted">${escapeHtml(
                        item.suspiciousReasons.join(" | ")
                      )}</div>`
                    : ""
                }
              </td>
              <td>${escapeHtml(formatNumber(item.quantity || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}</td>
              <td>${escapeHtml(formatNumber(item.balanceBefore || 0, 2, 2))} L</td>
              <td>${escapeHtml(formatNumber(item.balanceAfter || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(item.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum abastecimento registrado.", 11);

  refs.fuelConsumptionChart.innerHTML = renderConsumptionChart({
    consumptionSeries: analytics.consumptionSeries,
    totalConsumptionLiters: analytics.consumptionSeries.reduce((total, item) => total + item.total, 0),
    peakConsumption: analytics.peakConsumption,
    fuelMix: analytics.fuelMix,
  });

  refs.fuelTopVehicles.innerHTML = renderMeterList(
    analytics.topVehicles.map((item) => ({
      label: item.plate,
      value: item.liters,
      count: item.count,
    })),
    {
      emptyTitle: "Sem consumo no periodo",
      emptyDescription: "Assim que houver saidas registradas, os veiculos de maior consumo aparecem aqui.",
      valueFormatter: (value) => `${formatLiters(value)} L`,
      secondaryFormatter: (item) => `${item.count} lancamento(s)`,
    }
  );

  refs.fuelSideInsights.innerHTML = buildFuelSideInsights(analytics);
}

function renderSchedules() {
  const items = getSchedulePreviewItems();
  refs.schedulesTableBody.innerHTML = items.length
    ? items
        .map(
          (item, index) => `
            <tr>
              <td>${escapeHtml(formatNumber(index + 1))}</td>
              <td>
                <strong>${escapeHtml(item.vehicle || "-")}</strong>
                <div class="muted">${escapeHtml(formatDateOnly(refs.scheduleForm.elements.scheduledDate.value || currentLocalDate()))}</div>
              </td>
              <td>${escapeHtml(item.location || "Rota nao informada")}</td>
              <td>${escapeHtml(item.driver || "-")}</td>
              <td>${escapeHtml(item.assistant || "-")}</td>
              <td>${escapeHtml(item.departureTime || "-")}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="ghost-button compact-button" data-schedule-focus-line="${escapeHtml(item.localId || String(item.id || ""))}">Editar</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma linha adicionada para a escala selecionada.", 7);

  refreshScheduleSummary();
  syncResponsiveTableLabels();
}

function renderChecklists() {
  refs.checklistsTableBody.innerHTML = state.checklists.length
    ? state.checklists
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateTime(item.checklistDate))}</td>
              <td>
                <strong>${escapeHtml(item.vehicle)}</strong>
                <div class="muted">${escapeHtml(item.driverName || "-")}</div>
              </td>
              <td>${statusBadge(item.status)}</td>
              <td>${escapeHtml(
                `${item.itemSummary?.ok || 0} OK • ${item.itemSummary?.attention || 0} atencao • ${item.itemSummary?.critical || 0} critico`
              )}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-checklist", item.id, "Editar checklist", "&#9998;")}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum checklist cadastrado.", 5);

  renderChecklistComposer();
  renderChecklistTemplateTable();
  syncResponsiveTableLabels();
}

async function refreshSchedules() {
  const query = new URLSearchParams();
  const selectedDate = refs.scheduleForm?.elements.scheduledDate?.value || currentLocalDate();
  query.set("date", selectedDate);
  if (refs.scheduleHistoryDate?.value) query.set("historyDate", refs.scheduleHistoryDate.value);
  if (refs.scheduleHistoryPlate?.value.trim()) query.set("plate", refs.scheduleHistoryPlate.value.trim());
  if (refs.scheduleHistoryDriver?.value.trim()) query.set("driver", refs.scheduleHistoryDriver.value.trim());

  const response = await api(`/api/schedules?${query.toString()}`);
  state.schedules = response.items || [];
  state.schedule.history = response.history || [];
  state.schedule.suggestions = response.suggestions || state.schedule.suggestions;

  const currentSelectedDate = refs.scheduleForm?.elements.scheduledDate?.value || selectedDate;
  const shouldHydrate =
    !state.schedule.hasUnsavedChanges ||
    currentSelectedDate !== (state.schedule.day?.scheduledDate || "") ||
    Number(response.day?.id || 0) !== Number(state.schedule.dayId || 0);

  if (response.day && shouldHydrate) {
    hydrateScheduleWorkspaceFromDay(response.day);
    syncResponsiveTableLabels();
    return;
  }

  if (!response.day && shouldHydrate) {
    refs.scheduleForm.elements.id.value = "";
    refs.scheduleForm.elements.scheduledDate.value = response.selectedDate || selectedDate;
    if (!refs.scheduleForm.elements.documentTitle.value) {
      refs.scheduleForm.elements.documentTitle.value = "ESCALA OPERACIONAL DIARIA";
    }
    if (!refs.scheduleForm.elements.responsibleName.value) {
      refs.scheduleForm.elements.responsibleName.value = state.user?.name || "";
    }
    state.schedule.dayId = null;
    state.schedule.day = null;
    state.schedule.draftLines = normalizeScheduleDraftLines([]);
    state.schedule.hasUnsavedChanges = false;
    state.schedule.previewVisible = false;
  }

  renderScheduleSuggestions();
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleHistory();
  renderScheduleDocumentPreview();
  syncResponsiveTableLabels();
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  const model = buildScheduleDraftModel();
  const payload = {
    scheduledDate: model.scheduledDate,
    documentTitle: model.documentTitle,
    responsibleName: model.responsibleName,
    generalNotes: model.generalNotes,
    entries: model.entries.map((entry, index) => ({
      vehicle: entry.vehicle,
      location: entry.location,
      driver: entry.driver,
      assistant: entry.assistant,
      departureTime: entry.departureTime,
      notes: entry.notes,
      lineOrder: index + 1,
    })),
  };

  if (!payload.entries.length) {
    showToast("Adicione ao menos uma linha operacional para salvar a escala.", "error");
    return;
  }

  try {
    const scheduleDayId = state.schedule.dayId || refs.scheduleForm.elements.id.value;
    await api(scheduleDayId ? `/api/schedules/${scheduleDayId}` : "/api/schedules", {
      method: scheduleDayId ? "PUT" : "POST",
      body: payload,
    });
    state.schedule.previewVisible = true;
    await Promise.all([refreshSchedules(), refreshDashboard(), maybeRefreshAdmin()]);

    if (
      state.dossier.selectedPlate &&
      payload.entries.some((entry) => normalizeClientPlateKey(entry.vehicle) === normalizeClientPlateKey(state.dossier.selectedPlate))
    ) {
      await loadVehicleDossierByPlate(state.dossier.selectedPlate, { silent: true });
    }

    showToast(scheduleDayId ? "Escala atualizada com sucesso." : "Escala salva com sucesso.");
  } catch (error) {
    if (error.status === 409 && error.data?.day) {
      hydrateScheduleWorkspaceFromDay(error.data.day, { preservePreview: true });
      showToast("Ja existe uma escala para esta data. A versao salva foi carregada para revisao.", "error");
      return;
    }
    showToast(error.message, "error");
  }
}

function editSchedule(id) {
  const line = getSchedulePreviewItems().find(
    (item) => Number(item.id || 0) === Number(id) || String(item.localId || "") === String(id)
  );
  if (!line) {
    return;
  }
  focusScheduleLine(line.localId || String(id));
}

function resetScheduleForm() {
  refs.scheduleForm.reset();
  refs.scheduleForm.elements.id.value = "";
  refs.scheduleForm.elements.scheduledDate.value = currentLocalDate();
  refs.scheduleForm.elements.documentTitle.value = "ESCALA OPERACIONAL DIARIA";
  refs.scheduleForm.elements.responsibleName.value = state.user?.name || "";
  refs.scheduleForm.elements.documentMode.value = "filled";
  state.schedule.dayId = null;
  state.schedule.day = null;
  state.schedule.draftLines = normalizeScheduleDraftLines([]);
  state.schedule.previewVisible = false;
  state.schedule.hasUnsavedChanges = false;
  renderScheduleLinesEditor();
  renderSchedules();
  renderScheduleDocumentPreview();
}

async function handleChecklistSubmit(event) {
  event.preventDefault();
  const id = refs.checklistForm.elements.id.value;
  const itemsDetailed = ensureChecklistDraft();
  const payload = {
    vehicle: refs.checklistForm.elements.vehicle.value,
    checklistDate: toIsoDateTime(refs.checklistForm.elements.checklistDate.value),
    checklistType: refs.checklistForm.elements.checklistType.value,
    driverName: refs.checklistForm.elements.driverName.value,
    odometerKm: refs.checklistForm.elements.odometerKm.value,
    signatureName: refs.checklistForm.elements.signatureName.value,
    temporaryIssue: refs.checklistForm.elements.temporaryIssue?.value || "",
    status: deriveChecklistOverallStatus(itemsDetailed),
    items: itemsDetailed.map((item) => item.label).join("\n"),
    itemsDetailed,
    problems: refs.checklistForm.elements.problems.value,
  };

  try {
    await api(id ? `/api/checklists/${id}` : "/api/checklists", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetChecklistForm();
    await Promise.all([refreshChecklists(), maybeRefreshAdmin()]);

    if (state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(payload.vehicle)) {
      await loadVehicleDossierByPlate(payload.vehicle, { silent: true });
    }

    showToast(id ? "Checklist atualizado." : "Checklist cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function editChecklist(id) {
  const item = findById(state.checklists, id);
  if (!item) return;

  refs.checklistForm.elements.id.value = item.id;
  refs.checklistForm.elements.vehicle.value = item.vehicle;
  refs.checklistForm.elements.checklistDate.value = toLocalDateTimeInput(item.checklistDate);
  refs.checklistForm.elements.checklistType.value = item.checklistType || "PRE_USE";
  refs.checklistForm.elements.driverName.value = item.driverName || "";
  refs.checklistForm.elements.odometerKm.value = item.odometerKm ?? "";
  refs.checklistForm.elements.signatureName.value = item.signatureName || "";
  if (refs.checklistForm.elements.temporaryIssue) {
    refs.checklistForm.elements.temporaryIssue.value = item.temporaryIssue || "";
  }
  refs.checklistForm.elements.status.value = item.status;
  refs.checklistForm.elements.items.value = item.items.join("\n");
  refs.checklistForm.elements.problems.value = item.problems || "";
  state.checklistDraftItems = buildChecklistDraftFromRecord(item);
  renderChecklistComposer();
  setSection("checklists");
}

function resetChecklistForm() {
  refs.checklistForm.reset();
  refs.checklistForm.elements.id.value = "";
  refs.checklistForm.elements.checklistDate.value = currentLocalDateTime();
  refs.checklistForm.elements.checklistType.value = "PRE_USE";
  refs.checklistForm.elements.status.value = "OK";
  refs.checklistForm.elements.signatureName.value = "";
  if (refs.checklistForm.elements.temporaryIssue) {
    refs.checklistForm.elements.temporaryIssue.value = "";
  }
  state.checklistDraftItems = cloneChecklistTemplate();
  renderChecklistComposer();
}

async function openScanner(targetId) {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
    showToast("Seu navegador não permite acesso à câmera.", "error");
    return;
  }

  if (!("BarcodeDetector" in window)) {
    showToast("BarcodeDetector não está disponível. Use a digitação manual.", "error");
    return;
  }

  try {
    closeScanner();
    refs.scannerModal.classList.remove("hidden");
    refs.scannerStatus.textContent = "Inicializando câmera traseira...";
    state.scanner.targetId = targetId;
    state.scanner.detector = new window.BarcodeDetector({
      formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e"],
    });
    state.scanner.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    refs.scannerVideo.srcObject = state.scanner.stream;
    refs.scannerStatus.textContent = "Aponte a câmera para o código de barras.";
    scanLoop();
  } catch (error) {
    showToast("Não foi possível abrir a câmera.", "error");
    closeScanner();
  }
}

async function scanLoop() {
  if (!state.scanner.detector || !refs.scannerVideo.srcObject) {
    return;
  }

  try {
    const targetId = state.scanner.targetId;
    const results = await state.scanner.detector.detect(refs.scannerVideo);
    if (results.length) {
      const value = results[0].rawValue;
      const input = $(targetId);
      if (input) {
        input.value = value;
      }
      refs.scannerStatus.textContent = `Código lido: ${value}`;
      closeScanner();
      if (targetId === "movement-barcode-input") {
        await lookupProductByBarcode();
      }
      return;
    }
  } catch (error) {
    refs.scannerStatus.textContent = "Lendo imagem da câmera...";
  }

  state.scanner.timer = window.setTimeout(scanLoop, 400);
}

function closeScanner() {
  if (state.scanner.timer) {
    window.clearTimeout(state.scanner.timer);
  }

  state.scanner.stream?.getTracks?.().forEach((track) => track.stop());
  refs.scannerVideo.srcObject = null;
  refs.scannerModal.classList.add("hidden");
  refs.scannerStatus.textContent = "Aguardando câmera...";
  state.scanner = {
    stream: null,
    timer: null,
    targetId: null,
    detector: null,
  };
}

function updateMovementProductSelect() {
  const commonProducts = getProductsByStockType("COMMON");
  const currentValue = refs.movementProductSelect?.value || "";
  if (!refs.movementProductSelect) {
    return;
  }

  refs.movementProductSelect.innerHTML = commonProducts.length
    ? `<option value="">Selecione um produto</option>${commonProducts
        .map(
          (product) => `
            <option value="${product.id}">
              ${escapeHtml(product.name)} (${escapeHtml(formatNumber(product.currentStock || 0, 2, 2))} ${escapeHtml(product.unit)})
            </option>
          `
        )
        .join("")}`
    : `<option value="">Cadastre um item de almoxarifado primeiro</option>`;

  if (currentValue && commonProducts.some((product) => String(product.id) === String(currentValue))) {
    refs.movementProductSelect.value = currentValue;
  }
}

function getLinkedFuelProducts() {
  const productMap = new Map();

  state.fuelStorages.forEach((storage) => {
    const product = state.products.find((item) => String(item.id) === String(storage.productId || ""));
    if (!product) {
      return;
    }

    const productId = String(product.id);
    const normalizedFuelKind = normalizeClientFuelKind(storage.fuelKind, "");
    const existing =
      productMap.get(productId) || {
        ...product,
        linkedFuelKinds: [],
        linkedStorageNames: [],
      };

    if (normalizedFuelKind && !existing.linkedFuelKinds.includes(normalizedFuelKind)) {
      existing.linkedFuelKinds.push(normalizedFuelKind);
    }
    if (storage.name && !existing.linkedStorageNames.includes(storage.name)) {
      existing.linkedStorageNames.push(storage.name);
    }

    productMap.set(productId, existing);
  });

  return Array.from(productMap.values()).map((product) => ({
    ...product,
    linkedFuelKind: product.linkedFuelKinds.length === 1 ? product.linkedFuelKinds[0] : "",
    linkedStorageName:
      product.linkedStorageNames.length === 1
        ? product.linkedStorageNames[0]
        : product.linkedStorageNames.length
          ? "Multiplos estoques"
          : "",
  }));
}

function getKardexFuelProducts() {
  const linkedFuelProducts = getLinkedFuelProducts();
  const fuelProducts = linkedFuelProducts.length ? linkedFuelProducts : getProductsByStockType("FUEL");
  const selectedFuelKind = normalizeClientFuelKind(refs.kardexForm?.elements.fuelKind?.value || "", "");

  if (!selectedFuelKind) {
    return fuelProducts;
  }

  return fuelProducts.filter((product) => {
    const productFuelKind = inferClientFuelKind(product.linkedFuelKind || product.fuelKind || product.name, "");
    return !productFuelKind || productFuelKind === selectedFuelKind;
  });
}

function updateFuelStockProductSelect() {
  if (!refs.fuelStockProductSelect) {
    return;
  }

  const linkedFuelProducts = getLinkedFuelProducts();
  const fuelProducts = linkedFuelProducts.length ? linkedFuelProducts : getProductsByStockType("FUEL");
  const currentValue = refs.fuelStockProductSelect.value;
  refs.fuelStockProductSelect.innerHTML = fuelProducts.length
    ? `<option value="">Selecione um combustivel</option>${fuelProducts
        .map(
          (product) => `
            <option value="${product.id}">
              ${escapeHtml(product.name)}
              ${product.linkedFuelKind ? ` | ${escapeHtml(formatFuelKindLabel(product.linkedFuelKind))}` : ""}
              ${product.linkedStorageName ? ` | ${escapeHtml(product.linkedStorageName)}` : ""}
              (${escapeHtml(formatNumber(product.currentStock || 0, 2, 2))} ${escapeHtml(product.unit)})
            </option>
          `
        )
        .join("")}`
    : `<option value="">Nenhum combustivel cadastrado</option>`;

  refs.fuelStockProductSelect.disabled = !fuelProducts.length;
  if (currentValue && fuelProducts.some((product) => String(product.id) === String(currentValue))) {
    refs.fuelStockProductSelect.value = currentValue;
  }
}

function renderFuelStorageOptions() {
  const storageOptions = state.fuelStorages.length
    ? state.fuelStorages
        .map(
          (storage) => `
            <option value="${storage.id}">
              ${escapeHtml(storage.name)} | ${escapeHtml(formatFuelKindLabel(storage.fuelKind))} | ${escapeHtml(formatLiters(storage.currentBalance))} L
            </option>
          `
        )
        .join("")
    : `<option value="">Nenhum estoque disponivel</option>`;

  const currentFormValue = refs.fuelStorageSelect?.value || "";
  if (refs.fuelStorageSelect) {
    refs.fuelStorageSelect.innerHTML = storageOptions;
    if (
      currentFormValue &&
      state.fuelStorages.some((storage) => String(storage.id) === String(currentFormValue))
    ) {
      refs.fuelStorageSelect.value = currentFormValue;
    } else if (state.fuelStorages.length) {
      refs.fuelStorageSelect.value = String(state.fuelStorages[0].id);
    }
  }

  const currentFilterValue = refs.fuelFilterStorage?.value || "";
  if (refs.fuelFilterStorage) {
    refs.fuelFilterStorage.innerHTML = `<option value="">Todos os combustiveis</option>${storageOptions}`;
    if (
      currentFilterValue &&
      state.fuelStorages.some((storage) => String(storage.id) === String(currentFilterValue))
    ) {
      refs.fuelFilterStorage.value = currentFilterValue;
    }
  }

  updateFuelStockProductSelect();
}

function updateKardexProductSelect() {
  if (!refs.kardexProductSelect) {
    return;
  }

  const stockType = normalizeClientStockType(refs.kardexStockType?.value || "COMMON", "COMMON");
  const products = stockType === "FUEL" ? getKardexFuelProducts() : getProductsByStockType(stockType);
  const currentValue = refs.kardexProductSelect.value;
  const emptyLabel =
    stockType === "FUEL"
      ? refs.kardexForm?.elements.fuelKind?.value
        ? `Nenhum combustivel compativel com ${formatFuelKindLabel(refs.kardexForm.elements.fuelKind.value)}`
        : "Cadastre ou vincule um combustivel primeiro"
      : "Cadastre um item de almoxarifado primeiro";

  refs.kardexProductSelect.innerHTML = products.length
    ? `<option value="">Selecione um produto</option>${products
        .map(
          (product) => `
            <option value="${product.id}">
              ${escapeHtml(product.name)}
              ${
                stockType === "FUEL" && inferClientFuelKind(product.linkedFuelKind || product.fuelKind || product.name, "")
                  ? ` | ${escapeHtml(formatFuelKindLabel(inferClientFuelKind(product.linkedFuelKind || product.fuelKind || product.name, "")))}`
                  : ""
              }
              (${escapeHtml(product.unit)})
            </option>
          `
        )
        .join("")}`
    : `<option value="">${emptyLabel}</option>`;

  if (currentValue && products.some((product) => String(product.id) === String(currentValue))) {
    refs.kardexProductSelect.value = currentValue;
  }
}

function syncProductFormState() {
  if (!refs.productForm) {
    return;
  }

  const stockType = normalizeClientStockType(refs.productForm.elements.stockType.value, "COMMON");
  const unitField = refs.productForm.elements.unit;
  const currentUnit = String(unitField.value || "").trim().toUpperCase();

  if (stockType === "FUEL") {
    if (!currentUnit || currentUnit === "UN") {
      unitField.value = "L";
    }
  } else if (!currentUnit) {
    unitField.value = "UN";
  }
}

function syncKardexFormState() {
  if (!refs.kardexForm) {
    return;
  }

  const stockType = normalizeClientStockType(refs.kardexForm.elements.stockType.value, "COMMON");
  const fuelKindField = refs.kardexForm.elements.fuelKind;
  const isFuel = stockType === "FUEL";
  if (fuelKindField) {
    fuelKindField.disabled = !isFuel;
    fuelKindField.required = false;
    if (!isFuel) {
      fuelKindField.value = "";
    }
  }

  updateKardexProductSelect();
}

function renderProducts() {
  const commonProducts = getProductsByStockType("COMMON");

  refs.productsTableBody.innerHTML = commonProducts.length
    ? commonProducts
        .map(
          (product) => `
            <tr>
              <td>
                <strong>${escapeHtml(product.name)}</strong>
                ${product.lowStock ? `<div><span class="status-badge status-red">Estoque minimo</span></div>` : ""}
              </td>
              <td>${escapeHtml(formatStockTypeLabel(product.stockType))}</td>
              <td>${escapeHtml(formatNumber(product.currentStock || 0, 2, 2))} ${escapeHtml(product.unit)}</td>
              <td>${escapeHtml(formatNumber(product.minStock || 0, 2, 2))} ${escapeHtml(product.unit)}</td>
              <td>${escapeHtml(formatCurrency(product.defaultCost || 0))}</td>
              <td>${escapeHtml(product.barcode || "-")}</td>
              <td>
                <div class="row-actions">
                  ${buildRowActionButton("edit-product", product.id, "Editar produto", "&#9998;")}
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum item de almoxarifado cadastrado.", 7);

  syncResponsiveTableLabels();
}

function renderInventoryMovements() {
  const commonMovements = getInventoryMovementsByStockType("COMMON");

  refs.inventoryMovementsBody.innerHTML = commonMovements.length
    ? commonMovements
        .map(
          (movement) => `
            <tr>
              <td>${escapeHtml(movement.productName)}</td>
              <td>${statusBadge(movement.type)}</td>
              <td>${escapeHtml(formatNumber(movement.quantity || 0, 2, 2))}</td>
              <td>${escapeHtml(movement.document || "-")}</td>
              <td>${escapeHtml(formatCurrency(movement.unitCost || 0))}</td>
              <td>${escapeHtml(formatCurrency(movement.totalCost || 0))}</td>
              <td>${escapeHtml(formatNumber(movement.balanceAfter || 0, 2, 2))}</td>
              <td>${escapeHtml(movement.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(movement.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma movimentacao de almoxarifado registrada.", 9);

  syncResponsiveTableLabels();
}

function renderFuelInventoryMovements() {
  if (!refs.fuelInventoryMovementsBody) {
    return;
  }

  const fuelMovements = getFilteredFuelInventoryMovements();
  refs.fuelInventoryMovementsBody.innerHTML = fuelMovements.length
    ? fuelMovements
        .map(
          (movement) => `
            <tr>
              <td>${escapeHtml(movement.productName)}</td>
              <td>${statusBadge(movement.type)}</td>
              <td>${escapeHtml(formatNumber(movement.quantity || 0, 2, 2))} ${escapeHtml(movement.productUnit || "L")}</td>
              <td>
                <div>${escapeHtml(movement.document || "-")}</div>
                ${
                  movement.suspicious
                    ? `<div><span class="status-badge status-yellow">Suspeito</span></div><div class="muted">${escapeHtml(
                        movement.suspiciousReasons.join(" | ")
                      )}</div>`
                    : ""
                }
              </td>
              <td>${escapeHtml(formatCurrency(movement.unitCost || 0))}</td>
              <td>${escapeHtml(formatCurrency(movement.totalCost || 0))}</td>
              <td>${escapeHtml(`${formatNumber(movement.balanceAfter || 0, 2, 2)} ${movement.productUnit || "L"}`)}</td>
              <td>${escapeHtml(movement.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(movement.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma movimentacao de combustivel registrada.", 9);
}

function editProduct(id) {
  const product = findById(state.products, id);
  if (!product) return;

  refs.productForm.elements.id.value = product.id;
  refs.productForm.elements.name.value = product.name;
  refs.productForm.elements.unit.value = product.unit;
  refs.productForm.elements.stockType.value = normalizeClientStockType(product.stockType, "COMMON");
  refs.productForm.elements.barcode.value = product.barcode || "";
  refs.productForm.elements.minStock.value = formatDecimalInputValue(product.minStock || 0, 2);
  refs.productForm.elements.defaultCost.value = formatDecimalInputValue(product.defaultCost || 0, 2);
  refs.productForm.elements.initialStock.value = formatDecimalInputValue(0, 2);
  refs.productForm.elements.initialStock.disabled = true;
  syncProductFormState();
  setSection("inventory");
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const id = refs.productForm.elements.id.value;

  let minStock = 0;
  let defaultCost = 0;
  let initialStock = 0;

  try {
    minStock = readBrazilianNumberField(refs.productForm.elements.minStock, {
      label: "estoque minimo",
      min: 0,
    }) ?? 0;
    defaultCost = readBrazilianNumberField(refs.productForm.elements.defaultCost, {
      label: "custo padrao",
      min: 0,
    }) ?? 0;
    initialStock = readBrazilianNumberField(refs.productForm.elements.initialStock, {
      label: "saldo inicial",
      min: 0,
    }) ?? 0;
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const payload = {
    name: refs.productForm.elements.name.value,
    unit: refs.productForm.elements.unit.value,
    stockType: refs.productForm.elements.stockType.value,
    barcode: refs.productForm.elements.barcode.value,
    minStock,
    defaultCost,
    initialStock,
  };

  try {
    await api(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetProductForm();
    await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshFuel(), refreshDashboard()]);
    showToast(id ? "Produto atualizado." : "Produto cadastrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleMovementSubmit(event) {
  event.preventDefault();

  let quantity = 0;
  let unitCost = null;

  try {
    quantity = readBrazilianNumberField(refs.movementForm.elements.quantity, {
      label: "quantidade",
      required: true,
      min: 0.000001,
    });
    unitCost = readBrazilianNumberField(refs.movementForm.elements.unitCost, {
      label: "valor unitario",
      min: 0,
    });
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const payload = {
    productId: refs.movementForm.elements.productId.value,
    stockType: "COMMON",
    type: refs.movementForm.elements.type.value,
    quantity,
    document: refs.movementForm.elements.document.value,
    branchName: refs.movementForm.elements.branchName.value,
    supplierName: refs.movementForm.elements.supplierName.value,
    unitCost,
    occurredAt: toIsoDateTime(refs.movementForm.elements.occurredAt.value),
    notes: refs.movementForm.elements.notes.value,
  };

  try {
    await api("/api/inventory/movements", { method: "POST", body: payload });
    refs.movementForm.reset();
    refs.movementForm.elements.occurredAt.value = currentLocalDateTime();
    refs.movementBarcodeInput.value = "";
    updateMovementProductSelect();
    await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);
    showToast("Movimentacao do almoxarifado registrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleFuelStockMovementSubmit(event) {
  event.preventDefault();
  if (!refs.fuelStockForm) {
    return;
  }

  let quantity = 0;
  let unitCost = null;

  try {
    quantity = readBrazilianNumberField(refs.fuelStockForm.elements.quantity, {
      label: "quantidade",
      required: true,
      min: 0.000001,
    });
    unitCost = readBrazilianNumberField(refs.fuelStockForm.elements.unitCost, {
      label: "valor unitario",
      min: 0,
    });
  } catch (error) {
    showToast(error.message, "error");
    return;
  }

  const warnings = [];
  if (quantity > 500) {
    warnings.push("Valor de litros muito alto. Confirme se o lançamento está correto.");
  }
  if (unitCost !== null && unitCost > 20) {
    warnings.push("Valor unitario acima de R$ 20,00. Confirme se o lançamento está correto.");
  }
  if (!confirmSuspiciousFuelValues(warnings)) {
    return;
  }

  const payload = {
    productId: refs.fuelStockForm.elements.productId.value,
    stockType: "FUEL",
    type: refs.fuelStockForm.elements.type.value,
    quantity,
    document: refs.fuelStockForm.elements.document.value,
    branchName: refs.fuelStockForm.elements.branchName.value,
    supplierName: refs.fuelStockForm.elements.supplierName.value,
    unitCost,
    occurredAt: toIsoDateTime(refs.fuelStockForm.elements.occurredAt.value),
    notes: refs.fuelStockForm.elements.notes.value,
  };

  try {
    await api("/api/inventory/movements", { method: "POST", body: payload });
    resetFuelStockForm();
    await Promise.all([refreshProducts(), refreshInventoryMovements(), refreshFuel(), refreshDashboard()]);
    showToast("Movimentacao de combustivel registrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function lookupProductByBarcode() {
  const barcode = refs.movementBarcodeInput.value.trim();
  if (!barcode) {
    showToast("Informe um codigo de barras.", "error");
    return;
  }

  try {
    const response = await api(
      `/api/products/barcode/${encodeURIComponent(barcode)}?${new URLSearchParams({ stockType: "COMMON" }).toString()}`
    );
    refs.movementProductSelect.value = String(response.item.id);
    showToast(`Produto encontrado: ${response.item.name}`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function resetProductForm() {
  refs.productForm.reset();
  refs.productForm.elements.id.value = "";
  refs.productForm.elements.stockType.value = "COMMON";
  refs.productForm.elements.unit.value = "UN";
  refs.productForm.elements.minStock.value = formatDecimalInputValue(0, 2);
  refs.productForm.elements.defaultCost.value = formatDecimalInputValue(0, 2);
  refs.productForm.elements.initialStock.value = formatDecimalInputValue(0, 2);
  refs.productForm.elements.initialStock.disabled = false;
  syncProductFormState();
}

function resetFuelStockForm() {
  if (!refs.fuelStockForm) {
    return;
  }

  refs.fuelStockForm.reset();
  refs.fuelStockForm.elements.type.value = "IN";
  refs.fuelStockForm.elements.occurredAt.value = currentLocalDateTime();
  updateFuelStockProductSelect();
}

function buildKardexRequestPayload() {
  const stockType = normalizeClientStockType(refs.kardexForm.elements.stockType.value, "COMMON");
  return {
    productId: refs.kardexForm.elements.productId.value,
    stockType,
    from: refs.kardexForm.elements.from.value ? `${refs.kardexForm.elements.from.value}T00:00:00` : "",
    to: refs.kardexForm.elements.to.value ? `${refs.kardexForm.elements.to.value}T23:59:59` : "",
    branchName: refs.kardexForm.elements.branchName.value,
    fuelKind: stockType === "FUEL" ? normalizeClientFuelKind(refs.kardexForm.elements.fuelKind.value, "") : "",
    document: refs.kardexForm.elements.document.value,
    supplierName: refs.kardexForm.elements.supplierName.value,
  };
}

function renderKardexPreview() {
  if (!refs.kardexPreview) {
    return;
  }

  const report = state.kardexReport;
  if (!report) {
    refs.kardexPreview.innerHTML = `
      <div class="dashboard-empty">
        <strong>Ficha Kardex pronta para consulta</strong>
        <p class="muted">Selecione o produto e o periodo para visualizar, gerar PDF ou imprimir.</p>
      </div>
    `;
    return;
  }

  const reportStockType = normalizeClientStockType(
    report.filters?.stockType || report.product?.stockType || "COMMON",
    "COMMON"
  );
  const filterChips = [
    `<span class="dashboard-chip">Tipo de estoque: ${escapeHtml(formatStockTypeLabel(reportStockType))}</span>`,
    `<span class="dashboard-chip">Filial/unidade: ${escapeHtml(report.filters.branchName || "Todas")}</span>`,
    reportStockType === "FUEL"
      ? `<span class="dashboard-chip">Combustivel: ${escapeHtml(report.filters.fuelKind ? formatFuelKindLabel(report.filters.fuelKind) : "Todos")}</span>`
      : "",
    `<span class="dashboard-chip">Documento: ${escapeHtml(report.filters.document || "Todos")}</span>`,
    `<span class="dashboard-chip">Fornecedor: ${escapeHtml(report.filters.supplierName || "Todos")}</span>`,
  ]
    .filter(Boolean)
    .join("");

  refs.kardexPreview.innerHTML = `
    <div class="kardex-preview">
      <div class="kardex-preview__header">
        <div>
          <span class="eyebrow">Relatorio</span>
          <h3>${escapeHtml(report.reportName)}</h3>
          <p class="muted">${escapeHtml(`${formatDateOnly(report.period.from)} a ${formatDateOnly(report.period.to)}`)}</p>
        </div>
        <div class="kardex-preview__meta">
          <span><strong>Emissao:</strong> ${escapeHtml(formatDateTime(report.issuedAt))}</span>
          <span><strong>Produto:</strong> ${escapeHtml(report.product.name)}</span>
          <span><strong>Unidade:</strong> ${escapeHtml(report.product.unit)}</span>
          <span><strong>Custo:</strong> ${escapeHtml(formatCurrency(report.currentCost || 0))}</span>
          <span><strong>Saldo anterior:</strong> ${escapeHtml(`${formatNumber(report.openingBalance || 0, 2, 2)} ${report.product.unit}`)}</span>
        </div>
      </div>
      <div class="kardex-filter-summary">
        ${filterChips}
      </div>
      ${
        report.lastPurchase
          ? `<div class="stack-item">
              <strong>Ultima compra</strong>
              <p class="muted">${escapeHtml(
                `${formatDateTime(report.lastPurchase.date)} | ${report.lastPurchase.document || "Sem documento"} | ${report.lastPurchase.supplierName || "Sem fornecedor"}`
              )}</p>
            </div>`
          : ""
      }
      <div class="table-wrapper">
        <table class="kardex-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Data</th>
              <th>Entradas</th>
              <th>Saidas</th>
              <th>Unitario</th>
              <th>Valor total</th>
              <th>Saldo</th>
              <th>Observacao</th>
            </tr>
          </thead>
          <tbody>
            <tr class="kardex-table__opening-row">
              <td colspan="6"><strong>Saldo anterior ao periodo</strong></td>
              <td><strong>${escapeHtml(`${formatNumber(report.openingBalance || 0, 2, 2)} ${report.product.unit}`)}</strong></td>
              <td>Base do saldo acumulado</td>
            </tr>
            ${
              report.rows.length
                ? report.rows
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.document || "-")}</td>
                          <td>${escapeHtml(formatDateTime(row.date))}</td>
                          <td>${escapeHtml(row.entryQuantity ? formatNumber(row.entryQuantity, 2, 2) : "-")}</td>
                          <td>${escapeHtml(row.exitQuantity ? formatNumber(row.exitQuantity, 2, 2) : "-")}</td>
                          <td>${escapeHtml(formatCurrency(row.unitCost || 0))}</td>
                          <td>${escapeHtml(formatCurrency(row.totalCost || 0))}</td>
                          <td>${escapeHtml(`${formatNumber(row.balance || 0, 2, 2)} ${report.product.unit}`)}</td>
                          <td>${escapeHtml(row.notes || "-")}</td>
                        </tr>
                      `
                    )
                    .join("")
                : `<tr><td colspan="8" class="muted">Nenhuma movimentacao encontrada para os filtros informados.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Totais do periodo</strong></td>
              <td><strong>${escapeHtml(formatNumber(report.totals.entries || 0, 2, 2))}</strong></td>
              <td><strong>${escapeHtml(formatNumber(report.totals.exits || 0, 2, 2))}</strong></td>
              <td colspan="2"><strong>Saldo final</strong></td>
              <td><strong>${escapeHtml(`${formatNumber(report.totals.finalBalance || 0, 2, 2)} ${report.product.unit}`)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

function buildKardexPrintDocument(report, mode) {
  const reportStockType = normalizeClientStockType(
    report.filters?.stockType || report.product?.stockType || "COMMON",
    "COMMON"
  );
  const company = getDocumentCompany(report.company || { companyName: report.companyName });
  const fuelFilterBlock =
    reportStockType === "FUEL"
      ? `<div><strong>Combustivel:</strong> ${escapeHtml(report.filters.fuelKind ? formatFuelKindLabel(report.filters.fuelKind) : "Todos")}</div>`
      : "";

  return `
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 0; }
      .print-report { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; box-sizing: border-box; }
      .print-brand { margin-bottom: 6mm; border-bottom: 1px solid #111; padding-bottom: 3mm; }
      .print-brand__identity { display: flex; gap: 12px; align-items: center; }
      .print-brand__logo { width: 28mm; height: 18mm; border: 1px solid #111; display: flex; align-items: center; justify-content: center; padding: 2px; box-sizing: border-box; }
      .print-brand__logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
      .print-brand__copy { display: grid; gap: 2px; }
      .print-brand__copy h1 { margin: 0; font-size: 18px; }
      .print-brand__copy p { margin: 0; font-size: 10.5px; }
      .print-report__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 18px; margin: 4mm 0 6mm; font-size: 11px; }
      .print-report__hint { margin-bottom: 4mm; font-size: 11px; }
      .print-report__table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .print-report__table th, .print-report__table td { border: 1.2px solid #111; padding: 5px 6px; font-size: 10px; vertical-align: top; }
      .print-report__table th:nth-child(1), .print-report__table td:nth-child(1) { width: 14%; }
      .print-report__table th:nth-child(2), .print-report__table td:nth-child(2) { width: 14%; }
      .print-report__table th:nth-child(3), .print-report__table td:nth-child(3) { width: 10%; }
      .print-report__table th:nth-child(4), .print-report__table td:nth-child(4) { width: 10%; }
      .print-report__table th:nth-child(5), .print-report__table td:nth-child(5) { width: 11%; }
      .print-report__table th:nth-child(6), .print-report__table td:nth-child(6) { width: 13%; }
      .print-report__table th:nth-child(7), .print-report__table td:nth-child(7) { width: 12%; }
      .print-report__table th:nth-child(8), .print-report__table td:nth-child(8) { width: 16%; }
      .print-report__footer { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 6mm; font-size: 11px; }
      .print-report__footer-note { margin-top: 3mm; font-size: 9px; text-align: right; }
      @page { size: A4 portrait; margin: 10mm; }
    </style>
    <main class="print-report">
      ${buildPrintableCompanyHeader(
        company,
        report.reportName,
        `Periodo: ${formatDateOnly(report.period.from)} a ${formatDateOnly(report.period.to)} | Emissao: ${formatDateTime(report.issuedAt)}`
      )}
      <div class="print-report__meta">
        <div><strong>Produto:</strong> ${escapeHtml(report.product.name)}</div>
        <div><strong>Tipo de estoque:</strong> ${escapeHtml(formatStockTypeLabel(reportStockType))}</div>
        <div><strong>Unidade de medida:</strong> ${escapeHtml(report.product.unit)}</div>
        <div><strong>Filial/unidade:</strong> ${escapeHtml(report.filters.branchName || "Todas")}</div>
        <div><strong>Custo:</strong> ${escapeHtml(formatCurrency(report.currentCost || 0))}</div>
        <div><strong>Fornecedor:</strong> ${escapeHtml(report.filters.supplierName || report.lastPurchase?.supplierName || "-")}</div>
        <div><strong>Ultima compra:</strong> ${escapeHtml(
          report.lastPurchase ? `${formatDateTime(report.lastPurchase.date)} - ${report.lastPurchase.document || "Sem documento"}` : "Nao informada"
        )}</div>
        ${fuelFilterBlock}
      </div>
      <div class="print-report__hint">
        ${escapeHtml(mode === "pdf" ? "Use o dialogo de impressao para salvar como PDF." : "Documento pronto para impressao administrativa.")}
      </div>
      <table class="print-report__table">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Data</th>
            <th>Entradas</th>
            <th>Saidas</th>
            <th>Unitario</th>
            <th>Valor total</th>
            <th>Saldo</th>
            <th>Observacao</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="6"><strong>Saldo anterior ao periodo</strong></td>
            <td><strong>${escapeHtml(`${formatNumber(report.openingBalance || 0, 2, 2)} ${report.product.unit}`)}</strong></td>
            <td></td>
          </tr>
          ${
            report.rows.length
              ? report.rows
                  .map(
                    (row) => `
                      <tr>
                        <td>${escapeHtml(row.document || "-")}</td>
                        <td>${escapeHtml(formatDateTime(row.date))}</td>
                        <td>${escapeHtml(row.entryQuantity ? formatNumber(row.entryQuantity, 2, 2) : "-")}</td>
                        <td>${escapeHtml(row.exitQuantity ? formatNumber(row.exitQuantity, 2, 2) : "-")}</td>
                        <td>${escapeHtml(formatCurrency(row.unitCost || 0))}</td>
                        <td>${escapeHtml(formatCurrency(row.totalCost || 0))}</td>
                        <td>${escapeHtml(`${formatNumber(row.balance || 0, 2, 2)} ${report.product.unit}`)}</td>
                        <td>${escapeHtml(row.notes || "-")}</td>
                      </tr>
                    `
                  )
                  .join("")
              : `<tr><td colspan="8">Nenhuma movimentacao encontrada no periodo.</td></tr>`
          }
        </tbody>
      </table>
      <footer class="print-report__footer">
        <div><strong>Total entradas:</strong> ${escapeHtml(formatNumber(report.totals.entries || 0, 2, 2))}</div>
        <div><strong>Total saidas:</strong> ${escapeHtml(formatNumber(report.totals.exits || 0, 2, 2))}</div>
        <div><strong>Saldo final:</strong> ${escapeHtml(`${formatNumber(report.totals.finalBalance || 0, 2, 2)} ${report.product.unit}`)}</div>
      </footer>
      <div class="print-report__footer-note">${escapeHtml(company.documentFooter)}</div>
    </main>
  `;
}

function renderFuel() {
  const analytics = buildFuelPageAnalytics(state.fuelRecords);
  const currentPlate = refs.fuelFilterPlate?.value || "";
  if (refs.fuelFilterPlate) {
    refs.fuelFilterPlate.innerHTML = `<option value="">Todos os veiculos</option>${analytics.plates
      .map((plate) => `<option value="${escapeHtml(plate)}">${escapeHtml(plate)}</option>`)
      .join("")}`;
    refs.fuelFilterPlate.value = analytics.plates.includes(currentPlate) ? currentPlate : "";
  }

  const visibleRecords =
    refs.fuelFilterPlate?.value
      ? state.fuelRecords.filter((item) => item.plate === refs.fuelFilterPlate.value)
      : state.fuelRecords;

  refs.fuelKpiGrid.innerHTML = [
    {
      label: "Abastecimentos",
      value: formatNumber(analytics.monthExitRecords.length),
      note: "Saidas no mes atual",
      icon: "fuel",
      tone: "brand",
    },
    {
      label: "Total de litros",
      value: `${formatLiters(analytics.monthLiters)} L`,
      note: "Consumo do mes atual",
      icon: "analytics",
      tone: "neutral",
    },
    {
      label: "Media por lancamento",
      value: `${formatLiters(analytics.avgLiters)} L`,
      note: "Considerando apenas saidas",
      icon: "dashboard",
      tone: "warning",
    },
    {
      label: "Media km/L",
      value: formatKmPerLiter(analytics.avgKmPerLiter),
      note: "Com base nos hodometros informados",
      icon: "efficiency",
      tone: "success",
    },
  ]
    .map((item) =>
      buildStatCard({
        className: "operations-kpi-card",
        label: item.label,
        value: item.value,
        note: item.note,
        icon: item.icon,
        tone: item.tone,
      })
    )
    .join("");

  refs.fuelStocksGrid.innerHTML = state.fuelStorages.length
    ? state.fuelStorages
        .map((storage) => {
          const isEmpty = Number(storage.currentBalance || 0) <= 0;
          const isLow =
            !isEmpty &&
            Number(storage.minBalance || 0) > 0 &&
            Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0);
          const statusLabel = isEmpty ? "Sem saldo" : isLow ? "Abaixo do minimo" : "Operacional";
          const toneClass = isEmpty ? "is-empty" : isLow ? "is-low" : "is-ok";

          return `
            <article class="fuel-stock-card ${toneClass}">
              <div class="fuel-stock-card__top">
                <span class="fuel-stock-card__kind">${escapeHtml(formatFuelKindLabel(storage.fuelKind))}</span>
                <span class="fuel-stock-card__status">${escapeHtml(statusLabel)}</span>
              </div>
              <div class="fuel-stock-card__value-row">
                <strong class="fuel-stock-card__value">${escapeHtml(formatLiters(storage.currentBalance))}</strong>
                <span class="fuel-stock-card__unit">L</span>
              </div>
              <div class="fuel-stock-card__footer">
                <strong>${escapeHtml(storage.name)}</strong>
                <span>Saldo disponivel agora</span>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="stack-item"><strong>Nenhum estoque configurado</strong><p class="muted">Cadastre ou revise os estoques principais de combustivel.</p></div>`;

  renderFuelInventoryMovements();

  refs.fuelTableBody.innerHTML = visibleRecords.length
    ? visibleRecords
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.storageName || "-")}</td>
              <td>${escapeHtml(formatFuelKindLabel(item.fuelKind))}</td>
              <td>${statusBadge(item.type)}</td>
              <td>${escapeHtml(item.vehicleId ? [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(" / ") || "Veiculo cadastrado" : "-")}</td>
              <td>${escapeHtml(item.plate || "-")}</td>
              <td>${escapeHtml(formatNumber(item.quantity || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}</td>
              <td>${escapeHtml(formatNumber(item.balanceBefore || 0, 2, 2))} L</td>
              <td>${escapeHtml(formatNumber(item.balanceAfter || 0, 2, 2))} L</td>
              <td>${escapeHtml(item.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(item.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum abastecimento registrado.", 11);

  refs.fuelConsumptionChart.innerHTML = renderConsumptionChart({
    consumptionSeries: analytics.consumptionSeries,
    totalConsumptionLiters: analytics.consumptionSeries.reduce((total, item) => total + item.total, 0),
    peakConsumption: analytics.peakConsumption,
    fuelMix: analytics.fuelMix,
  });

  refs.fuelTopVehicles.innerHTML = renderMeterList(
    analytics.topVehicles.map((item) => ({
      label: item.plate,
      value: item.liters,
      count: item.count,
    })),
    {
      emptyTitle: "Sem consumo no periodo",
      emptyDescription: "Assim que houver saidas registradas, os veiculos de maior consumo aparecem aqui.",
      valueFormatter: (value) => `${formatLiters(value)} L`,
      secondaryFormatter: (item) => `${item.count} lancamento(s)`,
    }
  );

  refs.fuelSideInsights.innerHTML = buildFuelSideInsights(analytics);
  syncResponsiveTableLabels();
}

async function handleFuelSubmit(event) {
  event.preventDefault();
  const isExit = refs.fuelForm.elements.type.value === "EXIT";
  const selectedVehicle =
    isExit && refs.fuelForm.elements.vehicleId.value
      ? state.vehicles.find((item) => String(item.id) === String(refs.fuelForm.elements.vehicleId.value))
      : null;

  const payload = {
    storageId: refs.fuelForm.elements.storageId.value,
    type: refs.fuelForm.elements.type.value,
    vehicleId: isExit ? refs.fuelForm.elements.vehicleId.value : "",
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    occurredAt: toIsoDateTime(refs.fuelForm.elements.occurredAt.value),
    notes: refs.fuelForm.elements.notes.value,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    resetFuelForm();
    await Promise.all([refreshFuel(), refreshProducts(), refreshInventoryMovements(), refreshDashboard()]);

    if (selectedVehicle && state.dossier.selectedPlate && normalizeClientPlateKey(state.dossier.selectedPlate) === normalizeClientPlateKey(selectedVehicle.plate)) {
      await loadVehicleDossierByPlate(selectedVehicle.plate, { silent: true });
    }

    showToast("Abastecimento registrado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}
