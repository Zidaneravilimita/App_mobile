// src/screens/EditEventScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

export default function EditEventScreen({ route, navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const idEvent = route.params?.id_event;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [date_event, setDateEvent] = useState(''); // ISO string or yyyy-mm-dd
  const [image_url, setImageUrl] = useState('');
  const [lieu_detail, setLieuDetail] = useState('');
  const [id_category, setIdCategory] = useState('');

  const fetchEvent = useCallback(async () => {
    if (!idEvent) {
      setError('No event id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id_event, titre, description, date_event, image_url, lieu_detail, id_category, id_user')
        .eq('id_event', idEvent)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setError('Not found');
      } else {
        setTitre(data.titre || '');
        setDescription(data.description || '');
        setDateEvent(data.date_event || '');
        setImageUrl(data.image_url || '');
        setLieuDetail(data.lieu_detail || '');
        setIdCategory(data.id_category ? String(data.id_category) : '');
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [idEvent]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const onSave = async () => {
    if (!idEvent) return;
    setSaving(true);
    try {
      const payload = {
        titre: titre.trim(),
        description: description.trim(),
        date_event: date_event || null,
        image_url: image_url || null,
        lieu_detail: lieu_detail || null,
        id_category: id_category ? Number(id_category) : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id_event', idEvent);
      if (error) throw error;
      Alert.alert(t('editEvent'), t('updateSuccess'));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('editEvent'), t('updateFail'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }] }>
        <StatusBar barStyle="light-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loading, { color: colors.subtext }]}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }] }>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('editEvent')}</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.centered}>
          <Text style={{ color: colors.subtext }}>{error}</Text>
          <TouchableOpacity onPress={fetchEvent} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('editEvent')}</Text>
        <TouchableOpacity onPress={onSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>{t('saveChanges')}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.field, { backgroundColor: colors.surface }] }>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('field_title')}</Text>
          <TextInput style={[styles.input, { color: colors.text }]} value={titre} onChangeText={setTitre} placeholder={t('field_title')} placeholderTextColor={colors.muted} />
        </View>

        <View style={[styles.field, { backgroundColor: colors.surface }] }>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('field_description')}</Text>
          <TextInput style={[styles.input, { color: colors.text }]} value={description} onChangeText={setDescription} placeholder={t('field_description')} placeholderTextColor={colors.muted} multiline />
        </View>

        <View style={[styles.field, { backgroundColor: colors.surface }] }>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('field_date')}</Text>
          <TextInput style={[styles.input, { color: colors.text }]} value={date_event} onChangeText={setDateEvent} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />
        </View>

        <View style={[styles.field, { backgroundColor: colors.surface }] }>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('field_image')}</Text>
          <TextInput style={[styles.input, { color: colors.text }]} value={image_url} onChangeText={setImageUrl} placeholder={t('field_image')} placeholderTextColor={colors.muted} />
        </View>

        <View style={[styles.field, { backgroundColor: colors.surface }] }>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('field_place')}</Text>
          <TextInput style={[styles.input, { color: colors.text }]} value={lieu_detail} onChangeText={setLieuDetail} placeholder={t('field_place')} placeholderTextColor={colors.muted} />
        </View>

        <View style={[styles.field, { backgroundColor: colors.surface }] }>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('field_category')}</Text>
          <TextInput style={[styles.input, { color: colors.text }]} value={id_category} onChangeText={setIdCategory} placeholder={t('field_category')} placeholderTextColor={colors.muted} keyboardType="numeric" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  iconBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  saveBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  saveText: { color: '#fff', fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: 10 },
  content: { padding: 16, gap: 12 },
  field: { borderRadius: 10, padding: 12 },
  label: { fontSize: 12, marginBottom: 6 },
  input: { fontSize: 15 },
});
