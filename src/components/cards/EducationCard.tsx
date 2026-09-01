import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export interface EducationItem {
  degree: string
  school: string
  location?: string
  period: string
  desc?: string
  highlights?: string[]
}

export function EducationCard({ node }: { node: NodeData }) {
  const c = node.content
  const items: EducationItem[] = c.education || c.items || c.positions || []

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {items.map((item, i) => (
        <div
          key={item.degree || item.school}
          style={{
            paddingBottom: i < items.length - 1 ? 14 : 0,
            marginBottom: i < items.length - 1 ? 14 : 0,
            borderBottom:
              i < items.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 3,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {item.degree}
            </div>
            {item.period && (
              <span className="mono" style={{ fontSize: 9, color: "var(--text-subtle)" }}>
                {item.period}
              </span>
            )}
          </div>

          <div
            className="mono"
            style={{ fontSize: 9.5, color: "var(--text-secondary)", marginBottom: 7 }}
          >
            {item.school}
            {item.location && <span> · {item.location}</span>}
          </div>

          {item.desc && (
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                margin: "0 0 8px",
              }}
            >
              {item.desc}
            </p>
          )}

          {item.highlights && item.highlights.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {item.highlights.map((h) => (
                <span
                  key={h}
                  className="skill-tag"
                  style={{
                    fontSize: 9,
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
