import { useState } from "react"
import type { NodeData } from "../../types"
import { CardLabel } from "./Label"
import { Download, Check, ShieldAlert, Terminal } from "lucide-react"

export interface VaultFile {
  name: string
  filename: string
  url: string
  size?: string
  ext?: string
  desc?: string
}

function getExtBadgeStyle(ext: string = "TXT") {
  const e = ext.toUpperCase()
  if (e === "MD") {
    return {
      bg: "rgba(56, 189, 248, 0.12)",
      border: "rgba(56, 189, 248, 0.3)",
      color: "#0284c7",
    }
  }
  if (e === "JSON") {
    return {
      bg: "rgba(251, 146, 60, 0.12)",
      border: "rgba(251, 146, 60, 0.3)",
      color: "#ea580c",
    }
  }
  return {
    bg: "rgba(236, 72, 153, 0.12)",
    border: "rgba(236, 72, 153, 0.3)",
    color: "#db2777",
  }
}

export function SecretCard({ node }: { node: NodeData }) {
  const c = node.content || {}
  const files: VaultFile[] = c.files || []
  const stats: Record<string, string> = c.stats || {}
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({})

  const handleDownload = (filename: string) => {
    setDownloaded((prev) => ({ ...prev, [filename]: true }))
    setTimeout(() => {
      setDownloaded((prev) => ({ ...prev, [filename]: false }))
    }, 2000)
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <CardLabel node={node} />
        <span
          className="mono"
          style={{
            fontSize: 8,
            color: "#ec4899",
            background: "rgba(236, 72, 153, 0.1)",
            border: "1px solid rgba(236, 72, 153, 0.3)",
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: 600,
            letterSpacing: "0.1em",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ShieldAlert size={10} />
          {c.badge || "RESTRICTED"}
        </span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {c.title || "Developer Vault"}
        </div>
        {c.subtitle && (
          <div className="mono" style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 2 }}>
            {c.subtitle}
          </div>
        )}
      </div>

      {c.desc && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 12px" }}>
          {c.desc}
        </p>
      )}

      {/* Downloadable Files List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <div
          className="mono"
          style={{
            fontSize: 8.5,
            color: "var(--text-subtle)",
            letterSpacing: "0.12em",
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          DOWNLOADABLE ARTIFACTS
        </div>

        {files.map((file) => {
          const badge = getExtBadgeStyle(file.ext)
          const isDone = !!downloaded[file.filename]

          return (
            <div
              key={file.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--icon-btn-bg)",
                border: "1px solid var(--border-subtle)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0, flex: 1, paddingRight: 8 }}>
                <span
                  className="mono font-semibold"
                  style={{
                    fontSize: 8.5,
                    color: badge.color,
                    background: badge.bg,
                    border: `1px solid ${badge.border}`,
                    padding: "1px 5px",
                    borderRadius: 4,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  {file.ext || "FILE"}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                      {file.name}
                    </span>
                    {file.size && (
                      <span className="mono" style={{ fontSize: 8.5, color: "var(--text-subtle)" }}>
                        ({file.size})
                      </span>
                    )}
                  </div>
                  {file.desc && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        lineHeight: 1.4,
                        margin: "2px 0 0",
                      }}
                    >
                      {file.desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Direct Download Action */}
              <a
                href={file.url}
                download={file.filename}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(file.filename)
                }}
                className="icon-btn !w-7 !h-7 rounded-md flex-shrink-0"
                style={{
                  color: isDone ? "#22c55e" : "var(--text-secondary)",
                  borderColor: isDone ? "rgba(34, 197, 94, 0.4)" : undefined,
                  background: isDone ? "rgba(34, 197, 94, 0.1)" : undefined,
                  textDecoration: "none",
                }}
                title={`Download ${file.filename}`}
                aria-label={`Download ${file.filename}`}
              >
                {isDone ? <Check size={12} strokeWidth={2.5} /> : <Download size={12} strokeWidth={2.2} />}
              </a>
            </div>
          )
        })}
      </div>

      {/* System Technical Stats Strip */}
      {Object.keys(stats).length > 0 && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            background: "rgba(0, 0, 0, 0.03)",
            border: "1px dashed var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Terminal size={10} style={{ color: "var(--text-subtle)" }} />
            <span className="mono" style={{ fontSize: 8.5, color: "var(--text-subtle)", letterSpacing: "0.08em" }}>
              SYSTEM METRICS
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {Object.entries(stats).map(([k, v]) => (
              <span
                key={k}
                className="mono"
                style={{
                  fontSize: 8.5,
                  color: "var(--text-secondary)",
                  background: "var(--tag-bg)",
                  border: "1px solid var(--tag-border)",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                <span style={{ color: "var(--text-subtle)", textTransform: "capitalize" }}>{k}: </span>
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
