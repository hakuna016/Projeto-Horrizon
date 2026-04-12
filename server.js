const path = require("path");
const express = require("express");
const crypto = require("crypto");
const { DB_PATH, initDatabase, get, all, write, insert, transaction } = require("./src/database");
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

const FINE_STATUS_ALIASES = {
  aberta: "OPEN",
  open: "OPEN",
  contestando: "CONTESTING",
  contesting: "CONTESTING",
  paga: "PAID",
  paid: "PAID",
};

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

function normalizeFineStatus(value, fallback = "OPEN") {
  return normalizeEnum(value, FINE_STATUS_ALIASES, fallback);
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
      status: "OK",
    };
  }

  const label = normalizeText(item?.label || item?.name || item?.title);
  return {
    key: normalizeKey(item?.key || label) || `item_${index + 1}`,
    label: label || `Item ${index + 1}`,
    description: normalizeText(item?.description),
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

function normalizeDashboardDays(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return DASHBOARD_PERIODS.includes(parsed) ? parsed : 30;
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

function normalizeChecklistStatus(value, fallback = "OPEN") {
  return normalizeEnum(value, CHECKLIST_STATUS_ALIASES, fallback);
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
      details ? JSON.stringify(details) : null,
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

function queryProducts(search = "") {
  let sql = "SELECT * FROM inventory_products WHERE active = 1";
  const params = [];

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
    minStock: Number(row.min_stock || 0),
    currentStock: Number(row.current_stock || 0),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lowStock: Number(row.current_stock || 0) <= Number(row.min_stock || 0),
  }));
}

function queryInventoryMovements(filters = {}) {
  let sql = `
    SELECT m.*, p.name AS product_name, p.unit AS product_unit, u.name AS user_name
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

  if (filters.from) {
    sql += " AND m.occurred_at >= ?";
    params.push(filters.from);
  }

  if (filters.to) {
    sql += " AND m.occurred_at <= ?";
    params.push(filters.to);
  }

  sql += " ORDER BY m.occurred_at DESC, m.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    productId: Number(row.product_id),
    productName: row.product_name,
    productUnit: row.product_unit,
    type: row.type,
    quantity: Number(row.quantity || 0),
    balanceAfter: Number(row.balance_after || 0),
    notes: row.notes,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    userName: row.user_name || "",
  }));
}

function queryFuelRecords(filters = {}) {
  let sql = `
    SELECT f.*, u.name AS user_name
    FROM fuel_records f
    LEFT JOIN users u ON u.id = f.created_by
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
  }));
}

function queryFuelStorages() {
  return all(
    `
      SELECT *
      FROM fuel_storages
      WHERE active = 1
      ORDER BY fuel_kind ASC, name ASC
    `
  ).map((row) => ({
    id: Number(row.id),
    name: row.name,
    fuelKind: row.fuel_kind,
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

function queryFuelAnalytics(filters = {}, fuelOverview = queryFuelOverview()) {
  const selectedPlate = normalizeText(filters.plate).toUpperCase();
  const periodDays = normalizeDashboardDays(filters.days);
  const dayRange = buildDashboardDayRange(periodDays);
  const startDay = dayRange[0];
  const endDay = dayRange[dayRange.length - 1];
  const availablePlates = all(
    `
      SELECT DISTINCT plate
      FROM fuel_records
      WHERE trim(COALESCE(plate, '')) <> ''
      ORDER BY plate ASC
    `
  ).map((row) => row.plate);

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
      occurredDay <= endDay &&
      odometerKm > previous.odometerKm &&
      quantity > 0
    ) {
      const distanceKm = odometerKm - previous.odometerKm;
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
        kmPerLiter: distanceKm / quantity,
      });
      efficiencyByPlate.set(plate, currentStats);
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

  let selectedVehicle =
    (selectedPlate && efficiencyRanking.find((item) => item.plate === selectedPlate)) ||
    efficiencyRanking[0] ||
    null;

  if (!selectedVehicle && selectedPlate) {
    const latestRecord = get(
      `
        SELECT plate, odometer_km, quantity, fuel_kind, occurred_at
        FROM fuel_records
        WHERE type = 'EXIT' AND plate = ?
        ORDER BY occurred_at DESC, id DESC
        LIMIT 1
      `,
      [selectedPlate]
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
        AND substr(occurred_at, 1, 10) >= ?
        AND substr(occurred_at, 1, 10) <= ?
        ${filteredPlateSql}
      ORDER BY occurred_at DESC, id DESC
      LIMIT 6
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

  return {
    periodDays,
    selectedPlate,
    availablePlates,
    consumptionSeries,
    totalConsumptionLiters,
    averageDailyConsumption: periodDays ? totalConsumptionLiters / periodDays : 0,
    peakConsumption,
    efficiencyRanking,
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

function querySchedules(date) {
  let sql = `
    SELECT s.*, u.name AS user_name
    FROM schedules s
    LEFT JOIN users u ON u.id = s.created_by
    WHERE 1 = 1
  `;
  const params = [];

  if (date) {
    sql += " AND s.scheduled_date = ?";
    params.push(date);
  }

  sql += " ORDER BY s.scheduled_date ASC, s.id DESC";

  return all(sql, params).map((row) => ({
    id: Number(row.id),
    scheduledDate: row.scheduled_date,
    vehicle: row.vehicle,
    location: row.location || "",
    driver: row.driver,
    assistant: row.assistant,
    responsibleName: row.responsible_name || "",
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name || "",
  }));
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

function createInviteCode(role) {
  const prefix = role === "ADMIN" ? "ADM" : role === "MANAGER" ? "GER" : "OPE";
  return `${prefix}-${new Date().getFullYear()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
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
        SELECT s.*, u.id AS user_id, u.name, u.email, u.role, u.active
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?
      `,
      [hashToken(sessionToken)]
    );

    if (!session || !Number(session.active) || new Date(session.expires_at) <= new Date()) {
      res.setHeader("Set-Cookie", buildClearedSessionCookie());
      return next();
    }

    req.user = {
      id: Number(session.user_id),
      name: session.name,
      email: session.email,
      role: session.role,
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

    const user = get("SELECT * FROM users WHERE lower(email) = lower(?) AND active = 1", [email]);

    if (!user || !verifyPassword(password, user.password_hash)) {
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

  app.post("/api/auth/register", (req, res) => {
    const name = normalizeText(req.body.name);
    const email = normalizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const inviteCode = normalizeText(req.body.inviteCode).toUpperCase();

    if (!name || !email || !password || !inviteCode) {
      return sendError(res, 400, "Preencha nome, email, senha e codigo de convite.");
    }

    if (password.length < 6) {
      return sendError(res, 400, "A senha precisa ter pelo menos 6 caracteres.");
    }

    const existingUser = get("SELECT id FROM users WHERE lower(email) = lower(?)", [email]);
    if (existingUser) {
      return sendError(res, 409, "Ja existe um usuario cadastrado com este email.");
    }

    const invite = get(
      "SELECT * FROM invite_codes WHERE code = ? AND active = 1 AND used_by IS NULL",
      [inviteCode]
    );

    if (!invite) {
      return sendError(res, 400, "Codigo de convite invalido ou ja utilizado.");
    }

    const createdAt = nowIso();
    let userId = 0;

    transaction(() => {
      userId = insert(
        `
          INSERT INTO users (name, email, password_hash, role, invite_code_used, active, created_at)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `,
        [name, email, hashPassword(password), invite.role, inviteCode, createdAt]
      );

      write(
        `
          UPDATE invite_codes
          SET used_by = ?, used_at = ?
          WHERE id = ?
        `,
        [userId, createdAt, invite.id]
      );

      logAction(
        { id: userId, name, email, role: invite.role },
        "REGISTER_USER",
        "USER",
        userId,
        { role: invite.role, inviteCode }
      );
    });

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    insert(
      `
        INSERT INTO sessions (user_id, token_hash, created_at, expires_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      [userId, hashToken(token), createdAt, expiresAt, createdAt]
    );

    res.setHeader("Set-Cookie", buildSessionCookie(token, expiresAt));

    return res.json({
      user: {
        id: userId,
        name,
        email,
        role: invite.role,
      },
    });
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
    const periodDays = normalizeDashboardDays(req.query.days);
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
    const fuelOverview = queryFuelOverview();
    const fuelAnalytics = queryFuelAnalytics(
      { days: periodDays, plate: selectedPlate },
      fuelOverview
    );
    const lowStock = queryProducts().filter((item) => item.lowStock);
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

    const alerts = [
      ...lowStock.slice(0, 5).map((item) => ({
        type: "LOW_STOCK",
        title: `Estoque minimo: ${item.name}`,
        description: `Saldo ${item.currentStock} ${item.unit} | minimo ${item.minStock} ${item.unit}`,
      })),
      ...agingNotes.map((item) => ({
        type: "NOTE_PENDING",
        title: `Nota pendente: ${item.supplier_name}`,
        description: `Status ${item.status} desde ${new Date(item.updated_at).toLocaleString("pt-BR")}`,
      })),
    ];

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
        periodFuelConsumption: Number(fuelAnalytics.totalConsumptionLiters || 0),
        averageDailyConsumption: Number(fuelAnalytics.averageDailyConsumption || 0),
        bestKmPerLiter: Number(fuelAnalytics.efficiencyRanking[0]?.kmPerLiter || 0),
        monitoredVehicles: Number(fuelAnalytics.efficiencyRanking.length || 0),
      },
      alerts,
      todaySchedules,
      analytics: fuelAnalytics,
    });
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

  app.get("/api/products", requireAuth, (req, res) => {
    res.json({ items: queryProducts(req.query.search || "") });
  });

  app.get("/api/products/barcode/:barcode", requireAuth, (req, res) => {
    const barcode = normalizeText(req.params.barcode);
    const product = get(
      "SELECT * FROM inventory_products WHERE barcode = ? AND active = 1 LIMIT 1",
      [barcode]
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
        minStock: Number(product.min_stock || 0),
        currentStock: Number(product.current_stock || 0),
      },
    });
  });

  app.post("/api/products", requireAuth, (req, res) => {
    const name = normalizeText(req.body.name);
    const unit = normalizeText(req.body.unit || "UN").toUpperCase();
    const barcode = normalizeText(req.body.barcode);
    const minStock = toNumber(req.body.minStock);
    const initialStock = toNumber(req.body.initialStock);

    if (!name) {
      return sendError(res, 400, "Nome do produto e obrigatorio.");
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
          INSERT INTO inventory_products (name, unit, barcode, min_stock, current_stock, active, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        `,
        [name, unit, barcode || null, minStock, initialStock, req.user.id, timestamp, timestamp]
      );

      if (initialStock > 0) {
        insert(
          `
            INSERT INTO inventory_movements (product_id, type, quantity, balance_after, notes, occurred_at, created_by, created_at)
            VALUES (?, 'IN', ?, ?, ?, ?, ?, ?)
          `,
          [
            productId,
            initialStock,
            initialStock,
            "Saldo inicial do produto",
            timestamp,
            req.user.id,
            timestamp,
          ]
        );
      }

      logAction(req.user, "CREATE_PRODUCT", "PRODUCT", productId, {
        name,
        barcode,
        initialStock,
      });
    });

    return res.status(201).json({ item: queryProducts().find((item) => item.id === productId) });
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
    const minStock = toNumber(req.body.minStock ?? existing.min_stock);

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
        SET name = ?, unit = ?, barcode = ?, min_stock = ?, updated_at = ?
        WHERE id = ?
      `,
      [name, unit, barcode || null, minStock, nowIso(), productId]
    );

    logAction(req.user, "UPDATE_PRODUCT", "PRODUCT", productId, { name, barcode, minStock });
    return res.json({ item: queryProducts().find((item) => item.id === productId) });
  });

  app.get("/api/inventory/movements", requireAuth, (req, res) => {
    res.json({ items: queryInventoryMovements(req.query) });
  });

  app.post("/api/inventory/movements", requireAuth, (req, res) => {
    const productId = Number(req.body.productId);
    const type = normalizeInventoryMovement(req.body.type, "IN");
    const quantity = toNumber(req.body.quantity);
    const notes = normalizeText(req.body.notes);
    const occurredAt = normalizeText(req.body.occurredAt) || nowIso();

    if (!productId || quantity <= 0) {
      return sendError(res, 400, "Informe produto e quantidade valida.");
    }

    const product = get("SELECT * FROM inventory_products WHERE id = ? AND active = 1", [productId]);
    if (!product) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    const currentStock = Number(product.current_stock || 0);
    const nextStock = type === "IN" ? currentStock + quantity : currentStock - quantity;

    if (nextStock < 0) {
      return sendError(res, 400, "A saida nao pode deixar o estoque negativo.");
    }

    let movementId = 0;

    transaction(() => {
      movementId = insert(
        `
          INSERT INTO inventory_movements (product_id, type, quantity, balance_after, notes, occurred_at, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [productId, type, quantity, nextStock, notes, occurredAt, req.user.id, nowIso()]
      );

      write(
        `
          UPDATE inventory_products
          SET current_stock = ?, updated_at = ?
          WHERE id = ?
        `,
        [nextStock, nowIso(), productId]
      );

      logAction(req.user, "CREATE_INVENTORY_MOVEMENT", "INVENTORY", movementId, {
        productId,
        type,
        quantity,
        balanceAfter: nextStock,
      });
    });

    return res.status(201).json({
      item: queryInventoryMovements({ productId }).find((item) => item.id === movementId),
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
    const plate = normalizeText(req.body.plate).toUpperCase();
    const quantity = toNumber(req.body.quantity);
    const rawOdometer = normalizeText(req.body.odometerKm);
    const odometerKm = rawOdometer ? toNumber(rawOdometer) : null;
    const notes = normalizeText(req.body.notes);
    const occurredAt = normalizeText(req.body.occurredAt) || nowIso();

    if (!storageId || !plate || quantity <= 0) {
      return sendError(res, 400, "Informe estoque, placa e quantidade valida.");
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

    const currentBalance = Number(storage.current_balance || 0);
    const nextBalance = type === "ENTRY" ? currentBalance + quantity : currentBalance - quantity;

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
            storage_id, storage_name, fuel_kind, type, plate, quantity, odometer_km,
            balance_before, balance_after, notes, occurred_at, created_by, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          storageId,
          storage.name,
          storage.fuel_kind,
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

      logAction(req.user, "CREATE_FUEL_RECORD", "FUEL", recordId, {
        storageId,
        storageName: storage.name,
        fuelKind: storage.fuel_kind,
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
    res.json({ items: querySchedules(req.query.date || "") });
  });

  app.post("/api/schedules", requireAuth, (req, res) => {
    const scheduledDate = normalizeText(req.body.scheduledDate);
    const vehicle = normalizeText(req.body.vehicle);
    const location = normalizeText(req.body.location);
    const driver = normalizeText(req.body.driver);
    const assistant = normalizeText(req.body.assistant);
    const responsibleName = normalizeText(req.body.responsibleName || req.user.name);
    const notes = normalizeText(req.body.notes);

    if (!scheduledDate || !vehicle || !driver) {
      return sendError(res, 400, "Data, veiculo e motorista sao obrigatorios.");
    }

    const scheduleId = insert(
      `
        INSERT INTO schedules (
          scheduled_date, vehicle, location, driver, assistant, responsible_name, notes, created_by, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        scheduledDate,
        vehicle,
        location,
        driver,
        assistant,
        responsibleName,
        notes,
        req.user.id,
        nowIso(),
        nowIso(),
      ]
    );

    logAction(req.user, "CREATE_SCHEDULE", "SCHEDULE", scheduleId, {
      scheduledDate,
      vehicle,
      location,
      driver,
      responsibleName,
    });

    const createdSchedule =
      querySchedules().find((item) => String(item.id) === String(scheduleId)) ||
      querySchedules().find(
        (item) => item.scheduledDate === scheduledDate && item.vehicle === vehicle && item.driver === driver
      ) ||
      null;

    return res.status(201).json({
      item: createdSchedule,
    });
  });

  app.put("/api/schedules/:id", requireAuth, (req, res) => {
    const scheduleId = Number(req.params.id);
    const existing = get("SELECT * FROM schedules WHERE id = ?", [scheduleId]);

    if (!existing) {
      return sendError(res, 404, "Escala nao encontrada.");
    }

    const scheduledDate = normalizeText(req.body.scheduledDate || existing.scheduled_date);
    const vehicle = normalizeText(req.body.vehicle || existing.vehicle);
    const location = normalizeText(req.body.location || existing.location);
    const driver = normalizeText(req.body.driver || existing.driver);
    const assistant = normalizeText(req.body.assistant || existing.assistant);
    const responsibleName = normalizeText(req.body.responsibleName || existing.responsible_name);
    const notes = normalizeText(req.body.notes || existing.notes);

    write(
      `
        UPDATE schedules
        SET scheduled_date = ?, vehicle = ?, location = ?, driver = ?, assistant = ?, responsible_name = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      [scheduledDate, vehicle, location, driver, assistant, responsibleName, notes, nowIso(), scheduleId]
    );

    logAction(req.user, "UPDATE_SCHEDULE", "SCHEDULE", scheduleId, {
      scheduledDate,
      vehicle,
      location,
      driver,
      responsibleName,
    });

    return res.json({ item: querySchedules().find((item) => item.id === scheduleId) });
  });

  app.get("/api/fines", requireAuth, (req, res) => {
    res.json({ items: queryFines() });
  });

  app.post("/api/fines", requireAuth, (req, res) => {
    const fineDate = normalizeText(req.body.fineDate);
    const plate = normalizeText(req.body.plate).toUpperCase();
    const driver = normalizeText(req.body.driver);
    const status = normalizeFineStatus(req.body.status, "OPEN");
    const amount = toNumber(req.body.amount);
    const notes = normalizeText(req.body.notes);

    if (!fineDate || !plate || !driver) {
      return sendError(res, 400, "Data, placa e condutor sao obrigatorios.");
    }

    const fineId = insert(
      `
        INSERT INTO fines (fine_date, plate, driver, status, amount, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [fineDate, plate, driver, status, amount, notes, req.user.id, nowIso(), nowIso()]
    );

    logAction(req.user, "CREATE_FINE", "FINE", fineId, { fineDate, plate, driver, status });
    return res.status(201).json({ item: queryFines().find((item) => item.id === fineId) });
  });

  app.put("/api/fines/:id", requireAuth, (req, res) => {
    const fineId = Number(req.params.id);
    const existing = get("SELECT * FROM fines WHERE id = ?", [fineId]);

    if (!existing) {
      return sendError(res, 404, "Multa nao encontrada.");
    }

    const fineDate = normalizeText(req.body.fineDate || existing.fine_date);
    const plate = normalizeText(req.body.plate || existing.plate).toUpperCase();
    const driver = normalizeText(req.body.driver || existing.driver);
    const status = normalizeFineStatus(req.body.status || existing.status, "OPEN");
    const amount = toNumber(req.body.amount ?? existing.amount);
    const notes = normalizeText(req.body.notes || existing.notes);

    write(
      `
        UPDATE fines
        SET fine_date = ?, plate = ?, driver = ?, status = ?, amount = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      [fineDate, plate, driver, status, amount, notes, nowIso(), fineId]
    );

    logAction(req.user, "UPDATE_FINE", "FINE", fineId, { fineDate, plate, driver, status });
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

  app.get("/api/admin/invites", requireRoles(["ADMIN"]), (req, res) => {
    const items = all(
      `
        SELECT i.*, creator.name AS created_by_name, used.name AS used_by_name
        FROM invite_codes i
        LEFT JOIN users creator ON creator.id = i.created_by
        LEFT JOIN users used ON used.id = i.used_by
        ORDER BY i.created_at DESC, i.id DESC
      `
    ).map((row) => ({
      id: Number(row.id),
      code: row.code,
      role: row.role,
      notes: row.notes,
      active: Boolean(row.active),
      createdByName: row.created_by_name || "",
      usedByName: row.used_by_name || "",
      createdAt: row.created_at,
      usedAt: row.used_at,
    }));

    return res.json({ items });
  });

  app.post("/api/admin/invites", requireRoles(["ADMIN"]), (req, res) => {
    const role = normalizeRole(req.body.role, "OPERATIONAL");
    const notes = normalizeText(req.body.notes);
    const code = createInviteCode(role);
    const timestamp = nowIso();

    const inviteId = insert(
      `
        INSERT INTO invite_codes (code, role, notes, active, created_by, created_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `,
      [code, role, notes, req.user.id, timestamp]
    );

    logAction(req.user, "CREATE_INVITE", "INVITE", inviteId, { code, role });
    return res.status(201).json({
      item: {
        id: inviteId,
        code,
        role,
        notes,
        active: true,
        createdByName: req.user.name,
        usedByName: "",
        createdAt: timestamp,
        usedAt: null,
      },
    });
  });

  app.get("/api/admin/logs", requireRoles(["ADMIN", "MANAGER"]), (req, res) => {
    const limit = Math.min(Number(req.query.limit || 100), 300);
    const items = all(
      `
        SELECT *
        FROM action_logs
        ORDER BY created_at DESC, id DESC
        LIMIT ?
      `,
      [limit]
    ).map((row) => ({
      id: Number(row.id),
      userId: row.user_id ? Number(row.user_id) : null,
      userName: row.user_name,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: safeJsonParse(row.details, row.details),
      createdAt: row.created_at,
    }));

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
    console.log(`Sistema logistica disponivel em http://localhost:${PORT}`);
    console.log(`SQLite em ${DB_PATH}`);
  });
}

start().catch((error) => {
  console.error("Falha ao iniciar o sistema:", error);
  process.exit(1);
});
