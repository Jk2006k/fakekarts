import mqtt, { type MqttClient } from 'mqtt'
import type { KartState } from './physics'

export type Peer = KartState & { id: string; name: string; score: number; seen: number }

type RoomMessage =
  | { type: 'state'; player: Omit<Peer, 'seen'> }
  | { type: 'left'; id: string }

const generateRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return [...bytes].map(value => alphabet[value % alphabet.length]).join('')
}

export class Multiplayer {
  readonly peers = new Map<string, Peer>()
  readonly id = crypto.randomUUID()
  room = ''
  private client?: MqttClient
  private topic = ''

  constructor(private name: () => string) {}

  async createRoom() {
    const room = generateRoomCode()
    return this.connect(room)
  }

  async joinRoom(room: string) {
    return this.connect(room)
  }

  private async connect(room: string) {
    this.disconnect()
    this.room = room
    this.topic = `fakekarts/v3/${room}`
    const left = JSON.stringify({ type: 'left', id: this.id } satisfies RoomMessage)
    try {
      const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId: `fakekarts_${this.id.replaceAll('-', '')}`,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 2000,
        will: { topic: this.topic, payload: left, qos: 0, retain: false },
      })
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 10000)
        client.once('connect', () => { clearTimeout(timer); resolve() })
        client.once('error', error => { clearTimeout(timer); reject(error) })
      })
      this.client = client
      client.on('message', (_topic, payload) => {
        try { this.receive(JSON.parse(payload.toString()) as RoomMessage) } catch { /* Ignore unrelated public-broker traffic. */ }
      })
      await client.subscribeAsync(this.topic, { qos: 0 })
      return room
    } catch {
      this.disconnect()
      throw new Error('Could not connect to multiplayer. Please check your internet connection.')
    }
  }

  send(state: KartState, score: number) {
    if (!this.client?.connected) return
    const message: RoomMessage = { type: 'state', player: { ...state, id: this.id, name: this.name(), score } }
    this.client.publish(this.topic, JSON.stringify(message), { qos: 0 })
    const stale = performance.now() - 3000
    for (const [id, player] of this.peers) if (player.seen < stale) this.peers.delete(id)
  }

  disconnect() {
    if (this.client) {
      if (this.client.connected && this.topic) this.client.publish(this.topic, JSON.stringify({ type: 'left', id: this.id } satisfies RoomMessage))
      this.client.end(true)
    }
    this.client = undefined
    this.topic = ''
    this.room = ''
    this.peers.clear()
  }

  private receive(message: RoomMessage) {
    if (message.type === 'state' && message.player.id !== this.id) {
      this.peers.set(message.player.id, { ...message.player, seen: performance.now() })
    } else if (message.type === 'left') {
      this.peers.delete(message.id)
    }
  }
}
