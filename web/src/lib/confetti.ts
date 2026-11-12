const COLORS = ['#8b5cf6', '#d946ef', '#34d399', '#fbbf24', '#fb7185', '#38bdf8']

/**
 * Small dependency-free confetti burst. `origin` is a viewport coordinate
 * (usually the center of the button that was tapped); defaults to screen center.
 */
export function fireConfetti(origin?: { x: number; y: number }, pieces = 26) {
  if (typeof document === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  try {
    navigator.vibrate?.(18)
  } catch {
    // vibration is a nicety, never required
  }

  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? window.innerHeight / 2

  const layer = document.createElement('div')
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:100;overflow:hidden'

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span')
    const angle = Math.random() * Math.PI * 2
    const distance = 70 + Math.random() * 120
    const size = 6 + Math.random() * 6
    piece.style.cssText = [
      'position:absolute',
      `left:${x}px`,
      `top:${y}px`,
      `width:${size}px`,
      `height:${size * (Math.random() > 0.5 ? 1 : 0.5)}px`,
      `background:${COLORS[i % COLORS.length]}`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
      `--dx:${Math.cos(angle) * distance}px`,
      `--dy:${Math.sin(angle) * distance - 40}px`,
      `--rot:${Math.random() * 720 - 360}deg`,
      `animation:confetti-burst ${0.7 + Math.random() * 0.5}s cubic-bezier(0.2,0.8,0.3,1) forwards`,
    ].join(';')
    layer.appendChild(piece)
  }

  document.body.appendChild(layer)
  window.setTimeout(() => layer.remove(), 1400)
}

/** Fire confetti from the center of the element that triggered an event. */
export function fireConfettiFrom(target: Element | null, pieces?: number) {
  if (!target) return fireConfetti(undefined, pieces)
  const rect = target.getBoundingClientRect()
  fireConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, pieces)
}
