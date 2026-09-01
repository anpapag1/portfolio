import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export interface ProjectItem {
  name: string
  desc: string
  tags: string[]
  year: string
  stars?: string
  github?: string
  url?: string
  link?: string
}

export function ProjectsCard({ node }: { node: NodeData }) {
  const c = node.content
  const items: ProjectItem[] = c.items || []

  return (
    <div style={{ padding: "20px" }}>
      <CardLabel node={node} />
      {items.map((p: ProjectItem, i: number) => {
        const href =
          p.github ||
          p.url ||
          p.link ||
          `https://github.com/anpapag1/${p.name.toLowerCase().replace(/\s+/g, "-")}`

        return (
          <div
            key={p.name}
            style={{
              paddingBottom: i < items.length - 1 ? 14 : 0,
              marginBottom: i < items.length - 1 ? 14 : 0,
              borderBottom:
                i < items.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              {href ? (
                <a
                  href={
                    href.startsWith("http://") || href.startsWith("https://")
                      ? href
                      : `https://${href}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    transition: "opacity 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.7"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1"
                  }}
                >
                  <span>{p.name}</span>
                  <span
                    className="proj-arrow"
                    style={{
                      fontSize: 10.5,
                      color: "var(--text-subtle)",
                      transition: "color 0.15s ease",
                    }}
                  >
                    ↗
                  </span>
                </a>
              ) : (
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
                >
                  {p.name}
                </span>
              )}
              <span className="mono" style={{ fontSize: 9, color: "var(--text-subtle)" }}>
                {p.year}
              </span>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                margin: "0 0 7px",
              }}
            >
              {p.desc}
            </p>
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {p.tags.map((t) => (
                <span key={t} className="skill-tag" style={{ fontSize: 9 }}>
                  {t}
                </span>
              ))}
              {p.stars && (
                <span
                  className="mono"
                  style={{ fontSize: 9, color: "var(--text-subtle)", marginLeft: "auto" }}
                >
                  ★ {p.stars}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
