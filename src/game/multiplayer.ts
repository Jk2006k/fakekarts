import type { KartState } from './physics'

export type Peer = KartState & { id: string; name: string; seen: number }

type ServerMessage =
  | { type: 'welcome'; id: string; room: string; peers: Array<Omit<Peer, 'seen'>> }
  | { type: 'state'; player: Omit<Peer, 'seen'> }
  | { type: 'left'; id: string }
  | { type: 'error'; message: string }

export class Multiplayer {
  readonly peers = new Map<string, Peer>()
  id = ''
  room = ''
  private socket?: WebSocket

  constructor(private name: () => string) {}

  connect(room: string): Promise<string> {
    this.disconnect()
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${location.host}/multiplayer`)
    this.socket = socket

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        socket.close()
        reject(new Error('The room server did not respond.'))
      }, 7000)

      socket.addEventListener('open', () => socket.send(JSON.stringify({ type: 'join', room, name: this.name() })))
      socket.addEventListener('message', ({ data }) => {
        let message: ServerMessage
        try { message = JSON.parse(String(data)) as ServerMessage } catch { return }

        if (message.type === 'welcome') {
          clearTimeout(timer)
          this.id = message.id
          this.room = message.room
          this.peers.clear()
          for (const peer of message.peers) this.peers.set(peer.id, { ...peer, seen: performance.now() })
          resolve(message.room)
        } else if (message.type === 'state' && message.player.id !== this.id) {
          this.peers.set(message.player.id, { ...message.player, seen: performance.now() })
        } else if (message.type === 'left') {
          this.peers.delete(message.id)
        } else if (message.type === 'error') {
          clearTimeout(timer)
          reject(new Error(message.message))
        }
      })
      socket.addEventListener('close', () => {
        clearTimeout(timer)
        if (!this.id) reject(new Error('Could not connect to the room server.'))
      }, { once: true })
      socket.addEventListener('error', () => {
        clearTimeout(timer)
        reject(new Error('Could not connect to the room server.'))
      }, { once: true })
    })
  }

  send(state: KartState) {
    if (this.socket?.readyState === WebSocket.OPEN && this.id) {
      this.socket.send(JSON.stringify({ type: 'state', state }))
    }
  }

  disconnect() {
    this.socket?.close()
    this.socket = undefined
    this.id = ''
    this.room = ''
    this.peers.clear()
  }
}
