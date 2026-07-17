<script lang="ts">
	import { fly } from 'svelte/transition';
	import IconButton from '../buttons/IconButton.svelte';
	import { svgConvertor, svgTrash } from '$lib/assets/svgs';
	import { modifierRegistry } from '$lib/parsers/modifiers';
	import {
		extractModifierExpressionValues,
		splitExpressionIntoValueAndModifiers
	} from '$lib/parsers/resolver';

	let isDeleting = $state(false);
	let deleteDuration = 300;

	interface Props {
		index: number;
		row?: { id: string; key: string; valueTemplate: string };
		onModifierClick?: () => void;
		onTrashClick?: () => void;
	}

	let {
		index,
		row = $bindable({ id: '', key: '', valueTemplate: '' }),
		onModifierClick,
		onTrashClick
	}: Props = $props();

	let isHmac = $state(false);

	// Use the function directly; if the function is typed correctly,
	// $derived will inherit that return type automatically.
	let modifiers = $derived(
		row.valueTemplate ? splitExpressionIntoValueAndModifiers(row.valueTemplate).modifiers : []
	);

	// 2. Map them to component constructors
	let activeComponents = $derived(
		modifiers.flatMap((mod) => {
			const extracted = extractModifierExpressionValues(mod);
			if (!extracted) return [];

			const component = modifierRegistry[extracted.name];

			// If the component doesn't exist in the registry, return empty array to filter it out
			if (!component) return [];

			return [component];
		})
	);
</script>

<div class="row" transition:fly={{ y: -48, duration: deleteDuration }}>
	<p class="number">{index + 1}</p>
	<div class="line-seperator"></div>
	<input class="input" bind:value={row.key} placeholder="key..." type="text" />
	<p class="seperator">:</p>

	{#each activeComponents as Component (Component.name + index)}
		<Component bind:template={row.valueTemplate} />
	{/each}

	{#if activeComponents.length === 0}
		<input class="input" bind:value={row.valueTemplate} placeholder="value..." />
	{/if}
	<IconButton
		svg={svgConvertor}
		iconSize="medium"
		sizeRem="2.5rem"
		style="color: var(--accent); margin-left: 0.5rem;"
		onclick={() => {
			isHmac = !isHmac;
			onModifierClick?.();
		}}
	/>
	<IconButton
		svg={svgTrash}
		iconSize="small"
		sizeRem="2.5rem"
		style="color: var(--accent); {isDeleting ? 'pointer-events: none; opacity: 0.5;' : ''}"
		onclick={() => onTrashClick?.()}
	/>
</div>

<style lang="sass">

.row
    display: flex
    align-items: center

    box-sizing: border-box
    padding: 0 .25rem 0 0

    width: 100%
    min-height: 3rem

    color: var(--semi-white)
    font-weight: 500

.input
    background: none
    outline: none

    color: var(--semi-white)
    flex: 1
    flex-basis: 0
    // height: 2.5rem
    // max-width: 15rem
    // width: 15rem
    // min-width: 15rem

    padding: .5rem .5rem
    box-sizing: border-box
    border: 1px solid transparent

    line-height: 1rem;
    letter-spacing: .06em;

    font-family: "Roboto Mono", monospace;


    border-radius: 2px

    &:hover
        backdrop-filter: brightness(.8)

.seperator
    display: flex
    align-items: center
    justify-content: center

    width: 1rem
    height: 100%

.line-seperator
    width: 2px
    height: 1.5rem
    margin: 0 .25rem 0 0
    align-self: center
    background: var(--primary)

.number
    display: flex
    align-items: center
    justify-content: center

    width: 2rem
    height: 2rem

    font-size: 12px

</style>
