import { DataConnection, Peer as PeerClient } from 'peerjs'
import type { KartState } from './physics'

export type Peer = KartState & { id: string; name: string; score: number; seen: number }

type PlayerState = Omit<Peer, 'seen'>
type RoomMessage =
  | { type: 'snapshot'; players: PlayerState[] }
  | { type: 'state'; player: PlayerState }
  | { type: 'left'; id: string }

const roomPeerId = (room: string) => `fakekarts-${room.toLowerCase()}`
const generateRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return [...bytes].map(value => alphabet[value % alphabet.length]).join('')
}

export class Multiplayer {
  readonly peers = new Map<string, Peer>()
  readonly id = crypto.randomUUID()
  room = ''
  private peer?: PeerClient
  private hostConnection?: DataConnection
  private guests = new Map<string, DataConnection>()
  private isHost = false
  private localState: PlayerState

  constructor(private name: () => string) {
    this.localState = { id: this.id, name: this.name(), x: 0, z: 12, heading: 0, speed: 0, score: 0 }
  }

  createRoom(): Promise<string> {
    this.disconnect()
    const room = generateRoomCode()
    this.room = room
    this.isHost = true
    const peer = new PeerClient(roomPeerId(room))
    this.peer = peer
    peer.on('connection', connection => this.acceptGuest(connection))

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        peer.destroy()
        reject(new Error('Could not create a room. Check your connection.'))
      }, 10000)
      peer.on('open', () => { clearTimeout(timer); resolve(room) })
      peer.on('error', error => {
        clearTimeout(timer)
        reject(new Error(error.type === 'unavailable-id' ? 'That room code is already in use. Please try again.' : 'Could not create a room. Check your connection.'))
      })
    })
  }

  joinRoom(room: string): Promise<string> {
    this.disconnect()
    this.room = room
    const peer = new PeerClient()
    this.peer = peer

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        peer.destroy()
        reject(new Error('Room not found or the host is offline.'))
      }, 10000)
      peer.on('open', () => {
        const connection = peer.connect(roomPeerId(room), { metadata: { id: this.id, name: this.name() }, reliable: false })
        this.hostConnection = connection
        connection.on('data', data => this.receive(data as RoomMessage))
        connection.on('open', () => { clearTimeout(timer); resolve(room) })
        connection.on('error', () => { clearTimeout(timer); reject(new Error('Could not join the room.')) })
      })
      peer.on('error', error => {
        clearTimeout(timer)
        reject(new Error(error.type === 'peer-unavailable' ? 'Room not found or the host is offline.' : 'Could not connect to the room.'))
      })
    })
  }

  send(state: KartState, score: number) {
    this.localState = { ...state, id: this.id, name: this.name(), score }
    const message: RoomMessage = { type: 'state', player: this.localState }
    if (this.isHost) this.broadcast(message)
    else if (this.hostConnection?.open) this.hostConnection.send(message)
  }

  disconnect() {
    this.peer?.destroy()
    this.peer = undefined
    this.hostConnection = undefined
    this.guests.clear()
    this.isHost = false
    this.room = ''
    this.peers.clear()
  }

  private acceptGuest(connection: DataConnection) {
    const id = String(connection.metadata?.id || connection.peer)
    const name = String(connection.metadata?.name || 'Rookie').slice(0, 12)
    connection.on('open', () => {
      this.guests.set(id, connection)
      const player: Peer = { id, name, x: 0, z: 12, heading: 0, speed: 0, score: 0, seen: performance.now() }
      this.peers.set(id, player)
      connection.send({ type: 'snapshot', players: [this.localState, ...this.peers.values()].filter(item => item.id !== id) } satisfies RoomMessage)
      this.broadcast({ type: 'state', player }, connection)
    })
    connection.on('data', data => {
      const message = data as RoomMessage
      if (message.type !== 'state' || message.player.id !== id) return
      this.peers.set(id, { ...message.player, name, seen: performance.now() })
      this.broadcast(message, connection)
    })
    connection.on('close', () => {
      this.guests.delete(id)
      this.peers.delete(id)
      this.broadcast({ type: 'left', id })
    })
  }

  private receive(message: RoomMessage) {
    if (message.type === 'snapshot') {
      this.peers.clear()
      for (const player of message.players) if (player.id !== this.id) this.peers.set(player.id, { ...player, seen: performance.now() })
    } else if (message.type === 'state' && message.player.id !== this.id) {
      this.peers.set(message.player.id, { ...message.player, seen: performance.now() })
    } else if (message.type === 'left') {
      this.peers.delete(message.id)
    }
  }

  private broadcast(message: RoomMessage, except?: DataConnection) {
    for (const connection of this.guests.values()) if (connection !== except && connection.open) connection.send(message)
  }
}
