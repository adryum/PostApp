<script lang="ts">
	import Select from '$lib/components/input_fields/dropdowns/Select.svelte';
	import { onMount } from 'svelte';
	import InputDropdown from '../dropdowns/InputDropdown.svelte';

	interface Props {
		containerClass?: string;
		template: string;
	}

	let hashOptions = [
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
	];

	let hashPartOptions = [
		{
			value: '{{ body }}',
			label: 'body',
			style: { color: 'var(--semi-white)', backgroundColor: 'transparent' }
		},
		{
			value: '{{ headers }}',
			label: 'headers',
			style: { color: 'var(--semi-white)', backgroundColor: 'transparent' }
		},
		{
			value: '{{ request }}',
			label: 'request',
			style: { color: 'var(--semi-white)', backgroundColor: 'transparent' }
		}
	];

	let { containerClass = '', template = $bindable('') }: Props = $props();

	let childRef: InputDropdown;
	let secret = $state('');
	let prefix = $state('');
	let suffix = $state('');

	let hashValue = $state('0');
	let hashLabel = $derived(hashOptions.find((o) => o.value === hashValue)?.label || 'SHA-256');

	let hashPartValue = $state('');
	let hashPart = $derived(hashPartOptions.find((o) => o.value === hashPartValue)?.label || 'value');
	let value = $derived(hashPart === 'value' ? hashPartValue : '');

	function loadFromTemplate(templateStr: string) {
		if (!template) return;

		// 1. Extract content inside hmac(...)
		const contentMatch = templateStr.match(/hmac\((.*)\)/);

		if (contentMatch) {
			// 2. Split by comma and trim whitespace
			// This handles "a, , c" correctly as ["a", "", "c"]
			const args = contentMatch[1].split(',').map((s) => s.trim());

			// Now you can safely access arguments by index
			// If an arg is missing, it will be undefined or empty string
			hashValue = hashOptions.find((o) => o.label === args[0])?.value || '0';
			secret = args[1] || '';

			// Handle hashPart logic
			let hashPartOption = hashPartOptions.find((o) => o.value === `{{ ${args[2] || ''} }}`);
			if (hashPartOption) {
				childRef.selectOption(hashPartOption);
			}

			prefix = args[3] || '';
			suffix = args[4] || '';

			console.log('Loaded args:', args);
		} else {
			console.warn('Template does not match hmac(...) pattern');
		}
	}

	onMount(() => {
		loadFromTemplate(template);
	});

	$effect(() => {
		template = `{{ ${value} | hmac(${hashLabel}, ${secret}, ${hashPart}, ${prefix}, ${suffix}) ${hashPart !== 'value' ? '| higherOrder' : ''} }}`;
	});
</script>

<div class="modifier {containerClass}">
	<div class="header">
		<label for="">HMAC</label>
		<input class="input main-input" bind:value={secret} placeholder="secret..." type="text" />
		<Select bind:value={hashValue} options={hashOptions} placeholder="encryption" />
	</div>
	<div class="input-row">
		<input class="input" bind:value={prefix} placeholder="prefix" type="text" />
		<input class="input" bind:value={suffix} placeholder="suffix" type="text" />
		<InputDropdown
			bind:this={childRef}
			hint="value..."
			bind:value={hashPartValue}
			options={hashPartOptions}
		/>
	</div>
</div>

<style lang="scss">
	.header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
