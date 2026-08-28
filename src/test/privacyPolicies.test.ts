import { describe, it, expect } from "vitest"
import { PRIVACY_POLICIES, getPrivacyPolicyBySlug } from "../data/privacyPolicies"

describe("Privacy Policies Data & Lookups", () => {
  it("should have valid entries in PRIVACY_POLICIES list", () => {
    expect(PRIVACY_POLICIES.length).toBeGreaterThan(0)
    for (const policy of PRIVACY_POLICIES) {
      expect(policy.slug).toBeTruthy()
      expect(policy.appName).toBeTruthy()
      expect(policy.lastUpdated).toBeTruthy()
      expect(policy.contactEmail).toBeTruthy()
      expect(policy.url).toBeTruthy()
      expect(policy.color).toMatch(/^#[0-9a-fA-F]{3,8}$/)

      if (policy.languages) {
        for (const [langKey, langContent] of Object.entries(policy.languages)) {
          expect(langKey).toBeTruthy()
          expect(langContent.title).toBeTruthy()
          expect(langContent.sections.length).toBeGreaterThan(0)
          for (const section of langContent.sections) {
            expect(section.title).toBeTruthy()
          }
        }
      } else if (policy.sections) {
        expect(policy.sections.length).toBeGreaterThan(0)
        for (const section of policy.sections) {
          expect(section.title).toBeTruthy()
        }
      }
    }
  })

  it("should find policy by exact slug", () => {
    const policy = getPrivacyPolicyBySlug("fairs")
    expect(policy).toBeDefined()
    expect(policy?.appName).toBe("Fairs")
  })

  it("should find policy case-insensitively and trimmed", () => {
    const policyUpper = getPrivacyPolicyBySlug("  FAIRS  ")
    expect(policyUpper).toBeDefined()
    expect(policyUpper?.slug).toBe("fairs")

    const kommpad = getPrivacyPolicyBySlug("KommPad")
    expect(kommpad).toBeDefined()
    expect(kommpad?.appName).toBe("KommPad")
  })

  it("should return undefined for unknown app slug", () => {
    const unknown = getPrivacyPolicyBySlug("non-existent-app-xyz")
    expect(unknown).toBeUndefined()
  })

  it("should extract slug correctly from /privacy-policy/:slug", () => {
    const parseSlug = (path: string) => path.replace(/\/+$/, "").replace(/^\/privacy-policy\//, "")

    expect(parseSlug("/privacy-policy/relay")).toBe("relay")
    expect(parseSlug("/privacy-policy/fairs")).toBe("fairs")
    expect(parseSlug("/privacy-policy/kommpad")).toBe("kommpad")

    expect(getPrivacyPolicyBySlug(parseSlug("/privacy-policy/relay"))?.appName).toBe("Relay")
  })
})

