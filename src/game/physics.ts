export type KartState = { x: number; z: number; heading: number; speed: number }
export type Controls = { forward: boolean; back: boolean; left: boolean; right: boolean }

export const stepKart = (state: KartState, input: Controls, dt: number): KartState => {
  const acceleration = input.forward ? 24 : input.back ? -18 : 0
  const drag = input.forward || input.back ? 1.2 : 3
  const speed = Math.max(-9, Math.min(32, state.speed + acceleration * dt - Math.sign(state.speed) * Math.min(Math.abs(state.speed), drag * dt)))
  const turn = (Number(input.left) - Number(input.right)) * Math.min(1, Math.abs(speed) / 8) * Math.sign(speed || 1)
  const heading = state.heading + turn * 2.15 * dt
  return {
    x: state.x + Math.sin(heading) * speed * dt,
    z: state.z + Math.cos(heading) * speed * dt,
    heading,
    speed,
  }
}
