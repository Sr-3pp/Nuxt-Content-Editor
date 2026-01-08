<script setup lang="ts">
import { computed } from 'vue';
import { inputTypeFor, normalizeInputValue } from './inputType';
import type { SchemaNode } from './schema';

const props = defineProps<{
  items: any[];
  isArrayOfObjects: boolean;
  schema?: SchemaNode | null;
}>();

const emit = defineEmits<{
  (e: 'update-item', payload: { index: number; value: string | number }): void;
  (e: 'add-item'): void;
  (e: 'update-object-entry', payload: { itemIndex: number; entryKey: string | number; value: string | number }): void;
  (e: 'remove-item', payload: { index: number }): void;
}>();

const itemSchema = computed(() => props.schema?.items || null);
const entrySchemas = computed(() => itemSchema.value?.properties || {});
const itemOptions = computed(() => itemSchema.value?.enum || []);

const optionsForEntry = (entryKey: string | number) => entrySchemas.value[String(entryKey)]?.enum || [];
const entrySchemaFor = (entryKey: string | number) => entrySchemas.value[String(entryKey)] || null;
</script>

<template>
  <div class="editor-array">
    <ul v-if="items?.length">
      <li v-for="(item, idx) in items" :key="`array-item-${idx}`">
        <template v-if="isArrayOfObjects">
          <p>Item {{ idx + 1 }}</p>
          <ul>
            <li v-for="(entryValue, entryKey) in item" :key="`array-item-${idx}-${String(entryKey)}`">
              <label :for="`array-item-${idx}-${String(entryKey)}`">{{ entryKey }}</label>
              <select
                v-if="optionsForEntry(entryKey).length"
                :id="`array-item-${idx}-${String(entryKey)}`"
                :value="entryValue"
                @change="emit('update-object-entry', { itemIndex: idx, entryKey, value: normalizeInputValue(($event.target as HTMLSelectElement).value, entryValue, entrySchemaFor(entryKey)) })"
              >
                <option
                  v-for="option in optionsForEntry(entryKey)"
                  :key="`array-item-${idx}-${String(entryKey)}-${String(option)}`"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
              <input
                v-else
                :type="inputTypeFor(entryValue, entrySchemaFor(entryKey))"
                :id="`array-item-${idx}-${String(entryKey)}`"
                :value="entryValue"
                @input="emit('update-object-entry', { itemIndex: idx, entryKey, value: normalizeInputValue(($event.target as HTMLInputElement).value, entryValue, entrySchemaFor(entryKey)) })"
              />
            </li>
          </ul>
        </template>
        <template v-else>
          <select
            v-if="itemOptions.length"
            :value="item"
            @change="emit('update-item', { index: idx, value: normalizeInputValue(($event.target as HTMLSelectElement).value, item, itemSchema) })"
          >
            <option v-for="option in itemOptions" :key="`array-item-${idx}-${String(option)}`" :value="option">
              {{ option }}
            </option>
          </select>
          <input
            v-else
            :type="inputTypeFor(item, itemSchema)"
            :value="item"
            @input="emit('update-item', { index: idx, value: normalizeInputValue(($event.target as HTMLInputElement).value, item, itemSchema) })"
          />
        </template>
        <button type="button" class="remove-item" @click="emit('remove-item', { index: idx })">Remove</button>
      </li>
    </ul>
    <button type="button" @click="emit('add-item')">Add item</button>
  </div>
</template>
