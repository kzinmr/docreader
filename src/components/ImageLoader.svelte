<script lang="ts">
	import { images } from '../stores';

	let files: FileList | null = null;
	async function loadFiles() {
		if (files !== null) {
			const promises = Array.from(files).map((file) => {
				return new Promise<{ base64content: string; filename: string }>((resolve) => {
					const reader = new FileReader();
					reader.onload = (e: ProgressEvent<FileReader>) => {
						if (e.target?.result !== undefined) {
							resolve({ base64content: e.target.result as string, filename: file.name });
						}
					};
					reader.readAsDataURL(file);
				});
			});
			const results = await Promise.all(promises);

			results.sort((a, b) => a.filename.localeCompare(b.filename));
			// rendering
			$images = results.map((result) => ({
				base64content: result.base64content,
				alt: '',
				filename: result.filename
			}));
		}
	}
</script>

<div id="uploader-container">
	<span>Upload Images:</span>
	<input type="file" multiple accept="image/*" bind:files />
	<button on:click={loadFiles}>Load images</button>
</div>
