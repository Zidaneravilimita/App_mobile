import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; 

const supabaseUrl = 'https://kttziaqzsvtamgaijtzj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dHppYXF6c3Z0YW1nYWlqdHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODE2ODIsImV4cCI6MjA2OTI1NzY4Mn0.pjs7hKCOSi4S3S0y5RYKVZOwTlx1Ql7dE75EjT9PGlw';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);