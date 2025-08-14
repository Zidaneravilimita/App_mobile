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
   * Gère la pression sur le bouton "Accueil" de la barre de navigation inférieure.
   * Change le contenu affiché pour l'écran principal.
   */
  const handleHomePress = () => {
    setCurrentContent('main');
  };

  /**
   * Gère la fin du téléchargement d'une image depuis ImageUploader.
   * Affiche une alerte de succès et recharge les événements.
   */
  const handleUploadComplete = () => {
    setCurrentContent('main');
    Alert.alert('Upload terminé', 'Votre image a été téléchargée avec succès !');
    fetchEvents();
  };

  /**
   * Récupère les événements depuis Supabase.
   * Filtre par ville si une ville est sélectionnée.
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase.from('event').select('*');

      if (selectedVilleId !== 'all') {
        query = query.eq('id_ville', selectedVilleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data);
    } catch (error) {
      setError(error);
      console.error('Erreur de récupération des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère la liste des villes depuis Supabase.
   */
  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase.from('ville').select('*');
      if (error) throw error;
      setVilles(data);
    } catch (error) {
      console.error('Erreur de récupération des villes:', error);
    }
  };

  // Exécute la récupération des événements et des villes au chargement du composant et lorsque selectedVilleId change.
  useEffect(() => {
    fetchEvents();
  }, [selectedVilleId]);

  useEffect(() => {
    fetchVilles();
  }, []);

  const renderMainContent = () => {
    if (currentContent === 'uploader') {
      return <ImageUploader onUploadComplete={handleUploadComplete} onClose={handleHomePress} />;
    } else {
      return (
        <>
          <Header />
          {/* Section Catégorie (fixe en haut) */}
          <Text style={styles.popularTitle}>Catégorie</Text>
          <CategoryScroll />

          {/* ScrollView pour le reste du contenu */}
          <ScrollView style={styles.scrollView}>
            {/* Picker pour filtrer par ville */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedVilleId}
                onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
                style={styles.pickerStyle}
                itemStyle={styles.pickerItemStyle}
              >
                <Picker.Item label="Toutes les villes" value="all" />
                {villes.map(ville => (
                  <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
                ))}
              </Picker>
            </View>

            {/* Titre pour la section Événements populaires */}
            <Text style={styles.popularTitle}>Événements populaires</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#8A2BE2" style={styles.activityIndicator} />
            ) : error ? (
              <Text style={styles.errorText}>Erreur de chargement des événements.</Text>
            ) : events.length > 0 ? (
              events.map((event) => (
                <EventCard
                  key={event.id_event}
                  event={event}
                  onPress={() => navigation.navigate('EventDetails', { eventId: event.id_event })}
                />
              ))
            ) : (
              <Text style={styles.noEventsText}>Aucun événement trouvé.</Text>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  pickerWrapper: {
    marginHorizontal: 15,
    marginVertical: 10,
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  activityIndicator: {
    marginTop: 20,
  },
});
