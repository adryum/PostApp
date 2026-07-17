import type { Request } from "$lib/components/views/Main.svelte";

export async function hmacModifier(
	value: string,
	hasher: string,
	secretKey: string,
    hashPart: 'body' | 'headers' | 'request' | 'value',
	prefix = '',
	suffix = '',
): Promise<string> {
    const algo = hasher === 'sha512' ? 'SHA-512' : 'SHA-256';

    if (secretKey === "") {
        throw new Error("Invalid HMAC secret key.");
    }

    let messageString: string;

	if (hashPart === 'value') {
		messageString = value;
	} else {
        if (!value) {
            throw new Error("Invalid HMAC request value. Serialized value expected.");
        }

		const request: Request = JSON.parse(value);

		if (hashPart === 'body') {
			messageString = JSON.stringify(Object.fromEntries(request.body));
            console.log(messageString);
            
		} else if (hashPart === 'headers') {
			messageString = JSON.stringify(Object.fromEntries(request.headers));
		} else {
			// hashPart === 'request' — hash the whole thing
			messageString = JSON.stringify(request);
		}
	}
    
	const keyData = new TextEncoder().encode(secretKey);
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: algo },
		false,
		['sign']
	);

	const messageData = new TextEncoder().encode(messageString);
	const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

	const hexSignature = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return `${prefix}${hexSignature}${suffix}`;
}