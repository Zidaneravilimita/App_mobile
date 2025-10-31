// src/screens/MessagesListScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { supabase } from '../config/supabase';
import { ms } from '../theme/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MessagesListScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const currentUserRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [unreadSet, setUnreadSet] = useState(new Set());
  const [archiveSet, setArchiveSet] = useState(new Set());
  const [hiddenSet, setHiddenSet] = useState(new Set());

  const STORAGE_KEYS = {
    unread: 'ml_unread_conversations',
    archive: 'ml_archived_conversations',
    hidden: 'ml_hidden_conversations',
  };

  const loadLocalFlags = async () => {
    try {
      const [u, a, h] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.unread),
        AsyncStorage.getItem(STORAGE_KEYS.archive),
        AsyncStorage.getItem(STORAGE_KEYS.hidden),
      ]);
      if (u) setUnreadSet(new Set(JSON.parse(u)));
      if (a) setArchiveSet(new Set(JSON.parse(a)));
      if (h) setHiddenSet(new Set(JSON.parse(h)));
    } catch {}
  };

  const persistSet = async (key, setObj) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(Array.from(setObj))); } catch {}
  };

  const loadThreads = async () => {
    setLoading(true);
    try {
      // 1) current user
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      currentUserRef.current = user || null;
      if (!user?.id) {
        setThreads([]);
        setLoading(false);
        return;
      }

      // 2) find conversations where current user is a member
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);
      if (memErr) throw memErr;
      const convIds = (memberships || []).map(r => r.conversation_id).filter(Boolean);
      if (convIds.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      // 3) load all members for these conversations to find the "other" user per 1:1 convo
      const { data: allMembers, error: allMemErr } = await supabase
        .from('conversation_members')
        .select('conversation_id,user_id')
        .in('conversation_id', convIds);
      if (allMemErr) throw allMemErr;

      // Map conversation -> otherUserId (pick anyone that's not me; if group, pick first other)
      const otherMap = new Map();
      for (const cid of convIds) {
        const members = (allMembers || []).filter(m => m.conversation_id === cid);
        const other = members.find(m => m.user_id !== user.id);
        otherMap.set(cid, other?.user_id || null);
      }

      // 4) load messages for these conversations (latest first)
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(500);
      if (msgErr) throw msgErr;

      // 5) build per-conversation aggregates: last message and received count (messages from others)
      const lastByConv = new Map();
      const receivedCount = new Map();
      for (const m of msgs || []) {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
        if (m.sender_id && m.sender_id !== user.id) {
          receivedCount.set(m.conversation_id, (receivedCount.get(m.conversation_id) || 0) + 1);
        }
      }

      // 6) fetch profiles for "other" users to get avatar and name
      const otherIds = Array.from(new Set(Array.from(otherMap.values()).filter(Boolean)));
      let profilesById = new Map();
      if (otherIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', otherIds);
        if (profErr) throw profErr;
        profilesById = new Map((profs || []).map(p => [p.id, p]));
      }

      const list = convIds.map(cid => {
        const last = lastByConv.get(cid) || null;
        const otherId = otherMap.get(cid);
        const prof = otherId ? profilesById.get(otherId) : null;
        const title = prof?.username || prof?.full_name || t('chat');
        const snippet = last?.content || '';
        const count = receivedCount.get(cid) || 0;
        return {
          id: String(cid),
          conversation_id: cid,
          title,
          snippet,
          count,
          avatar_url: prof?.avatar_url || null,
          other_user_id: otherId || null,
        };
      }).sort((a, b) => {
        const at = (msgs || []).find(m => m.conversation_id === a.conversation_id)?.created_at || '';
        const bt = (msgs || []).find(m => m.conversation_id === b.conversation_id)?.created_at || '';
        return (bt > at) ? 1 : (bt < at) ? -1 : 0;
      });

      setThreads(list);
    } catch (e) {
      console.warn('loadThreads error:', e);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalFlags();
    loadThreads();
    // realtime: refresh on new messages
    const channel = supabase.channel('messages:list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadThreads();
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, []);

  const openThread = (item) => {
    if (unreadSet.has(item.conversation_id)) {
      const next = new Set(unreadSet);
      next.delete(item.conversation_id);
      setUnreadSet(next);
      persistSet(STORAGE_KEYS.unread, next);
    }
    navigation.navigate('Chat', { conversationId: item.conversation_id, title: item.title, avatar_url: item.avatar_url, other_user_id: item.other_user_id });
  };

  const onLongPressThread = (item) => {
    setSelectedThread(item);
    setMenuVisible(true);
  };

  const markAsUnread = () => {
    if (!selectedThread) return;
    const next = new Set(unreadSet);
    next.add(selectedThread.conversation_id);
    setUnreadSet(next);
    persistSet(STORAGE_KEYS.unread, next);
    setMenuVisible(false);
  };

  const archiveThread = () => {
    if (!selectedThread) return;
    const next = new Set(archiveSet);
    next.add(selectedThread.conversation_id);
    setArchiveSet(next);
    persistSet(STORAGE_KEYS.archive, next);
    setMenuVisible(false);
  };

  const hideThread = () => {
    if (!selectedThread) return;
    const next = new Set(hiddenSet);
    next.add(selectedThread.conversation_id);
    setHiddenSet(next);
    persistSet(STORAGE_KEYS.hidden, next);
    setMenuVisible(false);
  };

  const deleteConversation = async () => {
    if (!selectedThread) return;
    try {
      const { data } = await supabase.auth.getUser();
      const me = data?.user?.id;
      // Best-effort: remove my membership so it disappears server-side depending on RLS
      if (me) {
        try {
          await supabase
            .from('conversation_members')
            .delete()
            .eq('conversation_id', selectedThread.conversation_id)
            .eq('user_id', me);
        } catch {}
      }
    } catch {}
    // Always remove locally from the list
    setThreads((prev) => prev.filter(t => t.conversation_id !== selectedThread.conversation_id));
    // Also clear flags
    const u = new Set(unreadSet); u.delete(selectedThread.conversation_id); setUnreadSet(u); persistSet(STORAGE_KEYS.unread, u);
    const a = new Set(archiveSet); a.delete(selectedThread.conversation_id); setArchiveSet(a); persistSet(STORAGE_KEYS.archive, a);
    const h = new Set(hiddenSet); h.delete(selectedThread.conversation_id); setHiddenSet(h); persistSet(STORAGE_KEYS.hidden, h);
    setMenuVisible(false);
  };

  const renderItem = ({ item }) => {
    if (archiveSet.has(item.conversation_id) || hiddenSet.has(item.conversation_id)) return null;
    const isUnread = unreadSet.has(item.conversation_id);
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.border }]}
        onPress={() => openThread(item)}
        onLongPress={() => onLongPressThread(item)}
      >
        <View style={styles.left}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={[styles.avatar, { borderColor: colors.border }]} />
          ) : (
            <Ionicons name="person-circle" size={ms(40)} color={colors.muted} />
          )}
        </View>
        <View style={styles.center}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text numberOfLines={1} style={[styles.snippet, { color: isUnread ? '#ff3b30' : colors.subtext, fontWeight: isUnread ? '700' : '400' }]}>{item.snippet}</Text>
        </View>
        <View style={styles.right}>
          {item.count > 0 || isUnread ? (
            <View style={[styles.badge, { backgroundColor: isUnread ? '#ff3b30' : colors.primary }]}> 
              <Text style={styles.badgeText}>{(item.count > 0 ? (item.count > 99 ? '99+' : item.count) : '')}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('messages') || 'Messages'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: ms(12) }}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        />
      )}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuOverlay}>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={markAsUnread}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('markUnread') || 'Mettre comme non lu'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={archiveThread}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('archive') || 'Archiver'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={hideThread}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('hide') || 'Masquer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={deleteConversation}>
              <Text style={[styles.menuText, { color: '#ff3b30', fontWeight: '700' }]}>{t('deleteConversation') || 'Supprimer la conversation'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuCancel]} onPress={() => setMenuVisible(false)}>
              <Text style={[styles.menuText, { color: colors.subtext }]}>{t('cancel') || 'Annuler'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: ms(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(16),
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: ms(18), fontWeight: 'bold' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderBottomWidth: 1,
  },
  left: { width: ms(48), alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, paddingHorizontal: ms(12) },
  right: { width: ms(48), alignItems: 'flex-end', justifyContent: 'center' },
  avatar: { width: ms(40), height: ms(40), borderRadius: ms(20), borderWidth: 1 },
  title: { fontSize: ms(14), fontWeight: '600' },
  snippet: { fontSize: ms(12), marginTop: ms(2) },
  badge: { minWidth: ms(22), paddingHorizontal: ms(6), height: ms(22), borderRadius: ms(11), alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: ms(12), fontWeight: '700' },
  separator: { height: 0 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  menuCard: { borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingBottom: ms(10), borderWidth: 1 },
  menuItem: { paddingVertical: ms(14), paddingHorizontal: ms(20) },
  menuText: { fontSize: ms(14) },
  menuCancel: { marginTop: ms(6) },
});
