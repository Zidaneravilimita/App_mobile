// src/screens/ChatScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { ms } from '../theme/responsive';

export default function ChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const conversationId = route?.params?.conversationId || route?.params?.chatId || null;
  const initialTitle = route?.params?.title || t('chat') || 'Chat';
  const avatarUrl = route?.params?.avatar_url || null;
  const otherUserId = route?.params?.other_user_id || null;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef(null);
  const listRef = useRef(null);
  const [headerTitle, setHeaderTitle] = useState(initialTitle);
  const [headerAvatar, setHeaderAvatar] = useState(avatarUrl);

  const mapRowToItem = (row) => ({
    id: String(row.id),
    text: row.content ?? row.text,
    sender: row.sender_id
      ? (row.sender_id === currentUserRef.current?.id ? 'me' : 'other')
      : (row.user_id === currentUserRef.current?.id ? 'me' : 'other'),
    created_at: row.created_at,
  });

  const loadMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select('id, conversation_id, sender_id, user_id, content, created_at');

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (currentUserRef.current?.id) {
        // Fallback: afficher seulement les propres messages de l'utilisateur si pas de conversationId
        query = query.eq('sender_id', currentUserRef.current.id);
      }

      const { data, error } = await query.order('created_at', { ascending: true }).limit(200);
      if (error) throw error;
      setMessages((data || []).map(mapRowToItem));
    } catch (e) {
      console.warn('loadMessages error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch current user then load messages and subscribe
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        currentUserRef.current = data?.user || null;
      } catch (e) {
        console.warn('getUser error:', e);
      }
      // Always try to resolve the other participant's profile to set title/avatar
      // Prefer direct lookup if other_user_id is provided
      if (otherUserId) {
        try {
          const { data: prof, error: pErr } = await supabase
            .from('profiles')
            .select('full_name,username,avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();
          if (!pErr && prof) {
            setHeaderTitle(prof.username || prof.full_name || initialTitle);
            if (!headerAvatar && prof.avatar_url) setHeaderAvatar(prof.avatar_url);
          }
        } catch {}
      } else if (conversationId) {
        try {
          const me = currentUserRef.current?.id;
          if (me) {
            const { data: members, error: mErr } = await supabase
              .from('conversation_members')
              .select('conversation_id,user_id')
              .eq('conversation_id', conversationId);
            if (!mErr && Array.isArray(members)) {
              const other = members.find(m => m.user_id !== me);
              if (other?.user_id) {
                const { data: prof, error: pErr } = await supabase
                  .from('profiles')
                  .select('full_name,username,avatar_url')
                  .eq('id', other.user_id)
                  .maybeSingle();
                if (!pErr && prof) {
                  setHeaderTitle(prof.username || prof.full_name || initialTitle);
                  if (!headerAvatar && prof.avatar_url) setHeaderAvatar(prof.avatar_url);
                }
              } else {
                // Fallback: resolve from last message sender
                const { data: lastMsgs, error: lErr } = await supabase
                  .from('messages')
                  .select('sender_id')
                  .eq('conversation_id', conversationId)
                  .order('created_at', { ascending: false })
                  .limit(1);
                if (!lErr && Array.isArray(lastMsgs) && lastMsgs.length > 0) {
                  const candidate = lastMsgs[0]?.sender_id;
                  if (candidate && candidate !== me) {
                    const { data: prof2, error: p2Err } = await supabase
                      .from('profiles')
                      .select('full_name,username,avatar_url')
                      .eq('id', candidate)
                      .maybeSingle();
                    if (!p2Err && prof2) {
                      setHeaderTitle(prof2.username || prof2.full_name || initialTitle);
                      if (!headerAvatar && prof2.avatar_url) setHeaderAvatar(prof2.avatar_url);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore, keep initial title
        }
      }
      await loadMessages();

      // realtime subscription for new messages
      const channel = supabase.channel(`chat:${conversationId || 'self'}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          ...(conversationId ? { filter: `conversation_id=eq.${conversationId}` } : {}),
        }, (payload) => {
          const row = payload.new;
          // If no conversation filter, only append if it's my own message (privacy)
          if (!conversationId && row?.sender_id && row.sender_id !== currentUserRef.current?.id) return;
          setMessages((prev) => [...prev, mapRowToItem(row)]);
          // slight delay to ensure list updates before scrolling
          setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
        })
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch {}
      };
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, otherUserId, route?.params?.title]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    const user = currentUserRef.current;
    if (!user?.id) {
      console.warn('No authenticated user');
      return;
    }
    if (!conversationId) {
      console.warn('No conversationId provided');
      return;
    }
    try {
      setNewMessage('');
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        user_id: user.id,
        content: text,
        type: 'text',
      });
      if (error) throw error;
      // The realtime listener will append the message when INSERT succeeds.
    } catch (e) {
      console.warn('sendMessage error:', e);
      // rollback input if needed
      setNewMessage(text);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';
    const bubbleStyle = [
      styles.messageBubble,
      isMe
        ? { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 0 }
        : { backgroundColor: colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
    ];
    const textStyle = [
      styles.messageText,
      { color: isMe ? '#fff' : colors.text },
    ];
    return (
      <View style={bubbleStyle}>
        <Text style={textStyle}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }] }>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }] }>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {headerAvatar ? (
            <Image source={{ uri: headerAvatar }} style={[styles.headerAvatar, { borderColor: colors.border }]} />
          ) : (
            <Ionicons name="person-circle" size={ms(28)} color={colors.muted} />
          )}
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>{headerTitle}</Text>
        </View>
      </View>

      {/* Chat body */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
      />

      {/* Input zone */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }] }>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.subtext}
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={sendMessage}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    flexShrink: 1,
  },
  headerAvatar: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    borderWidth: 1,
  },
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 5,
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    
  },
  input: {
    flex: 1,
    
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: { borderRadius: 20, padding: 10 },
});
