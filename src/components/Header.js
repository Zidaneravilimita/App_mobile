// src/components/Header.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function Header() {
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
    <View style={styles.headerContainer}>
      <TouchableOpacity>
        {avatarUri ? (
          <Image
            source={{ uri: getImageUri(avatarUri) }}
            onError={() => setAvatarUri(null)}
            style={styles.avatar}
          />
        ) : (
          <Ionicons name="person-circle" size={40} color="#888" />
        )}
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Ionicons name="sparkles" size={24} color="#8A2BE2" />
        <Text style={styles.logoText}>EVENT PARTY</Text>
      </View>
      <TouchableOpacity 
        style={styles.notificationContainer}
        onPress={() => navigation.navigate('Notify')}
      >
        <Ionicons name="notifications" size={24} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>
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
    padding: 15,
    backgroundColor: '#1a1a1a',
    marginTop: 35,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#8A2BE2',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});