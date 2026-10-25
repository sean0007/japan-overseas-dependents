"use client";

import { useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { DISABILITY, MARGINAL_RATES, METHODS, METHOD_LABEL, RELATIONSHIPS, RELATIONSHIP_LABEL, type Disability, type Method, type Relationship } from "@/lib/dependents";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath, safeCheck, type Shared } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

const VERDICT_STYLE: Record<string, string> = {
  eligible: "text-teal-200",
  conditional: "text-amber-200",
  short_of_380k: "text-amber-200",
  not_eligible: "text-red-300",
};
const VERDICT_LABEL: Record<string, string> = {
  eligible: "Qualifies",
  conditional: "Can qualify",
  short_of_380k: "Short of ¥380,000",
  not_eligible: "Does not qualify",
};
const DIS_LABEL: Record<Disability, string> = { none: "No", disabled: "Yes: disabled (障害者)", special: "Yes: severely disabled (特別障害者)" };

const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;
function toNum(v: string): number | null {
  const t = v.replace(/[,\s¥]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [relationship, setRel] = useState<Relationship>(start.relationship);
  const [age, setAge] = useState(String(start.age));
  const [year, setYear] = useState(start.year);
  const [relIncome, setRelIncome] = useState(start.relativeIncome ? String(start.relativeIncome) : "");
  const [taxpayerIncome, setTaxpayerIncome] = useState(start.taxpayerIncome !== null ? String(start.taxpayerIncome) : "");
  const [studying, setStudying] = useState(start.studyingAbroad);
  const [disability, setDisability] = useState<Disability>(start.disability);
  const [remit, setRemit] = useState(start.remittanceTotal !== null ? String(start.remittanceTotal) : "");
  const [count, setCount] = useState(start.remittanceCount !== null ? String(start.remittanceCount) : "");
  const [firstLast, setFirstLast] = useState(start.firstLastTotal !== null ? String(start.firstLastTotal) : "");
  const [method, setMethod] = useState<Method>(start.method);
  const [rate, setRate] = useState(start.marginalRate !== null ? String(start.marginalRate) : "");

  const ageNum = toNum(age);
  const isSpouse = relationship === "spouse";
  const shared: Shared = {
    relationship,
    age: ageNum ?? 0,
    year,
    relativeIncome: toNum(relIncome) ?? 0,
    taxpayerIncome: toNum(taxpayerIncome),
    studyingAbroad: !isSpouse && studying,
    disability,
    remittanceTotal: toNum(remit),
    remittanceCount: toNum(count),
    firstLastTotal: toNum(firstLast),
    method,
    marginalRate: rate ? Number(rate) : null,
  };
  const r = ageNum !== null ? safeCheck(shared) : null;
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;
  const show30 = !isSpouse && ageNum !== null && ageNum >= 30 && ageNum < 70;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">One relative living abroad</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Relationship</span>
            <select data-testid="relationship" className={field} value={relationship} onChange={(e) => setRel(e.target.value as Relationship)}>
              {RELATIONSHIPS.map((x) => (
                <option key={x} value={x}>
                  {RELATIONSHIP_LABEL[x].en.replace(/ \(.*\)$/, "")} ({RELATIONSHIP_LABEL[x].ja.split("・")[0].replace(/（.*）/, "")})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Tax year</span>
            <select className={field} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Their age on Dec 31, {year}</span>
          <input data-testid="age" inputMode="numeric" className={field} value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Yen you sent directly to them in {year} (total)</span>
          <input data-testid="remit" inputMode="numeric" placeholder="e.g. 400000 (leave blank if not sure yet)" className={field} value={remit} onChange={(e) => setRemit(e.target.value)} />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Number of payments</span>
            <input inputMode="numeric" className={field} value={count} onChange={(e) => setCount(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">First + last payment (¥)</span>
            <input inputMode="numeric" placeholder="optional" className={field} value={firstLast} onChange={(e) => setFirstLast(e.target.value)} />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">How you send it</span>
          <select className={field} value={method} onChange={(e) => setMethod(e.target.value as Method)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
        {show30 ? (
          <label className="mt-4 flex items-start gap-2 text-sm text-foreground">
            <input type="checkbox" className="mt-1" checked={studying} onChange={(e) => setStudying(e.target.checked)} />
            <span>They lived in Japan and left to study abroad (student visa)</span>
          </label>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Disabled under Japanese criteria?</span>
          <select className={field} value={disability} onChange={(e) => setDisability(e.target.value as Disability)}>
            {DISABILITY.map((d) => (
              <option key={d} value={d}>
                {DIS_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Their Japan-source income (合計所得金額, ¥)</span>
          <input inputMode="numeric" placeholder="0 if they earn nothing in Japan" className={field} value={relIncome} onChange={(e) => setRelIncome(e.target.value)} />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Your total income (¥)</span>
            <input inputMode="numeric" placeholder={isSpouse ? "needed for spouse" : "optional"} className={field} value={taxpayerIncome} onChange={(e) => setTaxpayerIncome(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Your tax bracket</span>
            <select className={field} value={rate} onChange={(e) => setRate(e.target.value)}>
              <option value="">Skip saving estimate</option>
              {MARGINAL_RATES.map((m) => (
                <option key={m} value={m}>
                  {m}%
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/60">
        <div className="p-5 sm:p-7" data-testid="result">
          {r ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">{VERDICT_LABEL[r.verdict]} · {r.year}</p>
              <p className={`mt-2 font-display text-5xl tracking-tight sm:text-6xl ${VERDICT_STYLE[r.verdict]}`}>{r.verdict === "not_eligible" ? "¥0" : yen(r.totalDeduction)}</p>
              <p className="mt-1 text-sm text-muted">income-tax deduction{r.estimatedIncomeTaxSaving ? ` · about ${yen(r.estimatedIncomeTaxSaving)} less tax` : ""}</p>
              <p className="mt-3 text-base text-foreground">{r.summary}</p>
              {r.remittance.shortfall ? (
                <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-amber-100">
                  <p className="font-semibold">Send {yen(r.remittance.shortfall)} more by {r.remittance.sendBy}</p>
                  <p className="mt-1 leading-relaxed">Directly to this relative, for living or education costs. The sending date counts, even if it arrives in January.</p>
                </div>
              ) : null}
              {r.deductions.length ? (
                <ul className="mt-4 space-y-1 text-sm text-muted">
                  {r.deductions.map((d) => (
                    <li key={d.code}>
                      <span className="text-foreground">{yen(d.amount)}</span> · {d.en} ({d.ja})
                    </li>
                  ))}
                </ul>
              ) : null}
              {r.documents.withForm.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">Documents with your application</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.documents.withForm.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">Documents at the year-end adjustment</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.documents.atYearEnd.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {r.steps.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">What to do</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h3 className="mt-6 text-sm font-semibold text-foreground">Watch out</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                {[r.remittance.methodNote, ...r.warnings].map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <div className="mt-6">
                <ShareBar url={shareUrl} text={`Overseas family tax deduction check: ${VERDICT_LABEL[r.verdict]}${r.totalDeduction ? `, ${yen(r.totalDeduction)}` : ""}`} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Enter the relative&apos;s age on Dec 31 to see if they qualify.</p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}
