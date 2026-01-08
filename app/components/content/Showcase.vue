<script setup lang="ts">
interface Author {
    name: string;
    age?: number;
}
    defineProps<{
        title: string;
        items: Array<string>;
        authors?: Array<Author>
    }>();
</script>

<template>
    <div>
        <h2>
            {{ title }}
        </h2>
        <ul>
            <li v-for="(item, index) in items" :key="index">
                {{ item }}
            </li>
        </ul>
        <ul>
            <li v-for="(author, index) in authors" :key="index">
                {{ author.name }} <span v-if="author.age">({{ author.age }} years old)</span>
            </li>
        </ul>
        <slot />
    </div>
</template>