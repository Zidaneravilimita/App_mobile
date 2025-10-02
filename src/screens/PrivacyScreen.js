// src/screens/PrivacyScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen({ navigation }) {
  const requestDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Pour des raisons de sécurité, la suppression totale nécessite une confirmation. Voulez-vous envoyer une demande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Envoyer', onPress: () => Alert.alert('Envoyé', 'Votre demande a été prise en compte.') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.text}>Politique de confidentialité et conditions d'utilisation à venir.</Text>
        <TouchableOpacity onPress={requestDeleteAccount} style={styles.dangerBtn}>
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.dangerText}>Supprimer mon compte</Text>
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
  container: { padding: 20, gap: 12 },
  text: { color: '#ccc' },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E53935', padding: 12, borderRadius: 8, marginTop: 10 },
  dangerText: { color: '#fff', fontWeight: '700' },
});
