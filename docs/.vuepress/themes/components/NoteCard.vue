<script setup lang="ts">
defineProps<{
  title: string
  desc?: string
  link: string
  cover?: string
  tags?: string[]
}>()
</script>

<template>
  <a :href="link" class="note-card">
    <div v-if="cover" class="note-card-cover">
      <img :src="cover" :alt="title" loading="lazy" />
    </div>
    <div class="note-card-body">
      <h3 class="note-card-title">{{ title }}</h3>
      <p v-if="desc" class="note-card-desc">{{ desc }}</p>
      <div v-if="tags?.length" class="note-card-tags">
        <span v-for="tag in tags" :key="tag" class="note-card-tag">{{ tag }}</span>
      </div>
    </div>
  </a>
</template>

<style scoped>
.note-card {
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.note-card:hover {
  transform: translateY(-4px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.note-card-cover {
  width: 100%;
  height: 150px;
  overflow: hidden;
  flex-shrink: 0;
}

.note-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.note-card:hover .note-card-cover img {
  transform: scale(1.05);
}

.note-card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px;
}

.note-card-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.note-card-desc {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.note-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.note-card-tag {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 100px;
  font-weight: 500;
}
</style>
