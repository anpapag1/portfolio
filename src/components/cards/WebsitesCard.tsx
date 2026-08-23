import { useState, useEffect } from "react"
import type { NodeData } from "../../types"
import { CardLabel } from "./Label"

export interface WebsiteLink {
  label: string
  url: string
  sub: string
  icon?: string
}

function getAutoFavicon(url: string): string {
  const domain = url.replace(/^https?:\/\//, "").split("/")[0]
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function resolveIconCandidate(icon: string): string {
  const clean = icon.trim()
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean
  }
  let path = clean.replace(/^\.?\/+/, "")
  if (path.toLowerCase().startsWith("public/")) {
    path = path.slice(7)
  }
  return `/${path}`
}

function SiteIcon({ url, icon }: { url: string; icon?: string }) {
  const clean = (icon || "").trim()
  const lower = clean.toLowerCase()
  const autoFallback = getAutoFavicon(url)
  const isAuto = !clean || lower === "auto" || lower === "none"

  const primarySrc = isAuto ? autoFallback : resolveIconCandidate(clean)
  const secondarySrc =
    !isAuto && !clean.startsWith("http") && !clean.includes("/")
      ? `/content/${clean.replace(/^\.?\/+/, "")}`
      : null

  const [src, setSrc] = useState(primarySrc)
  const [triedSecondary, setTriedSecondary] = useState(false)

  useEffect(() => {
    const isA = !clean || lower === "auto" || lower === "none"
    setSrc(isA ? autoFallback : resolveIconCandidate(clean))
    setTriedSecondary(false)
  }, [url, icon, clean, lower, autoFallback])

  return (
    <img
      src={src}
      width={20}
      height={20}
      alt=""
      style={{ borderRadius: 5, display: "block", objectFit: "contain" }}
      onError={() => {
        if (secondarySrc && !triedSecondary && src !== secondarySrc) {
          setTriedSecondary(true)
          setSrc(secondarySrc)
        } else if (src !== autoFallback) {
          setSrc(autoFallback)
        }
      }}
    />
  )
}

export function WebsitesCard({ node }: { node: NodeData }) {
  const c = node.content
  const links: WebsiteLink[] = c.links || []

  return (
    <div style={{ padding: "20px 20px 12px" }}>
      <CardLabel node={node} />
      {links.map((link: WebsiteLink) => (
        <a
          key={link.label}
          href={
            link.url.startsWith("http://") || link.url.startsWith("https://")
              ? link.url
              : `https://${link.url}`
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 0",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer",
            textDecoration: "none",
            transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.55")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <span
            style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
            }}
          >
            <SiteIcon url={link.url} icon={link.icon} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: "#c8c8c8", fontWeight: 500 }}>
              {link.label}
            </div>
            <div
              className="mono"
              style={{ fontSize: 9, color: "#484848", marginTop: 2 }}
            >
              {link.sub}
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#383838", flexShrink: 0 }}>
            ↗
          </span>
        </a>
      ))}
    </div>
  )
}
