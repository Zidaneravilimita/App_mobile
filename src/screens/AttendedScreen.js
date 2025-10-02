// src/screens/AttendedScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

export default function AttendedScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('attended')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.centered}>
        <Ionicons name="checkmark-done" size={48} color={colors.muted} />
        <Text style={[styles.text, { color: colors.subtext }]}>{t('attendedPlaceholder')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  iconBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { textAlign: 'center' },
});
