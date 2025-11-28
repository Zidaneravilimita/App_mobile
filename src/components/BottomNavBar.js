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

export default function BottomNavBar({ onHomePress, onAddPress, hideAdd = false, withNotch = false, transparent = false, barHeight }) {
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

  const containerStyle = [
    styles.navBarContainer,
    {
      backgroundColor: transparent ? 'transparent' : colors.background,
      borderTopColor: colors.border,
      height: withNotch ? (barHeight || ms(96)) : (barHeight || ms(72)),
    },
  ];

  if (withNotch) {
    return (
      <View style={containerStyle}>
        {!transparent ? (
          <>
            <View style={[styles.barBg, { backgroundColor: colors.card, height: ms(56) }]} />
            <View
              pointerEvents="none"
              style={[styles.notch, { bottom: ms(32), backgroundColor: colors.background }]}
            />
          </>
        ) : (
          <>
            <View style={styles.lineRow}>
              <View style={[styles.lineSegment, { backgroundColor: colors.card }]} />
              <View style={{ width: ms(68) }} />
              <View style={[styles.lineSegment, { backgroundColor: colors.card }]} />
            </View>
            <View pointerEvents="none" style={[styles.semiArc, { borderColor: colors.card }]} />
          </>
        )}

        <View style={styles.contentRow}>
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

          <View style={{ width: ms(56) }} />

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
        ) : null}
      </View>
    );
  }

  // Layout sans encoche (par défaut)
  return (
    <View style={containerStyle}>
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

      {/* Bouton Add (absolu, ne prend pas d'espace de layout) */}
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
      ) : null}

      {/* Réservation d'espace centrale pour alignement symétrique (toujours présente) */}
      <View style={{ width: hideAdd ? 0 : ms(56) }} />

      {/* Bouton Chat */}
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
    height: ms(68),
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: ms(10),
    borderTopWidth: 1,
    paddingBottom: ms(16),
  },
  barBg: {
    position: 'absolute',
    bottom: ms(10),
    width: '92%',
    height: ms(64),
    borderRadius: ms(32),
    alignSelf: 'center',
  },
  lineBar: {
    position: 'absolute',
    bottom: ms(28),
    width: '92%',
    height: ms(4),
    borderRadius: ms(2),
    alignSelf: 'center',
  },
  lineRow: {
    position: 'absolute',
    bottom: ms(28),
    alignSelf: 'center',
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineSegment: {
    flex: 1,
    height: ms(4),
    borderRadius: ms(2),
  },
  semiArc: {
    position: 'absolute',
    bottom: ms(26),
    width: ms(68),
    height: ms(34),
    borderTopLeftRadius: ms(34),
    borderTopRightRadius: ms(34),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: ms(4),
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    alignSelf: 'center',
    zIndex: 2,
  },
  notch: {
    position: 'absolute',
    width: ms(68),
    height: ms(68),
    borderRadius: ms(34),
    alignSelf: 'center',
    zIndex: 2,
  },
  bulge: {},
  contentRow: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(12),
    paddingBottom: ms(8),
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: ms(6),
    paddingHorizontal: ms(8),
  },
  addButton: {
    borderRadius: ms(28),
    width: ms(56),
    height: ms(56),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: ms(26),
    alignSelf: 'center',
    borderWidth: 4,
    zIndex: 5,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
