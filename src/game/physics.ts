export type KartState = { x: number; z: number; heading: number; speed: number; y?: number; verticalSpeed?: number; drift?: number }
export type Controls = { forward: boolean; back: boolean; left: boolean; right: boolean; drift: boolean }

export const stepKart = (state: KartState, input: Controls, dt: number): KartState => {
  let speed = state.speed
  if (input.forward) speed += (speed < 0 ? 38 : 24) * dt
  else if (input.back) speed -= (speed > 0 ? 42 : 18) * dt
  else speed -= Math.sign(speed) * Math.min(Math.abs(speed), 3.2 * dt)
  speed = Math.max(-14, Math.min(32, speed))

  const steering = Number(input.left) - Number(input.right)
  const drifting = input.drift && speed > 9 && steering !== 0
  const driftTarget = drifting ? -steering * .5 : 0
  const drift = (state.drift ?? 0) + (driftTarget - (state.drift ?? 0)) * Math.min(1, dt * (drifting ? 5 : 7))
  const turn = steering * Math.min(1, Math.abs(speed) / 7) * Math.sign(speed || 1)
  const heading = state.heading + turn * (drifting ? 2.8 : 2.15) * dt
  const travelHeading = heading + drift
  return {
    ...state,
    x: state.x + Math.sin(travelHeading) * speed * dt,
    z: state.z + Math.cos(travelHeading) * speed * dt,
    heading,
    speed,
    drift,
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
