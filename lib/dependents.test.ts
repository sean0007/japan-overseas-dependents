import assert from "node:assert/strict";
import test from "node:test";
import { ageAtYearEnd, checkDependent, incomeLimit, specifiedRelativeDeduction, spouseDeduction } from "./dependents";

test("age on Dec 31 uses the day-before-birthday rule", () => {
  assert.equal(ageAtYearEnd("1957-01-01", 2026), 70);
  assert.equal(ageAtYearEnd("1957-01-02", 2026), 69);
  assert.equal(ageAtYearEnd("2004-01-02", 2026), 22);
  assert.equal(ageAtYearEnd("2008-01-01", 2026), 19);
  assert.equal(ageAtYearEnd("2008-01-02", 2026), 18);
});

test("income limits and tables (R8)", () => {
  assert.equal(incomeLimit(2026), 620000);
  assert.equal(incomeLimit(2025), 580000);
  assert.equal(specifiedRelativeDeduction(2026, 620000), 0);
  assert.equal(specifiedRelativeDeduction(2026, 850000), 630000);
  assert.equal(specifiedRelativeDeduction(2026, 850001), 610000);
  assert.equal(specifiedRelativeDeduction(2026, 1230000), 30000);
  assert.equal(specifiedRelativeDeduction(2026, 1230001), 0);
  assert.deepEqual(spouseDeduction(2026, 0, null, false), { code: "spouse", amount: 380000 });
  assert.deepEqual(spouseDeduction(2026, 0, 9_200_000, true), { code: "spouse", amount: 320000 });
  assert.deepEqual(spouseDeduction(2026, 1_000_000, 9_800_000, false), { code: "spouse_special", amount: 120000 });
  assert.deepEqual(spouseDeduction(2026, 1_330_000, 5_000_000, false), { code: "spouse_special", amount: 30000 });
  assert.deepEqual(spouseDeduction(2026, 0, 10_000_001, false), { code: null, amount: 0 });
  assert.deepEqual(spouseDeduction(2025, 600000, null, false), { code: "spouse_special", amount: 380000 });
});

test("parent 62 with ¥450k sent → eligible ¥380k", () => {
  const r = checkDependent({ relationship: "parent", age: 62, remittanceTotal: 450000, remittanceCount: 6, marginalRate: 10 });
  assert.equal(r.verdict, "eligible");
  assert.equal(r.route, "support_380k");
  assert.equal(r.totalDeduction, 380000);
  assert.equal(r.estimatedIncomeTaxSaving, 38798);
  assert.equal(r.remittance.minimumTotal, 380000);
  assert.ok(r.documents.atYearEnd[0].includes("38万円送金書類"));
  assert.ok(r.remittance.statementOption?.includes("first and last"));
});

test("parent 62 with ¥300k → short by ¥80k", () => {
  const r = checkDependent({ relationship: "parent", age: 62, remittanceTotal: 300000 });
  assert.equal(r.verdict, "short_of_380k");
  assert.equal(r.remittance.shortfall, 80000);
  assert.ok(r.summary.includes("¥80,000"));
});

test("parent 62 unknown remittance → conditional; studying/disabled routes skip 380k", () => {
  assert.equal(checkDependent({ relationship: "parent", age: 62 }).verdict, "conditional");
  const st = checkDependent({ relationship: "sibling", age: 35, studyingAbroad: true, remittanceTotal: 100000 });
  assert.equal(st.verdict, "eligible");
  assert.equal(st.route, "studying_abroad");
  assert.ok(st.documents.withForm.some((d) => d.includes("留学ビザ")));
  const dis = checkDependent({ relationship: "parent", age: 50, disability: "special", remittanceTotal: 100000 });
  assert.equal(dis.verdict, "eligible");
  assert.equal(dis.totalDeduction, 780000);
});

test("ages: 70+ elderly, 19-22 specified, under 16 none", () => {
  assert.equal(checkDependent({ relationship: "parent", birthDate: "1950-05-05", remittanceTotal: 120000 }).totalDeduction, 480000);
  const c = checkDependent({ relationship: "child", age: 20, remittanceTotal: 1200000 });
  assert.equal(c.deductions[0].code, "dependent_specified");
  assert.equal(c.totalDeduction, 630000);
  assert.equal(checkDependent({ relationship: "child", age: 12, remittanceTotal: 500000 }).verdict, "not_eligible");
  assert.equal(checkDependent({ relationship: "child", age: 12, disability: "disabled", remittanceTotal: 500000 }).totalDeduction, 270000);
});

test("19-22 earning ¥900k → specified relative special ¥610k... (85-90 band)", () => {
  const r = checkDependent({ relationship: "child", age: 21, relativeIncome: 900000, remittanceTotal: 600000 });
  assert.equal(r.deductions[0].code, "specified_relative_special");
  assert.equal(r.totalDeduction, 610000);
  assert.ok(r.forms.some((f) => f.includes("特定親族特別控除申告書")));
});

test("2026 limit ¥620k vs 2025 ¥580k", () => {
  assert.equal(checkDependent({ relationship: "sibling", age: 25, relativeIncome: 600000, remittanceTotal: 200000 }).verdict, "eligible");
  assert.equal(checkDependent({ year: 2025, relationship: "sibling", age: 25, relativeIncome: 600000, remittanceTotal: 200000 }).verdict, "not_eligible");
});

test("invalid proof methods and zero remittance", () => {
  assert.equal(checkDependent({ relationship: "parent", age: 75, remittanceTotal: 500000, method: "cash" }).verdict, "not_eligible");
  assert.equal(checkDependent({ relationship: "parent", age: 75, remittanceTotal: 500000, method: "via_representative" }).verdict, "not_eligible");
  assert.equal(checkDependent({ relationship: "parent", age: 75, remittanceTotal: 0 }).verdict, "not_eligible");
});

test("spouse abroad: no age test, income bands", () => {
  const r = checkDependent({ relationship: "spouse", age: 40, remittanceTotal: 100000 });
  assert.equal(r.verdict, "eligible");
  assert.equal(r.totalDeduction, 380000);
  assert.equal(checkDependent({ relationship: "spouse", age: 40, relativeIncome: 1_400_000, remittanceTotal: 100000 }).verdict, "not_eligible");
  assert.equal(checkDependent({ relationship: "spouse", age: 40, taxpayerIncome: 11_000_000, remittanceTotal: 100000 }).verdict, "not_eligible");
});

test("3+ payments with first+last under ¥380k needs total proof", () => {
  const r = checkDependent({ relationship: "parent", age: 55, remittanceTotal: 600000, remittanceCount: 12, firstLastTotal: 100000 });
  assert.ok(r.remittance.statementOption?.includes("120-9"));
});

test("bad inputs throw", () => {
  assert.throws(() => checkDependent({ relationship: "parent" }));
  assert.throws(() => checkDependent({ relationship: "parent", age: 50, year: 2024 }));
  assert.throws(() => checkDependent({ relationship: "parent", birthDate: "2026-13-01" }));
  assert.throws(() => checkDependent({ relationship: "parent", age: 50, marginalRate: 12 }));
});
