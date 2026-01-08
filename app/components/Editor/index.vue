<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import EditorProp from './Prop.vue';
import { createSchemaResolver } from './schema';

const props = defineProps<{
  page: any | null
}>();

const emit = defineEmits<{
  (e: 'update:page', value: any): void
}>();

const contentComponentFiles = import.meta.glob('@/components/content/*.vue');

const toKebab = (str: string) =>
  str
    .replace(/\.vue$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();

const componentOptions = computed(() =>
  Object.keys(contentComponentFiles)
    .map((path) => path.split('/').pop() || '')
    .filter(Boolean)
    .map(toKebab)
    .sort()
);
const selectedComponent = ref('');
const componentMeta = reactive<Record<string, { slots?: any[] }>>({});

const loadComponentMeta = async () => {
  const metaModule = await import('#build/component-meta.mjs').then((m) => m.default || m);
  Object.assign(componentMeta, metaModule || {});
};

loadComponentMeta();

const deepClone = <T>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const processProp = (key: string | number, value: any) => {
  if (typeof key === 'string' && key.startsWith(':')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const stringifyProp = (key: string | number, value: any) => {
  const processed = processProp(key, value);
  if (typeof key === 'string' && key.startsWith(':')) {
    if (typeof processed === 'string') {
      return processed;
    }
    return JSON.stringify(processed ?? '', null, 2);
  }
  if (typeof processed === 'object') {
    return JSON.stringify(processed ?? '');
  }
  return processed ?? '';
};

const normalizeChildren = (children: any) => {
  if (!children) {
    return { nodes: [], isSingleNode: false };
  }
  if (Array.isArray(children) && typeof children[0] === 'string') {
    return { nodes: [children], isSingleNode: true };
  }
  if (Array.isArray(children)) {
    return { nodes: children, isSingleNode: false };
  }
  return { nodes: [], isSingleNode: false };
};

const extractChildText = (child: any) => {
  if (Array.isArray(child)) {
    if (typeof child[2] === 'string') {
      return child[2];
    }
    if (Array.isArray(child[2]) && typeof child[2][2] === 'string') {
      return child[2][2];
    }
  }
  if (typeof child === 'string') {
    return child;
  }
  return '';
};

const setChildText = (children: any, value: string) => {
  if (Array.isArray(children) && typeof children[0] === 'string') {
    return [children[0], children[1] || {}, value];
  }
  return ['p', {}, value];
};

const toNumber = (value: string | number) => Number(value);

const isArrayOfObjects = (value: any) =>
  Array.isArray(value) && value.every((item) => item && typeof item === 'object' && !Array.isArray(item));

const emitUpdatedPage = (updater: (body: any[]) => void) => {
  if (!props.page?.body?.value) {
    return;
  }
  const nextBody = deepClone(props.page.body.value);
  updater(nextBody);
  emit('update:page', {
    ...props.page,
    body: {
      ...props.page.body,
      value: nextBody
    }
  });
};

const setPropValue = (body: any[], sliceIndex: number, propKey: string | number, newValue: any) => {
  const slice = body[sliceIndex];
  if (!slice) {
    return;
  }
  const props = slice[1] || {};
  if (typeof propKey === 'string' && propKey.startsWith(':')) {
    try {
      props[propKey] = JSON.stringify(newValue);
    } catch {
      props[propKey] = JSON.stringify(String(newValue));
    }
  } else {
    props[propKey] = newValue;
  }
  slice[1] = props;
};

const updateProp = (sliceIndex: number, propKey: string | number, newValue: any) => {
  emitUpdatedPage((body) => {
    let valueToStore: any = newValue;
    if (typeof propKey === 'string' && propKey.startsWith(':') && typeof newValue === 'string') {
      try {
        valueToStore = JSON.parse(newValue);
      } catch {
        valueToStore = newValue;
      }
    }
    setPropValue(body, sliceIndex, propKey, valueToStore);
  });
};

const updateChildText = (sliceIndex: number, childIndex: number, newValue: string) => {
  emitUpdatedPage((body) => {
    const slice = body[sliceIndex];
    if (!slice) {
      return;
    }

    slice[2] = setChildText(slice[2], newValue);
  });
};

const updateArrayItem = (
  sliceIndex: number,
  propKey: string | number,
  itemIndex: number,
  newValue: string | number
) => {
  emitUpdatedPage((body) => {
    const slice = body[sliceIndex];
    if (!slice) {
      return;
    }
    const props = slice[1] || {};
    const parsed = processProp(propKey, props[propKey]);
    if (!Array.isArray(parsed)) {
      return;
    }
    const next = parsed.slice();
    next[itemIndex] = newValue;
    setPropValue(body, sliceIndex, propKey, next);
  });
};

const addArrayItem = (sliceIndex: number, propKey: string | number) => {
  emitUpdatedPage((body) => {
    const slice = body[sliceIndex];
    if (!slice) {
      return;
    }
    const props = slice[1] || {};
    const parsed = processProp(propKey, props[propKey]);
    if (!Array.isArray(parsed)) {
      return;
    }
    const next = parsed.slice();
    if (isArrayOfObjects(parsed)) {
      const template = parsed[0] || {};
      const newItem = Object.keys(template).reduce((acc: Record<string, string>, key) => {
        acc[key] = '';
        return acc;
      }, {});
      next.push(newItem);
    } else {
      next.push('');
    }
    setPropValue(body, sliceIndex, propKey, next);
  });
};

const removeArrayItem = (sliceIndex: number, propKey: string | number, itemIndex: number) => {
  emitUpdatedPage((body) => {
    const slice = body[sliceIndex];
    if (!slice) {
      return;
    }
    const props = slice[1] || {};
    const parsed = processProp(propKey, props[propKey]);
    if (!Array.isArray(parsed)) {
      return;
    }
    const next = parsed.slice();
    next.splice(itemIndex, 1);
    setPropValue(body, sliceIndex, propKey, next);
  });
};

const updateObjectEntry = (
  sliceIndex: number,
  propKey: string | number,
  entryKey: string | number,
  newValue: string | number
) => {
  emitUpdatedPage((body) => {
    const slice = body[sliceIndex];
    if (!slice) {
      return;
    }
    const props = slice[1] || {};
    const parsed = processProp(propKey, props[propKey]);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return;
    }
    const next = { ...parsed, [entryKey]: newValue };
    setPropValue(body, sliceIndex, propKey, next);
  });
};

const updateArrayObjectEntry = (
  sliceIndex: number,
  propKey: string | number,
  itemIndex: number,
  entryKey: string | number,
  newValue: string | number
) => {
  emitUpdatedPage((body) => {
    const slice = body[sliceIndex];
    if (!slice) {
      return;
    }
    const props = slice[1] || {};
    const parsed = processProp(propKey, props[propKey]);
    if (!isArrayOfObjects(parsed)) {
      return;
    }
    const next = parsed.map((item: any, idx: number) =>
      idx === itemIndex ? { ...item, [entryKey]: newValue } : item
    );
    setPropValue(body, sliceIndex, propKey, next);
  });
};

const schemaResolver = createSchemaResolver();
const propSchemaFor = (component: string | number, key: string | number) =>
  schemaResolver.getPropSchema(component, key);

const addComponentSlice = () => {
  if (!selectedComponent.value || !props.page?.body?.value) {
    return;
  }
  emitUpdatedPage((body) => {
    body.push([selectedComponent.value, {}, ['p', {}, '']]);
  });
  selectedComponent.value = '';
};

const removeSlice = (index: number) => {
  emitUpdatedPage((body) => {
    body.splice(index, 1);
  });
};

const componentHasSlots = (name: string) => {
  const meta = Object.values(componentMeta).find(
    (entry: any) => entry?.pascalName?.toLowerCase() === name.toLowerCase() || entry?.kebabName === name
  ) as { meta?: { slots?: any[] } } | undefined;
  if (meta && meta.meta?.slots) {
    return meta.meta.slots.length > 0;
  }
  // Fallback when metadata isn't available (e.g. freshly added components)
  return true;
};
</script>

<template>
  <aside class="editor">
    <div class="component-picker">
      <span>Add component</span>
      <div class="picker-row">
        <select v-model="selectedComponent">
          <option value="">Select component</option>
          <option v-for="name in componentOptions" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
        <button type="button" :disabled="!selectedComponent" @click="addComponentSlice">Add</button>
      </div>
    </div>
    <h4>Content</h4>
    <ul v-if="page?.body?.value?.length">
      <li v-for="(slice, i) in page.body.value" :key="`editor-slice-${i}`">
        <div>component: <strong>{{ slice[0] }}</strong></div>
        <button type="button" class="remove-slice" @click="removeSlice(toNumber(i))">Remove</button>

        <div v-if="slice[1] && Object.keys(slice[1]).length">
          <p>Props</p>
          <ul>
            <li v-for="(value, key) in slice[1]" :key="`editor-prop-${i}-${key}`">
              <label>Prop {{ key }}</label>
              <EditorProp
                :prop-key="key"
                :raw-value="value"
                :processed-value="processProp(key, value)"
                :string-value="stringifyProp(key, value)"
                :input-id="`prop-${i}-${key}`"
                :schema="propSchemaFor(slice[0], key)"
                @update="(val) => updateProp(toNumber(i), key, val)"
                @update-array-item="({ index, value: val }) => updateArrayItem(toNumber(i), key, toNumber(index), val)"
                @remove-array-item="({ index }: { index: number }) => removeArrayItem(toNumber(i), key, toNumber(index))"
                @add-array-item="() => addArrayItem(toNumber(i), key)"
                @update-object-entry="({ entryKey, value: val }) => updateObjectEntry(toNumber(i), key, entryKey, val)"
                @update-array-object-entry="({ itemIndex, entryKey, value: val }) =>
                  updateArrayObjectEntry(toNumber(i), key, toNumber(itemIndex), entryKey, val)"
              />
            </li>
          </ul>
        </div>

        <div v-if="componentHasSlots(slice[0])">
          <p>Slot content</p>
          <textarea
            :value="normalizeChildren(slice[2]).nodes.map(extractChildText).join('\\n')"
            @input="updateChildText(toNumber(i), 0, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </li>
    </ul>
    <p v-else>No content loaded yet.</p>
  </aside>
</template>

<style scoped>
.editor {
  width: 300px;
  height: 100vh;
  overflow-y: auto;
  background-color: #f9f9f9;
  border-right: 1px solid #ddd;
  box-shadow: 10px 0 20px rgba(0, 0, 0, 0.1);
}
.component-picker {
  display: block;
  margin-bottom: 1rem;
}
.picker-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.component-picker select {
  flex: 1;
}
.component-picker button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
