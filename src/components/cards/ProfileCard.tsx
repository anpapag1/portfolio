import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export function ProfileCard({ node }: { node: NodeData }) {
  const c = node.content || {}
  const name = c.name || "Antonis Papageorgiou"
  const title = c.title || "CS Student & Developer"
  const location = c.location || "Kavala / Athens, Greece"
  const bio = c.bio || ""
  const statusText = c.statusText || ""

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {name}
        </div>
        <div className="mono" style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 2 }}>
          {title}
          {location && <span style={{ color: "var(--text-subtle)" }}> · {location}</span>}
        </div>
      </div>

      {bio && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.65, margin: "0 0 14px" }}>
          {bio}
        </p>
      )}

      {statusText && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 9px",
            borderRadius: 6,
            background: "rgba(74, 222, 128, 0.08)",
            border: "1px solid rgba(74, 222, 128, 0.25)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px #4ade80",
              flexShrink: 0,
            }}
          />
          <span className="mono text-emerald-600 dark:text-[#86efac]" style={{ fontSize: 9, fontWeight: 600 }}>
            {statusText}
          </span>
        </div>
      )}
    </div>
  )
}
