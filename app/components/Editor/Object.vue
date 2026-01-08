<script setup lang="ts">
import { computed } from 'vue';
import { inputTypeFor, normalizeInputValue } from './inputType';
import type { SchemaNode } from './schema';

const props = defineProps<{
  entries: Record<string, any>;
  schema?: SchemaNode | null;
}>();

const emit = defineEmits<{
  (e: 'update-entry', payload: { entryKey: string | number; value: string | number }): void;
}>();

const entrySchemas = computed(() => props.schema?.properties || {});
const optionsFor = (entryKey: string | number) => entrySchemas.value[String(entryKey)]?.enum || [];
const schemaFor = (entryKey: string | number) => entrySchemas.value[String(entryKey)] || null;
</script>

<template>
  <div class="editor-object">
    <ul>
      <li v-for="(entryValue, entryKey) in entries" :key="`object-entry-${String(entryKey)}`">
        <label :for="`object-entry-${String(entryKey)}`">{{ entryKey }}</label>
        <select
          v-if="optionsFor(entryKey).length"
          :id="`object-entry-${String(entryKey)}`"
          :value="entryValue"
          @change="emit('update-entry', { entryKey, value: normalizeInputValue(($event.target as HTMLSelectElement).value, entryValue, schemaFor(entryKey)) })"
        >
          <option
            v-for="option in optionsFor(entryKey)"
            :key="`object-entry-${String(entryKey)}-${String(option)}`"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
        <input
          v-else
          :type="inputTypeFor(entryValue, schemaFor(entryKey))"
          :id="`object-entry-${String(entryKey)}`"
          :value="entryValue"
          @input="emit('update-entry', { entryKey, value: normalizeInputValue(($event.target as HTMLInputElement).value, entryValue, schemaFor(entryKey)) })"
        />
      </li>
    </ul>
  </div>
</template>
