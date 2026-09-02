import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createObstacles, rampHeightAt, resolveObstacleCollisions } from './obstacles.js'

test('fast karts break crates and ramps raise karts', () => {
  const obstacles = createObstacles(new THREE.Scene())
  const crate = obstacles.find(obstacle => obstacle.breakable)!
  const kart = { x: crate.x, z: crate.z, heading: 0, speed: 10 }
  resolveObstacleCollisions(kart, obstacles)
  assert.equal(crate.broken, true)
  assert.equal(crate.object.visible, false)
  assert.ok(rampHeightAt(-24, 6) > rampHeightAt(-24, -6))

  const cube = obstacles.find(obstacle => !obstacle.breakable)!
  const slowKart = { x: cube.x, z: cube.z, heading: 0, speed: 5 }
  resolveObstacleCollisions(slowKart, obstacles)
  assert.ok(Math.abs(Math.hypot(slowKart.x - cube.x, slowKart.z - cube.z) - cube.radius) < 1e-9)
  assert.ok(slowKart.speed < 0)
})
