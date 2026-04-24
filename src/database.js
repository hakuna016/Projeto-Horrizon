const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const initSqlJs = require("sql.js");
const { hashPassword, verifyPassword } = require("./security");
const { normalizeSpreadsheetIssueDate, nowIso, normalizeKey, normalizeText } = require("./helpers");

const DEFAULT_DB_FILENAME = "logistica.db";
const DEFAULT_DB_PATH = path.join(__dirname, "..", "data", DEFAULT_DB_FILENAME);

function resolveDatabasePath() {
  const configuredPath = String(process.env.DB_PATH || "").trim();
  if (configuredPath) {
    return {
      path: path.resolve(configuredPath),
      source: "DB_PATH",
    };
  }

  const railwayVolumeMountPath = String(process.env.RAILWAY_VOLUME_MOUNT_PATH || "").trim();
  if (railwayVolumeMountPath) {
    return {
      path: path.resolve(railwayVolumeMountPath, DEFAULT_DB_FILENAME),
      source: "RAILWAY_VOLUME_MOUNT_PATH",
    };
  }

  return {
    path: path.resolve(DEFAULT_DB_PATH),
    source: "default",
  };
}

const DATABASE_PATH_INFO = resolveDatabasePath();
const DB_PATH = DATABASE_PATH_INFO.path;
const DB_PATH_SOURCE = DATABASE_PATH_INFO.source;
const LEGACY_PUBLIC_INVITE_CODES = ["ADM-LOG-2026", "GER-LOG-2026", "OPE-LOG-2026"];
const DEFAULT_FUEL_STORAGES = [
  { name: "Estoque S-10", fuelKind: "S10" },
  { name: "Estoque S-500", fuelKind: "S500" },
];
const STOCK_TYPE_ALIASES = {
  common: "COMMON",
  comum: "COMMON",
  estoque_comum: "COMMON",
  almoxarifado: "COMMON",
  fuel: "FUEL",
  combustivel: "FUEL",
  combustiveis: "FUEL",
};
const DEFAULT_MASTER_ADMIN_EMAIL = "master@horizon.internal";
const DEFAULT_MASTER_ADMIN_NAME = "Conta interna";

let SQL = null;
let db = null;
let transactionDepth = 0;

function ensureDatabase() {
  if (!db) {
    throw new Error("Banco SQLite ainda nao inicializado.");
  }
}

function normalizeStockType(value, fallback = "COMMON") {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return fallback;
  }
  return STOCK_TYPE_ALIASES[normalized] || fallback;
}

function fuelProductNameForKind(fuelKind) {
  const normalizedKind = normalizeText(fuelKind).toUpperCase();
  if (normalizedKind === "S10") {
    return "Diesel S-10";
  }
  if (normalizedKind === "S500") {
    return "Diesel S-500";
  }
  return normalizedKind ? `Combustivel ${normalizedKind}` : "Combustivel";
}

function inferStockTypeFromLegacyProduct({ name = "", unit = "", fuelKind = "" }) {
  const normalizedFuelKind = normalizeText(fuelKind).toUpperCase();
  if (normalizedFuelKind) {
    return "FUEL";
  }

  const normalizedName = normalizeKey(name);
  const normalizedUnit = normalizeKey(unit);
  const fuelHints = ["diesel", "gasolina", "etanol", "combustivel", "oleo", "arla", "s_10", "s_500"];

  if (fuelHints.some((hint) => normalizedName.includes(hint))) {
    return "FUEL";
  }

  if (["l", "lt", "lts", "litro", "litros"].includes(normalizedUnit) && /(s[_ ]?10|s[_ ]?500)/i.test(String(name))) {
    return "FUEL";
  }

  return "COMMON";
}

function persistDatabase() {
  ensureDatabase();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const exported = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(exported));
}

function get(sql, params = []) {
  ensureDatabase();
  const statement = db.prepare(sql);

  try {
    statement.bind(params);
    if (!statement.step()) {
      return null;
    }
    return statement.getAsObject();
  } finally {
    statement.free();
  }
}

function all(sql, params = []) {
  ensureDatabase();
  const statement = db.prepare(sql);
  const rows = [];

  try {
    statement.bind(params);
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    return rows;
  } finally {
    statement.free();
  }
}

function write(sql, params = []) {
  ensureDatabase();
  db.run(sql, params);
  if (transactionDepth === 0) {
    persistDatabase();
  }
}

function runScript(sql) {
  ensureDatabase();
  db.exec(sql);
  if (transactionDepth === 0) {
    persistDatabase();
  }
}

function getTableColumns(tableName) {
  ensureDatabase();
  return all(`PRAGMA table_info(${tableName})`).map((row) => row.name);
}

function hasColumn(tableName, columnName) {
  return getTableColumns(tableName).includes(columnName);
}

function ensureColumn(tableName, columnName, definition) {
  if (!hasColumn(tableName, columnName)) {
    runScript(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

function insert(sql, params = []) {
  write(sql, params);
  const row = get("SELECT last_insert_rowid() AS id");
  return row ? Number(row.id) : 0;
}

function transaction(work) {
  ensureDatabase();

  if (transactionDepth > 0) {
    return work();
  }

  transactionDepth += 1;
  db.run("BEGIN");

  try {
    const result = work();
    db.run("COMMIT");
    persistDatabase();
    return result;
  } catch (error) {
    try {
      db.run("ROLLBACK");
    } catch (rollbackError) {
      // Mantem o erro original.
    }
    throw error;
  } finally {
    transactionDepth = 0;
  }
}

function createTables() {
  runScript(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      invite_code_used TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      used_by INTEGER,
      created_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(used_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      purpose TEXT NOT NULL DEFAULT 'ACTIVATION',
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS supplier_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      updated_by INTEGER,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      total_value REAL NOT NULL DEFAULT 0,
      danfe TEXT,
      xml_key TEXT,
      issue_date TEXT,
      category TEXT NOT NULL DEFAULT 'OTHER',
      status TEXT NOT NULL DEFAULT 'NEW',
      source TEXT NOT NULL DEFAULT 'MANUAL',
      finance_notes TEXT,
      sent_to_finance_at TEXT,
      sent_to_finance_by INTEGER,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(sent_to_finance_by) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'UN',
      barcode TEXT,
      stock_type TEXT NOT NULL DEFAULT 'COMMON',
      min_stock REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0,
      default_cost REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      balance_after REAL NOT NULL,
      document TEXT,
      branch_name TEXT,
      supplier_name TEXT,
      fuel_kind TEXT,
      unit_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      notes TEXT,
      source_type TEXT,
      source_id INTEGER,
      occurred_at TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES inventory_products(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate TEXT NOT NULL,
      fuel_profile TEXT NOT NULL DEFAULT 'S500',
      brand TEXT,
      model TEXT,
      sector TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_storages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      fuel_kind TEXT NOT NULL,
      product_id INTEGER,
      current_balance REAL NOT NULL DEFAULT 0,
      min_balance REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES inventory_products(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_id INTEGER,
      storage_name TEXT,
      fuel_kind TEXT,
      vehicle_id INTEGER,
      type TEXT NOT NULL,
      plate TEXT NOT NULL,
      quantity REAL NOT NULL,
      odometer_km REAL,
      balance_before REAL NOT NULL DEFAULT 0,
      balance_after REAL NOT NULL,
      notes TEXT,
      occurred_at TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(storage_id) REFERENCES fuel_storages(id),
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduled_date TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      location TEXT,
      driver TEXT NOT NULL,
      assistant TEXT,
      responsible_name TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fine_date TEXT NOT NULL,
      plate TEXT NOT NULL,
      driver TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle TEXT NOT NULL,
      checklist_date TEXT NOT NULL,
      items_json TEXT NOT NULL,
      problems TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT,
      received_at TEXT NOT NULL,
      spam_score REAL NOT NULL DEFAULT 0,
      spam_reason TEXT,
      has_xml INTEGER NOT NULL DEFAULT 0,
      detected_supplier TEXT,
      classification TEXT NOT NULL DEFAULT 'REVIEW',
      status TEXT NOT NULL DEFAULT 'RECEIVED',
      linked_note_id INTEGER,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(linked_note_id) REFERENCES notes(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL DEFAULT 'Empresa cliente',
      logo_data_url TEXT,
      cnpj TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      primary_color TEXT,
      document_footer TEXT NOT NULL DEFAULT 'Gerado pelo sistema Horizon',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by INTEGER,
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Seguranca',
      required INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      vehicle_type TEXT,
      sort_order INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by INTEGER,
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS action_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
    CREATE INDEX IF NOT EXISTS idx_notes_supplier ON notes(supplier_name);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, occurred_at, id);
    CREATE INDEX IF NOT EXISTS idx_fuel_records_occurred_at ON fuel_records(occurred_at);
    CREATE INDEX IF NOT EXISTS idx_fuel_records_plate ON fuel_records(plate, occurred_at);
    CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items(category, active, sort_order);
    CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_activation_codes_user ON activation_codes(user_id, active, expires_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_xml_key ON notes(xml_key) WHERE xml_key IS NOT NULL AND xml_key <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON inventory_products(barcode) WHERE barcode IS NOT NULL AND barcode <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
  `);
}

function migrateInventorySchema() {
  ensureColumn("inventory_products", "stock_type", "TEXT NOT NULL DEFAULT 'COMMON'");
  ensureColumn("inventory_products", "default_cost", "REAL NOT NULL DEFAULT 0");
  ensureColumn("inventory_movements", "document", "TEXT");
  ensureColumn("inventory_movements", "branch_name", "TEXT");
  ensureColumn("inventory_movements", "supplier_name", "TEXT");
  ensureColumn("inventory_movements", "fuel_kind", "TEXT");
  ensureColumn("inventory_movements", "unit_cost", "REAL NOT NULL DEFAULT 0");
  ensureColumn("inventory_movements", "total_cost", "REAL NOT NULL DEFAULT 0");
  ensureColumn("inventory_movements", "source_type", "TEXT");
  ensureColumn("inventory_movements", "source_id", "INTEGER");

  write(
    `
      UPDATE inventory_products
      SET stock_type = 'COMMON'
      WHERE stock_type IS NULL OR trim(stock_type) = ''
    `
  );

  const inferredFuelProductIds = all(
    `
      SELECT DISTINCT p.id, p.name, p.unit, m.fuel_kind
      FROM inventory_products p
      LEFT JOIN inventory_movements m ON m.product_id = p.id
      WHERE p.active = 1
    `
  )
    .filter((row) => inferStockTypeFromLegacyProduct(row) === "FUEL")
    .map((row) => Number(row.id));

  if (inferredFuelProductIds.length) {
    const placeholders = inferredFuelProductIds.map(() => "?").join(", ");
    write(
      `UPDATE inventory_products SET stock_type = 'FUEL' WHERE id IN (${placeholders})`,
      inferredFuelProductIds
    );
  }

  runScript(`
    CREATE INDEX IF NOT EXISTS idx_inventory_products_stock_type ON inventory_products(stock_type, name);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, occurred_at, id);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_source ON inventory_movements(source_type, source_id);
  `);
}

function migrateVehicleSchema() {
  runScript(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate TEXT NOT NULL,
      fuel_profile TEXT NOT NULL DEFAULT 'S500',
      brand TEXT,
      model TEXT,
      sector TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
  `);

  ensureColumn("fuel_records", "vehicle_id", "INTEGER");

  runScript(`
    CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle ON fuel_records(vehicle_id, occurred_at);
  `);
}

function migrateFuelSchema() {
  ensureColumn("fuel_storages", "product_id", "INTEGER");
  ensureColumn("fuel_records", "storage_id", "INTEGER");
  ensureColumn("fuel_records", "storage_name", "TEXT");
  ensureColumn("fuel_records", "fuel_kind", "TEXT");
  ensureColumn("fuel_records", "vehicle_id", "INTEGER");
  ensureColumn("fuel_records", "odometer_km", "REAL");
  ensureColumn("fuel_records", "balance_before", "REAL NOT NULL DEFAULT 0");
  runScript(
    `
      CREATE INDEX IF NOT EXISTS idx_fuel_records_storage ON fuel_records(storage_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_fuel_records_plate ON fuel_records(plate, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle ON fuel_records(vehicle_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_fuel_storages_product ON fuel_storages(product_id, active);
    `
  );
}

function migrateOperationalSchema() {
  ensureColumn("schedules", "location", "TEXT");
  ensureColumn("schedules", "responsible_name", "TEXT");
  runScript(`
    CREATE TABLE IF NOT EXISTS schedule_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduled_date TEXT NOT NULL UNIQUE,
      document_title TEXT NOT NULL DEFAULT 'ESCALA OPERACIONAL DIARIA',
      responsible_name TEXT,
      general_notes TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS schedule_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_day_id INTEGER NOT NULL,
      legacy_source_id INTEGER UNIQUE,
      line_order INTEGER NOT NULL DEFAULT 1,
      vehicle TEXT NOT NULL,
      location TEXT,
      driver TEXT NOT NULL,
      assistant TEXT,
      departure_time TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(schedule_day_id) REFERENCES schedule_days(id) ON DELETE CASCADE,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_schedule_days_date ON schedule_days(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_schedule_entries_day_order ON schedule_entries(schedule_day_id, line_order, id);
    CREATE INDEX IF NOT EXISTS idx_schedule_entries_vehicle ON schedule_entries(vehicle);
    CREATE INDEX IF NOT EXISTS idx_schedule_entries_driver ON schedule_entries(driver);
  `);

  ensureColumn("schedule_days", "document_title", "TEXT NOT NULL DEFAULT 'ESCALA OPERACIONAL DIARIA'");
  ensureColumn("schedule_days", "responsible_name", "TEXT");
  ensureColumn("schedule_days", "general_notes", "TEXT");
  ensureColumn("schedule_days", "updated_by", "INTEGER");
  ensureColumn("schedule_entries", "legacy_source_id", "INTEGER");
  ensureColumn("schedule_entries", "line_order", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("schedule_entries", "location", "TEXT");
  ensureColumn("schedule_entries", "assistant", "TEXT");
  ensureColumn("schedule_entries", "departure_time", "TEXT");
  ensureColumn("schedule_entries", "notes", "TEXT");
  migrateLegacySchedulesToDailyScale();
}

function migrateLegacySchedulesToDailyScale() {
  const legacyRows = all(
    `
      SELECT s.*
      FROM schedules s
      LEFT JOIN schedule_entries se ON se.legacy_source_id = s.id
      WHERE se.id IS NULL
      ORDER BY s.scheduled_date ASC, s.id ASC
    `
  );

  if (!legacyRows.length) {
    return;
  }

  const fallbackAdmin = get("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1");
  const dayCache = new Map();
  const lineCounterByDate = new Map();

  transaction(() => {
    legacyRows.forEach((row) => {
      const scheduledDate = normalizeText(row.scheduled_date);
      if (!scheduledDate) {
        return;
      }

      let scheduleDay = dayCache.get(scheduledDate);
      if (!scheduleDay) {
        scheduleDay = get("SELECT * FROM schedule_days WHERE scheduled_date = ? LIMIT 1", [scheduledDate]);
      }

      const createdAt = normalizeText(row.created_at) || nowIso();
      const updatedAt = normalizeText(row.updated_at) || createdAt;
      const responsibleName = normalizeText(row.responsible_name);
      const createdBy = Number(row.created_by || fallbackAdmin?.id || 0) || null;

      if (!scheduleDay) {
        const scheduleDayId = insert(
          `
            INSERT INTO schedule_days (
              scheduled_date, document_title, responsible_name, general_notes, created_by, updated_by, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            scheduledDate,
            "ESCALA OPERACIONAL DIARIA",
            responsibleName,
            "",
            createdBy,
            createdBy,
            createdAt,
            updatedAt,
          ]
        );
        scheduleDay = get("SELECT * FROM schedule_days WHERE id = ? LIMIT 1", [scheduleDayId]);
      } else {
        const nextResponsibleName = normalizeText(scheduleDay.responsible_name) || responsibleName;
        const nextCreatedAt = normalizeText(scheduleDay.created_at) || createdAt;
        const nextUpdatedAt =
          normalizeText(scheduleDay.updated_at) && normalizeText(scheduleDay.updated_at) > updatedAt
            ? normalizeText(scheduleDay.updated_at)
            : updatedAt;

        write(
          `
            UPDATE schedule_days
            SET responsible_name = ?,
                created_by = coalesce(created_by, ?),
                updated_by = ?,
                created_at = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [nextResponsibleName, createdBy, createdBy, nextCreatedAt, nextUpdatedAt, scheduleDay.id]
        );
        scheduleDay = get("SELECT * FROM schedule_days WHERE id = ? LIMIT 1", [scheduleDay.id]);
      }

      dayCache.set(scheduledDate, scheduleDay);

      const currentOrder =
        lineCounterByDate.has(scheduledDate)
          ? Number(lineCounterByDate.get(scheduledDate) || 0)
          : Number(
              get(
                "SELECT COALESCE(MAX(line_order), 0) AS total FROM schedule_entries WHERE schedule_day_id = ?",
                [scheduleDay.id]
              )?.total || 0
            );
      const nextOrder = currentOrder + 1;
      lineCounterByDate.set(scheduledDate, nextOrder);

      insert(
        `
          INSERT INTO schedule_entries (
            schedule_day_id, legacy_source_id, line_order, vehicle, location, driver, assistant, departure_time, notes, created_by, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          scheduleDay.id,
          Number(row.id),
          nextOrder,
          normalizeText(row.vehicle),
          normalizeText(row.location),
          normalizeText(row.driver),
          normalizeText(row.assistant),
          "",
          normalizeText(row.notes),
          createdBy,
          createdAt,
          updatedAt,
        ]
      );
    });
  });
}

function migrateAuthSchema() {
  ensureColumn("users", "status", "TEXT NOT NULL DEFAULT 'ACTIVE'");
  ensureColumn("users", "is_system", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("users", "updated_at", "TEXT");

  runScript(`
    CREATE TABLE IF NOT EXISTS activation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      purpose TEXT NOT NULL DEFAULT 'ACTIVATION',
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_activation_codes_user ON activation_codes(user_id, active, expires_at);
  `);

  write(
    `
      UPDATE users
      SET status = CASE WHEN coalesce(active, 1) = 1 THEN 'ACTIVE' ELSE 'BLOCKED' END
      WHERE status IS NULL OR trim(status) = ''
    `
  );
  write(
    `
      UPDATE users
      SET updated_at = coalesce(updated_at, created_at)
      WHERE updated_at IS NULL OR trim(updated_at) = ''
    `
  );
  write("UPDATE users SET is_system = 1 WHERE invite_code_used = 'SEED-ADMIN'");
}

function migrateBrandingSchema() {
  runScript(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL DEFAULT 'Empresa cliente',
      logo_data_url TEXT,
      cnpj TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      primary_color TEXT,
      document_footer TEXT NOT NULL DEFAULT 'Gerado pelo sistema Horizon',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by INTEGER,
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );
  `);

  ensureColumn("company_settings", "company_name", "TEXT NOT NULL DEFAULT 'Empresa cliente'");
  ensureColumn("company_settings", "logo_data_url", "TEXT");
  ensureColumn("company_settings", "cnpj", "TEXT");
  ensureColumn("company_settings", "address", "TEXT");
  ensureColumn("company_settings", "phone", "TEXT");
  ensureColumn("company_settings", "email", "TEXT");
  ensureColumn("company_settings", "primary_color", "TEXT");
  ensureColumn(
    "company_settings",
    "document_footer",
    "TEXT NOT NULL DEFAULT 'Gerado pelo sistema Horizon'"
  );
  ensureColumn("company_settings", "created_at", "TEXT");
  ensureColumn("company_settings", "updated_at", "TEXT");
  ensureColumn("company_settings", "updated_by", "INTEGER");
}

function migrateChecklistTemplateSchema() {
  runScript(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Seguranca',
      required INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      vehicle_type TEXT,
      sort_order INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by INTEGER,
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_checklist_items_category
      ON checklist_items(category, active, sort_order);
  `);

  ensureColumn("checklist_items", "item_key", "TEXT");
  ensureColumn("checklist_items", "name", "TEXT");
  ensureColumn("checklist_items", "description", "TEXT");
  ensureColumn("checklist_items", "category", "TEXT NOT NULL DEFAULT 'Seguranca'");
  ensureColumn("checklist_items", "required", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("checklist_items", "active", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("checklist_items", "vehicle_type", "TEXT");
  ensureColumn("checklist_items", "sort_order", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("checklist_items", "created_at", "TEXT");
  ensureColumn("checklist_items", "updated_at", "TEXT");
  ensureColumn("checklist_items", "updated_by", "INTEGER");
}

function ensureDefaultFuelStorages() {
  const adminUser = get(
    "SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1"
  );
  const createdBy = adminUser ? Number(adminUser.id) : null;
  const timestamp = nowIso();

  transaction(() => {
    for (const storage of DEFAULT_FUEL_STORAGES) {
      const existing = get(
        "SELECT id, fuel_kind, active FROM fuel_storages WHERE name = ? LIMIT 1",
        [storage.name]
      );
      if (!existing) {
        insert(
          `
            INSERT INTO fuel_storages (
              name, fuel_kind, current_balance, min_balance, active, created_by, created_at, updated_at
            )
            VALUES (?, ?, 0, 0, 1, ?, ?, ?)
          `,
          [storage.name, storage.fuelKind, createdBy, timestamp, timestamp]
        );
        continue;
      }

      write(
        `
          UPDATE fuel_storages
          SET fuel_kind = ?, active = 1, updated_at = ?
          WHERE id = ?
        `,
        [storage.fuelKind, timestamp, existing.id]
      );
    }
  });
}

function migrateLegacyFuelRecords() {
  const storages = all(
    `
      SELECT id, name, fuel_kind
      FROM fuel_storages
      WHERE active = 1
      ORDER BY id ASC
    `
  ).map((row) => ({
    id: Number(row.id),
    name: row.name,
    fuelKind: row.fuel_kind,
  }));

  if (!storages.length) {
    return;
  }

  const fallbackStorage = storages[0];
  const storageMap = new Map(storages.map((storage) => [storage.id, storage]));
  const fuelRows = all(
    `
      SELECT id, storage_id, storage_name, fuel_kind, balance_before, balance_after
      FROM fuel_records
      ORDER BY occurred_at ASC, id ASC
    `
  );

  const runningBalances = new Map(storages.map((storage) => [storage.id, 0]));

  transaction(() => {
    for (const row of fuelRows) {
      const storageId = row.storage_id ? Number(row.storage_id) : fallbackStorage.id;
      const storage = storageMap.get(storageId) || fallbackStorage;
      const balanceBefore = Number(runningBalances.get(storage.id) || 0);
      const balanceAfter = Number(row.balance_after || 0);
      const needsPatch =
        !row.storage_id ||
        !row.storage_name ||
        !row.fuel_kind ||
        row.balance_before === null ||
        row.balance_before === undefined ||
        row.balance_before === "";

      if (needsPatch) {
        write(
          `
            UPDATE fuel_records
            SET storage_id = ?, storage_name = ?, fuel_kind = ?, balance_before = ?
            WHERE id = ?
          `,
          [storage.id, storage.name, storage.fuelKind, balanceBefore, row.id]
        );
      }

      runningBalances.set(storage.id, balanceAfter);
    }

    for (const storage of storages) {
      const latestRecord = get(
        `
          SELECT balance_after
          FROM fuel_records
          WHERE storage_id = ?
          ORDER BY occurred_at DESC, id DESC
          LIMIT 1
        `,
        [storage.id]
      );

      write(
        `
          UPDATE fuel_storages
          SET current_balance = ?, updated_at = ?
          WHERE id = ?
        `,
        [Number(latestRecord?.balance_after || 0), nowIso(), storage.id]
      );
    }
  });
}

function consolidateFuelStorages() {
  const timestamp = nowIso();
  const storages = all(
    `
      SELECT id, name, fuel_kind, current_balance, min_balance, active, created_by, created_at
      FROM fuel_storages
      ORDER BY id ASC
    `
  );

  if (!storages.length) {
    return;
  }

  const canonicalIds = new Set();

  transaction(() => {
    for (const definition of DEFAULT_FUEL_STORAGES) {
      const sameKind = storages.filter((storage) => storage.fuel_kind === definition.fuelKind);
      let canonical = sameKind.find((storage) => storage.name === definition.name) || null;

      if (!canonical) {
        const createdId = insert(
          `
            INSERT INTO fuel_storages (
              name, fuel_kind, current_balance, min_balance, active, created_by, created_at, updated_at
            )
            VALUES (?, ?, 0, 0, 1, ?, ?, ?)
          `,
          [definition.name, definition.fuelKind, null, timestamp, timestamp]
        );

        canonical = {
          id: createdId,
          name: definition.name,
          fuel_kind: definition.fuelKind,
          min_balance: 0,
        };
      }

      canonicalIds.add(Number(canonical.id));
      const fuelRows = all(
        `
          SELECT id, type, quantity
          FROM fuel_records
          WHERE fuel_kind = ?
             OR storage_id IN (SELECT id FROM fuel_storages WHERE fuel_kind = ?)
          ORDER BY occurred_at ASC, id ASC
        `,
        [definition.fuelKind, definition.fuelKind]
      );

      let runningBalance = 0;
      for (const row of fuelRows) {
        const quantity = Number(row.quantity || 0);
        const nextBalance = row.type === "ENTRY" ? runningBalance + quantity : runningBalance - quantity;

        write(
          `
            UPDATE fuel_records
            SET storage_id = ?, storage_name = ?, fuel_kind = ?, balance_before = ?, balance_after = ?
            WHERE id = ?
          `,
          [canonical.id, definition.name, definition.fuelKind, runningBalance, nextBalance, row.id]
        );

        runningBalance = nextBalance;
      }

      const minBalance = sameKind.reduce(
        (total, storage) => total + Number(storage.min_balance || 0),
        0
      );

      write(
        `
          UPDATE fuel_storages
          SET name = ?, fuel_kind = ?, current_balance = ?, min_balance = ?, active = 1, updated_at = ?
          WHERE id = ?
        `,
        [definition.name, definition.fuelKind, runningBalance, minBalance, timestamp, canonical.id]
      );

      for (const storage of sameKind) {
        if (Number(storage.id) === Number(canonical.id)) {
          continue;
        }

        write(
          `
            UPDATE fuel_storages
            SET active = 0, current_balance = 0, updated_at = ?
            WHERE id = ?
          `,
          [timestamp, storage.id]
        );
      }
    }

    for (const storage of storages) {
      if (canonicalIds.has(Number(storage.id))) {
        continue;
      }

      if (!DEFAULT_FUEL_STORAGES.some((definition) => definition.fuelKind === storage.fuel_kind)) {
        write(
          `
            UPDATE fuel_storages
            SET active = 0, current_balance = 0, updated_at = ?
            WHERE id = ?
          `,
          [timestamp, storage.id]
        );
      }
    }
  });
}

function matchFuelProductToStorage(product, storage) {
  if (!product || normalizeStockType(product.stock_type, "COMMON") !== "FUEL") {
    return false;
  }

  const normalizedName = normalizeKey(product.name);
  if (!normalizedName) {
    return false;
  }

  const defaultName = normalizeKey(fuelProductNameForKind(storage.fuel_kind));
  if (normalizedName === defaultName) {
    return true;
  }

  if (storage.fuel_kind === "S10") {
    return normalizedName.includes("s10") || normalizedName.includes("s_10");
  }

  if (storage.fuel_kind === "S500") {
    return normalizedName.includes("s500") || normalizedName.includes("s_500");
  }

  return normalizedName.includes(normalizeKey(storage.fuel_kind));
}

function ensureFuelProductsLinkedToStorages() {
  const storages = all(
    `
      SELECT id, name, fuel_kind, product_id, current_balance, min_balance
      FROM fuel_storages
      WHERE active = 1
      ORDER BY id ASC
    `
  );

  if (!storages.length) {
    return;
  }

  const adminUser = get("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1");
  const createdBy = adminUser ? Number(adminUser.id) : null;

  transaction(() => {
    const timestamp = nowIso();
    const products = all("SELECT * FROM inventory_products WHERE active = 1 ORDER BY id ASC");
    const productById = new Map(products.map((product) => [Number(product.id), product]));

    for (const storage of storages) {
      let product =
        (storage.product_id && productById.get(Number(storage.product_id))) || null;

      if (!matchFuelProductToStorage(product, storage)) {
        product = products.find((item) => matchFuelProductToStorage(item, storage)) || null;
      }

      if (!product) {
        const productId = insert(
          `
            INSERT INTO inventory_products (
              name, unit, barcode, stock_type, min_stock, current_stock, default_cost, active, created_by, created_at, updated_at
            )
            VALUES (?, 'L', NULL, 'FUEL', ?, 0, 0, 1, ?, ?, ?)
          `,
          [fuelProductNameForKind(storage.fuel_kind), Number(storage.min_balance || 0), createdBy, timestamp, timestamp]
        );

        product = get("SELECT * FROM inventory_products WHERE id = ? LIMIT 1", [productId]);
        products.push(product);
        productById.set(Number(productId), product);
      } else {
        const resolvedMinStock =
          Number(product.min_stock || 0) > 0
            ? Number(product.min_stock || 0)
            : Number(storage.min_balance || 0);

        write(
          `
            UPDATE inventory_products
            SET stock_type = 'FUEL',
                unit = CASE WHEN trim(COALESCE(unit, '')) = '' THEN 'L' ELSE unit END,
                min_stock = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [resolvedMinStock, timestamp, product.id]
        );

        product.min_stock = resolvedMinStock;
        product.stock_type = "FUEL";
        product.unit = product.unit || "L";
        product.updated_at = timestamp;
      }

      if (Number(storage.product_id || 0) !== Number(product.id)) {
        write(
          `
            UPDATE fuel_storages
            SET product_id = ?, updated_at = ?
            WHERE id = ?
          `,
          [product.id, timestamp, storage.id]
        );
      }

      const fuelRows = all(
        `
          SELECT id, type, plate, quantity, balance_after, notes, occurred_at, created_by, created_at
          FROM fuel_records
          WHERE storage_id = ?
          ORDER BY occurred_at ASC, id ASC
        `,
        [storage.id]
      );

      for (const row of fuelRows) {
        const existingMirror = get(
          `
            SELECT id
            FROM inventory_movements
            WHERE source_type = 'FUEL_RECORD' AND source_id = ?
            LIMIT 1
          `,
          [row.id]
        );

        if (existingMirror) {
          continue;
        }

        const quantity = Number(row.quantity || 0);
        const unitCost = Number(product.default_cost || 0);
        const totalCost = unitCost * quantity;
        const noteParts = [];

        if (normalizeText(row.notes)) {
          noteParts.push(normalizeText(row.notes));
        }
        if (normalizeText(row.plate)) {
          noteParts.push(`Movimento operacional vinculado a ${normalizeText(row.plate)}`);
        }

        insert(
          `
            INSERT INTO inventory_movements (
              product_id, type, quantity, balance_after, document, branch_name, supplier_name, fuel_kind,
              unit_cost, total_cost, notes, source_type, source_id, occurred_at, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, 'FUEL_RECORD', ?, ?, ?, ?)
          `,
          [
            product.id,
            row.type === "ENTRY" ? "IN" : "OUT",
            quantity,
            Number(row.balance_after || 0),
            row.type === "ENTRY" ? "ENTRADA-OPERACIONAL-COMBUSTIVEL" : "ABASTECIMENTO-OPERACIONAL",
            storage.fuel_kind,
            unitCost,
            totalCost,
            noteParts.join(" | "),
            row.id,
            row.occurred_at,
            row.created_by || createdBy,
            row.created_at || row.occurred_at || timestamp,
          ]
        );
      }

      const latestMovement = get(
        `
          SELECT balance_after
          FROM inventory_movements
          WHERE product_id = ?
          ORDER BY occurred_at DESC, id DESC
          LIMIT 1
        `,
        [product.id]
      );

      const targetBalance = Number(storage.current_balance || 0);
      const latestBalance = latestMovement ? Number(latestMovement.balance_after || 0) : 0;
      const balanceDiff = Number((targetBalance - latestBalance).toFixed(6));

      if (!latestMovement && targetBalance > 0) {
        insert(
          `
            INSERT INTO inventory_movements (
              product_id, type, quantity, balance_after, document, branch_name, supplier_name, fuel_kind,
              unit_cost, total_cost, notes, source_type, source_id, occurred_at, created_by, created_at
            )
            VALUES (?, 'IN', ?, ?, 'SALDO-INICIAL-COMBUSTIVEL', NULL, NULL, ?, ?, ?, ?, 'FUEL_STORAGE_SYNC', ?, ?, ?, ?)
          `,
          [
            product.id,
            targetBalance,
            targetBalance,
            storage.fuel_kind,
            Number(product.default_cost || 0),
            Number(product.default_cost || 0) * targetBalance,
            "Saldo inicial sincronizado a partir do tanque de combustivel.",
            storage.id,
            timestamp,
            createdBy,
            timestamp,
          ]
        );
      } else if (latestMovement && Math.abs(balanceDiff) > 0.000001) {
        insert(
          `
            INSERT INTO inventory_movements (
              product_id, type, quantity, balance_after, document, branch_name, supplier_name, fuel_kind,
              unit_cost, total_cost, notes, source_type, source_id, occurred_at, created_by, created_at
            )
            VALUES (?, ?, ?, ?, 'AJUSTE-SALDO-COMBUSTIVEL', NULL, NULL, ?, ?, ?, ?, 'FUEL_STORAGE_SYNC', ?, ?, ?, ?)
          `,
          [
            product.id,
            balanceDiff > 0 ? "IN" : "OUT",
            Math.abs(balanceDiff),
            targetBalance,
            storage.fuel_kind,
            Number(product.default_cost || 0),
            Number(product.default_cost || 0) * Math.abs(balanceDiff),
            "Ajuste automatico para alinhar o Kardex de combustivel ao saldo do tanque.",
            storage.id,
            timestamp,
            createdBy,
            timestamp,
          ]
        );
      }

      write(
        `
          UPDATE inventory_products
          SET stock_type = 'FUEL',
              unit = CASE WHEN trim(COALESCE(unit, '')) = '' THEN 'L' ELSE unit END,
              min_stock = ?,
              current_stock = ?,
              updated_at = ?
          WHERE id = ?
        `,
        [
          Number(product.min_stock || 0) > 0 ? Number(product.min_stock || 0) : Number(storage.min_balance || 0),
          targetBalance,
          timestamp,
          product.id,
        ]
      );
    }
  });
}

function migrateLegacySpreadsheetIssueDates() {
  const rows = all(
    `
      SELECT id, issue_date
      FROM notes
      WHERE source = 'SPREADSHEET'
        AND issue_date IS NOT NULL
        AND trim(issue_date) <> ''
      ORDER BY id ASC
    `
  );

  if (!rows.length) {
    return;
  }

  transaction(() => {
    for (const row of rows) {
      const rawIssueDate = String(row.issue_date ?? "").trim();
      if (!/^\d+(?:[.,]\d+)?$/.test(rawIssueDate)) {
        continue;
      }

      const normalizedIssueDate = normalizeSpreadsheetIssueDate(rawIssueDate);
      if (!normalizedIssueDate || normalizedIssueDate === rawIssueDate) {
        continue;
      }

      write("UPDATE notes SET issue_date = ? WHERE id = ?", [normalizedIssueDate, row.id]);
    }
  });
}

function resolveMasterAdminSeed() {
  const configuredEmail = String(process.env.MASTER_ADMIN_EMAIL || "").trim().toLowerCase();
  const configuredPassword = String(process.env.MASTER_ADMIN_PASSWORD || "").trim();
  const configuredName = String(process.env.MASTER_ADMIN_NAME || "").trim();
  const generatedPassword = crypto.randomBytes(18).toString("base64url");

  return {
    email: configuredEmail || DEFAULT_MASTER_ADMIN_EMAIL,
    password: configuredPassword || generatedPassword,
    name: configuredName || DEFAULT_MASTER_ADMIN_NAME,
    generatedPassword: !configuredPassword,
  };
}

function syncMasterAdminFromEnvironment() {
  const configuredEmail = String(process.env.MASTER_ADMIN_EMAIL || "").trim().toLowerCase();
  const configuredPassword = String(process.env.MASTER_ADMIN_PASSWORD || "").trim();
  const configuredName = String(process.env.MASTER_ADMIN_NAME || "").trim() || DEFAULT_MASTER_ADMIN_NAME;

  if (!configuredEmail && !configuredPassword && !configuredName) {
    return;
  }

  if (!configuredEmail || !configuredPassword) {
    console.warn(
      "[Horizon] MASTER_ADMIN_EMAIL e MASTER_ADMIN_PASSWORD devem ser definidos juntos para sincronizar a conta mestra."
    );
    return;
  }

  const existingSystemUser =
    get(
      `
        SELECT *
        FROM users
        WHERE invite_code_used = 'SEED-ADMIN'
           OR coalesce(is_system, 0) = 1
        ORDER BY id ASC
        LIMIT 1
      `
    ) || null;

  const conflictingUser = get(
    `
      SELECT id, email
      FROM users
      WHERE lower(email) = lower(?)
        AND (? IS NULL OR id <> ?)
      LIMIT 1
    `,
    [configuredEmail, existingSystemUser ? Number(existingSystemUser.id) : null, existingSystemUser ? Number(existingSystemUser.id) : null]
  );

  if (conflictingUser) {
    console.warn(
      `[Horizon] Nao foi possivel sincronizar a conta mestra: o email ${configuredEmail} ja esta em uso por outro usuario.`
    );
    return;
  }

  const existingName = existingSystemUser ? String(existingSystemUser.name || "").trim() : "";
  const existingEmail = existingSystemUser ? String(existingSystemUser.email || "").trim().toLowerCase() : "";
  const credentialsAlreadyMatch =
    existingSystemUser &&
    existingEmail === configuredEmail &&
    existingName === configuredName &&
    existingSystemUser.role === "ADMIN" &&
    String(existingSystemUser.status || "").toUpperCase() === "ACTIVE" &&
    Number(existingSystemUser.active || 0) === 1 &&
    Number(existingSystemUser.is_system || 0) === 1 &&
    verifyPassword(configuredPassword, existingSystemUser.password_hash);

  if (credentialsAlreadyMatch) {
    return;
  }

  const timestamp = nowIso();

  transaction(() => {
    if (existingSystemUser) {
      write(
        `
          UPDATE users
          SET name = ?,
              email = ?,
              password_hash = ?,
              role = 'ADMIN',
              invite_code_used = 'SEED-ADMIN',
              active = 1,
              status = 'ACTIVE',
              is_system = 1,
              updated_at = ?
          WHERE id = ?
        `,
        [configuredName, configuredEmail, hashPassword(configuredPassword), timestamp, existingSystemUser.id]
      );

      write("DELETE FROM sessions WHERE user_id = ?", [existingSystemUser.id]);
      write("UPDATE activation_codes SET active = 0 WHERE user_id = ? AND active = 1", [existingSystemUser.id]);

      insert(
        `
          INSERT INTO action_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          existingSystemUser.id,
          configuredName,
          "SYNC_MASTER_ADMIN",
          "USER",
          String(existingSystemUser.id),
          JSON.stringify({ email: configuredEmail, source: "env" }),
          timestamp,
        ]
      );
      return;
    }

    const createdId = insert(
      `
        INSERT INTO users (
          name, email, password_hash, role, invite_code_used, active, status, is_system, created_at, updated_at
        )
        VALUES (?, ?, ?, 'ADMIN', 'SEED-ADMIN', 1, 'ACTIVE', 1, ?, ?)
      `,
      [configuredName, configuredEmail, hashPassword(configuredPassword), timestamp, timestamp]
    );

    insert(
      `
        INSERT INTO action_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        createdId,
        configuredName,
        "SYNC_MASTER_ADMIN",
        "USER",
        String(createdId),
        JSON.stringify({ email: configuredEmail, source: "env" }),
        timestamp,
      ]
    );
  });

  if (existingSystemUser) {
    console.log(`[Horizon] Conta mestra sincronizada pelo ambiente para ${configuredEmail}.`);
  } else {
    console.log(`[Horizon] Conta mestra criada pelo ambiente para ${configuredEmail}.`);
  }
}

function revokeLegacyPublicInvites() {
  const legacyInvites = all(
    `
      SELECT id, code
      FROM invite_codes
      WHERE code IN (?, ?, ?)
        AND active = 1
    `,
    LEGACY_PUBLIC_INVITE_CODES
  );

  if (!legacyInvites.length) {
    return;
  }

  transaction(() => {
    for (const invite of legacyInvites) {
      write("UPDATE invite_codes SET active = 0 WHERE id = ?", [invite.id]);
    }

    insert(
      `
        INSERT INTO action_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        null,
        "Sistema",
        "REVOKE_PUBLIC_INVITES",
        "INVITE",
        null,
        JSON.stringify({ revokedCodes: legacyInvites.map((invite) => invite.code) }),
        nowIso(),
      ]
    );
  });
}

function seedDatabase() {
  const usersRow = get("SELECT COUNT(*) AS total FROM users");
  const totalUsers = usersRow ? Number(usersRow.total) : 0;

  if (totalUsers > 0) {
    return;
  }

  const masterAdmin = resolveMasterAdminSeed();

  transaction(() => {
    const createdAt = nowIso();
    insert(
      `
        INSERT INTO users (
          name, email, password_hash, role, invite_code_used, active, status, is_system, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, 1, 'ACTIVE', 1, ?, ?)
      `,
      [
        masterAdmin.name,
        masterAdmin.email,
        hashPassword(masterAdmin.password),
        "ADMIN",
        "SEED-ADMIN",
        createdAt,
        createdAt,
      ]
    );

    insert(
      `
        INSERT INTO action_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        null,
        "Sistema",
        "SEED_DATABASE",
        "SYSTEM",
        null,
        JSON.stringify({ message: "Base inicial criada com conta mestra interna" }),
        createdAt,
      ]
    );
  });

  if (masterAdmin.generatedPassword) {
    console.warn("[Horizon] Conta mestra criada internamente.");
    console.warn(
      "[Horizon] Defina MASTER_ADMIN_EMAIL e MASTER_ADMIN_PASSWORD no ambiente para controlar as credenciais iniciais."
    );
    console.warn(`[Horizon] Email interno: ${masterAdmin.email}`);
    console.warn(`[Horizon] Senha temporaria: ${masterAdmin.password}`);
  }
}

async function initDatabase() {
  if (db) {
    return db;
  }

  SQL = await initSqlJs({
    locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
  });

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON;");
  createTables();
  migrateInventorySchema();
  migrateVehicleSchema();
  migrateFuelSchema();
  migrateOperationalSchema();
  migrateAuthSchema();
  migrateBrandingSchema();
  migrateChecklistTemplateSchema();
  seedDatabase();
  syncMasterAdminFromEnvironment();
  revokeLegacyPublicInvites();
  ensureDefaultFuelStorages();
  migrateLegacyFuelRecords();
  consolidateFuelStorages();
  ensureFuelProductsLinkedToStorages();
  migrateLegacySpreadsheetIssueDates();
  persistDatabase();

  return db;
}

module.exports = {
  DB_PATH,
  DB_PATH_SOURCE,
  initDatabase,
  get,
  all,
  write,
  runScript,
  insert,
  transaction,
};
