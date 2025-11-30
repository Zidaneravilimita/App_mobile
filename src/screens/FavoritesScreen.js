// src/screens/FavoritesScreen.js
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavorites, removeFavorite } from '../config/favorites';
import { supabase } from '../config/supabase';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { ms, hp, wp } from '../theme/responsive';

export default function FavoritesScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCurrentUserId = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) return data.user.id;
    } catch {}
    try {
      const raw = await AsyncStorage.getItem('user_profile');
      const u = raw ? JSON.parse(raw) : null;
      if (u?.id) return u.id;
    } catch {}
    // Ne plus retourner d'utilisateur démo
    return null;
  };

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      const list = await getFavorites(userId);
      setItems(list);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const onRemove = async (id_event) => {
    const userId = await getCurrentUserId();
    const updated = await removeFavorite(userId, id_event);
    setItems(updated);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: '#000' },
      ]}
      onPress={() => navigation.navigate('EventDetails', { id_event: item.id_event })}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.image_url || 'https://placehold.co/120x80/222/fff?text=No+Image' }}
        style={[styles.thumb, { borderColor: colors.border }]}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.titre || 'Sans titre'}
        </Text>
        {item.date_event ? (
          <Text style={[styles.meta, { color: colors.subtext }]}>
            {new Date(item.date_event).toLocaleDateString('fr-FR')}
          </Text>
        ) : null}
        {item.villeName ? (
          <Text style={[styles.meta, { color: colors.subtext }]}>{item.villeName}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.removeBtn, { backgroundColor: colors.primary }]}
        onPress={() => onRemove(item.id_event)}
        accessibilityRole="button"
        accessibilityLabel={t('removeFromFavorites')}
      >
        <Ionicons name="trash" size={ms(16)} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: colors.border }] }>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={ms(20)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('myFavorites')}</Text>
        <View style={{ width: ms(20) }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loading, { color: colors.text }]}>{t('loading')}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={ms(44)} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('emptyFavorites')}</Text>
          <Text style={[styles.emptySub, { color: colors.subtext }]}>{t('emptyFavoritesHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id_event)}
          contentContainerStyle={{ padding: ms(14), paddingBottom: ms(20) }}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: ms(8) }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ms(14), paddingVertical: ms(12), borderBottomWidth: 1 },
  backBtn: { padding: ms(6) },
  headerTitle: { fontSize: ms(16), fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ms(20) },
  loading: { marginTop: ms(8) },
  emptyText: { fontSize: ms(14), marginTop: ms(8), fontWeight: '600' },
  emptySub: { fontSize: ms(12), marginTop: ms(4) },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: ms(12), padding: ms(10), borderWidth: 1, elevation: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  thumb: { width: ms(86), height: ms(66), borderRadius: ms(8), borderWidth: 1 },
  info: { flex: 1, marginLeft: ms(10) },
  title: { fontSize: ms(15), fontWeight: '700' },
  meta: { fontSize: ms(12), marginTop: ms(2) },
  removeBtn: { width: ms(32), height: ms(32), borderRadius: ms(16), alignItems: 'center', justifyContent: 'center', marginLeft: ms(8) },
})
;
