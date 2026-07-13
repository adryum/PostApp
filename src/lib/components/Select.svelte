<script lang="ts">
	import { svgChevronDown } from '$lib/assets/svgs';
	import Icon from './Icon.svelte';

	interface Option {
		value: string;
		label: string;
		style: {
			color: string;
			backgroundColor: string;
		};
	}

	interface Props {
		options: Option[];
		value?: string;
		placeholder?: string;
		color?: string;
	}

	let {
		options,
		value = $bindable(''),
		color = $bindable('var(--semi-white)'),
		placeholder = 'Select an option'
	}: Props = $props();

	let isOpen = $state(false);
	let containerEl: HTMLDivElement;

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? placeholder);

	function toggleOpen() {
		isOpen = !isOpen;
	}

	function selectOption(opt: Option) {
		value = opt.value;
		isOpen = false;
		color = opt.style.color;
	}

	function handleWindowClick(e: MouseEvent) {
		if (isOpen && containerEl && !containerEl.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') isOpen = false;
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<div class="container" bind:this={containerEl}>
	<button
		class="head"
		type="button"
		class:open={isOpen}
		style="color: {color}"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		onclick={toggleOpen}
	>
		{selectedLabel}
		<Icon svg={svgChevronDown} size="small" style={isOpen ? 'transform: rotate(180deg);' : ''} />
	</button>

	{#if isOpen}
		<div class="list" role="listbox">
			{#each options as opt (opt.value)}
				<button
					class="item"
					class:same-as-selected={opt.value === value}
					style="color: {opt.style.color}; background-color: {opt.style.backgroundColor};"
					onclick={() => selectOption(opt)}
					role="option"
					aria-selected={opt.value === value}
				>
					{opt.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style lang="sass">
.container
    position: relative
    display: flex

    min-width: 7rem

    font-family: "Roboto Mono", monospace;
    letter-spacing: .06em

.head
    position: relative;
    display: flex;
    justify-content: space-between;

    background: var(--secondary)
    width: 100%;
    box-sizing: border-box;
    text-align: left;

    color: var(--semi-white);

    padding: .5rem .5rem .5rem  1rem;
    border: 1px solid transparent;
    // border-color: transparent transparent rgba(0, 0, 0, 0.1) transparent;
    cursor: pointer;
    user-select: none;

    border-radius: 2px;
    font-family: inherit;
    letter-spacing: inherit;
    line-height: 1rem;

    &.open
        border-radius: 2px 2px 0 0;
        background-color: var(--secondary);
        border-bottom: 1px solid var(--primary);


.head:focus-visible,
.item:focus-visible 
    outline: 2px solid #fff;
    outline-offset: -2px;

.list
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--secondary);
    border-radius: 0 0 2px 2px;
    box-shadow: 0 0 4px color-mix(in srgb, var(--black) 30%, transparent);
    // border: 1px solid var(--black);
    // border-top: none

    z-index: 99;


.item
    width: 100%
    color: #fff;
    padding: 8px 16px;
    border: 1px solid transparent;
    border-color: transparent transparent rgba(0, 0, 0, 0.1) transparent;
    cursor: pointer;
    user-select: none;

    text-align: left;

    font-family: "Roboto Mono", monospace;
    letter-spacing: .06em

    transition: .15s


    &:hover
        background-color: var(--primary) !important;

    &.same-as-selected
        background-color: var(--primary) !important
</style>
