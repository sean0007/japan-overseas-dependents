import { InputError, type Endpoint, type Input } from "./agent-api";
import { DISABILITY, DISCLAIMER, METHODS, RELATIONSHIPS, RuleInputError, checkDependent, type Disability, type Method, type Relationship } from "./dependents";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-overseas-dependents.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?relationship=parent&age=62&remittanceTotal=450000&remittanceCount=6&marginalRate=10";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function s(v: unknown): string | null {
  const f = first(v);
  return f === undefined || f === null || String(f).trim() === "" ? null : String(f).trim();
}
function n(v: unknown, name: string): number | null {
  const raw = s(v);
  if (raw === null) return null;
  const x = Number(raw.replace(/[,_\s¥円$%]/g, "").replace(/万$/, "e4"));
  if (!Number.isFinite(x)) throw new InputError(`Not a number: ${name}`);
  return x;
}
function b(v: unknown): boolean {
  const raw = s(v);
  return raw !== null && ["1", "true", "yes", "y", "on"].includes(raw.toLowerCase());
}

const REL_ALIASES: Record<string, Relationship> = {
  wife: "spouse", husband: "spouse", partner: "spouse", 配偶者: "spouse", 妻: "spouse", 夫: "spouse",
  son: "child", daughter: "child", kid: "child", 子: "child", 息子: "child", 娘: "child",
  mother: "parent", father: "parent", mom: "parent", dad: "parent", parent_in_law: "parent", mother_in_law: "parent", father_in_law: "parent", 父: "parent", 母: "parent", 父母: "parent", 親: "parent",
  grandmother: "grandparent", grandfather: "grandparent", 祖父: "grandparent", 祖母: "grandparent",
  brother: "sibling", sister: "sibling", 兄弟: "sibling", 姉妹: "sibling", 兄: "sibling", 弟: "sibling", 姉: "sibling", 妹: "sibling",
  grandson: "grandchild", granddaughter: "grandchild", 孫: "grandchild",
  aunt: "other", uncle: "other", niece: "other", nephew: "other", cousin: "other",
};
const DIS_ALIASES: Record<string, Disability> = { no: "none", false: "none", yes: "disabled", true: "disabled", severe: "special", special_disabled: "special", 障害者: "disabled", 特別障害者: "special" };
const METHOD_ALIASES: Record<string, Method> = {
  bank_transfer: "bank", wire: "bank", transfer: "bank", remittance: "bank", wise: "bank", western_union: "bank", money_transfer: "bank",
  card: "credit_card", family_card: "credit_card", stablecoin: "electronic_payment", electronic: "electronic_payment",
  hand: "cash", in_person: "cash", representative: "via_representative", one_person: "via_representative", joint: "joint_account",
};

function pick<T extends string>(raw: string | null, allowed: readonly T[], aliases: Record<string, T>, name: string, fallback: T | null): T | null {
  if (!raw) return fallback;
  const k = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const v = (aliases[k] ?? aliases[raw] ?? k) as T;
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${name} "${raw}". Allowed: ${allowed.join(", ")}`);
  return v;
}

export function computeCheck(input: Input) {
  try {
    const relationship = pick(s(input.relationship ?? input.relation ?? input.relative), RELATIONSHIPS, REL_ALIASES, "relationship", null);
    if (!relationship) throw new InputError(`Missing relationship. Allowed: ${RELATIONSHIPS.join(", ")}`);
    return checkDependent({
      year: n(input.year, "year"),
      relationship,
      age: n(input.age, "age"),
      birthDate: s(input.birthDate ?? input.dob),
      relativeIncome: n(input.relativeIncome ?? input.income, "relativeIncome"),
      taxpayerIncome: n(input.taxpayerIncome ?? input.yourIncome, "taxpayerIncome"),
      studyingAbroad: b(input.studyingAbroad ?? input.student),
      disability: pick(s(input.disability ?? input.disabled), DISABILITY, DIS_ALIASES, "disability", "none")!,
      remittanceTotal: n(input.remittanceTotal ?? input.remittance ?? input.sent, "remittanceTotal"),
      remittanceCount: n(input.remittanceCount ?? input.payments, "remittanceCount"),
      firstLastTotal: n(input.firstLastTotal, "firstLastTotal"),
      method: pick(s(input.method ?? input.paymentMethod), METHODS, METHOD_ALIASES, "method", "bank")!,
      marginalRate: n(input.marginalRate ?? input.taxRate, "marginalRate"),
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanOverseasDependentCheck",
    summary: "Can a Japan-resident taxpayer claim a relative living outside Japan as a dependent or spouse, how much is the deduction, and which documents are needed?",
    description:
      "Applies Japan's National Tax Agency rules for relatives living abroad (国外居住親族に係る扶養控除等, Q&A revised Aug 2026) to one relative. Returns verdict (eligible | conditional | short_of_380k | not_eligible), ageAtYearEnd, ageBand, route (age_16_29 | age_70_plus | studying_abroad | disabled | support_380k | spouse), deductions[] (dependent ¥380k / specified 19-22 ¥630k / elderly ¥480k, specified-relative special 19-22 by income, spouse or spouse special by both incomes, disability ¥270k/¥400k), totalDeduction, optional estimatedIncomeTaxSaving, remittance (¥380,000 minimum for ages 30-69 unless studying abroad or disabled, shortfall, valid-method note, the 3+ payments statement option), documents.withForm and documents.atYearEnd, forms, steps, warnings, sources, disclaimer. 2026 uses the new ¥620,000 income limit (R8 reform); 2025 uses ¥580,000. Income tax only.",
    params: [
      { name: "relationship", type: "string", required: true, enum: RELATIONSHIPS, description: "spouse, child, parent (incl. parent-in-law), grandparent, sibling, grandchild, other. Aliases: mother, father, wife, son, 母, 妻…" },
      { name: "age", type: "number", description: "Relative's age on Dec 31 of the tax year. Give age or birthDate." },
      { name: "birthDate", type: "string", description: "YYYY-MM-DD (age is computed as of Dec 31; born Jan 1 counts a year older)." },
      { name: "year", type: "number", default: 2026, description: "Tax year: 2026 (default) or 2025." },
      { name: "relativeIncome", type: "number", default: 0, description: "Relative's total income (合計所得金額) in yen. For a non-resident usually only Japan-source income, so 0 if none." },
      { name: "taxpayerIncome", type: "number", description: "Your own total income in yen (spouse amounts depend on it; default assumes ≤ ¥9,000,000)." },
      { name: "studyingAbroad", type: "boolean", default: false, description: "Relative lived in Japan and left to study abroad with a student-equivalent status (ages 30-69 route)." },
      { name: "disability", type: "string", enum: DISABILITY, default: "none", description: "Disabled under Japanese criteria: none | disabled | special." },
      { name: "remittanceTotal", type: "number", description: "Yen you paid directly to this relative in the year (sending date counts). Omit if unknown → verdict conditional." },
      { name: "remittanceCount", type: "number", description: "Number of payments (3+ unlocks the statement option)." },
      { name: "firstLastTotal", type: "number", description: "Sum of the first and last payments of the year (matters for the ¥380,000 test with the statement option)." },
      { name: "method", type: "string", enum: METHODS, default: "bank", description: "How you paid: bank | credit_card | electronic_payment (valid) or cash | via_representative | joint_account (not valid proof)." },
      { name: "marginalRate", type: "number", description: "Your income-tax bracket in percent (5, 10, 20, 23, 33, 40 or 45), to estimate the saving (incl. 2.1% reconstruction surtax)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan Overseas Dependents Check",
  nameForModel: "japan_overseas_dependents",
  descriptionForHuman: "Can I claim my family abroad as dependents on my Japanese taxes? Amounts, ¥380,000 test, documents.",
  descriptionForModel:
    "Use when someone who works or lives in Japan asks whether they can claim parents, a spouse, children, siblings or other relatives living outside Japan as dependents (国外居住親族 扶養控除) for the year-end adjustment (年末調整) or tax return, whether the ¥380,000 remittance rule for ages 30-69 is met, how much the deduction is under the 2026 ¥620,000 income limit, or which documents (親族関係書類, 送金関係書類, 38万円送金書類) to give their employer. Computes from NTA rules instead of guessing; relay the disclaimer (educational, not tax advice; employer/tax office decides).",
  logo: "/icon.svg",
};
