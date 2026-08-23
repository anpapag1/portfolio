import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export function WorkCard({ node }: { node: NodeData }) {
  const c = node.content
  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {c.positions.map(
        (
          pos: { company: string; role: string; period: string; desc: string },
          i: number,
        ) => (
          <div
            key={pos.company}
            style={{
              display: "flex",
              gap: 14,
              marginBottom: i < c.positions.length - 1 ? 16 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 3,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              />
              {i < c.positions.length - 1 && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    background: "rgba(255,255,255,0.07)",
                    marginTop: 5,
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: i < c.positions.length - 1 ? 4 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d4" }}>
                {pos.company}
              </div>
              <div style={{ fontSize: 11, color: "#636363", marginTop: 2 }}>
                {pos.role}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  color: "#444",
                  marginTop: 3,
                  marginBottom: 6,
                }}
              >
                {pos.period}
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "#5a5a5a",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {pos.desc}
              </p>
            </div>
          </div>
        ),
      )}
    </div>
  )
}
