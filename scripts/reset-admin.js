const { initDatabase, DB_PATH, DB_PATH_SOURCE, get, insert, write, transaction } = require("../src/database");
const { hashPassword } = require("../src/security");
const { nowIso } = require("../src/helpers");

const DEFAULT_ADMIN_EMAIL = "master@horizon.internal";
const DEFAULT_ADMIN_NAME = "Conta interna";

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const part = String(argv[index] || "");
    if (!part.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = part.slice(2).split("=", 2);
    const key = rawKey.trim();
    const nextValue = inlineValue ?? argv[index + 1];

    if (!key) {
      continue;
    }

    if (inlineValue === undefined && String(nextValue || "").startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = String(nextValue ?? "").trim();
    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return args;
}

function printUsage() {
  console.log("Uso:");
  console.log("  npm run admin:reset -- --email admin@empresa.com --password sua-senha-forte --name \"Administrador\"");
  console.log("Ou defina variaveis de ambiente:");
  console.log("  MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD, MASTER_ADMIN_NAME");
}

function resolveInput() {
  const args = parseArgs(process.argv.slice(2));
  const email = normalizeText(args.email || process.env.ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const password = String(args.password || process.env.ADMIN_PASSWORD || process.env.MASTER_ADMIN_PASSWORD || "").trim();
  const name = normalizeText(args.name || process.env.ADMIN_NAME || process.env.MASTER_ADMIN_NAME || DEFAULT_ADMIN_NAME) || DEFAULT_ADMIN_NAME;

  if (!password) {
    throw new Error("Informe a senha com --password ou MASTER_ADMIN_PASSWORD.");
  }

  if (password.length < 8) {
    throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe um email valido com --email ou MASTER_ADMIN_EMAIL.");
  }

  return { email, password, name };
}

async function main() {
  const { email, password, name } = resolveInput();

  await initDatabase();

  const timestamp = nowIso();
  const seedAdmin =
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

  if (!seedAdmin) {
    const conflictingUser = get(
      "SELECT id, email, role FROM users WHERE lower(email) = lower(?) LIMIT 1",
      [email]
    );

    if (conflictingUser) {
      throw new Error(
        `Ja existe um usuario com o email ${conflictingUser.email}. Escolha outro email para a conta mestra.`
      );
    }
  }

  let adminId = seedAdmin ? Number(seedAdmin.id) : 0;
  let action = seedAdmin ? "UPDATE_MASTER_ADMIN" : "CREATE_MASTER_ADMIN";

  transaction(() => {
    if (seedAdmin) {
      write(
        `
          UPDATE users
          SET name = ?, email = ?, password_hash = ?, role = 'ADMIN',
              invite_code_used = 'SEED-ADMIN', active = 1, status = 'ACTIVE',
              is_system = 1, updated_at = ?
          WHERE id = ?
        `,
        [name, email, hashPassword(password), timestamp, adminId]
      );

      write("DELETE FROM sessions WHERE user_id = ?", [adminId]);
      write("UPDATE activation_codes SET active = 0 WHERE user_id = ? AND active = 1", [adminId]);
    } else {
      adminId = insert(
        `
          INSERT INTO users (
            name, email, password_hash, role, invite_code_used, active, status, is_system, created_at, updated_at
          )
          VALUES (?, ?, ?, 'ADMIN', 'SEED-ADMIN', 1, 'ACTIVE', 1, ?, ?)
        `,
        [name, email, hashPassword(password), timestamp, timestamp]
      );
    }

    insert(
      `
        INSERT INTO action_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        adminId,
        name,
        action,
        "USER",
        String(adminId),
        JSON.stringify({ email, resetBy: "scripts/reset-admin.js" }),
        timestamp,
      ]
    );
  });

  console.log("[Horizon] Conta mestra pronta para login.");
  console.log(`[Horizon] Email: ${email}`);
  console.log(`[Horizon] Banco: ${DB_PATH}`);
  console.log(`[Horizon] Origem do DB: ${DB_PATH_SOURCE}`);
}

main().catch((error) => {
  console.error(`[Horizon] Falha ao redefinir administrador: ${error.message}`);
  printUsage();
  process.exit(1);
});
