import { defineClientConfig } from 'vuepress/client'
import { definePhotoSwipeConfig } from '@vuepress/plugin-photo-swipe/client'
import Swiper from 'vuepress-theme-plume/features/Swiper.vue'
import NoteCard from './themes/components/note/NoteCard.vue'
import PinnedNotes from './themes/components/note/PinnedNotes.vue'
import NotesHome from './themes/layouts/NotesHome.vue'
import GalleryHome from './themes/layouts/GalleryHome.vue'
import PhotoStoryHeader from './themes/components/gallery/PhotoStoryHeader.vue'
import StoryPhoto from './themes/components/gallery/StoryPhoto.vue'
import StoryPhotos from './themes/components/gallery/StoryPhotos.vue'
import StorySplit from './themes/components/gallery/StorySplit.vue'
import { setupOutlineRouteReset } from './themes/composables/setupOutlineRouteReset'
import { setupPhotoSwipeClickToClose } from './themes/gallery/photoSwipeClickToClose'
import { galleryPhotoSwipeOptions } from './themes/gallery/photoSwipeOptions'
import './themes/styles/index.scss'

export default defineClientConfig({
  enhance({ app }) {
    // built-in components
    // app.component('RepoCard', RepoCard)
    // app.component('NpmBadge', NpmBadge)
    // app.component('NpmBadgeGroup', NpmBadgeGroup)
    app.component('Swiper', Swiper)

    // your custom components
    app.component('NoteCard', NoteCard)
    app.component('PinnedNotes', PinnedNotes)
    app.component('NotesHome', NotesHome)
    app.component('GalleryHome', GalleryHome)
    app.component('PhotoStoryHeader', PhotoStoryHeader)
    app.component('StoryPhoto', StoryPhoto)
    app.component('StoryPhotos', StoryPhotos)
    app.component('StorySplit', StorySplit)
  },
  setup() {
    definePhotoSwipeConfig(galleryPhotoSwipeOptions)
    setupOutlineRouteReset()
    setupPhotoSwipeClickToClose()
  },
})
