export async function hmacModifier(
	value: string,
	hasher: string,
	secretKey: string,
	prefix = '',
	suffix = ''
): Promise<string> {
	const algo = hasher === 'sha512' ? 'SHA-512' : 'SHA-256';

	const keyData = new TextEncoder().encode(secretKey);
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: algo },
		false,
		['sign']
	);

	const messageData = new TextEncoder().encode(value);
	const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

	const hexSignature = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return `${prefix}${hexSignature}${suffix}`;
}