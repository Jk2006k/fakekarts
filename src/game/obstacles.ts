import * as THREE from 'three'
import type { KartState } from './physics'

export type Obstacle = { object: THREE.Object3D; x: number; z: number; radius: number; breakable: boolean; broken: boolean }

const toon = (color: THREE.ColorRepresentation) => new THREE.MeshToonMaterial({ color })
const ramps = [{ x: -24, z: 0, direction: 1 }, { x: 24, z: 0, direction: -1 }]

function addCube(scene: THREE.Scene, x: number, z: number, color: THREE.ColorRepresentation): Obstacle {
  const cube = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), toon(color))
  cube.position.set(x, 2.5, z)
  cube.rotation.y = .18
  cube.castShadow = cube.receiveShadow = true
  scene.add(cube)
  return { object: cube, x, z, radius: 3.8, breakable: false, broken: false }
}

function addCrate(scene: THREE.Scene, x: number, z: number): Obstacle {
  const crate = new THREE.Group()
  const wood = toon('#a96232')
  const slat = toon('#d48a4c')
  const box = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 3.6), wood)
  box.castShadow = box.receiveShadow = true
  crate.add(box)
  for (const y of [-1.35, 0, 1.35]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.85, .28, 3.85), slat)
    band.position.y = y
    band.castShadow = true
    crate.add(band)
  }
  crate.position.set(x, 1.8, z)
  crate.rotation.y = .25
  scene.add(crate)
  return { object: crate, x, z, radius: 2.7, breakable: true, broken: false }
}

function addSkatePark(scene: THREE.Scene) {
  const concrete = toon('#65c8d5')
  const metal = toon('#e7f4f5')
  const angle = Math.atan(4 / 14)
  for (const ramp of ramps) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(9, .5, 14), concrete)
    deck.position.set(ramp.x, 2.2, ramp.z)
    deck.rotation.x = -ramp.direction * angle
    deck.castShadow = deck.receiveShadow = true
    scene.add(deck)
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 12, 8), metal)
  rail.position.set(0, 1.15, -24)
  rail.rotation.x = Math.PI / 2
  rail.castShadow = true
  scene.add(rail)
  for (const z of [-29, -19]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.1, 8), metal)
    post.position.set(0, .55, z)
    scene.add(post)
  }
}

export function createObstacles(scene: THREE.Scene) {
  const obstacles = [
    addCube(scene, -10, -31, '#ff6d62'),
    addCube(scene, 16, 27, '#ffd447'),
    addCube(scene, 38, -14, '#6f7de8'),
    addCrate(scene, -4, 34),
    addCrate(scene, 5, 36),
    addCrate(scene, -38, 20),
    addCrate(scene, -33, 25),
  ]
  addSkatePark(scene)
  return obstacles
}

export function resolveObstacleCollisions(state: KartState, obstacles: Obstacle[]) {
  for (const obstacle of obstacles) {
    if (obstacle.broken) continue
    const dx = state.x - obstacle.x
    const dz = state.z - obstacle.z
    const distance = Math.hypot(dx, dz)
    if (distance >= obstacle.radius) continue
    if (obstacle.breakable && Math.abs(state.speed) > 7) {
      // ponytail: crate destruction is client-local, broadcast obstacle events when matches need authoritative shared state.
      obstacle.broken = true
      obstacle.object.visible = false
      state.speed *= .82
      continue
    }
    const nx = distance ? dx / distance : Math.sin(state.heading)
    const nz = distance ? dz / distance : Math.cos(state.heading)
    state.x = obstacle.x + nx * obstacle.radius
    state.z = obstacle.z + nz * obstacle.radius
    state.speed *= -.35
  }
}

export function rampHeightAt(x: number, z: number) {
  for (const ramp of ramps) {
    const localZ = (z - ramp.z) * ramp.direction
    if (Math.abs(x - ramp.x) <= 4.5 && localZ >= -7 && localZ <= 7) return .25 + (localZ + 7) / 14 * 4
  }
  return 0
}
