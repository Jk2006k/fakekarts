export const smoothingFactor = (dt: number) => 1 - Math.pow(.0001, dt)

export const shortestTurn = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
