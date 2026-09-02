import './styles/base.css'
import './styles/menu.css'
import './styles/hud.css'
import './styles/settings.css'
import { Game } from './game/Game'
import { setupSettings } from './game/settings'

const byId = <T extends HTMLElement>(id: string) => document.querySelector<T>(`#${id}`)!
const name = byId<HTMLInputElement>('name')
const room = byId<HTMLInputElement>('room-code')
const joinButton = byId<HTMLButtonElement>('join-room')
const createButton = byId<HTMLButtonElement>('create-room')
const startButton = byId<HTMLButtonElement>('start-room')
const lobby = byId('lobby')
const roomStatus = byId('room-status')
const joinError = byId('join-error')
room.value = (new URLSearchParams(location.search).get('room') || '').toUpperCase()
const settings = setupSettings()
const game = new Game(byId<HTMLCanvasElement>('world'), () => name.value.trim() || 'Rookie', settings)

let countdownRunning = false

const runCountdown = async (startAt: number) => {
  if (countdownRunning) return
  countdownRunning = true
  await new Promise(resolve => setTimeout(resolve, Math.max(0, startAt - Date.now())))
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
}

game.onRaceStart(runCountdown)

const enterLobby = async (action: () => Promise<string>, isOwner: boolean) => {
  createButton.disabled = true
  joinButton.disabled = true
  joinError.textContent = ''
  try {
    const joinedRoom = await action()
    room.value = joinedRoom
    byId('room-name').textContent = joinedRoom
    history.replaceState(null, '', `${location.pathname}?room=${encodeURIComponent(joinedRoom)}`)
  } catch (error) {
    joinError.textContent = error instanceof Error ? error.message : 'Could not connect to the room.'
    createButton.disabled = false
    joinButton.disabled = false
    joinButton.querySelector('span')!.textContent = 'JOIN ROOM'
    return
  }
  document.querySelector('.room-actions')!.classList.add('hidden')
  lobby.classList.remove('hidden')
  roomStatus.textContent = isOwner ? 'ROOM READY — SHARE THE CODE, THEN START' : 'WAITING FOR THE OWNER TO START…'
  if (isOwner) startButton.classList.remove('hidden')
}

createButton.addEventListener('click', () => enterLobby(() => game.createRoom(), true))

startButton.addEventListener('click', () => {
  startButton.disabled = true
  roomStatus.textContent = 'STARTING FOR EVERYONE…'
  game.startRoomRace()
})

joinButton.addEventListener('click', () => {
  const roomCode = room.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16)
  if (!roomCode) {
    joinError.textContent = 'Enter a room code.'
    room.focus()
    return undefined
  }
  joinButton.querySelector('span')!.textContent = 'JOINING…'
  return enterLobby(() => game.joinRoom(roomCode), false)
})

room.addEventListener('keydown', event => {
  if (event.key === 'Enter') joinButton.click()
})

byId('sound').addEventListener('click', event => {
  const button = event.currentTarget as HTMLButtonElement
  button.classList.toggle('muted')
  button.textContent = button.classList.contains('muted') ? '×' : '♪'
})
