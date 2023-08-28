<script lang="ts">
	import { images } from '../stores';

	function updateAlt(index: number, event: Event) {
		const target = event.target as HTMLTextAreaElement;
		$images[index].alt = target.value;
		$images = $images;
	}
</script>

{#each $images as { base64content, alt, filename }, index}
	<div class="image-container">
		<p>{filename}</p>
		<img src={base64content} {alt} />
		<textarea
			class="textarea-alt"
			placeholder="Alt text"
			bind:value={$images[index].alt}
			on:input={(event) => updateAlt(index, event)}
		/>
		<!-- {#if isLoading === true}
      <p>Running OCR...</p>
    {:else if isLoading === false}
      <p>OCR complete</p>
    {/if} -->
		<p><br /></p>
	</div>
{/each}

<style>
	.image-container {
		margin: 10px 0;
	}
	img {
		max-width: 300px;
		float: left;
	}
	.textarea-alt {
		margin-left: 2em;
		height: 200px;
		width: 400px;
	}
</style>
