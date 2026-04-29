const path = require("path");
const express = require("express");
const crypto = require("crypto");
const { DB_PATH, DB_PATH_SOURCE, initDatabase, get, all, write, insert, transaction } = require("./src/database");
const {
  SESSION_COOKIE,
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashToken,
  parseCookies,
  buildSessionCookie,
  buildClearedSessionCookie,
} = require("./src/security");
const {
  nowIso,
  todayDate,
  normalizeKey,
  normalizeText,
  splitLines,
  safeJsonParse,
  toNumber,
} = require("./src/helpers");
const { parseInvoiceXml, parseSpreadsheet, parseEml, analyzeEmailPayload } = require("./src/parsers");

const PORT = Number(process.env.PORT || 3000);
const DASHBOARD_PERIODS = [7, 15, 30, 60, 90];
const USER_STATUSES = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
};
const ACTIVATION_CODE_TTL_HOURS = Math.max(Number(process.env.ACTIVATION_CODE_TTL_HOURS || 24), 1);

const ROLE_ALIASES = {
  admin: "ADMIN",
  administrador: "ADMIN",
  operational: "OPERATIONAL",
  operacional: "OPERATIONAL",
  manager: "MANAGER",
  gerente: "MANAGER",
};

const NOTE_STATUS_ALIASES = {
  new: "NEW",
  nova: "NEW",
  pending_ack: "PENDING_ACK",
  aguardando_reconhecimento: "PENDING_ACK",
  acknowledged: "ACKNOWLEDGED",
  reconhecida: "ACKNOWLEDGED",
  sent_finance: "SENT_FINANCE",
  enviada_ao_financeiro: "SENT_FINANCE",
  finalized: "FINALIZED",
  finalizada: "FINALIZED",
};

const NOTE_CATEGORY_ALIASES = {
  logistics: "LOGISTICS",
  logistica: "LOGISTICS",
  other: "OTHER",
  outros: "OTHER",
  outro: "OTHER",
};

const INVENTORY_MOVEMENT_ALIASES = {
  in: "IN",
  entrada: "IN",
  out: "OUT",
  saida: "OUT",
  saída: "OUT",
};

const FUEL_TYPE_ALIASES = {
  entry: "ENTRY",
  entrada: "ENTRY",
  exit: "EXIT",
  saida: "EXIT",
  saída: "EXIT",
};

const FUEL_KIND_ALIASES = {
  s500: "S500",
  s_500: "S500",
  diesel_s500: "S500",
  diesel_s_500: "S500",
  s10: "S10",
  s_10: "S10",
  diesel_s10: "S10",
  diesel_s_10: "S10",
};

const STOCK_TYPE_ALIASES = {
  common: "COMMON",
  comum: "COMMON",
  estoque_comum: "COMMON",
  almoxarifado: "COMMON",
  fuel: "FUEL",
  combustivel: "FUEL",
  combustiveis: "FUEL",
};

const VEHICLE_FUEL_PROFILE_ALIASES = {
  s500: "S500",
  s_500: "S500",
  s10: "S10",
  s_10: "S10",
  both: "BOTH",
  ambos: "BOTH",
  ambos_combustiveis: "BOTH",
  ambos_combustiveis_: "BOTH",
};

const VEHICLE_STATUS_ALIASES = {
  active: "ACTIVE",
  ativo: "ACTIVE",
  available: "AVAILABLE",
  disponivel: "AVAILABLE",
  maintenance: "MAINTENANCE",
  manutencao: "MAINTENANCE",
  manutencao_programada: "MAINTENANCE",
  em_manutencao: "MAINTENANCE",
  inactive: "INACTIVE",
  inativo: "INACTIVE",
};

const FINE_STATUS_ALIASES = {
  aberta: "OPEN",
  open: "OPEN",
  contestando: "CONTESTING",
  contesting: "CONTESTING",
  aguardando_condutor: "WAITING_DRIVER",
  waiting_driver: "WAITING_DRIVER",
  pendente_pagamento: "PENDING_PAYMENT",
  pending_payment: "PENDING_PAYMENT",
  paga: "PAID",
  paid: "PAID",
};
const DEFAULT_SCHEDULE_DOCUMENT_TITLE = "ESCALA OPERACIONAL DIARIA";
const SCHEDULE_DOCUMENT_TITLE_OPTIONS = [
  DEFAULT_SCHEDULE_DOCUMENT_TITLE,
  "RELACAO PARA VIAGEM E EMBARQUE",
];

const CHECKLIST_STATUS_ALIASES = {
  aberto: "OPEN",
  open: "OPEN",
  ok: "OK",
  problemas: "ISSUES",
  issues: "ISSUES",
};

const CHECKLIST_ITEM_STATUS_ALIASES = {
  ok: "OK",
  atencao: "ATTENTION",
  attention: "ATTENTION",
  critico: "CRITICAL",
  critical: "CRITICAL",
};

const CHECKLIST_CATEGORY_ALIASES = {
  seguranca: "Seguranca",
  mecanica: "Mecanica",
  eletrica: "Eletrica",
  documentacao: "Documentacao",
  documentacao_legal: "Documentacao",
  carroceria: "Carroceria/Bau",
  bau: "Carroceria/Bau",
  carroceria_bau: "Carroceria/Bau",
  conservacao: "Conservacao",
  outros: "Outros",
  outro: "Outros",
};

const DEFAULT_COMPANY_SETTINGS = {
  companyName: "Empresa cliente",
  logoDataUrl: "",
  cnpj: "",
  address: "",
  phone: "",
  email: "",
  primaryColor: "#c40000",
  documentFooter: "Gerado pelo sistema Horizon",
};

const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    itemKey: "freios",
    name: "Freios",
    description: "Verificar funcionamento do sistema de freios.",
    category: "Seguranca",
    required: true,
    active: true,
    sortOrder: 1,
  },
  {
    itemKey: "luzes",
    name: "Luzes",
    description: "Farol, seta, luz de freio e re.",
    category: "Eletrica",
    required: true,
    active: true,
    sortOrder: 2,
  },
  {
    itemKey: "buzina",
    name: "Buzina",
    description: "Confirmar acionamento da buzina.",
    category: "Seguranca",
    required: true,
    active: true,
    sortOrder: 3,
  },
  {
    itemKey: "cinto",
    name: "Cinto de seguranca",
    description: "Checar travamento e desgaste.",
    category: "Seguranca",
    required: true,
    active: true,
    sortOrder: 4,
  },
  {
    itemKey: "pneus",
    name: "Pneus",
    description: "Estado geral, sulco e calibragem visual.",
    category: "Mecanica",
    required: true,
    active: true,
    sortOrder: 5,
  },
  {
    itemKey: "triangulo",
    name: "Triangulo",
    description: "Conferir presenca e acesso rapido.",
    category: "Documentacao",
    required: true,
    active: true,
    sortOrder: 6,
  },
  {
    itemKey: "extintor",
    name: "Extintor",
    description: "Usar apenas se exigido pela operacao.",
    category: "Seguranca",
    required: false,
    active: false,
    sortOrder: 7,
  },
];

function resolvePublicAppInfo(port) {
  const appUrl = normalizeText(process.env.APP_URL).replace(/\/+$/, "");
  if (appUrl) {
    return {
      url: appUrl,
      source: "APP_URL",
    };
  }

  const railwayDomain = normalizeText(process.env.RAILWAY_PUBLIC_DOMAIN);
  if (railwayDomain) {
    return {
      url: `https://${railwayDomain}`,
      source: "RAILWAY_PUBLIC_DOMAIN",
    };
  }

  const fallbackUrl = normalizeText(
    process.env.PUBLIC_URL || process.env.SITE_URL || process.env.URL || process.env.RENDER_EXTERNAL_URL
  ).replace(/\/+$/, "");
  if (fallbackUrl) {
    return {
      url: fallbackUrl,
      source: "fallback",
    };
  }

  if (String(process.env.NODE_ENV || "").trim().toLowerCase() === "production") {
    return {
      url: "",
      source: "",
    };
  }

  return {
    url: `http://localhost:${port}`,
    source: "local",
  };
}

function normalizeEnum(value, aliases, fallback) {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  return aliases[normalized] || fallback;
}

function normalizeRole(value, fallback = "OPERATIONAL") {
  return normalizeEnum(value, ROLE_ALIASES, fallback);
}

function normalizeNoteStatus(value, fallback = "NEW") {
  return normalizeEnum(value, NOTE_STATUS_ALIASES, fallback);
}

function normalizeNoteCategory(value, fallback = "OTHER") {
  return normalizeEnum(value, NOTE_CATEGORY_ALIASES, fallback);
}

function normalizeInventoryMovement(value, fallback = "IN") {
  return normalizeEnum(value, INVENTORY_MOVEMENT_ALIASES, fallback);
}

function normalizeFuelType(value, fallback = "ENTRY") {
  return normalizeEnum(value, FUEL_TYPE_ALIASES, fallback);
}

function normalizeFuelKind(value, fallback = "") {
  return normalizeEnum(value, FUEL_KIND_ALIASES, fallback);
}

function inferFuelKindFromValue(value, fallback = "") {
  const normalizedFuelKind = normalizeFuelKind(value, "");
  if (normalizedFuelKind) {
    return normalizedFuelKind;
  }

  const normalizedValue = normalizeKey(value);
  if (!normalizedValue) {
    return fallback;
  }

  if (normalizedValue.includes("s500")) {
    return "S500";
  }

  if (normalizedValue.includes("s10")) {
    return "S10";
  }

  return fallback;
}

function buildFuelKindSqlExpression(alias = "m", productAlias = "p") {
  return `
    CASE
      WHEN trim(coalesce(${alias}.fuel_kind, '')) <> '' THEN upper(replace(replace(replace(trim(${alias}.fuel_kind), '-', ''), '_', ''), ' ', ''))
      WHEN lower(replace(replace(replace(coalesce(${productAlias}.name, ''), '-', ''), '_', ''), ' ', '')) LIKE '%s500%' THEN 'S500'
      WHEN lower(replace(replace(replace(coalesce(${productAlias}.name, ''), '-', ''), '_', ''), ' ', '')) LIKE '%s10%' THEN 'S10'
      ELSE ''
    END
  `;
}

function resolveFuelProductKind(product) {
  if (!product) {
    return "";
  }

  if (product.id) {
    const linkedKinds = all(
      `
        SELECT DISTINCT fuel_kind
        FROM fuel_storages
        WHERE product_id = ? AND active = 1
        ORDER BY fuel_kind ASC
      `,
      [Number(product.id)]
    )
      .map((row) => inferFuelKindFromValue(row.fuel_kind, ""))
      .filter(Boolean);

    if (linkedKinds.length === 1) {
      return linkedKinds[0];
    }

    if (linkedKinds.length > 1) {
      return inferFuelKindFromValue(product.name, "");
    }
  }

  return inferFuelKindFromValue(product.name, "");
}

function normalizeStockType(value, fallback = "COMMON") {
  return normalizeEnum(value, STOCK_TYPE_ALIASES, fallback);
}

function normalizeVehicleFuelProfile(value, fallback = "S500") {
  return normalizeEnum(value, VEHICLE_FUEL_PROFILE_ALIASES, fallback);
}

function normalizeVehicleOperationalStatus(value, fallback = "ACTIVE") {
  return normalizeEnum(value, VEHICLE_STATUS_ALIASES, fallback);
}

function isVehicleOperational(status) {
  const normalized = normalizeVehicleOperationalStatus(status, "ACTIVE");
  return normalized === "ACTIVE" || normalized === "AVAILABLE";
}

function normalizePlate(value) {
  return normalizeText(value).toUpperCase();
}

function normalizePlateKey(value) {
  return normalizePlate(value).replace(/[^A-Z0-9]/g, "");
}

function formatSchedulePlate(value) {
  const normalized = normalizePlateKey(value).slice(0, 7);
  if (!normalized) {
    return "";
  }
  return normalized.length > 3 ? `${normalized.slice(0, 3)}-${normalized.slice(3)}` : normalized;
}

function normalizeScheduleTime(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return "";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeScheduleLabel(value) {
  return normalizeText(value);
}

function normalizeScheduleDocumentTitle(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return DEFAULT_SCHEDULE_DOCUMENT_TITLE;
  }

  const existing = SCHEDULE_DOCUMENT_TITLE_OPTIONS.find((option) => normalizeKey(option) === normalizeKey(normalized));
  return existing || normalized;
}

function vehicleSupportsFuel(profile, fuelKind) {
  const normalizedProfile = normalizeVehicleFuelProfile(profile, "S500");
  const normalizedFuelKind = normalizeFuelKind(fuelKind, "");
  return !normalizedFuelKind || normalizedProfile === "BOTH" || normalizedProfile === normalizedFuelKind;
}

function normalizeFineStatus(value, fallback = "OPEN") {
  return normalizeEnum(value, FINE_STATUS_ALIASES, fallback);
}

function normalizeChecklistCategory(value, fallback = "Outros") {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  return CHECKLIST_CATEGORY_ALIASES[normalized] || normalizeText(value) || fallback;
}

function normalizeChecklistItemStatus(value, fallback = "OK") {
  return normalizeEnum(value, CHECKLIST_ITEM_STATUS_ALIASES, fallback);
}

function normalizeChecklistItem(item, index) {
  if (typeof item === "string") {
    const label = normalizeText(item);
    return {
      key: normalizeKey(label) || `item_${index + 1}`,
      label,
      description: "",
      category: "Outros",
      required: true,
      active: true,
      vehicleType: "",
      notes: "",
      status: "OK",
    };
  }

  const label = normalizeText(item?.label || item?.name || item?.title);
  return {
    key: normalizeKey(item?.key || label) || `item_${index + 1}`,
    label: label || `Item ${index + 1}`,
    description: normalizeText(item?.description),
    category: normalizeChecklistCategory(item?.category, "Outros"),
    required: item?.required === false ? false : true,
    active: item?.active === false ? false : true,
    vehicleType: normalizeText(item?.vehicleType || item?.vehicle_type),
    notes: normalizeText(item?.notes || item?.observation),
    status: normalizeChecklistItemStatus(item?.status, "OK"),
  };
}

function parseChecklistStorage(rawValue) {
  const parsed = safeJsonParse(rawValue, []);
  if (Array.isArray(parsed)) {
    const itemsDetailed = parsed.map(normalizeChecklistItem).filter((item) => item.label);
    return {
      meta: {},
      itemsDetailed,
    };
  }

  const itemsDetailed = Array.isArray(parsed?.items)
    ? parsed.items.map(normalizeChecklistItem).filter((item) => item.label)
    : [];

  return {
    meta: typeof parsed?.meta === "object" && parsed.meta ? parsed.meta : {},
    itemsDetailed,
  };
}

function buildChecklistStoragePayload(input, fallbackRaw = "") {
  const payloadItems = Array.isArray(input?.itemsDetailed)
    ? input.itemsDetailed
    : safeJsonParse(input?.itemsDetailed, []);
  const lineItems = splitLines(input?.items || "").map((item) => ({ label: item }));
  const fallback = parseChecklistStorage(fallbackRaw);
  const itemsDetailed = (payloadItems.length ? payloadItems : lineItems.length ? lineItems : fallback.itemsDetailed)
    .map(normalizeChecklistItem)
    .filter((item) => item.label);

  const fallbackMeta = fallback.meta || {};
  const rawOdometer = input?.odometerKm ?? fallbackMeta.odometerKm ?? "";
  const hasOdometer = rawOdometer !== null && rawOdometer !== undefined && String(rawOdometer).trim() !== "";
  const odometerKm = hasOdometer ? toNumber(rawOdometer) : null;
  const meta = {
    checklistType: normalizeText(input?.checklistType || fallbackMeta.checklistType || "PRE_USE") || "PRE_USE",
    driverName: normalizeText(input?.driverName || fallbackMeta.driverName),
    odometerKm,
    signatureName: normalizeText(input?.signatureName || fallbackMeta.signatureName),
    temporaryIssue: normalizeText(input?.temporaryIssue || fallbackMeta.temporaryIssue),
  };

  const summary = itemsDetailed.reduce(
    (totals, item) => {
      if (item.status === "CRITICAL") totals.critical += 1;
      else if (item.status === "ATTENTION") totals.attention += 1;
      else totals.ok += 1;
      return totals;
    },
    { ok: 0, attention: 0, critical: 0 }
  );

  const overallStatus =
    summary.critical > 0 ? "ISSUES" : summary.attention > 0 ? "OPEN" : "OK";

  return {
    itemsDetailed,
    meta,
    summary,
    overallStatus,
    storedJson: JSON.stringify({ meta, items: itemsDetailed }),
  };
}

function normalizeCompanySettingsInput(input = {}, fallback = {}) {
  return {
    companyName: normalizeText(input.companyName || input.name || fallback.companyName || DEFAULT_COMPANY_SETTINGS.companyName),
    logoDataUrl: normalizeText(input.logoDataUrl || input.logo || fallback.logoDataUrl),
    cnpj: normalizeText(input.cnpj || fallback.cnpj),
    address: normalizeText(input.address || fallback.address),
    phone: normalizeText(input.phone || fallback.phone),
    email: normalizeText(input.email || fallback.email).toLowerCase(),
    primaryColor: normalizeText(input.primaryColor || fallback.primaryColor || DEFAULT_COMPANY_SETTINGS.primaryColor),
    documentFooter:
      normalizeText(input.documentFooter || input.footer || fallback.documentFooter || DEFAULT_COMPANY_SETTINGS.documentFooter),
  };
}

function mapCompanySettingsRow(row) {
  return {
    companyName: normalizeText(row?.company_name || DEFAULT_COMPANY_SETTINGS.companyName),
    logoDataUrl: normalizeText(row?.logo_data_url),
    cnpj: normalizeText(row?.cnpj),
    address: normalizeText(row?.address),
    phone: normalizeText(row?.phone),
    email: normalizeText(row?.email).toLowerCase(),
    primaryColor: normalizeText(row?.primary_color || DEFAULT_COMPANY_SETTINGS.primaryColor),
    documentFooter: normalizeText(row?.document_footer || DEFAULT_COMPANY_SETTINGS.documentFooter),
    createdAt: normalizeText(row?.created_at),
    updatedAt: normalizeText(row?.updated_at),
  };
}

function queryCompanySettings() {
  const row = get("SELECT * FROM company_settings WHERE id = 1 LIMIT 1");
  return {
    ...DEFAULT_COMPANY_SETTINGS,
    ...mapCompanySettingsRow(row),
  };
}

function ensureCompanySettingsSeeded() {
  const existing = get("SELECT id FROM company_settings WHERE id = 1 LIMIT 1");
  if (!existing) {
    saveCompanySettings(DEFAULT_COMPANY_SETTINGS, null);
  }
}

function saveCompanySettings(input = {}, user = null) {
  const existing = get("SELECT * FROM company_settings WHERE id = 1 LIMIT 1");
  const settings = normalizeCompanySettingsInput(input, mapCompanySettingsRow(existing));
  const timestamp = nowIso();

  if (!settings.companyName) {
    throw new Error("Informe o nome da empresa.");
  }

  if (existing) {
    write(
      `
        UPDATE company_settings
        SET company_name = ?, logo_data_url = ?, cnpj = ?, address = ?, phone = ?, email = ?,
            primary_color = ?, document_footer = ?, updated_at = ?, updated_by = ?
        WHERE id = 1
      `,
      [
        settings.companyName,
        settings.logoDataUrl || null,
        settings.cnpj || null,
        settings.address || null,
        settings.phone || null,
        settings.email || null,
        settings.primaryColor || DEFAULT_COMPANY_SETTINGS.primaryColor,
        settings.documentFooter || DEFAULT_COMPANY_SETTINGS.documentFooter,
        timestamp,
        user?.id || null,
      ]
    );
  } else {
    insert(
      `
        INSERT INTO company_settings (
          id, company_name, logo_data_url, cnpj, address, phone, email, primary_color,
          document_footer, created_at, updated_at, updated_by
        )
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        settings.companyName,
        settings.logoDataUrl || null,
        settings.cnpj || null,
        settings.address || null,
        settings.phone || null,
        settings.email || null,
        settings.primaryColor || DEFAULT_COMPANY_SETTINGS.primaryColor,
        settings.documentFooter || DEFAULT_COMPANY_SETTINGS.documentFooter,
        timestamp,
        timestamp,
        user?.id || null,
      ]
    );
  }

  return queryCompanySettings();
}

function normalizeChecklistTemplateItemConfig(input = {}, index = 0, fallback = {}) {
  const name = normalizeText(input.name || input.label || fallback.name);
  const itemKey = normalizeKey(input.itemKey || input.key || name || fallback.itemKey) || `item_${index + 1}`;
  const sortOrder = Math.max(1, Number.parseInt(String(input.sortOrder ?? fallback.sortOrder ?? index + 1), 10) || index + 1);

  return {
    itemKey,
    name: name || `Item ${index + 1}`,
    description: normalizeText(input.description || fallback.description),
    category: normalizeChecklistCategory(input.category || fallback.category, "Outros"),
    required: input.required === false || input.required === "false" ? false : fallback.required === false ? false : true,
    active: input.active === false || input.active === "false" ? false : fallback.active === false ? false : true,
    vehicleType: normalizeText(input.vehicleType || input.vehicle_type || fallback.vehicleType),
    sortOrder,
  };
}

function queryChecklistTemplateItems() {
  const rows = all(
    `
      SELECT *
      FROM checklist_items
      ORDER BY sort_order ASC, id ASC
    `
  );

  if (!rows.length) {
    return DEFAULT_CHECKLIST_TEMPLATE.map((item, index) => ({
      id: null,
      ...normalizeChecklistTemplateItemConfig(item, index),
      isDefault: true,
    }));
  }

  return rows.map((row, index) => ({
    id: Number(row.id),
    ...normalizeChecklistTemplateItemConfig(
      {
        itemKey: row.item_key,
        name: row.name,
        description: row.description,
        category: row.category,
        required: Number(row.required || 0) === 1,
        active: Number(row.active || 0) === 1,
        vehicleType: row.vehicle_type,
        sortOrder: row.sort_order,
      },
      index
    ),
    isDefault: false,
  }));
}

function ensureChecklistTemplateSeeded() {
  const existing = get("SELECT id FROM checklist_items LIMIT 1");
  if (existing) {
    return;
  }

  const adminUser = get("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1");
  const timestamp = nowIso();

  transaction(() => {
    DEFAULT_CHECKLIST_TEMPLATE.forEach((item, index) => {
      const normalized = normalizeChecklistTemplateItemConfig(item, index);
      insert(
        `
          INSERT INTO checklist_items (
            item_key, name, description, category, required, active, vehicle_type, sort_order,
            created_at, updated_at, updated_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          normalized.itemKey,
          normalized.name,
          normalized.description || null,
          normalized.category,
          normalized.required ? 1 : 0,
          normalized.active ? 1 : 0,
          normalized.vehicleType || null,
          normalized.sortOrder,
          timestamp,
          timestamp,
          adminUser?.id || null,
        ]
      );
    });
  });
}

function createChecklistTemplateItem(input = {}, user) {
  const existingByKey = get("SELECT id FROM checklist_items WHERE item_key = ? LIMIT 1", [
    normalizeKey(input.itemKey || input.key || input.name || input.label),
  ]);
  if (existingByKey) {
    throw new Error("Ja existe um item de checklist com esta chave.");
  }

  const normalized = normalizeChecklistTemplateItemConfig(input, 0);
  const timestamp = nowIso();
  const itemId = insert(
    `
      INSERT INTO checklist_items (
        item_key, name, description, category, required, active, vehicle_type, sort_order,
        created_at, updated_at, updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      normalized.itemKey,
      normalized.name,
      normalized.description || null,
      normalized.category,
      normalized.required ? 1 : 0,
      normalized.active ? 1 : 0,
      normalized.vehicleType || null,
      normalized.sortOrder,
      timestamp,
      timestamp,
      user?.id || null,
    ]
  );

  return queryChecklistTemplateItems().find((item) => item.id === itemId) || null;
}

function updateChecklistTemplateItem(itemId, input = {}, user) {
  const existing = get("SELECT * FROM checklist_items WHERE id = ? LIMIT 1", [Number(itemId)]);
  if (!existing) {
    throw new Error("Item de checklist nao encontrado.");
  }

  const normalized = normalizeChecklistTemplateItemConfig(
    input,
    Number(existing.sort_order || 1) - 1,
    {
      itemKey: existing.item_key,
      name: existing.name,
      description: existing.description,
      category: existing.category,
      required: Number(existing.required || 0) === 1,
      active: Number(existing.active || 0) === 1,
      vehicleType: existing.vehicle_type,
      sortOrder: Number(existing.sort_order || 1),
    }
  );

  const duplicate = get("SELECT id FROM checklist_items WHERE item_key = ? AND id <> ? LIMIT 1", [
    normalized.itemKey,
    Number(itemId),
  ]);
  if (duplicate) {
    throw new Error("Ja existe outro item com esta chave.");
  }

  write(
    `
      UPDATE checklist_items
      SET item_key = ?, name = ?, description = ?, category = ?, required = ?, active = ?,
          vehicle_type = ?, sort_order = ?, updated_at = ?, updated_by = ?
      WHERE id = ?
    `,
    [
      normalized.itemKey,
      normalized.name,
      normalized.description || null,
      normalized.category,
      normalized.required ? 1 : 0,
      normalized.active ? 1 : 0,
      normalized.vehicleType || null,
      normalized.sortOrder,
      nowIso(),
      user?.id || null,
      Number(itemId),
    ]
  );

  return queryChecklistTemplateItems().find((item) => item.id === Number(itemId)) || null;
}

function normalizeDashboardDays(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return DASHBOARD_PERIODS.includes(parsed) ? parsed : 30;
}

function normalizeDashboardDate(value) {
  const normalized = normalizeText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function buildDashboardDayRange(days) {
  const periodDays = normalizeDashboardDays(days);
  const endDate = new Date(`${todayDate()}T12:00:00`);
  const result = [];

  for (let offset = periodDays - 1; offset >= 0; offset -= 1) {
    const current = new Date(endDate);
    current.setDate(endDate.getDate() - offset);
    result.push(current.toISOString().slice(0, 10));
  }

  return result;
}

function buildDashboardDayRangeBetween(startDay, endDay) {
  const normalizedStart = normalizeDashboardDate(startDay);
  const normalizedEnd = normalizeDashboardDate(endDay);
  if (!normalizedStart || !normalizedEnd || normalizedStart > normalizedEnd) {
    return [];
  }

  const current = new Date(`${normalizedStart}T12:00:00`);
  const endDate = new Date(`${normalizedEnd}T12:00:00`);
  const result = [];

  while (current <= endDate) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function resolveDashboardPeriod(filters = {}) {
  const from = normalizeDashboardDate(filters.from);
  const to = normalizeDashboardDate(filters.to);

  if (from && to && from <= to) {
    const dayRange = buildDashboardDayRangeBetween(from, to);
    if (dayRange.length) {
      return {
        periodDays: dayRange.length,
        dayRange,
        startDay: dayRange[0],
        endDay: dayRange[dayRange.length - 1],
        isCustomRange: true,
      };
    }
  }

  const periodDays = normalizeDashboardDays(filters.days);
  const dayRange = buildDashboardDayRange(periodDays);
  return {
    periodDays,
    dayRange,
    startDay: dayRange[0],
    endDay: dayRange[dayRange.length - 1],
    isCustomRange: false,
  };
}

function normalizeChecklistStatus(value, fallback = "OPEN") {
  return normalizeEnum(value, CHECKLIST_STATUS_ALIASES, fallback);
}

function resolveUserStatus(row) {
  const rawStatus = normalizeText(row?.status).toUpperCase();
  if (rawStatus === USER_STATUSES.PENDING || rawStatus === USER_STATUSES.ACTIVE || rawStatus === USER_STATUSES.BLOCKED) {
    return rawStatus;
  }
  return Number(row?.active) ? USER_STATUSES.ACTIVE : USER_STATUSES.BLOCKED;
}

function isSystemUser(row) {
  return Boolean(Number(row?.is_system || 0));
}

function redactSensitiveDetails(details, keyName = "") {
  const normalizedKey = normalizeKey(keyName);
  const shouldRedact =
    normalizedKey.includes("code") ||
    normalizedKey.includes("password") ||
    normalizedKey.includes("secret") ||
    normalizedKey.includes("token");

  if (shouldRedact) {
    return "[redacted]";
  }

  if (Array.isArray(details)) {
    return details.map((item) => redactSensitiveDetails(item, keyName));
  }

  if (details && typeof details === "object") {
    return Object.fromEntries(
      Object.entries(details).map(([entryKey, entryValue]) => [entryKey, redactSensitiveDetails(entryValue, entryKey)])
    );
  }

  return details;
}

function formatUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    status: resolveUserStatus(row),
  };
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function logAction(user, action, entityType, entityId, details = null) {
  insert(
    `
      INSERT INTO action_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user?.id || null,
      user?.name || "Sistema",
      action,
      entityType,
      entityId ? String(entityId) : null,
      details ? JSON.stringify(redactSensitiveDetails(details)) : null,
      nowIso(),
    ]
  );
}

function upsertSupplierRule(supplierName, category, userId) {
  if (!supplierName || !category) {
    return;
  }

  const existingRule = get(
    "SELECT id FROM supplier_rules WHERE lower(supplier_name) = lower(?)",
    [supplierName]
  );

  if (existingRule) {
    write(
      `
        UPDATE supplier_rules
        SET supplier_name = ?, category = ?, updated_by = ?, updated_at = ?
        WHERE id = ?
      `,
      [supplierName, category, userId || null, nowIso(), existingRule.id]
    );
  } else {
    insert(
      `
        INSERT INTO supplier_rules (supplier_name, category, updated_by, updated_at)
        VALUES (?, ?, ?, ?)
      `,
      [supplierName, category, userId || null, nowIso()]
    );
  }
}

function getSupplierCategory(supplierName) {
  if (!supplierName) {
    return null;
  }

  const rule = get(
    "SELECT category FROM supplier_rules WHERE lower(supplier_name) = lower(?)",
    [supplierName]
  );

  return rule ? rule.category : null;
}

function buildLikeSearch(search) {
  return `%${String(search ?? "").trim().toLowerCase()}%`;
}

function mapNoteRow(row) {
  return {
    id: Number(row.id),
    supplierName: row.supplier_name,
    totalValue: Number(row.total_value || 0),
    danfe: row.danfe,
    xmlKey: row.xml_key,
    issueDate: row.issue_date,
    category: row.category,
    status: row.status,
    source: row.source,
    financeNotes: row.finance_notes,
    sentToFinanceAt: row.sent_to_finance_at,
    sentToFinanceBy: row.sent_to_finance_by ? Number(row.sent_to_finance_by) : null,
    sentToFinanceByName: row.sent_to_finance_by_name || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.created_by_name || "",
    updatedByName: row.updated_by_name || "",
  };
}

function createOrUpdateNote(payload, user, options = {}) {
  let existingNote = options.existingNote || null;
  const supplierName = normalizeText(payload.supplierName || payload.supplier_name);
  if (!supplierName) {
    throw new Error("Fornecedor e obrigatorio.");
  }

  const xmlKey = normalizeText(payload.xmlKey || payload.xml_key);
  if (!existingNote && xmlKey) {
    existingNote = get("SELECT * FROM notes WHERE xml_key = ?", [xmlKey]) || null;
  }

  const preserveExistingWorkflow = Boolean(existingNote && options.preferExistingWorkflow);
  const rememberedCategory = getSupplierCategory(supplierName);
  const category = normalizeNoteCategory(
    preserveExistingWorkflow && !payload.category ? existingNote.category : payload.category,
    existingNote?.category || rememberedCategory || "OTHER"
  );
  const status = preserveExistingWorkflow
    ? existingNote.status
    : normalizeNoteStatus(payload.status, existingNote?.status || "NEW");
  const issueDate = normalizeText(payload.issueDate || payload.issue_date);
  const financeNotes = preserveExistingWorkflow
    ? normalizeText(payload.financeNotes || payload.finance_notes || existingNote?.finance_notes)
    : normalizeText(payload.financeNotes || payload.finance_notes);
  const totalValue = toNumber(payload.totalValue ?? payload.total_value);
  const danfe = normalizeText(payload.danfe);
  const source = normalizeText(payload.source || options.source || existingNote?.source || "MANUAL").toUpperCase();
  const timestamp = nowIso();

  let sentToFinanceAt = preserveExistingWorkflow
    ? normalizeText(
        payload.sentToFinanceAt || payload.sent_to_finance_at || existingNote?.sent_to_finance_at
      )
    : normalizeText(payload.sentToFinanceAt || payload.sent_to_finance_at);
  let sentToFinanceBy = preserveExistingWorkflow
    ? payload.sentToFinanceBy || payload.sent_to_finance_by || existingNote?.sent_to_finance_by || null
    : payload.sentToFinanceBy || payload.sent_to_finance_by || null;

  if (status === "SENT_FINANCE") {
    sentToFinanceAt = sentToFinanceAt || existingNote?.sent_to_finance_at || timestamp;
    sentToFinanceBy = sentToFinanceBy || existingNote?.sent_to_finance_by || user?.id || null;
  } else if (!payload.keepFinanceInfo && !preserveExistingWorkflow) {
    sentToFinanceAt = "";
    sentToFinanceBy = null;
  }

  let noteId = existingNote ? Number(existingNote.id) : 0;

  transaction(() => {
    if (existingNote) {
      write(
        `
          UPDATE notes
          SET supplier_name = ?, total_value = ?, danfe = ?, xml_key = ?, issue_date = ?,
              category = ?, status = ?, source = ?, finance_notes = ?,
              sent_to_finance_at = ?, sent_to_finance_by = ?, updated_by = ?, updated_at = ?
          WHERE id = ?
        `,
        [
          supplierName,
          totalValue,
          danfe,
          xmlKey,
          issueDate,
          category,
          status,
          source,
          financeNotes,
          sentToFinanceAt || null,
          sentToFinanceBy || null,
          user?.id || null,
          timestamp,
          noteId,
        ]
      );
    } else {
      noteId = insert(
        `
          INSERT INTO notes (
            supplier_name, total_value, danfe, xml_key, issue_date, category, status, source,
            finance_notes, sent_to_finance_at, sent_to_finance_by, created_by, updated_by, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          supplierName,
          totalValue,
          danfe,
          xmlKey,
          issueDate,
          category,
          status,
          source,
          financeNotes,
          sentToFinanceAt || null,
          sentToFinanceBy || null,
          user?.id || null,
          user?.id || null,
          timestamp,
          timestamp,
        ]
      );
    }

    upsertSupplierRule(supplierName, category, user?.id || null);

    if (!options.skipLog) {
      logAction(
        user,
        existingNote ? "UPDATE_NOTE" : "CREATE_NOTE",
        "NOTE",
        noteId,
        { supplierName, category, status, source }
      );
    }
  });

  const fresh = get(
    `
      SELECT n.*, sent_user.name AS sent_to_finance_by_name, created_user.name AS created_by_name,
             updated_user.name AS updated_by_name
      FROM notes n
      LEFT JOIN users sent_user ON sent_user.id = n.sent_to_finance_by
      LEFT JOIN users created_user ON created_user.id = n.created_by
      LEFT JOIN users updated_user ON updated_user.id = n.updated_by
      WHERE n.id = ?
    `,
    [noteId]
  );

  return mapNoteRow(fresh);
}

function queryNotes(filters = {}) {
  let sql = `
    SELECT n.*, sent_user.name AS sent_to_finance_by_name, created_user.name AS created_by_name,
           updated_user.name AS updated_by_name
    FROM notes n
    LEFT JOIN users sent_user ON sent_user.id = n.sent_to_finance_by
    LEFT JOIN users created_user ON created_user.id = n.created_by
    LEFT JOIN users updated_user ON updated_user.id = n.updated_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.status) {
    sql += " AND n.status = ?";
    params.push(normalizeNoteStatus(filters.status, "NEW"));
  }

  if (filters.category) {
    sql += " AND n.category = ?";
    params.push(normalizeNoteCategory(filters.category, "OTHER"));
  }

  if (filters.search) {
    const search = buildLikeSearch(filters.search);
    sql += " AND (lower(n.supplier_name) LIKE ? OR lower(coalesce(n.danfe, '')) LIKE ?)";
    params.push(search, search);
  }

  sql += " ORDER BY n.updated_at DESC, n.id DESC";

  return all(sql, params).map(mapNoteRow);
}

function queryProducts(search = "", filters = {}) {
  let sql = "SELECT * FROM inventory_products WHERE active = 1";
  const params = [];

  if (filters.stockType) {
    sql += " AND stock_type = ?";
    params.push(normalizeStockType(filters.stockType, "COMMON"));
  }

  if (search) {
    sql += " AND (lower(name) LIKE ? OR lower(coalesce(barcode, '')) LIKE ?)";
    const like = buildLikeSearch(search);
    params.push(like, like);
  }

  sql += " ORDER BY name ASC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    name: row.name,
    unit: row.unit,
    barcode: row.barcode,
    stockType: normalizeStockType(row.stock_type, "COMMON"),
    minStock: Number(row.min_stock || 0),
    currentStock: Number(row.current_stock || 0),
    defaultCost: Number(row.default_cost || 0),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lowStock: Number(row.current_stock || 0) <= Number(row.min_stock || 0),
  }));
}

function queryVehicles(filters = {}) {
  let sql = `
    SELECT v.*, u.name AS user_name
    FROM vehicles v
    LEFT JOIN users u ON u.id = v.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.activeOnly) {
    sql += " AND v.active = 1";
  }

  if (filters.plate) {
    sql += " AND v.plate = ?";
    params.push(normalizePlate(filters.plate));
  }

  if (filters.fuelKind) {
    const fuelKind = normalizeFuelKind(filters.fuelKind, "");
    if (fuelKind) {
      sql += " AND (v.fuel_profile = ? OR v.fuel_profile = 'BOTH')";
      params.push(fuelKind);
    }
  }

  sql += " ORDER BY v.plate ASC, v.id ASC";

  return all(sql, params).map((row) => {
    const fuelProfile = normalizeVehicleFuelProfile(row.fuel_profile, "S500");
    const operationalStatus = normalizeVehicleOperationalStatus(
      row.operational_status || (Number(row.active || 0) === 1 ? "ACTIVE" : "INACTIVE"),
      Number(row.active || 0) === 1 ? "ACTIVE" : "INACTIVE"
    );
    return {
      id: Number(row.id),
      plate: row.plate,
      fuelProfile,
      brand: row.brand || "",
      model: row.model || "",
      sector: row.sector || "",
      status: operationalStatus,
      active: isVehicleOperational(operationalStatus),
      notes: row.notes || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userName: row.user_name || "",
      available: operationalStatus === "AVAILABLE",
      inMaintenance: operationalStatus === "MAINTENANCE",
      supportsS500: vehicleSupportsFuel(fuelProfile, "S500"),
      supportsS10: vehicleSupportsFuel(fuelProfile, "S10"),
      displayName: [row.plate, normalizeText([row.brand, row.model].filter(Boolean).join(" "))]
        .filter(Boolean)
        .join(" - "),
    };
  });
}

function queryInventoryMovements(filters = {}) {
  let sql = `
    SELECT
      m.*,
      p.name AS product_name,
      p.unit AS product_unit,
      p.stock_type AS product_stock_type,
      p.default_cost AS product_default_cost,
      u.name AS user_name
    FROM inventory_movements m
    JOIN inventory_products p ON p.id = m.product_id
    LEFT JOIN users u ON u.id = m.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.productId) {
    sql += " AND m.product_id = ?";
    params.push(Number(filters.productId));
  }

  if (filters.stockType) {
    sql += " AND p.stock_type = ?";
    params.push(normalizeStockType(filters.stockType, "COMMON"));
  }

  if (filters.from) {
    sql += " AND m.occurred_at >= ?";
    params.push(filters.from);
  }

  if (filters.to) {
    sql += " AND m.occurred_at <= ?";
    params.push(filters.to);
  }

  if (filters.branchName) {
    sql += " AND lower(coalesce(m.branch_name, '')) = lower(?)";
    params.push(normalizeText(filters.branchName));
  }

  if (filters.fuelKind) {
    sql += ` AND ${buildFuelKindSqlExpression("m", "p")} = ?`;
    params.push(normalizeFuelKind(filters.fuelKind, ""));
  }

  if (filters.document) {
    sql += " AND lower(coalesce(m.document, '')) LIKE ?";
    params.push(buildLikeSearch(filters.document));
  }

  if (filters.supplierName) {
    sql += " AND lower(coalesce(m.supplier_name, '')) LIKE ?";
    params.push(buildLikeSearch(filters.supplierName));
  }

  sql += " ORDER BY m.occurred_at DESC, m.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    productId: Number(row.product_id),
    productName: row.product_name,
    productUnit: row.product_unit,
    productStockType: normalizeStockType(row.product_stock_type, "COMMON"),
    type: row.type,
    quantity: Number(row.quantity || 0),
    balanceAfter: Number(row.balance_after || 0),
    document: row.document || "",
    branchName: row.branch_name || "",
    supplierName: row.supplier_name || "",
    fuelKind: inferFuelKindFromValue(row.fuel_kind || row.product_name, ""),
    unitCost: Number(row.unit_cost || 0),
    totalCost: Number(row.total_cost || 0),
    productDefaultCost: Number(row.product_default_cost || 0),
    sourceType: row.source_type || "",
    sourceId: row.source_id === null || row.source_id === undefined ? null : Number(row.source_id),
    notes: row.notes,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    userName: row.user_name || "",
  }));
}

function queryFuelRecords(filters = {}) {
  let sql = `
    SELECT f.*, u.name AS user_name, v.brand AS vehicle_brand, v.model AS vehicle_model, v.sector AS vehicle_sector
    FROM fuel_records f
    LEFT JOIN users u ON u.id = f.created_by
    LEFT JOIN vehicles v ON v.id = f.vehicle_id
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.storageId) {
    sql += " AND f.storage_id = ?";
    params.push(Number(filters.storageId));
  }

  if (filters.fuelKind) {
    sql += " AND f.fuel_kind = ?";
    params.push(normalizeText(filters.fuelKind).toUpperCase());
  }

  if (filters.from) {
    sql += " AND f.occurred_at >= ?";
    params.push(filters.from);
  }

  if (filters.to) {
    sql += " AND f.occurred_at <= ?";
    params.push(filters.to);
  }

  sql += " ORDER BY f.occurred_at DESC, f.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    storageId: row.storage_id ? Number(row.storage_id) : null,
    storageName: row.storage_name || "",
    fuelKind: row.fuel_kind || "",
    vehicleId: row.vehicle_id ? Number(row.vehicle_id) : null,
    type: row.type,
    plate: row.plate,
    quantity: Number(row.quantity || 0),
    odometerKm: row.odometer_km === null || row.odometer_km === undefined ? null : Number(row.odometer_km),
    balanceBefore: Number(row.balance_before || 0),
    balanceAfter: Number(row.balance_after || 0),
    notes: row.notes,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    userName: row.user_name || "",
    vehicleBrand: row.vehicle_brand || "",
    vehicleModel: row.vehicle_model || "",
    vehicleSector: row.vehicle_sector || "",
  }));
}

function queryFuelStorages() {
  return all(
    `
      SELECT s.*, p.name AS product_name
      FROM fuel_storages s
      LEFT JOIN inventory_products p ON p.id = s.product_id
      WHERE s.active = 1
      ORDER BY s.fuel_kind ASC, s.name ASC
    `
  ).map((row) => ({
    id: Number(row.id),
    name: row.name,
    fuelKind: row.fuel_kind,
    productId: row.product_id ? Number(row.product_id) : null,
    productName: row.product_name || "",
    currentBalance: Number(row.current_balance || 0),
    minBalance: Number(row.min_balance || 0),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function queryFuelOverview() {
  const storages = queryFuelStorages();
  const fuelByKind = storages.reduce((summary, storage) => {
    const current = Number(summary[storage.fuelKind] || 0);
    summary[storage.fuelKind] = current + storage.currentBalance;
    return summary;
  }, {});

  return {
    totalBalance: storages.reduce((total, storage) => total + storage.currentBalance, 0),
    fuelByKind,
    storages,
  };
}

function getFuelStorageByProductId(productId) {
  if (!productId) {
    return null;
  }

  return get(
    `
      SELECT *
      FROM fuel_storages
      WHERE product_id = ? AND active = 1
      ORDER BY id ASC
      LIMIT 1
    `,
    [Number(productId)]
  );
}

function queryFuelAnalytics(filters = {}, fuelOverview = queryFuelOverview()) {
  const selectedPlate = normalizeText(filters.plate).toUpperCase();
  const period = resolveDashboardPeriod(filters);
  const { periodDays, dayRange, startDay, endDay, isCustomRange } = period;
  const availablePlates = all(
    `
      SELECT DISTINCT plate
      FROM fuel_records
      WHERE trim(COALESCE(plate, '')) <> ''
      ORDER BY plate ASC
    `
  ).map((row) => row.plate);
  const severityRank = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  const sortAlerts = (left, right) =>
    (severityRank[left.severity] ?? 9) - (severityRank[right.severity] ?? 9) ||
    String(right.occurredAt || "").localeCompare(String(left.occurredAt || "")) ||
    String(left.plate || "").localeCompare(String(right.plate || ""));

  const consumptionParams = [startDay, endDay];
  const filteredPlateSql = selectedPlate ? " AND plate = ?" : "";
  if (selectedPlate) {
    consumptionParams.push(selectedPlate);
  }

  const consumptionRows = all(
    `
      SELECT
        substr(occurred_at, 1, 10) AS day,
        SUM(CASE WHEN type = 'EXIT' THEN quantity ELSE 0 END) AS total_exit,
        SUM(CASE WHEN type = 'EXIT' AND fuel_kind = 'S500' THEN quantity ELSE 0 END) AS s500_exit,
        SUM(CASE WHEN type = 'EXIT' AND fuel_kind = 'S10' THEN quantity ELSE 0 END) AS s10_exit
      FROM fuel_records
      WHERE substr(occurred_at, 1, 10) >= ?
        AND substr(occurred_at, 1, 10) <= ?
        ${filteredPlateSql}
      GROUP BY day
      ORDER BY day ASC
    `,
    consumptionParams
  );

  const consumptionMap = new Map(
    consumptionRows.map((row) => [
      row.day,
      {
        total: Number(row.total_exit || 0),
        s500: Number(row.s500_exit || 0),
        s10: Number(row.s10_exit || 0),
      },
    ])
  );

  const consumptionSeries = dayRange.map((day) => {
    const snapshot = consumptionMap.get(day) || { total: 0, s500: 0, s10: 0 };
    return {
      date: day,
      total: snapshot.total,
      s500: snapshot.s500,
      s10: snapshot.s10,
    };
  });

  const totalConsumptionLiters = consumptionSeries.reduce((total, item) => total + item.total, 0);
  const peakConsumption = consumptionSeries.reduce(
    (highest, item) => (item.total > highest.total ? item : highest),
    { date: startDay, total: 0, s500: 0, s10: 0 }
  );

  const topConsumers = all(
    `
      SELECT
        plate,
        SUM(quantity) AS total_liters,
        COUNT(*) AS records,
        MAX(occurred_at) AS last_at
      FROM fuel_records
      WHERE type = 'EXIT'
        AND trim(COALESCE(plate, '')) <> ''
        AND substr(occurred_at, 1, 10) >= ?
        AND substr(occurred_at, 1, 10) <= ?
        ${filteredPlateSql}
      GROUP BY plate
      ORDER BY total_liters DESC, plate ASC
      LIMIT 5
    `,
    consumptionParams
  ).map((row) => ({
    plate: row.plate,
    totalLiters: Number(row.total_liters || 0),
    records: Number(row.records || 0),
    lastAt: row.last_at,
  }));

  const coverage = get(
    `
      SELECT
        COUNT(*) AS total_records,
        SUM(CASE WHEN odometer_km IS NOT NULL THEN 1 ELSE 0 END) AS with_odometer
      FROM fuel_records
      WHERE type = 'EXIT'
        AND substr(occurred_at, 1, 10) >= ?
        AND substr(occurred_at, 1, 10) <= ?
        ${filteredPlateSql}
    `,
    consumptionParams
  );

  const odometerRows = all(
    `
      SELECT plate, quantity, odometer_km, fuel_kind, occurred_at
      FROM fuel_records
      WHERE type = 'EXIT'
        AND trim(COALESCE(plate, '')) <> ''
        AND odometer_km IS NOT NULL
        ${selectedPlate ? "AND plate = ?" : ""}
      ORDER BY plate ASC, occurred_at ASC, id ASC
    `,
    selectedPlate ? [selectedPlate] : []
  );

  const previousByPlate = new Map();
  const efficiencyByPlate = new Map();
  const odometerIssues = [];
  const outlierSegments = [];

  for (const row of odometerRows) {
    const plate = normalizeText(row.plate).toUpperCase();
    const odometerKm = Number(row.odometer_km || 0);
    const quantity = Number(row.quantity || 0);
    const occurredAt = row.occurred_at;
    const occurredDay = String(occurredAt || "").slice(0, 10);
    const previous = previousByPlate.get(plate);

    if (
      previous &&
      occurredDay >= startDay &&
      occurredDay <= endDay
    ) {
      if (odometerKm <= previous.odometerKm) {
        odometerIssues.push({
          type: "KM_ERROR",
          severity: "CRITICAL",
          plate,
          occurredAt,
          currentOdometerKm: odometerKm,
          previousOdometerKm: previous.odometerKm,
          title: `KM inconsistente: ${plate}`,
          description: `Leitura atual ${odometerKm} km menor ou igual a anterior ${previous.odometerKm} km.`,
        });
      } else if (quantity > 0) {
        const distanceKm = odometerKm - previous.odometerKm;
        const kmPerLiter = distanceKm / quantity;
        const currentStats = efficiencyByPlate.get(plate) || {
          plate,
          totalDistanceKm: 0,
          totalLiters: 0,
          samples: 0,
          lastOdometerKm: 0,
          lastFuelAt: "",
          lastFuelKind: "",
          lastFuelQuantity: 0,
          segments: [],
        };

        currentStats.totalDistanceKm += distanceKm;
        currentStats.totalLiters += quantity;
        currentStats.samples += 1;
        currentStats.lastOdometerKm = odometerKm;
        currentStats.lastFuelAt = occurredAt;
        currentStats.lastFuelKind = row.fuel_kind || "";
        currentStats.lastFuelQuantity = quantity;
        currentStats.segments.push({
          date: occurredDay,
          distanceKm,
          liters: quantity,
          kmPerLiter,
        });
        efficiencyByPlate.set(plate, currentStats);

        if (kmPerLiter <= 2.5 || kmPerLiter >= 8) {
          const severity = kmPerLiter <= 2.5 ? "CRITICAL" : "WARNING";
          outlierSegments.push({
            type: "OUTLIER_CONSUMPTION",
            severity,
            plate,
            occurredAt,
            distanceKm,
            liters: quantity,
            kmPerLiter,
            title:
              severity === "CRITICAL"
                ? `Consumo fora do padrao: ${plate}`
                : `Media acima do padrao: ${plate}`,
            description: `${distanceKm} km com ${quantity.toFixed(2)} L (${kmPerLiter.toFixed(2)} km/L).`,
          });
        }
      }
    }

    previousByPlate.set(plate, {
      odometerKm,
      occurredAt,
    });
  }

  const efficiencyRanking = Array.from(efficiencyByPlate.values())
    .map((item) => ({
      plate: item.plate,
      totalDistanceKm: item.totalDistanceKm,
      totalLiters: item.totalLiters,
      samples: item.samples,
      kmPerLiter: item.totalLiters > 0 ? item.totalDistanceKm / item.totalLiters : 0,
      lastOdometerKm: item.lastOdometerKm,
      lastFuelAt: item.lastFuelAt,
      lastFuelKind: item.lastFuelKind,
      lastFuelQuantity: item.lastFuelQuantity,
      segments: item.segments.slice(-8),
    }))
    .sort((left, right) => right.kmPerLiter - left.kmPerLiter || left.plate.localeCompare(right.plate));
  const efficiencySummary = efficiencyRanking.reduce(
    (summary, item) => {
      summary.totalDistanceKm += Number(item.totalDistanceKm || 0);
      summary.totalLiters += Number(item.totalLiters || 0);
      return summary;
    },
    { totalDistanceKm: 0, totalLiters: 0 }
  );
  efficiencySummary.vehicleCount = efficiencyRanking.length;
  efficiencySummary.averageKmPerLiter =
    efficiencySummary.totalLiters > 0
      ? efficiencySummary.totalDistanceKm / efficiencySummary.totalLiters
      : 0;

  let selectedVehicle =
    (selectedPlate && efficiencyRanking.find((item) => item.plate === selectedPlate)) ||
    efficiencyRanking[0] ||
    null;

  if (!selectedVehicle && selectedPlate) {
    const latestRecord = get(
      `
        SELECT plate, odometer_km, quantity, fuel_kind, occurred_at
        FROM fuel_records
        WHERE type = 'EXIT'
          AND plate = ?
          AND substr(occurred_at, 1, 10) >= ?
          AND substr(occurred_at, 1, 10) <= ?
        ORDER BY occurred_at DESC, id DESC
        LIMIT 1
      `,
      [selectedPlate, startDay, endDay]
    );

    if (latestRecord) {
      selectedVehicle = {
        plate: selectedPlate,
        totalDistanceKm: 0,
        totalLiters: Number(latestRecord.quantity || 0),
        samples: 0,
        kmPerLiter: 0,
        lastOdometerKm:
          latestRecord.odometer_km === null || latestRecord.odometer_km === undefined
            ? 0
            : Number(latestRecord.odometer_km),
        lastFuelAt: latestRecord.occurred_at,
        lastFuelKind: latestRecord.fuel_kind || "",
        lastFuelQuantity: Number(latestRecord.quantity || 0),
        segments: [],
      };
    }
  }

  const noteStatuses = all(
    `
      SELECT status, COUNT(*) AS total
      FROM notes
      GROUP BY status
      ORDER BY total DESC, status ASC
    `
  ).map((row) => ({
    status: row.status,
    total: Number(row.total || 0),
  }));

  const recentFuelRecords = all(
    `
      SELECT plate, quantity, fuel_kind, storage_name, occurred_at, odometer_km
      FROM fuel_records
      WHERE type = 'EXIT'
        AND trim(COALESCE(plate, '')) <> ''
        AND substr(occurred_at, 1, 10) >= ?
        AND substr(occurred_at, 1, 10) <= ?
        ${filteredPlateSql}
      ORDER BY occurred_at DESC, id DESC
      LIMIT 8
    `,
    consumptionParams
  ).map((row) => ({
    plate: row.plate,
    quantity: Number(row.quantity || 0),
    fuelKind: row.fuel_kind || "",
    storageName: row.storage_name || "",
    occurredAt: row.occurred_at,
    odometerKm: row.odometer_km === null || row.odometer_km === undefined ? null : Number(row.odometer_km),
  }));

  const totalMinimumBalance = fuelOverview.storages.reduce(
    (total, storage) => total + Number(storage.minBalance || 0),
    0
  );
  const lowStorageCount = fuelOverview.storages.filter(
      (storage) =>
        Number(storage.minBalance || 0) > 0 &&
        Number(storage.currentBalance || 0) <= Number(storage.minBalance || 0)
  ).length;
  const missingOdometerRecords = all(
    `
      SELECT plate, quantity, fuel_kind, storage_name, occurred_at
      FROM fuel_records
      WHERE type = 'EXIT'
        AND (odometer_km IS NULL)
        AND substr(occurred_at, 1, 10) >= ?
        AND substr(occurred_at, 1, 10) <= ?
        ${filteredPlateSql}
      ORDER BY occurred_at DESC, id DESC
      LIMIT 6
    `,
    consumptionParams
  ).map((row) => ({
    plate: row.plate || "-",
    quantity: Number(row.quantity || 0),
    fuelKind: row.fuel_kind || "",
    storageName: row.storage_name || "",
    occurredAt: row.occurred_at,
    type: "MISSING_ODOMETER",
    severity: "WARNING",
    title: `KM ausente: ${row.plate || "Sem placa"}`,
    description: `Abastecimento de ${Number(row.quantity || 0).toFixed(2)} L sem hodometro registrado.`,
  }));
  const operationalAlerts = [...odometerIssues, ...outlierSegments, ...missingOdometerRecords].sort(sortAlerts);
  const alertSummary = {
    total: operationalAlerts.length,
    critical: operationalAlerts.filter((item) => item.severity === "CRITICAL").length,
    kmErrors: odometerIssues.length,
    outliers: outlierSegments.length,
    missingOdometer: missingOdometerRecords.length,
  };

  return {
    periodDays,
    periodStart: startDay,
    periodEnd: endDay,
    isCustomRange,
    selectedPlate,
    availablePlates,
    consumptionSeries,
    totalConsumptionLiters,
    averageDailyConsumption: periodDays ? totalConsumptionLiters / periodDays : 0,
    peakConsumption,
    efficiencyRanking,
    efficiencySummary,
    selectedVehicle,
    topConsumers,
    recentFuelRecords,
    noteStatuses,
    fuelMix: [
      {
        fuelKind: "S500",
        total: consumptionSeries.reduce((total, item) => total + item.s500, 0),
      },
      {
        fuelKind: "S10",
        total: consumptionSeries.reduce((total, item) => total + item.s10, 0),
      },
    ],
    operationalAlerts,
    alertSummary,
    odometerCoverage: {
      totalRecords: Number(coverage?.total_records || 0),
      withOdometer: Number(coverage?.with_odometer || 0),
      percent:
        Number(coverage?.total_records || 0) > 0
          ? (Number(coverage?.with_odometer || 0) / Number(coverage?.total_records || 0)) * 100
          : 0,
    },
    stockHealth: {
      totalBalance: Number(fuelOverview.totalBalance || 0),
      totalMinimumBalance,
      lowStorageCount,
      storageCount: fuelOverview.storages.length,
      percent:
        totalMinimumBalance > 0
          ? Math.min((Number(fuelOverview.totalBalance || 0) / totalMinimumBalance) * 100, 999)
          : 100,
    },
  };
}

function mapScheduleEntryRow(row) {
  return {
    id: Number(row.id),
    scheduleDayId: Number(row.schedule_day_id),
    lineOrder: Number(row.line_order || 0),
    scheduledDate: row.scheduled_date,
    vehicle: row.vehicle,
    location: row.location || "",
    driver: row.driver,
    assistant: row.assistant || "",
    departureTime: row.departure_time || "",
    notes: row.notes || "",
    responsibleName: row.responsible_name || "",
    documentTitle: row.document_title || DEFAULT_SCHEDULE_DOCUMENT_TITLE,
    dayNotes: row.general_notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.created_by_name || "",
  };
}

function buildScheduleDayFromRow(dayRow, entries = []) {
  const normalizedEntries = entries
    .map((entry) =>
      mapScheduleEntryRow({
        ...entry,
        scheduled_date: dayRow.scheduled_date,
        document_title: dayRow.document_title,
        responsible_name: dayRow.responsible_name,
        general_notes: dayRow.general_notes,
        created_by_name: dayRow.updated_by_name || dayRow.created_by_name,
      })
    )
    .sort((left, right) => (left.lineOrder || 0) - (right.lineOrder || 0) || left.id - right.id);
  const uniqueVehicles = new Set(normalizedEntries.map((item) => item.vehicle).filter(Boolean));
  const uniqueDrivers = new Set(normalizedEntries.map((item) => item.driver).filter(Boolean));
  const assistants = normalizedEntries.filter((item) => item.assistant).length;

  return {
    id: Number(dayRow.id),
    scheduledDate: dayRow.scheduled_date,
    documentTitle: dayRow.document_title || DEFAULT_SCHEDULE_DOCUMENT_TITLE,
    responsibleName: dayRow.responsible_name || "",
    generalNotes: dayRow.general_notes || "",
    createdAt: dayRow.created_at,
    updatedAt: dayRow.updated_at,
    createdByName: dayRow.created_by_name || "",
    updatedByName: dayRow.updated_by_name || dayRow.created_by_name || "",
    entries: normalizedEntries,
    totals: {
      lines: normalizedEntries.length,
      vehicles: uniqueVehicles.size,
      drivers: uniqueDrivers.size,
      assistants,
    },
    preview: {
      vehicles: Array.from(uniqueVehicles).slice(0, 4),
      drivers: Array.from(uniqueDrivers).slice(0, 3),
    },
  };
}

function queryScheduleEntries(filters = {}) {
  let sql = `
    SELECT
      e.*,
      d.scheduled_date,
      d.document_title,
      d.responsible_name,
      d.general_notes,
      u.name AS created_by_name
    FROM schedule_entries e
    JOIN schedule_days d ON d.id = e.schedule_day_id
    LEFT JOIN users u ON u.id = e.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.scheduleDayId) {
    sql += " AND e.schedule_day_id = ?";
    params.push(Number(filters.scheduleDayId));
  }

  if (filters.date) {
    sql += " AND d.scheduled_date = ?";
    params.push(normalizeText(filters.date));
  }

  if (filters.vehicle) {
    sql += " AND replace(replace(upper(e.vehicle), '-', ''), ' ', '') = ?";
    params.push(normalizePlateKey(filters.vehicle));
  }

  if (filters.driver) {
    sql += " AND lower(coalesce(e.driver, '')) LIKE ?";
    params.push(buildLikeSearch(filters.driver));
  }

  sql += " ORDER BY d.scheduled_date DESC, e.line_order ASC, e.id ASC";

  return all(sql, params).map(mapScheduleEntryRow);
}

function queryScheduleDayRow(whereSql, params = []) {
  return get(
    `
      SELECT
        d.*,
        created_user.name AS created_by_name,
        updated_user.name AS updated_by_name
      FROM schedule_days d
      LEFT JOIN users created_user ON created_user.id = d.created_by
      LEFT JOIN users updated_user ON updated_user.id = d.updated_by
      WHERE ${whereSql}
      LIMIT 1
    `,
    params
  );
}

function queryScheduleDayById(id) {
  const dayRow = queryScheduleDayRow("d.id = ?", [Number(id)]);
  if (!dayRow) {
    return null;
  }

  const entries = all("SELECT * FROM schedule_entries WHERE schedule_day_id = ? ORDER BY line_order ASC, id ASC", [
    Number(dayRow.id),
  ]);
  return buildScheduleDayFromRow(dayRow, entries);
}

function queryScheduleDayByDate(date) {
  const normalizedDate = normalizeText(date);
  if (!normalizedDate) {
    return null;
  }

  const dayRow = queryScheduleDayRow("d.scheduled_date = ?", [normalizedDate]);
  if (!dayRow) {
    return null;
  }

  const entries = all("SELECT * FROM schedule_entries WHERE schedule_day_id = ? ORDER BY line_order ASC, id ASC", [
    Number(dayRow.id),
  ]);
  return buildScheduleDayFromRow(dayRow, entries);
}

function queryScheduleHistory(filters = {}) {
  let sql = `
    SELECT
      d.*,
      created_user.name AS created_by_name,
      updated_user.name AS updated_by_name
    FROM schedule_days d
    LEFT JOIN users created_user ON created_user.id = d.created_by
    LEFT JOIN users updated_user ON updated_user.id = d.updated_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.date) {
    sql += " AND d.scheduled_date = ?";
    params.push(normalizeText(filters.date));
  }

  if (filters.from) {
    sql += " AND d.scheduled_date >= ?";
    params.push(normalizeText(filters.from));
  }

  if (filters.to) {
    sql += " AND d.scheduled_date <= ?";
    params.push(normalizeText(filters.to));
  }

  if (filters.vehicle) {
    sql += `
      AND EXISTS (
        SELECT 1
        FROM schedule_entries entry_vehicle
        WHERE entry_vehicle.schedule_day_id = d.id
          AND replace(replace(upper(entry_vehicle.vehicle), '-', ''), ' ', '') = ?
      )
    `;
    params.push(normalizePlateKey(filters.vehicle));
  }

  if (filters.driver) {
    sql += `
      AND EXISTS (
        SELECT 1
        FROM schedule_entries entry_driver
        WHERE entry_driver.schedule_day_id = d.id
          AND lower(coalesce(entry_driver.driver, '')) LIKE ?
      )
    `;
    params.push(buildLikeSearch(filters.driver));
  }

  sql += " ORDER BY d.scheduled_date DESC, d.updated_at DESC LIMIT 120";

  const dayRows = all(sql, params);
  if (!dayRows.length) {
    return [];
  }

  const dayIds = dayRows.map((row) => Number(row.id));
  const placeholders = dayIds.map(() => "?").join(", ");
  const entryRows = all(
    `
      SELECT *
      FROM schedule_entries
      WHERE schedule_day_id IN (${placeholders})
      ORDER BY line_order ASC, id ASC
    `,
    dayIds
  );

  const entriesByDayId = entryRows.reduce((result, row) => {
    const dayId = Number(row.schedule_day_id);
    if (!result.has(dayId)) {
      result.set(dayId, []);
    }
    result.get(dayId).push(row);
    return result;
  }, new Map());

  return dayRows.map((dayRow) => buildScheduleDayFromRow(dayRow, entriesByDayId.get(Number(dayRow.id)) || []));
}

function dedupeScheduleOptions(values = []) {
  const optionMap = new Map();
  values.forEach((item) => {
    const label = normalizeScheduleLabel(item);
    const key = normalizeKey(label);
    if (!label || !key || optionMap.has(key)) {
      return;
    }
    optionMap.set(key, label);
  });
  return Array.from(optionMap.values()).sort((left, right) => left.localeCompare(right, "pt-BR"));
}

function queryScheduleSuggestions() {
  const rows = all(
    `
      SELECT vehicle, driver, assistant, location
      FROM schedule_entries
      ORDER BY updated_at DESC, id DESC
      LIMIT 500
    `
  );
  const vehicleSuggestions = queryVehicles({ activeOnly: true }).map((vehicle) => vehicle.plate);

  return {
    vehicles: dedupeScheduleOptions([
      ...vehicleSuggestions,
      ...rows.map((row) => row.vehicle),
    ]),
    drivers: dedupeScheduleOptions(rows.map((row) => row.driver)),
    assistants: dedupeScheduleOptions(rows.map((row) => row.assistant)),
    locations: dedupeScheduleOptions(rows.map((row) => row.location)),
    documentTitles: dedupeScheduleOptions(SCHEDULE_DOCUMENT_TITLE_OPTIONS),
  };
}

function resolveCanonicalScheduleLabel(value, suggestions = []) {
  const normalized = normalizeScheduleLabel(value);
  const normalizedKey = normalizeKey(normalized);
  if (!normalized || !normalizedKey) {
    return "";
  }

  const match = suggestions.find((item) => normalizeKey(item) === normalizedKey);
  return match || normalized;
}

function resolveCanonicalScheduleVehicle(value) {
  const normalizedKey = normalizePlateKey(value);
  if (!normalizedKey) {
    return "";
  }

  const vehicleMatch = queryVehicles({}).find((item) => normalizePlateKey(item.plate) === normalizedKey);
  return vehicleMatch ? vehicleMatch.plate : formatSchedulePlate(normalizedKey);
}

function buildScheduleDayPayload(payload, currentUser, existingDay = null) {
  const suggestions = queryScheduleSuggestions();
  const scheduledDate = normalizeText(payload.scheduledDate || existingDay?.scheduled_date);
  const documentTitle = normalizeScheduleDocumentTitle(payload.documentTitle || existingDay?.document_title);
  const responsibleName = resolveCanonicalScheduleLabel(
    payload.responsibleName || existingDay?.responsible_name || currentUser?.name || "",
    [currentUser?.name || "", ...suggestions.drivers]
  );
  const generalNotes = normalizeScheduleLabel(payload.generalNotes || payload.notes || existingDay?.general_notes);
  const rawEntries = Array.isArray(payload.entries)
    ? payload.entries
    : payload.vehicle || payload.driver || payload.location || payload.assistant || payload.notes
      ? [payload]
      : [];

  if (!scheduledDate) {
    throw new Error("A data da escala e obrigatoria.");
  }

  const entries = rawEntries
    .map((entry, index) => ({
      lineOrder: index + 1,
      vehicle: resolveCanonicalScheduleVehicle(entry?.vehicle),
      location: resolveCanonicalScheduleLabel(entry?.location, suggestions.locations),
      driver: resolveCanonicalScheduleLabel(entry?.driver, [currentUser?.name || "", ...suggestions.drivers]),
      assistant: resolveCanonicalScheduleLabel(entry?.assistant, suggestions.assistants),
      departureTime: normalizeScheduleTime(entry?.departureTime || entry?.time),
      notes: normalizeScheduleLabel(entry?.notes),
    }))
    .filter((entry) => Object.values(entry).some((value) => String(value ?? "").trim() !== ""));

  if (!entries.length) {
    throw new Error("Adicione ao menos uma linha operacional para salvar a escala.");
  }

  entries.forEach((entry, index) => {
    if (!entry.vehicle) {
      throw new Error(`Informe a placa na linha ${index + 1}.`);
    }

    if (!entry.driver) {
      throw new Error(`Informe o motorista na linha ${index + 1}.`);
    }
  });

  return {
    scheduledDate,
    documentTitle,
    responsibleName,
    generalNotes,
    entries,
  };
}

function saveScheduleDay(payload, currentUser, existingDay = null) {
  const normalized = buildScheduleDayPayload(payload, currentUser, existingDay);
  const timestamp = nowIso();
  let scheduleDayId = existingDay ? Number(existingDay.id) : 0;

  transaction(() => {
    if (!existingDay) {
      scheduleDayId = insert(
        `
          INSERT INTO schedule_days (
            scheduled_date, document_title, responsible_name, general_notes, created_by, updated_by, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          normalized.scheduledDate,
          normalized.documentTitle,
          normalized.responsibleName,
          normalized.generalNotes,
          currentUser.id,
          currentUser.id,
          timestamp,
          timestamp,
        ]
      );
    } else {
      write(
        `
          UPDATE schedule_days
          SET scheduled_date = ?, document_title = ?, responsible_name = ?, general_notes = ?, updated_by = ?, updated_at = ?
          WHERE id = ?
        `,
        [
          normalized.scheduledDate,
          normalized.documentTitle,
          normalized.responsibleName,
          normalized.generalNotes,
          currentUser.id,
          timestamp,
          scheduleDayId,
        ]
      );
      write("DELETE FROM schedule_entries WHERE schedule_day_id = ?", [scheduleDayId]);
    }

    normalized.entries.forEach((entry) => {
      insert(
        `
          INSERT INTO schedule_entries (
            schedule_day_id, line_order, vehicle, location, driver, assistant, departure_time, notes, created_by, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          scheduleDayId,
          entry.lineOrder,
          entry.vehicle,
          entry.location,
          entry.driver,
          entry.assistant,
          entry.departureTime,
          entry.notes,
          currentUser.id,
          timestamp,
          timestamp,
        ]
      );
    });
  });

  return queryScheduleDayById(scheduleDayId);
}

function querySchedules(date) {
  return queryScheduleEntries(date ? { date } : {});
}

function queryFines() {
  return all(
    `
      SELECT f.*, u.name AS user_name
      FROM fines f
      LEFT JOIN users u ON u.id = f.created_by
      ORDER BY f.fine_date DESC, f.id DESC
    `
  ).map((row) => ({
    id: Number(row.id),
    fineDate: row.fine_date,
    plate: row.plate,
    driver: row.driver,
    status: row.status,
    amount: Number(row.amount || 0),
    notes: row.notes,
    documentName: row.document_name || "",
    documentUrl: row.document_url || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name || "",
  }));
}

function queryChecklists() {
  return all(
    `
      SELECT c.*, u.name AS user_name
      FROM checklists c
      LEFT JOIN users u ON u.id = c.created_by
      ORDER BY c.checklist_date DESC, c.id DESC
    `
  ).map((row) => {
    const parsed = parseChecklistStorage(row.items_json);
    const summary = parsed.itemsDetailed.reduce(
      (totals, item) => {
        if (item.status === "CRITICAL") totals.critical += 1;
        else if (item.status === "ATTENTION") totals.attention += 1;
        else totals.ok += 1;
        return totals;
      },
      { ok: 0, attention: 0, critical: 0 }
    );

    return {
      id: Number(row.id),
      vehicle: row.vehicle,
      checklistDate: row.checklist_date,
      checklistType: normalizeText(parsed.meta.checklistType || "PRE_USE") || "PRE_USE",
      driverName: normalizeText(parsed.meta.driverName),
      odometerKm:
        parsed.meta.odometerKm === null || parsed.meta.odometerKm === undefined
          ? null
          : Number(parsed.meta.odometerKm),
      signatureName: normalizeText(parsed.meta.signatureName),
      temporaryIssue: normalizeText(parsed.meta.temporaryIssue),
      items: parsed.itemsDetailed.map((item) => item.label),
      itemsDetailed: parsed.itemsDetailed,
      itemSummary: summary,
      problems: row.problems,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userName: row.user_name || "",
    };
  });
}

function toNullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMaintenanceType(value, fallback = "PREVENTIVE") {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  if (normalized.includes("oleo") || normalized.includes("oil")) {
    return "OIL_CHANGE";
  }
  if (normalized.includes("prevent")) {
    return "PREVENTIVE";
  }
  return normalized.toUpperCase();
}

function normalizeTireType(value, fallback = "NEW") {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  if (normalized.includes("recap")) {
    return "RECAP";
  }
  return "NEW";
}

function normalizeTireStatus(value, fallback = "OK") {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  if (normalized.includes("descart")) {
    return "DISCARDED";
  }
  if (normalized.includes("troca") || normalized.includes("replace")) {
    return "REPLACE_RECOMMENDED";
  }
  if (normalized.includes("atenc")) {
    return "ATTENTION";
  }
  return "OK";
}

function normalizeTireLocationStatus(value, fallback = "INSTALLED") {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  if (normalized.includes("stock") || normalized.includes("estoque")) {
    return "STOCK";
  }
  if (normalized.includes("remov") || normalized.includes("retir")) {
    return "REMOVED";
  }
  if (normalized.includes("descart")) {
    return "DISCARDED";
  }
  return "INSTALLED";
}

function normalizeTireEventType(value, fallback = "INSTALL") {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  if (normalized.includes("rod")) {
    return "ROTATION";
  }
  if (normalized.includes("remov")) {
    return "REMOVE";
  }
  if (normalized.includes("stock") || normalized.includes("estoque")) {
    return "STOCK_LINK";
  }
  return "INSTALL";
}

function buildDossierSortAt(value, fallbackTime = "12:00:00") {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? `${normalized}T${fallbackTime}` : normalized;
}

function compareDossierEventsDesc(left, right) {
  return String(right.sortAt || "").localeCompare(String(left.sortAt || "")) || Number(right.id || 0) - Number(left.id || 0);
}

function calculateMedian(values = []) {
  const numeric = values
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .sort((left, right) => left - right);

  if (!numeric.length) {
    return 0;
  }

  const middle = Math.floor(numeric.length / 2);
  if (numeric.length % 2 === 0) {
    return (numeric[middle - 1] + numeric[middle]) / 2;
  }
  return numeric[middle];
}

function queryVehicleMaintenanceRecords(filters = {}) {
  let sql = `
    SELECT m.*, u.name AS user_name
    FROM vehicle_maintenance_records m
    LEFT JOIN users u ON u.id = m.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.vehicleId) {
    sql += " AND m.vehicle_id = ?";
    params.push(Number(filters.vehicleId));
  }

  if (filters.plate) {
    sql += " AND replace(replace(upper(coalesce(m.plate, '')), '-', ''), ' ', '') = ?";
    params.push(normalizePlateKey(filters.plate));
  }

  sql += " ORDER BY m.performed_at DESC, m.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    vehicleId: toNullableNumber(row.vehicle_id),
    plate: row.plate || "",
    maintenanceType: normalizeMaintenanceType(row.maintenance_type, "PREVENTIVE"),
    title: row.title || "",
    performedAt: row.performed_at,
    odometerKm: toNullableNumber(row.odometer_km),
    intervalKm: toNullableNumber(row.interval_km),
    nextDueKm: toNullableNumber(row.next_due_km),
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name || "",
  }));
}

function queryVehicleTires(filters = {}) {
  let sql = `
    SELECT t.*, u.name AS user_name
    FROM vehicle_tires t
    LEFT JOIN users u ON u.id = t.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.vehicleId) {
    sql += " AND t.vehicle_id = ?";
    params.push(Number(filters.vehicleId));
  }

  if (filters.plate) {
    sql += " AND replace(replace(upper(coalesce(t.plate, '')), '-', ''), ' ', '') = ?";
    params.push(normalizePlateKey(filters.plate));
  }

  sql += " ORDER BY t.updated_at DESC, t.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    vehicleId: toNullableNumber(row.vehicle_id),
    plate: row.plate || "",
    code: row.tire_code,
    tireType: normalizeTireType(row.tire_type, "NEW"),
    position: row.position || "",
    installedAt: row.installed_at || "",
    installedKm: toNullableNumber(row.installed_km),
    removedAt: row.removed_at || "",
    removedKm: toNullableNumber(row.removed_km),
    estimatedLifeKm: toNullableNumber(row.estimated_life_km),
    locationStatus: normalizeTireLocationStatus(row.location_status, "INSTALLED"),
    status: normalizeTireStatus(row.status, "OK"),
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name || "",
  }));
}

function queryVehicleTireEvents(filters = {}) {
  let sql = `
    SELECT e.*, t.tire_code, u.name AS user_name
    FROM vehicle_tire_events e
    JOIN vehicle_tires t ON t.id = e.tire_id
    LEFT JOIN users u ON u.id = e.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.vehicleId) {
    sql += " AND e.vehicle_id = ?";
    params.push(Number(filters.vehicleId));
  }

  if (filters.plate) {
    sql += " AND replace(replace(upper(coalesce(e.plate, '')), '-', ''), ' ', '') = ?";
    params.push(normalizePlateKey(filters.plate));
  }

  sql += " ORDER BY e.occurred_at DESC, e.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    tireId: Number(row.tire_id),
    vehicleId: toNullableNumber(row.vehicle_id),
    plate: row.plate || "",
    tireCode: row.tire_code || "",
    eventType: normalizeTireEventType(row.event_type, "INSTALL"),
    positionFrom: row.position_from || "",
    positionTo: row.position_to || "",
    odometerKm: toNullableNumber(row.odometer_km),
    occurredAt: row.occurred_at,
    notes: row.notes || "",
    createdAt: row.created_at,
    userName: row.user_name || "",
  }));
}

function queryVehicleOdometerCorrections(filters = {}) {
  let sql = `
    SELECT c.*, u.name AS user_name
    FROM vehicle_odometer_corrections c
    LEFT JOIN users u ON u.id = c.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (filters.vehicleId) {
    sql += " AND c.vehicle_id = ?";
    params.push(Number(filters.vehicleId));
  }

  if (filters.plate) {
    sql += " AND replace(replace(upper(coalesce(c.plate, '')), '-', ''), ' ', '') = ?";
    params.push(normalizePlateKey(filters.plate));
  }

  if (filters.sourceType) {
    sql += " AND upper(coalesce(c.source_type, '')) = ?";
    params.push(normalizeText(filters.sourceType).toUpperCase());
  }

  sql += " ORDER BY c.created_at DESC, c.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    vehicleId: toNullableNumber(row.vehicle_id),
    plate: row.plate || "",
    sourceType: normalizeText(row.source_type).toUpperCase() || "FUEL",
    sourceId: toNullableNumber(row.source_id),
    originalKm: Number(row.original_km || 0),
    correctedKm: Number(row.corrected_km || 0),
    reason: row.reason || "",
    createdAt: row.created_at,
    userName: row.user_name || "",
  }));
}

function buildCorrectedFuelHistory(records = [], corrections = []) {
  const correctionByRecordId = corrections.reduce((result, item) => {
    if (item.sourceType === "FUEL" && item.sourceId) {
      result.set(Number(item.sourceId), item);
    }
    return result;
  }, new Map());

  const chronological = records
    .slice()
    .sort(
      (left, right) =>
        String(left.occurredAt || "").localeCompare(String(right.occurredAt || "")) || Number(left.id) - Number(right.id)
    )
    .map((record) => {
      const correction = correctionByRecordId.get(Number(record.id)) || null;
      return {
        ...record,
        originalKm: record.odometerKm,
        correctedKm: correction ? correction.correctedKm : null,
        effectiveKm: correction ? correction.correctedKm : record.odometerKm,
        correction,
        distanceKm: null,
        averageKmPerLiter: null,
        kmInconsistent: false,
        averageOutOfPattern: false,
      };
    });

  let referenceKm = null;
  let totalDistanceKm = 0;
  let totalLiters = 0;

  chronological.forEach((record) => {
    if (record.effectiveKm === null || record.effectiveKm === undefined) {
      return;
    }

    if (referenceKm === null) {
      referenceKm = record.effectiveKm;
      return;
    }

    const distanceKm = Number(record.effectiveKm) - Number(referenceKm);
    if (distanceKm <= 0) {
      record.kmInconsistent = true;
      return;
    }

    record.distanceKm = distanceKm;
    if (Number(record.quantity || 0) > 0) {
      record.averageKmPerLiter = distanceKm / Number(record.quantity || 0);
      totalDistanceKm += distanceKm;
      totalLiters += Number(record.quantity || 0);
    }
    referenceKm = record.effectiveKm;
  });

  const baselineAverage = calculateMedian(
    chronological.map((item) => item.averageKmPerLiter).filter((item) => Number.isFinite(item) && item > 0)
  );

  chronological.forEach((record) => {
    if (!Number.isFinite(record.averageKmPerLiter) || Number(record.averageKmPerLiter) <= 0) {
      return;
    }

    record.averageOutOfPattern =
      baselineAverage > 0
        ? record.averageKmPerLiter < baselineAverage * 0.65 || record.averageKmPerLiter > baselineAverage * 1.45
        : record.averageKmPerLiter < 1.5 || record.averageKmPerLiter > 6.5;
  });

  const recordsDesc = chronological
    .slice()
    .sort(
      (left, right) =>
        String(right.occurredAt || "").localeCompare(String(left.occurredAt || "")) || Number(right.id) - Number(left.id)
    );

  return {
    recordsDesc,
    totalDistanceKm,
    totalLiters,
    averageKmPerLiter: totalLiters > 0 ? totalDistanceKm / totalLiters : 0,
    inconsistentCount: recordsDesc.filter((item) => item.kmInconsistent).length,
    outlierCount: recordsDesc.filter((item) => item.averageOutOfPattern).length,
  };
}

function buildMaintenanceDueStatus(record, currentKm) {
  const dueKm =
    record.nextDueKm !== null && record.nextDueKm !== undefined
      ? Number(record.nextDueKm)
      : record.intervalKm !== null && record.intervalKm !== undefined && record.odometerKm !== null && record.odometerKm !== undefined
        ? Number(record.odometerKm) + Number(record.intervalKm)
        : null;

  if (dueKm === null || currentKm === null || currentKm === undefined) {
    return {
      dueKm,
      remainingKm: null,
      status: "ATTENTION",
    };
  }

  const remainingKm = dueKm - Number(currentKm);
  const thresholdKm = Math.max(Math.round(Number(record.intervalKm || 0) * 0.15), 1000);

  if (remainingKm < 0) {
    return { dueKm, remainingKm, status: "OVERDUE" };
  }

  if (remainingKm <= thresholdKm) {
    return { dueKm, remainingKm, status: "ATTENTION" };
  }

  return { dueKm, remainingKm, status: "OK" };
}

function queryVehicleDossierByPlate(plate, options = {}) {
  const normalizedPlate = normalizePlate(plate);
  const plateKey = normalizePlateKey(normalizedPlate);
  if (!plateKey) {
    throw new Error("A placa do veiculo e obrigatoria.");
  }

  const vehicle = queryVehicles({}).find((item) => normalizePlateKey(item.plate) === plateKey);
  if (!vehicle) {
    return null;
  }

  const periodDays = Math.min(Math.max(Number(options.periodDays || 90), 7), 365);
  const periodEnd = todayDate();
  const periodStartDate = new Date(`${periodEnd}T12:00:00`);
  periodStartDate.setDate(periodStartDate.getDate() - (periodDays - 1));
  const periodStart = periodStartDate.toISOString().slice(0, 10);

  const fuelRecords = queryFuelRecords({})
    .filter((item) => item.type === "EXIT" && normalizePlateKey(item.plate) === plateKey);
  const corrections = queryVehicleOdometerCorrections({ plate: vehicle.plate });
  const fuelHistory = buildCorrectedFuelHistory(fuelRecords, corrections);
  const maintenanceRecords = queryVehicleMaintenanceRecords({ plate: vehicle.plate });
  const tireRecords = queryVehicleTires({ plate: vehicle.plate });
  const tireEvents = queryVehicleTireEvents({ plate: vehicle.plate });
  const fines = queryFines().filter((item) => normalizePlateKey(item.plate) === plateKey);
  const checklists = queryChecklists()
    .filter((item) => normalizePlateKey(item.vehicle) === plateKey)
    .sort(
      (left, right) =>
        String(right.checklistDate || "").localeCompare(String(left.checklistDate || "")) || Number(right.id) - Number(left.id)
    );
  const scheduleEntries = queryScheduleEntries({ vehicle: vehicle.plate });
  const todayScheduleEntries = scheduleEntries.filter((item) => item.scheduledDate === todayDate());

  const latestFuelKm = fuelHistory.recordsDesc.find((item) => item.effectiveKm !== null && item.effectiveKm !== undefined);
  const latestChecklistKm = checklists.find((item) => item.odometerKm !== null && item.odometerKm !== undefined) || null;
  const latestMaintenanceKm =
    maintenanceRecords.find((item) => item.odometerKm !== null && item.odometerKm !== undefined) || null;
  const latestTireKm = tireEvents.find((item) => item.odometerKm !== null && item.odometerKm !== undefined) || null;

  const currentKmCandidates = [
    latestFuelKm
      ? {
          km: Number(latestFuelKm.effectiveKm),
          source: "FUEL",
          sortAt: buildDossierSortAt(latestFuelKm.occurredAt),
          occurredAt: latestFuelKm.occurredAt,
        }
      : null,
    latestChecklistKm
      ? {
          km: Number(latestChecklistKm.odometerKm),
          source: "CHECKLIST",
          sortAt: buildDossierSortAt(latestChecklistKm.checklistDate),
          occurredAt: latestChecklistKm.checklistDate,
        }
      : null,
    latestMaintenanceKm
      ? {
          km: Number(latestMaintenanceKm.odometerKm),
          source: "MAINTENANCE",
          sortAt: buildDossierSortAt(latestMaintenanceKm.performedAt),
          occurredAt: latestMaintenanceKm.performedAt,
        }
      : null,
    latestTireKm
      ? {
          km: Number(latestTireKm.odometerKm),
          source: "TIRE",
          sortAt: buildDossierSortAt(latestTireKm.occurredAt),
          occurredAt: latestTireKm.occurredAt,
        }
      : null,
  ]
    .filter(Boolean)
    .sort(compareDossierEventsDesc);

  const currentKmSnapshot = currentKmCandidates[0] || null;
  const currentKm = currentKmSnapshot ? Number(currentKmSnapshot.km) : null;

  const maintenanceWithDue = maintenanceRecords.map((item) => ({
    ...item,
    ...buildMaintenanceDueStatus(item, currentKm),
  }));
  const oilChangeRecord =
    maintenanceWithDue.find((item) => item.maintenanceType === "OIL_CHANGE") || null;
  const oilChangeSummary = oilChangeRecord
    ? {
        ...oilChangeRecord,
        message:
          oilChangeRecord.remainingKm === null
            ? "Intervalo de troca sem configuracao completa."
            : oilChangeRecord.remainingKm < 0
              ? `Troca de oleo vencida ha ${Math.abs(Math.round(oilChangeRecord.remainingKm))} km`
              : `Troca de oleo em ${Math.round(oilChangeRecord.remainingKm)} km`,
      }
    : {
        status: "ATTENTION",
        message: "Sem manutencao registrada.",
        remainingKm: null,
        dueKm: null,
      };

  const enrichedTires = tireRecords.map((item) => {
    const kmDriven =
      currentKm !== null && item.installedKm !== null && item.installedKm !== undefined
        ? Math.max(currentKm - Number(item.installedKm), 0)
        : null;
    const estimatedRemainingKm =
      item.estimatedLifeKm !== null && item.estimatedLifeKm !== undefined && kmDriven !== null
        ? Number(item.estimatedLifeKm) - kmDriven
        : null;
    let status = normalizeTireStatus(item.status, "OK");
    if (item.locationStatus === "DISCARDED") {
      status = "DISCARDED";
    } else if (estimatedRemainingKm !== null) {
      if (estimatedRemainingKm <= 0) {
        status = "REPLACE_RECOMMENDED";
      } else if (status === "OK" && estimatedRemainingKm <= Math.max(Math.round(Number(item.estimatedLifeKm || 0) * 0.15), 5000)) {
        status = "ATTENTION";
      }
    }

    return {
      ...item,
      currentKm,
      kmDriven,
      estimatedRemainingKm,
      status,
    };
  });

  const installedTires = enrichedTires.filter((item) => item.locationStatus === "INSTALLED");
  const removedTires = enrichedTires.filter((item) => item.locationStatus === "REMOVED");
  const stockTires = enrichedTires.filter((item) => item.locationStatus === "STOCK");

  const lastChecklist = checklists[0] || null;
  const checklistHighlights = lastChecklist
    ? [
        lastChecklist.temporaryIssue,
        lastChecklist.problems,
        ...(lastChecklist.itemsDetailed || [])
          .filter((item) => item.status === "CRITICAL" || item.status === "ATTENTION")
          .map((item) => [item.label, item.notes].filter(Boolean).join(" - ")),
      ]
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .slice(0, 4)
    : [];

  const finesSummary = {
    openCount: fines.filter((item) => item.status === "OPEN").length,
    waitingDriverCount: fines.filter((item) => item.status === "WAITING_DRIVER").length,
    pendingPaymentCount: fines.filter((item) => item.status === "PENDING_PAYMENT").length,
  };

  const maintenancePendingRecords = maintenanceWithDue.filter((item) => item.maintenanceType !== "OIL_CHANGE");
  const maintenanceAlertStatus =
    !maintenanceWithDue.length
      ? "ATTENTION"
      : maintenancePendingRecords.some((item) => item.status === "OVERDUE")
        ? "CRITICAL"
        : maintenancePendingRecords.some((item) => item.status === "ATTENTION")
          ? "ATTENTION"
          : "OK";

  const tireAlertStatus =
    !installedTires.length
      ? "ATTENTION"
      : installedTires.some((item) => item.estimatedRemainingKm !== null && item.estimatedRemainingKm <= 0)
        ? "OVERDUE"
        : installedTires.some((item) => item.status === "ATTENTION" || item.status === "REPLACE_RECOMMENDED")
          ? "ATTENTION"
          : "OK";

  const checklistAlertStatus =
    !lastChecklist
      ? "ATTENTION"
      : Number(lastChecklist.itemSummary?.critical || 0) > 0
        ? "CRITICAL"
        : Number(lastChecklist.itemSummary?.attention || 0) > 0 || lastChecklist.status !== "OK"
          ? "ATTENTION"
          : "OK";

  const fineAlertStatus =
    finesSummary.openCount > 0 || finesSummary.pendingPaymentCount > 0
      ? "CRITICAL"
      : finesSummary.waitingDriverCount > 0 || fines.some((item) => item.status === "CONTESTING")
        ? "ATTENTION"
        : "OK";

  const kmAlertStatus =
    fuelHistory.inconsistentCount > 0
      ? "CRITICAL"
      : corrections.length > 0
        ? "ATTENTION"
        : "OK";

  const vehicleInactiveStatus =
    vehicle.status === "INACTIVE" ? "CRITICAL" : vehicle.status === "MAINTENANCE" ? "ATTENTION" : "OK";

  const oilAlertStatus = oilChangeSummary.status || "ATTENTION";
  const todayScheduleStatus = todayScheduleEntries.length ? "ATTENTION" : "OK";

  const alerts = [
    {
      key: "maintenance",
      label: "Manutencao pendente",
      status: maintenanceAlertStatus,
      summary:
        !maintenanceWithDue.length
          ? "Sem manutencao registrada."
          : maintenancePendingRecords.some((item) => item.status === "OVERDUE")
            ? "Existem manutencoes preventivas vencidas."
            : maintenancePendingRecords.some((item) => item.status === "ATTENTION")
              ? "Ha manutencoes proximas do vencimento."
              : "Sem pendencias preventivas.",
    },
    {
      key: "oil",
      label: "Troca de oleo",
      status: oilAlertStatus,
      summary: oilChangeSummary.message,
    },
    {
      key: "tires",
      label: "Pneus / rodizio",
      status: tireAlertStatus,
      summary:
        !installedTires.length
          ? "Sem pneus vinculados."
          : tireAlertStatus === "OVERDUE"
            ? "Ha pneus com troca recomendada imediata."
            : tireAlertStatus === "ATTENTION"
              ? "Alguns pneus exigem atencao."
              : "Pneus dentro do esperado.",
    },
    {
      key: "fines",
      label: "Multa em aberto",
      status: fineAlertStatus,
      summary:
        finesSummary.openCount > 0 || finesSummary.pendingPaymentCount > 0
          ? `${finesSummary.openCount + finesSummary.pendingPaymentCount} pendencia(s) financeira(s).`
          : finesSummary.waitingDriverCount > 0
            ? `${finesSummary.waitingDriverCount} multa(s) aguardando condutor.`
            : "Sem multas em aberto.",
    },
    {
      key: "checklist",
      label: "Checklist critico",
      status: checklistAlertStatus,
      summary:
        !lastChecklist
          ? "Sem checklist recente."
          : Number(lastChecklist.itemSummary?.critical || 0) > 0
            ? `${lastChecklist.itemSummary.critical} item(ns) critico(s) no ultimo checklist.`
            : Number(lastChecklist.itemSummary?.attention || 0) > 0
              ? `${lastChecklist.itemSummary.attention} item(ns) em atencao.`
              : "Ultimo checklist sem criticidade.",
    },
    {
      key: "km",
      label: "KM inconsistente",
      status: kmAlertStatus,
      summary:
        fuelHistory.inconsistentCount > 0
          ? `${fuelHistory.inconsistentCount} abastecimento(s) com KM inconsistente.`
          : corrections.length > 0
            ? `${corrections.length} correcao(oes) de KM registrada(s).`
            : "Sem inconsistencias de KM.",
    },
    {
      key: "schedule",
      label: "Veiculo escalado hoje",
      status: todayScheduleStatus,
      summary: todayScheduleEntries.length
        ? `${todayScheduleEntries.length} escala(s) vinculada(s) para hoje.`
        : "Veiculo sem escala para a data atual.",
    },
    {
      key: "inactive",
      label: "Veiculo inativo",
      status: vehicleInactiveStatus,
      summary:
        vehicle.status === "INACTIVE"
          ? "Veiculo marcado como inativo."
          : vehicle.status === "MAINTENANCE"
            ? "Veiculo em manutencao."
            : "Veiculo operacional.",
    },
  ];

  const timeline = [];

  fuelHistory.recordsDesc.forEach((item) => {
    timeline.push({
      id: item.id,
      type: "ABASTECIMENTO",
      sortAt: buildDossierSortAt(item.occurredAt),
      occurredAt: item.occurredAt,
      description: `${item.quantity.toFixed(2)} L de ${item.fuelKind}${item.effectiveKm !== null ? ` | KM ${Math.round(item.effectiveKm)}` : ""}`,
      userName: item.userName || "Sistema",
    });
  });

  checklists.forEach((item) => {
    timeline.push({
      id: item.id,
      type: "CHECKLIST",
      sortAt: buildDossierSortAt(item.checklistDate),
      occurredAt: item.checklistDate,
      description: `${item.status} | ${item.driverName || "Sem motorista"} | ${item.itemSummary?.critical || 0} critico(s)`,
      userName: item.userName || "Sistema",
    });
  });

  maintenanceRecords.forEach((item) => {
    timeline.push({
      id: item.id,
      type: "MANUTENCAO",
      sortAt: buildDossierSortAt(item.performedAt),
      occurredAt: item.performedAt,
      description: `${item.title}${item.odometerKm !== null ? ` | KM ${Math.round(item.odometerKm)}` : ""}`,
      userName: item.userName || "Sistema",
    });
  });

  tireEvents.forEach((item) => {
    timeline.push({
      id: item.id,
      type: "PNEU",
      sortAt: buildDossierSortAt(item.occurredAt),
      occurredAt: item.occurredAt,
      description: `${item.eventType} | ${item.tireCode}${item.positionTo ? ` | ${item.positionTo}` : ""}`,
      userName: item.userName || "Sistema",
    });
  });

  scheduleEntries.forEach((item) => {
    timeline.push({
      id: item.id,
      type: "ESCALA",
      sortAt: buildDossierSortAt(item.scheduledDate),
      occurredAt: item.scheduledDate,
      description: `${item.driver}${item.assistant ? ` / ${item.assistant}` : ""}${item.location ? ` | ${item.location}` : ""}`,
      userName: item.userName || item.responsibleName || "Sistema",
    });
  });

  fines.forEach((item) => {
    timeline.push({
      id: item.id,
      type: "MULTA",
      sortAt: buildDossierSortAt(item.fineDate),
      occurredAt: item.fineDate,
      description: `${item.status} | ${item.driver} | ${item.amount ? `R$ ${item.amount.toFixed(2)}` : "Sem valor"}`,
      userName: item.userName || "Sistema",
    });
  });

  corrections.forEach((item) => {
    timeline.push({
      id: item.id,
      type: "CORRECAO_KM",
      sortAt: buildDossierSortAt(item.createdAt),
      occurredAt: item.createdAt,
      description: `${Math.round(item.originalKm)} -> ${Math.round(item.correctedKm)}${item.reason ? ` | ${item.reason}` : ""}`,
      userName: item.userName || "Sistema",
    });
  });

  all(
    `
      SELECT *
      FROM action_logs
      WHERE entity_type = 'VEHICLE'
        AND entity_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 20
    `,
    [String(vehicle.id)]
  ).forEach((row) => {
    timeline.push({
      id: Number(row.id),
      type: "CADASTRO",
      sortAt: buildDossierSortAt(row.created_at),
      occurredAt: row.created_at,
      description: row.action === "CREATE_VEHICLE" ? "Cadastro do veiculo criado." : "Alteracao cadastral do veiculo.",
      userName: row.user_name || "Sistema",
    });
  });

  timeline.sort(compareDossierEventsDesc);

  const periodFuelRecords = fuelHistory.recordsDesc.filter((item) => String(item.occurredAt || "").slice(0, 10) >= periodStart);
  const lastTimelineEvent = timeline[0] || null;
  const criticalAlertCount = alerts.filter((item) => item.status === "CRITICAL" || item.status === "OVERDUE").length;

  return {
    vehicle,
    summary: {
      plate: vehicle.plate,
      brandModel: [vehicle.brand, vehicle.model].filter(Boolean).join(" / "),
      fuelProfile: vehicle.fuelProfile,
      sector: vehicle.sector || "",
      status: vehicle.status,
      lastKnownKm: currentKm,
      lastKmSource: currentKmSnapshot?.source || "",
      lastUpdateAt: lastTimelineEvent?.occurredAt || vehicle.updatedAt,
      criticalAlertCount,
      isAvailableToday:
        vehicle.status !== "INACTIVE" && vehicle.status !== "MAINTENANCE" && !todayScheduleEntries.length,
    },
    alerts,
    todaySchedule: {
      date: todayDate(),
      entries: todayScheduleEntries,
    },
    fuel: {
      periodDays,
      periodStart,
      periodEnd,
      totalPeriodLiters: periodFuelRecords.reduce((total, item) => total + Number(item.quantity || 0), 0),
      averageKmPerLiter: fuelHistory.averageKmPerLiter,
      inconsistentCount: fuelHistory.inconsistentCount,
      outlierCount: fuelHistory.outlierCount,
      lastRecord: fuelHistory.recordsDesc[0] || null,
      records: fuelHistory.recordsDesc.slice(0, 5),
      corrections,
    },
    maintenance: {
      oilChange: oilChangeSummary,
      currentKm,
      records: maintenanceWithDue,
      others: maintenanceWithDue.filter((item) => item.maintenanceType !== "OIL_CHANGE"),
    },
    tires: {
      installed: installedTires,
      removed: removedTires,
      stock: stockTires,
      history: tireEvents.slice(0, 20),
    },
    checklist: {
      last: lastChecklist,
      highlights: checklistHighlights,
    },
    fines: {
      summary: finesSummary,
      records: fines,
    },
    timeline: timeline.slice(0, 80),
  };
}

function buildInventoryMovementFilters(filters = {}, alias = "m", productAlias = "p") {
  const clauses = [];
  const params = [];

  if (filters.productId) {
    clauses.push(`${alias}.product_id = ?`);
    params.push(Number(filters.productId));
  }

  if (filters.stockType) {
    clauses.push(`${productAlias}.stock_type = ?`);
    params.push(normalizeStockType(filters.stockType, "COMMON"));
  }

  if (filters.branchName) {
    clauses.push(`lower(coalesce(${alias}.branch_name, '')) = lower(?)`);
    params.push(normalizeText(filters.branchName));
  }

  if (filters.fuelKind) {
    const fuelKind = normalizeFuelKind(filters.fuelKind, "");
    if (fuelKind) {
      clauses.push(`${buildFuelKindSqlExpression(alias, productAlias)} = ?`);
      params.push(fuelKind);
    }
  }

  if (filters.document) {
    clauses.push(`lower(coalesce(${alias}.document, '')) LIKE ?`);
    params.push(buildLikeSearch(filters.document));
  }

  if (filters.supplierName) {
    clauses.push(`lower(coalesce(${alias}.supplier_name, '')) LIKE ?`);
    params.push(buildLikeSearch(filters.supplierName));
  }

  return {
    sql: clauses.length ? clauses.join(" AND ") : "1 = 1",
    params,
  };
}

function buildKardexReport(filters = {}) {
  const productId = Number(filters.productId);
  const from = normalizeText(filters.from);
  const to = normalizeText(filters.to);

  if (!productId || !from || !to) {
    throw new Error("Produto e periodo sao obrigatorios.");
  }

  if (from > to) {
    throw new Error("A data inicial nao pode ser maior que a data final.");
  }

  const product = get("SELECT * FROM inventory_products WHERE id = ? LIMIT 1", [productId]);
  if (!product) {
    throw new Error("Produto nao encontrado.");
  }

  const productStockType = normalizeStockType(product.stock_type, "COMMON");
  const requestedStockType = normalizeStockType(
    filters.stockType || filters.reportType || filters.category,
    productStockType
  );
  if (requestedStockType !== productStockType) {
    throw new Error("O produto selecionado nao pertence ao tipo de Kardex informado.");
  }

  const filterSet = {
    productId,
    stockType: productStockType,
    branchName: normalizeText(filters.branchName || filters.branch || filters.unitName),
    fuelKind: normalizeFuelKind(filters.fuelKind, ""),
    document: normalizeText(filters.document),
    supplierName: normalizeText(filters.supplierName || filters.supplier),
  };

  if (filterSet.stockType !== "FUEL") {
    filterSet.fuelKind = "";
  } else {
    const productFuelKind = resolveFuelProductKind(product);
    if (filterSet.fuelKind && productFuelKind && filterSet.fuelKind !== productFuelKind) {
      throw new Error("O produto selecionado nao corresponde ao combustivel filtrado.");
    }
  }

  const where = buildInventoryMovementFilters(filterSet, "m", "p");
  const openingRow = get(
    `
      SELECT COALESCE(SUM(CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END), 0) AS opening_balance
      FROM inventory_movements m
      JOIN inventory_products p ON p.id = m.product_id
      WHERE ${where.sql}
        AND m.occurred_at < ?
    `,
    [...where.params, from]
  );

  const movementRows = all(
    `
      SELECT m.*, u.name AS user_name
      FROM inventory_movements m
      JOIN inventory_products p ON p.id = m.product_id
      LEFT JOIN users u ON u.id = m.created_by
      WHERE ${where.sql}
        AND m.occurred_at >= ?
        AND m.occurred_at <= ?
      ORDER BY m.occurred_at ASC, m.id ASC
    `,
    [...where.params, from, to]
  );

  const lastPurchase = get(
    `
      SELECT m.*, u.name AS user_name
      FROM inventory_movements m
      JOIN inventory_products p ON p.id = m.product_id
      LEFT JOIN users u ON u.id = m.created_by
      WHERE ${where.sql}
        AND m.type = 'IN'
        AND m.occurred_at <= ?
      ORDER BY m.occurred_at DESC, m.id DESC
      LIMIT 1
    `,
    [...where.params, to]
  );

  const openingBalance = Number(openingRow?.opening_balance || 0);
  let runningBalance = openingBalance;
  let totalEntries = 0;
  let totalExits = 0;

  const rows = movementRows.map((row) => {
    const quantity = Number(row.quantity || 0);
    const unitCost = Number(row.unit_cost || 0);
    const totalCost = Number(row.total_cost || unitCost * quantity || 0);
    const isEntry = row.type === "IN";

    if (isEntry) {
      totalEntries += quantity;
      runningBalance += quantity;
    } else {
      totalExits += quantity;
      runningBalance -= quantity;
    }

    return {
      id: Number(row.id),
      document: row.document || "",
      date: row.occurred_at,
      entryQuantity: isEntry ? quantity : 0,
      exitQuantity: isEntry ? 0 : quantity,
      quantity,
      type: row.type,
      unitCost,
      totalCost,
      balance: runningBalance,
      notes: row.notes || "",
      supplierName: row.supplier_name || "",
      branchName: row.branch_name || "",
      fuelKind: inferFuelKindFromValue(row.fuel_kind || product.name, ""),
      userName: row.user_name || "",
    };
  });

  const currentCost =
    Number(product.default_cost || 0) ||
    Number(lastPurchase?.unit_cost || 0) ||
    0;
  const company = queryCompanySettings();

  return {
    company,
    companyName: company.companyName,
    reportName:
      filterSet.stockType === "FUEL"
        ? "Ficha Kardex - Combustivel"
        : "Ficha Kardex - Almoxarifado",
    issuedAt: nowIso(),
    period: {
      from,
      to,
    },
    product: {
      id: Number(product.id),
      name: product.name,
      unit: product.unit,
      stockType: productStockType,
      defaultCost: Number(product.default_cost || 0),
    },
    filters: {
      stockType: filterSet.stockType,
      branchName: filterSet.branchName || "",
      fuelKind: filterSet.fuelKind || "",
      document: filterSet.document || "",
      supplierName: filterSet.supplierName || "",
    },
    currentCost,
    openingBalance,
    rows,
    totals: {
      entries: totalEntries,
      exits: totalExits,
      finalBalance: runningBalance,
    },
    lastPurchase: lastPurchase
        ? {
          id: Number(lastPurchase.id),
          document: lastPurchase.document || "",
          supplierName: lastPurchase.supplier_name || "",
          branchName: lastPurchase.branch_name || "",
          fuelKind: inferFuelKindFromValue(lastPurchase.fuel_kind || product.name, ""),
          unitCost: Number(lastPurchase.unit_cost || 0),
          totalCost: Number(lastPurchase.total_cost || 0),
          date: lastPurchase.occurred_at,
          userName: lastPurchase.user_name || "",
        }
      : null,
  };
}

function createInventoryMovementRecord(payload = {}) {
  return insert(
    `
      INSERT INTO inventory_movements (
        product_id, type, quantity, balance_after, document, branch_name, supplier_name, fuel_kind,
        unit_cost, total_cost, notes, source_type, source_id, occurred_at, created_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      Number(payload.productId),
      normalizeInventoryMovement(payload.type, "IN"),
      Number(payload.quantity || 0),
      Number(payload.balanceAfter || 0),
      normalizeText(payload.document) || null,
      normalizeText(payload.branchName) || null,
      normalizeText(payload.supplierName) || null,
      normalizeFuelKind(payload.fuelKind, "") || null,
      Number(payload.unitCost || 0),
      Number(payload.totalCost || 0),
      normalizeText(payload.notes),
      normalizeText(payload.sourceType) || null,
      payload.sourceId === null || payload.sourceId === undefined || payload.sourceId === ""
        ? null
        : Number(payload.sourceId),
      normalizeText(payload.occurredAt) || nowIso(),
      payload.createdBy === null || payload.createdBy === undefined || payload.createdBy === ""
        ? null
        : Number(payload.createdBy),
      normalizeText(payload.createdAt) || nowIso(),
    ]
  );
}

function queryEmails() {
  return all(
    `
      SELECT e.*, n.danfe AS note_danfe, n.status AS note_status, n.category AS note_category
      FROM emails e
      LEFT JOIN notes n ON n.id = e.linked_note_id
      ORDER BY e.received_at DESC, e.id DESC
    `
  ).map((row) => ({
    id: Number(row.id),
    sender: row.sender,
    subject: row.subject,
    body: row.body,
    receivedAt: row.received_at,
    spamScore: Number(row.spam_score || 0),
    spamReason: row.spam_reason,
    hasXml: Boolean(row.has_xml),
    detectedSupplier: row.detected_supplier,
    classification: row.classification,
    status: row.status,
    linkedNoteId: row.linked_note_id ? Number(row.linked_note_id) : null,
    linkedNoteDanfe: row.note_danfe || "",
    linkedNoteStatus: row.note_status || "",
      linkedNoteCategory: row.note_category || "",
  }));
}

function createActivationCode() {
  return `ATV-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function buildActivationExpiry() {
  return new Date(Date.now() + ACTIVATION_CODE_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

function createProvisioningPasswordHash() {
  return hashPassword(createSessionToken());
}

function mapAdminUserRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    status: resolveUserStatus(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    hasActiveActivationCode: Boolean(row.activation_code_id),
    activationCodeCreatedAt: row.activation_code_created_at || null,
    activationCodeExpiresAt: row.activation_code_expires_at || null,
    activationCodePurpose: row.activation_code_purpose || null,
  };
}

function queryAdminUsers() {
  return all(
    `
      SELECT
        u.*,
        ac.id AS activation_code_id,
        ac.created_at AS activation_code_created_at,
        ac.expires_at AS activation_code_expires_at,
        ac.purpose AS activation_code_purpose
      FROM users u
      LEFT JOIN activation_codes ac ON ac.id = (
        SELECT inner_ac.id
        FROM activation_codes inner_ac
        WHERE inner_ac.user_id = u.id
          AND inner_ac.active = 1
          AND inner_ac.used_at IS NULL
          AND inner_ac.expires_at > ?
        ORDER BY inner_ac.created_at DESC, inner_ac.id DESC
        LIMIT 1
      )
      WHERE coalesce(u.is_system, 0) = 0
      ORDER BY lower(u.name) ASC, u.id ASC
    `,
    [nowIso()]
  ).map(mapAdminUserRow);
}

function getManagedUser(userId) {
  return get("SELECT * FROM users WHERE id = ? AND coalesce(is_system, 0) = 0", [userId]);
}

function invalidateActivationCodes(userId) {
  write("UPDATE activation_codes SET active = 0 WHERE user_id = ? AND active = 1", [userId]);
}

function deleteUserSessions(userId) {
  write("DELETE FROM sessions WHERE user_id = ?", [userId]);
}

function issueActivationCode(userId, createdByUserId, purpose = "ACTIVATION") {
  const timestamp = nowIso();
  const expiresAt = buildActivationExpiry();
  const code = createActivationCode();
  const codeId = insert(
    `
      INSERT INTO activation_codes (user_id, code, purpose, active, created_by, created_at, expires_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `,
    [userId, code, purpose, createdByUserId || null, timestamp, expiresAt]
  );

  return {
    id: codeId,
    code,
    purpose,
    createdAt: timestamp,
    expiresAt,
  };
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return sendError(res, 401, "Sua sessao expirou. Faca login novamente.");
  }
  return next();
}

function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Sua sessao expirou. Faca login novamente.");
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, "Seu perfil nao tem permissao para esta acao.");
    }

    return next();
  };
}

async function start() {
  await initDatabase();
  ensureChecklistTemplateSeeded();
  ensureCompanySettingsSeeded();

  const app = express();
  const publicDir = path.join(__dirname, "public");

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");

    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = cookies[SESSION_COOKIE];
    req.user = null;

    if (!sessionToken) {
      return next();
    }

    const session = get(
      `
        SELECT s.*, u.id AS user_id, u.name, u.email, u.role, u.active, u.status, u.is_system
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?
      `,
      [hashToken(sessionToken)]
    );

    if (!session || resolveUserStatus(session) !== USER_STATUSES.ACTIVE || new Date(session.expires_at) <= new Date()) {
      res.setHeader("Set-Cookie", buildClearedSessionCookie());
      return next();
    }

    req.user = {
      id: Number(session.user_id),
      name: session.name,
      email: session.email,
      role: session.role,
      status: resolveUserStatus(session),
      system: isSystemUser(session),
    };

    if (
      !session.last_seen_at ||
      Date.now() - new Date(session.last_seen_at).getTime() > 15 * 60 * 1000
    ) {
      write("UPDATE sessions SET last_seen_at = ? WHERE id = ?", [nowIso(), session.id]);
    }

    return next();
  });

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      database: DB_PATH,
      user: req.user,
      now: nowIso(),
    });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/login", (req, res) => {
    const email = normalizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return sendError(res, 400, "Informe email e senha.");
    }

    const user = get("SELECT * FROM users WHERE lower(email) = lower(?)", [email]);
    if (!user) {
      return sendError(res, 401, "Usuario ou senha invalidos.");
    }

    const status = resolveUserStatus(user);
    if (status === USER_STATUSES.PENDING) {
      return sendError(res, 403, "Conta pendente de ativacao. Use o codigo fornecido pelo administrador.");
    }
    if (status === USER_STATUSES.BLOCKED) {
      return sendError(res, 403, "Conta bloqueada. Procure o administrador.");
    }

    if (!verifyPassword(password, user.password_hash)) {
      return sendError(res, 401, "Usuario ou senha invalidos.");
    }

    const token = createSessionToken();
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    insert(
      `
        INSERT INTO sessions (user_id, token_hash, created_at, expires_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      [user.id, hashToken(token), createdAt, expiresAt, createdAt]
    );

    res.setHeader("Set-Cookie", buildSessionCookie(token, expiresAt));
    logAction(formatUser(user), "LOGIN", "AUTH", user.id, { email });

    return res.json({ user: formatUser(user) });
  });

  app.post("/api/auth/activate", (req, res) => {
    const email = normalizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const activationCode = normalizeText(req.body.activationCode || req.body.code).toUpperCase();

    if (!email || !activationCode || !password || !confirmPassword) {
      return sendError(res, 400, "Preencha email, codigo, nova senha e confirmacao.");
    }

    if (password !== confirmPassword) {
      return sendError(res, 400, "A confirmacao de senha nao confere.");
    }

    if (password.length < 8) {
      return sendError(res, 400, "A nova senha precisa ter pelo menos 8 caracteres.");
    }

    const user = get("SELECT * FROM users WHERE lower(email) = lower(?)", [email]);
    if (!user || isSystemUser(user)) {
      return sendError(res, 400, "Codigo de ativacao invalido ou expirado.");
    }

    if (resolveUserStatus(user) === USER_STATUSES.BLOCKED) {
      return sendError(res, 403, "Conta bloqueada. Procure o administrador.");
    }

    const activation = get(
      `
        SELECT *
        FROM activation_codes
        WHERE user_id = ?
          AND code = ?
          AND active = 1
          AND used_at IS NULL
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [user.id, activationCode]
    );

    if (!activation) {
      return sendError(res, 400, "Codigo de ativacao invalido ou expirado.");
    }

    if (new Date(activation.expires_at) <= new Date()) {
      write("UPDATE activation_codes SET active = 0 WHERE id = ?", [activation.id]);
      return sendError(res, 400, "Codigo de ativacao expirado. Solicite um novo codigo ao administrador.");
    }

    transaction(() => {
      write(
        `
          UPDATE users
          SET password_hash = ?, status = ?, active = 1, updated_at = ?
          WHERE id = ?
        `,
        [hashPassword(password), USER_STATUSES.ACTIVE, nowIso(), user.id]
      );

      write(
        `
          UPDATE activation_codes
          SET active = 0,
              used_at = CASE WHEN id = ? THEN ? ELSE used_at END
          WHERE user_id = ?
            AND active = 1
        `,
        [activation.id, nowIso(), user.id]
      );

      deleteUserSessions(user.id);

      logAction(
        { ...formatUser(user), name: user.name },
        "ACTIVATE_ACCOUNT",
        "USER",
        user.id,
        { purpose: activation.purpose }
      );
    });

    return res.json({ ok: true });
  });

  app.post("/api/auth/register", (req, res) => {
    return sendError(res, 403, "Cadastro publico desativado. Solicite a criacao da conta ao administrador.");
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = cookies[SESSION_COOKIE];

    if (sessionToken) {
      write("DELETE FROM sessions WHERE token_hash = ?", [hashToken(sessionToken)]);
    }

    logAction(req.user, "LOGOUT", "AUTH", req.user.id, null);
    res.setHeader("Set-Cookie", buildClearedSessionCookie());
    return res.json({ ok: true });
  });

  app.get("/api/dashboard", requireAuth, (req, res) => {
    const period = resolveDashboardPeriod(req.query);
    const selectedPlate = normalizeText(req.query.plate).toUpperCase();
    const pendingNotes = get(
      "SELECT COUNT(*) AS total FROM notes WHERE status IN ('NEW', 'PENDING_ACK')"
    );
    const waitingAckNotes = get(
      "SELECT COUNT(*) AS total FROM notes WHERE status = 'PENDING_ACK'"
    );
    const sentFinanceNotes = get(
      "SELECT COUNT(*) AS total FROM notes WHERE status = 'SENT_FINANCE'"
    );
    const activeVehicles = get("SELECT COUNT(*) AS total FROM vehicles WHERE active = 1");
    const fuelOverview = queryFuelOverview();
    const fuelAnalytics = queryFuelAnalytics(
      { days: period.periodDays, from: req.query.from, to: req.query.to, plate: selectedPlate },
      fuelOverview
    );
    const lowStock = queryProducts("", { stockType: "COMMON" }).filter((item) => item.lowStock);
    const todaySchedules = querySchedules(todayDate());
    const agingNotes = all(
      `
        SELECT id, supplier_name, status, updated_at
        FROM notes
        WHERE status IN ('NEW', 'PENDING_ACK')
        ORDER BY updated_at ASC
        LIMIT 5
      `
    );

    const businessAlerts = [
      ...lowStock.slice(0, 5).map((item) => ({
        type: "LOW_STOCK",
        severity: "WARNING",
        title: `Estoque minimo: ${item.name}`,
        description: `Saldo ${item.currentStock} ${item.unit} | minimo ${item.minStock} ${item.unit}`,
      })),
      ...agingNotes.map((item) => ({
        type: "NOTE_PENDING",
        severity: "WARNING",
        title: `Nota pendente: ${item.supplier_name}`,
        description: `Status ${item.status} desde ${new Date(item.updated_at).toLocaleString("pt-BR")}`,
      })),
    ];
    const alerts = [...fuelAnalytics.operationalAlerts, ...businessAlerts];

    return res.json({
      metrics: {
        pendingNotes: Number(pendingNotes?.total || 0),
        waitingRecognition: Number(waitingAckNotes?.total || 0),
        sentToFinance: Number(sentFinanceNotes?.total || 0),
        fuelBalance: Number(fuelOverview.totalBalance || 0),
        fuelByKind: fuelOverview.fuelByKind,
        fuelStorages: fuelOverview.storages,
        lowStockCount: lowStock.length,
        todaySchedulesCount: todaySchedules.length,
        alertCount: alerts.length,
        criticalAlertCount: Number(fuelAnalytics.alertSummary?.critical || 0),
        periodFuelConsumption: Number(fuelAnalytics.totalConsumptionLiters || 0),
        averageDailyConsumption: Number(fuelAnalytics.averageDailyConsumption || 0),
        averageKmPerLiter: Number(fuelAnalytics.efficiencySummary?.averageKmPerLiter || 0),
        bestKmPerLiter: Number(fuelAnalytics.efficiencyRanking[0]?.kmPerLiter || 0),
        monitoredVehicles: Number(fuelAnalytics.efficiencyRanking.length || 0),
        activeVehicles: Number(activeVehicles?.total || 0),
      },
      alerts,
      todaySchedules,
      analytics: fuelAnalytics,
    });
  });

  app.get("/api/settings/company", requireAuth, (req, res) => {
    return res.json({ item: queryCompanySettings() });
  });

  app.put("/api/settings/company", requireRoles(["ADMIN"]), (req, res) => {
    try {
      const item = saveCompanySettings(req.body, req.user);
      logAction(req.user, "UPDATE_COMPANY_SETTINGS", "COMPANY_SETTINGS", 1, {
        companyName: item.companyName,
        hasLogo: Boolean(item.logoDataUrl),
      });
      return res.json({ item });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.get("/api/checklists/template", requireAuth, (req, res) => {
    return res.json({ items: queryChecklistTemplateItems() });
  });

  app.post("/api/checklists/template", requireRoles(["ADMIN"]), (req, res) => {
    try {
      if (!normalizeText(req.body.name || req.body.label)) {
        return sendError(res, 400, "Informe o nome do item de checklist.");
      }

      const item = createChecklistTemplateItem(req.body, req.user);
      logAction(req.user, "CREATE_CHECKLIST_TEMPLATE_ITEM", "CHECKLIST_TEMPLATE", item?.id || null, {
        itemKey: item?.itemKey,
        name: item?.name,
        category: item?.category,
        active: item?.active,
      });
      return res.status(201).json({ item });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.put("/api/checklists/template/:id", requireRoles(["ADMIN"]), (req, res) => {
    try {
      const item = updateChecklistTemplateItem(req.params.id, req.body, req.user);
      logAction(req.user, "UPDATE_CHECKLIST_TEMPLATE_ITEM", "CHECKLIST_TEMPLATE", req.params.id, {
        itemKey: item?.itemKey,
        name: item?.name,
        category: item?.category,
        active: item?.active,
      });
      return res.json({ item });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.get("/api/notes", requireAuth, (req, res) => {
    res.json({ items: queryNotes(req.query) });
  });

  app.post("/api/notes", requireAuth, (req, res) => {
    try {
      const note = createOrUpdateNote(req.body, req.user, { source: "MANUAL" });
      return res.status(201).json({ item: note });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.put("/api/notes/:id", requireAuth, (req, res) => {
    const existingNote = get("SELECT * FROM notes WHERE id = ?", [Number(req.params.id)]);
    if (!existingNote) {
      return sendError(res, 404, "Nota nao encontrada.");
    }

    try {
      const note = createOrUpdateNote(req.body, req.user, { existingNote });
      return res.json({ item: note });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.delete("/api/notes/:id", requireRoles(["ADMIN"]), (req, res) => {
    const existingNote = get("SELECT * FROM notes WHERE id = ?", [Number(req.params.id)]);
    if (!existingNote) {
      return sendError(res, 404, "Nota nao encontrada.");
    }

    transaction(() => {
      write("DELETE FROM notes WHERE id = ?", [existingNote.id]);
      logAction(req.user, "DELETE_NOTE", "NOTE", existingNote.id, {
        supplierName: existingNote.supplier_name,
        danfe: existingNote.danfe,
      });
    });

    return res.json({ ok: true });
  });

  app.post("/api/notes/import/xml", requireAuth, (req, res) => {
    const files = Array.isArray(req.body.files) ? req.body.files : [];

    if (!files.length) {
      return sendError(res, 400, "Selecione ao menos um XML.");
    }

    try {
      const created = [];

      transaction(() => {
        for (const file of files) {
          const parsed = parseInvoiceXml(String(file.content || ""), String(file.name || ""));
          const note = createOrUpdateNote(
            {
              supplierName: parsed.supplierName,
              totalValue: parsed.totalValue,
              danfe: parsed.danfe,
              xmlKey: parsed.xmlKey,
              issueDate: parsed.issueDate,
              status: "NEW",
              source: "XML",
            },
            req.user,
            { source: "XML", skipLog: true, preferExistingWorkflow: true }
          );
          created.push(note);
        }

        logAction(req.user, "IMPORT_XML_NOTES", "NOTE", null, { total: created.length });
      });

      return res.json({ items: created });
    } catch (error) {
      return sendError(res, 400, `Falha ao importar XML: ${error.message}`);
    }
  });

  app.post("/api/notes/import/spreadsheet", requireAuth, (req, res) => {
    const contentBase64 = String(req.body.contentBase64 || "");

    if (!contentBase64) {
      return sendError(res, 400, "Arquivo de planilha nao informado.");
    }

    try {
      const rows = parseSpreadsheet(contentBase64);

      if (!rows.length) {
        return sendError(res, 400, "Nenhuma linha valida foi encontrada na planilha.");
      }

      const created = [];

      transaction(() => {
        for (const row of rows) {
          const note = createOrUpdateNote(
            {
              supplierName: row.supplierName,
              totalValue: row.totalValue,
              danfe: row.danfe,
              issueDate: row.issueDate,
              category: row.category,
              status: row.status || "NEW",
              source: "SPREADSHEET",
            },
            req.user,
            { source: "SPREADSHEET", skipLog: true, preferExistingWorkflow: true }
          );
          created.push(note);
        }

        logAction(req.user, "IMPORT_SPREADSHEET_NOTES", "NOTE", null, {
          total: created.length,
        });
      });

      return res.json({ items: created });
    } catch (error) {
      return sendError(res, 400, `Falha ao importar planilha: ${error.message}`);
    }
  });

  app.get("/api/vehicles", requireAuth, (req, res) => {
    const activeOnly = ["1", "true", "yes"].includes(String(req.query.activeOnly || "").toLowerCase());
    res.json({
      items: queryVehicles({
        activeOnly,
        fuelKind: req.query.fuelKind,
        plate: req.query.plate,
      }),
    });
  });

  app.get("/api/vehicles/dossier/:plate", requireAuth, (req, res) => {
    try {
      const dossier = queryVehicleDossierByPlate(req.params.plate, {
        periodDays: req.query.periodDays,
      });

      if (!dossier) {
        return sendError(res, 404, "Veiculo nao cadastrado.");
      }

      return res.json({ item: dossier });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.post("/api/vehicles", requireAuth, (req, res) => {
    const plate = normalizePlate(req.body.plate);
    const fuelProfile = normalizeVehicleFuelProfile(req.body.fuelProfile || req.body.fuelType, "S500");
    const brand = normalizeText(req.body.brand);
    const model = normalizeText(req.body.model);
    const sector = normalizeText(req.body.sector || req.body.operation);
    const notes = normalizeText(req.body.notes || req.body.observation);
    const status = normalizeVehicleOperationalStatus(req.body.status || "ACTIVE", "ACTIVE");
    const active = isVehicleOperational(status);

    if (!plate) {
      return sendError(res, 400, "A placa do veiculo e obrigatoria.");
    }

    const duplicate = get("SELECT id FROM vehicles WHERE plate = ? LIMIT 1", [plate]);
    if (duplicate) {
      return sendError(res, 409, "Ja existe um veiculo cadastrado com esta placa.");
    }

    const timestamp = nowIso();
    const vehicleId = insert(
      `
        INSERT INTO vehicles (
          plate, fuel_profile, brand, model, sector, active, operational_status, notes, created_by, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [plate, fuelProfile, brand, model, sector, active ? 1 : 0, status, notes, req.user.id, timestamp, timestamp]
    );

    write(
      `
        UPDATE fuel_records
        SET vehicle_id = ?
        WHERE plate = ?
          AND (vehicle_id IS NULL OR vehicle_id = 0)
      `,
      [vehicleId, plate]
    );

    write(
      `
        UPDATE vehicle_maintenance_records
        SET vehicle_id = ?
        WHERE plate = ?
          AND (vehicle_id IS NULL OR vehicle_id = 0)
      `,
      [vehicleId, plate]
    );

    write(
      `
        UPDATE vehicle_tires
        SET vehicle_id = ?
        WHERE plate = ?
          AND (vehicle_id IS NULL OR vehicle_id = 0)
      `,
      [vehicleId, plate]
    );

    write(
      `
        UPDATE vehicle_tire_events
        SET vehicle_id = ?
        WHERE plate = ?
          AND (vehicle_id IS NULL OR vehicle_id = 0)
      `,
      [vehicleId, plate]
    );

    write(
      `
        UPDATE vehicle_odometer_corrections
        SET vehicle_id = ?
        WHERE plate = ?
          AND (vehicle_id IS NULL OR vehicle_id = 0)
      `,
      [vehicleId, plate]
    );

    logAction(req.user, "CREATE_VEHICLE", "VEHICLE", vehicleId, {
      plate,
      fuelProfile,
      brand,
      model,
      sector,
      status,
      active,
    });

    return res.status(201).json({ item: queryVehicles({}).find((item) => item.id === vehicleId) });
  });

  app.put("/api/vehicles/:id", requireAuth, (req, res) => {
    const vehicleId = Number(req.params.id);
    const existing = get("SELECT * FROM vehicles WHERE id = ? LIMIT 1", [vehicleId]);

    if (!existing) {
      return sendError(res, 404, "Veiculo nao encontrado.");
    }

    const plate = normalizePlate(req.body.plate || existing.plate);
    const fuelProfile = normalizeVehicleFuelProfile(req.body.fuelProfile || req.body.fuelType || existing.fuel_profile, "S500");
    const brand = normalizeText(req.body.brand || existing.brand);
    const model = normalizeText(req.body.model || existing.model);
    const sector = normalizeText(req.body.sector || req.body.operation || existing.sector);
    const notes = normalizeText(req.body.notes || req.body.observation || existing.notes);
    const status = normalizeVehicleOperationalStatus(
      req.body.status || existing.operational_status || (Number(existing.active || 0) === 1 ? "ACTIVE" : "INACTIVE"),
      Number(existing.active || 0) === 1 ? "ACTIVE" : "INACTIVE"
    );
    const active = isVehicleOperational(status);

    if (!plate) {
      return sendError(res, 400, "A placa do veiculo e obrigatoria.");
    }

    const duplicate = get("SELECT id FROM vehicles WHERE plate = ? AND id <> ? LIMIT 1", [plate, vehicleId]);
    if (duplicate) {
      return sendError(res, 409, "Ja existe um veiculo cadastrado com esta placa.");
    }

    const timestamp = nowIso();
    write(
      `
        UPDATE vehicles
        SET plate = ?, fuel_profile = ?, brand = ?, model = ?, sector = ?, active = ?, operational_status = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      [plate, fuelProfile, brand, model, sector, active ? 1 : 0, status, notes, timestamp, vehicleId]
    );

    write(
      `
        UPDATE fuel_records
        SET plate = ?, vehicle_id = ?
        WHERE vehicle_id = ?
      `,
      [plate, vehicleId, vehicleId]
    );

    if (normalizePlateKey(plate) !== normalizePlateKey(existing.plate)) {
      write(
        `
          UPDATE fines
          SET plate = ?, updated_at = ?
          WHERE replace(replace(upper(coalesce(plate, '')), '-', ''), ' ', '') = ?
        `,
        [plate, timestamp, normalizePlateKey(existing.plate)]
      );

      write(
        `
          UPDATE checklists
          SET vehicle = ?, updated_at = ?
          WHERE replace(replace(upper(coalesce(vehicle, '')), '-', ''), ' ', '') = ?
        `,
        [plate, timestamp, normalizePlateKey(existing.plate)]
      );

      write(
        `
          UPDATE schedule_entries
          SET vehicle = ?, updated_at = ?
          WHERE replace(replace(upper(coalesce(vehicle, '')), '-', ''), ' ', '') = ?
        `,
        [plate, timestamp, normalizePlateKey(existing.plate)]
      );

      write(
        `
          UPDATE vehicle_maintenance_records
          SET plate = ?, updated_at = ?
          WHERE replace(replace(upper(coalesce(plate, '')), '-', ''), ' ', '') = ?
        `,
        [plate, timestamp, normalizePlateKey(existing.plate)]
      );

      write(
        `
          UPDATE vehicle_tires
          SET plate = ?, updated_at = ?
          WHERE replace(replace(upper(coalesce(plate, '')), '-', ''), ' ', '') = ?
        `,
        [plate, timestamp, normalizePlateKey(existing.plate)]
      );

      write(
        `
          UPDATE vehicle_tire_events
          SET plate = ?
          WHERE replace(replace(upper(coalesce(plate, '')), '-', ''), ' ', '') = ?
        `,
        [plate, normalizePlateKey(existing.plate)]
      );

      write(
        `
          UPDATE vehicle_odometer_corrections
          SET plate = ?
          WHERE replace(replace(upper(coalesce(plate, '')), '-', ''), ' ', '') = ?
        `,
        [plate, normalizePlateKey(existing.plate)]
      );
    }

    logAction(req.user, "UPDATE_VEHICLE", "VEHICLE", vehicleId, {
      plate,
      fuelProfile,
      brand,
      model,
      sector,
      status,
      active,
    });

    return res.json({ item: queryVehicles({}).find((item) => item.id === vehicleId) });
  });

  app.get("/api/products", requireAuth, (req, res) => {
    res.json({
      items: queryProducts(req.query.search || "", {
        stockType: req.query.stockType,
      }),
    });
  });

  app.get("/api/products/barcode/:barcode", requireAuth, (req, res) => {
    const barcode = normalizeText(req.params.barcode);
    const product = get(
      `
        SELECT *
        FROM inventory_products
        WHERE barcode = ?
          AND active = 1
          AND (? = '' OR stock_type = ?)
        LIMIT 1
      `,
      [
        barcode,
        normalizeStockType(req.query.stockType, ""),
        normalizeStockType(req.query.stockType, ""),
      ]
    );

    if (!product) {
      return sendError(res, 404, "Produto nao encontrado para este codigo de barras.");
    }

    return res.json({
      item: {
        id: Number(product.id),
        name: product.name,
        unit: product.unit,
        barcode: product.barcode,
        stockType: normalizeStockType(product.stock_type, "COMMON"),
        minStock: Number(product.min_stock || 0),
        currentStock: Number(product.current_stock || 0),
      },
    });
  });

  app.post("/api/products", requireAuth, (req, res) => {
    const name = normalizeText(req.body.name);
    const unit = normalizeText(req.body.unit || "UN").toUpperCase();
    const barcode = normalizeText(req.body.barcode);
    const stockType = normalizeStockType(req.body.stockType || req.body.category || req.body.inventoryType, "");
    const minStock = toNumber(req.body.minStock);
    const initialStock = toNumber(req.body.initialStock);
    const defaultCost = toNumber(req.body.defaultCost);

    if (!name) {
      return sendError(res, 400, "Nome do produto e obrigatorio.");
    }

    if (!stockType) {
      return sendError(res, 400, "Informe a classificacao do item: comum ou combustivel.");
    }

    if (barcode) {
      const barcodeInUse = get(
        "SELECT id FROM inventory_products WHERE barcode = ? AND active = 1",
        [barcode]
      );
      if (barcodeInUse) {
        return sendError(res, 409, "Este codigo de barras ja esta vinculado a outro produto.");
      }
    }

    let productId = 0;
    const timestamp = nowIso();

    transaction(() => {
      productId = insert(
        `
          INSERT INTO inventory_products (
            name, unit, barcode, stock_type, min_stock, current_stock, default_cost, active, created_by, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        `,
        [name, unit, barcode || null, stockType, minStock, initialStock, defaultCost, req.user.id, timestamp, timestamp]
      );

      if (initialStock > 0) {
        const linkedStorage = stockType === "FUEL" ? getFuelStorageByProductId(productId) : null;
        createInventoryMovementRecord({
          productId,
          type: "IN",
          quantity: initialStock,
          balanceAfter: initialStock,
          document: stockType === "FUEL" ? "SALDO-INICIAL-COMBUSTIVEL" : "SALDO-INICIAL",
          fuelKind: linkedStorage?.fuel_kind || "",
          unitCost: defaultCost,
          totalCost: defaultCost * initialStock,
          notes:
            stockType === "FUEL"
              ? "Saldo inicial do combustivel"
              : "Saldo inicial do produto",
          occurredAt: timestamp,
          createdBy: req.user.id,
          createdAt: timestamp,
        });

        if (linkedStorage) {
          write(
            `
              UPDATE fuel_storages
              SET current_balance = ?, updated_at = ?
              WHERE id = ?
            `,
            [initialStock, timestamp, linkedStorage.id]
          );
        }
      }

      logAction(req.user, "CREATE_PRODUCT", "PRODUCT", productId, {
        name,
        barcode,
        stockType,
        initialStock,
        defaultCost,
      });
    });

    return res.status(201).json({ item: queryProducts("", { stockType }).find((item) => item.id === productId) });
  });

  app.put("/api/products/:id", requireAuth, (req, res) => {
    const productId = Number(req.params.id);
    const existing = get("SELECT * FROM inventory_products WHERE id = ?", [productId]);

    if (!existing) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    const name = normalizeText(req.body.name || existing.name);
    const unit = normalizeText(req.body.unit || existing.unit).toUpperCase();
    const barcode = normalizeText(req.body.barcode || existing.barcode);
    const stockType = normalizeStockType(
      req.body.stockType || req.body.category || req.body.inventoryType || existing.stock_type,
      "COMMON"
    );
    const minStock = toNumber(req.body.minStock ?? existing.min_stock);
    const defaultCost = toNumber(req.body.defaultCost ?? existing.default_cost);

    if (barcode) {
      const barcodeInUse = get(
        "SELECT id FROM inventory_products WHERE barcode = ? AND active = 1 AND id <> ?",
        [barcode, productId]
      );
      if (barcodeInUse) {
        return sendError(res, 409, "Este codigo de barras ja esta vinculado a outro produto.");
      }
    }

    write(
      `
        UPDATE inventory_products
        SET name = ?, unit = ?, barcode = ?, stock_type = ?, min_stock = ?, default_cost = ?, updated_at = ?
        WHERE id = ?
      `,
      [name, unit, barcode || null, stockType, minStock, defaultCost, nowIso(), productId]
    );

    logAction(req.user, "UPDATE_PRODUCT", "PRODUCT", productId, {
      name,
      barcode,
      stockType,
      minStock,
      defaultCost,
    });
    return res.json({ item: queryProducts("", { stockType }).find((item) => item.id === productId) });
  });

  app.get("/api/inventory/movements", requireAuth, (req, res) => {
    res.json({ items: queryInventoryMovements(req.query) });
  });

  app.get("/api/reports/kardex", requireAuth, (req, res) => {
    try {
      const report = buildKardexReport({
        productId: req.query.productId,
        stockType: req.query.stockType,
        from: req.query.from,
        to: req.query.to,
        branchName: req.query.branchName,
        fuelKind: req.query.fuelKind,
        document: req.query.document,
        supplierName: req.query.supplierName,
      });

      return res.json({ report });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.post("/api/inventory/movements", requireAuth, (req, res) => {
    const productId = Number(req.body.productId);
    const type = normalizeInventoryMovement(req.body.type, "IN");
    const requestedStockType = normalizeStockType(req.body.stockType || req.body.category || req.body.inventoryType, "");
    const quantity = toNumber(req.body.quantity);
    const document = normalizeText(req.body.document);
    const branchName = normalizeText(req.body.branchName || req.body.branch || req.body.unitName);
    const supplierName = normalizeText(req.body.supplierName || req.body.supplier);
    const rawUnitCost = normalizeText(req.body.unitCost);
    const unitCost = rawUnitCost ? toNumber(rawUnitCost) : null;
    const notes = normalizeText(req.body.notes);
    const occurredAt = normalizeText(req.body.occurredAt) || nowIso();

    if (!productId || quantity <= 0) {
      return sendError(res, 400, "Informe produto e quantidade valida.");
    }

    const product = get("SELECT * FROM inventory_products WHERE id = ? AND active = 1", [productId]);
    if (!product) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    const productStockType = normalizeStockType(product.stock_type, "COMMON");
    if (requestedStockType && requestedStockType !== productStockType) {
      return sendError(res, 400, "O produto selecionado nao pertence a este tipo de estoque.");
    }

    const linkedFuelStorage =
      productStockType === "FUEL" ? getFuelStorageByProductId(productId) : null;
    const fuelKind =
      productStockType === "FUEL"
        ? normalizeFuelKind(req.body.fuelKind || linkedFuelStorage?.fuel_kind, "")
        : "";

    const currentStock = Number(product.current_stock || 0);
    const nextStock = type === "IN" ? currentStock + quantity : currentStock - quantity;
    const effectiveUnitCost = unitCost === null ? Number(product.default_cost || 0) : unitCost;
    const totalCost = effectiveUnitCost * quantity;

    if (nextStock < 0) {
      return sendError(res, 400, "A saida nao pode deixar o estoque negativo.");
    }

    if (effectiveUnitCost < 0) {
      return sendError(res, 400, "Informe um valor unitario valido.");
    }

    let movementId = 0;
    const timestamp = nowIso();

    transaction(() => {
      movementId = createInventoryMovementRecord({
        productId,
        type,
        quantity,
        balanceAfter: nextStock,
        document,
        branchName,
        supplierName,
        fuelKind,
        unitCost: effectiveUnitCost,
        totalCost,
        notes,
        occurredAt,
        createdBy: req.user.id,
        createdAt: timestamp,
      });

      write(
        `
          UPDATE inventory_products
          SET current_stock = ?, default_cost = ?, updated_at = ?
          WHERE id = ?
        `,
        [nextStock, type === "IN" && effectiveUnitCost > 0 ? effectiveUnitCost : Number(product.default_cost || 0), timestamp, productId]
      );

      if (linkedFuelStorage) {
        write(
          `
            UPDATE fuel_storages
            SET current_balance = ?, updated_at = ?
            WHERE id = ?
          `,
          [nextStock, timestamp, linkedFuelStorage.id]
        );
      }

      logAction(req.user, "CREATE_INVENTORY_MOVEMENT", "INVENTORY", movementId, {
        productId,
        stockType: productStockType,
        type,
        quantity,
        document,
        branchName,
        supplierName,
        fuelKind,
        unitCost: effectiveUnitCost,
        totalCost,
        balanceAfter: nextStock,
      });
    });

    return res.status(201).json({
      item: queryInventoryMovements({ productId, stockType: productStockType }).find((item) => item.id === movementId),
    });
  });

  app.get("/api/fuel", requireAuth, (req, res) => {
    res.json({
      items: queryFuelRecords(req.query),
      storages: queryFuelStorages(),
      summary: queryFuelOverview(),
    });
  });

  app.post("/api/fuel", requireAuth, (req, res) => {
    const storageId = Number(req.body.storageId);
    const type = normalizeFuelType(req.body.type, "ENTRY");
    const vehicleId = Number(req.body.vehicleId || 0);
    const fallbackPlate = normalizePlate(req.body.plate);
    const quantity = toNumber(req.body.quantity);
    const rawOdometer = normalizeText(req.body.odometerKm);
    const odometerKm = rawOdometer ? toNumber(rawOdometer) : null;
    const notes = normalizeText(req.body.notes);
    const occurredAt = normalizeText(req.body.occurredAt) || nowIso();

    if (!storageId || quantity <= 0) {
      return sendError(res, 400, "Informe estoque e quantidade valida.");
    }

    if (rawOdometer && (!/\d/.test(rawOdometer) || odometerKm < 0)) {
      return sendError(res, 400, "Informe um hodometro valido.");
    }

    const storage = get(
      `
        SELECT *
        FROM fuel_storages
        WHERE id = ? AND active = 1
        LIMIT 1
      `,
      [storageId]
    );

    if (!storage) {
      return sendError(res, 404, "Estoque de combustivel nao encontrado.");
    }

    let vehicle =
      (vehicleId &&
        get(
          `
            SELECT *
            FROM vehicles
            WHERE id = ? AND active = 1
            LIMIT 1
          `,
          [vehicleId]
        )) ||
      null;

    if (!vehicle && fallbackPlate) {
      vehicle = get(
        `
          SELECT *
          FROM vehicles
          WHERE plate = ? AND active = 1
          LIMIT 1
        `,
        [fallbackPlate]
      );
    }

    if (type === "EXIT" && !vehicle) {
      return sendError(res, 400, "Selecione um veiculo ativo para registrar a saida.");
    }

    if (type === "EXIT" && !vehicleSupportsFuel(vehicle?.fuel_profile, storage.fuel_kind)) {
      return sendError(res, 400, "Este veiculo nao aceita o combustivel selecionado.");
    }

    const currentBalance = Number(storage.current_balance || 0);
    const nextBalance = type === "ENTRY" ? currentBalance + quantity : currentBalance - quantity;
    const plate = type === "EXIT" ? normalizePlate(vehicle?.plate) : "";
    const relatedVehicleId = type === "EXIT" ? Number(vehicle?.id || 0) : null;
    const linkedFuelProduct =
      storage.product_id
        ? get("SELECT * FROM inventory_products WHERE id = ? AND active = 1 LIMIT 1", [Number(storage.product_id)])
        : null;
    const mirroredUnitCost = Number(linkedFuelProduct?.default_cost || 0);
    const mirroredTotalCost = mirroredUnitCost * quantity;

    if (nextBalance < 0) {
      return sendError(
        res,
        400,
        `A saida nao pode deixar o estoque ${storage.name} negativo.`
      );
    }

    let recordId = 0;
    const timestamp = nowIso();

    transaction(() => {
      recordId = insert(
        `
          INSERT INTO fuel_records (
            storage_id, storage_name, fuel_kind, vehicle_id, type, plate, quantity, odometer_km,
            balance_before, balance_after, notes, occurred_at, created_by, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          storageId,
          storage.name,
          storage.fuel_kind,
          relatedVehicleId,
          type,
          plate,
          quantity,
          odometerKm,
          currentBalance,
          nextBalance,
          notes,
          occurredAt,
          req.user.id,
          timestamp,
        ]
      );

      write(
        `
          UPDATE fuel_storages
          SET current_balance = ?, updated_at = ?
          WHERE id = ?
        `,
        [nextBalance, timestamp, storageId]
      );

      if (linkedFuelProduct) {
        createInventoryMovementRecord({
          productId: linkedFuelProduct.id,
          type: type === "ENTRY" ? "IN" : "OUT",
          quantity,
          balanceAfter: nextBalance,
          document: type === "ENTRY" ? "ENTRADA-OPERACIONAL-COMBUSTIVEL" : "ABASTECIMENTO-OPERACIONAL",
          fuelKind: storage.fuel_kind,
          unitCost: mirroredUnitCost,
          totalCost: mirroredTotalCost,
          notes:
            type === "EXIT"
              ? [notes, plate ? `Abastecimento operacional da placa ${plate}` : ""].filter(Boolean).join(" | ")
              : [notes, "Entrada registrada no modulo operacional de combustivel."].filter(Boolean).join(" | "),
          sourceType: "FUEL_RECORD",
          sourceId: recordId,
          occurredAt,
          createdBy: req.user.id,
          createdAt: timestamp,
        });

        write(
          `
            UPDATE inventory_products
            SET current_stock = ?, updated_at = ?
            WHERE id = ?
          `,
          [nextBalance, timestamp, linkedFuelProduct.id]
        );
      }

      logAction(req.user, "CREATE_FUEL_RECORD", "FUEL", recordId, {
        storageId,
        storageName: storage.name,
        productId: linkedFuelProduct ? Number(linkedFuelProduct.id) : null,
        fuelKind: storage.fuel_kind,
        vehicleId: relatedVehicleId,
        type,
        plate,
        quantity,
        odometerKm,
        balanceBefore: currentBalance,
        balanceAfter: nextBalance,
      });
    });

    return res.status(201).json({
      item: queryFuelRecords().find((item) => item.id === recordId),
    });
  });

  app.get("/api/schedules", requireAuth, (req, res) => {
    const selectedDate = normalizeText(req.query.date || todayDate());
    const day = queryScheduleDayByDate(selectedDate);
    const history = queryScheduleHistory({
      date: req.query.historyDate,
      from: req.query.historyFrom,
      to: req.query.historyTo,
      vehicle: req.query.plate,
      driver: req.query.driver,
    });

    return res.json({
      selectedDate,
      day,
      items: day?.entries || [],
      history,
      suggestions: queryScheduleSuggestions(),
    });
  });

  app.get("/api/schedules/:id", requireAuth, (req, res) => {
    const day = queryScheduleDayById(req.params.id);
    if (!day) {
      return sendError(res, 404, "Escala nao encontrada.");
    }

    return res.json({ day });
  });

  app.post("/api/schedules", requireAuth, (req, res) => {
    try {
      const payload = buildScheduleDayPayload(req.body, req.user);
      const existingDay = queryScheduleDayByDate(payload.scheduledDate);

      if (existingDay) {
        return res.status(409).json({
          message: "Ja existe uma escala salva para esta data.",
          day: existingDay,
        });
      }

      const createdDay = saveScheduleDay(req.body, req.user);
      logAction(req.user, "CREATE_SCHEDULE_DAY", "SCHEDULE_DAY", createdDay.id, {
        scheduledDate: createdDay.scheduledDate,
        totalLines: createdDay.totals.lines,
        totalVehicles: createdDay.totals.vehicles,
      });

      return res.status(201).json({
        day: createdDay,
        items: createdDay.entries,
      });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.put("/api/schedules/:id", requireAuth, (req, res) => {
    const scheduleDayId = Number(req.params.id);
    const existing = get("SELECT * FROM schedule_days WHERE id = ?", [scheduleDayId]);

    if (!existing || !scheduleDayId) {
      return sendError(res, 404, "Escala nao encontrada.");
    }

    try {
      const payload = buildScheduleDayPayload(req.body, req.user, existing);
      const conflictDay = queryScheduleDayByDate(payload.scheduledDate);

      if (conflictDay && Number(conflictDay.id) !== scheduleDayId) {
        return res.status(409).json({
          message: "Ja existe outra escala salva para esta data.",
          day: conflictDay,
        });
      }

      const updatedDay = saveScheduleDay(req.body, req.user, existing);
      logAction(req.user, "UPDATE_SCHEDULE_DAY", "SCHEDULE_DAY", scheduleDayId, {
        scheduledDate: updatedDay.scheduledDate,
        totalLines: updatedDay.totals.lines,
        totalVehicles: updatedDay.totals.vehicles,
      });

      return res.json({
        day: updatedDay,
        items: updatedDay.entries,
      });
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  });

  app.get("/api/fines", requireAuth, (req, res) => {
    res.json({ items: queryFines() });
  });

  app.post("/api/fines", requireAuth, (req, res) => {
    const fineDate = normalizeText(req.body.fineDate);
    const plate = normalizePlate(req.body.plate);
    const driver = normalizeText(req.body.driver);
    const status = normalizeFineStatus(req.body.status, "OPEN");
    const amount = toNumber(req.body.amount);
    const notes = normalizeText(req.body.notes);
    const documentName = normalizeText(req.body.documentName || req.body.document);
    const documentUrl = normalizeText(req.body.documentUrl || req.body.attachmentUrl);

    if (!fineDate || !plate || !driver) {
      return sendError(res, 400, "Data, placa e condutor sao obrigatorios.");
    }

    const fineId = insert(
      `
        INSERT INTO fines (
          fine_date, plate, driver, status, amount, notes, document_name, document_url, created_by, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [fineDate, plate, driver, status, amount, notes, documentName, documentUrl, req.user.id, nowIso(), nowIso()]
    );

    logAction(req.user, "CREATE_FINE", "FINE", fineId, { fineDate, plate, driver, status, documentName });
    return res.status(201).json({ item: queryFines().find((item) => item.id === fineId) });
  });

  app.put("/api/fines/:id", requireAuth, (req, res) => {
    const fineId = Number(req.params.id);
    const existing = get("SELECT * FROM fines WHERE id = ?", [fineId]);

    if (!existing) {
      return sendError(res, 404, "Multa nao encontrada.");
    }

    const fineDate = normalizeText(req.body.fineDate || existing.fine_date);
    const plate = normalizePlate(req.body.plate || existing.plate);
    const driver = normalizeText(req.body.driver || existing.driver);
    const status = normalizeFineStatus(req.body.status || existing.status, "OPEN");
    const amount = toNumber(req.body.amount ?? existing.amount);
    const notes = normalizeText(req.body.notes || existing.notes);
    const documentName = normalizeText(req.body.documentName || req.body.document || existing.document_name);
    const documentUrl = normalizeText(req.body.documentUrl || req.body.attachmentUrl || existing.document_url);

    write(
      `
        UPDATE fines
        SET fine_date = ?, plate = ?, driver = ?, status = ?, amount = ?, notes = ?, document_name = ?, document_url = ?, updated_at = ?
        WHERE id = ?
      `,
      [fineDate, plate, driver, status, amount, notes, documentName, documentUrl, nowIso(), fineId]
    );

    logAction(req.user, "UPDATE_FINE", "FINE", fineId, { fineDate, plate, driver, status, documentName });
    return res.json({ item: queryFines().find((item) => item.id === fineId) });
  });

  app.get("/api/checklists", requireAuth, (req, res) => {
    res.json({ items: queryChecklists() });
  });

  app.post("/api/checklists", requireAuth, (req, res) => {
    const vehicle = normalizeText(req.body.vehicle);
    const checklistDate = normalizeText(req.body.checklistDate);
    const problems = normalizeText(req.body.problems);
    const checklistPayload = buildChecklistStoragePayload(req.body);
    const status = normalizeChecklistStatus(req.body.status, checklistPayload.overallStatus);

    if (!vehicle || !checklistDate || !checklistPayload.itemsDetailed.length) {
      return sendError(res, 400, "Veiculo, data e itens do checklist sao obrigatorios.");
    }

    const checklistId = insert(
      `
        INSERT INTO checklists (vehicle, checklist_date, items_json, problems, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        vehicle,
        checklistDate,
        checklistPayload.storedJson,
        problems,
        status,
        req.user.id,
        nowIso(),
        nowIso(),
      ]
    );

    logAction(req.user, "CREATE_CHECKLIST", "CHECKLIST", checklistId, {
      vehicle,
      checklistDate,
      status,
      driverName: checklistPayload.meta.driverName,
      checklistType: checklistPayload.meta.checklistType,
    });

    const createdChecklist =
      queryChecklists().find((item) => String(item.id) === String(checklistId)) ||
      queryChecklists().find(
        (item) => item.vehicle === vehicle && item.checklistDate === checklistDate
      ) ||
      null;

    return res.status(201).json({
      item: createdChecklist,
    });
  });

  app.put("/api/checklists/:id", requireAuth, (req, res) => {
    const checklistId = Number(req.params.id);
    const existing = get("SELECT * FROM checklists WHERE id = ?", [checklistId]);

    if (!existing) {
      return sendError(res, 404, "Checklist nao encontrado.");
    }

    const vehicle = normalizeText(req.body.vehicle || existing.vehicle);
    const checklistDate = normalizeText(req.body.checklistDate || existing.checklist_date);
    const problems = normalizeText(req.body.problems || existing.problems);
    const checklistPayload = buildChecklistStoragePayload(req.body, existing.items_json);
    const status = normalizeChecklistStatus(req.body.status || existing.status, checklistPayload.overallStatus);

    write(
      `
        UPDATE checklists
        SET vehicle = ?, checklist_date = ?, items_json = ?, problems = ?, status = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        vehicle,
        checklistDate,
        checklistPayload.storedJson,
        problems,
        status,
        nowIso(),
        checklistId,
      ]
    );

    logAction(req.user, "UPDATE_CHECKLIST", "CHECKLIST", checklistId, {
      vehicle,
      checklistDate,
      status,
      driverName: checklistPayload.meta.driverName,
      checklistType: checklistPayload.meta.checklistType,
    });

    return res.json({
      item: queryChecklists().find((item) => item.id === checklistId),
    });
  });

  app.get("/api/emails", requireAuth, (req, res) => {
    res.json({ items: queryEmails() });
  });

  app.post("/api/emails/process", requireAuth, (req, res) => {
    try {
      const payload = req.body.rawEml
        ? { ...parseEml(req.body.rawEml), xmlContent: req.body.xmlContent || "" }
        : req.body;
      const analyzed = analyzeEmailPayload(payload);

      let linkedNoteId = null;
      let detectedSupplier = "";
      let classification = analyzed.spamScore >= 60 ? "SPAM" : "REVIEW";
      let status = analyzed.spamScore >= 60 ? "SPAM" : "RECEIVED";
      let emailId = null;

      transaction(() => {
        if (analyzed.hasXml && analyzed.xmlContent && analyzed.spamScore < 60) {
          const parsedInvoice = parseInvoiceXml(analyzed.xmlContent, "email.xml");
          detectedSupplier = parsedInvoice.supplierName;
          const note = createOrUpdateNote(
            {
              supplierName: parsedInvoice.supplierName,
              totalValue: parsedInvoice.totalValue,
              danfe: parsedInvoice.danfe,
              xmlKey: parsedInvoice.xmlKey,
              issueDate: parsedInvoice.issueDate,
              status: "NEW",
              source: "EMAIL",
            },
            req.user,
            { source: "EMAIL", skipLog: true, preferExistingWorkflow: true }
          );
          linkedNoteId = note.id;
          classification = note.category;
          status = "XML_IDENTIFIED";
        }

        emailId = insert(
          `
            INSERT INTO emails (
              sender, subject, body, received_at, spam_score, spam_reason, has_xml, detected_supplier,
              classification, status, linked_note_id, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            analyzed.sender || "nao-informado",
            analyzed.subject,
            analyzed.body,
            analyzed.receivedAt,
            analyzed.spamScore,
            analyzed.spamReason,
            analyzed.hasXml ? 1 : 0,
            detectedSupplier || null,
            classification,
            status,
            linkedNoteId,
            req.user.id,
            nowIso(),
          ]
        );

        logAction(req.user, "PROCESS_EMAIL", "EMAIL", emailId, {
          hasXml: analyzed.hasXml,
          spamScore: analyzed.spamScore,
          linkedNoteId,
        });
      });

      return res.status(201).json({
        item: queryEmails().find((item) => item.id === emailId) || null,
      });
    } catch (error) {
      return sendError(res, 400, `Falha ao processar email: ${error.message}`);
    }
  });

  app.get("/api/admin/users", requireRoles(["ADMIN"]), (req, res) => {
    return res.json({ items: queryAdminUsers() });
  });

  app.post("/api/admin/users", requireRoles(["ADMIN"]), (req, res) => {
    const name = normalizeText(req.body.name);
    const email = normalizeText(req.body.email).toLowerCase();
    const role = normalizeRole(req.body.role, "OPERATIONAL");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email) {
      return sendError(res, 400, "Informe nome, email e perfil.");
    }

    if (!emailPattern.test(email)) {
      return sendError(res, 400, "Informe um email valido.");
    }

    const existingUser = get("SELECT id FROM users WHERE lower(email) = lower(?)", [email]);
    if (existingUser) {
      return sendError(res, 409, "Ja existe um usuario cadastrado com este email.");
    }

    let userId = 0;
    const timestamp = nowIso();

    transaction(() => {
      userId = insert(
        `
          INSERT INTO users (
            name, email, password_hash, role, invite_code_used, active, status, is_system, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?, ?)
        `,
        [name, email, createProvisioningPasswordHash(), role, "ADMIN-PROVISIONED", USER_STATUSES.PENDING, timestamp, timestamp]
      );

      logAction(req.user, "CREATE_USER", "USER", userId, {
        email,
        role,
        status: USER_STATUSES.PENDING,
      });
    });

    return res.status(201).json({
      item: queryAdminUsers().find((item) => item.id === userId) || null,
    });
  });

  app.put("/api/admin/users/:id", requireRoles(["ADMIN"]), (req, res) => {
    const userId = Number(req.params.id);
    const existing = getManagedUser(userId);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!existing) {
      return sendError(res, 404, "Usuario nao encontrado.");
    }

    const name = normalizeText(req.body.name || existing.name);
    const email = normalizeText(req.body.email || existing.email).toLowerCase();
    const role = normalizeRole(req.body.role || existing.role, existing.role);

    if (!name || !email) {
      return sendError(res, 400, "Informe nome, email e perfil.");
    }

    if (!emailPattern.test(email)) {
      return sendError(res, 400, "Informe um email valido.");
    }

    const emailInUse = get("SELECT id FROM users WHERE lower(email) = lower(?) AND id <> ?", [email, userId]);
    if (emailInUse) {
      return sendError(res, 409, "Ja existe um usuario cadastrado com este email.");
    }

    write(
      `
        UPDATE users
        SET name = ?, email = ?, role = ?, updated_at = ?
        WHERE id = ?
      `,
      [name, email, role, nowIso(), userId]
    );

    logAction(req.user, "UPDATE_USER", "USER", userId, {
      email,
      role,
      status: resolveUserStatus(existing),
    });

    return res.json({
      item: queryAdminUsers().find((item) => item.id === userId) || null,
    });
  });

  app.post("/api/admin/users/:id/activation-code", requireRoles(["ADMIN"]), (req, res) => {
    const userId = Number(req.params.id);
    const existing = getManagedUser(userId);
    const purpose = normalizeText(req.body.purpose).toUpperCase() === "RESET_PASSWORD" ? "RESET_PASSWORD" : "ACTIVATION";

    if (!existing) {
      return sendError(res, 404, "Usuario nao encontrado.");
    }

    if (resolveUserStatus(existing) === USER_STATUSES.BLOCKED) {
      return sendError(res, 400, "Desbloqueie o usuario antes de emitir um novo codigo.");
    }

    let issuedCode = null;

    transaction(() => {
      invalidateActivationCodes(userId);
      deleteUserSessions(userId);
      write(
        `
          UPDATE users
          SET password_hash = ?, status = ?, active = 0, updated_at = ?
          WHERE id = ?
        `,
        [createProvisioningPasswordHash(), USER_STATUSES.PENDING, nowIso(), userId]
      );
      issuedCode = issueActivationCode(userId, req.user.id, purpose);
      logAction(
        req.user,
        purpose === "RESET_PASSWORD" ? "ISSUE_PASSWORD_RESET_CODE" : "ISSUE_ACTIVATION_CODE",
        "USER",
        userId,
        {
          purpose,
          expiresAt: issuedCode.expiresAt,
        }
      );
    });

    return res.json({
      item: queryAdminUsers().find((item) => item.id === userId) || null,
      code: issuedCode.code,
      purpose,
      expiresAt: issuedCode.expiresAt,
    });
  });

  app.post("/api/admin/users/:id/status", requireRoles(["ADMIN"]), (req, res) => {
    const userId = Number(req.params.id);
    const existing = getManagedUser(userId);
    const nextStatus = normalizeText(req.body.status).toUpperCase();

    if (!existing) {
      return sendError(res, 404, "Usuario nao encontrado.");
    }

    if (nextStatus !== USER_STATUSES.ACTIVE && nextStatus !== USER_STATUSES.BLOCKED) {
      return sendError(res, 400, "Status invalido.");
    }

    if (nextStatus === USER_STATUSES.ACTIVE && resolveUserStatus(existing) === USER_STATUSES.PENDING) {
      return sendError(res, 400, "Para liberar este usuario, gere um codigo e conclua a ativacao.");
    }

    transaction(() => {
      write(
        `
          UPDATE users
          SET status = ?, active = ?, updated_at = ?
          WHERE id = ?
        `,
        [nextStatus, nextStatus === USER_STATUSES.ACTIVE ? 1 : 0, nowIso(), userId]
      );

      if (nextStatus === USER_STATUSES.BLOCKED) {
        invalidateActivationCodes(userId);
        deleteUserSessions(userId);
      }

      logAction(
        req.user,
        nextStatus === USER_STATUSES.BLOCKED ? "BLOCK_USER" : "UNBLOCK_USER",
        "USER",
        userId,
        { status: nextStatus }
      );
    });

    return res.json({
      item: queryAdminUsers().find((item) => item.id === userId) || null,
    });
  });

  app.get("/api/admin/invites", requireRoles(["ADMIN"]), (req, res) => {
    return sendError(res, 410, "Convites publicos foram desativados.");
  });

  app.post("/api/admin/invites", requireRoles(["ADMIN"]), (req, res) => {
    return sendError(res, 410, "Convites publicos foram desativados.");
  });

  app.get("/api/admin/logs", requireRoles(["ADMIN"]), (req, res) => {
    const limit = Math.min(Number(req.query.limit || 100), 300);
    const items = all(
      `
        SELECT *
        FROM action_logs
      ORDER BY created_at DESC, id DESC
      LIMIT ?
      `,
      [limit]
    ).map((row) => {
      const relatedUser = row.user_id ? get("SELECT name, is_system FROM users WHERE id = ?", [row.user_id]) : null;
      const relatedUserIsSystem = isSystemUser(relatedUser);
      return {
        id: Number(row.id),
        userId: row.user_id && !relatedUserIsSystem ? Number(row.user_id) : null,
        userName: relatedUserIsSystem ? "Conta interna" : row.user_name,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        details: redactSensitiveDetails(safeJsonParse(row.details, row.details)),
        createdAt: row.created_at,
      };
    });

    return res.json({ items });
  });

  app.use(express.static(publicDir));

  app.get("*", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  app.use((error, req, res, next) => {
    console.error(error);
    return sendError(res, 500, "Erro interno do servidor.");
  });

  app.listen(PORT, () => {
    const publicAppInfo = resolvePublicAppInfo(PORT);
    if (publicAppInfo.url) {
      if (publicAppInfo.source === "APP_URL") {
        console.log(`Dominio publico configurado: ${publicAppInfo.url}`);
      } else if (publicAppInfo.source === "RAILWAY_PUBLIC_DOMAIN") {
        console.log(`Dominio publico detectado pela Railway: ${publicAppInfo.url}`);
      } else {
        console.log(`Sistema logistica disponivel em ${publicAppInfo.url}`);
      }
    } else {
      console.log(`Sistema logistica iniciado na porta ${PORT}`);
      console.log("Dominio publico nao configurado. Defina APP_URL no deploy para deixar a URL explicita.");
    }
    if (DB_PATH_SOURCE === "RAILWAY_VOLUME_MOUNT_PATH") {
      console.log(`SQLite persistido automaticamente no volume Railway em ${DB_PATH}`);
    } else if (DB_PATH_SOURCE === "DB_PATH") {
      console.log(`SQLite em ${DB_PATH} (definido por DB_PATH)`);
    } else {
      console.log(`SQLite em ${DB_PATH}`);
    }
  });
}

start().catch((error) => {
  console.error("Falha ao iniciar o sistema:", error);
  process.exit(1);
});
