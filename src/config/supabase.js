import { createClient } from "@supabase/supabase-js";

// ⚠️ Remplace par TES valeurs depuis Supabase Dashboard -> Project Settings -> API
const supabaseUrl = "https://kttziaqzsvtamgaijtzj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dHppYXF6c3Z0YW1nYWlqdHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODE2ODIsImV4cCI6MjA2OTI1NzY4Mn0.pjs7hKCOSi4S3S0y5RYKVZOwTlx1Ql7dE75EjT9PGlw"; 

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase: URL ou clé manquante !");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // conserve la session utilisateur
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

supabase.from("event").select("*").limit(1).then(({ data, error }) => {
  if (error) {
    console.error("❌ Test Supabase échoué:", error);
  } else {
    console.log("✅ Test Supabase OK, premier event:", data);
  }
});

fetch('https://supabase.io')
  .then(() => console.log('Internet OK'))
  .catch(() => console.log('Pas d’accès Internet'))

// 🔹 Debug pour vérifier que le client est bien créé
console.log("✅ Supabase client initialisé :", supabaseUrl);
