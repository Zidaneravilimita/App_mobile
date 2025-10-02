// src/screens/FavoritesScreen.js
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavorites, removeFavorite } from '../config/favorites';
import { supabase } from '../config/supabase';

export default function FavoritesScreen({ navigation }) {
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
      style={styles.card}
      onPress={() => navigation.navigate('EventDetails', { id_event: item.id_event })}
    >
      <Image
        source={{ uri: item.image_url || 'https://placehold.co/120x80/222/fff?text=No+Image' }}
        style={styles.thumb}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.titre || 'Sans titre'}</Text>
        {item.date_event ? <Text style={styles.meta}>{new Date(item.date_event).toLocaleDateString('fr-FR')}</Text> : null}
        {item.villeName ? <Text style={styles.meta}>{item.villeName}</Text> : null}
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.id_event)}>
        <Ionicons name="trash" size={18} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loading}>Chargement...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>Aucun favori pour le moment</Text>
          <Text style={styles.emptySub}>Cliquez sur "Intéressée" dans une fiche événement</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id_event)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { color: '#ccc', marginTop: 10 },
  emptyText: { color: '#fff', fontSize: 16, marginTop: 10, fontWeight: '600' },
  emptySub: { color: '#999', fontSize: 13, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 12, padding: 10 },
  thumb: { width: 90, height: 70, borderRadius: 8, backgroundColor: '#333' },
  info: { flex: 1, marginLeft: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  meta: { color: '#bbb', fontSize: 12, marginTop: 2 },
  removeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8A2BE2', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
