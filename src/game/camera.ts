import * as THREE from 'three'
import type { KartState } from './physics'

export class ChaseCamera {
  private lookAt = new THREE.Vector3()

  constructor(private camera: THREE.PerspectiveCamera) {}

  snap(state: KartState) {
    this.camera.position.set(state.x - Math.sin(state.heading) * 13, 8, state.z - Math.cos(state.heading) * 13)
    this.lookAt.set(state.x, 1.4, state.z)
    this.camera.lookAt(this.lookAt)
  }

  update(state: KartState, dt: number) {
    const speed = Math.abs(state.speed)
    const distance = 12 + speed * .06
    const desired = new THREE.Vector3(
      state.x - Math.sin(state.heading) * distance,
      (state.y ?? 0) + 6.5 + speed * .025,
      state.z - Math.cos(state.heading) * distance,
    )
    const focus = new THREE.Vector3(
      state.x + Math.sin(state.heading) * (3 + speed * .1),
      (state.y ?? 0) + 1.3,
      state.z + Math.cos(state.heading) * (3 + speed * .1),
    )
    this.camera.position.lerp(desired, 1 - Math.exp(-6 * dt))
    this.lookAt.lerp(focus, 1 - Math.exp(-9 * dt))
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 58 + Math.min(speed, 30) * .18, 1 - Math.exp(-3 * dt))
    this.camera.updateProjectionMatrix()
    this.camera.lookAt(this.lookAt)
  }
}
