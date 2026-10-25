import { ImageResponse } from "next/og";

export const alt = "Japan Overseas Dependents Check: can I claim my family abroad on my Japanese taxes in 2026?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "64px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.28em", textTransform: "uppercase", color: "#f0b429" }}>Free · Japan · 2026 year-end adjustment</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 68, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 1050 }}>Can I claim my family abroad on my Japanese taxes?</div>
          <div style={{ display: "flex", fontSize: 30, color: "#9b9588", maxWidth: 1050, lineHeight: 1.35 }}>Ages 30-69 need ¥380,000+ sent · 70+ ¥480,000 · 19-22 ¥630,000 · new ¥620,000 income limit</div>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 22, color: "#9b9588" }}>
          <span style={{ color: "#99f6e4" }}>Amount + documents</span>
          <span>Parents · spouse · kids · siblings</span>
          <span>Free JSON API · no login</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
