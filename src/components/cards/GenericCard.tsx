import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export function GenericCard({ node }: { node: NodeData }) {
  const c = node.content || {}
  const title = c.title || c.name || c.heading || ""
  const subtitle = c.subtitle || c.sub || c.role || ""
  const description = c.description || c.desc || c.bio || c.text || ""

  // Extract any array or key-value entries to display
  const entries = Object.entries(c).filter(
    ([key]) =>
      !["title", "name", "heading", "subtitle", "sub", "role", "description", "desc", "bio", "text"].includes(key),
  )

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
          {title}
        </div>
      )}
      {subtitle && (
        <div className="mono" style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 8 }}>
          {subtitle}
        </div>
      )}
      {description && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 10px" }}>
          {description}
        </p>
      )}
      {entries.map(([key, val]) => (
        <div key={key} style={{ marginTop: 8 }}>
          <div className="mono" style={{ fontSize: 9, color: "var(--text-subtle)", letterSpacing: "0.1em", fontWeight: 500 }}>
            {key.toUpperCase()}
          </div>
          {Array.isArray(val) ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              {val.map((item, idx) => (
                <span key={idx} className="skill-tag" style={{ fontSize: 9 }}>
                  {typeof item === "object" ? JSON.stringify(item) : String(item)}
                </span>
              ))}
            </div>
          ) : typeof val === "object" && val !== null ? (
            <div className="mono" style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>
              {JSON.stringify(val)}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--text-primary)", marginTop: 2 }}>
              {String(val)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
