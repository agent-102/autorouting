import { expect, test, describe } from "bun:test"
import { removeWildTraceJumps } from "../v2/lib/removeWildTraceJumps"

describe("removeWildTraceJumps (Issue #92)", () => {
  test("removes 180-degree collinear backtrack jump on the same layer", () => {
    const rawTrace = [
      { x: 0, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 }, // wild backward jump along X
      { x: 8, y: 0, z: 0 },
    ]
    const cleaned = removeWildTraceJumps(rawTrace)
    expect(cleaned).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 8, y: 0, z: 0 },
    ])
  })

  test("removes narrow orthogonal U-turn spike when direct segment is unobstructed", () => {
    const rawTrace = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 6, z: 0 }, // wild upward jump
      { x: 2.5, y: 6, z: 0 },
      { x: 2.5, y: 0, z: 0 }, // immediate return to y=0 baseline
      { x: 6, y: 0, z: 0 },
    ]
    const cleaned = removeWildTraceJumps(rawTrace, () => false)
    expect(cleaned.length).toBeLessThan(rawTrace.length)
    expect(cleaned.some((p) => p.y === 6)).toBe(false)
  })

  test("preserves jump if an obstacle blocks the shortcut or if layer z changes", () => {
    const multilayerTrace = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 1 },
      { x: 2, y: 5, z: 1 },
      { x: 2, y: 0, z: 0 },
    ]
    const cleaned = removeWildTraceJumps(multilayerTrace, () => true)
    expect(cleaned).toEqual(multilayerTrace)
  })
})
