// src/config/supabase.js - Version simplifiée sans RPC
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kttziaqzsvtamgaijtzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dHppYXF6c3Z0YW1nYWlqdHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODE2ODIsImV4cCI6MjA2OTI1NzY4Mn0.pjs7hKCOSi4S3S0y5RYKVZOwTlx1Ql7dE75EjT9PGlw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Version simplifiée sans retry complexe
export async function selectFrom(table, selectQuery = '*') {
  try {
    const { data, error } = await supabase.from(table).select(selectQuery);
    if (error) throw error;
    return { data, status: 200 };
  } catch (error) {
    console.error(`Erreur ${table}:`, error);
    throw error;
  }
}

export async function insertInto(table, payload) {
  try {
    const { data, error } = await supabase.from(table).insert(payload);
    if (error) throw error;
    return { data, status: 201 };
  } catch (error) {
    console.error(`Erreur insertion ${table}:`, error);
    throw error;
  }
}

// Fonction pour récupérer les événements avec jointures manuelles
export async function getEventsWithDetails() {
  try {
    // Récupérer les événements
    const { data: events, error: eventsError } = await supabase
      .from('event')
      .select('*')
      .order('date', { ascending: false });
    
    if (eventsError) throw eventsError;

    // Récupérer villes et types séparément
    const { data: villes } = await supabase.from('ville').select('*');
    const { data: types } = await supabase.from('type_evenements').select('*');

    // Combiner les données
    const eventsWithDetails = events.map(event => {
      const ville = villes?.find(v => v.id_ville === event.id_ville);
      const type = types?.find(t => t.id_type_event === event.id_type_event);
      
      return {
        ...event,
        ville_nom: ville?.nom_ville || 'Ville inconnue',
        type_nom: type?.nom_event || 'Type inconnu'
      };
    });

    return { data: eventsWithDetails, status: 200 };
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    throw error;
  }
}

// Fonction de test de connexion
export async function testConnection() {
  try {
    console.log('Test de connexion Supabase...');
    
    const { data, error } = await supabase
      .from('ville')
      .select('count(*)')
      .limit(1);
    
    if (error) throw error;
    
    console.log('Test connexion réussi');
    return { success: true, data };
  } catch (error) {
    console.error('Test connexion échoué:', error);
    return { success: false, error: error.message };
  }
}

export default supabase;