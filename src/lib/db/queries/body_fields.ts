import { db } from "..";
import { eq, sql } from "drizzle-orm/sql";
import * as schema from '../schema';
import { getTableColumns } from "drizzle-orm";

type PostBodyFieldModel = typeof schema.bodyFields.$inferInsert
const columns = getTableColumns(schema.bodyFields);

export async function getBodyFields(requestId: string) {
    return db
        .select()
        .from(schema.bodyFields)
        .where(eq(schema.bodyFields.requestId, requestId))
        .orderBy(schema.bodyFields.sortOrder);
}

export async function insertOrUpdateBodyField(data: PostBodyFieldModel) {
    try {
        await db.insert(schema.bodyFields).values(data).onConflictDoUpdate({
            target: schema.bodyFields.id,
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

export async function insertOrUpdateBodyFields(data: PostBodyFieldModel[]) {
    try {
        await db.insert(schema.bodyFields).values(data).onConflictDoUpdate({
            target: schema.bodyFields.id,
            set: {
                requestId: sql`${columns.requestId}`,
                key: sql`${columns.key}`,
                value: sql`${columns.value}`,
                sortOrder: sql`${columns.sortOrder}`,
            }
        });
    } catch (err) {
        console.error(err);
    }
}

export async function overwriteBodyFields(requestId: string, data: PostBodyFieldModel[]) {
    try {
        await db.delete(schema.bodyFields).where(eq(schema.bodyFields.requestId, requestId));
        if (data.length > 0) 
            await db.insert(schema.bodyFields).values(data);
    } catch (err) {
        console.error(err);
    }
}