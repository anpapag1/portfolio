import type { NodeData } from "../../types"
import { SkillsCard } from "./SkillsCard"
import { WebsitesCard } from "./WebsitesCard"
import { ProjectsCard } from "./ProjectsCard"
import { WorkCard } from "./WorkCard"
import { ContactCard } from "./ContactCard"
import { GenericCard } from "./GenericCard"

export function NodeCardContent({ node }: { node: NodeData }) {
  const kind = node.type || node.id
  const c = node.content || {}

  if (kind === "skills" || kind.startsWith("skills") || Array.isArray(c.groups)) {
    return <SkillsCard node={node} />
  }

  if (kind === "websites" || kind.startsWith("website") || Array.isArray(c.links)) {
    return <WebsitesCard node={node} />
  }

  if (kind === "projects" || kind.startsWith("project") || Array.isArray(c.items)) {
    return <ProjectsCard node={node} />
  }

  if (kind === "work" || kind.startsWith("work") || Array.isArray(c.positions)) {
    return <WorkCard node={node} />
  }

  if (kind === "contact" || kind.startsWith("contact") || Array.isArray(c.channels)) {
    return <ContactCard node={node} />
  }

  return <GenericCard node={node} />
}
