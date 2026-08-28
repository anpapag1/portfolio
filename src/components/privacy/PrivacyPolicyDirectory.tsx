import React, { useState } from "react"
import { Search, ChevronRight, FileText } from "lucide-react"
import { PRIVACY_POLICIES } from "../../data/privacyPolicies"

interface PrivacyPolicyDirectoryProps {
  onNavigate?: (path: string) => void
}

function hexToRgba(hex: string = "#38bdf8", alpha: number = 1): string {
  const clean = hex.replace("#", "").trim()
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(56, 189, 248, ${alpha})`
}

export function PrivacyPolicyDirectory({ onNavigate }: PrivacyPolicyDirectoryProps) {
  const [search, setSearch] = useState("")

  const handleSelectPolicy = (slug: string, e: React.MouseEvent) => {
    e.preventDefault()
    const path = `/privacy-policy/${slug}`
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.history.pushState({}, "", path)
      window.dispatchEvent(new PopStateEvent("popstate"))
    }
  }

  const filtered = PRIVACY_POLICIES.filter((p) => {
    const query = search.toLowerCase()
    const summary = p.summary || p.languages?.en?.summary || ""
    const tagline = p.tagline || p.languages?.en?.tagline || ""
    return (
      p.appName.toLowerCase().includes(query) ||
      p.slug.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      summary.toLowerCase().includes(query) ||
      tagline.toLowerCase().includes(query)
    )
  })

  return (
    <div
      className="fixed inset-0 w-full h-full bg-[#09090b] text-zinc-200 select-text overflow-y-auto overscroll-contain font-sans policy-scroll p-4 md:p-12 z-50 antialiased"
      style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
    >
      <div className="max-w-3xl mx-auto py-8 md:py-14">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Privacy Policies
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            Official privacy policies, disclosures, and data governance practices across applications and services.
          </p>

          {/* Search bar */}
          <div className="mt-5 relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </div>

        {/* Policies List */}
        <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg bg-zinc-900/30 overflow-hidden shadow-sm">
          {filtered.length > 0 ? (
            filtered.map((policy) => {
              const pColor = policy.color || policy.accentColor || "#38bdf8"
              return (
                <a
                  key={policy.slug}
                  href={`/privacy-policy/${policy.slug}`}
                  onClick={(e) => handleSelectPolicy(policy.slug, e)}
                  className="flex items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded bg-zinc-800/60 text-zinc-400 group-hover:text-zinc-200 mt-0.5 sm:mt-0 transition-colors shrink-0 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: pColor }}
                        />
                        <h2 className="font-semibold text-white group-hover:text-zinc-100 text-base">
                          {policy.appName}
                        </h2>
                        {policy.category && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded border font-medium"
                            style={{
                              color: pColor,
                              backgroundColor: hexToRgba(pColor, 0.08),
                              borderColor: hexToRgba(pColor, 0.25),
                            }}
                          >
                            {policy.category}
                          </span>
                        )}
                      </div>
                      {(policy.tagline || policy.languages?.en?.tagline) && (
                        <p className="text-xs text-zinc-400 mb-1">
                          {policy.tagline || policy.languages?.en?.tagline}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                        <span>Updated: {policy.lastUpdated}</span>
                        {policy.url && (
                          <>
                            <span>&bull;</span>
                            <span className="truncate max-w-[200px] sm:max-w-xs">{policy.url.replace(/^https?:\/\//, "")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 text-xs transition-colors shrink-0 pt-1 sm:pt-0"
                    style={{ color: pColor }}
                  >
                    <span className="hidden sm:inline">View Policy</span>
                    <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              )
            })
          ) : (
            <div className="p-8 text-center text-sm text-zinc-500">
              No privacy policies found matching "{search}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </div>
    </div>
  )
}
