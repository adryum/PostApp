import { db } from '..';
import { eq } from "drizzle-orm/sql";
import * as schema from '../schema';

type PostRepositoriesModel = typeof schema.repositories.$inferInsert

export async function getRepository(repositoryId: string) {
    const [row] = await db
        .select()
        .from(schema.repositories)
        .where(eq(schema.repositories.id, repositoryId));
    return row;
}

export async function getRepositories() {
    return await db
        .select()
        .from(schema.repositories)
}

export async function postRepository(data: PostRepositoriesModel) {
    try {
        await db
            .insert(schema.repositories)
            .values(data);
        const [repo] = await db
            .select()
            .from(schema.repositories)
            .where(eq(schema.repositories.id, data.id))
        return repo;
    } catch (err) {
        console.error('Error occurred while posting request:', err);
    }
}

export async function patchRepository( repositoryId: string, data: Partial<PostRepositoriesModel>) {
    try {
        await db
            .update(schema.repositories)
            .set(data)
            .where(eq(schema.repositories.id, repositoryId));
    } catch (err) {
        console.error('Error occurred while posting request:', err);
    }
}