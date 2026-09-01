export * from "./physics/types"

export interface NodeData {
  id: string
  label: string
  color: string
  width: number
  height: number
  type?: "skills" | "websites" | "projects" | "work" | "contact" | "profile" | "secret" | string
  secret?: boolean
  content: any
}

export interface PolicySection {
  title: string
  content?: string | string[]
  list?: string[]
}

export interface PolicyLanguageContent {
  title?: string
  tagline?: string
  summary?: string
  sections: PolicySection[]
}

export interface AppPrivacyPolicy {
  slug: string
  appName: string
  tagline?: string
  lastUpdated: string
  contactEmail: string
  url?: string
  publisher?: string
  website?: string
  category?: string
  color?: string
  accentColor?: string
  summary?: string
  sections?: PolicySection[]
  languages?: Record<string, PolicyLanguageContent>
}



