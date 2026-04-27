<script setup lang="ts">
interface YearItem {
  year: number
  count: number
}

const props = defineProps<{
  years: YearItem[]
  activeYear: number | null
}>()

const emit = defineEmits<{
  (e: 'select', year: number): void
}>()

const sortedYears = computed(() => {
  return [...props.years].sort((a, b) => b.year - a.year)
})

function handleSelect(year: number) {
  emit('select', year)
}
</script>

<template>
  <aside class="year-timeline">
    <div class="year-timeline__line" />
    <nav class="year-timeline__list">
      <button
        v-for="item in sortedYears"
        :key="item.year"
        :class="['year-timeline__item', { 'is-active': item.year === activeYear }]"
        @click="handleSelect(item.year)"
      >
        <span class="year-timeline__dot" />
        <span class="year-timeline__meta">
          <span class="year-timeline__year">{{ item.year }}</span>
          <span class="year-timeline__count">{{ item.count }} 件作品</span>
        </span>
      </button>
    </nav>
  </aside>
</template>
