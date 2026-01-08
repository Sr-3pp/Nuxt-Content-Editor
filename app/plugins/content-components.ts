import { defineNuxtPlugin } from '#app';
const files = import.meta.glob('@/components/content/*.vue', { eager: true, import: 'default' });

const toPascal = (name: string) =>
  name
    .replace(/\.vue$/, '')
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const toKebab = (name: string) =>
  name
    .replace(/\.vue$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();

export default defineNuxtPlugin((nuxtApp) => {
  Object.entries(files).forEach(([path, component]) => {
    const filename = path.split('/').pop() || '';
    const pascalName = toPascal(filename);
    const kebabName = toKebab(filename);
    // Register both pascal and kebab to match renderer expectations
    nuxtApp.vueApp.component(pascalName, component as any);
    nuxtApp.vueApp.component(kebabName, component as any);
  });
});
