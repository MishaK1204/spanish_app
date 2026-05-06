-- Run once when DB_SYNCHRONIZE is false, for example:
--   psql -U <user> -d spanish -h localhost -f scripts/create-users-table.sql

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" character varying(64) NOT NULL UNIQUE,
  "password_hash" character varying NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);
