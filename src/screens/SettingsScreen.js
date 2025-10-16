// src/screens/SettingsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../i18n';

const THEME_KEY = 'pref_theme'; // 'light' | 'dark'
const NOTIF_KEY = 'pref_notifications'; // boolean

export default function SettingsScreen({ navigation }) {
  const { t, lang, setLanguage } = useI18n();
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const t = (await AsyncStorage.getItem(THEME_KEY)) || 'dark';
        const n = await AsyncStorage.getItem(NOTIF_KEY);
        setTheme(t);
        setNotifications(n === null ? true : n === 'true');
      } catch {}
    };
    load();
  }, []);

  const savePrefs = async (nextTheme, nextNotif) => {
    setSaving(true);
    try {
      await AsyncStorage.multiSet([
        [THEME_KEY, nextTheme],
        [NOTIF_KEY, String(nextNotif)],
      ]);
    } finally {
      setSaving(false);
    }
  };

  const onToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    savePrefs(next, notifications);
  };

  const onToggleNotif = () => {
    const next = !notifications;
    setNotifications(next);
    savePrefs(theme, next);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('appearance')}</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="moon" size={18} color="#ccc" />
            <Text style={styles.rowText}>{t('darkTheme')}</Text>
          </View>
          <Switch value={theme === 'dark'} onValueChange={onToggleTheme} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications')}</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications" size={18} color="#ccc" />
            <Text style={styles.rowText}>{t('enableNotifications')}</Text>
          </View>
          <Switch value={notifications} onValueChange={onToggleNotif} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.langBtn, lang === 'fr' && styles.langBtnActive]} onPress={() => setLanguage('fr')}>
            <Text style={styles.langText}>{t('french')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} onPress={() => setLanguage('en')}>
            <Text style={styles.langText}>{t('english')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {saving ? <Text style={styles.saving}>{t('saving')}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  iconBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { backgroundColor: '#222', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 14 },
  sectionTitle: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { color: '#fff', fontSize: 16 },
  saving: { color: '#999', textAlign: 'center', marginTop: 10 },
  langBtn: { flex: 1, backgroundColor: '#2a2a2a', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  langBtnActive: { backgroundColor: '#8A2BE2' },
  langText: { color: '#fff', fontWeight: '600' },
});
