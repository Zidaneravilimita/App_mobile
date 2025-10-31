// src/services/organizerMessaging.js
import { supabase } from '../config/supabase';

// Build a stable 1:1 chat id between a user and an organizer for a given event
export function buildOrganizerChatId(eventId, userId, organizerId) {
  return `event:${eventId}:dm:${userId}:${organizerId}`;
}

// Ensure a DM thread exists by inserting an initial system message if needed
export async function ensureOrganizerDm({ event, userId, initialText }) {
  if (!event?.id_event || !event?.id_user || !userId) {
    throw new Error('Missing event or user information');
  }
  const organizerId = event.id_user;
  const text = (initialText || 'Bonjour, je suis intéressé par votre événement.').slice(0, 1000);

  try {
    // 1) Find existing conversation: intersection of memberships
    const { data: aRows, error: aErr } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);
    if (aErr) throw aErr;

    let conversationId = null;
    if (Array.isArray(aRows) && aRows.length > 0) {
      const ids = aRows.map(r => r.conversation_id).filter(Boolean);
      if (ids.length) {
        const { data: bRows, error: bErr } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .in('conversation_id', ids)
          .eq('user_id', organizerId)
          .limit(1);
        if (bErr) throw bErr;
        if (bRows && bRows.length > 0) {
          conversationId = bRows[0].conversation_id;
        }
      }
    }

    // 2) If not found, create conversation and add current user as member
    if (!conversationId) {
      const { data: conv, error: cErr } = await supabase
        .from('conversations')
        .insert({ created_by: userId })
        .select('id')
        .single();
      if (cErr) throw cErr;
      conversationId = conv.id;

      // upsert only the current user membership (RLS allows inserting own membership)
      const { error: mErr } = await supabase
        .from('conversation_members')
        .upsert([
          { conversation_id: conversationId, user_id: userId },
        ], { onConflict: 'conversation_id,user_id' });
      if (mErr) throw mErr;

      // Best-effort: add the organizer as a member too so they can see the DM.
      // Depending on RLS, this may fail when executed by the visitor; we ignore errors silently.
      try {
        await supabase
          .from('conversation_members')
          .upsert([
            { conversation_id: conversationId, user_id: organizerId },
          ], { onConflict: 'conversation_id,user_id' });
      } catch (e) {
        console.warn('ensureOrganizerDm organizer upsert warning:', e);
      }
    }

    // 3) Insert initial message (tolerate RLS/duplicate errors silently)
    // Removed: do not auto-insert any initial message. Let the user send the first message.

    return conversationId;
  } catch (e) {
    console.warn('ensureOrganizerDm error:', e);
    // Best effort: do not block navigation; return a null to let caller handle
    return null;
  }
}
