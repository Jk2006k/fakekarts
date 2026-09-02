import assert from 'node:assert/strict'
import test from 'node:test'
import { generateRoomCode, isRoomCode, normalizeRoomCode } from './roomCode.js'

test('room codes contain exactly three digits', () => {
  for (let index = 0; index < 50; index++) assert.match(generateRoomCode(), /^\d{3}$/)
  assert.equal(normalizeRoomCode('A1-23-4'), '123')
  assert.equal(isRoomCode('123'), true)
  assert.equal(isRoomCode('12'), false)
})
