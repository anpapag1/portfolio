import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export interface AwardCategory {
  title: string
  items: {
    name: string
    sub?: string
    badge?: string
    year?: string
  }[]
}

export function AwardsCard({ node }: { node: NodeData }) {
  const c = node.content
  const categories: AwardCategory[] = c.categories || c.sections || []

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {categories.map((cat, i) => (
        <div
          key={cat.title}
          style={{
            marginBottom: i < categories.length - 1 ? 14 : 0,
            paddingBottom: i < categories.length - 1 ? 12 : 0,
            borderBottom:
              i < categories.length - 1
                ? "1px solid rgba(255,255,255,0.05)"
                : "none",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: "#525252",
              letterSpacing: "0.12em",
              marginBottom: 7,
            }}
          >
            {cat.title.toUpperCase()}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {cat.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "#c8c8c8", fontWeight: 400 }}>
                    {item.name}
                  </span>
                  {item.sub && (
                    <span
                      className="mono"
                      style={{ fontSize: 9, color: "#484848", marginLeft: 6 }}
                    >
                      · {item.sub}
                    </span>
                  )}
                </div>
                {item.badge && (
                  <span
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#fbbf24",
                      background: "rgba(251, 191, 36, 0.08)",
                      border: "1px solid rgba(251, 191, 36, 0.2)",
                      padding: "1px 5px",
                      borderRadius: 3,
                      flexShrink: 0,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.year && !item.badge && (
                  <span
                    className="mono"
                    style={{ fontSize: 9, color: "#444", flexShrink: 0 }}
                  >
                    {item.year}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
