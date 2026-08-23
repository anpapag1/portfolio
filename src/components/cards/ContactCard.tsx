import type { NodeData } from "../../types"
import { CardLabel } from "./Label"
import { Mail, Phone, Globe, Send, ExternalLink } from "lucide-react"

function getChannelIcon(label: string) {
  const l = label.toLowerCase()
  if (l.includes("mail") || l.includes("@")) return <Mail size={12} />
  if (l.includes("phone") || l.includes("tel")) return <Phone size={12} />
  if (l.includes("git")) return <Globe size={12} />
  if (l.includes("link")) return <Globe size={12} />
  if (l.includes("discord") || l.includes("telegram")) return <Send size={12} />
  return <ExternalLink size={12} />
}

export function ContactCard({ node }: { node: NodeData }) {
  const c = node.content
  const channels = c.channels || []

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      <p
        style={{
          fontSize: 11,
          color: "#525252",
          lineHeight: 1.6,
          margin: "0 0 14px",
        }}
      >
        Always open to interesting projects, hackathons, and hardware collaborations.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {channels.map(
          (ch: { label: string; value: string; href: string }) => (
            <a
              key={ch.label}
              href={ch.href}
              target={ch.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                textDecoration: "none",
                cursor: "pointer",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{
                    color: "#555",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {getChannelIcon(ch.label)}
                </span>
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#484848",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {ch.label.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#c0c0c0",
                      fontWeight: 450,
                      marginTop: 1,
                    }}
                  >
                    {ch.value}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 10.5, color: "#3e3e3e" }}>↗</span>
            </a>
          ),
        )}
      </div>
    </div>
  )
}
