const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { parseBrazilianNumber, calculateBalanceAfter, calculateTotalCost } = require("../src/helpers");

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readInsertStats(marker) {
  const source = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  const pattern = new RegExp(`${escapeRegex(marker)}\\s*\\(([^)]*)\\)\\s*VALUES\\s*\\(([^)]*)\\)`, "s");
  const match = source.match(pattern);
  assert.ok(match, `Nao encontrou o INSERT esperado: ${marker}`);
  return {
    columns: match[1].split(",").length,
    placeholders: (match[2].match(/\?/g) || []).length,
  };
}

test("parseBrazilianNumber aceita padrao brasileiro", () => {
  assert.equal(parseBrazilianNumber("70,3"), 70.3);
  assert.equal(parseBrazilianNumber("75,2"), 75.2);
  assert.equal(parseBrazilianNumber("883,00"), 883);
  assert.equal(parseBrazilianNumber("3.000,00"), 3000);
  assert.equal(parseBrazilianNumber("5,85"), 5.85);
  assert.equal(parseBrazilianNumber("629,00"), 629);
  assert.equal(parseBrazilianNumber("R$ 585,00"), 585);
  assert.equal(parseBrazilianNumber("1.234,56"), 1234.56);
  assert.equal(parseBrazilianNumber("3000"), 3000);
  assert.ok(Number.isNaN(parseBrazilianNumber("abc")));
});

test("calcula total de combustivel sem multiplicar por 10 ou 100", () => {
  const firstTotal = calculateTotalCost(parseBrazilianNumber("70,3"), parseBrazilianNumber("5,85"));
  const secondTotal = calculateTotalCost(parseBrazilianNumber("75,2"), parseBrazilianNumber("5,85"));
  const roundedFirstTotal = Math.round((firstTotal + Number.EPSILON) * 100) / 100;
  const roundedSecondTotal = Math.round((secondTotal + Number.EPSILON) * 100) / 100;

  assert.equal(firstTotal, 411.255);
  assert.equal(roundedFirstTotal, 411.26);
  assert.equal(roundedSecondTotal, 439.92);
});

test("calcula saldo sequencial com decimais brasileiros", () => {
  const openingBalance = parseBrazilianNumber("3.000,00");
  const afterFirstExit = calculateBalanceAfter(openingBalance, "EXIT", parseBrazilianNumber("70,3"));
  const afterSecondExit = calculateBalanceAfter(afterFirstExit, "EXIT", parseBrazilianNumber("75,2"));

  assert.equal(afterFirstExit, 2929.7);
  assert.equal(Number(afterFirstExit.toFixed(2)), 2929.7);
  assert.equal(afterSecondExit, 2854.5);
  assert.equal(Number(afterSecondExit.toFixed(2)), 2854.5);
});

test("mantem alinhados placeholders SQL das gravacoes de combustivel", () => {
  const inventoryInsert = readInsertStats("INSERT INTO inventory_movements");
  const fuelInsert = readInsertStats("INSERT INTO fuel_records");

  assert.equal(inventoryInsert.columns, inventoryInsert.placeholders);
  assert.equal(fuelInsert.columns, fuelInsert.placeholders);
});
