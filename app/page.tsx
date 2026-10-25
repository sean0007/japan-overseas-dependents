import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { SOURCES } from "@/lib/dependents";
import { EXAMPLE_CHILD, EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "Can I claim my family abroad as dependents in Japan? 2026 checker (国外居住親族 扶養控除)";
const description =
  "Free checker for people working in Japan who support parents, a spouse, children or siblings overseas: who qualifies by age, the ¥380,000 remittance rule for ages 30-69, the 2026 deduction amounts under the new ¥620,000 income limit, and the documents to hand your employer for the year-end adjustment. Free JSON API for AI agents. Educational, not tax advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan Overseas Dependents Check",
  alternateName: ["国外居住親族 扶養控除 判定", "海外の家族 扶養控除 38万円 送金 チェック", "Japan tax deduction for family abroad calculator"],
  url: PUBLIC_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description: "Unofficial, free checker for Japan's income-tax deductions for relatives living outside Japan (dependent, spouse, specified relative, disability), the ¥380,000 remittance test and required documents, with a keyless JSON API. Not affiliated with the National Tax Agency.",
};

const faq: FaqItem[] = [
  {
    q: "Can I claim my parents abroad as dependents on my Japanese taxes?",
    a: "Yes, if they qualify on Dec 31 and you can prove you support them. Parents aged 70+ give ¥480,000 (elderly dependent). Parents aged 30-69 qualify only if you paid them ¥380,000 or more during the year for living or education costs, or they are disabled under Japanese criteria, or they left Japan to study abroad. Their Japan-source income must be ¥620,000 or less for 2026. You hand in a relationship document and the remittance records.",
  },
  {
    q: "What is the ¥380,000 rule?",
    a: "Since 2023, a relative abroad aged 30 to 69 counts as a dependent only if you paid them at least ¥380,000 in the year for living or education costs (unless they are studying abroad or disabled). The ¥380,000 is per person: a transfer to your mother doesn't count for your father. Fees count only if they appear on the record. The sending date counts, so a payment sent on Dec 31 still counts for that year.",
  },
  {
    q: "What changed for 2026?",
    a: "The income limit for dependents and for the spouse exemption went up from ¥580,000 to ¥620,000 (salary-only: ¥1,360,000), effective 2026-12-01 and applied at the 2026 year-end adjustment. The spouse special exemption now starts above ¥620,000 and ends at ¥1,330,000. The special exemption for relatives aged 19-22 earning up to ¥1,230,000 continues (up to ¥630,000).",
  },
  {
    q: "Which documents do I need for family living abroad?",
    a: "Two kinds. (1) Relationship document (親族関係書類): a foreign government document with the relative's name, date of birth and address (birth or marriage certificate, family register), or a copy of your 戸籍の附票 plus their passport copy. (2) Remittance records (送金関係書類) for the year: bank or money-transfer records, a family credit card statement, or an electronic payment record. For ages 30-69 on the ¥380,000 route, the records must add up to ¥380,000 (38万円送金書類). Foreign-language documents need a Japanese translation.",
  },
  {
    q: "I send money monthly. Do I have to hand in 12 receipts?",
    a: "No. With 3 or more payments to the same relative you can submit the NTA list of remittances (送金関係書類の明細書) plus only the first and last records of the year. On the ¥380,000 route, if the first and last together are under ¥380,000 you must also show records proving the total reaches ¥380,000.",
  },
  {
    q: "Does cash or one transfer for the whole family count?",
    a: "No. Cash handed over in person or through a friend has no qualifying record. A transfer to one family member counts only for that person, and transfers to a joint account generally don't count. Send to each relative you claim, in their own name.",
  },
  {
    q: "Can I claim my spouse who lives abroad?",
    a: "Yes. The age rule for 30-69 doesn't apply to a spouse. If your spouse's income is ¥620,000 or less (2026) and your own total income is ¥9,000,000 or less, the spouse exemption is ¥380,000 (¥480,000 if 70+). It shrinks as your income rises and stops above ¥10,000,000. You still need the relationship document and remittance records.",
  },
  {
    q: "I missed the year-end adjustment. Can I still claim?",
    a: "Yes. If your employer has already issued your withholding slip (源泉徴収票), file a final tax return (確定申告) with the same documents by March 15 of the next year, or a refund return within 5 years.",
  },
  {
    q: "Is there a free API for AI agents?",
    a: `Yes. GET or POST ${PUBLIC_URL}/api/check?relationship=parent&age=62&remittanceTotal=450000 (keyless, CORS open), rules at /api/rules, OpenAPI at /openapi.json, llms.txt, and the MCP tool japan_overseas_dependents_check on free-agent-tools.vercel.app/mcp. Every response carries rulesAsOf, sources and a disclaimer.`,
  },
  {
    q: "海外に住む親を扶養に入れられますか？",
    a: "12月31日時点で70歳以上なら老人扶養親族（48万円）、16〜29歳は一般（19〜22歳は特定扶養63万円）。30〜69歳は、留学・障害者、またはその年に生活費・教育費として38万円以上送金した場合に限ります。2026年分は所得要件が62万円以下になりました。親族関係書類と送金関係書類（38万円送金書類）が必要です。",
  },
  {
    q: "送金を家族の代表者にまとめて送っても大丈夫ですか？",
    a: "代表者への送金は代表者本人分の送金関係書類にしかなりません。扶養控除を受ける親族それぞれに送金する必要があります。現金の手渡しや共同名義口座への送金も原則として認められません。",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · 2026 年末調整 · 国外居住親族</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Can I claim my family abroad on my Japanese taxes?</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
          Sending money home to parents, a spouse, kids or siblings? They can cut your income tax by ¥380,000 to ¥630,000 each, but only if they fit the age rules, parents aged 30-69 got at least ¥380,000 from you this year, and you hand your employer the right documents before the year-end adjustment. Check one relative at a time.
        </p>
        <p className="mt-3 text-sm text-muted">
          Examples:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            parent aged 62, ¥300,000 sent so far
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_CHILD)}>
            child aged 20 at home abroad
          </a>
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-5xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">The 2026 rules in one table</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Relative abroad (age on Dec 31)</th>
                <th className="px-4 py-3 font-medium">Qualifies?</th>
                <th className="px-4 py-3 font-medium">Income-tax deduction</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Under 16</td><td className="px-4 py-3">No (disability exemption only)</td><td className="px-4 py-3">—</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">16-18, 23-29</td><td className="px-4 py-3">Yes</td><td className="px-4 py-3">¥380,000</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">19-22</td><td className="px-4 py-3">Yes (income ≤ ¥620k; up to ¥1.23M via special exemption)</td><td className="px-4 py-3">¥630,000 (sliding ¥610k→¥30k above ¥850k income)</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">30-69</td><td className="px-4 py-3">Only if studying abroad, disabled, or you paid them ¥380,000+ this year</td><td className="px-4 py-3">¥380,000</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">70+</td><td className="px-4 py-3">Yes</td><td className="px-4 py-3">¥480,000</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Spouse (any age)</td><td className="px-4 py-3">Your income ≤ ¥10M; spouse income ≤ ¥1.33M</td><td className="px-4 py-3">Up to ¥380,000 (¥480,000 if 70+)</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Disabled (Japanese criteria)</td><td className="px-4 py-3">Added on top</td><td className="px-4 py-3">+¥270,000 / special +¥400,000</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          Official pages:{" "}
          {SOURCES.slice(0, 4).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace("https://www.", "").slice(0, 60)}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2 break-all" href="/api/check?relationship=parent&age=62&remittanceTotal=450000&marginalRate=10">
            /api/check?relationship=parent&amp;age=62&amp;remittanceTotal=450000&amp;marginalRate=10
          </a>
          . Rules: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_overseas_dependents_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Family abroad: tax questions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
