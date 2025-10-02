// src/screens/MyEventsScreen.js
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

export default function MyEventsScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMine = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
      } else {
        const { data, error } = await supabase
          .from('events')
          .select('id_event, titre, date_event')
          .eq('id_user', user.id)
          .order('date_event', { ascending: true });
        if (!error) setItems(data || []);
        else setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMine();
    }, [loadMine])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EventDetails', { id_event: item.id_event })}>
      <Ionicons name="calendar" size={18} color="#8A2BE2" />
      <Text style={styles.title} numberOfLines={1}>{item.titre || 'Sans titre'}</Text>
      <Text style={styles.meta}>{item.date_event ? new Date(item.date_event).toLocaleDateString('fr-FR') : ''}</Text>
      <Ionicons name="chevron-forward" size={18} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('myEvents')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('noCreatedEvents')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id_event)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.row, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('EventDetails', { id_event: item.id_event })}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.titre || 'Sans titre'}</Text>
              <Text style={[styles.meta, { color: colors.subtext }]}>
                {item.date_event ? new Date(item.date_event).toLocaleDateString('fr-FR') : ''}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  iconBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10 },
  title: { fontSize: 15, flex: 1, marginLeft: 8 },
  meta: { fontSize: 12, marginRight: 6 },
});
