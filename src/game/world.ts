import * as THREE from 'three'

const toon = (color: THREE.ColorRepresentation) => new THREE.MeshToonMaterial({ color })
const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
  const item = new THREE.Mesh(geometry, material)
  item.position.set(x, y, z)
  item.castShadow = item.receiveShadow = true
  return item
}

export function createWorld(scene: THREE.Scene) {
  scene.background = new THREE.Color('#8bd8ff')
  scene.fog = new THREE.Fog('#8bd8ff', 105, 210)

  const arena = mesh(new THREE.CircleGeometry(82, 96), toon('#c8b8e8'))
  arena.rotation.x = -Math.PI / 2
  scene.add(arena)

  const inner = mesh(new THREE.CircleGeometry(76, 96), toon('#a99bd3'), 0, .025)
  inner.rotation.x = -Math.PI / 2
  scene.add(inner)

  for (const radius of [13, 35, 58]) {
    const marking = mesh(new THREE.RingGeometry(radius - .18, radius + .18, 96), toon('#dcd3f3'), 0, .05)
    marking.rotation.x = -Math.PI / 2
    scene.add(marking)
  }

  const center = mesh(new THREE.CircleGeometry(3.8, 24), toon('#ffd447'), 0, .06)
  center.rotation.x = -Math.PI / 2
  scene.add(center)

  const wall = mesh(new THREE.TorusGeometry(79, 2.4, 8, 96), toon('#4b3f72'), 0, 1.3)
  wall.rotation.x = Math.PI / 2
  scene.add(wall)

  const rail = mesh(new THREE.TorusGeometry(79, .42, 7, 96), toon('#ff695f'), 0, 3.8)
  rail.rotation.x = Math.PI / 2
  scene.add(rail)

  const bannerColors = ['#ff695f', '#ffd447', '#39bde8', '#77dc75']
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2
    const banner = mesh(new THREE.BoxGeometry(8, 2.3, .35), toon(bannerColors[i % bannerColors.length]))
    banner.position.set(Math.sin(angle) * 79, 6, Math.cos(angle) * 79)
    banner.rotation.y = angle
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

export function createKart(color: THREE.ColorRepresentation) {
  const kart = new THREE.Group()
  const paint = toon(color)
  const dark = toon('#202638')
  const metal = toon('#9aa7b8')
  const yellow = toon('#ffd447')

  const chassis = mesh(new THREE.BoxGeometry(2.9, .42, 4.15), dark, 0, .62)
  const body = mesh(new THREE.CapsuleGeometry(.95, 2.15, 4, 10), paint, 0, 1.05)
  body.rotation.x = Math.PI / 2
  const nose = mesh(new THREE.BoxGeometry(2.25, .58, 1.25), paint, 0, .9, 2.05)
  nose.rotation.x = -.12
  const frontBumper = mesh(new THREE.BoxGeometry(3.3, .25, .35), yellow, 0, .57, 2.58)
  const rearBumper = mesh(new THREE.BoxGeometry(3.2, .24, .3), metal, 0, .62, -2.3)
  const seat = mesh(new THREE.BoxGeometry(1.3, 1.35, .65), dark, 0, 1.55, -.55)
  seat.rotation.x = -.18

  const driver = mesh(new THREE.SphereGeometry(.62, 12, 8), toon('#f2ae75'), 0, 2.35, -.15)
  const helmet = mesh(new THREE.SphereGeometry(.72, 12, 8, 0, Math.PI * 2, 0, Math.PI * .58), paint, 0, 2.46, -.15)
  const visor = mesh(new THREE.BoxGeometry(1.03, .34, .12), toon('#263f61'), 0, 2.38, .48)
  visor.rotation.x = -.15

  const steering = mesh(new THREE.TorusGeometry(.4, .08, 6, 12), dark, 0, 1.55, .65)
  steering.rotation.x = Math.PI / 2
  steering.rotation.z = -.18

  kart.add(chassis, body, nose, frontBumper, rearBumper, seat, driver, helmet, visor, steering)

  for (const x of [-1.55, 1.55]) for (const z of [-1.35, 1.35]) {
    const wheel = mesh(new THREE.CylinderGeometry(.66, .66, .52, 12), dark, x, .65, z)
    wheel.rotation.z = Math.PI / 2
    const hub = mesh(new THREE.CylinderGeometry(.25, .25, .56, 12), yellow, x, .65, z)
    hub.rotation.z = Math.PI / 2
    kart.add(wheel, hub)
  }

  for (const x of [-.7, .7]) {
    kart.add(mesh(new THREE.SphereGeometry(.19, 8, 6), toon('#fff6c8'), x, 1.08, 2.66))
    const exhaust = mesh(new THREE.CylinderGeometry(.1, .14, .75, 8), metal, x, .65, -2.4)
    exhaust.rotation.x = Math.PI / 2
    kart.add(exhaust)
  }
  return kart
}
