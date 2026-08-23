import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export function SkillsCard({ node }: { node: NodeData }) {
  const c = node.content
  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {c.groups.map((g: { label: string; items: string[] }, i: number) => (
        <div
          key={g.label}
          style={{ marginBottom: i < c.groups.length - 1 ? 14 : 0 }}
        >
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: "#484848",
              letterSpacing: "0.14em",
              marginBottom: 7,
            }}
          >
            {g.label.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {g.items.map((item) => (
              <span key={item} className="skill-tag">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
