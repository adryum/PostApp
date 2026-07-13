import { hmacModifier } from "./HMAC";

export interface VariableContext {
	environment: Record<string, string>;
	getters: Record<string, () => string | Promise<string>>;
}

type Modifier = (value: string, ...args: string[]) => string | Promise<string>;

export const modifiers: Record<string, Modifier> = {
	uppercase: (v) => v.toUpperCase(),
	lowercase: (v) => v.toLowerCase(),
	trim: (v) => v.trim(),
	base64: (v) => btoa(v),
	hmac: (v, hasher, secretKey, prefix, suffix) =>
		hmacModifier(v, hasher, secretKey, prefix, suffix)
};
