import privacyData from "../content/privacy.json"
import type { AppPrivacyPolicy } from "../types"

export const PRIVACY_POLICIES: AppPrivacyPolicy[] = privacyData.policies as unknown as AppPrivacyPolicy[]

export function getPrivacyPolicyBySlug(slug: string): AppPrivacyPolicy | undefined {
  const normalized = slug.trim().toLowerCase()
  return PRIVACY_POLICIES.find((p) => p.slug.toLowerCase() === normalized)
}

