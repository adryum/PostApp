<script module lang="ts">
	export interface Request {
		url: string;
		method: string;
		headers: [string, string][];
		body: [string, string][];
		acceptInvalidCerts: boolean;
	}
</script>

<script lang="ts">
	import SideNavbar from '../navigation/SideNavbar.svelte';
	import Select from '../input_fields/dropdowns/Select.svelte';
	import KeyValueList from '../lists/KeyValueList.svelte';
	import IconTextButton from '../buttons/IconTextButton.svelte';
	import { svgAdd, svgSave, svgShipSend, svgTrash } from '$lib/assets/svgs';
	import IconButton from '../buttons/IconButton.svelte';
	import { processRequest } from '../../../generated';
	import { getHeaderFields, overwriteHeaderFields } from '$lib/db/queries/header_fields';
	import { onMount } from 'svelte';
	import { getRequest, insertOrUpdateRequest } from '$lib/db/queries/requests';
	import { getBodyFields, overwriteBodyFields } from '$lib/db/queries/body_fields';
	import Toggle from '../input_fields/Toggle.svelte';
	import { resolveTemplate, type ResolverOptions } from '$lib/parsers/resolver';
	import type { VariableContext } from '$lib/parsers/modifiers';
	import { getRepositories } from '$lib/db/queries/repositories';

	interface Page {
		id: string;
		repositoryId: string;
		name: string;
		isSending: boolean;
	}

	interface RawRequest {
		url: string;
		method: string;
		headers: { id: string; key: string; valueTemplate: string }[];
		body: { id: string; key: string; valueTemplate: string }[];
		acceptInvalidCerts: boolean;
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

	let rawRequest = $state<RawRequest>({
		url: '',
		method: '',
		headers: [],
		body: [],
		acceptInvalidCerts: false
	});

	let page = $state<Page>({
		id: 'default-request-id',
		repositoryId: 'default-repo-id',
		name: 'test-request',
		isSending: false
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let sentToRust = $state<any>({});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let resolvedHigherOrder = $state<any>({});
	let resolvedLowerOrder = $state<Request | null>(null);
	let response = $state('');

	let tabs = ['Content', 'Options'];
	let outputTabs = [
		'Response',
		'Sent to Rust',
		'Raw request',
		'LowerOrder result',
		'HigherOrder result'
	];
	let currentTab = $state(tabs[0]);
	let currentOutputTab = $state(outputTabs[0]);
	let methodValue = $state('0');
	let methodOption = $derived(typeOptions.find((opt) => opt.value === methodValue));

	let outputContent = $derived.by(() => {
		switch (currentOutputTab) {
			case outputTabs[0]:
				return JSON.stringify(response, null, 2).trim();
			case outputTabs[1]:
				return JSON.stringify(sentToRust, null, 2);
			case outputTabs[2]:
				return JSON.stringify(rawRequest, null, 2).trim();
			case outputTabs[3]:
				return JSON.stringify(resolvedLowerOrder, null, 2);
			case outputTabs[4]:
				return JSON.stringify(resolvedHigherOrder, null, 2);
		}
	});

	$effect(() => {
		rawRequest.method = methodOption?.label || '';
	});

	$effect(() => {
		if (rawRequest) {
			resolveRequest(formatToRequest(rawRequest)).then();
		}
	});

	function formatToRequest(rawRequest: RawRequest): Request {
		return {
			url: rawRequest.url,
			method: rawRequest.method,
			headers: rawRequest.headers.map((hf) => [hf.key, hf.valueTemplate]),
			body: rawRequest.body.map((bf) => [bf.key, bf.valueTemplate]),
			acceptInvalidCerts: rawRequest.acceptInvalidCerts
		};
	}

	async function resolveRequest(request: Request): Promise<Request> {
		const ctx: VariableContext = {
			environment: {
				baseUrl: 'https://api.example.com',
				mySecretVar: 'abc123xyz',
				authToken: 'Bearer eyJ...'
			},
			getters: {
				now: () => new Date().toISOString()
			},
			resolvedLowerOrderRequest: undefined
		};

		const options: ResolverOptions = {
			skipHigherOrder: true
		};

		const resolvedRequest: Request = {
			url: '',
			method: '',
			headers: [],
			body: [],
			acceptInvalidCerts: false
		};

		resolvedRequest.url = await resolveTemplate(request.url, ctx, options);
		resolvedRequest.method = request.method;
		resolvedRequest.acceptInvalidCerts = request.acceptInvalidCerts;

		for (const [key, value] of request.headers) {
			resolvedRequest.headers.push([
				await resolveTemplate(key, ctx, options),
				await resolveTemplate(value, ctx, options)
			]);
		}

		for (const [key, value] of request.body) {
			resolvedRequest.body.push([
				await resolveTemplate(key, ctx, options),
				await resolveTemplate(value, ctx, options)
			]);
		}

		resolvedLowerOrder = { ...resolvedRequest };

		if (options.containsHigherOrder) {
			options.skipHigherOrder = false;
			ctx.resolvedLowerOrderRequest = JSON.stringify(resolvedRequest);

			resolvedRequest.url = await resolveTemplate(resolvedRequest.url, ctx, options);

			const headerSnapshot = [...resolvedRequest.headers];
			resolvedRequest.headers = [];
			for (const [key, value] of headerSnapshot) {
				resolvedRequest.headers.push([
					await resolveTemplate(key, ctx, options),
					await resolveTemplate(value, ctx, options)
				]);
			}

			const bodySnapshot = [...resolvedRequest.body];
			resolvedRequest.body = [];
			for (const [key, value] of bodySnapshot) {
				resolvedRequest.body.push([
					await resolveTemplate(key, ctx, options),
					await resolveTemplate(value, ctx, options)
				]);
			}
		}

		resolvedHigherOrder = { ...resolvedRequest };
		return resolvedRequest;
	}

	function selectTab(tab: string) {
		currentTab = tab;
	}

	async function send() {
		page.isSending = true;
		try {
			const resolvedRequest = await resolveRequest(formatToRequest(rawRequest));
			const payloadObj = Object.fromEntries(resolvedRequest.body);
			const payload = JSON.stringify(payloadObj);
			sentToRust = {
				url: resolvedRequest.url,
				method: resolvedRequest.method,
				accept_invalid_certs: resolvedRequest.acceptInvalidCerts,
				headers: resolvedRequest.headers,
				body: resolvedRequest.body,
				body_type: 'raw',
				raw_body: payload,
				files: [],
				connection_timeout_ms: null,
				timeout_ms: null
			};
			response = await processRequest({
				request: sentToRust
			});

			console.log(JSON.stringify(response, null, 4));
		} catch (error) {
			response = String(error);
			console.error('Request failed front:', error);
		} finally {
			page.isSending = false;
		}
	}

	async function load(requestId: string) {
		const request = await getRequest(requestId);
		const headerFields = await getHeaderFields(requestId);
		const bodyFields = await getBodyFields(requestId);

		methodValue = typeOptions.find((opt) => opt.label === request?.method)?.value || '0';
		rawRequest = {
			url: request?.url || '',
			method: request?.method || '',
			headers: headerFields.map((hf) => ({
				id: hf.id,
				key: hf.key,
				valueTemplate: hf.value
			})),
			body: bodyFields.map((bf) => ({
				id: bf.id,
				key: bf.key,
				valueTemplate: bf.value
			})),
			acceptInvalidCerts: request?.acceptInvalidCerts === 1
		};

		// console.log(rawRequest);
	}

	async function save() {
		page.id ??= 'default-request-id';

		console.log('reps: ');

		console.log(await getRepositories());

		await insertOrUpdateRequest({
			id: page.id,
			name: page.name,
			createdAt: new Date().getTime(),
			repositoryId: page.repositoryId,
			url: rawRequest.url,
			method: rawRequest.method,
			updatedAt: new Date().getTime(),
			acceptInvalidCerts: rawRequest.acceptInvalidCerts ? 1 : 0
			// bodyType?: string | undefined;
			// rawBody?: string | null | undefined;
			// timeoutMs?: number | null | undefined;
			// connectionTimeoutMs?: number | null | undefined;
			// sortOrder?: number | undefined;
		});
		await overwriteHeaderFields(
			page.id,
			rawRequest.headers.map((h) => ({
				id: h.id || crypto.randomUUID(),
				requestId: page.id,
				key: h.key,
				value: h.valueTemplate,
				sortOrder: rawRequest.headers.indexOf(h)
			}))
		);
		await overwriteBodyFields(
			page.id,
			rawRequest.body.map((b) => ({
				id: b.id || crypto.randomUUID(),
				requestId: page.id,
				key: b.key,
				value: b.valueTemplate,
				sortOrder: rawRequest.body.indexOf(b)
			}))
		);
		console.log('saved');
	}
	let leftWidth = $state(50); // Using Svelte 5 rune for reactivity

    let isDragging = $state(false);

    let containerEl = $state<HTMLElement | null>(null);
	function startDragging() {
		isDragging = true;
	}

	function onPointerMove(e) {
		if (!isDragging || !containerEl) return;

		// 1. Get the container's position on the screen
		const rect = containerEl.getBoundingClientRect();

		// 2. Calculate mouse position RELATIVE to the container
		const x = e.clientX - rect.left;

		// 3. Calculate percentage based on container width
		const newLeftWidth = (x / rect.width) * 100;

		// 4. Constrain between 10% and 90%
		if (newLeftWidth > 10 && newLeftWidth < 90) {
			leftWidth = newLeftWidth;
		}
	}

	function stopDragging() {
		isDragging = false;
	}

	onMount(async () => {
		load(page.id);
	});
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={stopDragging} />

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
		<Select bind:value={methodValue} color={methodOption?.style.color} options={typeOptions} />
		<input
			class="input"
			bind:value={rawRequest.url}
			placeholder="URL..."
			type="text"
			name=""
			id=""
		/>
		<IconTextButton label="Save" svg={svgSave} swapIcons={true} onclick={save} />
		<IconTextButton
			label="Load"
			svg={svgSave}
			swapIcons={true}
			onclick={() => load(page?.id || 'default-request-id')}
		/>
		<IconTextButton
			label="Send"
			svg={svgShipSend}
			isLoading={page.isSending}
			swapIcons={true}
			important={true}
			onclick={send}
		/>
	</div>

	<div class="main" bind:this={containerEl}>
		<div class="values" style="flex: {leftWidth}%">
			<div id="this" class="tabs">
				{#each tabs as tab (tab)}
					<button class="tab" class:selected={currentTab === tab} onclick={() => selectTab(tab)}>
						{tab}
					</button>
				{/each}
				<!-- <div class="tab-filler"></div> -->
			</div>
			{#if currentTab === 'Options'}
				<div class="options-list">
					<Toggle
						bind:checked={rawRequest.acceptInvalidCerts}
						label="Accept Invalid Certificates"
					/>
				</div>
			{/if}
			{#if currentTab === 'Content'}
				<KeyValueList label="Headers" bind:rows={rawRequest.headers} />
				<KeyValueList label="Body" bind:rows={rawRequest.body} />
			{/if}
		</div>
		<div class="handle" onpointerdown={startDragging}></div>

		<div class="output" style="flex: {100 - leftWidth}%">
			<ol class="output-list">
				{#each outputTabs as tab (tab)}
					<button
						class="output-tab"
						class:selected={currentOutputTab === tab}
						onclick={() => (currentOutputTab = tab)}
					>
						{tab}
					</button>
				{/each}
			</ol>
			<pre class="pre"><code class="code">{outputContent}</code></pre>
		</div>
	</div>
</div>

<style lang="scss">
	.output-list {
		margin: 0;
		padding: 0;
		display: flex;
		gap: 1px;
		height: 2rem;

		background: var(--secondary);
		border: 1px solid transparent;
		// border-top: 1px solid var(--secondary);
	}
	.output-tab {
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

		&:hover {
			backdrop-filter: brightness(1.2);
		}

		&.selected {
			background-color: var(--primary);
		}
	}
	.options-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-top: 1px solid var(--primary);

		// padding: 0.5rem 1rem;
	}
	.tabs {
		display: flex;
		gap: 1px;

		height: 2rem;
		border: 1px solid transparent;
		border-left: 0;
		// border-right: 1px solid var(--primary);

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

			&:hover {
				backdrop-filter: brightness(1.2);
			}

			&.selected {
				background-color: var(--primary);
			}
		}
	}

	.pre {
		display: block; /* Forces it to take up the full available width */
		margin: 0;
		white-space: pre-wrap; /* Keeps tabs but wraps long strings naturally */
		word-wrap: break-word;
		font-size: 0.9rem;
		line-height: 1.5rem;
		font-family: 'Roboto Mono', monospace;
		color: var(--semi-white);
		padding: 0.5rem;

		border-top: 1px solid var(--primary);
		border-left: 0;
		box-sizing: border-box;
		min-width: 0;
        min-height: 0;
        height: calc(100vh - 8rem);
		overflow-y: auto;
	}
	.code {
		display: block; /* Forces it to take up the full available width */
		width: 100%;
		font-family: inherit;
		color: inherit;
	}
	.output {
		grid-area: output;
		background: var(--black);
		border-right: 1px solid var(--primary);
		min-width: 0;
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
		grid-template-columns: 4rem 1fr;
		grid-template-areas:
			'side pages'
			'side header'
			'side main';
		width: 100%;
		height: 100vh;
        min-height: 0;
		max-height: 100vh;
		margin: 0;
	}

	.side {
		grid-area: side;
	}
	.main {
		grid-area: main;
		display: flex;

		width: calc(100vw - 4rem);
		user-select: none;
	}
	.handle {
		width: 2px;
		cursor: col-resize;
		background-color: var(--primary);
		touch-action: none; /* Prevents browser scroll on touch */
	}
	.values {
		display: flex;
		flex-direction: column;

		background: var(--secondary);

		// border-right: 1px solid var(--primary);
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
