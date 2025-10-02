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
  const chatId = buildOrganizerChatId(event.id_event, userId, event.id_user);

  const text = (initialText || 'Bonjour, je suis intéressé par votre événement.').slice(0, 1000);

  try {
    // Insert a message to create the thread implicitly. It's okay if multiple exist.
    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      user_id: userId,
      text,
    });
    if (error) {
      // If duplicate or RLS prevents insert, still return chatId so navigation can proceed
      console.warn('ensureOrganizerDm insert error:', error);
    }
  } catch (e) {
    console.warn('ensureOrganizerDm error:', e);
  }

  return chatId;
}
