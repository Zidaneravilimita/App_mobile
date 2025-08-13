// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

import Header from '../components/Header';
import CategoryScroll from '../components/CategoryScroll';
import EventCard from '../components/EventCard';
import BottomNavBar from '../components/BottomNavBar';
import ImageUploader from '../components/ImageUploader';

export default function HomeScreen({ navigation }) {
  // État pour la navigation interne (main, uploader)
  const [currentContent, setCurrentContent] = useState('main');

  // États pour les événements
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les villes
  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState('all');

  /**
   * Gère la pression sur le bouton "Ajouter" de la barre de navigation inférieure.
   * Change le contenu affiché pour le formulaire de téléchargement d'image.
   */
  const handleAddPress = () => {
    setCurrentContent('uploader');
  };

  /**
   * Gère la pression sur le bouton "Accueil" de la barre de navigation inférieure
   * ou le bouton "Précédent" du formulaire de téléchargement.
   * Change le contenu affiché pour la page principale.
   */
  const handleHomePress = () => {
    setCurrentContent('main');
  };

  /**
   * Gère l'achèvement du téléchargement d'une image.
   * Affiche une alerte de succès, retourne à la page principale et recharge les événements.
   */
  const handleUploadComplete = () => {
    setCurrentContent('main');
    Alert.alert('Upload terminé', 'Votre image a été téléchargée avec succès !');
    fetchEvents(selectedVilleId);
  };

  /**
   * Récupère la liste des villes depuis la base de données Supabase.
   */
  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase.from('ville').select('*');
      if (error) throw error;
      setVilles(data);
      // Définit la première ville par défaut si la liste n'est pas vide
      if (data.length > 0) {
        setSelectedVilleId(data[0].id_ville.toString());
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des villes:", e);
      Alert.alert("Erreur", "Impossible de charger les villes.");
    }
  };

  /**
   * Récupère la liste des événements depuis la base de données Supabase,
   * avec un filtre optionnel par ID de ville.
   * @param {string} villeId - L'ID de la ville pour filtrer les événements.
   */
  const fetchEvents = async (villeId) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('event')
        .select(`
          *,
          ville (nom_ville),
          type_evenements (nom_event)
        `);

      // Ajoute le filtre par ville si un ID de ville est sélectionné
      if (villeId && villeId !== 'all') {
        query = query.eq('id_ville', villeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data);
    } catch (e) {
      console.error("Erreur lors de la récupération des événements:", e);
      setError("Impossible de charger les événements. Veuillez réessayer plus tard.");
      Alert.alert("Erreur", "Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  };

  // Premier useEffect : charge les villes une seule fois au montage du composant
  useEffect(() => {
    fetchVilles();
  }, []);

  // Deuxième useEffect : charge les événements chaque fois que la ville sélectionnée change
  // ou que la liste des villes est mise à jour (après la première récupération)
  useEffect(() => {
    if (selectedVilleId) {
      fetchEvents(selectedVilleId);
    }
  }, [selectedVilleId]);

  /**
   * Affiche le contenu principal de l'écran, soit les événements, soit l'interface d'upload.
   */
  const renderMainContent = () => {
    if (currentContent === 'uploader') {
      return (
        <View style={styles.uploaderContainer}>
          <TouchableOpacity onPress={handleHomePress} style={styles.backButton}>
            <Ionicons name="arrow-back-circle-outline" size={40} color="#fff" />
          </TouchableOpacity>
          <ImageUploader onUploadComplete={handleUploadComplete} onClose={handleHomePress} />
        </View>
      );
    } else {
      if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8A2BE2" />
          </View>
        );
      }

      if (error) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchEvents(selectedVilleId)} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        );
      }

      const popularEvents = events.filter(event => event.ville && event.type_evenements);

      return (
        <>
          <View style={styles.headerContainer}>
            <Header />
          </View>

          <View style={styles.cityPickerContainer}>
            <Picker
              selectedValue={selectedVilleId}
              onValueChange={(itemValue) => {
                setSelectedVilleId(itemValue);
              }}
              style={styles.pickerStyle}
              itemStyle={styles.pickerItemStyle}
            >
              <Picker.Item label="Toutes les villes" value="all" />
              {villes.map(ville => (
                <Picker.Item
                  key={ville.id_ville}
                  label={ville.nom_ville}
                  value={ville.id_ville.toString()}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.categoryContainer}>
            <CategoryScroll />
          </View>

          <Text style={styles.popularTitle}>Événements Populaires</Text>

          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {popularEvents.length > 0 ? (
              popularEvents.map((event) => (
                <EventCard
                  key={event.id_event}
                  event={event}
                  onPress={() => navigation.navigate('EventDetailsScreen', { event })}
                />
              ))
            ) : (
              <Text style={styles.noEventsText}>Aucun événement trouvé pour cette ville.</Text>
            )}
          </ScrollView>
        </>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {renderMainContent()}
        <BottomNavBar onAddPress={handleAddPress} onHomePress={handleHomePress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Layout styles
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  headerContainer: {
    paddingHorizontal: 15,
    paddingVertical: 2,
  },
  cityPickerContainer: {
    marginHorizontal: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    height: 40,
  },
  pickerStyle: {
    color: '#fff',
  },
  pickerItemStyle: {
    color: '#fff',
    backgroundColor: '#333',
  },
  categoryContainer: {
    height: 50,
    marginVertical: 5,
  },
  scrollViewContent: {
    paddingBottom: 20,
    paddingTop: 5,
    paddingHorizontal: 10,
  },
  uploaderContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  // Text styles
  popularTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 10,
  },
  noEventsText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  // Loading and Error styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8A2BE2',
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
