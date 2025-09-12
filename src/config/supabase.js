// src/config/supabase.js (version simplifiée)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kttziaqzsvtamgaijtzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dHppYXF6c3Z0YW1nYWlqdHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODE2ODIsImV4cCI6MjA2OTI1NzY4Mn0.pjs7hKCOSi4S3S0y5RYKVZOwTlx1Ql7dE75EjT9PGlw';

// Configuration sans AsyncStorage pour le moment
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // storage: AsyncStorage, // Commenté temporairement
  },
});

export default supabase;