import * as THREE from 'three'
import { Multiplayer } from './multiplayer'
import { stepKart, type Controls, type KartState } from './physics'
import { createKart, createWorld } from './world'

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
    createWorld(this.scene)
    this.scene.add(this.kart, this.rival)
    this.camera.position.set(0, 8, 23)
    this.camera.lookAt(0, 1, 10)
    this.multiplayer = new Multiplayer(name)
    this.bindControls()
    addEventListener('resize', () => this.resize())
    this.resize()
    this.animate()
  }

  start() { this.running = true }

  private bindControls() {
    const keys: Record<string, keyof Controls> = { KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' }
    for (const event of ['keydown', 'keyup'] as const) addEventListener(event, e => {
      const control = keys[e.code]
      if (control) { e.preventDefault(); this.controls[control] = event === 'keydown' }
    })
    document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
      const control = button.dataset.key as keyof Controls
      for (const event of ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(event, e => {
        e.preventDefault()
        this.controls[control] = event === 'pointerdown'
      })
    })
  }

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
    const distance = Math.hypot(this.state.x, this.state.z)
    if (distance > 75) {
      const scale = 75 / distance
      this.state.x *= scale
      this.state.z *= scale
      this.state.speed *= -.35
    }
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
    this.updateHud()
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

  private updateHud() {
    const speed = Math.round(Math.abs(this.state.speed) * 5.1)
    document.querySelector('#speed')!.textContent = String(speed)
    ;(document.querySelector('#speedbar') as HTMLElement).style.width = `${Math.min(speed / 1.63, 100)}%`
    document.querySelector('#position')!.textContent = String(2 + this.multiplayer.peers.size)
    document.querySelector('#players')!.innerHTML = `<span><i style="background:#ff5a4f"></i>YOU</span><span><i style="background:#30a9ff"></i>BOT-01</span>${[...this.multiplayer.peers.values()].map(p => `<span><i style="background:#a879ff"></i>${p.name.replace(/[<>]/g, '')}</span>`).join('')}`
  }
}
