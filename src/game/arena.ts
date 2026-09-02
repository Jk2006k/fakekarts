import * as THREE from 'three'
import type { KartState } from './physics'

const toon = (color: THREE.ColorRepresentation) => new THREE.MeshToonMaterial({ color })
const floorMesh = (geometry: THREE.BufferGeometry, color: THREE.ColorRepresentation, y = 0) => {
  const item = new THREE.Mesh(geometry, toon(color))
  item.position.y = y
  item.rotation.x = -Math.PI / 2
  item.receiveShadow = true
  return item
}

const groundPrint = (text: string, width: number, z: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const context = canvas.getContext('2d')!
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '900 150px Arial Black, sans-serif'
  context.lineWidth = 22
  context.strokeStyle = '#55477f'
  context.strokeText(text, 512, 128)
  context.fillStyle = '#fff2bd'
  context.fillText(text, 512, 128)
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / 4),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  )
  label.rotation.x = -Math.PI / 2
  label.position.set(0, .09, z)
  return label
}

export function createArena(scene: THREE.Scene) {
  scene.background = new THREE.Color('#8bd8ff')
  scene.fog = new THREE.Fog('#8bd8ff', 105, 210)
  scene.add(
    floorMesh(new THREE.CircleGeometry(82, 96), '#c8b8e8'),
    floorMesh(new THREE.CircleGeometry(76, 96), '#a99bd3', .025),
  )

  for (const radius of [13, 35, 58]) scene.add(floorMesh(new THREE.RingGeometry(radius - .18, radius + .18, 96), '#dcd3f3', .05))
  scene.add(floorMesh(new THREE.CircleGeometry(3.8, 24), '#ffd447', .06))
  scene.add(groundPrint('FAKE KARTS', 34, -48), groundPrint('SMASH  SLIDE  SEND IT', 38, 49))

  const wall = new THREE.Mesh(new THREE.TorusGeometry(79, 2.4, 8, 96), toon('#4b3f72'))
  wall.position.y = 1.3
  wall.rotation.x = Math.PI / 2
  wall.castShadow = wall.receiveShadow = true
  const rail = new THREE.Mesh(new THREE.TorusGeometry(79, .42, 7, 96), toon('#ff695f'))
  rail.position.y = 3.8
  rail.rotation.x = Math.PI / 2
  scene.add(wall, rail)

  const colors = ['#ff695f', '#ffd447', '#39bde8', '#77dc75']
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2
    const banner = new THREE.Mesh(new THREE.BoxGeometry(8, 2.3, .35), toon(colors[i % colors.length]))
    banner.position.set(Math.sin(angle) * 79, 6, Math.cos(angle) * 79)
    banner.rotation.y = angle
    banner.castShadow = true
    scene.add(banner)
  }

  scene.add(new THREE.HemisphereLight('#eaf9ff', '#55496c', 2.8))
  const sun = new THREE.DirectionalLight('#fff3cb', 4.5)
  sun.position.set(-40, 62, -28)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = sun.shadow.camera.bottom = -90
  sun.shadow.camera.right = sun.shadow.camera.top = 90
  scene.add(sun)
}

export function containInArena(state: KartState) {
  const distance = Math.hypot(state.x, state.z)
  if (distance <= 75) return
  const scale = 75 / distance
  state.x *= scale
  state.z *= scale
  state.speed *= -.35
}
