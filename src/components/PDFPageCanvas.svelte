<script lang="ts">
	// 以下のようにonMountに応じてレンダリングをしたいためにcanvasコンポーネントを分ける
	// <canvas bind:this={canvasRefs[i]} on:mount={() => renderPage(i + 1, canvasRefs[i])} />

	import { onMount } from 'svelte';
	import type { PDFDocumentProxy } from 'pdfjs-dist';
	import { pdfPages } from '../stores';

	export let canvasRef: HTMLCanvasElement | null;
	export let idx: number;
	export let pdfDoc: PDFDocumentProxy | null = null;
	export let pageText: string;

	onMount(async () => {
		renderPage(idx + 1, canvasRef);
	});

	async function renderPage(pageNum: number, canvas: HTMLCanvasElement | null) {
		if (pdfDoc !== null && canvas !== null) {
			const page = await pdfDoc.getPage(pageNum);
			const viewport = page.getViewport({ scale: 1.5 });
			canvas.height = viewport.height;
			canvas.width = viewport.width;
			const canvasContext = canvas.getContext('2d');
			if (canvasContext !== null) {
				const renderContext = {
					canvasContext: canvasContext,
					viewport
				};
				await page.render(renderContext).promise;
				const imageURL = canvas.toDataURL('image/png');
				// Read embedded text in each pages
				const content = await page.getTextContent({
					disableNormalization: true,
					includeMarkedContent: false
				});
				let text = content.items.map((item) => ('str' in item ? item.str : '')).join('\n');
				$pdfPages.push({ imageURL, text });
				$pdfPages = $pdfPages;
			}
		}
	}
	function updatePageText(index: number, event: Event) {
		const target = event.target as HTMLTextAreaElement;
		$pdfPages[index].text = target.value;
		$pdfPages = $pdfPages;
	}
</script>

<div class="canvas-textarea-group">
	<canvas bind:this={canvasRef} id={`canvas-${idx}`} />
	<div class="progress-textarea-group">
		<!-- <progress id="ocrProgressBar" value={progress} max="100" /> -->
		<textarea
			class="textarea-pagetext"
			id={`text-${idx}`}
			placeholder="Page text"
			bind:value={pageText}
			on:input={(event) => updatePageText(idx, event)}
		/>
	</div>
</div>

<style>
	canvas {
		width: 50%;
		height: 100%;
		background-color: #666;
	}
	.textarea-pagetext {
		width: 100%;
		height: 100%;
	}
	.canvas-textarea-group {
		display: flex;
		flex-direction: row;
		margin-right: 10px; /* あるいは必要なスペース */
	}
	.progress-textarea-group {
		display: flex;
		flex-direction: column;
	}
</style>
