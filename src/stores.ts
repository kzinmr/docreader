import { writable } from 'svelte/store';

export const images = writable<Array<{ base64content: string; alt: string; filename: string }>>([]);
