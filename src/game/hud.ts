import type { Peer } from './multiplayer'
import { KPH_PER_UNIT } from './physics'

export function updateHud(speed: number, drift: number, peers: Iterable<Peer>, localId: string, localScore: number) {
  const kmh = Math.round(Math.abs(speed) * KPH_PER_UNIT)
  document.querySelector('#speed')!.textContent = String(kmh)
  ;(document.querySelector('#speedbar') as HTMLElement).style.width = `${Math.min(kmh / 1.5, 100)}%`
  document.querySelector('#drift-status')!.classList.toggle('active', Math.abs(drift) > .08)
  const remotePlayers = [...peers]
  document.querySelector('#position')!.textContent = String(2 + remotePlayers.length)
  document.querySelector('#players')!.innerHTML = `<span><i style="background:#ff5a4f"></i>YOU</span><span><i style="background:#30a9ff"></i>BOT-01</span>${remotePlayers.map(peer => `<span><i style="background:#a879ff"></i>${escapeHtml(peer.name)}</span>`).join('')}`
  const rankings = [{ id: localId, name: 'YOU', score: Math.round(localScore) }, ...remotePlayers]
    .sort((a, b) => b.score - a.score)
  document.querySelector('#leaderboard')!.innerHTML = `<b>LEADERBOARD</b>${rankings.map((player, index) => `<span><i>${index + 1}</i><em>${escapeHtml(player.name)}</em><strong>${player.score} M</strong></span>`).join('')}`
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
