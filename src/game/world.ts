import * as THREE from 'three'

const toon = (color: THREE.ColorRepresentation) => new THREE.MeshToonMaterial({ color })

export function createWorld(scene: THREE.Scene) {
  scene.background = new THREE.Color('#88d8ff')
  scene.fog = new THREE.Fog('#88d8ff', 85, 185)

  const ground = new THREE.Mesh(new THREE.CircleGeometry(150, 64), toon('#78be55'))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const track = new THREE.Mesh(new THREE.RingGeometry(38, 59, 96), toon('#485266'))
  track.rotation.x = -Math.PI / 2
  track.position.y = 0.04
  track.receiveShadow = true
  scene.add(track)

  for (const radius of [39.3, 57.7]) {
    const line = new THREE.Mesh(new THREE.RingGeometry(radius - .25, radius + .25, 96), toon('#fff3ce'))
    line.rotation.x = -Math.PI / 2
    line.position.y = .07
    scene.add(line)
  }

  const dashMaterial = toon('#ffd447')
  for (let i = 0; i < 36; i++) {
    const angle = i / 36 * Math.PI * 2
    const dash = new THREE.Mesh(new THREE.BoxGeometry(.55, .08, 3.6), dashMaterial)
    dash.position.set(Math.sin(angle) * 48.5, .1, Math.cos(angle) * 48.5)
    dash.rotation.y = angle
    scene.add(dash)
  }

  const trunk = toon('#744d35')
  const leaves = [toon('#1c8b57'), toon('#2ca768'), toon('#16744a')]
  for (let i = 0; i < 42; i++) {
    const angle = i * 2.4
    const radius = i % 3 === 0 ? 72 + (i % 6) * 4 : 20 + (i % 5) * 2
    const tree = new THREE.Group()
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.45, .7, 4, 7), trunk)
    stem.position.y = 2
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.4 + i % 3 * .3, 6.5, 7), leaves[i % leaves.length])
    crown.position.y = 6
    tree.add(stem, crown)
    tree.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius)
    tree.rotation.y = angle
    scene.add(tree)
  }

  const mountainMaterial = toon('#66a870')
  for (let i = 0; i < 13; i++) {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(15 + i % 3 * 5, 20 + i % 4 * 6, 7), mountainMaterial)
    const angle = i / 13 * Math.PI * 2
    mountain.position.set(Math.sin(angle) * 125, 7, Math.cos(angle) * 125)
    mountain.rotation.y = angle
    scene.add(mountain)
  }

  scene.add(new THREE.HemisphereLight('#dff6ff', '#43833f', 2.7))
  const sun = new THREE.DirectionalLight('#fff4ca', 4)
  sun.position.set(-35, 55, -25)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = sun.shadow.camera.bottom = -90
  sun.shadow.camera.right = sun.shadow.camera.top = 90
  scene.add(sun)
}

export function createKart(color: THREE.ColorRepresentation) {
  const kart = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, .65, 3.6), toon(color))
  body.position.y = .85
  body.castShadow = true
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.8, .45, 1.1), toon('#ffe052'))
  nose.position.set(0, .7, 2)
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1), toon('#263143'))
  seat.position.set(0, 1.45, -.35)
  const wheelMaterial = toon('#202735')
  kart.add(body, nose, seat)
  for (const x of [-1.25, 1.25]) for (const z of [-1.1, 1.15]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .45, 10), wheelMaterial)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(x, .55, z)
    wheel.castShadow = true
    kart.add(wheel)
  }
  return kart
}
