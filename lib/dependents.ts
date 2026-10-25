// Japan: tax deductions for relatives who live outside Japan (国外居住親族に係る扶養控除等).
// Deterministic rules from the National Tax Agency (NTA) pages and Q&A listed in SOURCES.
// Covers income tax for a Japan-resident employee (year-end adjustment / final return).

export const RULES_AS_OF = "2026-10-25";

export const YEARS = [2025, 2026] as const;
export type Year = (typeof YEARS)[number];
export const RELATIONSHIPS = ["spouse", "child", "parent", "grandparent", "sibling", "grandchild", "other"] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];
export const DISABILITY = ["none", "disabled", "special"] as const;
export type Disability = (typeof DISABILITY)[number];
export const METHODS = ["bank", "credit_card", "electronic_payment", "cash", "via_representative", "joint_account"] as const;
export type Method = (typeof METHODS)[number];
export const MARGINAL_RATES = [5, 10, 20, 23, 33, 40, 45] as const;

export const RELATIONSHIP_LABEL: Record<Relationship, { en: string; ja: string }> = {
  spouse: { en: "Spouse", ja: "配偶者" },
  child: { en: "Child", ja: "子" },
  parent: { en: "Parent (or parent-in-law)", ja: "父母・義父母" },
  grandparent: { en: "Grandparent", ja: "祖父母" },
  sibling: { en: "Brother or sister", ja: "兄弟姉妹" },
  grandchild: { en: "Grandchild", ja: "孫" },
  other: { en: "Other relative (within 6th degree by blood / 3rd by marriage)", ja: "その他の親族（6親等内の血族・3親等内の姻族）" },
};

export const METHOD_LABEL: Record<Method, string> = {
  bank: "Bank or money-transfer service (Wise, Western Union, etc.) to the relative's own account",
  credit_card: "Family credit card used by the relative (statement shows the relative's use)",
  electronic_payment: "Electronic payment / stablecoin transfer via a registered Japanese operator",
  cash: "Cash handed over in person or through a friend",
  via_representative: "One transfer to a single family member for several relatives",
  joint_account: "Transfer to a joint account abroad",
};

export const SOURCES = [
  "https://www.nta.go.jp/publication/pamph/pdf/0022009-107_02.pdf",
  "https://www.nta.go.jp/english/taxes/individual/12016.htm",
  "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm",
  "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1177.htm",
  "https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/gensen/kokugai/sokin/index02.htm",
  "https://www.nta.go.jp/publication/pamph/gensen/nencho2026/pdf/115.pdf",
  "https://www.nta.go.jp/publication/pamph/gensen/nencho2026/pdf/302_en.pdf",
] as const;

export const DISCLAIMER =
  "Educational estimate of Japanese income-tax deductions for relatives living outside Japan, based on National Tax Agency rules as of 2026-10-25. Not tax advice and not affiliated with the NTA. Your employer (year-end adjustment) or tax office decides; confirm with them or a licensed tax accountant (税理士). Resident tax (住民税) uses different, smaller amounts and is not calculated.";

export class RuleInputError extends Error {}

const MAN = 10_000;

/** Dependent / spouse income limit (合計所得金額): ¥620,000 from 2026 (R8 reform, applied at the 2026 year-end adjustment), ¥580,000 in 2025. */
export function incomeLimit(year: Year): number {
  return year >= 2026 ? 62 * MAN : 58 * MAN;
}

/** 特定親族特別控除 (relatives aged 19-22 earning above the dependent limit): upper bound (inclusive) → deduction. */
const SPECIFIED_RELATIVE_TABLE: [number, number][] = [
  [85 * MAN, 63 * MAN],
  [90 * MAN, 61 * MAN],
  [95 * MAN, 51 * MAN],
  [100 * MAN, 41 * MAN],
  [105 * MAN, 31 * MAN],
  [110 * MAN, 21 * MAN],
  [115 * MAN, 11 * MAN],
  [120 * MAN, 6 * MAN],
  [123 * MAN, 3 * MAN],
];

/** 配偶者特別控除: spouse income upper bound (inclusive) → [taxpayer ≤¥9M, ≤¥9.5M, ≤¥10M]. */
const SPOUSE_SPECIAL_TABLE: [number, [number, number, number]][] = [
  [95 * MAN, [38 * MAN, 26 * MAN, 13 * MAN]],
  [100 * MAN, [36 * MAN, 24 * MAN, 12 * MAN]],
  [105 * MAN, [31 * MAN, 21 * MAN, 11 * MAN]],
  [110 * MAN, [26 * MAN, 18 * MAN, 9 * MAN]],
  [115 * MAN, [21 * MAN, 14 * MAN, 7 * MAN]],
  [120 * MAN, [16 * MAN, 11 * MAN, 6 * MAN]],
  [125 * MAN, [11 * MAN, 8 * MAN, 4 * MAN]],
  [130 * MAN, [6 * MAN, 4 * MAN, 2 * MAN]],
  [133 * MAN, [3 * MAN, 2 * MAN, 1 * MAN]],
];

export function specifiedRelativeDeduction(year: Year, income: number): number {
  if (income <= incomeLimit(year)) return 0;
  for (const [upTo, amount] of SPECIFIED_RELATIVE_TABLE) if (income <= upTo) return amount;
  return 0;
}

function taxpayerColumn(taxpayerIncome: number | null): 0 | 1 | 2 {
  if (taxpayerIncome === null || taxpayerIncome <= 900 * MAN) return 0;
  if (taxpayerIncome <= 950 * MAN) return 1;
  return 2;
}

export function spouseDeduction(year: Year, spouseIncome: number, taxpayerIncome: number | null, elderly: boolean): { code: "spouse" | "spouse_special" | null; amount: number } {
  if (taxpayerIncome !== null && taxpayerIncome > 1000 * MAN) return { code: null, amount: 0 };
  const col = taxpayerColumn(taxpayerIncome);
  if (spouseIncome <= incomeLimit(year)) {
    const base = elderly ? [48 * MAN, 32 * MAN, 16 * MAN] : [38 * MAN, 26 * MAN, 13 * MAN];
    return { code: "spouse", amount: base[col] };
  }
  for (const [upTo, amounts] of SPOUSE_SPECIAL_TABLE) if (spouseIncome <= upTo) return { code: "spouse_special", amount: amounts[col] };
  return { code: null, amount: 0 };
}

export function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Age on Dec 31 of the tax year. Japanese law: you reach an age the day before your birthday, so someone born on Jan 1 is a year older. */
export function ageAtYearEnd(birthDate: string, year: number): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  return year - y + (m === 1 && d === 1 ? 1 : 0);
}

export type CheckInput = {
  year?: number | null;
  relationship: Relationship;
  age?: number | null;
  birthDate?: string | null;
  relativeIncome?: number | null;
  taxpayerIncome?: number | null;
  studyingAbroad?: boolean;
  disability?: Disability;
  remittanceTotal?: number | null;
  remittanceCount?: number | null;
  firstLastTotal?: number | null;
  method?: Method;
  marginalRate?: number | null;
};

export type Verdict = "eligible" | "conditional" | "short_of_380k" | "not_eligible";
export type AgeBand = "spouse" | "under_16" | "16_29" | "30_69" | "70_plus";
export type Route = "age_16_29" | "age_70_plus" | "studying_abroad" | "disabled" | "support_380k" | "spouse" | null;

export type Deduction = { code: string; en: string; ja: string; amount: number };

export type CheckResult = {
  year: Year;
  rulesAsOf: string;
  relationship: Relationship;
  relationshipLabel: string;
  ageAtYearEnd: number;
  ageBand: AgeBand;
  route: Route;
  verdict: Verdict;
  summary: string;
  deductions: Deduction[];
  totalDeduction: number;
  estimatedIncomeTaxSaving: number | null;
  incomeLimit: number;
  remittance: {
    requiredForYearEnd: boolean;
    minimumTotal: number | null;
    entered: number | null;
    validMethod: boolean;
    methodNote: string;
    shortfall: number | null;
    sendBy: string;
    statementOption: string | null;
  };
  documents: { withForm: string[]; atYearEnd: string[] };
  forms: string[];
  steps: string[];
  warnings: string[];
  sources: readonly string[];
  disclaimer: string;
};

const yen = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

const DEDUCTION_NAMES: Record<string, { en: string; ja: string }> = {
  dependent_general: { en: "Exemption for dependents (general)", ja: "扶養控除（一般の控除対象扶養親族）" },
  dependent_specified: { en: "Exemption for dependents (specified, age 19-22)", ja: "扶養控除（特定扶養親族）" },
  dependent_elderly: { en: "Exemption for dependents (elderly, 70+)", ja: "扶養控除（老人扶養親族）" },
  specified_relative_special: { en: "Special exemption for specified relatives (age 19-22)", ja: "特定親族特別控除" },
  spouse: { en: "Exemption for spouse", ja: "配偶者控除" },
  spouse_special: { en: "Special exemption for spouse", ja: "配偶者特別控除" },
  disability: { en: "Exemption for disabled persons", ja: "障害者控除" },
  disability_special: { en: "Exemption for disabled persons (special)", ja: "障害者控除（特別障害者）" },
};

function deduction(code: string, amount: number): Deduction {
  return { code, ...DEDUCTION_NAMES[code], amount };
}

function num(v: number | null | undefined, name: string, { min = 0, max = 1e11 } = {}): number | null {
  if (v === null || v === undefined) return null;
  if (!Number.isFinite(v) || v < min || v > max) throw new RuleInputError(`${name} must be a number between ${min} and ${max}`);
  return v;
}

export function checkDependent(input: CheckInput): CheckResult {
  const year = (input.year ?? 2026) as Year;
  if (!(YEARS as readonly number[]).includes(year)) throw new RuleInputError(`year must be one of ${YEARS.join(", ")}`);
  if (!(RELATIONSHIPS as readonly string[]).includes(input.relationship)) throw new RuleInputError(`relationship must be one of ${RELATIONSHIPS.join(", ")}`);
  const disability: Disability = input.disability ?? "none";
  if (!(DISABILITY as readonly string[]).includes(disability)) throw new RuleInputError(`disability must be one of ${DISABILITY.join(", ")}`);
  const method: Method = input.method ?? "bank";
  if (!(METHODS as readonly string[]).includes(method)) throw new RuleInputError(`method must be one of ${METHODS.join(", ")}`);

  let age: number;
  if (input.birthDate) {
    if (!validDate(input.birthDate)) throw new RuleInputError("birthDate must be YYYY-MM-DD");
    age = ageAtYearEnd(input.birthDate, year);
    if (age < 0) throw new RuleInputError(`birthDate is after the end of ${year}`);
  } else {
    const a = num(input.age, "age", { min: 0, max: 130 });
    if (a === null) throw new RuleInputError("Give the relative's age on Dec 31 (age) or birthDate");
    age = Math.floor(a);
  }
  const relIncome = num(input.relativeIncome, "relativeIncome") ?? 0;
  const taxpayerIncome = num(input.taxpayerIncome, "taxpayerIncome");
  const remit = num(input.remittanceTotal, "remittanceTotal");
  const count = num(input.remittanceCount, "remittanceCount", { max: 10000 });
  const firstLast = num(input.firstLastTotal, "firstLastTotal");
  const rate = num(input.marginalRate, "marginalRate", { max: 45 });
  if (rate !== null && !(MARGINAL_RATES as readonly number[]).includes(rate)) throw new RuleInputError(`marginalRate must be one of ${MARGINAL_RATES.join(", ")} (percent)`);

  const limit = incomeLimit(year);
  const isSpouse = input.relationship === "spouse";
  const studying = Boolean(input.studyingAbroad);
  const disabled = disability !== "none";
  const ageBand: AgeBand = isSpouse ? "spouse" : age < 16 ? "under_16" : age < 30 ? "16_29" : age < 70 ? "30_69" : "70_plus";
  const sendBy = `${year}-12-31`;
  const label = RELATIONSHIP_LABEL[input.relationship].en.toLowerCase().replace(/ \(.*\)$/, "");

  const validMethod = ["bank", "credit_card", "electronic_payment"].includes(method);
  const methodNote = {
    bank: "Bank / money-transfer records count if they show sender, recipient (this relative), date and amount.",
    credit_card: "A family card statement counts if it shows this relative used the card; the usage date is the payment date.",
    electronic_payment: "Transfers of electronic payment means (stablecoins) via a registered operator count from 2024.",
    cash: "Cash handed over in person or through a friend leaves no qualifying record, so it cannot be used (NTA Q&A Q39).",
    via_representative: "A transfer sent to one family member counts only for that person, not for the other relatives it was meant for (Q&A Q34). Send to each relative separately.",
    joint_account: "Transfers to a joint account abroad generally don't count, because they don't show payment to each relative (Q&A Q35).",
  }[method];

  const deductions: Deduction[] = [];
  const warnings: string[] = [];
  const steps: string[] = [];
  const forms: string[] = [];
  let route: Route = null;
  let eligibleByRules = true;
  let reason = "";
  let needs380k = false;

  const relDoc =
    "Relationship document (親族関係書類) proving this person is your relative: either (a) a Japanese public document such as a copy of your 戸籍の附票 plus a copy of the relative's passport, or (b) a document issued by a foreign government or local government that shows the relative's name, date of birth and address (birth certificate, marriage certificate, family register, etc.). Originals except the passport copy; an ID card alone is not enough; attach a Japanese translation if it is in a foreign language.";
  const visaDoc =
    "Student-visa document (留学ビザ等書類): copy of the foreign visa, or of the foreign equivalent of a residence card, showing the relative stays in that country with student status (with Japanese translation).";
  const remitDoc = `Remittance records (送金関係書類) for every payment you made to this relative in ${year}: bank or money-transfer records, a family credit card statement, or an electronic payment transfer record, each showing sender, recipient, date and amount (with Japanese translation if needed).`;
  const remit380Doc = `"38万円送金書類": remittance records to this relative in ${year} that add up to ¥380,000 or more (paid to them personally, for living or education costs).`;

  if (isSpouse) {
    route = "spouse";
    const elderly = age >= 70;
    const sp = spouseDeduction(year, relIncome, taxpayerIncome, elderly);
    if (taxpayerIncome !== null && taxpayerIncome > 1000 * MAN) {
      eligibleByRules = false;
      reason = `No spouse deduction when your own total income is over ¥10,000,000 (yours: ${yen(taxpayerIncome)}).`;
    } else if (!sp.code) {
      eligibleByRules = false;
      reason = `Your spouse's total income (${yen(relIncome)}) is over ¥1,330,000, so neither the spouse exemption nor the special exemption applies.`;
    } else {
      deductions.push(deduction(sp.code, sp.amount));
      forms.push("給与所得者の配偶者控除等申告書 (Application for Exemption for Spouse) at the year-end adjustment");
      if (taxpayerIncome === null) warnings.push("Your own total income wasn't given, so the amount assumes ¥9,000,000 or less (employment-only salary up to ¥10,950,000). Above that the spouse amounts drop to 2/3 and 1/3, and to zero above ¥10,000,000.");
    }
    // The 30-69 restriction applies to dependents (扶養親族), not to the spouse exemption.
    if (sp.code && relIncome <= 95 * MAN && (taxpayerIncome === null || taxpayerIncome <= 900 * MAN)) forms.push("Also list them as 源泉控除対象配偶者 on the 扶養控除等（異動）申告書 so monthly withholding reflects it");
  } else if (ageBand === "under_16") {
    if (disabled && relIncome <= limit) {
      route = "disabled";
    } else {
      eligibleByRules = false;
      reason = `Children under 16 on Dec 31 (年少扶養親族) get no dependent exemption in Japan's income tax${disabled ? ", and the disability exemption needs their income to be within the dependent limit" : ""}.`;
    }
    warnings.push("For resident tax (住民税), a dependent under 16 living abroad can still matter for the non-taxable threshold; some cities ask for the same relationship and remittance documents. Check with your city office.");
  } else if (relIncome > limit) {
    const special = age >= 19 && age <= 22 ? specifiedRelativeDeduction(year, relIncome) : 0;
    if (special > 0) {
      route = "age_16_29";
      deductions.push(deduction("specified_relative_special", special));
      forms.push("給与所得者の特定親族特別控除申告書 (Application for Special Exemption for Specified Relatives) at the year-end adjustment");
    } else {
      eligibleByRules = false;
      reason =
        age >= 19 && age <= 22
          ? `Total income ${yen(relIncome)} is over ¥1,230,000, the ceiling for the special exemption for specified relatives.`
          : `Total income ${yen(relIncome)} is over the ${year} dependent limit of ${yen(limit)}.`;
    }
  } else if (ageBand === "16_29") {
    route = "age_16_29";
    deductions.push(age >= 19 && age <= 22 ? deduction("dependent_specified", 63 * MAN) : deduction("dependent_general", 38 * MAN));
  } else if (ageBand === "70_plus") {
    route = "age_70_plus";
    deductions.push(deduction("dependent_elderly", 48 * MAN));
    warnings.push("The ¥580,000 'elderly parent living together' amount needs the parent to live with you, so it can't apply to a parent living abroad.");
  } else {
    // 30-69: only if studying abroad, disabled, or you paid them ¥380,000+ this year.
    if (studying) route = "studying_abroad";
    else if (disabled) route = "disabled";
    else {
      route = "support_380k";
      needs380k = true;
    }
    deductions.push(deduction("dependent_general", 38 * MAN));
  }

  if (disabled && eligibleByRules && relIncome <= limit) {
    deductions.push(disability === "special" ? deduction("disability_special", 40 * MAN) : deduction("disability", 27 * MAN));
    warnings.push("Disability must meet Japanese criteria (e.g. a Japanese physical-disability certificate, mental-health welfare handbook or a qualifying assessment). A foreign disability card on its own does not qualify (NTA Q&A Q6). The higher ¥750,000 amount needs the person to live with you, so it can't apply abroad.");
  } else if (disabled && isSpouse && relIncome > limit && eligibleByRules) {
    warnings.push(`The disability exemption for a spouse needs their income to be ${yen(limit)} or less.`);
  }
  if (deductions.some((d) => d.code.startsWith("dependent") || d.code.startsWith("disability"))) forms.unshift("給与所得者の扶養控除等（異動）申告書 (Application for Exemption for Dependents): tick 非居住者である親族 and the reason");

  // Remittance
  const requiredForYearEnd = eligibleByRules;
  let shortfall: number | null = null;
  let verdict: Verdict;
  if (!eligibleByRules) verdict = "not_eligible";
  else if (remit === null) verdict = "conditional";
  else if (remit === 0) {
    verdict = "not_eligible";
    reason = `No payments to this relative in ${year}. Every relative living abroad needs remittance records for that year at the year-end adjustment, so no deduction can be claimed.`;
  } else if (!validMethod) {
    verdict = "not_eligible";
    reason = methodNote;
  } else if (needs380k && remit < 38 * MAN) {
    verdict = "short_of_380k";
    shortfall = 38 * MAN - remit;
  } else verdict = "eligible";

  let statementOption: string | null = null;
  if (count !== null && count >= 3) {
    statementOption = `With 3 or more payments to the same relative you may hand in the NTA "送金関係書類の明細書" (list of remittances) plus only the first and last records of ${year}, instead of every record.`;
    if (needs380k) {
      if (firstLast !== null && firstLast < 38 * MAN) statementOption += ` Because your first and last payments add up to ${yen(firstLast)} (under ¥380,000), you must also show records proving the year's total reaches ¥380,000 (通達120-9).`;
      else if (firstLast === null) statementOption += " For the ¥380,000 test: if the first and last payments together are under ¥380,000 you must also show records proving the total reaches ¥380,000.";
    }
  }

  const withForm: string[] = [];
  const atYearEnd: string[] = [];
  if (eligibleByRules) {
    withForm.push(relDoc);
    if (route === "studying_abroad") withForm.push(visaDoc);
    atYearEnd.push(needs380k ? remit380Doc : remitDoc);
    if (statementOption) atYearEnd.push(statementOption);
  }

  const total = verdict === "not_eligible" ? 0 : deductions.reduce((s, d) => s + d.amount, 0);
  const saving = rate !== null && total > 0 ? Math.round(total * (rate / 100) * 1.021) : null;

  // Steps and warnings
  if (eligibleByRules) {
    steps.push(`Hand in ${forms.length ? forms.join("; ") : "the relevant application"} to your employer with the relationship document${route === "studying_abroad" ? " and student-visa document" : ""}.`);
    steps.push(`By Dec 31, ${year}: make sure each payment goes to this relative personally (not via another family member) and keep the record. The sending date counts, even if the money arrives in January.`);
    steps.push(`At the year-end adjustment (usually November-December): hand in the ${needs380k ? "remittance records totalling ¥380,000+" : "remittance records"}. If you miss it, you can still claim on a final tax return (確定申告) by March 15, ${year + 1}.`);
    if (needs380k && verdict !== "eligible") steps.push(`If they are short: send the remaining ${shortfall ? yen(shortfall) : "amount"} by ${sendBy}, directly to them, for living or education costs.`);
  }
  if (needs380k) {
    warnings.push("¥380,000 test: count only payments to this relative in the year, for living or education costs. Fees count only if shown on the record (e.g. ¥370,000 + ¥10,000 fee = ¥380,000). Convert foreign-currency amounts at the TTM rate on the sending date, the yen actually debited, or the year total at the rate of the last payment.");
  }
  if (route === "studying_abroad") warnings.push("'Studying abroad' only covers a relative who lived in Japan and left to study at a foreign school with a student-equivalent status. A relative who has always lived abroad doesn't count, and study under 1 year usually means they are still a Japanese resident.");
  if (ageBand === "30_69" && route === "support_380k") warnings.push("Ages 30-69 on Dec 31 qualify only if studying abroad, disabled under Japanese criteria, or you paid them ¥380,000+ in the year (2023 reform).");
  if (year >= 2026 && relIncome > 58 * MAN && relIncome <= 62 * MAN) warnings.push("New for 2026: relatives with income between ¥580,001 and ¥620,000 now qualify. The higher limit takes effect on 2026-12-01 and is applied at the 2026 year-end adjustment; monthly withholding until November used the old ¥580,000 limit.");
  warnings.push("Relative's income means total income (合計所得金額). For a non-resident relative this is generally only their Japan-source income, so enter 0 if they earn nothing in Japan. Ages are as of Dec 31; being a non-resident and being disabled are judged when the application is handed in.");
  warnings.push("Foreign-language documents need a Japanese translation attached (NTA Q&A Q14).");

  const name = `Your ${label}`;
  const totalTxt = yen(total);
  const amountsTxt = deductions.map((d) => `${d.en} ${yen(d.amount)}`).join(" + ");
  let summary: string;
  if (verdict === "not_eligible") summary = `${name} (age ${age} on ${year}-12-31) does not qualify for ${year}: ${reason}`;
  else if (verdict === "short_of_380k") summary = `${name} (age ${age}) qualifies only through the ¥380,000 support test, and you have sent ${yen(remit!)}. Send ${yen(shortfall!)} more directly to them by ${sendBy} to claim ${totalTxt} (${amountsTxt}).`;
  else if (verdict === "conditional") summary = `${name} (age ${age}) can qualify for ${totalTxt} (${amountsTxt}) in ${year}${needs380k ? " if you pay them ¥380,000 or more during the year" : ""}, provided you hand in the relationship document and remittance records.`;
  else summary = `${name} (age ${age}) qualifies: ${totalTxt} income-tax deduction for ${year} (${amountsTxt}), with the relationship document and remittance records.`;
  if (saving !== null && verdict !== "not_eligible") summary += ` At a ${rate}% marginal rate that is about ${yen(saving)} less income tax.`;

  return {
    year,
    rulesAsOf: RULES_AS_OF,
    relationship: input.relationship,
    relationshipLabel: RELATIONSHIP_LABEL[input.relationship].en,
    ageAtYearEnd: age,
    ageBand,
    route: eligibleByRules ? route : null,
    verdict,
    summary,
    deductions: eligibleByRules ? deductions : [],
    totalDeduction: total,
    estimatedIncomeTaxSaving: verdict === "not_eligible" ? null : saving,
    incomeLimit: limit,
    remittance: {
      requiredForYearEnd,
      minimumTotal: needs380k ? 38 * MAN : null,
      entered: remit,
      validMethod,
      methodNote,
      shortfall,
      sendBy,
      statementOption,
    },
    documents: { withForm, atYearEnd },
    forms: eligibleByRules ? forms : [],
    steps,
    warnings,
    sources: SOURCES,
    disclaimer: DISCLAIMER,
  };
}

export const RULES = {
  rulesAsOf: RULES_AS_OF,
  scope: "Japanese income tax for a Japan-resident taxpayer claiming relatives who live outside Japan (国外居住親族), at the year-end adjustment or on a final return.",
  incomeLimit: { 2025: 580000, 2026: 620000, note: "Total income (合計所得金額). 2026 figure effective 2026-12-01 and applied at the 2026 year-end adjustment (R8 reform)." },
  whoQualifiesAbroad: {
    "16-29": "Yes (dependent exemption).",
    "30-69": "Only if (1) studying abroad after leaving Japan, (2) disabled under Japanese criteria, or (3) you paid them ¥380,000+ in the year for living/education costs.",
    "70+": "Yes (elderly dependent, ¥480,000).",
    "under 16": "No dependent exemption; disability exemption possible.",
    spouse: "Spouse exemption / special exemption by income, no age test.",
  },
  amounts: {
    dependent_general: 380000,
    dependent_specified_19_22: 630000,
    dependent_elderly_70plus: 480000,
    disability: 270000,
    disability_special: 400000,
    spouse: { taxpayerUpTo9M: 380000, upTo9_5M: 260000, upTo10M: 130000, elderlySpouse: [480000, 320000, 160000] },
    spouseSpecial: SPOUSE_SPECIAL_TABLE.map(([upTo, a]) => ({ spouseIncomeUpTo: upTo, amounts: a })),
    specifiedRelativeSpecial: SPECIFIED_RELATIVE_TABLE.map(([upTo, a]) => ({ relativeIncomeUpTo: upTo, amount: a })),
  },
  documents: {
    relationship: "親族関係書類: 戸籍の附票 copy + passport copy, or a foreign-government document with name, birth date and address. Japanese translation if foreign.",
    studentVisa: "留学ビザ等書類 for the studying-abroad route.",
    remittance: "送金関係書類 for every payment in the year (bank/money-transfer, family credit card, electronic payment from 2024). Each relative separately; cash via friends and joint accounts don't count.",
    remittance380k: "38万円送金書類 for the 30-69 support route.",
    statement: "3+ payments to one relative: NTA 送金関係書類の明細書 + first and last records (plus proof of ¥380,000 total if first+last < ¥380,000).",
  },
  timing: "Age as of Dec 31. Non-resident and disability status judged when the application is handed in. Payment date = sending date (credit card: usage date).",
  sources: SOURCES,
  disclaimer: DISCLAIMER,
};
