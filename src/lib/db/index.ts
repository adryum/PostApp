import { createDrizzleProxy, Database, migrate } from 'tauri-plugin-libsql-api';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

const migrations = import.meta.glob<string>('./drizzle/*.sql', {
	eager: true,
	query: '?raw',
	import: 'default'
});

export let db: ReturnType<typeof drizzle>;

export async function initDb() {
    await Database.load({ path: 'sqlite:postapp.db' }); 
	await migrate('sqlite:postapp.db', migrations);
	db = drizzle(createDrizzleProxy('sqlite:postapp.db'), { schema });
	return db;
}