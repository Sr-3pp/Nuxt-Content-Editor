<script setup lang="ts">
import { computed } from 'vue';
import EditorArray from './Array.vue';
import EditorObject from './Object.vue';
import { inputTypeFor, isNumericValue, normalizeInputValue } from './inputType';
import type { SchemaNode } from './schema';

const props = defineProps<{
  propKey: string | number;
  processedValue: any;
  rawValue: any;
  stringValue: string | number;
  inputId?: string;
  schema?: SchemaNode | null;
}>();

const emit = defineEmits<{
  (e: 'update', value: string | number): void;
  (e: 'update-array-item', payload: { index: number; value: string | number }): void;
  (e: 'add-array-item'): void;
  (e: 'remove-array-item', payload: { index: number }): void;
  (e: 'update-object-entry', payload: { entryKey: string | number; value: string | number }): void;
  (
    e: 'update-array-object-entry',
    payload: { itemIndex: number; entryKey: string | number; value: string | number }
  ): void;
}>();

const isArrayOfObjects = computed(
  () =>
    Array.isArray(props.processedValue) &&
    props.processedValue.every((item: any) => item && typeof item === 'object' && !Array.isArray(item))
);

const baseValue = computed(() => props.rawValue ?? props.processedValue);
const selectOptions = computed(() => props.schema?.enum || []);
const inputType = computed(() => inputTypeFor(baseValue.value, props.schema));
const isNumber = computed(() => inputType.value === 'number' || isNumericValue(props.processedValue));
const inputSourceValue = computed(() => (isNumber.value ? baseValue.value : props.processedValue));

const handlePrimitiveInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  const value = normalizeInputValue(raw, isNumber.value ? baseValue.value : null, props.schema);
  emit('update', value);
};
</script>

<template>
  <div class="editor-prop">
    <template v-if="Array.isArray(processedValue)">
      <EditorArray
        :items="processedValue"
        :is-array-of-objects="isArrayOfObjects"
        :schema="schema"
        @update-item="({ index, value }) => emit('update-array-item', { index, value })"
        @add-item="() => emit('add-array-item')"
        @remove-item="({ index }) => emit('remove-array-item', { index })"
        @update-object-entry="({ itemIndex, entryKey, value }) =>
          emit('update-array-object-entry', { itemIndex, entryKey, value })"
      />
    </template>
    <template v-else-if="processedValue && typeof processedValue === 'object'">
      <EditorObject
        :entries="processedValue"
        :schema="schema"
        @update-entry="({ entryKey, value }) => emit('update-object-entry', { entryKey, value })"
      />
    </template>
    <select
      v-else-if="selectOptions.length"
      :id="inputId"
      :value="processedValue ?? stringValue ?? ''"
      @change="handlePrimitiveInput"
    >
      <option v-for="option in selectOptions" :key="`option-${String(option)}`" :value="option">
        {{ option }}
      </option>
    </select>
    <input
      v-else
      :id="inputId"
      :type="inputType"
      :value="isNumber ? inputSourceValue ?? '' : String(stringValue ?? '')"
      @input="handlePrimitiveInput"
    />
  </div>
</template>
