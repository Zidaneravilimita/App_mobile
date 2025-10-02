// src/screens/HelpScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n';

export default function HelpScreen({ navigation }) {
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('helpSupport')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.text}>{t('faqComing')}</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@eventparty.com')} style={styles.btn}>
          <Ionicons name="mail" size={18} color="#fff" />
          <Text style={styles.btnText}>support@eventparty.com</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  iconBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  container: { padding: 20 },
  text: { color: '#ccc', marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#8A2BE2', padding: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
});
