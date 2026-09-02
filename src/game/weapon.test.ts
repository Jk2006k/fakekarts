import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { Effects } from './effects.js'
import { stepBullet, WeaponSystem } from './weapon.js'

test('bullets travel forward and fall under gravity', () => {
  const position = new THREE.Vector3(0, 2, 0)
  const velocity = new THREE.Vector3(0, 1, 20)
  stepBullet(position, velocity, .5)
  assert.equal(position.z, 10)
  assert.ok(velocity.y < 0)
})

test('mounted pistol fires a live projectile', () => {
  const scene = new THREE.Scene()
  const kart = new THREE.Group()
  scene.add(kart)
  const weapon = new WeaponSystem(scene, kart, new Effects(scene))
  weapon.update({ x: 0, y: 0, z: 0, heading: 0, speed: 10 }, [], true, 1 / 60)
  assert.equal(weapon.bulletCount, 1)
})
