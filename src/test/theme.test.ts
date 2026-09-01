import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useTheme } from "../hooks/useTheme"

describe("useTheme Hook with Device Mode", () => {
  let listeners: ((e: { matches: boolean }) => void)[] = []
  let matchesDark = true

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ""
    listeners = []
    matchesDark = true

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("dark") ? matchesDark : !matchesDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, callback: (e: { matches: boolean }) => void) => {
        listeners.push(callback)
      }),
      removeEventListener: vi.fn((_event: string, callback: (e: { matches: boolean }) => void) => {
        listeners = listeners.filter((l) => l !== callback)
      }),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.className = ""
    vi.restoreAllMocks()
  })

  it("initializes with 'system' (device mode) by default", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe("system")
    expect(result.current.resolvedTheme).toBe("dark")
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("initializes with stored preference from localStorage", () => {
    localStorage.setItem("portfolio-theme", "light")
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe("light")
    expect(result.current.resolvedTheme).toBe("light")
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("cycles correctly: system -> light -> dark -> system", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe("system")

    // 1st click: system -> light
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe("light")
    expect(result.current.resolvedTheme).toBe("light")
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(localStorage.getItem("portfolio-theme")).toBe("light")

    // 2nd click: light -> dark
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe("dark")
    expect(result.current.resolvedTheme).toBe("dark")
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("portfolio-theme")).toBe("dark")

    // 3rd click: dark -> system
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe("system")
    expect(result.current.resolvedTheme).toBe("dark")
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("portfolio-theme")).toBe("system")
  })

  it("sets specific themes via setTheme", () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme("light")
    })
    expect(result.current.theme).toBe("light")
    expect(result.current.isDark).toBe(false)

    act(() => {
      result.current.setTheme("dark")
    })
    expect(result.current.theme).toBe("dark")
    expect(result.current.isDark).toBe(true)

    act(() => {
      result.current.setTheme("system")
    })
    expect(result.current.theme).toBe("system")
  })

  it("dynamically updates resolvedTheme in system mode when OS theme changes", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe("system")
    expect(result.current.resolvedTheme).toBe("dark")

    // Simulate OS switching to light
    act(() => {
      listeners.forEach((l) => l({ matches: false }))
    })

    expect(result.current.theme).toBe("system")
    expect(result.current.resolvedTheme).toBe("light")
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains("light")).toBe(true)
  })
})
