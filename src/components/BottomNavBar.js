// src/components/BottomNavBar.js 
import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { ms } from "../theme/responsive";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "../config/supabase";

export default function BottomNavBar({ onHomePress, onAddPress, hideAdd = false }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUserRef = useRef(null);

  const STORAGE_KEYS = {
    unread: 'ml_unread_conversations',
  };

  const loadUnread = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.unread);
      const setArr = raw ? JSON.parse(raw) : [];
      setUnreadCount(Array.isArray(setArr) ? setArr.length : 0);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        currentUserRef.current = data?.user || null;
      } catch {}
      loadUnread();
    })();

    const interval = setInterval(loadUnread, 4000);

    const channel = supabase
      .channel('navbar:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        try {
          const me = currentUserRef.current?.id;
          const m = payload?.new;
          if (!m || !m.conversation_id) return;
          if (me && m.sender_id === me) return;
          const raw = await AsyncStorage.getItem(STORAGE_KEYS.unread);
          const setArr = new Set(raw ? JSON.parse(raw) : []);
          setArr.add(m.conversation_id);
          await AsyncStorage.setItem(STORAGE_KEYS.unread, JSON.stringify(Array.from(setArr)));
          setUnreadCount(setArr.size);
        } catch {}
      })
      .subscribe();

    const unsubFocus = navigation.addListener('state', loadUnread);

    return () => {
      try { supabase.removeChannel(channel); } catch {}
      clearInterval(interval);
      if (unsubFocus) unsubFocus();
    };
  }, [navigation]);

  return (
    <View style={[styles.navBarContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {/* Bouton Accueil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (onHomePress) onHomePress();
          navigation.navigate("Home");
        }}
      >
        <Ionicons name="home-outline" size={ms(22)} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{t('home')}</Text>
      </TouchableOpacity>

      {/* Bouton Recherche */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          navigation.navigate("Search");
        }}
      >
        <Ionicons name="search-outline" size={ms(22)} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{t('search')}</Text>
      </TouchableOpacity>

      {/* Bouton Add (masqué pour les visiteurs) */}
      {!hideAdd ? (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary, borderColor: colors.border }]}
          onPress={() => {
            if (onAddPress) onAddPress();
            else navigation.navigate("Add");
          }}
        >
          <Ionicons name="add" size={ms(28)} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: ms(56) }} />
      )}

      {/* Bouton Chat (inversé avec Profil) */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("MessagesList")}
      >
        <View>
          <Ionicons name="chatbubble-outline" size={ms(22)} color={colors.text} />
          {unreadCount > 0 && (
            <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.iconBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, { color: colors.text }]}>{t('chat')}</Text>
      </TouchableOpacity>

      {/* Bouton Profil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons name="person-outline" size={ms(22)} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{t('profile')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    height: ms(72),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: ms(10),
    borderTopWidth: 1,
    paddingBottom: ms(16),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(6),
  },
  addButton: {
    borderRadius: ms(28),
    width: ms(56),
    height: ms(56),
    justifyContent: 'center',
    alignItems: 'center',
    bottom: ms(16),
    borderWidth: 4,
  },
  label: {
    fontSize: ms(11),
    marginTop: ms(4),
  },
  iconBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    minWidth: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(3),
  },
  iconBadgeText: {
    color: '#fff',
    fontSize: ms(9),
    fontWeight: '700',
  },
});
