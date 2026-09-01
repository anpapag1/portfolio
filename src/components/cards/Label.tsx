import type { NodeData } from "../../types"

export function CardLabel({ node }: { node: NodeData }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className="mono text-[9px] tracking-[0.16em] text-[var(--text-subtle)] font-medium">
        {node.label}
      </span>
      <span
        className="w-1 h-1 rounded-full opacity-70 flex-shrink-0"
        style={{ background: node.color }}
      />
    </div>
  )
}
