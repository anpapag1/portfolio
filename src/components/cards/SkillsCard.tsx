import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export function SkillsCard({ node }: { node: NodeData }) {
  const c = node.content
  const groups: { label: string; items: string[] }[] = c.groups || []

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {groups.map((g, i) => (
        <div
          key={g.label}
          style={{ marginBottom: i < groups.length - 1 ? 14 : 0 }}
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
            {g.label.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {g.items.map((item) => (
              <span
                key={item}
                className="skill-tag"
                style={{
                  fontSize: 9.5,
                  padding: "3px 8px",
                  borderRadius: 4,
                  transition: "border-color 0.15s ease, background 0.15s ease",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
