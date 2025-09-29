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
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

export default function ChatScreen({ navigation, route }) {
  const chatId = route?.params?.chatId || 'global';
  const title = route?.params?.title || 'Chat';

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef(null);
  const listRef = useRef(null);

  const mapRowToItem = (row) => ({
    id: String(row.id),
    text: row.text,
    sender: row.user_id === currentUserRef.current?.id ? 'me' : 'other',
    created_at: row.created_at,
  });

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(200);
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
      await loadMessages();

      // realtime subscription for new messages in this chat
      const channel = supabase.channel(`chat:${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        }, (payload) => {
          const row = payload.new;
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
  }, [chatId]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    const user = currentUserRef.current;
    if (!user?.id) {
      console.warn('No authenticated user');
      return;
    }
    try {
      setNewMessage('');
      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        user_id: user.id,
        text,
      });
      if (error) throw error;
      // The realtime listener will append the message when INSERT succeeds.
    } catch (e) {
      console.warn('sendMessage error:', e);
      // rollback input if needed
      setNewMessage(text);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'me' ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            placeholderTextColor="#aaa"
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
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
  myMessage: {
    backgroundColor: '#8A2BE2',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    padding: 10,
  },
});
