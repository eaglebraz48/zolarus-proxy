// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Fail fast so we don’t get cryptic “supabaseUrl is required”
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');

export const supabase = createClient(url, anon);
