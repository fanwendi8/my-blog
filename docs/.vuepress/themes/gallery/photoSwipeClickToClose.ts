export function setupPhotoSwipeClickToClose(): () => void {
  if (typeof document === 'undefined') return () => {}

  const activePointers = new Map<number, { x: number, y: number, moved: boolean }>()
  let ignoreNextClick = false

  const closeOnLightboxInteraction = (event: MouseEvent) => {
    if (event.button !== 0) return

    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('.pswp__button')) return

    const photoSwipe = target.closest('.pswp.pswp--open')
    if (!photoSwipe) return
    if (!target.closest('.pswp__img, .pswp__item, .pswp__zoom-wrap')) return

    event.preventDefault()
    event.stopPropagation()
    photoSwipe.querySelector<HTMLButtonElement>('.pswp__button--close')?.click()
  }

  const pointerIdOf = (event: PointerEvent): number => event.pointerId ?? 1

  const trackPointerStart = (event: PointerEvent) => {
    if (event.button !== 0) return

    const target = event.target
    if (!(target instanceof Element)) return
    if (!target.closest('.pswp.pswp--open')) return

    activePointers.set(pointerIdOf(event), {
      x: event.clientX,
      y: event.clientY,
      moved: false,
    })
  }

  const trackPointerMove = (event: PointerEvent) => {
    const pointer = activePointers.get(pointerIdOf(event))
    if (!pointer) return

    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 8) {
      pointer.moved = true
    }
  }

  const closeOnPointerRelease = (event: PointerEvent) => {
    if (event.button !== 0) return

    const pointer = activePointers.get(pointerIdOf(event))
    activePointers.delete(pointerIdOf(event))
    if (!pointer) return
    if (pointer.moved) {
      ignoreNextClick = true
      return
    }

    closeOnLightboxInteraction(event)
  }

  const closeOnClick = (event: MouseEvent) => {
    if (ignoreNextClick) {
      ignoreNextClick = false
      return
    }

    closeOnLightboxInteraction(event)
  }

  const closeOnWheel = () => {
    document
      .querySelector<HTMLElement>('.pswp.pswp--open')
      ?.querySelector<HTMLButtonElement>('.pswp__button--close')
      ?.click()
  }

  document.addEventListener('pointerdown', trackPointerStart, true)
  document.addEventListener('pointermove', trackPointerMove, true)
  document.addEventListener('pointerup', closeOnPointerRelease, true)
  document.addEventListener('click', closeOnClick, true)
  document.addEventListener('wheel', closeOnWheel, true)

  return () => {
    document.removeEventListener('pointerdown', trackPointerStart, true)
    document.removeEventListener('pointermove', trackPointerMove, true)
    document.removeEventListener('pointerup', closeOnPointerRelease, true)
    document.removeEventListener('click', closeOnClick, true)
    document.removeEventListener('wheel', closeOnWheel, true)
  }
}
