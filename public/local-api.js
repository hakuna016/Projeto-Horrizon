(function () {
  const DB_STORAGE_KEY = "horizon-browser-db-v1";
  const SESSION_STORAGE_KEY = "horizon-browser-session-v1";
  const DASHBOARD_PERIODS = [7, 15, 30, 60, 90];
  const USER_STATUSES = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    BLOCKED: "BLOCKED",
  };
  const ACTIVATION_CODE_TTL_HOURS = 24;
  const DEFAULT_MASTER_ADMIN_EMAIL = "master@horizon.internal";
  const DEFAULT_MASTER_ADMIN_NAME = "Conta interna";
  const DEFAULT_FUEL_STORAGES = [
    { name: "Estoque S-10", fuelKind: "S10" },
    { name: "Estoque S-500", fuelKind: "S500" },
  ];
  const LEGACY_PUBLIC_INVITE_CODES = new Set(["ADM-LOG-2026", "GER-LOG-2026", "OPE-LOG-2026"]);

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
    saida_: "OUT",
  };

  const FUEL_TYPE_ALIASES = {
    entry: "ENTRY",
    entrada: "ENTRY",
    exit: "EXIT",
    saida: "EXIT",
    saida_: "EXIT",
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

  const VEHICLE_FUEL_PROFILE_ALIASES = {
    s500: "S500",
    s_500: "S500",
    s10: "S10",
    s_10: "S10",
    both: "BOTH",
    ambos: "BOTH",
    ambos_combustiveis: "BOTH",
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

  let dbCache = null;
  let dbPromise = null;

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
      this.name = "ApiError";
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function todayDate() {
    const current = new Date();
    const offset = current.getTimezoneOffset();
    return new Date(current.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeKey(value) {
    return normalizeText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function toNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const normalized = String(value ?? "")
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function splitLines(value) {
    return String(value ?? "")
      .split(/\r?\n/)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function pickRecordValue(record, keys) {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
        return record[key];
      }
    }
    return "";
  }

  function padDatePart(value, length = 2) {
    return String(value).padStart(length, "0");
  }

  function buildLocalDateTimeString(year, month, day, hour = 0, minute = 0, second = 0) {
    return `${padDatePart(year, 4)}-${padDatePart(month)}-${padDatePart(day)}T${padDatePart(hour)}:${padDatePart(
      minute
    )}:${padDatePart(second)}`;
  }

  function parseExcelDateCode(value, date1904 = false) {
    if (!Number.isFinite(value) || value < 10000 || value > 100000 || !window.XLSX?.SSF?.parse_date_code) {
      return "";
    }

    const parsed = window.XLSX.SSF.parse_date_code(value, { date1904 });
    if (!parsed || !parsed.y || !parsed.m || !parsed.d) {
      return "";
    }

    return buildLocalDateTimeString(parsed.y, parsed.m, parsed.d, parsed.H, parsed.M, parsed.S);
  }

  function normalizeSpreadsheetIssueDate(value, date1904 = false) {
    if (value === undefined || value === null || value === "") {
      return "";
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return "";
      }

      return buildLocalDateTimeString(
        value.getFullYear(),
        value.getMonth() + 1,
        value.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds()
      );
    }

    if (typeof value === "number") {
      return parseExcelDateCode(value, date1904) || normalizeText(value);
    }

    const normalized = normalizeText(value);
    if (!normalized) {
      return "";
    }

    const numericValue = normalized.replace(",", ".");
    if (/^\d+(?:\.\d+)?$/.test(numericValue)) {
      const excelDate = parseExcelDateCode(Number.parseFloat(numericValue), date1904);
      if (excelDate) {
        return excelDate;
      }
    }

    const brazilianMatch = normalized.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
    );
    if (brazilianMatch) {
      let [, day, month, year, hour = "0", minute = "0", second = "0"] = brazilianMatch;
      if (year.length === 2) {
        year = Number(year) >= 70 ? `19${year}` : `20${year}`;
      }
      return buildLocalDateTimeString(year, month, day, hour, minute, second);
    }

    const isoLikeMatch = normalized.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
    );
    if (isoLikeMatch) {
      const [, year, month, day, hour = "0", minute = "0", second = "0"] = isoLikeMatch;
      return buildLocalDateTimeString(year, month, day, hour, minute, second);
    }

    const parsedDate = new Date(normalized);
    return Number.isNaN(parsedDate.getTime()) ? normalized : parsedDate.toISOString();
  }

  function randomHex(bytes = 16) {
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return Array.from(array, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  function fallbackHash(input) {
    let hash = 0;
    const text = String(input ?? "");
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  async function hashString(input) {
    if (!window.crypto?.subtle) {
      return fallbackHash(input);
    }

    const encoded = new TextEncoder().encode(String(input ?? ""));
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password) {
    const salt = randomHex(16);
    const hash = await hashString(`${salt}:${password}`);
    return `${salt}:${hash}`;
  }

  async function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(":")) {
      return false;
    }

    const [salt, originalHash] = storedHash.split(":");
    const candidateHash = await hashString(`${salt}:${password}`);
    return candidateHash === originalHash;
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

  function normalizeVehicleFuelProfile(value, fallback = "S500") {
    return normalizeEnum(value, VEHICLE_FUEL_PROFILE_ALIASES, fallback);
  }

  function normalizePlate(value) {
    return normalizeText(value).toUpperCase();
  }

  function vehicleSupportsFuel(profile, fuelKind) {
    const normalizedProfile = normalizeVehicleFuelProfile(profile, "S500");
    const normalizedFuelKind = normalizeFuelKind(fuelKind, "");
    return !normalizedFuelKind || normalizedProfile === "BOTH" || normalizedProfile === normalizedFuelKind;
  }

  function normalizeFineStatus(value, fallback = "OPEN") {
    return normalizeEnum(value, FINE_STATUS_ALIASES, fallback);
  }

  function normalizeChecklistStatus(value, fallback = "OPEN") {
    return normalizeEnum(value, CHECKLIST_STATUS_ALIASES, fallback);
  }

  function normalizeChecklistItemStatus(value, fallback = "OK") {
    return normalizeEnum(value, CHECKLIST_ITEM_STATUS_ALIASES, fallback);
  }

  function resolveUserStatus(row) {
    const rawStatus = normalizeText(row?.status).toUpperCase();
    if (rawStatus === USER_STATUSES.PENDING || rawStatus === USER_STATUSES.ACTIVE || rawStatus === USER_STATUSES.BLOCKED) {
      return rawStatus;
    }
    return row?.active === false ? USER_STATUSES.BLOCKED : USER_STATUSES.ACTIVE;
  }

  function isSystemUser(row) {
    return row?.isSystem === true;
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

  function createEmptyDb() {
    return {
      version: 1,
      counters: {
        users: 1,
        activationCodes: 1,
        inviteCodes: 1,
        supplierRules: 1,
        notes: 1,
        products: 1,
        vehicles: 1,
        inventoryMovements: 1,
        fuelStorages: 1,
        fuelRecords: 1,
        schedules: 1,
        fines: 1,
        checklists: 1,
        emails: 1,
        actionLogs: 1,
      },
      users: [],
      activationCodes: [],
      inviteCodes: [],
      supplierRules: [],
      notes: [],
      products: [],
      vehicles: [],
      inventoryMovements: [],
      fuelStorages: [],
      fuelRecords: [],
      schedules: [],
      fines: [],
      checklists: [],
      emails: [],
      actionLogs: [],
    };
  }

  function normalizeDbShape(candidate) {
    const defaults = createEmptyDb();
    const db = {
      ...defaults,
      ...(candidate && typeof candidate === "object" ? candidate : {}),
      counters: {
        ...defaults.counters,
        ...(candidate?.counters && typeof candidate.counters === "object" ? candidate.counters : {}),
      },
    };

    const arrayKeys = [
      "users",
      "activationCodes",
      "inviteCodes",
      "supplierRules",
      "notes",
      "products",
      "vehicles",
      "inventoryMovements",
      "fuelStorages",
      "fuelRecords",
      "schedules",
      "fines",
      "checklists",
      "emails",
      "actionLogs",
    ];

    for (const key of arrayKeys) {
      db[key] = Array.isArray(candidate?.[key]) ? candidate[key] : defaults[key];
    }

    for (const [counterKey, arrayKey] of Object.entries({
      users: "users",
      activationCodes: "activationCodes",
      inviteCodes: "inviteCodes",
      supplierRules: "supplierRules",
      notes: "notes",
      products: "products",
      vehicles: "vehicles",
      inventoryMovements: "inventoryMovements",
      fuelStorages: "fuelStorages",
      fuelRecords: "fuelRecords",
      schedules: "schedules",
      fines: "fines",
      checklists: "checklists",
      emails: "emails",
      actionLogs: "actionLogs",
    })) {
      const currentMax = db[arrayKey].reduce(
        (highest, item) => Math.max(highest, Number(item?.id || 0)),
        0
      );
      db.counters[counterKey] = Math.max(Number(db.counters[counterKey] || 1), currentMax + 1);
    }

    return db;
  }

  function saveDb(db) {
    dbCache = db;
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    return db;
  }

  function nextId(db, counterKey) {
    const current = Number(db.counters[counterKey] || 1);
    db.counters[counterKey] = current + 1;
    return current;
  }

  function getRawSession() {
    return safeJsonParse(window.localStorage.getItem(SESSION_STORAGE_KEY), null);
  }

  function saveSession(session) {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return;
    }
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  function createSession(userId) {
    const createdAt = nowIso();
    const session = {
      userId,
      createdAt,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    saveSession(session);
    return session;
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

  function getUserById(db, userId) {
    return db.users.find((item) => Number(item.id) === Number(userId)) || null;
  }

  function getCurrentUser(db) {
    const session = getRawSession();
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt) <= new Date()) {
      saveSession(null);
      return null;
    }

    const user = db.users.find(
      (item) => Number(item.id) === Number(session.userId) && resolveUserStatus(item) === USER_STATUSES.ACTIVE
    );

    if (!user) {
      saveSession(null);
      return null;
    }

    return formatUser(user);
  }

  function requireAuth(user) {
    if (!user) {
      throw new ApiError(401, "Sua sessao expirou. Faca login novamente.");
    }
    return user;
  }

  function requireRoles(user, roles) {
    requireAuth(user);
    if (!roles.includes(user.role)) {
      throw new ApiError(403, "Seu perfil nao tem permissao para esta acao.");
    }
    return user;
  }

  function logAction(db, user, action, entityType, entityId, details = null) {
    db.actionLogs.push({
      id: nextId(db, "actionLogs"),
      userId: user?.id || null,
      userName: user?.name || "Sistema",
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      details: details ? redactSensitiveDetails(details) : null,
      createdAt: nowIso(),
    });
  }

  function revokeLegacyPublicInvites(db) {
    const revokedCodes = [];

    for (const invite of db.inviteCodes) {
      const code = normalizeText(invite.code).toUpperCase();
      if (!LEGACY_PUBLIC_INVITE_CODES.has(code) || invite.active === false) {
        continue;
      }

      invite.active = false;
      revokedCodes.push(code);
    }

    if (!revokedCodes.length) {
      return false;
    }

    logAction(db, null, "REVOKE_PUBLIC_INVITES", "INVITE", null, { revokedCodes });
    return true;
  }

  function upsertSupplierRule(db, supplierName, category, userId) {
    if (!supplierName || !category) {
      return;
    }

    const existing = db.supplierRules.find(
      (item) => normalizeText(item.supplierName).toLowerCase() === normalizeText(supplierName).toLowerCase()
    );

    if (existing) {
      existing.supplierName = supplierName;
      existing.category = category;
      existing.updatedBy = userId || null;
      existing.updatedAt = nowIso();
      return;
    }

    db.supplierRules.push({
      id: nextId(db, "supplierRules"),
      supplierName,
      category,
      updatedBy: userId || null,
      updatedAt: nowIso(),
    });
  }

  function getSupplierCategory(db, supplierName) {
    if (!supplierName) {
      return null;
    }

    const rule = db.supplierRules.find(
      (item) => normalizeText(item.supplierName).toLowerCase() === normalizeText(supplierName).toLowerCase()
    );

    return rule ? rule.category : null;
  }

  function mapNoteRow(db, row) {
    const sentUser = getUserById(db, row.sentToFinanceBy);
    const createdUser = getUserById(db, row.createdBy);
    const updatedUser = getUserById(db, row.updatedBy);
    return {
      id: Number(row.id),
      supplierName: row.supplierName,
      totalValue: Number(row.totalValue || 0),
      danfe: row.danfe || "",
      xmlKey: row.xmlKey || "",
      issueDate: row.issueDate || "",
      category: row.category,
      status: row.status,
      source: row.source,
      financeNotes: row.financeNotes || "",
      sentToFinanceAt: row.sentToFinanceAt || "",
      sentToFinanceBy: row.sentToFinanceBy ? Number(row.sentToFinanceBy) : null,
      sentToFinanceByName: sentUser?.name || "",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdByName: createdUser?.name || "",
      updatedByName: updatedUser?.name || "",
    };
  }

  function maybePersist(db) {
    saveDb(db);
    return db;
  }

  function migrateOperationalDataShape(db) {
    let changed = false;

    for (const product of db.products) {
      if (product.defaultCost === undefined) {
        product.defaultCost = 0;
        changed = true;
      }
    }

    for (const vehicle of db.vehicles) {
      const normalizedPlate = normalizePlate(vehicle.plate);
      if (vehicle.plate !== normalizedPlate) {
        vehicle.plate = normalizedPlate;
        changed = true;
      }
      if (vehicle.fuelProfile === undefined) {
        vehicle.fuelProfile = "S500";
        changed = true;
      }
      if (vehicle.active === undefined) {
        vehicle.active = true;
        changed = true;
      }
      if (vehicle.notes === undefined) {
        vehicle.notes = "";
        changed = true;
      }
      if (vehicle.updatedAt === undefined) {
        vehicle.updatedAt = vehicle.createdAt || nowIso();
        changed = true;
      }
    }

    for (const movement of db.inventoryMovements) {
      if (movement.document === undefined) {
        movement.document = "";
        changed = true;
      }
      if (movement.branchName === undefined) {
        movement.branchName = "";
        changed = true;
      }
      if (movement.supplierName === undefined) {
        movement.supplierName = "";
        changed = true;
      }
      if (movement.fuelKind === undefined) {
        movement.fuelKind = "";
        changed = true;
      }
      if (movement.unitCost === undefined) {
        movement.unitCost = 0;
        changed = true;
      }
      if (movement.totalCost === undefined) {
        movement.totalCost = Number(movement.unitCost || 0) * Number(movement.quantity || 0);
        changed = true;
      }
    }

    for (const record of db.fuelRecords) {
      if (record.vehicleId === undefined) {
        const vehicle = db.vehicles.find((item) => item.plate === normalizePlate(record.plate));
        record.vehicleId = vehicle ? vehicle.id : null;
        changed = true;
      }
      if (!record.plate) {
        record.plate = "";
        changed = true;
      }
    }

    return changed;
  }

  function getPathId(path, base) {
    const match = path.match(new RegExp(`^${base}/(\\d+)$`));
    return match ? Number(match[1]) : 0;
  }

  function createOrUpdateNote(db, payload, user, options = {}) {
    let existingNote = options.existingNote || null;
    const supplierName = normalizeText(payload.supplierName || payload.supplier_name);
    if (!supplierName) {
      throw new ApiError(400, "Fornecedor e obrigatorio.");
    }

    const xmlKey = normalizeText(payload.xmlKey || payload.xml_key);
    if (!existingNote && xmlKey) {
      existingNote =
        db.notes.find((item) => normalizeText(item.xmlKey) === xmlKey) || null;
    }

    const preserveExistingWorkflow = Boolean(existingNote && options.preferExistingWorkflow);
    const rememberedCategory = getSupplierCategory(db, supplierName);
    const category = normalizeNoteCategory(
      preserveExistingWorkflow && !payload.category ? existingNote.category : payload.category,
      existingNote?.category || rememberedCategory || "OTHER"
    );
    const status = preserveExistingWorkflow
      ? existingNote.status
      : normalizeNoteStatus(payload.status, existingNote?.status || "NEW");
    const issueDate = normalizeText(payload.issueDate || payload.issue_date);
    const financeNotes = preserveExistingWorkflow
      ? normalizeText(payload.financeNotes || payload.finance_notes || existingNote?.financeNotes)
      : normalizeText(payload.financeNotes || payload.finance_notes);
    const totalValue = toNumber(payload.totalValue ?? payload.total_value);
    const danfe = normalizeText(payload.danfe);
    const source = normalizeText(payload.source || options.source || existingNote?.source || "MANUAL").toUpperCase();
    const timestamp = nowIso();

    let sentToFinanceAt = preserveExistingWorkflow
      ? normalizeText(payload.sentToFinanceAt || payload.sent_to_finance_at || existingNote?.sentToFinanceAt)
      : normalizeText(payload.sentToFinanceAt || payload.sent_to_finance_at);
    let sentToFinanceBy = preserveExistingWorkflow
      ? payload.sentToFinanceBy || payload.sent_to_finance_by || existingNote?.sentToFinanceBy || null
      : payload.sentToFinanceBy || payload.sent_to_finance_by || null;

    if (status === "SENT_FINANCE") {
      sentToFinanceAt = sentToFinanceAt || existingNote?.sentToFinanceAt || timestamp;
      sentToFinanceBy = sentToFinanceBy || existingNote?.sentToFinanceBy || user?.id || null;
    } else if (!payload.keepFinanceInfo && !preserveExistingWorkflow) {
      sentToFinanceAt = "";
      sentToFinanceBy = null;
    }

    let note;

    if (existingNote) {
      note = existingNote;
      note.supplierName = supplierName;
      note.totalValue = totalValue;
      note.danfe = danfe;
      note.xmlKey = xmlKey;
      note.issueDate = issueDate;
      note.category = category;
      note.status = status;
      note.source = source;
      note.financeNotes = financeNotes;
      note.sentToFinanceAt = sentToFinanceAt || "";
      note.sentToFinanceBy = sentToFinanceBy || null;
      note.updatedBy = user?.id || null;
      note.updatedAt = timestamp;
    } else {
      note = {
        id: nextId(db, "notes"),
        supplierName,
        totalValue,
        danfe,
        xmlKey,
        issueDate,
        category,
        status,
        source,
        financeNotes,
        sentToFinanceAt: sentToFinanceAt || "",
        sentToFinanceBy: sentToFinanceBy || null,
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.notes.push(note);
    }

    upsertSupplierRule(db, supplierName, category, user?.id || null);

    if (!options.skipLog) {
      logAction(
        db,
        user,
        existingNote ? "UPDATE_NOTE" : "CREATE_NOTE",
        "NOTE",
        note.id,
        { supplierName, category, status, source }
      );
    }

    return mapNoteRow(db, note);
  }

  function includesSearch(value, search) {
    return normalizeText(value).toLowerCase().includes(normalizeText(search).toLowerCase());
  }

  function queryNotes(db, filters = {}) {
    return db.notes
      .filter((note) => {
        if (filters.status && note.status !== normalizeNoteStatus(filters.status, "NEW")) {
          return false;
        }
        if (filters.category && note.category !== normalizeNoteCategory(filters.category, "OTHER")) {
          return false;
        }
        if (filters.search) {
          return (
            includesSearch(note.supplierName, filters.search) ||
            includesSearch(note.danfe, filters.search)
          );
        }
        return true;
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || Number(right.id) - Number(left.id))
      .map((note) => mapNoteRow(db, note));
  }

  function queryProducts(db, search = "") {
    return db.products
      .filter((product) => product.active !== false)
      .filter((product) => {
        if (!search) {
          return true;
        }
        return includesSearch(product.name, search) || includesSearch(product.barcode, search);
      })
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((product) => ({
        id: Number(product.id),
        name: product.name,
        unit: product.unit,
        barcode: product.barcode || "",
        minStock: Number(product.minStock || 0),
        currentStock: Number(product.currentStock || 0),
        defaultCost: Number(product.defaultCost || 0),
        active: product.active !== false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        lowStock: Number(product.currentStock || 0) <= Number(product.minStock || 0),
      }));
  }

  function queryVehicles(db, filters = {}) {
    return db.vehicles
      .filter((vehicle) => {
        if (filters.activeOnly && vehicle.active === false) {
          return false;
        }
        if (filters.plate && normalizePlate(vehicle.plate) !== normalizePlate(filters.plate)) {
          return false;
        }
        if (filters.fuelKind) {
          const fuelKind = normalizeFuelKind(filters.fuelKind, "");
          if (fuelKind && !vehicleSupportsFuel(vehicle.fuelProfile, fuelKind)) {
            return false;
          }
        }
        return true;
      })
      .sort((left, right) => normalizePlate(left.plate).localeCompare(normalizePlate(right.plate)) || Number(left.id) - Number(right.id))
      .map((vehicle) => {
        const fuelProfile = normalizeVehicleFuelProfile(vehicle.fuelProfile, "S500");
        return {
          id: Number(vehicle.id),
          plate: normalizePlate(vehicle.plate),
          fuelProfile,
          brand: vehicle.brand || "",
          model: vehicle.model || "",
          sector: vehicle.sector || "",
          notes: vehicle.notes || "",
          active: vehicle.active !== false,
          status: vehicle.active === false ? "INACTIVE" : "ACTIVE",
          createdAt: vehicle.createdAt,
          updatedAt: vehicle.updatedAt,
          supportsS500: vehicleSupportsFuel(fuelProfile, "S500"),
          supportsS10: vehicleSupportsFuel(fuelProfile, "S10"),
          displayName: [normalizePlate(vehicle.plate), normalizeText([vehicle.brand, vehicle.model].filter(Boolean).join(" "))]
            .filter(Boolean)
            .join(" - "),
        };
      });
  }

  function queryInventoryMovements(db, filters = {}) {
    return db.inventoryMovements
      .filter((movement) => {
        if (filters.productId && Number(movement.productId) !== Number(filters.productId)) {
          return false;
        }
        if (filters.from && String(movement.occurredAt || "") < String(filters.from)) {
          return false;
        }
        if (filters.to && String(movement.occurredAt || "") > String(filters.to)) {
          return false;
        }
        if (filters.branchName && normalizeText(movement.branchName).toLowerCase() !== normalizeText(filters.branchName).toLowerCase()) {
          return false;
        }
        if (filters.fuelKind && normalizeFuelKind(movement.fuelKind, "") !== normalizeFuelKind(filters.fuelKind, "")) {
          return false;
        }
        if (filters.document && !includesSearch(movement.document, filters.document)) {
          return false;
        }
        if (filters.supplierName && !includesSearch(movement.supplierName, filters.supplierName)) {
          return false;
        }
        return true;
      })
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || Number(right.id) - Number(left.id))
      .map((movement) => {
        const product = db.products.find((item) => Number(item.id) === Number(movement.productId));
        const user = getUserById(db, movement.createdBy);
        return {
          id: Number(movement.id),
          productId: Number(movement.productId),
          productName: product?.name || "Produto removido",
          productUnit: product?.unit || "UN",
          type: movement.type,
          quantity: Number(movement.quantity || 0),
          balanceAfter: Number(movement.balanceAfter || 0),
          document: movement.document || "",
          branchName: movement.branchName || "",
          supplierName: movement.supplierName || "",
          fuelKind: movement.fuelKind || "",
          unitCost: Number(movement.unitCost || 0),
          totalCost: Number(movement.totalCost || 0),
          notes: movement.notes || "",
          occurredAt: movement.occurredAt,
          createdAt: movement.createdAt,
          userName: user?.name || "",
        };
      });
  }

  function queryFuelRecords(db, filters = {}) {
    return db.fuelRecords
      .filter((record) => {
        if (filters.storageId && Number(record.storageId) !== Number(filters.storageId)) {
          return false;
        }
        if (filters.fuelKind && normalizeText(record.fuelKind).toUpperCase() !== normalizeText(filters.fuelKind).toUpperCase()) {
          return false;
        }
        if (filters.from && String(record.occurredAt || "") < String(filters.from)) {
          return false;
        }
        if (filters.to && String(record.occurredAt || "") > String(filters.to)) {
          return false;
        }
        return true;
      })
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || Number(right.id) - Number(left.id))
      .map((record) => {
        const vehicle = db.vehicles.find((item) => Number(item.id) === Number(record.vehicleId));
        return {
          id: Number(record.id),
          storageId: record.storageId ? Number(record.storageId) : null,
          storageName: record.storageName || "",
          fuelKind: record.fuelKind || "",
          vehicleId: record.vehicleId ? Number(record.vehicleId) : null,
          type: record.type,
          plate: record.plate || "",
          quantity: Number(record.quantity || 0),
          odometerKm:
            record.odometerKm === null || record.odometerKm === undefined ? null : Number(record.odometerKm),
          balanceBefore: Number(record.balanceBefore || 0),
          balanceAfter: Number(record.balanceAfter || 0),
          notes: record.notes || "",
          occurredAt: record.occurredAt,
          createdAt: record.createdAt,
          userName: getUserById(db, record.createdBy)?.name || "",
          vehicleBrand: vehicle?.brand || "",
          vehicleModel: vehicle?.model || "",
          vehicleSector: vehicle?.sector || "",
        };
      });
  }

  function queryFuelStorages(db) {
    return db.fuelStorages
      .filter((storage) => storage.active !== false)
      .sort((left, right) => left.fuelKind.localeCompare(right.fuelKind) || left.name.localeCompare(right.name))
      .map((storage) => ({
        id: Number(storage.id),
        name: storage.name,
        fuelKind: storage.fuelKind,
        currentBalance: Number(storage.currentBalance || 0),
        minBalance: Number(storage.minBalance || 0),
        active: storage.active !== false,
        createdAt: storage.createdAt,
        updatedAt: storage.updatedAt,
      }));
  }

  function queryFuelOverview(db) {
    const storages = queryFuelStorages(db);
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

  function queryFuelAnalytics(db, filters = {}, fuelOverview = queryFuelOverview(db)) {
    const selectedPlate = normalizeText(filters.plate).toUpperCase();
    const periodDays = normalizeDashboardDays(filters.days);
    const dayRange = buildDashboardDayRange(periodDays);
    const startDay = dayRange[0];
    const endDay = dayRange[dayRange.length - 1];
    const availablePlates = Array.from(
      new Set(
        db.fuelRecords
          .map((record) => normalizeText(record.plate).toUpperCase())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));

    const relevantRecords = db.fuelRecords.filter((record) => {
      const occurredDay = String(record.occurredAt || "").slice(0, 10);
      if (occurredDay < startDay || occurredDay > endDay) {
        return false;
      }
      if (selectedPlate && normalizeText(record.plate).toUpperCase() !== selectedPlate) {
        return false;
      }
      return true;
    });

    const groupedConsumption = new Map();
    for (const record of relevantRecords) {
      const day = String(record.occurredAt || "").slice(0, 10);
      const current = groupedConsumption.get(day) || { total: 0, s500: 0, s10: 0 };
      if (record.type === "EXIT") {
        current.total += Number(record.quantity || 0);
        if (record.fuelKind === "S500") current.s500 += Number(record.quantity || 0);
        if (record.fuelKind === "S10") current.s10 += Number(record.quantity || 0);
      }
      groupedConsumption.set(day, current);
    }

    const consumptionSeries = dayRange.map((day) => {
      const snapshot = groupedConsumption.get(day) || { total: 0, s500: 0, s10: 0 };
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

    const topConsumers = Array.from(
      relevantRecords
        .filter((record) => record.type === "EXIT")
        .reduce((map, record) => {
          const plate = normalizeText(record.plate).toUpperCase();
          if (!plate) {
            return map;
          }
          const current = map.get(plate) || {
            plate,
            totalLiters: 0,
            records: 0,
            lastAt: "",
          };
          current.totalLiters += Number(record.quantity || 0);
          current.records += 1;
          current.lastAt = current.lastAt && current.lastAt > record.occurredAt ? current.lastAt : record.occurredAt;
          map.set(plate, current);
          return map;
        }, new Map())
        .values()
    )
      .sort((left, right) => right.totalLiters - left.totalLiters || left.plate.localeCompare(right.plate))
      .slice(0, 5);

    const exitRecordsInPeriod = relevantRecords.filter((record) => record.type === "EXIT");
    const withOdometer = exitRecordsInPeriod.filter(
      (record) => record.odometerKm !== null && record.odometerKm !== undefined
    );

    const odometerRows = db.fuelRecords
      .filter(
        (record) =>
          record.type === "EXIT" &&
          normalizeText(record.plate) &&
          record.odometerKm !== null &&
          record.odometerKm !== undefined &&
          (!selectedPlate || normalizeText(record.plate).toUpperCase() === selectedPlate)
      )
      .slice()
      .sort((left, right) => {
        const plateCompare = normalizeText(left.plate).localeCompare(normalizeText(right.plate));
        if (plateCompare !== 0) {
          return plateCompare;
        }
        return left.occurredAt.localeCompare(right.occurredAt) || Number(left.id) - Number(right.id);
      });

    const previousByPlate = new Map();
    const efficiencyByPlate = new Map();

    for (const row of odometerRows) {
      const plate = normalizeText(row.plate).toUpperCase();
      const odometerKm = Number(row.odometerKm || 0);
      const quantity = Number(row.quantity || 0);
      const occurredAt = row.occurredAt;
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
        currentStats.lastFuelKind = row.fuelKind || "";
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
      const latestRecord = db.fuelRecords
        .filter((record) => record.type === "EXIT" && normalizeText(record.plate).toUpperCase() === selectedPlate)
        .slice()
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || Number(right.id) - Number(left.id))[0];

      if (latestRecord) {
        selectedVehicle = {
          plate: selectedPlate,
          totalDistanceKm: 0,
          totalLiters: Number(latestRecord.quantity || 0),
          samples: 0,
          kmPerLiter: 0,
          lastOdometerKm:
            latestRecord.odometerKm === null || latestRecord.odometerKm === undefined
              ? 0
              : Number(latestRecord.odometerKm),
          lastFuelAt: latestRecord.occurredAt,
          lastFuelKind: latestRecord.fuelKind || "",
          lastFuelQuantity: Number(latestRecord.quantity || 0),
          segments: [],
        };
      }
    }

    const noteStatuses = Array.from(
      db.notes.reduce((map, note) => {
        map.set(note.status, Number(map.get(note.status) || 0) + 1);
        return map;
      }, new Map())
    )
      .map(([status, total]) => ({ status, total }))
      .sort((left, right) => right.total - left.total || left.status.localeCompare(right.status));

    const recentFuelRecords = relevantRecords
      .filter((record) => record.type === "EXIT")
      .slice()
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || Number(right.id) - Number(left.id))
      .slice(0, 6)
      .map((record) => ({
        plate: normalizeText(record.plate).toUpperCase(),
        quantity: Number(record.quantity || 0),
        fuelKind: record.fuelKind || "",
        storageName: record.storageName || "",
        occurredAt: record.occurredAt,
        odometerKm:
          record.odometerKm === null || record.odometerKm === undefined ? null : Number(record.odometerKm),
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
        totalRecords: exitRecordsInPeriod.length,
        withOdometer: withOdometer.length,
        percent: exitRecordsInPeriod.length ? (withOdometer.length / exitRecordsInPeriod.length) * 100 : 0,
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

  function querySchedules(db, date) {
    return db.schedules
      .filter((schedule) => !date || schedule.scheduledDate === date)
      .slice()
      .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate) || Number(right.id) - Number(left.id))
      .map((schedule) => ({
        id: Number(schedule.id),
        scheduledDate: schedule.scheduledDate,
        vehicle: schedule.vehicle,
        location: schedule.location || "",
        driver: schedule.driver,
        assistant: schedule.assistant || "",
        responsibleName: schedule.responsibleName || "",
        notes: schedule.notes || "",
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        userName: getUserById(db, schedule.createdBy)?.name || "",
      }));
  }

  function queryFines(db) {
    return db.fines
      .slice()
      .sort((left, right) => right.fineDate.localeCompare(left.fineDate) || Number(right.id) - Number(left.id))
      .map((fine) => ({
        id: Number(fine.id),
        fineDate: fine.fineDate,
        plate: fine.plate,
        driver: fine.driver,
        status: fine.status,
        amount: Number(fine.amount || 0),
        notes: fine.notes || "",
        createdAt: fine.createdAt,
        updatedAt: fine.updatedAt,
        userName: getUserById(db, fine.createdBy)?.name || "",
      }));
  }

  function queryChecklists(db) {
    return db.checklists
      .slice()
      .sort((left, right) => right.checklistDate.localeCompare(left.checklistDate) || Number(right.id) - Number(left.id))
      .map((checklist) => {
        const parsed = parseChecklistStorage(checklist.itemsJson);
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
          id: Number(checklist.id),
          vehicle: checklist.vehicle,
          checklistDate: checklist.checklistDate,
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
          problems: checklist.problems || "",
          status: checklist.status,
          createdAt: checklist.createdAt,
          updatedAt: checklist.updatedAt,
          userName: getUserById(db, checklist.createdBy)?.name || "",
        };
      });
  }

  function buildKardexReport(db, filters = {}) {
    const productId = Number(filters.productId);
    const from = normalizeText(filters.from);
    const to = normalizeText(filters.to);

    if (!productId || !from || !to) {
      throw new ApiError(400, "Produto e periodo sao obrigatorios.");
    }

    if (from > to) {
      throw new ApiError(400, "A data inicial nao pode ser maior que a data final.");
    }

    const product = db.products.find((item) => Number(item.id) === productId);
    if (!product) {
      throw new ApiError(404, "Produto nao encontrado.");
    }

    const filterSet = {
      productId,
      branchName: normalizeText(filters.branchName || filters.branch || filters.unitName),
      fuelKind: normalizeFuelKind(filters.fuelKind, ""),
      document: normalizeText(filters.document),
      supplierName: normalizeText(filters.supplierName || filters.supplier),
    };

    const matchesFilters = (movement) => {
      if (Number(movement.productId) !== productId) {
        return false;
      }
      if (filterSet.branchName && normalizeText(movement.branchName).toLowerCase() !== filterSet.branchName.toLowerCase()) {
        return false;
      }
      if (filterSet.fuelKind && normalizeFuelKind(movement.fuelKind, "") !== filterSet.fuelKind) {
        return false;
      }
      if (filterSet.document && !includesSearch(movement.document, filterSet.document)) {
        return false;
      }
      if (filterSet.supplierName && !includesSearch(movement.supplierName, filterSet.supplierName)) {
        return false;
      }
      return true;
    };

    const relevantMovements = db.inventoryMovements
      .filter(matchesFilters)
      .slice()
      .sort((left, right) => String(left.occurredAt || "").localeCompare(String(right.occurredAt || "")) || Number(left.id) - Number(right.id));

    const openingBalance = relevantMovements
      .filter((movement) => String(movement.occurredAt || "") < from)
      .reduce(
        (total, movement) =>
          total + (movement.type === "IN" ? Number(movement.quantity || 0) : -Number(movement.quantity || 0)),
        0
      );

    const rowsInPeriod = relevantMovements.filter(
      (movement) => String(movement.occurredAt || "") >= from && String(movement.occurredAt || "") <= to
    );

    let runningBalance = openingBalance;
    let totalEntries = 0;
    let totalExits = 0;

    const rows = rowsInPeriod.map((movement) => {
      const quantity = Number(movement.quantity || 0);
      const unitCost = Number(movement.unitCost || 0);
      const totalCost = Number(movement.totalCost || unitCost * quantity || 0);
      const isEntry = movement.type === "IN";

      if (isEntry) {
        totalEntries += quantity;
        runningBalance += quantity;
      } else {
        totalExits += quantity;
        runningBalance -= quantity;
      }

      return {
        id: Number(movement.id),
        document: movement.document || "",
        date: movement.occurredAt,
        entryQuantity: isEntry ? quantity : 0,
        exitQuantity: isEntry ? 0 : quantity,
        quantity,
        type: movement.type,
        unitCost,
        totalCost,
        balance: runningBalance,
        notes: movement.notes || "",
        supplierName: movement.supplierName || "",
        branchName: movement.branchName || "",
        fuelKind: movement.fuelKind || "",
        userName: getUserById(db, movement.createdBy)?.name || "",
      };
    });

    const lastPurchase = relevantMovements
      .filter((movement) => movement.type === "IN" && String(movement.occurredAt || "") <= to)
      .slice()
      .sort((left, right) => String(right.occurredAt || "").localeCompare(String(left.occurredAt || "")) || Number(right.id) - Number(left.id))[0];

    const currentCost = Number(product.defaultCost || 0) || Number(lastPurchase?.unitCost || 0) || 0;

    return {
      companyName: "HORIZON",
      reportName: "Ficha Kardex - Movimento do Estoque",
      issuedAt: nowIso(),
      period: { from, to },
      product: {
        id: Number(product.id),
        name: product.name,
        unit: product.unit,
        defaultCost: Number(product.defaultCost || 0),
      },
      filters: {
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
            supplierName: lastPurchase.supplierName || "",
            branchName: lastPurchase.branchName || "",
            fuelKind: lastPurchase.fuelKind || "",
            unitCost: Number(lastPurchase.unitCost || 0),
            totalCost: Number(lastPurchase.totalCost || 0),
            date: lastPurchase.occurredAt,
            userName: getUserById(db, lastPurchase.createdBy)?.name || "",
          }
        : null,
    };
  }

  function queryEmails(db) {
    return db.emails
      .slice()
      .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt) || Number(right.id) - Number(left.id))
      .map((email) => {
        const note = db.notes.find((item) => Number(item.id) === Number(email.linkedNoteId)) || null;
        return {
          id: Number(email.id),
          sender: email.sender,
          subject: email.subject,
          body: email.body || "",
          receivedAt: email.receivedAt,
          spamScore: Number(email.spamScore || 0),
          spamReason: email.spamReason || "",
          hasXml: Boolean(email.hasXml),
          detectedSupplier: email.detectedSupplier || "",
          classification: email.classification,
          status: email.status,
          linkedNoteId: note ? Number(note.id) : null,
          linkedNoteDanfe: note?.danfe || "",
          linkedNoteStatus: note?.status || "",
          linkedNoteCategory: note?.category || "",
        };
      });
  }

  function createActivationCode() {
    return `ATV-${new Date().getFullYear()}-${randomHex(4).toUpperCase()}`;
  }

  function buildActivationExpiry() {
    return new Date(Date.now() + ACTIVATION_CODE_TTL_HOURS * 60 * 60 * 1000).toISOString();
  }

  async function createProvisioningPasswordHash() {
    return hashPassword(randomHex(24));
  }

  function mapAdminUserRow(db, user) {
    const activeCode = db.activationCodes
      .filter(
        (item) =>
          Number(item.userId) === Number(user.id) &&
          item.active !== false &&
          !item.usedAt &&
          new Date(item.expiresAt) > new Date()
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || Number(right.id) - Number(left.id))[0];

    return {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: resolveUserStatus(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || user.createdAt,
      hasActiveActivationCode: Boolean(activeCode),
      activationCodeCreatedAt: activeCode?.createdAt || null,
      activationCodeExpiresAt: activeCode?.expiresAt || null,
      activationCodePurpose: activeCode?.purpose || null,
    };
  }

  function queryAdminUsers(db) {
    return db.users
      .filter((item) => !isSystemUser(item))
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR") || Number(left.id) - Number(right.id))
      .map((user) => mapAdminUserRow(db, user));
  }

  function findManagedUser(db, userId) {
    return db.users.find((item) => Number(item.id) === Number(userId) && !isSystemUser(item)) || null;
  }

  function invalidateActivationCodes(db, userId) {
    db.activationCodes.forEach((item) => {
      if (Number(item.userId) === Number(userId) && item.active !== false) {
        item.active = false;
      }
    });
  }

  function clearUserSession(userId) {
    const currentSession = getRawSession();
    if (currentSession && Number(currentSession.userId) === Number(userId)) {
      saveSession(null);
    }
  }

  function issueActivationCode(db, userId, createdByUserId, purpose = "ACTIVATION") {
    const createdAt = nowIso();
    const expiresAt = buildActivationExpiry();
    const code = createActivationCode();
    const id = nextId(db, "activationCodes");
    db.activationCodes.push({
      id,
      userId: Number(userId),
      code,
      purpose,
      active: true,
      createdBy: createdByUserId || null,
      createdAt,
      expiresAt,
      usedAt: null,
    });
    return { id, code, purpose, createdAt, expiresAt };
  }

  function getFirstXmlValue(documentNode, tagNames) {
    for (const tagName of tagNames) {
      const direct = documentNode.getElementsByTagName(tagName)[0] || documentNode.getElementsByTagNameNS("*", tagName)[0];
      const value = normalizeText(direct?.textContent);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function parseInvoiceXml(content, fileName = "") {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(String(content || ""), "application/xml");
    const parserError = documentNode.getElementsByTagName("parsererror")[0];
    if (parserError) {
      throw new Error("XML invalido.");
    }

    const infNFe =
      documentNode.getElementsByTagName("infNFe")[0] ||
      documentNode.getElementsByTagNameNS("*", "infNFe")[0] ||
      null;

    const rawKey =
      getFirstXmlValue(documentNode, ["chNFe"]) ||
      normalizeText(infNFe?.getAttribute("Id") || "");

    return {
      supplierName:
        getFirstXmlValue(documentNode, ["xNome"]) ||
        fileName.replace(/\.[^.]+$/, "") ||
        "Fornecedor nao identificado",
      totalValue: toNumber(getFirstXmlValue(documentNode, ["vNF"])),
      danfe: getFirstXmlValue(documentNode, ["nNF"]),
      issueDate: getFirstXmlValue(documentNode, ["dhEmi", "dEmi"]),
      xmlKey: rawKey.replace(/^NFe/i, ""),
    };
  }

  function parseSpreadsheet(contentBase64) {
    if (!window.XLSX?.read) {
      throw new Error("Leitor de planilhas nao carregado.");
    }

    const workbook = window.XLSX.read(contentBase64, { type: "base64" });
    const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });

    return rows
      .map((row) => {
        const normalized = Object.entries(row).reduce((result, [key, value]) => {
          result[normalizeKey(key)] = value;
          return result;
        }, {});

        const supplierName = normalizeText(
          pickRecordValue(normalized, ["fornecedor", "emitente", "razao_social", "supplier"])
        );

        if (!supplierName) {
          return null;
        }

        return {
          supplierName,
          totalValue: toNumber(
            pickRecordValue(normalized, ["valor", "valor_total", "total", "v_nf"])
          ),
          danfe: normalizeText(pickRecordValue(normalized, ["danfe", "nf", "numero", "nota"])),
          issueDate: normalizeSpreadsheetIssueDate(
            pickRecordValue(normalized, [
              "data",
              "data_emissao",
              "data_hora",
              "data_hora_emissao",
              "emissao",
              "dhemi",
              "dh_emi",
              "demi",
              "d_emi",
            ]),
            date1904
          ),
          category: normalizeText(pickRecordValue(normalized, ["categoria", "classificacao"])),
          status: normalizeText(pickRecordValue(normalized, ["status"])),
        };
      })
      .filter(Boolean);
  }

  function extractXmlFromText(text) {
    const match = String(text ?? "").match(/<(?:nfeProc|NFe)\b[\s\S]*<\/(?:nfeProc|NFe)>/i);
    return match ? match[0] : "";
  }

  function parseEml(text) {
    const raw = String(text ?? "");
    const sender = normalizeText((raw.match(/^From:\s*(.+)$/im) || [])[1]);
    const subject = normalizeText((raw.match(/^Subject:\s*(.+)$/im) || [])[1]);
    const receivedAt = normalizeText((raw.match(/^Date:\s*(.+)$/im) || [])[1]);
    const body = raw.split(/\r?\n\r?\n/).slice(1).join("\n\n").trim();
    const parsedDate = receivedAt ? new Date(receivedAt) : null;
    const normalizedReceivedAt =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : nowIso();

    return {
      sender,
      subject,
      body,
      receivedAt: normalizedReceivedAt,
      xmlContent: extractXmlFromText(raw),
    };
  }

  function analyzeEmailPayload(payload) {
    const sender = normalizeText(payload.sender);
    const subject = normalizeText(payload.subject);
    const body = String(payload.body ?? "");
    const xmlContent = payload.xmlContent || extractXmlFromText(body);

    const scoreSignals = [
      { pattern: /(cassino|loteria|bitcoin|viagra|ganhe dinheiro|clique aqui)/i, score: 55, label: "palavras suspeitas" },
      { pattern: /(promocao|promoção|gratis|grátis|free)/i, score: 20, label: "termos promocionais" },
      { pattern: /!!!+/, score: 15, label: "pontuacao excessiva" },
    ];

    let spamScore = 0;
    const reasons = [];

    for (const signal of scoreSignals) {
      if (signal.pattern.test(`${subject} ${body}`)) {
        spamScore += signal.score;
        reasons.push(signal.label);
      }
    }

    if (!sender.includes("@")) {
      spamScore += 15;
      reasons.push("remetente incompleto");
    }

    return {
      sender,
      subject: subject || "Sem assunto",
      body,
      receivedAt: payload.receivedAt || nowIso(),
      xmlContent,
      hasXml: Boolean(xmlContent),
      spamScore,
      spamReason: reasons.join(", "),
    };
  }

  async function seedDatabase(db) {
    if (db.users.length > 0) {
      return db;
    }

    const createdAt = nowIso();
    const generatedPassword = randomHex(12);
    const adminId = nextId(db, "users");
    db.users.push({
      id: adminId,
      name: DEFAULT_MASTER_ADMIN_NAME,
      email: DEFAULT_MASTER_ADMIN_EMAIL,
      passwordHash: await hashPassword(generatedPassword),
      role: "ADMIN",
      inviteCodeUsed: "SEED-ADMIN",
      active: true,
      status: USER_STATUSES.ACTIVE,
      isSystem: true,
      createdAt,
      updatedAt: createdAt,
    });

    for (const storage of DEFAULT_FUEL_STORAGES) {
      db.fuelStorages.push({
        id: nextId(db, "fuelStorages"),
        name: storage.name,
        fuelKind: storage.fuelKind,
        currentBalance: 0,
        minBalance: 0,
        active: true,
        createdBy: adminId,
        createdAt,
        updatedAt: createdAt,
      });
    }

    logAction(db, { id: null, name: "Sistema" }, "SEED_DATABASE", "SYSTEM", null, {
      message: "Base inicial criada com conta mestra interna",
      mode: "browser",
    });

    console.info("[Horizon] Conta mestra criada internamente no modo navegador.");
    console.info(`[Horizon] Email interno: ${DEFAULT_MASTER_ADMIN_EMAIL}`);
    console.info(`[Horizon] Senha temporaria: ${generatedPassword}`);

    saveDb(db);
    return db;
  }

  async function ensureDb() {
    if (dbCache) {
      return dbCache;
    }

    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = (async () => {
      const stored = safeJsonParse(window.localStorage.getItem(DB_STORAGE_KEY), null);
      const db = normalizeDbShape(stored);
      dbCache = db;
      let shouldPersist = false;
      if (!db.users.length) {
        await seedDatabase(db);
        shouldPersist = false;
      } else {
        shouldPersist = true;
        for (const user of db.users) {
          if (!user.status) {
            user.status = user.active === false ? USER_STATUSES.BLOCKED : USER_STATUSES.ACTIVE;
          }
          if (user.updatedAt === undefined) {
            user.updatedAt = user.createdAt || nowIso();
          }
          if (user.isSystem === undefined) {
            user.isSystem = user.inviteCodeUsed === "SEED-ADMIN";
          }
        }
      }

      if (revokeLegacyPublicInvites(db)) {
        shouldPersist = true;
      }

      if (migrateOperationalDataShape(db)) {
        shouldPersist = true;
      }

      if (shouldPersist) {
        saveDb(db);
      }

      return dbCache;
    })();

    try {
      return await dbPromise;
    } finally {
      dbPromise = null;
    }
  }

  async function request(url, options = {}) {
    const db = await ensureDb();
    const user = getCurrentUser(db);
    const requestUrl = new URL(url, window.location.href);
    const method = String(options.method || "GET").toUpperCase();
    const body = options.body || {};
    const path = requestUrl.pathname.replace(/\/+$/, "") || "/";
    const query = Object.fromEntries(requestUrl.searchParams.entries());

    try {
      if (path === "/api/health" && method === "GET") {
        return {
          ok: true,
          database: "browser-local-storage",
          user,
          now: nowIso(),
          mode: "browser",
        };
      }

      if (path === "/api/auth/me" && method === "GET") {
        return { user };
      }

      if (path === "/api/auth/login" && method === "POST") {
        const email = normalizeText(body.email).toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
          throw new ApiError(400, "Informe email e senha.");
        }

        const foundUser = db.users.find((item) => normalizeText(item.email).toLowerCase() === email);
        if (!foundUser) {
          throw new ApiError(401, "Usuario ou senha invalidos.");
        }

        const status = resolveUserStatus(foundUser);
        if (status === USER_STATUSES.PENDING) {
          throw new ApiError(403, "Conta pendente de ativacao. Use o codigo fornecido pelo administrador.");
        }
        if (status === USER_STATUSES.BLOCKED) {
          throw new ApiError(403, "Conta bloqueada. Procure o administrador.");
        }

        if (!(await verifyPassword(password, foundUser.passwordHash))) {
          throw new ApiError(401, "Usuario ou senha invalidos.");
        }

        createSession(foundUser.id);
        logAction(db, formatUser(foundUser), "LOGIN", "AUTH", foundUser.id, { email, mode: "browser" });
        maybePersist(db);
        return { user: formatUser(foundUser) };
      }

      if (path === "/api/auth/activate" && method === "POST") {
        const email = normalizeText(body.email).toLowerCase();
        const password = String(body.password || "");
        const confirmPassword = String(body.confirmPassword || "");
        const activationCode = normalizeText(body.activationCode || body.code).toUpperCase();

        if (!email || !activationCode || !password || !confirmPassword) {
          throw new ApiError(400, "Preencha email, codigo, nova senha e confirmacao.");
        }

        if (password !== confirmPassword) {
          throw new ApiError(400, "A confirmacao de senha nao confere.");
        }

        if (password.length < 8) {
          throw new ApiError(400, "A nova senha precisa ter pelo menos 8 caracteres.");
        }

        const existingUser = db.users.find((item) => normalizeText(item.email).toLowerCase() === email);
        if (!existingUser || isSystemUser(existingUser)) {
          throw new ApiError(400, "Codigo de ativacao invalido ou expirado.");
        }

        if (resolveUserStatus(existingUser) === USER_STATUSES.BLOCKED) {
          throw new ApiError(403, "Conta bloqueada. Procure o administrador.");
        }

        const activation = db.activationCodes
          .filter(
            (item) =>
              Number(item.userId) === Number(existingUser.id) &&
              item.active !== false &&
              !item.usedAt &&
              normalizeText(item.code).toUpperCase() === activationCode
          )
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || Number(right.id) - Number(left.id))[0];

        if (!activation) {
          throw new ApiError(400, "Codigo de ativacao invalido ou expirado.");
        }

        if (new Date(activation.expiresAt) <= new Date()) {
          activation.active = false;
          maybePersist(db);
          throw new ApiError(400, "Codigo de ativacao expirado. Solicite um novo codigo ao administrador.");
        }

        existingUser.passwordHash = await hashPassword(password);
        existingUser.active = true;
        existingUser.status = USER_STATUSES.ACTIVE;
        existingUser.updatedAt = nowIso();
        db.activationCodes.forEach((item) => {
          if (Number(item.userId) === Number(existingUser.id) && item.active !== false) {
            item.active = false;
            if (Number(item.id) === Number(activation.id)) {
              item.usedAt = nowIso();
            }
          }
        });
        clearUserSession(existingUser.id);
        logAction(db, formatUser(existingUser), "ACTIVATE_ACCOUNT", "USER", existingUser.id, {
          purpose: activation.purpose,
          mode: "browser",
        });
        maybePersist(db);
        return { ok: true };
      }

      if (path === "/api/auth/register" && method === "POST") {
        throw new ApiError(403, "Cadastro publico desativado. Solicite a criacao da conta ao administrador.");
      }

      if (path === "/api/auth/logout" && method === "POST") {
        const currentUser = requireAuth(user);
        saveSession(null);
        logAction(db, currentUser, "LOGOUT", "AUTH", currentUser.id, { mode: "browser" });
        maybePersist(db);
        return { ok: true };
      }

      if (path === "/api/dashboard" && method === "GET") {
        requireAuth(user);
        const periodDays = normalizeDashboardDays(query.days);
        const selectedPlate = normalizeText(query.plate).toUpperCase();
        const pendingNotes = db.notes.filter((item) => item.status === "NEW" || item.status === "PENDING_ACK").length;
        const waitingAckNotes = db.notes.filter((item) => item.status === "PENDING_ACK").length;
        const sentFinanceNotes = db.notes.filter((item) => item.status === "SENT_FINANCE").length;
        const fuelOverview = queryFuelOverview(db);
        const fuelAnalytics = queryFuelAnalytics(db, { days: periodDays, plate: selectedPlate }, fuelOverview);
        const lowStock = queryProducts(db).filter((item) => item.lowStock);
        const todaySchedules = querySchedules(db, todayDate());
        const agingNotes = db.notes
          .filter((item) => item.status === "NEW" || item.status === "PENDING_ACK")
          .slice()
          .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
          .slice(0, 5);

        const alerts = [
          ...lowStock.slice(0, 5).map((item) => ({
            type: "LOW_STOCK",
            title: `Estoque minimo: ${item.name}`,
            description: `Saldo ${item.currentStock} ${item.unit} | minimo ${item.minStock} ${item.unit}`,
          })),
          ...agingNotes.map((item) => ({
            type: "NOTE_PENDING",
            title: `Nota pendente: ${item.supplierName}`,
            description: `Status ${item.status} desde ${new Date(item.updatedAt).toLocaleString("pt-BR")}`,
          })),
        ];

        return {
          metrics: {
            pendingNotes: Number(pendingNotes || 0),
            waitingRecognition: Number(waitingAckNotes || 0),
            sentToFinance: Number(sentFinanceNotes || 0),
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
        };
      }

      if (path === "/api/notes" && method === "GET") {
        requireAuth(user);
        return { items: queryNotes(db, query) };
      }

      if (path === "/api/notes" && method === "POST") {
        const currentUser = requireAuth(user);
        const note = createOrUpdateNote(db, body, currentUser, { source: "MANUAL" });
        maybePersist(db);
        return { item: note };
      }

      if (path === "/api/notes/import/xml" && method === "POST") {
        const currentUser = requireAuth(user);
        const files = Array.isArray(body.files) ? body.files : [];
        if (!files.length) {
          throw new ApiError(400, "Selecione ao menos um XML.");
        }

        const created = [];
        for (const file of files) {
          const parsed = parseInvoiceXml(String(file.content || ""), String(file.name || ""));
          const note = createOrUpdateNote(
            db,
            {
              supplierName: parsed.supplierName,
              totalValue: parsed.totalValue,
              danfe: parsed.danfe,
              xmlKey: parsed.xmlKey,
              issueDate: parsed.issueDate,
              status: "NEW",
              source: "XML",
            },
            currentUser,
            { source: "XML", skipLog: true, preferExistingWorkflow: true }
          );
          created.push(note);
        }

        logAction(db, currentUser, "IMPORT_XML_NOTES", "NOTE", null, {
          total: created.length,
          mode: "browser",
        });
        maybePersist(db);
        return { items: created };
      }

      if (path === "/api/notes/import/spreadsheet" && method === "POST") {
        const currentUser = requireAuth(user);
        const contentBase64 = String(body.contentBase64 || "");
        if (!contentBase64) {
          throw new ApiError(400, "Arquivo de planilha nao informado.");
        }

        const rows = parseSpreadsheet(contentBase64);
        if (!rows.length) {
          throw new ApiError(400, "Nenhuma linha valida foi encontrada na planilha.");
        }

        const created = [];
        for (const row of rows) {
          const note = createOrUpdateNote(
            db,
            {
              supplierName: row.supplierName,
              totalValue: row.totalValue,
              danfe: row.danfe,
              issueDate: row.issueDate,
              category: row.category,
              status: row.status || "NEW",
              source: "SPREADSHEET",
            },
            currentUser,
            { source: "SPREADSHEET", skipLog: true, preferExistingWorkflow: true }
          );
          created.push(note);
        }

        logAction(db, currentUser, "IMPORT_SPREADSHEET_NOTES", "NOTE", null, {
          total: created.length,
          fileName: normalizeText(body.fileName),
          mode: "browser",
        });
        maybePersist(db);
        return { items: created };
      }

      const noteId = getPathId(path, "/api/notes");
      if (noteId && method === "PUT") {
        const currentUser = requireAuth(user);
        const existingNote = db.notes.find((item) => Number(item.id) === noteId);
        if (!existingNote) {
          throw new ApiError(404, "Nota nao encontrada.");
        }

        const note = createOrUpdateNote(db, body, currentUser, { existingNote });
        maybePersist(db);
        return { item: note };
      }

      if (noteId && method === "DELETE") {
        const currentUser = requireRoles(user, ["ADMIN"]);
        const index = db.notes.findIndex((item) => Number(item.id) === noteId);
        if (index === -1) {
          throw new ApiError(404, "Nota nao encontrada.");
        }
        const [existingNote] = db.notes.splice(index, 1);
        logAction(db, currentUser, "DELETE_NOTE", "NOTE", existingNote.id, {
          supplierName: existingNote.supplierName,
          danfe: existingNote.danfe,
        });
        maybePersist(db);
        return { ok: true };
      }

      if (path === "/api/vehicles" && method === "GET") {
        requireAuth(user);
        return {
          items: queryVehicles(db, {
            activeOnly: ["1", "true", "yes"].includes(String(query.activeOnly || "").toLowerCase()),
            fuelKind: query.fuelKind,
            plate: query.plate,
          }),
        };
      }

      if (path === "/api/vehicles" && method === "POST") {
        const currentUser = requireAuth(user);
        const plate = normalizePlate(body.plate);
        const fuelProfile = normalizeVehicleFuelProfile(body.fuelProfile || body.fuelType, "S500");
        const brand = normalizeText(body.brand);
        const model = normalizeText(body.model);
        const sector = normalizeText(body.sector || body.operation);
        const notes = normalizeText(body.notes || body.observation);
        const status = normalizeText(body.status || "ACTIVE").toUpperCase();
        const active = status !== "INACTIVE";

        if (!plate) {
          throw new ApiError(400, "A placa do veiculo e obrigatoria.");
        }

        const duplicate = db.vehicles.find((item) => normalizePlate(item.plate) === plate);
        if (duplicate) {
          throw new ApiError(409, "Ja existe um veiculo cadastrado com esta placa.");
        }

        const timestamp = nowIso();
        const vehicleId = nextId(db, "vehicles");
        db.vehicles.push({
          id: vehicleId,
          plate,
          fuelProfile,
          brand,
          model,
          sector,
          notes,
          active,
          createdBy: currentUser.id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        db.fuelRecords.forEach((record) => {
          if ((!record.vehicleId || Number(record.vehicleId) === 0) && normalizePlate(record.plate) === plate) {
            record.vehicleId = vehicleId;
          }
        });

        logAction(db, currentUser, "CREATE_VEHICLE", "VEHICLE", vehicleId, {
          plate,
          fuelProfile,
          brand,
          model,
          sector,
          active,
        });
        maybePersist(db);
        return { item: queryVehicles(db).find((item) => item.id === vehicleId) || null };
      }

      const vehicleId = getPathId(path, "/api/vehicles");
      if (vehicleId && method === "PUT") {
        const currentUser = requireAuth(user);
        const existing = db.vehicles.find((item) => Number(item.id) === vehicleId);
        if (!existing) {
          throw new ApiError(404, "Veiculo nao encontrado.");
        }

        const plate = normalizePlate(body.plate || existing.plate);
        const fuelProfile = normalizeVehicleFuelProfile(body.fuelProfile || body.fuelType || existing.fuelProfile, "S500");
        const brand = normalizeText(body.brand || existing.brand);
        const model = normalizeText(body.model || existing.model);
        const sector = normalizeText(body.sector || body.operation || existing.sector);
        const notes = normalizeText(body.notes || body.observation || existing.notes);
        const status = normalizeText(body.status || (existing.active === false ? "INACTIVE" : "ACTIVE")).toUpperCase();
        const active = status !== "INACTIVE";

        const duplicate = db.vehicles.find(
          (item) => Number(item.id) !== vehicleId && normalizePlate(item.plate) === plate
        );
        if (duplicate) {
          throw new ApiError(409, "Ja existe um veiculo cadastrado com esta placa.");
        }

        existing.plate = plate;
        existing.fuelProfile = fuelProfile;
        existing.brand = brand;
        existing.model = model;
        existing.sector = sector;
        existing.notes = notes;
        existing.active = active;
        existing.updatedAt = nowIso();

        db.fuelRecords.forEach((record) => {
          if (Number(record.vehicleId) === vehicleId) {
            record.plate = plate;
            record.vehicleId = vehicleId;
          }
        });

        logAction(db, currentUser, "UPDATE_VEHICLE", "VEHICLE", vehicleId, {
          plate,
          fuelProfile,
          brand,
          model,
          sector,
          active,
        });
        maybePersist(db);
        return { item: queryVehicles(db).find((item) => item.id === vehicleId) || null };
      }

      if (path === "/api/products" && method === "GET") {
        requireAuth(user);
        return { items: queryProducts(db, query.search || "") };
      }

      if (path.startsWith("/api/products/barcode/") && method === "GET") {
        requireAuth(user);
        const barcode = decodeURIComponent(path.slice("/api/products/barcode/".length));
        const product = db.products.find(
          (item) => item.active !== false && normalizeText(item.barcode) === normalizeText(barcode)
        );
        if (!product) {
          throw new ApiError(404, "Produto nao encontrado para este codigo de barras.");
        }
        return {
          item: {
            id: Number(product.id),
            name: product.name,
            unit: product.unit,
            barcode: product.barcode || "",
            minStock: Number(product.minStock || 0),
            currentStock: Number(product.currentStock || 0),
          },
        };
      }

      if (path === "/api/products" && method === "POST") {
        const currentUser = requireAuth(user);
        const name = normalizeText(body.name);
        const unit = normalizeText(body.unit || "UN").toUpperCase();
        const barcode = normalizeText(body.barcode);
        const minStock = toNumber(body.minStock);
        const initialStock = toNumber(body.initialStock);
        const defaultCost = toNumber(body.defaultCost);

        if (!name) {
          throw new ApiError(400, "Nome do produto e obrigatorio.");
        }

        const barcodeInUse = barcode
          ? db.products.find((item) => item.active !== false && normalizeText(item.barcode) === barcode)
          : null;
        if (barcodeInUse) {
          throw new ApiError(409, "Este codigo de barras ja esta vinculado a outro produto.");
        }

        const timestamp = nowIso();
        const productId = nextId(db, "products");
        db.products.push({
          id: productId,
          name,
          unit,
          barcode: barcode || "",
          minStock,
          currentStock: initialStock,
          defaultCost,
          active: true,
          createdBy: currentUser.id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        if (initialStock > 0) {
          db.inventoryMovements.push({
            id: nextId(db, "inventoryMovements"),
            productId,
            type: "IN",
            quantity: initialStock,
            balanceAfter: initialStock,
            document: "SALDO-INICIAL",
            branchName: "",
            supplierName: "",
            fuelKind: "",
            unitCost: defaultCost,
            totalCost: defaultCost * initialStock,
            notes: "Saldo inicial do produto",
            occurredAt: timestamp,
            createdBy: currentUser.id,
            createdAt: timestamp,
          });
        }

        logAction(db, currentUser, "CREATE_PRODUCT", "PRODUCT", productId, {
          name,
          barcode,
          initialStock,
          defaultCost,
        });
        maybePersist(db);
        return { item: queryProducts(db).find((item) => item.id === productId) || null };
      }

      const productId = getPathId(path, "/api/products");
      if (productId && method === "PUT") {
        const currentUser = requireAuth(user);
        const existing = db.products.find((item) => Number(item.id) === productId);
        if (!existing) {
          throw new ApiError(404, "Produto nao encontrado.");
        }

        const name = normalizeText(body.name || existing.name);
        const unit = normalizeText(body.unit || existing.unit).toUpperCase();
        const barcode = normalizeText(body.barcode || existing.barcode);
        const minStock = toNumber(body.minStock ?? existing.minStock);
        const defaultCost = toNumber(body.defaultCost ?? existing.defaultCost);

        const barcodeInUse = barcode
          ? db.products.find(
              (item) =>
                item.active !== false &&
                Number(item.id) !== productId &&
                normalizeText(item.barcode) === barcode
            )
          : null;
        if (barcodeInUse) {
          throw new ApiError(409, "Este codigo de barras ja esta vinculado a outro produto.");
        }

        existing.name = name;
        existing.unit = unit;
        existing.barcode = barcode || "";
        existing.minStock = minStock;
        existing.defaultCost = defaultCost;
        existing.updatedAt = nowIso();

        logAction(db, currentUser, "UPDATE_PRODUCT", "PRODUCT", productId, {
          name,
          barcode,
          minStock,
          defaultCost,
        });
        maybePersist(db);
        return { item: queryProducts(db).find((item) => item.id === productId) || null };
      }

      if (path === "/api/inventory/movements" && method === "GET") {
        requireAuth(user);
        return { items: queryInventoryMovements(db, query) };
      }

      if (path === "/api/reports/kardex" && method === "GET") {
        requireAuth(user);
        return { report: buildKardexReport(db, query) };
      }

      if (path === "/api/inventory/movements" && method === "POST") {
        const currentUser = requireAuth(user);
        const movementProductId = Number(body.productId);
        const type = normalizeInventoryMovement(body.type, "IN");
        const quantity = toNumber(body.quantity);
        const document = normalizeText(body.document);
        const branchName = normalizeText(body.branchName || body.branch || body.unitName);
        const supplierName = normalizeText(body.supplierName || body.supplier);
        const fuelKind = normalizeFuelKind(body.fuelKind, "");
        const rawUnitCost = normalizeText(body.unitCost);
        const unitCost = rawUnitCost ? toNumber(rawUnitCost) : null;
        const notes = normalizeText(body.notes);
        const occurredAt = normalizeText(body.occurredAt) || nowIso();

        if (!movementProductId || quantity <= 0) {
          throw new ApiError(400, "Informe produto e quantidade valida.");
        }

        const product = db.products.find(
          (item) => Number(item.id) === movementProductId && item.active !== false
        );
        if (!product) {
          throw new ApiError(404, "Produto nao encontrado.");
        }

        const currentStock = Number(product.currentStock || 0);
        const nextStock = type === "IN" ? currentStock + quantity : currentStock - quantity;
        const effectiveUnitCost = unitCost === null ? Number(product.defaultCost || 0) : unitCost;
        const totalCost = effectiveUnitCost * quantity;
        if (nextStock < 0) {
          throw new ApiError(400, "A saida nao pode deixar o estoque negativo.");
        }
        if (effectiveUnitCost < 0) {
          throw new ApiError(400, "Informe um valor unitario valido.");
        }

        const movementId = nextId(db, "inventoryMovements");
        db.inventoryMovements.push({
          id: movementId,
          productId: movementProductId,
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
          createdBy: currentUser.id,
          createdAt: nowIso(),
        });

        product.currentStock = nextStock;
        if (type === "IN" && effectiveUnitCost > 0) {
          product.defaultCost = effectiveUnitCost;
        }
        product.updatedAt = nowIso();

        logAction(db, currentUser, "CREATE_INVENTORY_MOVEMENT", "INVENTORY", movementId, {
          productId: movementProductId,
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
        maybePersist(db);
        return {
          item:
            queryInventoryMovements(db, { productId: movementProductId }).find((item) => item.id === movementId) ||
            null,
        };
      }

      if (path === "/api/fuel" && method === "GET") {
        requireAuth(user);
        return {
          items: queryFuelRecords(db, query),
          storages: queryFuelStorages(db),
          summary: queryFuelOverview(db),
        };
      }

      if (path === "/api/fuel" && method === "POST") {
        const currentUser = requireAuth(user);
        const storageId = Number(body.storageId);
        const type = normalizeFuelType(body.type, "ENTRY");
        const selectedVehicleId = Number(body.vehicleId || 0);
        const fallbackPlate = normalizePlate(body.plate);
        const quantity = toNumber(body.quantity);
        const rawOdometer = normalizeText(body.odometerKm);
        const odometerKm = rawOdometer ? toNumber(rawOdometer) : null;
        const notes = normalizeText(body.notes);
        const occurredAt = normalizeText(body.occurredAt) || nowIso();

        if (!storageId || quantity <= 0) {
          throw new ApiError(400, "Informe estoque e quantidade valida.");
        }

        if (rawOdometer && (!/\d/.test(rawOdometer) || odometerKm < 0)) {
          throw new ApiError(400, "Informe um hodometro valido.");
        }

        const storage = db.fuelStorages.find(
          (item) => Number(item.id) === storageId && item.active !== false
        );
        if (!storage) {
          throw new ApiError(404, "Estoque de combustivel nao encontrado.");
        }

        let vehicle =
          db.vehicles.find((item) => Number(item.id) === selectedVehicleId && item.active !== false) || null;
        if (!vehicle && fallbackPlate) {
          vehicle = db.vehicles.find(
            (item) => item.active !== false && normalizePlate(item.plate) === fallbackPlate
          ) || null;
        }

        if (type === "EXIT" && !vehicle) {
          throw new ApiError(400, "Selecione um veiculo ativo para registrar a saida.");
        }

        if (type === "EXIT" && !vehicleSupportsFuel(vehicle?.fuelProfile, storage.fuelKind)) {
          throw new ApiError(400, "Este veiculo nao aceita o combustivel selecionado.");
        }

        const currentBalance = Number(storage.currentBalance || 0);
        const nextBalance = type === "ENTRY" ? currentBalance + quantity : currentBalance - quantity;
        const plate = type === "EXIT" ? normalizePlate(vehicle?.plate) : "";
        const vehicleId = type === "EXIT" ? Number(vehicle?.id || 0) : null;
        if (nextBalance < 0) {
          throw new ApiError(400, `A saida nao pode deixar o estoque ${storage.name} negativo.`);
        }

        const recordId = nextId(db, "fuelRecords");
        const timestamp = nowIso();
        db.fuelRecords.push({
          id: recordId,
          storageId,
          storageName: storage.name,
          fuelKind: storage.fuelKind,
          vehicleId,
          type,
          plate,
          quantity,
          odometerKm,
          balanceBefore: currentBalance,
          balanceAfter: nextBalance,
          notes,
          occurredAt,
          createdBy: currentUser.id,
          createdAt: timestamp,
        });

        storage.currentBalance = nextBalance;
        storage.updatedAt = timestamp;

        logAction(db, currentUser, "CREATE_FUEL_RECORD", "FUEL", recordId, {
          storageId,
          storageName: storage.name,
          fuelKind: storage.fuelKind,
          vehicleId,
          type,
          plate,
          quantity,
          odometerKm,
          balanceBefore: currentBalance,
          balanceAfter: nextBalance,
        });
        maybePersist(db);
        return { item: queryFuelRecords(db).find((item) => item.id === recordId) || null };
      }

      if (path === "/api/schedules" && method === "GET") {
        requireAuth(user);
        return { items: querySchedules(db, query.date || "") };
      }

      if (path === "/api/schedules" && method === "POST") {
        const currentUser = requireAuth(user);
        const scheduledDate = normalizeText(body.scheduledDate);
        const vehicle = normalizeText(body.vehicle);
        const location = normalizeText(body.location);
        const driver = normalizeText(body.driver);
        const assistant = normalizeText(body.assistant);
        const responsibleName = normalizeText(body.responsibleName || currentUser.name);
        const notes = normalizeText(body.notes);

        if (!scheduledDate || !vehicle || !driver) {
          throw new ApiError(400, "Data, veiculo e motorista sao obrigatorios.");
        }

        const scheduleId = nextId(db, "schedules");
        const createdAt = nowIso();
        db.schedules.push({
          id: scheduleId,
          scheduledDate,
          vehicle,
          location,
          driver,
          assistant,
          responsibleName,
          notes,
          createdBy: currentUser.id,
          createdAt,
          updatedAt: createdAt,
        });

        logAction(db, currentUser, "CREATE_SCHEDULE", "SCHEDULE", scheduleId, {
          scheduledDate,
          vehicle,
          location,
          driver,
          responsibleName,
        });
        maybePersist(db);
        return { item: querySchedules(db).find((item) => item.id === scheduleId) || null };
      }

      const scheduleId = getPathId(path, "/api/schedules");
      if (scheduleId && method === "PUT") {
        const currentUser = requireAuth(user);
        const existing = db.schedules.find((item) => Number(item.id) === scheduleId);
        if (!existing) {
          throw new ApiError(404, "Escala nao encontrada.");
        }

        existing.scheduledDate = normalizeText(body.scheduledDate || existing.scheduledDate);
        existing.vehicle = normalizeText(body.vehicle || existing.vehicle);
        existing.location = normalizeText(body.location || existing.location);
        existing.driver = normalizeText(body.driver || existing.driver);
        existing.assistant = normalizeText(body.assistant || existing.assistant);
        existing.responsibleName = normalizeText(body.responsibleName || existing.responsibleName);
        existing.notes = normalizeText(body.notes || existing.notes);
        existing.updatedAt = nowIso();

        logAction(db, currentUser, "UPDATE_SCHEDULE", "SCHEDULE", scheduleId, {
          scheduledDate: existing.scheduledDate,
          vehicle: existing.vehicle,
          location: existing.location,
          driver: existing.driver,
          responsibleName: existing.responsibleName,
        });
        maybePersist(db);
        return { item: querySchedules(db).find((item) => item.id === scheduleId) || null };
      }

      if (path === "/api/fines" && method === "GET") {
        requireAuth(user);
        return { items: queryFines(db) };
      }

      if (path === "/api/fines" && method === "POST") {
        const currentUser = requireAuth(user);
        const fineDate = normalizeText(body.fineDate);
        const plate = normalizeText(body.plate).toUpperCase();
        const driver = normalizeText(body.driver);
        const status = normalizeFineStatus(body.status, "OPEN");
        const amount = toNumber(body.amount);
        const notes = normalizeText(body.notes);

        if (!fineDate || !plate || !driver) {
          throw new ApiError(400, "Data, placa e condutor sao obrigatorios.");
        }

        const fineId = nextId(db, "fines");
        const createdAt = nowIso();
        db.fines.push({
          id: fineId,
          fineDate,
          plate,
          driver,
          status,
          amount,
          notes,
          createdBy: currentUser.id,
          createdAt,
          updatedAt: createdAt,
        });

        logAction(db, currentUser, "CREATE_FINE", "FINE", fineId, {
          fineDate,
          plate,
          driver,
          status,
        });
        maybePersist(db);
        return { item: queryFines(db).find((item) => item.id === fineId) || null };
      }

      const fineId = getPathId(path, "/api/fines");
      if (fineId && method === "PUT") {
        const currentUser = requireAuth(user);
        const existing = db.fines.find((item) => Number(item.id) === fineId);
        if (!existing) {
          throw new ApiError(404, "Multa nao encontrada.");
        }

        existing.fineDate = normalizeText(body.fineDate || existing.fineDate);
        existing.plate = normalizeText(body.plate || existing.plate).toUpperCase();
        existing.driver = normalizeText(body.driver || existing.driver);
        existing.status = normalizeFineStatus(body.status || existing.status, "OPEN");
        existing.amount = toNumber(body.amount ?? existing.amount);
        existing.notes = normalizeText(body.notes || existing.notes);
        existing.updatedAt = nowIso();

        logAction(db, currentUser, "UPDATE_FINE", "FINE", fineId, {
          fineDate: existing.fineDate,
          plate: existing.plate,
          driver: existing.driver,
          status: existing.status,
        });
        maybePersist(db);
        return { item: queryFines(db).find((item) => item.id === fineId) || null };
      }

      if (path === "/api/checklists" && method === "GET") {
        requireAuth(user);
        return { items: queryChecklists(db) };
      }

      if (path === "/api/checklists" && method === "POST") {
        const currentUser = requireAuth(user);
        const vehicle = normalizeText(body.vehicle);
        const checklistDate = normalizeText(body.checklistDate);
        const problems = normalizeText(body.problems);
        const checklistPayload = buildChecklistStoragePayload(body);
        const status = normalizeChecklistStatus(body.status, checklistPayload.overallStatus);

        if (!vehicle || !checklistDate || !checklistPayload.itemsDetailed.length) {
          throw new ApiError(400, "Veiculo, data e itens do checklist sao obrigatorios.");
        }

        const checklistId = nextId(db, "checklists");
        const createdAt = nowIso();
        db.checklists.push({
          id: checklistId,
          vehicle,
          checklistDate,
          itemsJson: checklistPayload.storedJson,
          problems,
          status,
          createdBy: currentUser.id,
          createdAt,
          updatedAt: createdAt,
        });

        logAction(db, currentUser, "CREATE_CHECKLIST", "CHECKLIST", checklistId, {
          vehicle,
          checklistDate,
          status,
          driverName: checklistPayload.meta.driverName,
          checklistType: checklistPayload.meta.checklistType,
        });
        maybePersist(db);
        return { item: queryChecklists(db).find((item) => item.id === checklistId) || null };
      }

      const checklistId = getPathId(path, "/api/checklists");
      if (checklistId && method === "PUT") {
        const currentUser = requireAuth(user);
        const existing = db.checklists.find((item) => Number(item.id) === checklistId);
        if (!existing) {
          throw new ApiError(404, "Checklist nao encontrado.");
        }

        const vehicle = normalizeText(body.vehicle || existing.vehicle);
        const checklistDate = normalizeText(body.checklistDate || existing.checklistDate);
        const problems = normalizeText(body.problems || existing.problems);
        const checklistPayload = buildChecklistStoragePayload(body, existing.itemsJson);
        const status = normalizeChecklistStatus(body.status || existing.status, checklistPayload.overallStatus);

        existing.vehicle = vehicle;
        existing.checklistDate = checklistDate;
        existing.itemsJson = checklistPayload.storedJson;
        existing.problems = problems;
        existing.status = status;
        existing.updatedAt = nowIso();

        logAction(db, currentUser, "UPDATE_CHECKLIST", "CHECKLIST", checklistId, {
          vehicle,
          checklistDate,
          status,
          driverName: checklistPayload.meta.driverName,
          checklistType: checklistPayload.meta.checklistType,
        });
        maybePersist(db);
        return { item: queryChecklists(db).find((item) => item.id === checklistId) || null };
      }

      if (path === "/api/emails" && method === "GET") {
        requireAuth(user);
        return { items: queryEmails(db) };
      }

      if (path === "/api/emails/process" && method === "POST") {
        const currentUser = requireAuth(user);
        const payload = body.rawEml
          ? { ...parseEml(body.rawEml), xmlContent: body.xmlContent || "" }
          : body;
        const analyzed = analyzeEmailPayload(payload);

        let linkedNoteId = null;
        let detectedSupplier = "";
        let classification = analyzed.spamScore >= 60 ? "SPAM" : "REVIEW";
        let status = analyzed.spamScore >= 60 ? "SPAM" : "RECEIVED";

        if (analyzed.hasXml && analyzed.xmlContent && analyzed.spamScore < 60) {
          const parsedInvoice = parseInvoiceXml(analyzed.xmlContent, "email.xml");
          detectedSupplier = parsedInvoice.supplierName;
          const note = createOrUpdateNote(
            db,
            {
              supplierName: parsedInvoice.supplierName,
              totalValue: parsedInvoice.totalValue,
              danfe: parsedInvoice.danfe,
              xmlKey: parsedInvoice.xmlKey,
              issueDate: parsedInvoice.issueDate,
              status: "NEW",
              source: "EMAIL",
            },
            currentUser,
            { source: "EMAIL", skipLog: true, preferExistingWorkflow: true }
          );
          linkedNoteId = note.id;
          classification = note.category;
          status = "XML_IDENTIFIED";
        }

        const emailId = nextId(db, "emails");
        db.emails.push({
          id: emailId,
          sender: analyzed.sender || "nao-informado",
          subject: analyzed.subject,
          body: analyzed.body,
          receivedAt: analyzed.receivedAt,
          spamScore: analyzed.spamScore,
          spamReason: analyzed.spamReason,
          hasXml: analyzed.hasXml,
          detectedSupplier: detectedSupplier || "",
          classification,
          status,
          linkedNoteId,
          createdBy: currentUser.id,
          createdAt: nowIso(),
        });

        logAction(db, currentUser, "PROCESS_EMAIL", "EMAIL", emailId, {
          hasXml: analyzed.hasXml,
          spamScore: analyzed.spamScore,
          linkedNoteId,
        });
        maybePersist(db);
        return { item: queryEmails(db).find((item) => item.id === emailId) || null };
      }

      if (path === "/api/admin/users" && method === "GET") {
        requireRoles(user, ["ADMIN"]);
        return { items: queryAdminUsers(db) };
      }

      if (path === "/api/admin/users" && method === "POST") {
        const currentUser = requireRoles(user, ["ADMIN"]);
        const name = normalizeText(body.name);
        const email = normalizeText(body.email).toLowerCase();
        const role = normalizeRole(body.role, "OPERATIONAL");
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name || !email) {
          throw new ApiError(400, "Informe nome, email e perfil.");
        }

        if (!emailPattern.test(email)) {
          throw new ApiError(400, "Informe um email valido.");
        }

        const emailInUse = db.users.find((item) => normalizeText(item.email).toLowerCase() === email);
        if (emailInUse) {
          throw new ApiError(409, "Ja existe um usuario cadastrado com este email.");
        }

        const createdAt = nowIso();
        const userId = nextId(db, "users");
        db.users.push({
          id: userId,
          name,
          email,
          passwordHash: await createProvisioningPasswordHash(),
          role,
          inviteCodeUsed: "ADMIN-PROVISIONED",
          active: false,
          status: USER_STATUSES.PENDING,
          isSystem: false,
          createdAt,
          updatedAt: createdAt,
        });

        logAction(db, currentUser, "CREATE_USER", "USER", userId, {
          email,
          role,
          status: USER_STATUSES.PENDING,
          mode: "browser",
        });
        maybePersist(db);
        return { item: queryAdminUsers(db).find((item) => item.id === userId) || null };
      }

      const adminUserId = getPathId(path, "/api/admin/users");
      if (adminUserId && method === "PUT") {
        const currentUser = requireRoles(user, ["ADMIN"]);
        const existing = findManagedUser(db, adminUserId);
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!existing) {
          throw new ApiError(404, "Usuario nao encontrado.");
        }

        const name = normalizeText(body.name || existing.name);
        const email = normalizeText(body.email || existing.email).toLowerCase();
        const role = normalizeRole(body.role || existing.role, existing.role);

        if (!name || !email) {
          throw new ApiError(400, "Informe nome, email e perfil.");
        }

        if (!emailPattern.test(email)) {
          throw new ApiError(400, "Informe um email valido.");
        }

        const emailInUse = db.users.find(
          (item) => Number(item.id) !== Number(adminUserId) && normalizeText(item.email).toLowerCase() === email
        );
        if (emailInUse) {
          throw new ApiError(409, "Ja existe um usuario cadastrado com este email.");
        }

        existing.name = name;
        existing.email = email;
        existing.role = role;
        existing.updatedAt = nowIso();

        logAction(db, currentUser, "UPDATE_USER", "USER", adminUserId, {
          email,
          role,
          status: resolveUserStatus(existing),
          mode: "browser",
        });
        maybePersist(db);
        return { item: queryAdminUsers(db).find((item) => item.id === adminUserId) || null };
      }

      const activationCodeMatch = path.match(/^\/api\/admin\/users\/(\d+)\/activation-code$/);
      if (activationCodeMatch && method === "POST") {
        const currentUser = requireRoles(user, ["ADMIN"]);
        const managedUserId = Number(activationCodeMatch[1]);
        const existing = findManagedUser(db, managedUserId);
        const purpose = normalizeText(body.purpose).toUpperCase() === "RESET_PASSWORD" ? "RESET_PASSWORD" : "ACTIVATION";

        if (!existing) {
          throw new ApiError(404, "Usuario nao encontrado.");
        }

        if (resolveUserStatus(existing) === USER_STATUSES.BLOCKED) {
          throw new ApiError(400, "Desbloqueie o usuario antes de emitir um novo codigo.");
        }

        invalidateActivationCodes(db, managedUserId);
        clearUserSession(managedUserId);
        existing.passwordHash = await createProvisioningPasswordHash();
        existing.active = false;
        existing.status = USER_STATUSES.PENDING;
        existing.updatedAt = nowIso();
        const issued = issueActivationCode(db, managedUserId, currentUser.id, purpose);

        logAction(
          db,
          currentUser,
          purpose === "RESET_PASSWORD" ? "ISSUE_PASSWORD_RESET_CODE" : "ISSUE_ACTIVATION_CODE",
          "USER",
          managedUserId,
          { purpose, expiresAt: issued.expiresAt, mode: "browser" }
        );
        maybePersist(db);
        return {
          item: queryAdminUsers(db).find((item) => item.id === managedUserId) || null,
          code: issued.code,
          purpose,
          expiresAt: issued.expiresAt,
        };
      }

      const statusMatch = path.match(/^\/api\/admin\/users\/(\d+)\/status$/);
      if (statusMatch && method === "POST") {
        const currentUser = requireRoles(user, ["ADMIN"]);
        const managedUserId = Number(statusMatch[1]);
        const existing = findManagedUser(db, managedUserId);
        const nextStatus = normalizeText(body.status).toUpperCase();

        if (!existing) {
          throw new ApiError(404, "Usuario nao encontrado.");
        }

        if (nextStatus !== USER_STATUSES.ACTIVE && nextStatus !== USER_STATUSES.BLOCKED) {
          throw new ApiError(400, "Status invalido.");
        }

        if (nextStatus === USER_STATUSES.ACTIVE && resolveUserStatus(existing) === USER_STATUSES.PENDING) {
          throw new ApiError(400, "Para liberar este usuario, gere um codigo e conclua a ativacao.");
        }

        existing.status = nextStatus;
        existing.active = nextStatus === USER_STATUSES.ACTIVE;
        existing.updatedAt = nowIso();

        if (nextStatus === USER_STATUSES.BLOCKED) {
          invalidateActivationCodes(db, managedUserId);
          clearUserSession(managedUserId);
        }

        logAction(
          db,
          currentUser,
          nextStatus === USER_STATUSES.BLOCKED ? "BLOCK_USER" : "UNBLOCK_USER",
          "USER",
          managedUserId,
          { status: nextStatus, mode: "browser" }
        );
        maybePersist(db);
        return { item: queryAdminUsers(db).find((item) => item.id === managedUserId) || null };
      }

      if (path === "/api/admin/invites" && (method === "GET" || method === "POST")) {
        requireRoles(user, ["ADMIN"]);
        throw new ApiError(410, "Convites publicos foram desativados.");
      }

      if (path === "/api/admin/logs" && method === "GET") {
        requireRoles(user, ["ADMIN"]);
        const limit = Math.min(Number(query.limit || 100), 300);
        const items = db.actionLogs
          .slice()
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || Number(right.id) - Number(left.id))
          .slice(0, limit)
          .map((log) => {
            const relatedUser = log.userId ? getUserById(db, log.userId) : null;
            const relatedUserIsSystem = isSystemUser(relatedUser);
            return {
              id: Number(log.id),
              userId: log.userId && !relatedUserIsSystem ? Number(log.userId) : null,
              userName: relatedUserIsSystem ? "Conta interna" : log.userName,
              action: log.action,
              entityType: log.entityType,
              entityId: log.entityId,
              details: redactSensitiveDetails(log.details ?? null),
              createdAt: log.createdAt,
            };
          });
        return { items };
      }

      throw new ApiError(404, "Rota nao encontrada no modo navegador.");
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.status || 400, error.message || "Falha no modo navegador.");
    }
  }

  function detectPreferredMode() {
    const explicitMode = new URLSearchParams(window.location.search).get("mode");
    if (explicitMode === "browser" || explicitMode === "local" || explicitMode === "static") {
      return "browser";
    }
    if (explicitMode === "server" || explicitMode === "api") {
      return "server";
    }
    if (window.location.protocol === "file:" || window.location.hostname.endsWith("github.io")) {
      return "browser";
    }
    return "auto";
  }

  window.HorizonLocalApi = {
    preferredMode: detectPreferredMode(),
    request,
  };
})();
