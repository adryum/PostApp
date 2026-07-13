<script lang="ts">
	import Select from '$lib/components/Select.svelte';

	interface Props {
		containerClass?: string;
		template: string;
	}

	let { containerClass = '', template = $bindable('') }: Props = $props();

	let prefix = $state('');
	let suffix = $state('');
	let value = $state('');

	$effect(() => {
		template = value;
	});

	function insertModifier(name: string, args: string) {
		value = value + ` | ${name}(${args})`;
	}

	function insertHmac() {
		const secret = prompt('Secret key variable name (e.g. mySecret):');
		if (!secret) return;
		insertModifier('hmac', `sha256, ${secret}`);
	}
</script>

<div class="modifier {containerClass}">
	<div class="header">
		<label for="">HMAC</label>
		<Select
			options={[
				{
					value: '0',
					label: 'SHA-256',
					style: { color: 'var(--semi-white)', backgroundColor: 'transparent' }
				},
				{
					value: '1',
					label: 'SHA-512',
					style: { color: 'var(--semi-white)', backgroundColor: 'transparent' }
				}
			]}
			// bind:value={prefix}
			placeholder="encryption"
		/>
	</div>
	<div class="input-row">
		<input class="input" bind:value={prefix} placeholder="prefix" type="text" />
		<input class="input main-input" bind:value placeholder="value..." type="text" />
		<input class="input" bind:value={suffix} placeholder="suffix" type="text" />
	</div>
</div>

<style lang="scss">
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-width: 0;
	}
	label {
		font-size: 1rem;
		color: var(--semi-white);
	}
	.row {
		display: flex;
		align-items: center;

		box-sizing: border-box;
		padding: 0 0.25rem 0 0;
		min-width: 0;

		color: var(--semi-white);
		font-weight: 500;
	}
	.modifier {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		flex: 1;
		// flex-basis: 0;
		// min-width: 15rem;
		// width: 15rem;
		// max-width: 15rem;

		padding: 0.5rem;
		box-sizing: border-box;

		background: var(--primary);

		// overflow: hidden;
	}
	.input-row {
		display: flex;
		gap: 0.5rem;
		min-width: 0;
	}

	.input {
		outline: none;

		color: var(--semi-white);
		flex: 1;
		min-width: 0;
        width: 0;
		flex-basis: 0;

		padding: 0.5rem 0.5rem;
		box-sizing: border-box;
		border: 1px solid transparent;
		background: var(--secondary);
		line-height: 1rem;
		letter-spacing: 0.06em;

		font-family: 'Roboto Mono', monospace;

		border-radius: 2px;

		&.main-input {
			// flex: 3 !important;
		}

		&:hover {
			backdrop-filter: brightness(0.8);
		}
	}
</style>
