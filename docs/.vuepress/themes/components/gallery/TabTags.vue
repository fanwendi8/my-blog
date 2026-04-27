<!-- docs/.vuepress/themes/components/gallery/TabTags.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Photo, Tag } from './types'
import JustifiedGrid from './JustifiedGrid.vue'
import { filterPhotos } from '../../composables/useFiltering'

const props = defineProps<{ tags: Tag[]; photos: Photo[]; activeTag?: string | null }>()
const emit = defineEmits<{
  (e: 'open', id: string): void
  (e: 'update:activeTag', tag: string | null): void
}>()

const internal = ref<string | null>(props.activeTag ?? null)
const active = computed({
  get: () => props.activeTag ?? internal.value,
  set: (v) => { internal.value = v; emit('update:activeTag', v) },
})

const filtered = computed(() => active.value
  ? filterPhotos(props.photos, { tag: active.value })
  : props.photos)

function toggle(name: string) {
  active.value = active.value === name ? null : name
}
</script>

<template>
  <section class="gallery-tab gallery-tab--tags">
    <div class="gallery-chips">
      <button
        class="gallery-chip"
        :class="{ 'is-active': !active }"
        @click="active = null"
      >
        全部 <span class="gallery-chip__count">{{ photos.length }}</span>
      </button>
      <button
        v-for="t in tags"
        :key="t.name"
        class="gallery-chip"
        :class="{ 'is-active': active === t.name }"
        @click="toggle(t.name)"
      >
        {{ t.name }} <span class="gallery-chip__count">{{ t.count }}</span>
      </button>
    </div>
    <JustifiedGrid :photos="filtered" @click="(id) => emit('open', id)" />
  </section>
</template>
