const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const { hashPassword } = require("./security");
const { normalizeSpreadsheetIssueDate, nowIso } = require("./helpers");

const DB_PATH = path.join(__dirname, "..", "data", "logistica.db");
const DEFAULT_FUEL_STORAGES = [
  { name: "Estoque S-10", fuelKind: "S10" },
  { name: "Estoque S-500", fuelKind: "S500" },
];

let SQL = null;
let db = null;
let transactionDepth = 0;

function ensureDatabase() {
  if (!db) {
    throw new Error("Banco SQLite ainda nao inicializado.");
  }
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
      created_at TEXT NOT NULL
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
      min_stock REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0,
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
      notes TEXT,
      occurred_at TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES inventory_products(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_storages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      fuel_kind TEXT NOT NULL,
      current_balance REAL NOT NULL DEFAULT 0,
      min_balance REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_id INTEGER,
      storage_name TEXT,
      fuel_kind TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_fuel_records_occurred_at ON fuel_records(occurred_at);
    CREATE INDEX IF NOT EXISTS idx_fuel_records_plate ON fuel_records(plate, occurred_at);
    CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_xml_key ON notes(xml_key) WHERE xml_key IS NOT NULL AND xml_key <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON inventory_products(barcode) WHERE barcode IS NOT NULL AND barcode <> '';
  `);
}

function migrateFuelSchema() {
  ensureColumn("fuel_records", "storage_id", "INTEGER");
  ensureColumn("fuel_records", "storage_name", "TEXT");
  ensureColumn("fuel_records", "fuel_kind", "TEXT");
  ensureColumn("fuel_records", "odometer_km", "REAL");
  ensureColumn("fuel_records", "balance_before", "REAL NOT NULL DEFAULT 0");
  runScript(
    `
      CREATE INDEX IF NOT EXISTS idx_fuel_records_storage ON fuel_records(storage_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_fuel_records_plate ON fuel_records(plate, occurred_at);
    `
  );
}

function migrateOperationalSchema() {
  ensureColumn("schedules", "location", "TEXT");
  ensureColumn("schedules", "responsible_name", "TEXT");
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

function seedDatabase() {
  const usersRow = get("SELECT COUNT(*) AS total FROM users");
  const totalUsers = usersRow ? Number(usersRow.total) : 0;

  if (totalUsers > 0) {
    return;
  }

  transaction(() => {
    const createdAt = nowIso();
    const adminId = insert(
      `
        INSERT INTO users (name, email, password_hash, role, invite_code_used, active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `,
      [
        "Administrador",
        "admin@frigorifico.local",
        hashPassword("admin123"),
        "ADMIN",
        "SEED-ADMIN",
        createdAt,
      ]
    );

    const defaultInvites = [
      ["ADM-LOG-2026", "ADMIN", "Convite inicial para administradores"],
      ["GER-LOG-2026", "MANAGER", "Convite inicial para gerentes"],
      ["OPE-LOG-2026", "OPERATIONAL", "Convite inicial para operacao"],
    ];

    for (const [code, role, notes] of defaultInvites) {
      insert(
        `
          INSERT INTO invite_codes (code, role, notes, active, created_by, created_at)
          VALUES (?, ?, ?, 1, ?, ?)
        `,
        [code, role, notes, adminId, createdAt]
      );
    }

    insert(
      `
        INSERT INTO action_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        adminId,
        "Administrador",
        "SEED_DATABASE",
        "SYSTEM",
        String(adminId),
        JSON.stringify({ message: "Base inicial criada com usuario administrador" }),
        createdAt,
      ]
    );
  });
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
  migrateFuelSchema();
  migrateOperationalSchema();
  seedDatabase();
  ensureDefaultFuelStorages();
  migrateLegacyFuelRecords();
  consolidateFuelStorages();
  migrateLegacySpreadsheetIssueDates();
  persistDatabase();

  return db;
}

module.exports = {
  DB_PATH,
  initDatabase,
  get,
  all,
  write,
  runScript,
  insert,
  transaction,
};
