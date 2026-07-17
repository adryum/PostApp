<script lang="ts">
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	import IconButton from '../buttons/IconButton.svelte';
	import IconTextButton from '../buttons/IconTextButton.svelte';
	import { svgAdd, svgChevronDown } from '$lib/assets/svgs';
	import KeyValueListRow from './KeyValueListRow.svelte';

	let isExpanded = $state(true);
	let isDeleting = $state(false);
	let deleteDuration = 300;

	interface Props {
		label: string;
		rows?: { id: string; key: string; valueTemplate: string }[];
	}

	let { label, rows = $bindable([]) }: Props = $props();
	function addRow() {
		rows.push({ id: crypto.randomUUID(), key: '', valueTemplate: '' });
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
			<div animate:flip={{ duration: deleteDuration }}>
				<KeyValueListRow bind:row={rows[i]} index={i} onTrashClick={() => removeRow(i)} />
			</div>
		{/each}
	</div>
{/if}

<style lang="sass">
.rows-list
    display: flex
    flex-direction: column
    gap: 1px
    margin: 1px
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
