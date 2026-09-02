import test from 'node:test'
import assert from 'node:assert/strict'
import { stepReverseView } from './camera.js'

test('reverse camera engages only once the kart is moving backwards', () => {
  assert.equal(stepReverseView(0, 5, .1), 0)
  assert.equal(stepReverseView(0, -.5, .1), 0)
  assert.ok(stepReverseView(0, -1, .1) > 0)
})

test('reverse camera smoothly returns to the chase view', () => {
  const returning = stepReverseView(1, 0, .1)
  assert.ok(returning > 0)
  assert.ok(returning < 1)
})
