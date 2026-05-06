-- Run once when DB_SYNCHRONIZE is false (matches LearnedWord entity + Word FK):
--   psql -U <user> -d spanish -h localhost -f scripts/create-learned-words-table.sql

CREATE TABLE IF NOT EXISTS "learned_words" (
  "id" SERIAL PRIMARY KEY,
  "clientKey" character varying(128) NOT NULL,
  "wordId" integer NOT NULL,
  CONSTRAINT "FK_learned_words_word" FOREIGN KEY ("wordId") REFERENCES "words" ("id") ON DELETE CASCADE,
  CONSTRAINT "UQ_learned_words_client_word" UNIQUE ("clientKey", "wordId")
);
