<script setup lang="ts">
const editablePage = useState<any | null>('editablePage');
</script>

<template>
  <div>
    <ContentRenderer v-if="editablePage?.body" :value="editablePage" />
  </div>
</template>
