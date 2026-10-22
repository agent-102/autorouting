import type { Point } from "./types"

export interface TracePoint extends Point {
  z?: number
}

/**
 * Removes wild orthogonal trace jumps (collinear reversals and narrow U-turn
 * spikes caused when an intersection-jump ray switches direction prematurely)
 * while preserving layer transitions (vias) and obstacle clearance.
 */
export function removeWildTraceJumps<T extends TracePoint>(
  points: T[],
   isObstacleBetween?: (a: T, b: T) => boolean,
  spikeRatioThreshold = 2.5,
): T[] {
  if (points.length <= 2) return [...points]

  const result: T[] = [points[0]]

  let i = 1
  while (i < points.length - 1) {
    const prev = result[result.length - 1]
    const curr = points[i]
    const next = points[i + 1]

    const sameLayer =
      (prev.z ?? 0) === (curr.z ?? 0) && (curr.z ?? 0) === (next.z ?? 0)

    if (sameLayer) {
      // 1. Eliminate redundant collinear vertices or immediate 180-degree backtrack spikes
      const isCollinearX =
        Math.abs(prev.x - curr.x) < 1e-6 && Math.abs(curr.x - next.x) < 1e-6
      const isCollinearY =
        Math.abs(prev.y - curr.y) < 1e-6 && Math.abs(curr.y - next.y) < 1e-6

      if (isCollinearX || isCollinearY) {
        if (!isObstacleBetween || !isObstacleBetween(prev, next)) {
          i += 1
          continue
        }
      }

      // 2. Detect 4-point narrow dogleg / U-turn wild jump spikes: prev -> curr -> next -> afterNext
      if (i + 2 < points.length) {
        const afterNext = points[i + 2]
        if ((afterNext.z ?? 0) === (prev.z ?? 0)) {
          const detourDist =
            Math.hypot(curr.x - prev.x, curr.y - prev.y) +
            Math.hypot(next.x - curr.x, next.y - curr.y) +
            Math.hypot(afterNext.x - next.x, afterNext.y - next.y)
          const directDist = Math.hypot(
            afterNext.x - prev.x,
            afterNext.y - prev.y,
          )

          if (
            directDist > 1e-6 &&
            detourDist / directDist >= spikeRatioThreshold
          ) {
            const alignedOrthogonally =
              Math.abs(prev.x - afterNext.x) < 1e-6 ||
              Math.abs(prev.y - afterNext.y) < 1e-6

            if (
              alignedOrthogonally &&
              (!isObstacleBetween || !isObstacleBetween(prev, afterNext))
            ) {
              // Skip both wild jump vertices (curr and next)
              i += 2
              continue
            }
          }
        }
      }
    }

    result.push(curr)
    i += 1
  }

  result.push(points[points.length - 1])
  return result
}
