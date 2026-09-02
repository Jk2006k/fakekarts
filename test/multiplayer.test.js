import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import WebSocket from 'ws'
import { createAppServer } from '../server.js'

const nextJson = socket => new Promise(resolve => socket.once('message', data => resolve(JSON.parse(data.toString()))))
const connect = async (port, room, name) => {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/multiplayer`)
  await once(socket, 'open')
  socket.send(JSON.stringify({ type: 'join', room, name }))
  return { socket, welcome: await nextJson(socket) }
}

test('players in one room receive movement while other rooms stay isolated', async t => {
  const server = await createAppServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const port = server.address().port

  const first = await connect(port, 'TOON-01', 'Mohan')
  const firstSeesJoin = nextJson(first.socket)
  const second = await connect(port, 'TOON-01', 'Bee')
  const joinMessage = await firstSeesJoin
  assert.equal(first.welcome.type, 'welcome')
  assert.equal(second.welcome.peers[0].name, 'Mohan')
  assert.equal(joinMessage.player.name, 'Bee')

  const isolated = await connect(port, 'OTHER', 'Outsider')
  let leaked = false
  isolated.socket.once('message', () => { leaked = true })
  const movement = nextJson(second.socket)
  first.socket.send(JSON.stringify({ type: 'state', state: { x: 4, z: 8, heading: 1.2, speed: 9 } }))
  const update = await movement
  assert.equal(update.player.x, 4)
  assert.equal(update.player.id, first.welcome.id)
  await new Promise(resolve => setTimeout(resolve, 50))
  assert.equal(leaked, false)

  const left = nextJson(second.socket)
  first.socket.close()
  assert.equal((await left).type, 'left')
  second.socket.close()
  isolated.socket.close()
})
