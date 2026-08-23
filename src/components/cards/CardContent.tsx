import type { NodeData } from "../../types"
import { ProfileCard } from "./ProfileCard"
import { SkillsCard } from "./SkillsCard"
import { WebsitesCard } from "./WebsitesCard"
import { ProjectsCard } from "./ProjectsCard"
import { WorkCard } from "./WorkCard"
import { EducationCard } from "./EducationCard"
import { AwardsCard } from "./AwardsCard"
import { ContactCard } from "./ContactCard"
import { GenericCard } from "./GenericCard"

export function NodeCardContent({ node }: { node: NodeData }) {
  const kind = (node.type || node.id || "").toLowerCase()
  const c = node.content || {}

  if (kind === "profile" || kind.startsWith("profile") || c.name) {
    return <ProfileCard node={node} />
  }

  if (
    kind.includes("competit") ||
    kind.includes("award") ||
    Array.isArray(c.categories)
  ) {
    return <AwardsCard node={node} />
  }

  if (
    kind.includes("educat") ||
    Array.isArray(c.education)
  ) {
    return <EducationCard node={node} />
  }

  if (
    kind === "skills" ||
    kind.startsWith("skills") ||
    Array.isArray(c.groups)
  ) {
    return <SkillsCard node={node} />
  }

  if (
    kind === "websites" ||
    kind.startsWith("website") ||
    Array.isArray(c.links)
  ) {
    return <WebsitesCard node={node} />
  }

  if (
    kind === "projects" ||
    kind.startsWith("project") ||
    Array.isArray(c.items)
  ) {
    return <ProjectsCard node={node} />
  }

  if (
    kind === "work" ||
    kind.startsWith("work") ||
    Array.isArray(c.positions)
  ) {
    return <WorkCard node={node} />
  }

  if (
    kind === "contact" ||
    kind.startsWith("contact") ||
    Array.isArray(c.channels)
  ) {
    return <ContactCard node={node} />
  }

  return <GenericCard node={node} />
}
