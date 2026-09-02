import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { PISTOL_DAMAGE } from './combat.js'
import type { Effects } from './effects'
import { breakObstacle, obstacleAt, type Obstacle } from './obstacles.js'
import type { KartState } from './physics'

type Bullet = { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }
export type WeaponTarget = { id: string; object: THREE.Object3D }

export const stepBullet = (position: THREE.Vector3, velocity: THREE.Vector3, dt: number) => {
  position.addScaledVector(velocity, dt)
  velocity.y -= 9.8 * dt
}

export class WeaponSystem {
  private holder = new THREE.Group()
  private slide = new THREE.Mesh()
  private muzzle = new THREE.Object3D()
  private flash = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff09a' }))
  private bullets: Bullet[] = []
  private bulletGeometry = new THREE.SphereGeometry(.13, 8, 6)
  private bulletMaterial = new THREE.MeshBasicMaterial({ color: '#ffe052' })
  private cooldown = 0
  private recoil = 0

  constructor(private scene: THREE.Scene, kart: THREE.Group, private effects: Effects) {
    this.buildModel()
    kart.add(this.holder)
  }

  get bulletCount() { return this.bullets.length }

  update(state: KartState, obstacles: Obstacle[], targets: WeaponTarget[], firing: boolean, dt: number, onHit: (id: string, damage: number) => void) {
    this.cooldown = Math.max(0, this.cooldown - dt)
    this.recoil = Math.max(0, this.recoil - dt * 7)
    this.slide.position.z = .35 - this.recoil * .28
    this.flash.visible = this.recoil > .62
    this.flash.scale.setScalar(.7 + this.recoil * .7)
    this.holder.rotation.y = Math.sin(performance.now() * .004) * .012
    if (firing && this.cooldown === 0) this.fire(state)

    for (const bullet of this.bullets) {
      bullet.life -= dt
      stepBullet(bullet.mesh.position, bullet.velocity, dt)
      const target = targets.find(({ object }) => {
        const dx = bullet.mesh.position.x - object.position.x
        const dy = bullet.mesh.position.y - object.position.y - 1.2
        const dz = bullet.mesh.position.z - object.position.z
        return dx * dx + dy * dy + dz * dz < 4.8
      })
      if (target) {
        this.effects.combatBurst(bullet.mesh.position, false)
        onHit(target.id, PISTOL_DAMAGE)
        bullet.life = 0
        continue
      }
      const hit = obstacleAt(bullet.mesh.position.x, bullet.mesh.position.y, bullet.mesh.position.z, obstacles)
      if (hit) {
        if (hit.breakable) { breakObstacle(hit); this.effects.crateBurst(hit.x, hit.z) }
        this.effects.bulletImpact(bullet.mesh.position)
        bullet.life = 0
      } else if (bullet.mesh.position.y <= .1) {
        this.effects.bulletImpact(bullet.mesh.position)
        bullet.life = 0
      }
    }
    for (let i = this.bullets.length - 1; i >= 0; i--) if (this.bullets[i].life <= 0) {
      this.scene.remove(this.bullets[i].mesh)
      this.bullets.splice(i, 1)
    }
  }

  private fire(state: KartState) {
    this.holder.updateWorldMatrix(true, true)
    const position = this.muzzle.getWorldPosition(new THREE.Vector3())
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.muzzle.getWorldQuaternion(new THREE.Quaternion())).normalize()
    const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial)
    bullet.position.copy(position)
    bullet.scale.set(.8, .8, 2.8)
    bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)
    this.scene.add(bullet)
    this.bullets.push({ mesh: bullet, velocity: direction.multiplyScalar(62 + Math.max(0, state.speed)).add(new THREE.Vector3(0, 1.2, 0)), life: 2.2 })
    this.effects.muzzleSmoke(position, direction.normalize())
    this.cooldown = .24
    this.recoil = 1
  }

  private buildModel() {
    const dark = new THREE.MeshToonMaterial({ color: '#222b3d' })
    const steel = new THREE.MeshToonMaterial({ color: '#6f7f94' })
    const red = new THREE.MeshToonMaterial({ color: '#ff5a4f' })
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.48, .62, .28, 10), dark)
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.15, .2, .72, 8), steel)
    post.position.y = .45
    const pistol = new THREE.Group()
    pistol.position.y = 1.02
    this.slide = new THREE.Mesh(new RoundedBoxGeometry(.58, .46, 1.55, 3, .1), steel)
    this.slide.position.z = .35
    const frame = new THREE.Mesh(new RoundedBoxGeometry(.5, .42, .95, 2, .08), dark)
    frame.position.set(0, -.28, .05)
    const grip = new THREE.Mesh(new RoundedBoxGeometry(.42, .9, .48, 2, .08), red)
    grip.position.set(0, -.72, -.18)
    grip.rotation.x = -.25
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, 1.15, 10), dark)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, .03, 1.05)
    const sight = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .32), red)
    sight.position.set(0, .31, .68)
    this.muzzle.position.set(0, .03, 1.68)
    this.flash.position.copy(this.muzzle.position)
    this.flash.visible = false
    pistol.add(this.slide, frame, grip, barrel, sight, this.muzzle, this.flash)
    for (const object of [base, post, this.slide, frame, grip, barrel, sight]) object.castShadow = true
    this.holder.position.set(0, 1.05, 2.15)
    this.holder.add(base, post, pistol)
  }
}
