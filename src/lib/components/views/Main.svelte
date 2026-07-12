<script lang="ts">
	import SideNavbar from '../navigation/SideNavbar.svelte';
	import Select from '../Select.svelte';
	import KeyValueList from '../lists/KeyValueList.svelte';
	import IconTextButton from '../buttons/IconTextButton.svelte';
	import { svgAdd, svgSave, svgShipSend, svgTrash } from '$lib/assets/svgs';
	import IconButton from '../buttons/IconButton.svelte';
	import { processRequest } from '../../../generated';

	interface SendReadyRequest {
		url: string;
		request_type: string;
		headers: [string, string][];
		body: [string, string][];
		body_type: 'json' | 'form' | 'raw' | 'multipart' | 'none';
		raw_body: string | undefined; // used when body_type == "raw"
		files: FileField[];
		connection_timeout_ms?: number | undefined;
		timeout_ms?: number | undefined;
	}

	interface FileField {
		field_name: string;
		file_name: string;
		mime_type: string;
		// base64-encoded bytes from the frontend, since JSON can't carry raw binary
		data_base64: string;
	}

	let typeOptions = [
		{
			value: '0',
			label: 'GET',
			style: { color: 'var(--get)', backgroundColor: 'transparent' }
		},
		{
			value: '1',
			label: 'POST',
			style: { color: 'var(--post)', backgroundColor: 'transparent' }
		},
		{
			value: '2',
			label: 'PUT',
			style: { color: 'var(--put)', backgroundColor: 'transparent' }
		},
		{
			value: '3',
			label: 'DELETE',
			style: { color: 'var(--delete)', backgroundColor: 'transparent' }
		}
	];

	let url = $state('https://10.200.70.254:8080/webhook/comp/project');
	let typeValue = $state('0');
	let selectedOption = $derived(typeOptions.find((opt) => opt.value === typeValue));
	let headers: { id: string; key: string; value: string }[] = $state([]);
	let body: { id: string; key: string; value: string }[] = $state([]);
	let requestResult = $state('');

	let isSending = $state(false);

	let tabs = ['Content', 'Options'];
	let currentTab = $state(tabs[0]);

	function selectTab(tab: string) {
		currentTab = tab;
	}

	async function onSend() {
		isSending = true;
		let result = await sendRequest(prepeareForSending());
		console.log(JSON.stringify(result, null, 4));
		requestResult = result || 'Null was returned';
		isSending = false;
	}

	function prepeareForSending(): SendReadyRequest {
		if (!url || !selectedOption) {
			throw new Error('Invalid request parameters');
		}

		return {
			url: url.trim(),
			request_type: selectedOption.label.trim(),
			headers: headers
				.filter((h) => !!h.key.trim() && !!h.value.trim())
				.map((h) => [h.key.trim(), h.value.trim()]),
			body: body
				.filter((b) => !!b.key.trim() && !!b.value.trim())
				.map((b) => [b.key.trim(), b.value.trim()]),
			body_type: 'json',
			raw_body: undefined,
			files: [],
			connection_timeout_ms: 5 * 1000,
			timeout_ms: undefined
		};
	}

	async function sendRequest(request: SendReadyRequest): Promise<string> {
		try {
			const result = await processRequest({ request });
			return result;
		} catch (error) {
			console.error('Request failed front:', error);
			return String(error);
		}
	}
</script>

<div class="container">
	<div class="side">
		<SideNavbar class="side" />
	</div>
	<!-- <div class="top">
		<TopNavbar class="top" />
	</div> -->
	<div class="pages">
		<button class="page" class:selected={true}>
			[ Untitled ]
			<IconButton iconSize="small" svg={svgTrash} />
		</button>
		<IconButton iconSize="small" svg={svgAdd} />
	</div>
	<div class="header">
		<Select bind:value={typeValue} color={selectedOption?.style.color} options={typeOptions} />
		<input class="input" bind:value={url} placeholder="URL..." type="text" name="" id="" />
		<IconTextButton label="Save" svg={svgSave} swapIcons={true} />
		<IconTextButton
			label="Send"
			svg={svgShipSend}
			isLoading={isSending}
			swapIcons={true}
			important={true}
			onclick={onSend}
		/>
	</div>
	<div class="main">
		<div id="this" class="tabs">
			{#each tabs as tab (tab)}
				<button class="tab" class:selected={currentTab === tab} onclick={() => selectTab(tab)}
					>{tab}</button
				>
			{/each}
			<!-- <div class="tab-filler"></div> -->
		</div>
		<KeyValueList label="Headers" bind:rows={headers} />
		<KeyValueList label="Body" bind:rows={body} />
	</div>

	<div class="output">
		{#if requestResult}
			<pre class="pre"><code class="code">{requestResult}</code></pre>
		{/if}
	</div>
</div>

<style lang="scss">
	.tabs {
		display: flex;

		height: 2rem;
		background-color: var(--secondary);

		.tab {
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: transparent;
			color: var(--semi-white);
			cursor: pointer;
			box-sizing: border-box;
			transition: 0.15s;

			font-family: 'Roboto Mono', monospace;
			font-size: 12px;
			letter-spacing: 0.02em;

			flex: 1;

			border: 1px solid transparent;
			border-bottom: 1px solid var(--secondary);

			&:hover {
				backdrop-filter: brightness(1.2);
			}

			&.selected {
				background-color: var(--primary);
			}
		}

		.tab-filler {
			width: 100%;
			border-bottom: 1px solid var(--secondary);
		}
	}

	.pre {
		margin: 0;
		white-space: pre-wrap; /* Keeps tabs but wraps long strings naturally */
		word-wrap: break-word;
		font-size: 0.9rem;
		line-height: 1.5rem;
		font-family: 'Roboto Mono', monospace;
		color: var(--semi-white);
	}
	.code {
		font-family: inherit;
		color: inherit;
	}
	.output {
		grid-area: output;
		background: var(--black);
		padding: 1rem;
	}

	.pages {
		grid-area: pages;
		background: var(--secondary);

		display: flex;
		align-items: center;
		gap: 0.5rem;
		box-sizing: border-box;

		width: 100%;
		height: 3rem;

		color: #d3d3d2;
		font-weight: 500;
	}
	.page {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid transparent;
		background-color: var(--primary);
		height: 100%;
		padding: 0 0.5rem 0 1rem;
		border-bottom: 1px solid var(--secondary);
		color: var(--semi-white);

		font-family: 'Roboto Mono', monospace;

		&.selected {
			border-bottom: 1px solid var(--accent);
		}
	}
	.container {
		display: grid;
		grid-template-rows: 3rem 3rem 1fr;
		grid-template-columns: 4rem 1fr 1fr;
		grid-template-areas:
			'side pages pages'
			'side header header'
			'side main output';
		width: 100%;
		height: 100vh;
		margin: 0;
	}

	.side {
		grid-area: side;
	}
	// .top
	//     grid-area: top

	.main {
		grid-area: main;

		display: flex;
		flex-direction: column;

		background: var(--secondary);

		border-right: 1px solid var(--primary);
		border-top: 1px solid var(--secondary);
	}

	.header {
		grid-area: header;
		background: var(--primary);

		display: flex;
		align-items: center;
		gap: 0.5rem;

		padding: 0 0.5rem 0 0.5rem;
		box-sizing: border-box;

		width: 100%;
		height: 3rem;

		color: #d3d3d2;
		font-weight: 500;
	}
	.input {
		background: none;
		outline: none;

		color: var(--semi-white);
		flex: 1;
		// height: 2.5rem

		padding: 0.5rem 0.5rem;
		box-sizing: border-box;
		border: 1px solid transparent;

		line-height: 1rem;
		letter-spacing: 0.06em;

		font-family: 'Roboto Mono', monospace;

		border-radius: 2px;

		&:hover {
			backdrop-filter: brightness(0.8);
		}
	}

	.seperator {
		display: flex;
		align-items: center;
		justify-content: center;

		width: 1rem;
		height: 100%;
	}
	.line-seperator {
		width: 2px;
		height: 1.5rem;
		margin: 0 0.25rem 0 0;
		align-self: center;
		background: var(--primary);
	}
	.number {
		display: flex;
		align-items: center;
		justify-content: center;

		aspect-ratio: 1 / 1;
		height: 100%;
	}
</style>
