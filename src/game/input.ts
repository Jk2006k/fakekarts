import type { Controls } from './physics'

export function bindControls(controls: Controls) {
  const keys: Record<string, keyof Controls> = { KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' }
  for (const event of ['keydown', 'keyup'] as const) addEventListener(event, e => {
    const control = keys[e.code]
    if (control) { e.preventDefault(); controls[control] = event === 'keydown' }
  })
  document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
    const control = button.dataset.key as keyof Controls
    for (const event of ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(event, e => {
      e.preventDefault()
      controls[control] = event === 'pointerdown'
    })
  })
}
