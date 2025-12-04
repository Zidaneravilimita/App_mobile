import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

/**
 * NotifyDetailScreen
 * Affiche les détails complets d'une notification
 */
export default function NotifyDetailScreen({ route, navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { notification } = route.params || {};

  if (!notification) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de la notification</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#666" />
          <Text style={styles.errorText}>Notification introuvable</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la notification</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Titre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Titre</Text>
          <Text style={styles.title}>{notification.title || 'Sans titre'}</Text>
        </View>

        {/* Corps du message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <Text style={styles.body}>{notification.body || 'Aucun message'}</Text>
        </View>

        {/* Informations techniques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID :</Text>
            <Text style={styles.infoValue}>{notification.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créée le :</Text>
            <Text style={styles.infoValue}>{formatDate(notification.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut :</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: notification.is_sent ? '#4CAF50' : '#8A2BE2' }
              ]} />
              <Text style={styles.infoValue}>
                {notification.is_sent ? 'Lue' : 'Non lue'}
              </Text>
            </View>
          </View>
          {notification.sent_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lue le :</Text>
              <Text style={styles.infoValue}>{formatDate(notification.sent_at)}</Text>
            </View>
          )}
          {notification.user_id && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Utilisateur :</Text>
              <Text style={styles.infoValue}>{notification.user_id}</Text>
            </View>
          )}
        </View>

              </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Pour le safe area
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
    width: 100,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
    errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
});
