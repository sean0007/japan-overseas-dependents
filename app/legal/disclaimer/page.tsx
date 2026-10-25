import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/dependents";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational calculator. It applies a dated reading (as of {RULES_AS_OF}) of the National Tax Agency&apos;s Q&amp;A on deductions for relatives living outside Japan (国外居住親族に係る扶養控除等Ｑ＆Ａ, revised August 2026), Tax Answers No. 1180 and 1177, the 2026 year-end adjustment guide (including the reform that raises the dependent income limit to ¥620,000 from 2026-12-01) and the NTA&apos;s remittance-statement guidance to the numbers you enter, for one relative at a time.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not tax advice and is not affiliated with the National Tax Agency, any tax office or your employer. It cannot see or verify your documents, whether a payment really went to the relative for living or education costs, their real income, or whether they are a non-resident. Your employer applies the year-end adjustment and the tax office decides on returns. It covers national income tax only; resident tax (住民税) uses different amounts and your city decides it. Rules change: confirm with your employer, your tax office (or the NTA telephone consultation center) or a licensed tax accountant (税理士) before you rely on a result.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">The numbers you enter stay in your browser (or in a share link you create). No login, no names, no database.</p>
        </section>
      </div>
    </div>
  );
}
