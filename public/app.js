const $ = (id) => document.getElementById(id);
const THEME_STORAGE_KEY = "horizon-theme";
const THEME_LOGOS = {
  light: "/assets/horizon-logo-light.jpeg",
  dark: "/assets/horizon-logo-dark.jpeg",
};

const state = {
  user: null,
  section: "dashboard",
  notes: [],
  products: [],
  inventoryMovements: [],
  fuelRecords: [],
  fuelStorages: [],
  schedules: [],
  fines: [],
  checklists: [],
  checklistDraftItems: [],
  emails: [],
  invites: [],
  logs: [],
  dashboard: {
    metrics: {
      pendingNotes: 0,
      waitingRecognition: 0,
      sentToFinance: 0,
      fuelBalance: 0,
    },
    analytics: {
      periodDays: 30,
      selectedPlate: "",
      availablePlates: [],
      consumptionSeries: [],
      efficiencyRanking: [],
      selectedVehicle: null,
      topConsumers: [],
      recentFuelRecords: [],
      noteStatuses: [],
      fuelMix: [],
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
  },
  theme: "light",
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
};

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

const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    key: "freios",
    label: "Freios",
    description: "Verificar funcionamento do sistema de freios.",
  },
  {
    key: "luzes",
    label: "Luzes",
    description: "Farol, seta, luz de freio e re.",
  },
  {
    key: "buzina",
    label: "Buzina",
    description: "Verificar funcionamento da buzina.",
  },
  {
    key: "cinto",
    label: "Cinto de seguranca",
    description: "Verificar condicoes do cinto.",
  },
  {
    key: "pneus",
    label: "Pneus",
    description: "Estado geral e calibragem visual.",
  },
  {
    key: "estepe",
    label: "Estepe",
    description: "Verificar estepe e ferramentas.",
  },
  {
    key: "triangulo",
    label: "Triangulo",
    description: "Verificar presenca do triangulo.",
  },
  {
    key: "extintor",
    label: "Extintor",
    description: "Verificar validade e pressao.",
  },
];

const refs = {
  authScreen: $("auth-screen"),
  appShell: $("app-shell"),
  loginForm: $("login-form"),
  registerForm: $("register-form"),
  logoutButton: $("logout-button"),
  refreshAllButton: $("refresh-all-button"),
  topbarUserName: $("topbar-user-name"),
  topbarUserRole: $("topbar-user-role"),
  adminNavButton: $("admin-nav-button"),
  dashboardSummary: $("dashboard-summary"),
  dashboardMetrics: $("dashboard-metrics"),
  dashboardConsumptionChart: $("dashboard-consumption-chart"),
  dashboardEfficiencySpotlight: $("dashboard-efficiency-spotlight"),
  dashboardRanking: $("dashboard-ranking"),
  dashboardTopConsumers: $("dashboard-top-consumers"),
  dashboardNoteFlow: $("dashboard-note-flow"),
  dashboardAlerts: $("dashboard-alerts"),
  dashboardSchedules: $("dashboard-schedules"),
  dashboardPlateFilter: $("dashboard-plate-filter"),
  dashboardPeriodFilter: $("dashboard-period-filter"),
  noteForm: $("note-form"),
  noteResetButton: $("note-reset-button"),
  notesSearch: $("notes-search"),
  notesStatusFilter: $("notes-status-filter"),
  notesCategoryFilter: $("notes-category-filter"),
  notesTableBody: $("notes-table-body"),
  xmlImportInput: $("xml-import-input"),
  xmlImportButton: $("xml-import-button"),
  spreadsheetImportInput: $("spreadsheet-import-input"),
  spreadsheetImportButton: $("spreadsheet-import-button"),
  productForm: $("product-form"),
  productResetButton: $("product-reset-button"),
  productsTableBody: $("products-table-body"),
  movementForm: $("inventory-movement-form"),
  movementProductSelect: $("movement-product-select"),
  inventoryMovementsBody: $("inventory-movements-body"),
  movementBarcodeInput: $("movement-barcode-input"),
  lookupBarcodeButton: $("lookup-barcode-button"),
  fuelForm: $("fuel-form"),
  fuelStorageSelect: $("fuel-storage-select"),
  fuelFilterStorage: $("fuel-filter-storage"),
  fuelFilterFrom: $("fuel-filter-from"),
  fuelFilterTo: $("fuel-filter-to"),
  fuelFilterPlate: $("fuel-filter-plate"),
  fuelKpiGrid: $("fuel-kpi-grid"),
  fuelStocksGrid: $("fuel-stocks-grid"),
  fuelTableBody: $("fuel-table-body"),
  fuelConsumptionChart: $("fuel-consumption-chart"),
  fuelTopVehicles: $("fuel-top-vehicles"),
  fuelSideInsights: $("fuel-side-insights"),
  scheduleForm: $("schedule-form"),
  scheduleResetButton: $("schedule-reset-button"),
  schedulesTableBody: $("schedules-table-body"),
  scheduleSummaryCards: $("schedule-summary-cards"),
  scheduleNotesFeed: $("schedule-notes-feed"),
  fineForm: $("fine-form"),
  fineResetButton: $("fine-reset-button"),
  finesTableBody: $("fines-table-body"),
  checklistForm: $("checklist-form"),
  checklistResetButton: $("checklist-reset-button"),
  checklistsTableBody: $("checklists-table-body"),
  checklistItemsBuilder: $("checklist-items-builder"),
  checklistSummaryCards: $("checklist-summary-cards"),
  checklistHistoryFeed: $("checklist-history-feed"),
  emailForm: $("email-form"),
  emailsTableBody: $("emails-table-body"),
  inviteForm: $("invite-form"),
  invitesTableBody: $("invites-table-body"),
  logsTableBody: $("logs-table-body"),
  scannerModal: $("scanner-modal"),
  scannerVideo: $("scanner-video"),
  scannerStatus: $("scanner-status"),
  scannerCloseButton: $("scanner-close-button"),
  themeLightButton: $("theme-light-button"),
  themeDarkButton: $("theme-dark-button"),
  siteFavicon: $("site-favicon"),
  toastRoot: $("toast-root"),
};

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  applyTheme(resolveInitialTheme());
  bindEvents();
  applyDefaultFormValues();

  try {
    const response = await api("/api/auth/me", { suppressAuthRedirect: true });
    setUser(response.user || null);

    if (response.user) {
      await refreshAll();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

function bindEvents() {
  refs.loginForm.addEventListener("submit", handleLoginSubmit);
  refs.registerForm.addEventListener("submit", handleRegisterSubmit);
  refs.logoutButton.addEventListener("click", handleLogout);
  refs.refreshAllButton.addEventListener("click", refreshAll);
  refs.dashboardPlateFilter.addEventListener("change", refreshDashboard);
  refs.dashboardPeriodFilter.addEventListener("change", refreshDashboard);
  refs.noteForm.addEventListener("submit", handleNoteSubmit);
  refs.noteResetButton.addEventListener("click", () => resetNoteForm());
  refs.xmlImportButton.addEventListener("click", handleXmlImport);
  refs.spreadsheetImportButton.addEventListener("click", handleSpreadsheetImport);
  refs.notesSearch.addEventListener("input", debounce(refreshNotes, 250));
  refs.notesStatusFilter.addEventListener("change", refreshNotes);
  refs.notesCategoryFilter.addEventListener("change", refreshNotes);
  refs.productForm.addEventListener("submit", handleProductSubmit);
  refs.productResetButton.addEventListener("click", resetProductForm);
  refs.movementForm.addEventListener("submit", handleMovementSubmit);
  refs.lookupBarcodeButton.addEventListener("click", lookupProductByBarcode);
  refs.fuelForm.addEventListener("submit", handleFuelSubmit);
  refs.fuelFilterStorage.addEventListener("change", refreshFuel);
  refs.fuelFilterFrom.addEventListener("change", refreshFuel);
  refs.fuelFilterTo.addEventListener("change", refreshFuel);
  refs.fuelFilterPlate?.addEventListener("change", renderFuel);
  refs.scheduleForm.addEventListener("submit", handleScheduleSubmit);
  refs.scheduleResetButton.addEventListener("click", resetScheduleForm);
  refs.scheduleForm.elements.scheduledDate?.addEventListener("change", refreshSchedules);
  refs.fineForm.addEventListener("submit", handleFineSubmit);
  refs.fineResetButton.addEventListener("click", resetFineForm);
  refs.checklistForm.addEventListener("submit", handleChecklistSubmit);
  refs.checklistResetButton.addEventListener("click", resetChecklistForm);
  refs.emailForm.addEventListener("submit", handleEmailSubmit);
  refs.inviteForm.addEventListener("submit", handleInviteSubmit);
  refs.scannerCloseButton.addEventListener("click", closeScanner);
  refs.themeLightButton.addEventListener("click", () => applyTheme("light"));
  refs.themeDarkButton.addEventListener("click", () => applyTheme("dark"));

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setSection(button.dataset.section));
  });

  document.body.addEventListener("click", handleRowActions);
  document.body.addEventListener("click", handleInteractivePanels);

  document.querySelectorAll("[data-scan-target]").forEach((button) => {
    button.addEventListener("click", () => openScanner(button.dataset.scanTarget));
  });
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

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", nextTheme === "dark" ? "#0d1319" : "#b10f16");
  }

  const nextLogo = THEME_LOGOS[nextTheme];
  document.querySelectorAll("[data-theme-logo]").forEach((image) => {
    image.setAttribute("src", nextLogo);
  });

  if (refs.siteFavicon) {
    refs.siteFavicon.setAttribute("href", nextLogo);
  }
}

async function api(url, options = {}) {
  const { body, suppressAuthRedirect = false, ...fetchOptions } = options;
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
    throw new Error(message);
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

function normalizeClientKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatLiters(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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
  }).format(Number(value || 0));
}

function formatPercent(value, digits = 0) {
  return `${formatNumber(value, digits, digits)}%`;
}

function formatDistance(value) {
  return `${formatNumber(value, 0, 0)} km`;
}

function formatKmPerLiter(value) {
  return Number(value || 0) > 0 ? `${formatNumber(value, 2, 2)} km/L` : "-";
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
      <article class="dashboard-insight-card">
        <span class="eyebrow">Hodometro capturado</span>
        <strong>${escapeHtml(formatPercent(coverage.percent || 0, 0))}</strong>
        <span class="muted">${escapeHtml(`${coverage.withOdometer || 0} de ${coverage.totalRecords || 0} saidas no periodo`)}</span>
      </article>
      <article class="dashboard-insight-card">
        <span class="eyebrow">Saude do estoque</span>
        <strong>${escapeHtml(formatPercent(Math.min(stockHealth.percent || 0, 999), 0))}</strong>
        <span class="muted">
          ${
            stockHealth.totalMinimumBalance > 0
              ? escapeHtml(`${stockHealth.lowStorageCount || 0} estoque(s) abaixo do minimo`)
              : "Configure estoque minimo para monitorar cobertura"
          }
        </span>
      </article>
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

function statusBadge(value) {
  const meta = statusMeta[value] || { label: value || "-", className: "status-gray" };
  return `<span class="status-badge ${meta.className}">${escapeHtml(meta.label)}</span>`;
}

function emptyRow(message, columns) {
  return `<tr><td colspan="${columns}" class="muted">${escapeHtml(message)}</td></tr>`;
}

function setUser(user) {
  state.user = user;
  const canSeeAdmin = user && (user.role === "ADMIN" || user.role === "MANAGER");
  const canManageInvites = user && user.role === "ADMIN";

  refs.authScreen.classList.toggle("hidden", Boolean(user));
  refs.appShell.classList.toggle("hidden", !user);
  refs.adminNavButton.classList.toggle("hidden", !canSeeAdmin);
  refs.inviteForm.classList.toggle("hidden", !canManageInvites);
  refs.invitesTableBody.closest(".panel")?.classList.toggle("hidden", !canManageInvites);

  if (!user) {
    state.section = "dashboard";
    refs.topbarUserName.textContent = "-";
    refs.topbarUserRole.textContent = "-";
    setSection("dashboard");
    return;
  }

  refs.topbarUserName.textContent = user.name;
  refs.topbarUserRole.textContent = roleLabels[user.role] || user.role;

  if (!canSeeAdmin && state.section === "admin") {
    setSection("dashboard");
  }
}

function setSection(section) {
  state.section = section;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });

  document.querySelectorAll(".content-section").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${section}-section`);
  });
}

function applyDefaultFormValues() {
  refs.noteForm.elements.status.value = "NEW";
  refs.noteForm.elements.category.value = "LOGISTICS";
  refs.noteForm.elements.issueDate.value = currentLocalDateTime();
  refs.fuelForm.elements.occurredAt.value = currentLocalDateTime();
  refs.movementForm.elements.occurredAt.value = currentLocalDateTime();
  refs.scheduleForm.elements.scheduledDate.value = currentLocalDate();
  refs.scheduleForm.elements.responsibleName.value = state.user?.name || "";
  refs.fineForm.elements.fineDate.value = currentLocalDate();
  refs.checklistForm.elements.checklistDate.value = currentLocalDateTime();
  refs.checklistForm.elements.checklistType.value = "PRE_USE";
  refs.emailForm.elements.receivedAt.value = currentLocalDateTime();
  state.checklistDraftItems = cloneChecklistTemplate();
  renderChecklistComposer();
}

async function refreshAll() {
  if (!state.user) {
    return;
  }

  const tasks = [
    refreshDashboard(),
    refreshNotes(),
    refreshProducts(),
    refreshFuel(),
    refreshSchedules(),
    refreshFines(),
    refreshChecklists(),
    refreshEmails(),
  ];

  if (state.user.role === "ADMIN" || state.user.role === "MANAGER") {
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

async function refreshDashboard() {
  const query = new URLSearchParams();
  if (refs.dashboardPeriodFilter.value) query.set("days", refs.dashboardPeriodFilter.value);
  if (refs.dashboardPlateFilter.value) query.set("plate", refs.dashboardPlateFilter.value);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await api(`/api/dashboard${suffix}`);
  state.dashboard = response;
  renderDashboard();
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
}

async function refreshInventoryMovements() {
  const response = await api("/api/inventory/movements");
  state.inventoryMovements = response.items || [];
  renderInventoryMovements();
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
  const tasks = [api("/api/admin/logs?limit=120")];
  const shouldLoadInvites = state.user?.role === "ADMIN";

  if (shouldLoadInvites) {
    tasks.push(api("/api/admin/invites"));
  }

  const [logsResponse, invitesResponse] = await Promise.all(tasks);
  state.logs = logsResponse.items || [];
  state.invites = invitesResponse?.items || [];
  renderAdmin();
}

async function maybeRefreshAdmin() {
  if (state.user?.role === "ADMIN" || state.user?.role === "MANAGER") {
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
      value: `${state.dashboard.metrics.fuelBalance.toFixed(2)} L`,
    },
  ];

  metrics.push(
    {
      label: "S-500",
      value: `${Number(fuelByKind.S500 || 0).toFixed(2)} L`,
    },
    {
      label: "S-10",
      value: `${Number(fuelByKind.S10 || 0).toFixed(2)} L`,
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
      <span class="eyebrow">Leitura operacional</span>
      <h3>${escapeHtml(selectedPlate ? `Analise focada em ${selectedPlate}` : "Visao consolidada da logistica")}</h3>
      <p class="muted">
        ${
          selectedPlate
            ? escapeHtml(`Indicadores filtrados para a placa ${selectedPlate} nos ultimos ${periodDays} dias.`)
            : escapeHtml(`Consumos, eficiencia e gargalos do abastecimento nos ultimos ${periodDays} dias.`)
        }
      </p>
      <div class="dashboard-chip-row">
        <span class="dashboard-chip">${escapeHtml(`S-500 ${formatLiters(fuelByKind.S500 || 0)} L`)}</span>
        <span class="dashboard-chip">${escapeHtml(`S-10 ${formatLiters(fuelByKind.S10 || 0)} L`)}</span>
        <span class="dashboard-chip">${escapeHtml(`${metricsState.alertCount || 0} alerta(s) ativos`)}</span>
      </div>
    </article>
    <div class="dashboard-summary-stack">
      <article class="dashboard-summary-stat">
        <span class="eyebrow">Consumo no periodo</span>
        <strong>${escapeHtml(`${formatLiters(metricsState.periodFuelConsumption || 0)} L`)}</strong>
        <span class="muted">Saidas registradas no intervalo atual</span>
      </article>
      <article class="dashboard-summary-stat">
        <span class="eyebrow">Media diaria</span>
        <strong>${escapeHtml(`${formatLiters(metricsState.averageDailyConsumption || 0)} L`)}</strong>
        <span class="muted">Consumo medio por dia dentro do filtro</span>
      </article>
      <article class="dashboard-summary-stat">
        <span class="eyebrow">Melhor eficiencia</span>
        <strong>${escapeHtml(bestVehicle ? formatKmPerLiter(bestVehicle.kmPerLiter) : "-")}</strong>
        <span class="muted">${escapeHtml(bestVehicle ? `Placa ${bestVehicle.plate}` : "Aguardando hodometro valido")}</span>
      </article>
    </div>
  `;

  const metrics = [
    {
      label: "Notas pendentes",
      value: formatNumber(metricsState.pendingNotes || 0),
    },
    {
      label: "Aguardando reconhecimento",
      value: formatNumber(metricsState.waitingRecognition || 0),
    },
    {
      label: "Enviadas ao financeiro",
      value: formatNumber(metricsState.sentToFinance || 0),
    },
    {
      label: "Saldo combustivel",
      value: `${formatLiters(metricsState.fuelBalance || 0)} L`,
    },
    {
      label: "Estoque minimo em alerta",
      value: formatNumber(metricsState.lowStockCount || 0),
    },
    {
      label: "Veiculos monitorados",
      value: formatNumber(metricsState.monitoredVehicles || 0),
    },
  ];

  refs.dashboardMetrics.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card metric-card--dashboard">
          <span class="eyebrow">${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>
      `
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
                  <button class="row-button" data-action="edit-note" data-id="${note.id}">Editar</button>
                  ${
                    state.user?.role === "ADMIN"
                      ? `<button class="row-button danger" data-action="delete-note" data-id="${note.id}">Excluir</button>`
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
              <td>${escapeHtml(product.currentStock.toFixed(2))} ${escapeHtml(product.unit)}</td>
              <td>${escapeHtml(product.minStock.toFixed(2))} ${escapeHtml(product.unit)}</td>
              <td>${escapeHtml(product.barcode || "-")}</td>
              <td>
                <div class="row-actions">
                  <button class="row-button" data-action="edit-product" data-id="${product.id}">Editar</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum produto cadastrado.", 5);
}

function renderInventoryMovements() {
  refs.inventoryMovementsBody.innerHTML = state.inventoryMovements.length
    ? state.inventoryMovements
        .map(
          (movement) => `
            <tr>
              <td>${escapeHtml(movement.productName)}</td>
              <td>${statusBadge(movement.type)}</td>
              <td>${escapeHtml(movement.quantity.toFixed(2))}</td>
              <td>${escapeHtml(movement.balanceAfter.toFixed(2))}</td>
              <td>${escapeHtml(movement.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(movement.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma movimentação registrada.", 6);
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
              <td>${escapeHtml(item.quantity.toFixed(2))} L</td>
              <td>${escapeHtml(item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}</td>
              <td>${escapeHtml(item.balanceBefore.toFixed(2))} L</td>
              <td>${escapeHtml(item.balanceAfter.toFixed(2))} L</td>
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
                  <button class="row-button" data-action="edit-schedule" data-id="${item.id}">Editar</button>
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
                  <button class="row-button" data-action="edit-fine" data-id="${item.id}">Editar</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma multa cadastrada.", 6);
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
                  <button class="row-button" data-action="edit-checklist" data-id="${item.id}">Editar</button>
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
}

function renderAdmin() {
  refs.invitesTableBody.innerHTML = state.invites.length
    ? state.invites
        .map(
          (item) => `
            <tr>
              <td><strong>${escapeHtml(item.code)}</strong></td>
              <td>${escapeHtml(roleLabels[item.role] || item.role)}</td>
              <td>${escapeHtml(item.createdByName || "-")}</td>
              <td>${escapeHtml(item.usedByName || "-")}</td>
              <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum convite gerado.", 5);

  refs.logsTableBody.innerHTML = state.logs.length
    ? state.logs
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
              <td>${escapeHtml(item.userName)}</td>
              <td>${escapeHtml(item.action)}</td>
              <td>${escapeHtml(item.entityType)} ${escapeHtml(item.entityId || "")}</td>
              <td>${escapeHtml(typeof item.details === "object" ? JSON.stringify(item.details) : item.details || "-")}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum log disponível.", 5);
}

function updateMovementProductSelect() {
  refs.movementProductSelect.innerHTML = state.products.length
    ? state.products
        .map(
          (product) => `
            <option value="${product.id}">
              ${escapeHtml(product.name)} (${escapeHtml(product.currentStock.toFixed(2))} ${escapeHtml(product.unit)})
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
  if (action === "edit-schedule") editSchedule(id);
  if (action === "edit-fine") editFine(id);
  if (action === "edit-checklist") editChecklist(id);
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
  refs.productForm.elements.initialStock.value = 0;
  refs.productForm.elements.initialStock.disabled = true;
  setSection("inventory");
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

async function handleRegisterSubmit(event) {
  event.preventDefault();

  try {
    const payload = Object.fromEntries(new FormData(refs.registerForm).entries());
    const response = await api("/api/auth/register", { method: "POST", body: payload });
    refs.registerForm.reset();
    setUser(response.user);
    applyDefaultFormValues();
    await refreshAll();
    showToast("Cadastro concluído e sessão iniciada.");
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

async function handleMovementSubmit(event) {
  event.preventDefault();

  const payload = {
    productId: refs.movementForm.elements.productId.value,
    type: refs.movementForm.elements.type.value,
    quantity: refs.movementForm.elements.quantity.value,
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

  const payload = {
    storageId: refs.fuelForm.elements.storageId.value,
    type: refs.fuelForm.elements.type.value,
    plate: refs.fuelForm.elements.plate.value,
    quantity: refs.fuelForm.elements.quantity.value,
    odometerKm: refs.fuelForm.elements.odometerKm.value,
    occurredAt: toIsoDateTime(refs.fuelForm.elements.occurredAt.value),
    notes: refs.fuelForm.elements.notes.value,
  };

  try {
    await api("/api/fuel", { method: "POST", body: payload });
    refs.fuelForm.reset();
    refs.fuelForm.elements.occurredAt.value = currentLocalDateTime();
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
    showToast(id ? "Escala atualizada." : "Escala cadastrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
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

async function handleInviteSubmit(event) {
  event.preventDefault();

  if (state.user?.role !== "ADMIN") {
    showToast("Apenas administradores podem criar convites.", "error");
    return;
  }

  const payload = {
    role: refs.inviteForm.elements.role.value,
    notes: refs.inviteForm.elements.notes.value,
  };

  try {
    const response = await api("/api/admin/invites", { method: "POST", body: payload });
    refs.inviteForm.reset();
    await refreshAdmin();
    showToast(`Convite criado: ${response.item.code}`);
  } catch (error) {
    showToast(error.message, "error");
  }
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
  refs.productForm.elements.initialStock.value = 0;
  refs.productForm.elements.initialStock.disabled = false;
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

function cloneChecklistTemplate() {
  return DEFAULT_CHECKLIST_TEMPLATE.map((item) => ({
    ...item,
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
      status:
        item.status === "CRITICAL" || item.status === "ATTENTION" || item.status === "OK"
          ? item.status
          : "OK",
    });
    return map;
  }, new Map());

  const result = baseItems.map((item) => merged.get(item.key) || item);
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

function renderChecklistComposer() {
  const items = ensureChecklistDraft();
  const summary = summarizeChecklistDraft(items);
  refs.checklistForm.elements.items.value = items.map((item) => item.label).join("\n");
  refs.checklistForm.elements.status.value = deriveChecklistOverallStatus(items);

  refs.checklistItemsBuilder.innerHTML = items
    .map(
      (item) => `
        <article class="checklist-item-card">
          <div class="checklist-item-card__body">
            <strong>${escapeHtml(item.label)}</strong>
            <p class="muted">${escapeHtml(item.description || "Verificacao operacional padrao.")}</p>
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
        </article>
      `
    )
    .join("");

  refs.checklistSummaryCards.innerHTML = [
    {
      label: "Itens OK",
      value: formatNumber(summary.ok),
      tone: "status-green",
    },
    {
      label: "Atencao",
      value: formatNumber(summary.attention),
      tone: "status-yellow",
    },
    {
      label: "Criticos",
      value: formatNumber(summary.critical),
      tone: "status-red",
    },
  ]
    .map(
      (item) => `
        <article class="operations-kpi-card operations-kpi-card--compact">
          <span class="eyebrow">${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <span class="status-badge ${item.tone}">${escapeHtml(item.label)}</span>
        </article>
      `
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

  if (!cards.length) {
    cards.push(
      `<article class="stack-item"><strong>Sem alertas de abastecimento</strong><p class="muted">Os principais destaques operacionais aparecerao aqui.</p></article>`
    );
  }

  return cards.join("");
}

function handleInteractivePanels(event) {
  const shortcut = event.target.closest("[data-fuel-shortcut]");
  if (shortcut) {
    const action = shortcut.dataset.fuelShortcut;
    if (action === "new") {
      refs.fuelForm.scrollIntoView({ behavior: "smooth", block: "start" });
      refs.fuelForm.elements.plate.focus();
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
      refs.fuelFilterStorage.value = "";
      refs.fuelFilterFrom.value = "";
      refs.fuelFilterTo.value = "";
      if (refs.fuelFilterPlate) refs.fuelFilterPlate.value = "";
      refreshFuel();
    }
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

function refreshScheduleSummary() {
  const items = state.schedules;
  const uniqueVehicles = new Set(items.map((item) => item.vehicle).filter(Boolean));
  const uniqueDrivers = new Set(items.map((item) => item.driver).filter(Boolean));
  const assistants = items.filter((item) => item.assistant).length;

  refs.scheduleSummaryCards.innerHTML = [
    { label: "Total de veiculos", value: uniqueVehicles.size },
    { label: "Total de motoristas", value: uniqueDrivers.size },
    { label: "Total de ajudantes", value: assistants },
  ]
    .map(
      (item) => `
        <article class="operations-kpi-card operations-kpi-card--compact">
          <span class="eyebrow">${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(formatNumber(item.value))}</strong>
          <span class="muted">Escala filtrada</span>
        </article>
      `
    )
    .join("");

  refs.scheduleNotesFeed.innerHTML = items.length
    ? items
        .filter((item) => item.notes)
        .slice(0, 4)
        .map(
          (item) => `
            <article class="stack-item">
              <strong>${escapeHtml(item.vehicle)}</strong>
              <p class="muted">${escapeHtml(item.location || "Rota nao informada")}</p>
              <p class="muted">${escapeHtml(item.notes)}</p>
            </article>
          `
        )
        .join("") ||
      `<div class="stack-item"><strong>Sem observacoes adicionais</strong><p class="muted">Cadastre notas operacionais na escala para aparecerem aqui.</p></div>`
    : `<div class="stack-item"><strong>Nenhuma escala do dia</strong><p class="muted">Selecione uma data para acompanhar as linhas operacionais.</p></div>`;
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
    },
    {
      label: "Total de litros",
      value: `${formatLiters(analytics.monthLiters)} L`,
      note: "Consumo do mes atual",
    },
    {
      label: "Media por lancamento",
      value: `${formatLiters(analytics.avgLiters)} L`,
      note: "Considerando apenas saidas",
    },
    {
      label: "Media km/L",
      value: formatKmPerLiter(analytics.avgKmPerLiter),
      note: "Com base nos hodometros informados",
    },
  ]
    .map(
      (item) => `
        <article class="operations-kpi-card">
          <span class="eyebrow">${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <span class="muted">${escapeHtml(item.note)}</span>
        </article>
      `
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
              <td>${escapeHtml(item.plate)}</td>
              <td>${escapeHtml(item.quantity.toFixed(2))} L</td>
              <td>${escapeHtml(item.odometerKm === null || item.odometerKm === undefined ? "-" : formatDistance(item.odometerKm))}</td>
              <td>${escapeHtml(item.balanceBefore.toFixed(2))} L</td>
              <td>${escapeHtml(item.balanceAfter.toFixed(2))} L</td>
              <td>${escapeHtml(item.userName || "-")}</td>
              <td>${escapeHtml(formatDateTime(item.occurredAt))}</td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum abastecimento registrado.", 10);

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
  refs.schedulesTableBody.innerHTML = state.schedules.length
    ? state.schedules
        .map(
          (item, index) => `
            <tr>
              <td>${escapeHtml(formatNumber(index + 1))}</td>
              <td>
                <strong>${escapeHtml(item.vehicle)}</strong>
                <div class="muted">${escapeHtml(formatDateOnly(item.scheduledDate))}</div>
              </td>
              <td>${escapeHtml(item.location || "Rota nao informada")}</td>
              <td>
                <strong>${escapeHtml(item.driver)}</strong>
                <div class="muted">${escapeHtml(item.responsibleName || item.userName || "-")}</div>
              </td>
              <td>${escapeHtml(item.assistant || "-")}</td>
              <td>${escapeHtml(item.notes || "-")}</td>
              <td>
                <div class="row-actions">
                  <button class="row-button" data-action="edit-schedule" data-id="${item.id}">Editar</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhuma escala cadastrada para a data selecionada.", 7);

  refreshScheduleSummary();
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
                  <button class="row-button" data-action="edit-checklist" data-id="${item.id}">Editar</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : emptyRow("Nenhum checklist cadastrado.", 5);

  renderChecklistComposer();
}

async function refreshSchedules() {
  const query = new URLSearchParams();
  const selectedDate = refs.scheduleForm?.elements.scheduledDate?.value || "";
  if (selectedDate) {
    query.set("date", selectedDate);
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await api(`/api/schedules${suffix}`);
  state.schedules = response.items || [];
  renderSchedules();
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  const id = refs.scheduleForm.elements.id.value;

  const payload = {
    scheduledDate: refs.scheduleForm.elements.scheduledDate.value,
    vehicle: refs.scheduleForm.elements.vehicle.value,
    location: refs.scheduleForm.elements.location.value,
    driver: refs.scheduleForm.elements.driver.value,
    assistant: refs.scheduleForm.elements.assistant.value,
    responsibleName: refs.scheduleForm.elements.responsibleName.value,
    notes: refs.scheduleForm.elements.notes.value,
  };

  try {
    await api(id ? `/api/schedules/${id}` : "/api/schedules", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetScheduleForm();
    await Promise.all([refreshSchedules(), refreshDashboard(), maybeRefreshAdmin()]);
    showToast(id ? "Escala atualizada." : "Escala cadastrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function editSchedule(id) {
  const item = findById(state.schedules, id);
  if (!item) return;

  refs.scheduleForm.elements.id.value = item.id;
  refs.scheduleForm.elements.scheduledDate.value = item.scheduledDate;
  refs.scheduleForm.elements.vehicle.value = item.vehicle;
  refs.scheduleForm.elements.location.value = item.location || "";
  refs.scheduleForm.elements.driver.value = item.driver;
  refs.scheduleForm.elements.assistant.value = item.assistant || "";
  refs.scheduleForm.elements.responsibleName.value = item.responsibleName || "";
  refs.scheduleForm.elements.notes.value = item.notes || "";
  setSection("schedules");
}

function resetScheduleForm() {
  refs.scheduleForm.reset();
  refs.scheduleForm.elements.id.value = "";
  refs.scheduleForm.elements.scheduledDate.value = currentLocalDate();
  refs.scheduleForm.elements.responsibleName.value = state.user?.name || "";
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
