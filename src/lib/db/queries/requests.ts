import { eq, sql } from "drizzle-orm/sql";
import { db } from "..";
import * as schema from '../schema';
import { getTableColumns } from "drizzle-orm/utils";

export type PostRequestModel = typeof schema.requests.$inferInsert
const columns = getTableColumns(schema.requests);

const set = Object.keys(columns).reduce((acc, key) => {
  acc[key as keyof typeof columns] = sql`excluded.${sql.raw(columns[key as keyof typeof columns].name)}`;
  return acc;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}, {} as any);

export async function getRequest(requestId: string) {
    const [row] = await db
        .select()
        .from(schema.requests)
        .where(eq(schema.requests.id, requestId));
    return row;
}

export async function getRequests() {
    return await db
        .select()
        .from(schema.requests)
}

export async function insertOrUpdateRequest(data: PostRequestModel) {
    try {
        await db.insert(schema.requests).values(data).onConflictDoUpdate({
            target: schema.requests.id,
            set: set
        });
    } catch (err) {
        console.error('Error occurred while posting request:', err);
    }
}

