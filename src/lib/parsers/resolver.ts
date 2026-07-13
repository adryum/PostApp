import { modifiers, type VariableContext } from "./modifiers";

async function resolveExpression(expr: string, ctx: VariableContext): Promise<string> {
	const parts = expr.split('|').map((p) => p.trim());
	const [head, ...pipeline] = parts;

	// figure out the starting value: quoted literal, or a variable lookup
	let value: string;
	if (/^".*"$/.test(head)) {
		value = head.slice(1, -1);
	} else {
		const fromEnv = ctx.environment[head];
		const fromGetter = ctx.getters[head] ? await ctx.getters[head]() : undefined;
		value = fromEnv ?? fromGetter ?? head;
	}

	// apply each modifier in the pipeline, left to right
	for (const step of pipeline) {
		const openParen = step.indexOf('(');
		const name = openParen === -1 ? step : step.slice(0, openParen);
		const argsPart = openParen === -1 ? '' : step.slice(openParen + 1, step.lastIndexOf(')'));

		const args = argsPart
			? argsPart.split(',').map((a) => a.trim().replace(/^["']|["']$/g, ''))
			: [];

		const modifier = modifiers[name];
		if (modifier) {
			value = await modifier(value, ...args);
		}
	}

	return value;
}

export async function resolveTemplate(template: string, ctx: VariableContext): Promise<string> {
	const matches = [...template.matchAll(/\{\{(.+?)\}\}/g)];
	let result = template;
	for (const match of matches) {
		const resolved = await resolveExpression(match[1].trim(), ctx);
		result = result.replace(match[0], resolved);
	}
	return result;
}