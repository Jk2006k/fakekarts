import type { KartState } from './physics'

export type Peer = KartState & { id: string; name: string; seen: number }

export class Multiplayer {
  readonly id = crypto.randomUUID()
  readonly peers = new Map<string, Peer>()
  private channel = new BroadcastChannel('fakekarts-toon-01')

  constructor(private name: () => string) {
    this.channel.onmessage = ({ data }: MessageEvent<Peer>) => {
      if (data.id !== this.id) this.peers.set(data.id, { ...data, seen: performance.now() })
    }
  }

  send(state: KartState) {
    // ponytail: BroadcastChannel only reaches tabs on this device, replace this class with a WebSocket relay when internet matchmaking is needed.
    this.channel.postMessage({ ...state, id: this.id, name: this.name(), seen: performance.now() })
    const stale = performance.now() - 1500
    for (const [id, peer] of this.peers) if (peer.seen < stale) this.peers.delete(id)
  }
}
