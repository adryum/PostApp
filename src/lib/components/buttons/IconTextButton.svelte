<script lang="ts">
	import Icon from '../Icon.svelte';
	import { svgDualLoader } from '$lib/assets/svgs';

	interface Props {
		label: string;
		svg: string;
		isLoading?: boolean;
		style?: string;
		iconStyle?: string;
		iconSize?: 'small' | 'medium' | 'large';
		hideIcons?: boolean;
		swapIcons?: boolean;
		important?: boolean;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		label = '',
		svg = '',
		iconSize = 'small',
		style = '',
		iconStyle = 'medium',
		onclick = () => {},
		isLoading = false,
		hideIcons = false,
		swapIcons = false,
		important = false
	}: Props = $props();
</script>

<button class="container" class:important class:isLoading class:swapIcons {style} {onclick}>
	{#if !hideIcons && !isLoading}
		<Icon {svg} size={iconSize} style={iconStyle} />
	{/if}

	{#if isLoading}
		<Icon svg={svgDualLoader} size={iconSize} style={iconStyle} />
	{/if}

	{label}
</button>

<style lang="sass">
.container
    background: none


    display: flex
    align-items: center
    gap: .5rem

    padding: .5rem 1rem  .5rem .75rem

    box-sizing: border-box
    line-height: 1rem

    border: 1px solid transparent
    border-radius: 2px

    cursor: pointer

    transition: 0.15s ease
    background: transparent
    color: var(--semi-white)

    font-weight: 600
    letter-spacing: 0.03rem

    &.swapIcons
        flex-direction: row-reverse
        padding: .5rem .75rem  .5rem 1rem

    &.important
        background: var(--accent)
        color: var(--black)

        &:hover
            filter: brightness(0.8)

    &.isLoading
        background: var(--secondary)
        color: var(--semi-white)
        pointer-events: none

    &:hover
        backdrop-filter: brightness(0.8)
</style>
