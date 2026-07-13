import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	out: './src/lib/db/drizzle',
	dialect: 'sqlite'
});