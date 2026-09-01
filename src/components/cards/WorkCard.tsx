import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export interface WorkPosition {
  company: string
  role: string
  period: string
  desc: string
}

export function WorkCard({ node }: { node: NodeData }) {
  const c = node.content
  const positions: WorkPosition[] = c.positions || []

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {positions.map((pos, i) => (
        <div
          key={pos.company}
          style={{
            paddingBottom: i < positions.length - 1 ? 14 : 0,
            marginBottom: i < positions.length - 1 ? 14 : 0,
            borderBottom:
              i < positions.length - 1
                ? "1px solid var(--border-subtle)"
                : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {pos.company}
            </div>
            <span className="mono" style={{ fontSize: 9, color: "var(--text-subtle)" }}>
              {pos.period}
            </span>
          </div>

          <div
            className="mono"
            style={{ fontSize: 9.5, color: "var(--text-secondary)", marginBottom: 6 }}
          >
            {pos.role}
          </div>

          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {pos.desc}
          </p>
        </div>
      ))}
    </div>
  )
}
