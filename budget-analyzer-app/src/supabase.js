import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Returns null when env vars aren't set (local dev without Supabase, or build before secrets are added).
// All auth-dependent UI checks for `supabase !== null` before calling.
export const supabase = url && key
  ? createClient(url, key, { auth: { flowType: 'pkce' } })
  : null;

/*
  ── Supabase setup ──────────────────────────────────────────────────────────
  1. Create a free project at supabase.com
  2. Settings → API → copy "Project URL" and "anon public" key
  3. Add them as GitHub repository secrets:
       VITE_SUPABASE_URL   = https://xxxx.supabase.co
       VITE_SUPABASE_ANON_KEY = eyJ...
  4. Authentication → Providers → enable Google, Apple, Azure (Microsoft)
     Set redirect URL to: https://hobeybennett.github.io/Budget-app-
  5. Run this SQL in the Supabase SQL editor:

  create table budgets (
    id         uuid default gen_random_uuid() primary key,
    user_id    uuid references auth.users not null,
    name       text not null,
    created_at timestamptz default now(),
    data       jsonb not null
  );
  alter table budgets enable row level security;
  create policy "users_own_budgets" on budgets
    for all using (auth.uid() = user_id);
*/
