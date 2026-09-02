import * as THREE from 'three'
import { containInArena, createArena } from './arena'
import { ChaseCamera } from './camera'
import { Effects } from './effects'
import { updateHud } from './hud'
import { bindControls } from './input'
import { shortestTurn, smoothingFactor } from './interpolation'
import { createKart } from './kart'
import { Multiplayer } from './multiplayer'
import { createObstacles, rampHeightAt, rampPitchAt, resolveObstacleCollisions, type Obstacle } from './obstacles'
import { stepGravity, stepKart, type Controls, type KartState } from './physics'

export class Game {
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 250)
  private renderer: THREE.WebGLRenderer
  private chaseCamera = new ChaseCamera(this.camera)
  private effects = new Effects(this.scene)
  private kart = createKart('#ff5a4f')
  private rival = createKart('#30a9ff')
  private remotes = new Map<string, THREE.Group>()
  private multiplayer: Multiplayer
  private obstacles: Obstacle[]
  private state: KartState = { x: 0, y: 0, z: 12, heading: 0, speed: 0, verticalSpeed: 0 }
  private controls: Controls = { forward: false, back: false, left: false, right: false, drift: false }
  private clock = new THREE.Clock()
  private running = false
  private aiAngle = 0
  private lastSend = 0
  private distanceTravelled = 0
  private groundHeight = 0

  constructor(canvas: HTMLCanvasElement, name: () => string) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    createArena(this.scene)
    this.obstacles = createObstacles(this.scene)
    this.scene.add(this.kart, this.rival)
    this.chaseCamera.snap(this.state)
    this.multiplayer = new Multiplayer(name)
    bindControls(this.controls)
    addEventListener('resize', () => this.resize())
    this.resize()
    this.animate()
  }

  async createRoom() { return this.multiplayer.createRoom() }

  async joinRoom(room: string) { return this.multiplayer.joinRoom(room) }

  onRaceStart(handler: (startAt: number) => void) { this.multiplayer.onRaceStart(handler) }

  startRoomRace() { this.multiplayer.startRace() }

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
    const previousX = this.state.x
    const previousZ = this.state.z
    this.state = stepKart(this.state, this.controls, dt)
    containInArena(this.state)
    for (const obstacle of resolveObstacleCollisions(this.state, this.obstacles)) this.effects.crateBurst(obstacle.x, obstacle.z)
    const groundHeight = rampHeightAt(this.state.x, this.state.z)
    stepGravity(this.state, groundHeight, this.groundHeight, dt)
    this.groundHeight = groundHeight
    this.distanceTravelled += Math.hypot(this.state.x - previousX, this.state.z - previousZ)
    this.kart.position.set(this.state.x, .12 + (this.state.y ?? 0), this.state.z)
    this.kart.rotation.y = this.state.heading
    const airbornePitch = -(this.state.verticalSpeed ?? 0) * .035
    this.kart.rotation.x = THREE.MathUtils.lerp(this.kart.rotation.x, groundHeight ? rampPitchAt(this.state.x, this.state.z, this.state.heading) : airbornePitch, 1 - Math.exp(-10 * dt))

    this.aiAngle += dt * .45
    this.rival.position.set(Math.sin(this.aiAngle) * 28, .12, Math.cos(this.aiAngle) * 28)
    this.rival.rotation.y = this.aiAngle + Math.PI / 2

    this.chaseCamera.update(this.state, dt)
    this.effects.exhaust(this.state, dt)
    this.effects.drift(this.state, dt)
    this.effects.update(dt)

    this.lastSend += dt
    if (this.lastSend > .08) { this.multiplayer.send(this.state, Math.round(this.distanceTravelled)); this.lastSend = 0 }
    this.syncPeers(dt)
    updateHud(this.state.speed, this.multiplayer.peers.values(), this.multiplayer.id, this.distanceTravelled)
  }

  private syncPeers(dt: number) {
    const smoothing = smoothingFactor(dt)
    for (const [id, peer] of this.multiplayer.peers) {
      let kart = this.remotes.get(id)
      if (!kart) {
        kart = createKart('#a879ff')
        kart.position.set(peer.x, .12 + (peer.y ?? 0), peer.z)
        kart.rotation.y = peer.heading
        this.remotes.set(id, kart)
        this.scene.add(kart)
      } else {
        kart.position.x += (peer.x - kart.position.x) * smoothing
        kart.position.z += (peer.z - kart.position.z) * smoothing
        kart.position.y += (.12 + (peer.y ?? 0) - kart.position.y) * smoothing
        const turn = shortestTurn(kart.rotation.y, peer.heading)
        kart.rotation.y += turn * smoothing
      }
    }
    for (const [id, kart] of this.remotes) if (!this.multiplayer.peers.has(id)) { this.scene.remove(kart); this.remotes.delete(id) }
  }

}
