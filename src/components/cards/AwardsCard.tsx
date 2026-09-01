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
                ? "1px solid var(--border-subtle)"
                : "none",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: "var(--text-secondary)",
              letterSpacing: "0.12em",
              marginBottom: 7,
              fontWeight: 500,
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
                  <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>
                    {item.name}
                  </span>
                  {item.sub && (
                    <span
                      className="mono"
                      style={{ fontSize: 9, color: "var(--text-secondary)", marginLeft: 6 }}
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
                      color: "#d97706",
                      background: "rgba(251, 191, 36, 0.12)",
                      border: "1px solid rgba(251, 191, 36, 0.3)",
                      padding: "1px 5px",
                      borderRadius: 3,
                      flexShrink: 0,
                      fontWeight: 600,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.year && !item.badge && (
                  <span
                    className="mono"
                    style={{ fontSize: 9, color: "var(--text-subtle)", flexShrink: 0 }}
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
