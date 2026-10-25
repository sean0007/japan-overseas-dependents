import { DISABILITY, METHODS, RELATIONSHIPS, checkDependent, type CheckInput, type Disability, type Method, type Relationship } from "./dependents";

export const PUBLIC_URL = "https://japan-overseas-dependents.vercel.app";

/** Share links: /r?rel=parent&a=62[&y=2025][&i=relIncome][&t=taxpayerIncome][&s=1][&d=disabled][&r=remit][&n=count][&f=firstLast][&m=method][&mr=rate] */
type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, key: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(key) ?? undefined;
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
}
function int(p: Params, key: string): number | null {
  const v = one(p, key);
  if (v === undefined || v === "" || !/^\d{1,11}$/.test(v)) return null;
  return Number(v);
}

export type Shared = {
  relationship: Relationship;
  age: number;
  year: number;
  relativeIncome: number;
  taxpayerIncome: number | null;
  studyingAbroad: boolean;
  disability: Disability;
  remittanceTotal: number | null;
  remittanceCount: number | null;
  firstLastTotal: number | null;
  method: Method;
  marginalRate: number | null;
};

const BASE = { year: 2026, relativeIncome: 0, taxpayerIncome: null, studyingAbroad: false, disability: "none" as Disability, remittanceCount: null, firstLastTotal: null, method: "bank" as Method, marginalRate: null };
export const EXAMPLE_SHARED: Shared = { ...BASE, relationship: "parent", age: 62, remittanceTotal: 300000, remittanceCount: 6 };
export const EXAMPLE_CHILD: Shared = { ...BASE, relationship: "child", age: 20, remittanceTotal: 1200000, remittanceCount: 12, marginalRate: 10 };

export function parseShared(p: Params): Shared | null {
  const rel = one(p, "rel");
  const age = int(p, "a");
  if (!rel || !(RELATIONSHIPS as readonly string[]).includes(rel) || age === null || age > 130) return null;
  const d = one(p, "d") ?? "none";
  const m = one(p, "m") ?? "bank";
  return {
    relationship: rel as Relationship,
    age,
    year: int(p, "y") === 2025 ? 2025 : 2026,
    relativeIncome: int(p, "i") ?? 0,
    taxpayerIncome: int(p, "t"),
    studyingAbroad: one(p, "s") === "1",
    disability: ((DISABILITY as readonly string[]).includes(d) ? d : "none") as Disability,
    remittanceTotal: int(p, "r"),
    remittanceCount: int(p, "n"),
    firstLastTotal: int(p, "f"),
    method: ((METHODS as readonly string[]).includes(m) ? m : "bank") as Method,
    marginalRate: int(p, "mr"),
  };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  q.set("rel", s.relationship);
  q.set("a", String(s.age));
  if (s.year !== 2026) q.set("y", String(s.year));
  if (s.relativeIncome) q.set("i", String(s.relativeIncome));
  if (s.taxpayerIncome !== null) q.set("t", String(s.taxpayerIncome));
  if (s.studyingAbroad) q.set("s", "1");
  if (s.disability !== "none") q.set("d", s.disability);
  if (s.remittanceTotal !== null) q.set("r", String(s.remittanceTotal));
  if (s.remittanceCount !== null) q.set("n", String(s.remittanceCount));
  if (s.firstLastTotal !== null) q.set("f", String(s.firstLastTotal));
  if (s.method !== "bank") q.set("m", s.method);
  if (s.marginalRate !== null) q.set("mr", String(s.marginalRate));
  return q.toString();
}

export function toCheckInput(s: Shared): CheckInput {
  return { ...s };
}
export function safeCheck(s: Shared) {
  try {
    return checkDependent(toCheckInput(s));
  } catch {
    return null;
  }
}
export function resultPath(s: Shared): string {
  return `/r?${sharedQuery(s)}`;
}
export function ogPath(s: Shared): string {
  return `/og?${sharedQuery(s)}`;
}
export function isIndexable(s: Shared): boolean {
  return resultPath(s) === resultPath(EXAMPLE_SHARED) || resultPath(s) === resultPath(EXAMPLE_CHILD);
}
