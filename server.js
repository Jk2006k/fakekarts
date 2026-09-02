import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'

const root = fileURLToPath(new URL('.', import.meta.url))
const rooms = new Map()
const safeText = (value, fallback, max) => String(value ?? fallback).trim().slice(0, max)
const safeRoom = value => safeText(value, '', 16).toUpperCase().replace(/[^A-Z0-9-]/g, '')
const safeState = value => {
  const keys = ['x', 'z', 'heading', 'speed']
  if (!value || keys.some(key => typeof value[key] !== 'number' || !Number.isFinite(value[key]))) return null
  return Object.fromEntries(keys.map(key => [key, Math.max(-1000, Math.min(1000, value[key]))]))
}
const send = (socket, message) => {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
}
const broadcast = (room, message, except) => {
  for (const client of rooms.get(room) ?? []) if (client !== except) send(client, message)
}

export async function createAppServer({ dev = false } = {}) {
  let vite
  if (dev) {
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
  }

  const server = createServer((request, response) => {
    if (vite) return vite.middlewares(request, response, () => {})
    const pathname = new URL(request.url, 'http://localhost').pathname
    let file = resolve(root, `dist${pathname === '/' ? '/index.html' : pathname}`)
    const dist = resolve(root, 'dist')
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html')
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }
    response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
    createReadStream(file).on('error', () => { response.statusCode = 404; response.end('Not found') }).pipe(response)
  })

  const wss = new WebSocketServer({ server, path: '/multiplayer' })
  wss.on('connection', socket => {
    socket.player = null
    socket.on('message', raw => {
      if (raw.length > 2048) return socket.close(1009, 'Message too large')
      let message
      try { message = JSON.parse(raw.toString()) } catch { return }

      if (message.type === 'join' && !socket.player) {
        const room = safeRoom(message.room)
        if (!room) return send(socket, { type: 'error', message: 'Enter a valid room code.' })
        const player = { id: crypto.randomUUID(), name: safeText(message.name, 'Rookie', 12), room, state: { x: 0, z: 12, heading: 0, speed: 0 } }
        socket.player = player
        if (!rooms.has(room)) rooms.set(room, new Set())
        const peers = [...rooms.get(room)].map(client => ({ id: client.player.id, name: client.player.name, ...client.player.state }))
        rooms.get(room).add(socket)
        send(socket, { type: 'welcome', id: player.id, room, peers })
        broadcast(room, { type: 'state', player: { id: player.id, name: player.name, ...player.state } }, socket)
      } else if (message.type === 'state' && socket.player) {
        const state = safeState(message.state)
        if (!state) return
        socket.player.state = state
        broadcast(socket.player.room, { type: 'state', player: { id: socket.player.id, name: socket.player.name, ...state } }, socket)
      }
    })
    socket.on('close', () => {
      if (!socket.player) return
      const clients = rooms.get(socket.player.room)
      clients?.delete(socket)
      broadcast(socket.player.room, { type: 'left', id: socket.player.id })
      if (!clients?.size) rooms.delete(socket.player.room)
    })
  })

  server.on('close', () => vite?.close())
  return server
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await createAppServer({ dev: !process.argv.includes('--production') })
  const port = Number(process.env.PORT) || 5173
  server.listen(port, () => console.log(`FakeKarts is running at http://localhost:${port}`))
}
