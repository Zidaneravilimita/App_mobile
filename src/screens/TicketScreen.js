// src/screens/TicketScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { ensureOrganizerDm } from '../services/organizerMessaging';
import { supabase } from '../config/supabase';

export default function TicketScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const event = route?.params?.event || null;
  const [firstName, setFirstName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [wallet, setWallet] = useState('orange'); // 'orange' | 'mvola' | 'airtel'
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const code = useMemo(() => {
    const base = `${event?.id_event || 'event'}-${event?.titre || 'ticket'}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    const s = hash.toString(36).toUpperCase();
    return `EVT-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`.replace(/-+$/,'');
  }, [event?.id_event, event?.titre]);

  const handleSubmit = async () => {
    if (!event?.id_event) {
      Alert.alert('Erreur', t('errorNoEventId'));
      return;
    }
    const amt = parseFloat(amount.replace(/,/g, '.'));
    if (!firstName.trim() || !address.trim() || !phone.trim() || !wallet || isNaN(amt) || amt <= 0) {
      Alert.alert('Info', t('fillRequired') || 'Veuillez renseigner les champs requis.');
      return;
    }
    setSubmitting(true);
    try {
      // Optionnel: enregistrer une requête de ticket côté serveur si une table existe
      // try { await supabase.from('ticket_requests').insert({ event_id: event.id_event, first_name: firstName, address, phone, wallet, amount: amt }); } catch {}
      setDone(true);
    } catch (e) {
      Alert.alert('Erreur', t('genericError') || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const messageOrganizer = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (!userId) { Alert.alert('Info', t('loginRequired') || 'Veuillez vous connecter.'); return; }
      const conversationId = await ensureOrganizerDm({ event, userId, initialText: t('ticket_request_msg') || 'Bonjour, je souhaite acheter un billet.' });
      if (!conversationId) { Alert.alert('Erreur', t('genericError') || "Impossible d'ouvrir la conversation."); return; }
      navigation.navigate('Chat', { conversationId, title: event?.titre || 'Chat' });
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('buyTicket') || 'Acheter un billet'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
          {event?.titre || t('unknownTitle')}
        </Text>

        {!done ? (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('firstName') || 'Prénom'}
              placeholderTextColor={colors.subtext}
            />

            <TextInput
              value={address}
              onChangeText={setAddress}
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('address') || 'Adresse'}
              placeholderTextColor={colors.subtext}
            />

            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('phoneTransfer') || 'N° de telephone du déposant'}
              placeholderTextColor={colors.subtext}
            />
            <View style={styles.walletRow}>
              <TouchableOpacity onPress={() => setWallet('orange')} hitSlop={{top:8,bottom:8,left:8,right:8}} style={[
                styles.walletBtn,
                { borderColor: wallet==='orange'? '#FF7900' : colors.border, backgroundColor: wallet==='orange'? '#FFFFFF': colors.card }
              ]}> 
                <Image source={require('../../assets/mobile_money/orange_money.png')} style={styles.walletIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWallet('mvola')} hitSlop={{top:8,bottom:8,left:8,right:8}} style={[
                styles.walletBtn,
                { borderColor: '#00A859', backgroundColor: '#FFD700' }
              ]}> 
                <Image source={require('../../assets/mobile_money/mvola.png')} style={styles.walletIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWallet('airtel')} hitSlop={{top:8,bottom:8,left:8,right:8}} style={[
                styles.walletBtn,
                { borderColor: '#E62E2D', backgroundColor: '#FFFFFF' }
              ]}> 
                <Image source={require('../../assets/mobile_money/airtel_money.png')} style={styles.walletIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('amount') || "Montant d'achat"}
              placeholderTextColor={colors.subtext}
            />

            <TouchableOpacity disabled={submitting} onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="card" size={20} color="#fff" />
              <Text style={styles.submitText}>{submitting ? (t('saving') || 'Saving...') : (t('buyTicket') || 'Acheter un billet')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.secondaryBtn, { borderColor: colors.border }]}>
              <Ionicons name="close" size={18} color={colors.text} />
              <Text style={[styles.secondaryText, { color: colors.text }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
            <Text style={[styles.successTitle, { color: colors.text }]}>{t('purchase_success') || 'Demande de billet envoyée'}</Text>
            <Text style={[styles.hint, { color: colors.subtext, textAlign: 'center' }]}>
              {t('purchase_info') || "L'organisateur vous enverra le code QR après validation de l'achat."}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 16 }]}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.submitText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}
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
  formCard: { borderWidth: 1, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16 },
  label: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 16 },
  textarea: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, marginTop: 12, gap: 8 },
  submitText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 10, gap: 8 },
  secondaryText: { fontWeight: '700' },
  hint: { fontSize: 12, marginTop: 6 },
  successTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  walletBtn: { flex: 1, borderWidth: 2, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  walletIcon: { width: 56, height: 56 },
});
