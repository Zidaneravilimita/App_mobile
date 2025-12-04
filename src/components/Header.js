// src/components/Header.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../theme/responsive';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export default function Header() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [avatarUri, setAvatarUri] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        // 1) Tenter de charger depuis Supabase (profil en ligne le plus récent)
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.avatar_url) {
            setAvatarUri(profile.avatar_url);
            return;
          }
          // fallback: métadonnées utilisateur
          const metaUrl = user.user_metadata?.avatar_url;
          if (metaUrl) {
            setAvatarUri(metaUrl);
            return;
          }
        }

        // 2) Fallback local (cache)
        const savedProfile = await AsyncStorage.getItem('user_data');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          if (profile?.avatar_url) {
            setAvatarUri(profile.avatar_url);
            return;
          }
        }
        const savedUser = await AsyncStorage.getItem('user_profile');
        if (savedUser) {
          const userLocal = JSON.parse(savedUser);
          const metaUrl = userLocal?.user_metadata?.avatar_url;
          if (metaUrl) {
            setAvatarUri(metaUrl);
          }
        }
      } catch (e) {
        // ignore and keep fallback
      }
    };
    loadAvatar();
  }, []);

  const clearBadgeAndNavigate = useCallback(async () => {
    try {
      // Marquer toutes les notifications comme lues dans la base de données
      await supabase
        .from('notifications_queue')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .neq('is_sent', true);
      
      // Réinitialiser le badge système (sauf sur Web et Expo Go)
      if (Platform.OS !== 'web' && Constants?.appOwnership !== 'expo') {
        await Notifications.setBadgeCountAsync(0);
      }
      
      // Mettre à jour le compteur local
      setUnreadCount(0);
      
      // Naviguer vers l'écran Notify
      navigation.navigate('Notify');
    } catch (e) {
      console.warn('Error clearing badge:', e);
      // En cas d'erreur, quand même naviguer
      navigation.navigate('Notify');
    }
  }, [navigation]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('notifications_queue')
        .select('*', { count: 'exact', head: true })
        .eq('is_sent', false);
      
      if (!error) {
        setUnreadCount(count || 0);
      }
    } catch (e) {
      console.warn('Error loading unread count:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Recharger l'avatar et le compteur à chaque focus de l'écran
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', user.id)
              .maybeSingle();
            if (profile?.avatar_url) {
              setAvatarUri(profile.avatar_url);
              return;
            }
            const metaUrl = user.user_metadata?.avatar_url;
            if (metaUrl) {
              setAvatarUri(metaUrl);
              return;
            }
          }
        } catch {}
      })();
      
      // Charger le compteur de notifications non lues
      loadUnreadCount();
      
      return undefined;
    }, [loadUnreadCount])
  );

  const getImageUri = (uri) => {
    if (!uri) return null;
    // Cache-busting si HTTP(S)
    if (uri.startsWith('http')) {
      const t = Date.now();
      return uri.includes('?') ? `${uri}&t=${t}` : `${uri}?t=${t}`;
    }
    return uri;
  };
  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: ms(8),
          paddingHorizontal: ms(16),
        },
      ]}
    >
      <TouchableOpacity>
        {avatarUri ? (
          <Image
            source={{ uri: getImageUri(avatarUri) }}
            onError={() => setAvatarUri(null)}
            style={[
              styles.avatar,
              {
                width: ms(40),
                height: ms(40),
                borderRadius: ms(20),
                borderWidth: 1,
              },
            ]}
          />
        ) : (
          <Ionicons name="person-circle" size={40} color={colors.muted} />
        )}
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Ionicons name="sparkles" size={ms(22)} color={colors.primary} />
        <Text style={[styles.logoText, { color: colors.text }]}>EVENT PARTY</Text>
      </View>
      <TouchableOpacity 
        style={styles.notificationContainer}
        onPress={clearBadgeAndNavigate}
      >
        <Ionicons name="notifications" size={ms(22)} color={colors.text} />
        {unreadCount > 0 && (
          <View style={[styles.notificationBadge, { backgroundColor: colors.primary, borderColor: colors.background }] }>
            <Text style={[styles.badgeText, { color: '#fff' }]}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ms(10),
    paddingHorizontal: ms(16),
    borderBottomWidth: 1,
    // Top padding handled by Safe Area
  },
  avatar: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: ms(16),
    fontWeight: 'bold',
    marginLeft: ms(6),
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -ms(6),
    top: -ms(6),
    borderRadius: ms(10),
    width: ms(20),
    height: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: ms(10),
    fontWeight: 'bold',
  },
});

const getImageUri = (uri) => {
  if (!uri) return null;
  // Cache-busting si HTTP(S)
  if (uri.startsWith('http')) {
    const t = Date.now();
    return uri.includes('?') ? `${uri}&t=${t}` : `${uri}?t=${t}`;
  }
  return uri;
};