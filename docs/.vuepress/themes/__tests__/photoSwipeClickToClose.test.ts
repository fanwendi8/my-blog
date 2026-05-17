import { afterEach, describe, expect, it, vi } from 'vitest'
import { setupPhotoSwipeClickToClose } from '../gallery/photoSwipeClickToClose'

describe('setupPhotoSwipeClickToClose', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('routes pointer presses on the open PhotoSwipe image to the built-in close control', () => {
    document.body.innerHTML = `
      <div class="pswp pswp--open">
        <button class="pswp__button--close" type="button"></button>
        <div class="pswp__item" aria-hidden="false">
          <div class="pswp__zoom-wrap">
            <img class="pswp__img" src="/photo.avif" alt="">
          </div>
        </div>
      </div>
    `
    const close = document.querySelector<HTMLButtonElement>('.pswp__button--close')!
    const clickClose = vi.spyOn(close, 'click')
    const dispose = setupPhotoSwipeClickToClose()

    document.querySelector('.pswp__img')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))

    expect(clickClose).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('ignores clicks outside PhotoSwipe', () => {
    document.body.innerHTML = `
      <button class="pswp__button--close" type="button"></button>
      <img class="pswp__img" src="/photo.avif" alt="">
    `
    const close = document.querySelector<HTMLButtonElement>('.pswp__button--close')!
    const clickClose = vi.spyOn(close, 'click')
    const dispose = setupPhotoSwipeClickToClose()

    document.querySelector('.pswp__img')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(clickClose).not.toHaveBeenCalled()
    dispose()
  })
})
