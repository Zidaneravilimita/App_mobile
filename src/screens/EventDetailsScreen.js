// src/screens/EventDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toggleFavorite, isFavorite } from '../config/favorites';

export default function EventDetailsScreen({ route, navigation }) {
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
        .select('id_event, titre, description, date_event, image_url, id_ville, id_category, lieu_detail, category:category!events_id_category_fkey (nom_category)')
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
    } catch (e) {
      console.warn('Toggle favorite error', e);
    } finally {
      setFavBusy(false);
    }
  };


  // Fallbacks et extraction des champs
  const eventTitle = event?.titre || 'Titre non disponible';
  const eventDate = formatDate(event?.date_event);
  const eventDescription = event?.description || 'Aucune description disponible';
  const eventPhoto = event?.image_url || 'https://placehold.co/400x300/222/fff?text=Pas+Image';
  const eventVille = event?.villeName || event?.lieu_detail || 'Lieu non défini';
  const eventType = event?.category?.nom_category || event?.nom_category || event?.categoryName || 'Type inconnu';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
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
            <Text style={{ color: '#ccc', marginTop: 10 }}>Chargement de l'événement...</Text>
          </View>
        ) : error ? (
          <View style={{ marginTop: 120, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{ color: '#fff', marginBottom: 10 }}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                if (paramId) fetchEventById(paramId);
                else Alert.alert('Erreur', 'Aucun identifiant d\'événement fourni.');
              }}
              style={styles.retryButton}
            >
              <Text style={{ color: '#fff' }}>Réessayer</Text>
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

            <View style={styles.contentContainer}>
              <Text style={styles.eventTitle}>{eventTitle}</Text>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#8A2BE2" />
                  <Text style={styles.eventDate}>{eventDate}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#8A2BE2" />
                  <Text style={styles.eventLocation}>{eventVille}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#8A2BE2" />
                  <Text style={styles.eventType}>{eventType}</Text>
                </View>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.eventDescription}>{eventDescription}</Text>
              </View>

              <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite} disabled={favBusy}>
                  <Ionicons name={favActive ? 'heart' : 'heart-outline'} size={24} color={favActive ? '#FF4D4F' : '#fff'} />
                  <Text style={styles.actionButtonText}>Intéressée</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Participer</Text>
                </TouchableOpacity>
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
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});