import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djpliigclofvtfbzhkge.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcGxpaWdjbG9mdnRmYnpoa2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODA3NTYsImV4cCI6MjA5MDE1Njc1Nn0.kW7nAOFLRaUBWss134yBSSZ0QPpsIUNs4-bJneRgLYM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
