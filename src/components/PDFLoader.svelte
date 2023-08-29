<script lang="ts">
	import { onMount } from 'svelte';
	import * as pdfjsLib from 'pdfjs-dist';
	import type { PDFDocumentProxy } from 'pdfjs-dist';
	import { createWorker } from 'tesseract.js';

	import PDFPageCanvas from './PDFPageCanvas.svelte';
	import { pdfPages } from '../stores';

	pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/pdf.worker.js';
	
	type FileContent = {
		content: Uint8Array;
		filename: string;
	};

	let files: FileList;
	let canvasRefs: (HTMLCanvasElement | null)[] = [];
	let pdfDoc: PDFDocumentProxy | null = null;
	let languages: Array<{ name: string; code: string }> = [];
	let language = 'eng';
	let progress = 0;
	let progressPage = 0;
	$: progressPageMax = $pdfPages.length;

	$: if (files) {
		// Reset stores when files are changed
		pdfDoc = null;
		pdfPages.set([]);
	}

	onMount(async () => {
		const res = await fetch('/language.json');
		if (res.ok) {
			languages = await res.json();
		}
	});

	const loadFile = async (file: File): Promise<FileContent> => {
		return new Promise<{ content: Uint8Array; filename: string }>((resolve) => {
			const reader = new FileReader();
			reader.onload = (e: ProgressEvent<FileReader>) => {
				if (e.target?.result !== undefined) {
					const content = new Uint8Array(e.target.result as ArrayBuffer);
					resolve({ content: content, filename: file.name });
				}
			};
			reader.readAsArrayBuffer(file);
		});
	};
	async function loadPDF() {
		if (files !== null) {
			const file: File = Array.from(files)[0];
			const pdfData = await loadFile(file);
			pdfDoc = await pdfjsLib.getDocument({ data: pdfData.content }).promise;
			canvasRefs = Array.from({ length: pdfDoc.numPages }, () => null);
		}
	}

	async function ocrMissingPageText() {
		const updateProgress = (message: { status: string; progress: number }) => {
			if (message.status === 'recognizing text') {
				progress = message.progress * 100;
			}
		};
		// Load Tessaract
		const worker = await createWorker({ logger: (m) => updateProgress(m) });
		await worker.loadLanguage(language);
		await worker.initialize(language);

		for (const page of $pdfPages) {
			if (page.text === '') {
				const {
					data: { text }
				} = await worker.recognize(page.imageURL);
				page.text = text;
				progressPage += 1;
			}
		}
		$pdfPages = $pdfPages;

		await worker.terminate();
	}
</script>

<div id="pdf-uploader">
	<span>Upload PDF:</span>
	<input type="file" bind:files accept="application/pdf" />
	<button on:click={loadPDF}>Load PDF</button>
	<span>{`${progressPage}/${progressPageMax}`} </span>
</div>
<span>Language:</span>
<select bind:value={language}>
	{#each languages as option}
		<option value={option.code}>
			{option.name}
		</option>
	{/each}
</select>
<button disabled={$pdfPages.length === 0} on:click={ocrMissingPageText}
	>OCR missing page text</button
>
<progress id="ocrProgressBar" value={progress} max="100" />
<span>{`${progressPage}/${progressPageMax}`} </span>
<div class="pdf-container">
	{#if pdfDoc !== null}
		{#each Array(pdfDoc.numPages) as _, i}
			<PDFPageCanvas
				canvasRef={canvasRefs[i]}
				idx={i}
				{pdfDoc}
				pageText={$pdfPages[i] !== undefined ? $pdfPages[i].text : ''}
			/>
		{/each}
	{/if}
</div>

<style>
	#pdf-uploader {
		margin: 10px 0;
	}
	.pdf-container {
		display: flex;
		flex-direction: column;
		margin-right: 1rem;
	}
</style>
