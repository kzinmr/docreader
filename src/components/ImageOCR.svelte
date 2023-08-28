<script lang="ts">
	import { onMount } from 'svelte';
	import { createWorker } from 'tesseract.js';
	import { images } from '../stores';

	let language = 'eng';
	let languages: Array<{ name: string; code: string }> = [];
	let progress = 0;
  let progressPage = 0;
  $: progressPageMax = $images.length;
	onMount(async () => {
		const res = await fetch('/language.json');
		if (res.ok) {
			languages = await res.json();
		}
	});
	function updateProgress(message: { status: string; progress: number }) {
		if (message.status === 'recognizing text') {
			progress = message.progress * 100;
		}
	}
	async function ocrMissingAltText() {
		// Load Tessaract
		const worker = await createWorker({ logger: (m) => updateProgress(m) });
		language = localStorage.getItem('language') ?? 'eng';
		console.log(language.toString());
		await worker.loadLanguage(language);
		await worker.initialize(language);
		// ocrButton.innerText = "";

		// Iterate through all the images in the output div
		for (const img of $images) {
			if (img.alt === '') {
				const {
					data: { text }
				} = await worker.recognize(img.base64content);
				img.alt = text; // Set the OCR result to the alt textarea
				progressPage += 1;
			}
		}
		$images = $images;

		await worker.terminate();
	}
</script>

<div id="ocr-container">
	<span>Language:</span>
	<select bind:value={language} on:change={() => localStorage.setItem('language', language)}>
		{#each languages as option}
			<option value={option.code}>
				{option.name}
			</option>
		{/each}
	</select>
	<button disabled={$images.length === 0} on:click={ocrMissingAltText}>OCR missing alt text</button>
	<progress id="ocrProgressBar" value={progress} max="100" /> <span>{`${progressPage}/${progressPageMax}`} </span>
</div>
