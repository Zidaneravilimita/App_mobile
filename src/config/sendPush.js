// pseudo-code pour une Supabase Edge Function
import fetch from 'node-fetch'; // ou global fetch en Deno
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // 1) récupérer notifications non envoyées
  const { data: q, error: qErr } = await supabase
    .from('notifications_queue')
    .select('*')
    .eq('is_sent', false)
    .order('created_at', { ascending: true })
    .limit(50);

  if (qErr) return res.json({ error: qErr });

  // 2) pour chaque item chercher tokens et envoyer
  for (const item of q) {
    let tokens = [];

    if (item.user_id) {
      const { data: p } = await supabase.from('profiles').select('expo_push_token').eq('id', item.user_id).single();
      if (p?.expo_push_token) tokens.push(p.expo_push_token);
    } else {
      // broadcast -> récupérer tous les tokens non NULL
      const { data: all } = await supabase.from('profiles').select('expo_push_token').not('expo_push_token', 'is', null);
      tokens = (all || []).map(r => r.expo_push_token).filter(Boolean);
    }

    if (tokens.length === 0) {
      // marquer envoyé pour éviter boucle
      await supabase.from('notifications_queue').update({ is_sent: true, sent_at: new Date().toISOString() }).eq('id', item.id);
      continue;
    }

    // préparer payloads pour Expo
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: item.title,
      body: item.body,
      data: item.payload || {}
    }));

    // envoyer en batch via exp.host
    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    // TODO: vérifier réponse et gérer erreurs / retries
    await supabase.from('notifications_queue').update({ is_sent: true, sent_at: new Date().toISOString() }).eq('id', item.id);
  }

  return res.json({ ok: true, processed: q.length });
}