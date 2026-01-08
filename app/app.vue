<script setup lang="ts">
const { data: page } = await useAsyncData('page-data', () =>
  queryCollection('content').path('/').first()
);

const editablePage = useState<any | null>('editablePage', () => null);

watch(
  page,
  (value) => {
    editablePage.value = value ? JSON.parse(JSON.stringify(value)) : null;
  },
  { immediate: true }
);

const handleUpdate = (updatedPage: any) => {
  editablePage.value = updatedPage;
};
</script>

<template>
  <main>
    <Editor v-if="editablePage" :page="editablePage" @update:page="handleUpdate" />
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </main>
</template>

<style>
  main {
    display: flex;
  }
</style>
