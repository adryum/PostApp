import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const repositories = sqliteTable('repositories', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: integer('created_at').notNull()
});

export const requests = sqliteTable('requests', {
	id: text('id').primaryKey(),
	repositoryId: text('repository_id')
		.notNull()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	url: text('url').notNull(),
	method: text('method').notNull(),
	bodyType: text('body_type').notNull().default('none'),
	rawBody: text('raw_body'),
	acceptInvalidCerts: integer('accept_invalid_certs').notNull().default(0),
	timeoutMs: integer('timeout_ms'),
	connectionTimeoutMs: integer('connection_timeout_ms'),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
    },
    (table) => [index('idx_requests_repository').on(table.repositoryId)]
);
    
export const headerFields = sqliteTable('header_fields', {
	id: text('id').primaryKey(),
	requestId: text('request_id')
		.notNull()
		.references(() => requests.id, { onDelete: 'cascade' }),
	key: text('key').notNull(),
	value: text('value').notNull(),
	sortOrder: integer('sort_order').notNull().default(0)
},
    (table) => [index('idx_header_fields_request').on(table.requestId)]
);

export const bodyFields = sqliteTable('body_fields', {
	id: text('id').primaryKey(),
	requestId: text('request_id')
		.notNull()
		.references(() => requests.id, { onDelete: 'cascade' }),
	key: text('key').notNull(),
	value: text('value').notNull(),
	sortOrder: integer('sort_order').notNull().default(0)
},
    (table) => [index('idx_body_fields_request').on(table.requestId)]
)