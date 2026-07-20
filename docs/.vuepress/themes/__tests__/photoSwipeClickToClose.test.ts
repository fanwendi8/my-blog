import { afterEach, describe, expect, it, vi } from 'vitest'
import { setupPhotoSwipeClickToClose } from '../gallery/photoSwipeClickToClose'

describe('setupPhotoSwipeClickToClose', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('waits for pointer release on the open PhotoSwipe image before closing', () => {
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
    expect(clickClose).not.toHaveBeenCalled()

    document.querySelector('.pswp__img')!.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))

    expect(clickClose).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('does not close an open PhotoSwipe after a horizontal swipe', () => {
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
    const image = document.querySelector('.pswp__img')!

    image.dispatchEvent(new MouseEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 20,
      clientY: 20,
    }))
    image.dispatchEvent(new MouseEvent('pointermove', {
      bubbles: true,
      buttons: 1,
      clientX: 80,
      clientY: 20,
    }))
    image.dispatchEvent(new MouseEvent('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 80,
      clientY: 20,
    }))

    expect(clickClose).not.toHaveBeenCalled()
    dispose()
  })

  it('closes the open PhotoSwipe on wheel scrolling', () => {
    document.body.innerHTML = `
      <div class="pswp pswp--open">
        <button class="pswp__button--close" type="button"></button>
      </div>
    `
    const close = document.querySelector<HTMLButtonElement>('.pswp__button--close')!
    const clickClose = vi.spyOn(close, 'click')
    const dispose = setupPhotoSwipeClickToClose()

    document.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

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
