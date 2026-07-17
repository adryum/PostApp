import HMACField from "$lib/components/input_fields/modifiers/HMACField.svelte";
import type { Component } from "svelte";
import { hmacModifier } from "./HMAC";

export interface VariableContext {
	environment: Record<string, string>;
	getters: Record<string, () => string | Promise<string>>;
    resolvedLowerOrderRequest?: string;
}

type Modifier = (value: string, ...args: string[]) => string | Promise<string>;

export const modifiers: Record<string, Modifier> = {
	uppercase: (v) => v.toUpperCase(),
	lowercase: (v) => v.toLowerCase(),
	trim: (v) => v.trim(),
	base64: (v) => btoa(v),
	hmac: (v, hasher, secretKey, hashPart, prefix, suffix) =>
		hmacModifier(v, hasher, secretKey, hashPart as 'value' | 'body' | 'headers' | 'request', prefix, suffix)
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const modifierRegistry: Record<string, Component<any>> = {
	hmac: HMACField
};