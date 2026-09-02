export type KartState = { x: number; z: number; heading: number; speed: number; y?: number; verticalSpeed?: number }
export type Controls = { forward: boolean; back: boolean; left: boolean; right: boolean }

export const stepKart = (state: KartState, input: Controls, dt: number): KartState => {
  const acceleration = input.forward ? 24 : input.back ? -18 : 0
  const drag = input.forward || input.back ? 1.2 : 3
  const speed = Math.max(-9, Math.min(32, state.speed + acceleration * dt - Math.sign(state.speed) * Math.min(Math.abs(state.speed), drag * dt)))
  const turn = (Number(input.left) - Number(input.right)) * Math.min(1, Math.abs(speed) / 8) * Math.sign(speed || 1)
  const heading = state.heading + turn * 2.15 * dt
  return {
    ...state,
    x: state.x + Math.sin(heading) * speed * dt,
    z: state.z + Math.cos(heading) * speed * dt,
    heading,
    speed,
  }
}

export const stepGravity = (state: KartState, groundHeight: number, previousGroundHeight: number, dt: number) => {
  let y = state.y ?? 0
  let verticalSpeed = state.verticalSpeed ?? 0
  if (previousGroundHeight > .5 && groundHeight === 0 && y >= previousGroundHeight - .2) verticalSpeed = Math.max(verticalSpeed, Math.abs(state.speed) * .18)
  if (y > groundHeight || verticalSpeed > 0) {
    verticalSpeed -= 22 * dt
    y += verticalSpeed * dt
  }
  if (y <= groundHeight) { y = groundHeight; verticalSpeed = 0 }
  state.y = y
  state.verticalSpeed = verticalSpeed
}
