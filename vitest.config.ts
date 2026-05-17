import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { galleryPhotosPlugin, galleryStoriesPlugin } from './docs/.vuepress/galleryStories'

export default defineConfig({
  plugins: [
    vue(),
    galleryStoriesPlugin(new URL('./docs/gallery', import.meta.url).pathname),
    galleryPhotosPlugin(new URL('./docs/.vuepress/public/gallery/data/photos.json', import.meta.url).pathname),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
