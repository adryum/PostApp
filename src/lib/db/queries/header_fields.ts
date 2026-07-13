import { eq, sql } from "drizzle-orm/sql";
import { db } from "..";
import * as schema from '../schema';
import { getTableColumns } from "drizzle-orm/utils";

type PostHeaderFieldModel = typeof schema.headerFields.$inferInsert
const columns = getTableColumns(schema.headerFields);

export async function getHeaderFields(requestId: string) {
    return db
        .select()
        .from(schema.headerFields)
        .where(eq(schema.headerFields.requestId, requestId))
        .orderBy(schema.headerFields.sortOrder);
}

export async function insertOrUpdateHeaderField(data: PostHeaderFieldModel) {
    try {
        await db.insert(schema.headerFields).values(data).onConflictDoUpdate({
            target: schema.headerFields.id,
            set: {
                requestId: sql`${columns.requestId}`,
                key: sql`${columns.key}`,
                value: sql`${columns.value}`,
                sortOrder: sql`${columns.sortOrder}`
            }
        });
    } catch (err) {
        console.error(err);
    }
}

export async function insertOrUpdateHeaderFields(data: PostHeaderFieldModel[]) {
    try {
        await db.insert(schema.headerFields).values(data).onConflictDoUpdate({
            target: schema.headerFields.id,
            set: {
                requestId: sql`${columns.requestId}`,
                key: sql`${columns.key}`,
                value: sql`${columns.value}`,
                sortOrder: sql`${columns.sortOrder}`
            }
        });
    } catch (err) {
        console.error(err);
    }
}

export async function overwriteHeaderFields(requestId: string, data: PostHeaderFieldModel[]) {
    try {
        await db.delete(schema.headerFields).where(eq(schema.headerFields.requestId, requestId));
        if (data.length > 0) 
            await db.insert(schema.headerFields).values(data);
    } catch (err) {
        console.error(err);
    }
}

export async function debugDb() {
    const val = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
    console.log(val);
}