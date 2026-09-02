import './styles/base.css'
import './styles/menu.css'
import './styles/hud.css'
import { Game } from './game/Game'

const byId = <T extends HTMLElement>(id: string) => document.querySelector<T>(`#${id}`)!
const name = byId<HTMLInputElement>('name')
const room = byId<HTMLInputElement>('room-code')
const joinButton = byId<HTMLButtonElement>('join-room')
const joinError = byId('join-error')
room.value = (new URLSearchParams(location.search).get('room') || 'TOON-01').toUpperCase()
const game = new Game(byId<HTMLCanvasElement>('world'), () => name.value.trim() || 'Rookie')

joinButton.addEventListener('click', async () => {
  const roomCode = room.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16)
  if (!roomCode) {
    joinError.textContent = 'Enter a room code.'
    room.focus()
    return
  }
  joinButton.disabled = true
  joinButton.querySelector('span')!.textContent = 'JOINING…'
  joinError.textContent = ''
  try {
    const joinedRoom = await game.join(roomCode)
    byId('room-name').textContent = joinedRoom
    history.replaceState(null, '', `${location.pathname}?room=${encodeURIComponent(joinedRoom)}`)
  } catch (error) {
    joinError.textContent = error instanceof Error ? error.message : 'Could not join this room.'
    joinButton.disabled = false
    joinButton.querySelector('span')!.textContent = 'JOIN ROOM'
    return
  }

  byId('menu').classList.add('leaving')
  const countdown = byId('countdown')
  for (const word of ['3', '2', '1', 'GO!']) {
    countdown.textContent = word
    countdown.classList.add('show')
    await new Promise(resolve => setTimeout(resolve, word === 'GO!' ? 650 : 700))
    countdown.classList.remove('show')
  }
  byId('menu').classList.add('hidden')
  byId('hud').classList.remove('hidden')
  document.querySelector('.controls')!.classList.add('active')
  game.start()
})

room.addEventListener('keydown', event => {
  if (event.key === 'Enter') joinButton.click()
})

byId('sound').addEventListener('click', event => {
  const button = event.currentTarget as HTMLButtonElement
  button.classList.toggle('muted')
  button.textContent = button.classList.contains('muted') ? '×' : '♪'
})
