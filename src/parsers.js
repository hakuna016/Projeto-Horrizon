const { XMLParser } = require("fast-xml-parser");
const XLSX = require("xlsx");
const {
  nowIso,
  normalizeKey,
  normalizeSpreadsheetIssueDate,
  normalizeText,
  pickRecordValue,
  toNumber,
} = require("./helpers");

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  processEntities: true,
});

function normalizeTaxId(value) {
  const digits = String(value ?? "").replace(/\D+/g, "");
  return digits || "";
}

function deepGet(target, path) {
  return path.split(".").reduce((current, key) => {
    if (Array.isArray(current)) {
      return current.length ? current[0]?.[key] : undefined;
    }
    return current ? current[key] : undefined;
  }, target);
}

function pickFirst(target, paths) {
  for (const path of paths) {
    const value = deepGet(target, path);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "";
}

function parseInvoiceXml(content, fileName = "") {
  const parsed = xmlParser.parse(content);
  const supplierName = normalizeText(
    pickFirst(parsed, [
      "nfeProc.NFe.infNFe.emit.xNome",
      "NFe.infNFe.emit.xNome",
      "infNFe.emit.xNome",
    ])
  );
  const totalValue = toNumber(
    pickFirst(parsed, [
      "nfeProc.NFe.infNFe.total.ICMSTot.vNF",
      "NFe.infNFe.total.ICMSTot.vNF",
      "infNFe.total.ICMSTot.vNF",
    ])
  );
  const danfe = normalizeText(
    pickFirst(parsed, [
      "nfeProc.NFe.infNFe.ide.nNF",
      "NFe.infNFe.ide.nNF",
      "infNFe.ide.nNF",
    ])
  );
  const issueDate = normalizeText(
    pickFirst(parsed, [
      "nfeProc.NFe.infNFe.ide.dhEmi",
      "NFe.infNFe.ide.dhEmi",
      "infNFe.ide.dhEmi",
      "nfeProc.NFe.infNFe.ide.dEmi",
      "NFe.infNFe.ide.dEmi",
      "infNFe.ide.dEmi",
    ])
  );
  const rawKey = normalizeText(
    pickFirst(parsed, [
      "nfeProc.protNFe.infProt.chNFe",
      "protNFe.infProt.chNFe",
      "nfeProc.NFe.infNFe.Id",
      "NFe.infNFe.Id",
      "infNFe.Id",
    ])
  );
  const supplierTaxId = normalizeTaxId(
    pickFirst(parsed, [
      "nfeProc.NFe.infNFe.emit.CNPJ",
      "NFe.infNFe.emit.CNPJ",
      "infNFe.emit.CNPJ",
      "nfeProc.NFe.infNFe.emit.CPF",
      "NFe.infNFe.emit.CPF",
      "infNFe.emit.CPF",
    ])
  );

  return {
    supplierName: supplierName || fileName.replace(/\.[^.]+$/, "") || "Fornecedor nao identificado",
    supplierTaxId,
    totalValue,
    danfe,
    issueDate,
    xmlKey: rawKey.replace(/^NFe/i, ""),
  };
}

function parseSpreadsheet(contentBase64) {
  const buffer = Buffer.from(contentBase64, "base64");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row) => {
      const normalized = Object.entries(row).reduce((result, [key, value]) => {
        result[normalizeKey(key)] = value;
        return result;
      }, {});

      const supplierName = normalizeText(
        pickRecordValue(normalized, [
          "fornecedor",
          "emitente",
          "razao_social",
          "supplier",
        ])
      );

      if (!supplierName) {
        return null;
      }

      return {
        supplierName,
        supplierTaxId: normalizeTaxId(
          pickRecordValue(normalized, [
            "cnpj",
            "cpf_cnpj",
            "cnpj_cpf",
            "cnpj_fornecedor",
            "documento",
            "tax_id",
          ])
        ),
        totalValue: toNumber(
          pickRecordValue(normalized, ["valor", "valor_total", "total", "v_nf"])
        ),
        danfe: normalizeText(
          pickRecordValue(normalized, ["danfe", "nf", "numero", "nota"])
        ),
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
        category: normalizeText(
          pickRecordValue(normalized, ["categoria", "classificacao"])
        ),
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
    { pattern: /(promo[cç][aã]o|gratis|free)/i, score: 20, label: "termos promocionais" },
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

module.exports = {
  parseInvoiceXml,
  parseSpreadsheet,
  parseEml,
  analyzeEmailPayload,
};
