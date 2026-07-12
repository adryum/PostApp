<script lang="ts">
	const {
		svg = '',
		size = '2rem',
		style = ''
	} = $props<{
		svg: string;
		size?: 'small' | 'medium' | 'large'; // 2. Added "?" since these are optional with defaults
		style?: string;
	}>();

	const sizeMap: Record<string, string> = {
		small: '1rem',
		medium: '1.5rem',
		large: '2rem'
	};

	// 2. Perform the lookup cleanly without indexing errors
	const fontSize = $derived(sizeMap[size] ?? '2rem');
</script>

<div class="icon-wrapper" style="font-size: {fontSize}; {style}">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html svg}
</div>

<style lang="sass">
.icon-wrapper
    display: flex
    align-items: center
    justify-content: center

    transition: .15s ease

    color: inherit;
</style>
