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
                ? "1px solid rgba(255,255,255,0.05)"
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
            <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d4" }}>
              {pos.company}
            </div>
            <span className="mono" style={{ fontSize: 9, color: "#444" }}>
              {pos.period}
            </span>
          </div>

          <div
            className="mono"
            style={{ fontSize: 9.5, color: "#666", marginBottom: 6 }}
          >
            {pos.role}
          </div>

          <p
            style={{
              fontSize: 11,
              color: "#5a5a5a",
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
