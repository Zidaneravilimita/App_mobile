// src/screens/FavoritesScreen.js
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavorites, removeFavorite } from '../config/favorites';
import { supabase } from '../config/supabase';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

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
    return 'demo-user-123';
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
        <Ionicons name="trash" size={18} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: colors.border }] }>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('myFavorites')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loading, { color: colors.text }]}>{t('loading')}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('emptyFavorites')}</Text>
          <Text style={[styles.emptySub, { color: colors.subtext }]}>{t('emptyFavoritesHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id_event)}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { marginTop: 10 },
  emptyText: { fontSize: 16, marginTop: 10, fontWeight: '600' },
  emptySub: { fontSize: 13, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 10, borderWidth: 1, elevation: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  thumb: { width: 90, height: 70, borderRadius: 8, borderWidth: 1 },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  removeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
})
;
