import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export function ContactCard({ node }: { node: NodeData }) {
  const c = node.content
  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      <p
        style={{
          fontSize: 12,
          color: "#5a5a5a",
          lineHeight: 1.65,
          margin: "0 0 16px",
          fontWeight: 400,
        }}
      >
        Always open to interesting projects and conversations.
      </p>
      {c.channels.map((ch: { label: string; value: string; href: string }) => (
        <a
          key={ch.label}
          href={ch.href}
          style={{ textDecoration: "none", display: "block" }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.55")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  color: "#484848",
                  letterSpacing: "0.1em",
                }}
              >
                {ch.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#b8b8b8",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {ch.value}
              </div>
            </div>
            <span style={{ fontSize: 12, color: "#444" }}>↗</span>
          </div>
        </a>
      ))}
    </div>
  )
}
