// src/screens/InterestedScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { ensureOrganizerDm } from '../services/organizerMessaging';

export default function InterestedScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const event = route?.params?.event || null;
  const currentUserId = route?.params?.userId || null;

  const handleOpenChat = async () => {
    if (!event?.id_event || !currentUserId) return;
    const chatId = await ensureOrganizerDm({ event, userId: currentUserId, initialText: t('interested_intro') || 'Bonjour, je suis intéressé(e).' });
    navigation.replace('Chat', { chatId, title: event?.titre || 'Chat' });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }] }>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('interested')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="heart" size={36} color="#FF4D4F" />
          <Text style={[styles.title, { color: colors.text }]}>{t('addedToFavorites') || 'Ajouté aux favoris'}</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {t('interested_hint') || "Nous avons enregistré votre intérêt pour cet événement."}
          </Text>
          <View style={styles.eventRow}>
            {event?.image_url ? (
              <Image source={{ uri: event.image_url }} style={styles.thumb} />
            ) : null}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>{event?.titre || t('unknownTitle')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleOpenChat}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t('messageOrganizer') || "Contacter l'organisateur"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => navigation.replace('Favorites')}>
            <Ionicons name="heart" size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>{t('viewFavorites') || 'Voir favoris'}</Text>
          </TouchableOpacity>
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
  card: { alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 24, paddingHorizontal: 16 },
  title: { marginTop: 10, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 13, textAlign: 'center' },
  eventRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, width: '100%' },
  thumb: { width: 64, height: 48, borderRadius: 8 },
  eventTitle: { fontSize: 16, fontWeight: '600' },
  actions: { marginTop: 24 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, marginBottom: 12, gap: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
