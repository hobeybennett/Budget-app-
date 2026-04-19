import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://qqflfnclzjzhqbvlnmrn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZmxmbmNsemp6aHFidmxubXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjQ5NzAsImV4cCI6MjA5MjIwMDk3MH0.yjUbHRWftXd96nWyEJy-gQWiYfaLanvsjFooDtxcD10',
  { auth: { flowType: 'pkce' } }
);

/*
  ── Remaining Supabase setup ────────────────────────────────────────────────
  1. Authentication → Providers → enable Google and Azure (Microsoft)
  2. Authentication → URL Configuration → add allowed redirect URL:
       https://hobeybennett.github.io/Budget-app-
  3. SQL Editor → run:

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
