import { modifiers, type VariableContext } from "./modifiers";

export interface ResolverOptions {
    skipHigherOrder?: boolean;
    containsHigherOrder?: boolean;
}

async function resolveExpression(expr: string, ctx: VariableContext): Promise<string | undefined> {
    const filledExpression = findAndFillEnvironmentValues(expr, ctx);
    const { value, modifiers } = splitExpressionIntoValueAndModifiers(filledExpression);

    console.log("MODIFIERS:", modifiers);
    

    // if resolved request is available, that means its the second resolution, use request for resolution
    if (ctx.resolvedLowerOrderRequest) {
        return await resolveSteps(ctx.resolvedLowerOrderRequest, modifiers);
    } else {
        return await resolveSteps(value, modifiers);
    }
}

export async function resolveTemplate(
    template: string, 
    ctx: VariableContext, 
    options?: ResolverOptions
): Promise<string> {
	const matches = [...template.matchAll(/\{\{(.+?)\}\}/g)];
	let result = template;

	for (const match of matches) {
        // ditches {{ and }} giving only: 
        // value | modifier | modifier
        const expr = match[1].trim();

        // if this expression ends in "| skip", leave it completely untouched this pass
		if (options?.skipHigherOrder && /\|\s*higherOrder\s*(?:\}\})?\s*$/.test(expr)) {
            options.containsHigherOrder = true;
			continue; // don't touch this {{ }} at all — leave the raw text as-is
		}

		result = await resolveExpression(expr, ctx) || "";
	}
	return result;
}

export function splitExpressionIntoValueAndModifiers(tag: string): {
    value: string;
    modifiers: string[];
} {
    const trimmed = tag.trim();
    const withoutDoubleBraces = trimmed.startsWith('{{') && trimmed.endsWith('}}') ? trimmed.slice(2, -2) : trimmed;
    const parts = withoutDoubleBraces.split('|').map((p) => p.trim());

    const [rawHead, ...modifiers] = parts;
    let head = rawHead || "";

    if (head.startsWith('"') && head.endsWith('"')) {
        head = head.slice(1, -1);
    }

    return { value: head, modifiers: modifiers };
}

export function extractModifierExpressionValues(modifier: string): { 
    name: string,
    args: string[]
} {
    const trimmed = modifier.trim();
    const openingParenthesisIndex = trimmed.indexOf('(');
    const modifierName = openingParenthesisIndex === -1 
        ? trimmed 
        : trimmed.slice(0, openingParenthesisIndex);
    const argsPart = openingParenthesisIndex === -1 
        ? '' 
        : trimmed.slice(openingParenthesisIndex + 1, trimmed.lastIndexOf(')'));
    const args = argsPart
        ? argsPart.split(',').map((a) => a.trim().replace(/^["']|["']$/g, ''))
        : [];
    return { name: modifierName, args };
}

export function findAndFillEnvironmentValues(expression: string, ctx: VariableContext) {
    const varRegex = /\$([a-zA-Z_]\w*)/g;
    
    return expression.replace(varRegex, (match, strippedVarName) => {
        const envValue = ctx.environment[strippedVarName]
        if (envValue === undefined) {
            throw new Error(`Environment variable not found: ${strippedVarName}`);
        }
        return envValue;
    });
}

async function resolveSteps(value: string, steps: string[]): Promise<string | undefined> {
    let result = value;

    for (const step of steps) {
        const { name, args } = extractModifierExpressionValues(step);
        const modifier = modifiers[name];

        if (modifier) {
            try {
                // Update the result with the outcome of this step
                result = await modifier(result, ...args);
            } catch (error) {
                console.error(`Modifier ${name} failed, returning fallback:`, error);
                // Return your defined fallback value immediately
                return "FALLBACK";
            }
        } else {
            // Keep this throwing if the modifier itself is missing
            // throw new Error(`Modifier not found: ${name}`);
            console.log(`Modifier not found: ${name}`);
            
        }
    }

    return result;
}