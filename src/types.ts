export * from "./physics/types"

export interface NodeData {
  id: string
  label: string
  color: string
  width: number
  height: number
  type?: "skills" | "websites" | "projects" | "work" | "contact" | "profile" | string
  content: any
}
