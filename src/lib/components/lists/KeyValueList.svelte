<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	import IconButton from '../buttons/IconButton.svelte';
	import IconTextButton from '../buttons/IconTextButton.svelte';
	import { svgAdd, svgChevronDown, svgConvertor, svgTrash } from '$lib/assets/svgs';

	let isExpanded = $state(false);
	let isDeleting = $state(false);
	let deleteDuration = 300;

	interface Props {
		label: string;
		rows?: { id: string; key: string; value: string }[];
	}

	let { label, rows = $bindable([]) }: Props = $props();
	function addRow() {
		rows.push({ id: crypto.randomUUID(), key: '', value: '' });
		isExpanded = true;
	}

	function removeRow(index: number) {
		if (isDeleting) return; // Ignore rapid clicks

		isDeleting = true;
		rows.splice(index, 1);

		// Match this timeout exactly to your animation duration (e.g., 300ms)
		setTimeout(() => {
			isDeleting = false;
		}, 300);
	}
</script>

<div id="header" class="header">
	<label for="header">{label}</label>
	{#if rows.length > 0}
		<p class="row-count">{rows.length}</p>
	{/if}

	<IconTextButton svg={svgAdd} label="Import" style="margin-left: auto;" />
	<IconTextButton svg={svgAdd} label="Add" onclick={addRow} />

	<IconButton
		svg={svgChevronDown}
		iconSize="small"
		sizeRem="2rem"
		onclick={() => (isExpanded = !isExpanded)}
		iconStyle="color: #F29247; {isExpanded ? 'transform: rotate(180deg);' : ''}"
	/>
</div>

{#if isExpanded}
	<div class="rows-list" transition:slide={{ duration: deleteDuration }}>
		{#each rows as row, i (row.id)}
			<div
				class="row"
				animate:flip={{ duration: deleteDuration }}
				transition:fly={{ y: -48, duration: deleteDuration }}
			>
				<p class="number">{i + 1}</p>
				<div class="line-seperator"></div>
				<input class="input" bind:value={row.key} placeholder="key..." type="text" />
				<p class="seperator">:</p>
				<input class="input" bind:value={row.value} placeholder="value..." type="text" />
				<IconButton
					svg={svgConvertor}
					iconSize="medium"
					sizeRem="2.5rem"
					style="color: var(--accent);"
				/>
				<IconButton
					svg={svgTrash}
					iconSize="small"
					sizeRem="2.5rem"
					style="color: var(--accent); {isDeleting ? 'pointer-events: none; opacity: 0.5;' : ''}"
					onclick={() => removeRow(i)}
				/>
			</div>
		{/each}
	</div>
{/if}

<style lang="sass">
.header
    background: var(--primary)

    display: flex
    align-items: center
    gap: .5rem

    padding: 0 0.5rem 0 .75rem 
    box-sizing: border-box

    width: 100%
    height: 3rem

    color: #D3D3D2
    font-weight: 500

    z-index: 2

.row
    display: flex
    align-items: center

    box-sizing: border-box
    padding: 0 .25rem 0 0

    width: 100%
    height: 3rem

    color: var(--semi-white)
    font-weight: 500

    // border-bottom: 1px solid var(--black)

.input
    background: none
    outline: none

    color: var(--semi-white)
    flex: 1
    // height: 2.5rem

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

    aspect-ratio: 1 / 1
    height: 100%

.row-count
    display: flex
    align-items: center
    justify-content: center

    color: var(--accent)
    border-radius: 4px
    background: var(--secondary)
    width: 1.75rem
    height: 1.75rem
</style>
