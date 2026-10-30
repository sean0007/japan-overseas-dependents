export const SITE_NAME = "Japan Overseas Dependents Check";

export const SITE_TAGLINE =
  "Supporting family abroad from Japan? Check if a parent, spouse, child or sibling living outside Japan qualifies for the 2026 dependent deduction (国外居住親族の扶養控除), the ¥380,000 remittance test for ages 30-69, the deduction amount under the new ¥620,000 income limit, and which documents to hand your employer.";

export const DISCLAIMER_SHORT = "Educational tax estimate, not tax advice, not affiliated with the National Tax Agency. Your employer or tax office decides; confirm before the year-end adjustment.";

export const HONESTY =
  "Rules as of 2026-10-25 from the NTA's 国外居住親族 Q&A (revised Aug 2026), Tax Answers 1180/1177 and the 2026 year-end adjustment guide. Income tax only; resident tax is not calculated. It can't check your actual documents.";

export const SIBLING_TOOLS = [
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-parttime-check.vercel.app", label: "Japan Part-time Work Check" },
  { href: "https://japan-driving-check.vercel.app", label: "Japan Driving Check" },
  { href: "https://house-rules-check.vercel.app", label: "House Rules Check" },
  { href: "https://japan-mynumber-card-check.vercel.app", label: "Japan My Number Card Check" },
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://japan-intl-postage.vercel.app", label: "Japan International Postage 2027" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-overseas-dependents.vercel.app";
}
