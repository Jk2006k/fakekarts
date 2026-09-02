import * as THREE from 'three'
import { containInArena, createArena } from './arena'
import { updateHud } from './hud'
import { bindControls } from './input'
import { createKart } from './kart'
import { Multiplayer } from './multiplayer'
import { stepKart, type Controls, type KartState } from './physics'

export class Game {
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 250)
  private renderer: THREE.WebGLRenderer
  private kart = createKart('#ff5a4f')
  private rival = createKart('#30a9ff')
  private remotes = new Map<string, THREE.Group>()
  private multiplayer: Multiplayer
  private state: KartState = { x: 0, z: 12, heading: 0, speed: 0 }
  private controls: Controls = { forward: false, back: false, left: false, right: false }
  private clock = new THREE.Clock()
  private running = false
  private aiAngle = 0
  private lastSend = 0

  constructor(canvas: HTMLCanvasElement, name: () => string) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    createArena(this.scene)
    this.scene.add(this.kart, this.rival)
    this.camera.position.set(0, 8, 23)
    this.camera.lookAt(0, 1, 10)
    this.multiplayer = new Multiplayer(name)
    bindControls(this.controls)
    addEventListener('resize', () => this.resize())
    this.resize()
    this.animate()
  }

  async join(room: string) { return this.multiplayer.connect(room) }

  start() { this.running = true }

  private resize() {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
  }

  private animate = () => {
    requestAnimationFrame(this.animate)
    const dt = Math.min(this.clock.getDelta(), .05)
    if (this.running) this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.state = stepKart(this.state, this.controls, dt)
    containInArena(this.state)
    this.kart.position.set(this.state.x, .12, this.state.z)
    this.kart.rotation.y = this.state.heading

    this.aiAngle += dt * .45
    this.rival.position.set(Math.sin(this.aiAngle) * 28, .12, Math.cos(this.aiAngle) * 28)
    this.rival.rotation.y = this.aiAngle + Math.PI / 2

    const behind = new THREE.Vector3(Math.sin(this.state.heading) * -10, 7, Math.cos(this.state.heading) * -10)
    const target = this.kart.position.clone().add(behind)
    this.camera.position.lerp(target, 1 - Math.pow(.001, dt))
    this.camera.lookAt(this.kart.position.x, 1.2, this.kart.position.z)

    this.lastSend += dt
    if (this.lastSend > .08) { this.multiplayer.send(this.state); this.lastSend = 0 }
    this.syncPeers()
    updateHud(this.state.speed, this.multiplayer.peers.values())
  }

  private syncPeers() {
    for (const [id, peer] of this.multiplayer.peers) {
      let kart = this.remotes.get(id)
      if (!kart) { kart = createKart('#a879ff'); this.remotes.set(id, kart); this.scene.add(kart) }
      kart.position.set(peer.x, .12, peer.z)
      kart.rotation.y = peer.heading
    }
    for (const [id, kart] of this.remotes) if (!this.multiplayer.peers.has(id)) { this.scene.remove(kart); this.remotes.delete(id) }
  }

}
