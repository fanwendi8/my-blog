import { defineClientConfig } from 'vuepress/client'
import Swiper from 'vuepress-theme-plume/features/Swiper.vue'
import NoteCard from './themes/components/NoteCard.vue'
import PinnedNotes from './themes/components/PinnedNotes.vue'
import NotesHome from './themes/layouts/NotesHome.vue'
import GalleryHome from './themes/layouts/GalleryHome.vue'
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
  },
})
