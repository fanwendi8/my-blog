export function setupPhotoSwipeClickToClose(): () => void {
  if (typeof document === 'undefined') return () => {}

  const closeOnLightboxInteraction = (event: MouseEvent | PointerEvent) => {
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

  document.addEventListener('pointerdown', closeOnLightboxInteraction, true)
  document.addEventListener('click', closeOnLightboxInteraction, true)

  return () => {
    document.removeEventListener('pointerdown', closeOnLightboxInteraction, true)
    document.removeEventListener('click', closeOnLightboxInteraction, true)
  }
}
