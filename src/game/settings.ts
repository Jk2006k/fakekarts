export type GameSettings = {
  cameraDistance: number
  cameraHeight: number
  steeringSensitivity: number
  driftStrength: number
}

const defaults: GameSettings = { cameraDistance: 12, cameraHeight: 6.5, steeringSensitivity: 1, driftStrength: 1.15 }

export function setupSettings() {
  let saved: Partial<GameSettings> = {}
  try { saved = JSON.parse(localStorage.getItem('fakekarts-settings') || '{}') as Partial<GameSettings> } catch { /* Use safe defaults. */ }
  const settings = { ...defaults, ...saved }
  const dialog = document.querySelector<HTMLDialogElement>('#settings-panel')!
  const fields = Object.keys(defaults) as Array<keyof GameSettings>

  const render = () => fields.forEach(key => {
    const input = document.querySelector<HTMLInputElement>(`#setting-${key}`)!
    const value = Number(settings[key])
    settings[key] = Number.isFinite(value) ? Math.max(Number(input.min), Math.min(Number(input.max), value)) : defaults[key]
    input.value = String(settings[key])
    document.querySelector(`#setting-${key}-value`)!.textContent = settings[key].toFixed(key.includes('camera') ? 1 : 2)
  })

  for (const key of fields) document.querySelector(`#setting-${key}`)!.addEventListener('input', event => {
    settings[key] = Number((event.currentTarget as HTMLInputElement).value)
    render()
    try { localStorage.setItem('fakekarts-settings', JSON.stringify(settings)) } catch { /* Settings still apply for this session. */ }
  })
  document.querySelector('#settings')!.addEventListener('click', () => dialog.showModal())
  document.querySelector('#reset-settings')!.addEventListener('click', event => {
    event.preventDefault()
    Object.assign(settings, defaults)
    try { localStorage.removeItem('fakekarts-settings') } catch { /* Settings still reset for this session. */ }
    render()
  })
  render()
  return settings
}
