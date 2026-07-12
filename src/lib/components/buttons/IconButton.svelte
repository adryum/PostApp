<script lang="ts">
	import Icon from '../Icon.svelte';

	let {
		svg,
		iconSize,
		sizeRem = '2rem',
		style = '',
		iconStyle = '',
		onclick = () => {}
	} = $props<{
		svg: string;
		iconSize: 'small' | 'medium' | 'large';
		sizeRem?: string;
		style?: string;
		iconStyle?: string;
		onclick?: () => void;
	}>();
</script>

<button class="container" style="width: {sizeRem}; height: {sizeRem}; {style}" {onclick}>
	<Icon {svg} size={iconSize} style={iconStyle} />
</button>

<style lang="sass">
.container
    background: none

    border: 1px solid transparent
    box-sizing: border-box

    line-height: 1rem

    border-radius: 2px
    cursor: pointer
    padding: .5rem

    transition: 0.15s ease
    color: inherit

    &:hover
        backdrop-filter: brightness(0.8)
</style>
