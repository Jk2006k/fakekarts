import './styles/base.css'
import './styles/menu.css'
import './styles/hud.css'
import { Game } from './game/Game'

const byId = <T extends HTMLElement>(id: string) => document.querySelector<T>(`#${id}`)!
const name = byId<HTMLInputElement>('name')
const game = new Game(byId<HTMLCanvasElement>('world'), () => name.value.trim() || 'Rookie')

byId('race').addEventListener('click', async () => {
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

byId('sound').addEventListener('click', event => {
  const button = event.currentTarget as HTMLButtonElement
  button.classList.toggle('muted')
  button.textContent = button.classList.contains('muted') ? '×' : '♪'
})
