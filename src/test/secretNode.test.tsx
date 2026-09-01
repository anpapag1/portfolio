import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import contentData from "../content/content.json"
import { SecretCard } from "../components/cards/SecretCard"
import { NodeCardContent } from "../components/cards/CardContent"
import type { NodeData } from "../types"
import { PORTFOLIO_NODES } from "../data/portfolio"

describe("Secret Node & Developer Vault", () => {
  it("defines a secret node in content.json with valid files", () => {
    const secretNode = contentData.nodes.find((n: any) => n.id === "secret" || n.secret)
    expect(secretNode).toBeDefined()
    expect(secretNode?.secret).toBe(true)
    expect(secretNode?.color).toBe("#ec4899")

    const files = secretNode?.content?.files as any[] | undefined
    expect(files).toBeDefined()
    expect(Array.isArray(files)).toBe(true)
    expect(files!.length).toBeGreaterThanOrEqual(3)

    const filenames = files!.map((f) => f.filename)
    expect(filenames).toContain("design.md")
    expect(filenames).toContain("architecture.json")
    expect(filenames).toContain("easter_egg.txt")
  })

  it("ensures all secret nodes are filtered out on initial load", () => {
    const isSecretUnlocked = false
    const activeNodes = PORTFOLIO_NODES.filter(
      (n) => n.id !== "profile" && (!n.secret || isSecretUnlocked),
    )

    // No secret node should be present
    expect(activeNodes.some((n) => n.secret === true)).toBe(false)
    expect(activeNodes.some((n) => n.id === "secret")).toBe(false)

    // When unlocked, the secret node is included
    const unlockedNodes = PORTFOLIO_NODES.filter(
      (n) => n.id !== "profile" && (!n.secret || true),
    )
    expect(unlockedNodes.some((n) => n.secret === true)).toBe(true)
  })

  it("renders SecretCard with downloadable file links and download attributes", () => {
    const mockNode: NodeData = {
      id: "secret",
      label: "DEV VAULT",
      color: "#ec4899",
      width: 360,
      height: 430,
      secret: true,
      content: {
        title: "Developer Vault",
        subtitle: "System Blueprints & Design Docs",
        badge: "CLASSIFIED",
        desc: "Hidden developer vault containing portfolio architecture specs.",
        files: [
          {
            name: "design.md",
            filename: "design.md",
            url: "/content/design.md",
            size: "3.8 KB",
            ext: "MD",
            desc: "Complete architecture breakdown.",
          },
          {
            name: "architecture.json",
            filename: "architecture.json",
            url: "/content/architecture.json",
            size: "1.9 KB",
            ext: "JSON",
            desc: "Topology parameters.",
          },
        ],
        stats: {
          engine: "Verlet Physics",
          fps: "60 FPS Canvas",
        },
      },
    }

    render(<SecretCard node={mockNode} />)

    expect(screen.getByText("DEV VAULT")).toBeDefined()
    expect(screen.getByText("CLASSIFIED")).toBeDefined()
    expect(screen.getByText("Developer Vault")).toBeDefined()
    expect(screen.getByText("design.md")).toBeDefined()
    expect(screen.getByText("architecture.json")).toBeDefined()

    const downloadLinks = screen.getAllByRole("link")
    expect(downloadLinks.length).toBe(2)
    expect(downloadLinks[0].getAttribute("href")).toBe("/content/design.md")
    expect(downloadLinks[0].getAttribute("download")).toBe("design.md")
    expect(downloadLinks[1].getAttribute("href")).toBe("/content/architecture.json")
    expect(downloadLinks[1].getAttribute("download")).toBe("architecture.json")
  })

  it("routes secret node to SecretCard in NodeCardContent", () => {
    const mockNode: NodeData = {
      id: "secret",
      label: "DEV VAULT",
      color: "#ec4899",
      width: 360,
      height: 430,
      secret: true,
      content: {
        title: "Developer Vault",
        badge: "RESTRICTED",
        files: [
          {
            name: "design.md",
            filename: "design.md",
            url: "/content/design.md",
          },
        ],
      },
    }

    render(<NodeCardContent node={mockNode} />)
    expect(screen.getByText("DEV VAULT")).toBeDefined()
    expect(screen.getByText("design.md")).toBeDefined()
  })
})
