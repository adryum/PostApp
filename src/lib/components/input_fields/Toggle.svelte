<script lang="ts">
	import { svgCheck } from '$lib/assets/svgs';
	import Icon from '../Icon.svelte';

	interface Props {
		checked?: boolean;
		label?: string;
	}

	let { checked = $bindable(false), label = $bindable('') }: Props = $props();
</script>

<label class="checkbox" for="button">
	<p>{label}</p>
	<input bind:checked id="button" type="checkbox" class="cube" />
	<Icon
		style="position: absolute; left: 1rem;  {checked
			? 'color: var(--accent);'
			: 'color: rgba(255, 255, 255, 0.05);'}"
		svg={svgCheck}
		size="small"
	/>
</label>

<style lang="scss">
	.checkbox {
		position: relative;
		display: flex;
		align-items: center;
		flex-direction: row-reverse;
		gap: 1rem;

		padding: 0.25rem 0.5rem;

		cursor: pointer;
        color: var(--semi-white);

        transition: 2s;

		p {
			margin-right: auto;
			font-size: 1rem;
		}

		.cube {
			width: 2rem;
			height: 2rem;

			background: transparent;
			border: 1px solid var(--primary);
			border-radius: 2px;
			cursor: pointer;

			-webkit-appearance: none;
			appearance: none;

			&:checked {
				border-color: var(--accent);
				// border-color: var(--primary);
			}
		}

		&:hover {
			backdrop-filter: brightness(1.2);
		}
	}
</style>
