const XLSX = require("xlsx");

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
  if (!Number.isFinite(value) || value < 10000 || value > 100000) {
    return "";
  }

  const parsed = XLSX.SSF.parse_date_code(value, { date1904 });
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

module.exports = {
  nowIso,
  todayDate,
  normalizeText,
  normalizeKey,
  toNumber,
  splitLines,
  safeJsonParse,
  pickRecordValue,
  normalizeSpreadsheetIssueDate,
};
