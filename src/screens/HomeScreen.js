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
   * Gère la pression sur le bouton "Home" de la barre de navigation inférieure.
   * Change le contenu affiché pour l'écran principal.
   */
  const handleHomePress = () => {
    setCurrentContent('main');
  };

  /**
   * Récupère les événements de la base de données Supabase.
   * Filtre les événements en fonction de la ville sélectionnée.
   */
  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase.from('event').select(`
        *,
        ville ( nom_ville ),
        type_evenements ( nom_event )
      `);

      // Si une ville est sélectionnée (et ce n'est pas "all"), filtre par ville
      if (selectedVilleId !== 'all') {
        query = query.eq('id_ville', selectedVilleId);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      setEvents(data);
    } catch (e) {
      console.error('Erreur lors de la récupération des événements :', e);
      setError('Impossible de charger les événements.');
      Alert.alert('Erreur', 'Impossible de charger les événements : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère la liste des villes pour le sélecteur.
   */
  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase.from('ville').select('*');
      if (error) throw error;
      setVilles(data);
    } catch (e) {
      console.error('Erreur lors de la récupération des villes :', e);
    }
  };

  // Lance le chargement des villes et des événements au montage du composant et à chaque changement de ville
  useEffect(() => {
    fetchVilles();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedVilleId]);

  /**
   * Gère le clic sur une carte d'événement et navigue vers l'écran de détails.
   * @param {object} event - L'objet événement cliqué.
   */
  const handleEventPress = (event) => {
    navigation.navigate('EventDetails', { event });
  };

  const renderMainContent = () => {
    // Si nous sommes sur l'écran du formulaire de téléchargement d'image...
    if (currentContent === 'uploader') {
      return (
        <View style={styles.uploaderContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleHomePress}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ImageUploader onUploadComplete={() => {
            setCurrentContent('main');
            fetchEvents(); // Rafraîchit la liste des événements après un téléversement réussi
          }} onClose={handleHomePress} />
        </View>
      );
    } else {
      // ...sinon, affiche le contenu principal
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={styles.scrollViewContent}>

            {/* TITRE POUR LA SECTION CATÉGORIES */}
            <Text style={styles.sectionTitle}>Catégories</Text>

            {/* Ajout d'une marge horizontale au composant CategoryScroll */}
            <View style={styles.categoryContainer}>
              <CategoryScroll onSelectCategory={(id) => {
                console.log('Catégorie sélectionnée:', id);
                // Ajoutez ici la logique pour filtrer les événements par catégorie
              }} />
            </View>
            
            {/* Titre pour le sélecteur de ville */}
            <Text style={styles.sectionTitle}>Filtrer par ville</Text>

            {/* Sélecteur de ville pour filtrer les événements */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedVilleId}
                onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
                style={styles.pickerStyle}
                itemStyle={styles.pickerItemStyle}
              >
                <Picker.Item label="Toutes les villes" value="all" />
                {villes.map((ville) => (
                  <Picker.Item
                    key={ville.id_ville}
                    label={ville.nom_ville}
                    value={ville.id_ville}
                  />
                ))}
              </Picker>
            </View>

            {/* TITRE POUR LA SECTION ÉVÉNEMENTS POPULAIRES */}
            <Text style={styles.popularTitle}>Événements populaires</Text>

            {/* Afficheur de chargement ou message d'erreur */}
            {loading ? (
              <ActivityIndicator size="large" color="#8A2BE2" style={styles.loader} />
            ) : error ? (
              <Text style={styles.noEventsText}>{error}</Text>
            ) : events.length > 0 ? (
              // Affiche la liste des EventCard si des événements sont trouvés
              events.map((event) => (
                <EventCard
                  key={event.id_event}
                  event={event}
                  onPress={() => handleEventPress(event)}
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
  // La ScrollView principale pour le contenu, avec un padding horizontal pour l'alignement
  scrollViewContent: {
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  // Conteneur pour le sélecteur, avec des marges
  pickerWrapper: {
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
  // Conteneur pour les catégories, avec une hauteur définie pour le défilement horizontal
  categoryContainer: {
    height: 140, // Augmentation de la hauteur pour inclure le titre et l'espacement
    marginVertical: 5,
    marginBottom: 20, // Ajout d'une marge en bas pour séparer des événements
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
  loader: {
    marginTop: 20,
  },
  // Text styles
  sectionTitle: { // Nouveau style pour le titre "Catégories"
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15, // Marge pour le titre "Catégories"
  },
  popularTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15, // Ajout d'une marge supérieure pour le séparer des catégories
    marginBottom: 10,
  },
  noEventsText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
