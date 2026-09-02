import test from 'node:test'
import assert from 'node:assert/strict'
import { stepKart } from './physics.js'

test('kart accelerates, turns, and respects top speed', () => {
  let kart = { x: 0, z: 0, heading: 0, speed: 0 }
  for (let i = 0; i < 180; i++) kart = stepKart(kart, { forward: true, back: false, left: true, right: false }, 1 / 60)
  assert.ok(kart.speed <= 32 && kart.speed > 25)
  assert.notEqual(kart.heading, 0)
  assert.notEqual(kart.x, 0)
})
