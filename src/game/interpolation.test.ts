import assert from 'node:assert/strict'
import test from 'node:test'
import { shortestTurn, smoothingFactor } from './interpolation.js'

test('remote interpolation is frame-independent and takes the shortest turn', () => {
  const oneFrame = smoothingFactor(1 / 30)
  const twoFrames = 1 - (1 - smoothingFactor(1 / 60)) ** 2
  assert.ok(Math.abs(oneFrame - twoFrames) < 1e-12)
  assert.ok(oneFrame > 0 && oneFrame < 1)

  const turn = shortestTurn(Math.PI - .1, -Math.PI + .1)
  assert.ok(Math.abs(turn - .2) < 1e-12)
})
