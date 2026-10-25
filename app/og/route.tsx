import { ImageResponse } from "next/og";
import { EXAMPLE_SHARED, parseShared, safeCheck } from "@/lib/share";

const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;

export async function GET(req: Request) {
  const shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  const r = safeCheck(shared) ?? safeCheck(EXAMPLE_SHARED)!;
  const bad = r.verdict === "not_eligible";
  const warn = r.verdict === "short_of_380k" || r.verdict === "conditional";
  const stats = [
    { label: "relative", value: `${r.relationshipLabel.replace(/ \(.*\)$/, "")}, ${r.ageAtYearEnd}` },
    { label: "sent this year", value: r.remittance.entered !== null ? yen(r.remittance.entered) : "—" },
    { label: r.remittance.minimumTotal ? "minimum needed" : "tax year", value: r.remittance.minimumTotal ? yen(r.remittance.minimumTotal) : String(r.year) },
  ];
  const headline = bad ? "No deduction" : yen(r.totalDeduction);
  const sub = r.verdict === "short_of_380k" ? `Send ${yen(r.remittance.shortfall ?? 0)} more by ${r.remittance.sendBy}` : r.verdict === "conditional" ? "Qualifies with remittance records" : bad ? "Does not qualify this year" : "Qualifies with the right documents";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan Overseas Dependents Check</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>rules as of {r.rulesAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#c9c3b6" }}>{`${r.year} income-tax deduction`}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 104, fontWeight: 800, letterSpacing: "-0.03em", color: bad ? "#fca5a5" : warn ? "#fde68a" : "#99f6e4", lineHeight: 1.05 }}>{headline}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 30, color: "#f0b429", maxWidth: 1070 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-overseas-dependents.vercel.app · free, no login</span>
          <span>Educational, not tax advice. Not affiliated with the NTA.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
