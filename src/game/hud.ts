import type { Peer } from './multiplayer'

export function updateHud(speed: number, peers: Iterable<Peer>) {
  const kmh = Math.round(Math.abs(speed) * 5.1)
  document.querySelector('#speed')!.textContent = String(kmh)
  ;(document.querySelector('#speedbar') as HTMLElement).style.width = `${Math.min(kmh / 1.63, 100)}%`
  const remotePlayers = [...peers]
  document.querySelector('#position')!.textContent = String(2 + remotePlayers.length)
  document.querySelector('#players')!.innerHTML = `<span><i style="background:#ff5a4f"></i>YOU</span><span><i style="background:#30a9ff"></i>BOT-01</span>${remotePlayers.map(peer => `<span><i style="background:#a879ff"></i>${escapeHtml(peer.name)}</span>`).join('')}`
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
