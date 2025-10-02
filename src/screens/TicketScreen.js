// src/screens/TicketScreen.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';

export default function TicketScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const event = route?.params?.event || null;

  const code = useMemo(() => {
    const base = `${event?.id_event || 'event'}-${event?.titre || 'ticket'}`;
    // simple deterministic hash-like code
    let hash = 0;
    for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    const s = hash.toString(36).toUpperCase();
    return `EVT-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`.replace(/-+$/,'');
  }, [event?.id_event, event?.titre]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('ticket')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
          {event?.titre || t('unknownTitle')}
        </Text>
        <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="qr-code" size={72} color={colors.primary} />
          <Text style={[styles.ticketCode, { color: colors.text }]}>{code}</Text>
          <Text style={[styles.hint, { color: colors.subtext }]}>
            {t('ticket_hint') || 'Présentez ce code à l’entrée. Le QR détaillé viendra plus tard.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  body: { padding: 20 },
  eventTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  ticketCard: { alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 24, paddingHorizontal: 16 },
  ticketCode: { fontSize: 20, fontWeight: 'bold', letterSpacing: 2, marginTop: 10 },
  hint: { fontSize: 12, marginTop: 6, textAlign: 'center' },
});
