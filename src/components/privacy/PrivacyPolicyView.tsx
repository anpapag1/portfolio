import { useState } from "react"
import { Copy, Check, Printer, ExternalLink, Globe } from "lucide-react"
import { getPrivacyPolicyBySlug } from "../../data/privacyPolicies"
import type { AppPrivacyPolicy } from "../../types"

interface PrivacyPolicyViewProps {
  slug: string
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

export function PrivacyPolicyView({ slug }: PrivacyPolicyViewProps) {
  const [copied, setCopied] = useState(false)
  const policy: AppPrivacyPolicy | undefined = getPrivacyPolicyBySlug(slug)

  const availableLangs = policy?.languages ? Object.keys(policy.languages) : []
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const langParam = params.get("lang")
      if (langParam && availableLangs.includes(langParam)) {
        return langParam
      }
    }
    return availableLangs[0] || "en"
  })

  const accent = policy?.color || policy?.accentColor || "#38bdf8"

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("lang", lang)
      window.history.replaceState({}, "", url.toString())
    }
  }

  // Not Found State (404)
  if (!policy) {
    return (
      <div
        className="fixed inset-0 w-full h-full bg-[#09090b] text-zinc-200 select-text overflow-y-auto overscroll-contain font-sans policy-scroll p-6 md:p-12 z-50 antialiased"
        style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
      >
        <div className="max-w-2xl mx-auto py-16">
          <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900/40 text-center">
            <h1 className="text-xl font-semibold text-white mb-2">Privacy Policy Not Found</h1>
            <p className="text-zinc-400 text-sm">
              The requested privacy policy document could not be located.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Resolve language-specific content
  const langContent =
    (policy.languages && policy.languages[selectedLang]) ||
    (policy.languages && policy.languages[availableLangs[0]]) ||
    null

  const displayTitle = langContent?.title || `${policy.appName} Privacy Policy`
  const displayTagline = langContent?.tagline || policy.tagline
  const displaySummary = langContent?.summary || policy.summary
  const displaySections = langContent?.sections || policy.sections || []

  return (
    <div
      className="fixed inset-0 w-full h-full bg-[#09090b] text-zinc-200 select-text overflow-y-auto overscroll-contain font-sans policy-scroll z-50 antialiased print:static print:inset-auto print:w-full print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:text-zinc-900 print:p-0"
      style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
    >
      {/* Clean, minimalist top bar */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur border-b border-zinc-800 px-4 md:px-8 py-3 flex items-center justify-between print:hidden">
        {/* Top-left breadcrumb: policy / name */}
        <div className="flex items-center gap-1.5 text-xs mono select-none">
          <span className="text-zinc-500">policy</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-200 font-medium">{policy.slug}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          {availableLangs.length > 1 && (
            <div className="flex items-center rounded border border-zinc-800 bg-zinc-900/60 p-0.5 text-xs">
              <span className="pl-1.5 pr-1 text-zinc-500 flex items-center">
                <Globe size={12} />
              </span>
              {availableLangs.map((langKey) => (
                <button
                  key={langKey}
                  onClick={() => handleLangChange(langKey)}
                  className={`px-2 py-0.5 rounded uppercase text-[11px] font-medium transition-colors ${
                    selectedLang === langKey
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  style={selectedLang === langKey ? { color: accent } : undefined}
                >
                  {langKey}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <>
                <Check size={13} style={{ color: accent }} />
                <span style={{ color: accent }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
            title="Print or Save as PDF"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-14 print:max-w-none print:w-full print:px-0 print:py-0">
        {/* Document Title Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white print:text-black">
              {displayTitle}
            </h1>
            {policy.category && (
              <span
                className="text-[11px] px-2 py-0.5 rounded border font-medium"
                style={{
                  color: accent,
                  backgroundColor: hexToRgba(accent, 0.08),
                  borderColor: hexToRgba(accent, 0.25),
                }}
              >
                {policy.category}
              </span>
            )}
          </div>

          {displayTagline && (
            <p className="text-sm sm:text-base text-zinc-400 mb-3">{displayTagline}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
            <span>Last updated: {policy.lastUpdated}</span>
            {policy.url && (
              <>
                <span>&bull;</span>
                <a
                  href={policy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-zinc-300 hover:text-white underline underline-offset-2 transition-colors break-all"
                >
                  <span>{policy.url}</span>
                  <ExternalLink size={11} className="text-zinc-400 shrink-0" />
                </a>
              </>
            )}
            {policy.publisher && (
              <>
                <span>&bull;</span>
                <span>Publisher: {policy.publisher}</span>
              </>
            )}
          </div>
        </div>

        {/* Summary Block */}
        {displaySummary && (
          <div
            className="p-4 rounded-r-md border border-zinc-800 border-l-4 text-zinc-300 text-sm leading-relaxed mb-8 print:border-zinc-300 print:bg-zinc-50 print:text-zinc-800 print:mb-6"
            style={{
              borderLeftColor: accent,
              backgroundColor: hexToRgba(accent, 0.04),
            }}
          >
            <p className="font-semibold text-zinc-200 mb-1 print:text-black" style={{ color: accent }}>
              Overview
            </p>
            <p>{displaySummary}</p>
          </div>
        )}

        {/* Policy Sections */}
        <div className="space-y-8 print:space-y-6">
          {displaySections.map((section, idx) => (
            <section key={idx} className="space-y-3 print:space-y-2">
              <h2 className="text-lg font-semibold text-white tracking-tight border-b border-zinc-800/80 pb-1.5 print:text-black print:border-zinc-300">
                {section.title}
              </h2>

              {section.content && (
                <div className="text-zinc-300 text-sm sm:text-base leading-relaxed space-y-2 print:text-zinc-800">
                  {Array.isArray(section.content) ? (
                    section.content.map((c, ci) => (
                      <p key={ci}>{c}</p>
                    ))
                  ) : (
                    <p>{section.content}</p>
                  )}
                </div>
              )}

              {section.list && section.list.length > 0 && (
                <ul className="space-y-2 text-zinc-300 text-sm sm:text-base leading-relaxed pl-1 print:text-zinc-800">
                  {section.list.map((item, li) => (
                    <li key={li} className="flex items-start gap-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 print:bg-zinc-600"
                        style={{ backgroundColor: accent }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Contact & Legal Footer */}
        <footer className="mt-14 pt-6 border-t border-zinc-800 text-xs text-zinc-400 space-y-2 print:mt-8 print:pt-4 print:border-zinc-300 print:text-zinc-600">
          <p>
            For questions or requests regarding this Privacy Policy, contact:{" "}
            <a
              href={`mailto:${policy.contactEmail}`}
              className="underline underline-offset-2 hover:opacity-80 print:text-black"
              style={{ color: accent }}
            >
              {policy.contactEmail}
            </a>
          </p>
          <p className="text-zinc-500 print:text-zinc-500">
            &copy; {new Date().getFullYear()} {policy.publisher || policy.appName}. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  )
}
