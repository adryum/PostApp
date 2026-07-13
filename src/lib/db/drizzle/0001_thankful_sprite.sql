ALTER TABLE `requests` RENAME COLUMN "handshake_timeout_ms" TO "connection_timeout_ms";--> statement-breakpoint
ALTER TABLE `requests` ADD `accept_invalid_certs` integer DEFAULT 0 NOT NULL;