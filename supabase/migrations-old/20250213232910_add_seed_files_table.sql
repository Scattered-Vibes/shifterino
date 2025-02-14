CREATE TABLE supabase_migrations.seed_files (
    id SERIAL PRIMARY KEY,
    filename TEXT,
    path TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
