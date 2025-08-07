// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

import Header from '../components/Header';
import CategoryScroll from '../components/CategoryScroll';
import EventCard from '../components/EventCard';
import BottomNavBar from '../components/BottomNavBar';
import ImageUploader from '../components/ImageUploader';

export default function HomeScreen() {
  // Gère l'écran actuellement affiché DANS HomeScreen
  const [currentContent, setCurrentContent] = useState('main'); // 'main' ou 'uploader'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les événements depuis Supabase
  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Récupère toutes les colonnes de la table 'event'
      const { data, error } = await supabase.from('event').select('*');
      
      if (error) {
        throw error;
      }
      
      console.log('Données récupérées de Supabase:', data); // AJOUT DE CETTE LIGNE POUR LE DÉBOGAGE
      
      // Mettre à jour l'état avec les données récupérées
      setEvents(data);

    } catch (err) {
      console.error('Erreur de récupération des événements:', err.message);
      setError('Erreur : Impossible de récupérer les événements. Veuillez vérifier la connexion et le nom de la table.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Fonction passée à BottomNavBar pour changer le contenu
  const handleAddPress = () => {
    setCurrentContent('uploader');
  };

  // Fonction appelée par ImageUploader après un upload réussi
  const handleUploadComplete = () => {
    setCurrentContent('main'); // Revenir à l'écran principal après l'upload
    // Recharger les événements après un nouvel ajout
    fetchEvents(); 
    Alert.alert('Upload terminé', 'Votre image a été téléchargée avec succès !');
  };

  const renderMainContent = () => {
    if (currentContent === 'uploader') {
      return (
        <View style={styles.uploaderContainer}>
          {/* Bouton de retour pour quitter l'uploader */}
          <TouchableOpacity onPress={() => setCurrentContent('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          <ImageUploader onUploadComplete={handleUploadComplete} />
        </View>
      );
    }

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
        </View>
      );
    }

    // Affiche le contenu principal une fois les événements chargés
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <CategoryScroll />
          
          <Text style={styles.popularTitle}>Événements populaires</Text>
          
          {/* Affichage des EventCard basées sur les données de Supabase */}
          {events.length > 0 ? (
            events.map((event) => (
              <EventCard
                key={event.id_event} // Utilisez l'ID correct de la colonne
                title={event.nom_event} // Utilisez 'nom_event'
                participants={[]} // Les participants ne sont pas dans votre table actuelle
                image={{ uri: event.photo }} // Utilisez 'photo'
                onPress={() => Alert.alert('Détails de l\'événement', `Vous avez cliqué sur ${event.nom_event}`)}
              />
            ))
          ) : (
            <Text style={styles.noEventsText}>Aucun événement trouvé.</Text>
          )}

        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {renderMainContent()}
        {/* La BottomNavBar est rendue ici, à l'intérieur de HomeScreen */}
        <BottomNavBar onAddPress={handleAddPress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollViewContent: {
    paddingBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  popularTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  uploaderContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
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
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  noEventsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
