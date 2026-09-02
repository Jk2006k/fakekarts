import test from 'node:test'
import assert from 'node:assert/strict'
import { containInArena } from './arena.js'

test('arena boundary keeps karts inside and bounces them back', () => {
  const kart = { x: 80, z: 0, heading: 0, speed: 20 }
  containInArena(kart)
  assert.equal(Math.hypot(kart.x, kart.z), 75)
  assert.equal(kart.speed, -7)
})
