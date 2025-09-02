// test-supabase.js
import { createClient } from "@supabase/supabase-js";

// Remplace par tes valeurs (ou utilise process.env si tu veux tester en mode sécurisé)
const supabaseUrl = "https://kttziaqzsvtamgaijtzj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dHppYXF6c3Z0YW1nYWlqdHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODE2ODIsImV4cCI6MjA2OTI1NzY4Mn0.pjs7hKCOSi4S3S0y5RYKVZOwTlx1Ql7dE75EjT9PGlw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("profiles") // Mets ici une table qui existe dans ton projet
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Erreur Supabase :", error.message);
    } else {
      console.log("✅ Connexion OK, données reçues :", data);
    }
  } catch (err) {
    console.error("❌ Erreur réseau ou config :", err);
  }
}

testConnection();