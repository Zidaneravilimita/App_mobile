// src/screens/EventDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toggleFavorite, isFavorite } from '../config/favorites';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { ensureOrganizerDm } from '../services/organizerMessaging';

export default function EventDetailsScreen({ route, navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  // Accepte soit un objet event passé via navigation, soit un id_event
  const paramEvent = route.params?.event || null;
  const paramId = route.params?.id_event || route.params?.id || null;

  const [event, setEvent] = useState(paramEvent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favActive, setFavActive] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const getCurrentUserId = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) return data.user.id;
    } catch {}
    try {
      const raw = await AsyncStorage.getItem('user_profile');
      const u = raw ? JSON.parse(raw) : null;
      if (u?.id) return u.id;
    } catch {}
    return 'demo-user-123';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Récupère l'événement depuis la table 'events' avec champs actuels et complète avec noms liés
  const fetchEventById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      // Tenter de récupérer aussi le nom de la catégorie via relation si elle est configurée
      let { data, error: err } = await supabase
        .from('events')
        .select('id_event, id_user, titre, description, date_event, image_url, id_ville, id_category, lieu_detail, category:category!events_id_category_fkey (nom_category)')
        .eq('id_event', id)
        .maybeSingle();

      if (err) {
        console.error('Erreur Supabase récupération event:', err);
        setError("Impossible de récupérer l'événement.");
        return;
      }

      if (!data) {
        setError("Événement introuvable.");
        return;
      }

      // Charger les noms liés (ville, catégorie) si disponibles
      let villeName = null;
      let categoryName = data?.category?.nom_category || null;

      const fetches = [];
      if (data.id_ville) {
        fetches.push(
          supabase
            .from('ville')
            .select('nom_ville')
            .eq('id_ville', data.id_ville)
            .maybeSingle()
            .then((r) => { villeName = r.data?.nom_ville || null; })
        );
      }
      if (!categoryName && data.id_category) {
        fetches.push(
          supabase
            .from('category')
            .select('nom_category')
            .eq('id_category', data.id_category)
            .maybeSingle()
            .then((r) => { categoryName = r.data?.nom_category || null; })
        );
      }
      if (fetches.length) {
        await Promise.all(fetches);
      }

      setEvent({ ...data, villeName, categoryName });
    } catch (e) {
      console.error('Erreur fetchEventById:', e);
      setError("Erreur réseau lors de la récupération de l'événement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!event && paramId) {
      fetchEventById(paramId);
    }
  }, [paramId]);

  useEffect(() => {
    // Update favorite state when event changes
    const checkFav = async () => {
      if (!event?.id_event) return setFavActive(false);
      const userId = await getCurrentUserId();
      const active = await isFavorite(userId, event.id_event);
      setFavActive(active);
    };
    checkFav();
  }, [event?.id_event]);

  const handleToggleFavorite = async () => {
    if (!event?.id_event || favBusy) return;
    setFavBusy(true);
    try {
      const userId = await getCurrentUserId();
      const res = await toggleFavorite(userId, event);
      setFavActive(res.active);
      // If now marked as interested, navigate to confirmation page
      if (res.active) {
        navigation.navigate('Interested', { event, userId });
      }
    } catch (e) {
      console.warn('Toggle favorite error', e);
    } finally {
      setFavBusy(false);
    }
  };


  // Fallbacks et extraction des champs
  const eventTitle = event?.titre || t('unknownTitle');
  const eventDate = formatDate(event?.date_event);
  const eventDescription = event?.description || '';
  const eventPhoto = event?.image_url || 'https://placehold.co/400x300/222/fff?text=Pas+Image';
  const eventVille = event?.villeName || event?.lieu_detail || t('unknownPlace');
  const eventType = event?.category?.nom_category || event?.nom_category || event?.categoryName || t('unknownType');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user?.id) {
          setCurrentUserId(data.user.id);
          return;
        }
      } catch {}
      try {
        const raw = await AsyncStorage.getItem('user_profile');
        const u = raw ? JSON.parse(raw) : null;
        if (u?.id) setCurrentUserId(u.id);
      } catch {}
    })();
  }, []);

  const canEdit = currentUserId && event?.id_user && currentUserId === event.id_user;

  const handleParticipate = async () => {
    try {
      const idEvt = event?.id_event || paramId;
      if (!idEvt) {
        Alert.alert('Erreur', t('errorNoEventId'));
        return;
      }
      if (!currentUserId) {
        Alert.alert('Info', t('loginRequired') || 'Veuillez vous connecter pour participer.');
        return;
      }

      // Ensure organizer id is present; HomeScreen's event may not include id_user
      let ev = event;
      if (!ev?.id_user) {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('id_event, id_user, titre')
            .eq('id_event', idEvt)
            .maybeSingle();
          if (!error && data) {
            ev = { ...ev, ...data };
            setEvent((prev) => ({ ...(prev || {}), ...data }));
          }
        } catch {}
      }

      if (!ev?.id_user) {
        Alert.alert('Erreur', t('genericError') || "Impossible de trouver l'organisateur.");
        return;
      }

      const chatId = await ensureOrganizerDm({
        event: ev,
        userId: currentUserId,
        initialText: t('participate_intro') || `Je souhaite participer à "${ev?.titre || ''}"`,
      });
      navigation.navigate('Chat', { chatId, title: ev?.titre || 'Chat' });
    } catch (e) {
      console.warn('handleParticipate error', e);
      Alert.alert('Erreur', t('genericError') || 'Une erreur est survenue.');
    }
  };

  const handleBuyTicket = () => {
    if (!event?.id_event) {
      Alert.alert('Erreur', t('errorNoEventId'));
      return;
    }
    navigation.navigate('Ticket', { event });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.container]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {loading ? (
          <View style={{ marginTop: 120, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Text style={{ color: '#ccc', marginTop: 10 }}>{t('loadingEvent')}</Text>
          </View>
        ) : error ? (
          <View style={{ marginTop: 120, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{ color: '#fff', marginBottom: 10 }}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                if (paramId) fetchEventById(paramId);
                else Alert.alert('Erreur', t('errorNoEventId'));
              }}
              style={styles.retryButton}
            >
              <Text style={{ color: '#fff' }}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: eventPhoto }}
              style={styles.eventImage}
              resizeMode="cover"
              onError={() => console.log('Erreur chargement image:', eventPhoto)}
            />

            <View style={[styles.contentContainer, { backgroundColor: colors.background }] }>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{eventTitle}</Text>

              <View style={styles.detailsContainer}>
                <View style={[styles.detailRow, { backgroundColor: colors.surface }]}>
                  <Ionicons name="calendar-outline" size={20} color="#8A2BE2" />
                  <Text style={[styles.eventDate, { color: colors.text }]}>{eventDate}</Text>
                </View>

                <View style={[styles.detailRow, { backgroundColor: colors.surface }]}>
                  <Ionicons name="location-outline" size={20} color="#8A2BE2" />
                  <Text style={[styles.eventLocation, { color: colors.text }]}>{eventVille}</Text>
                </View>

                <View style={[styles.detailRow, { backgroundColor: colors.surface }]}>
                  <Ionicons name="pricetag-outline" size={20} color="#8A2BE2" />
                  <Text style={[styles.eventType, { color: colors.text }]}>{eventType}</Text>
                </View>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={[styles.descriptionTitle, { color: colors.text }]}>{t('description')}</Text>
                <Text style={[styles.eventDescription, { backgroundColor: colors.surface, color: colors.subtext }]}>{eventDescription}</Text>
              </View>

              <View style={styles.actionContainer}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleToggleFavorite} disabled={favBusy}>
                  <Ionicons name={favActive ? 'heart' : 'heart-outline'} size={24} color={favActive ? '#FF4D4F' : '#fff'} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('interested')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={handleParticipate}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>{t('sendMessage')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleBuyTicket}>
                  <Ionicons name="qr-code" size={24} color={colors.text} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('buyTicket') || 'Acheter un billet'}</Text>
                </TouchableOpacity>

                {canEdit && (
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('EditEvent', { id_event: event.id_event })}>
                    <Ionicons name="create-outline" size={24} color={colors.text} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('editEvent')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  retryButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  eventImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#333',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#222',
    borderRadius: 10,
  },
  eventDate: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  eventType: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    borderColor: '#8A2BE2',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});