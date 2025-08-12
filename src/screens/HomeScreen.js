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

export default function HomeScreen({ navigation }) {
  const [currentContent, setCurrentContent] = useState('main');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleAddPress = () => {
    setCurrentContent('uploader');
  };

  const handleHomePress = () => {
    setCurrentContent('main');
  };

  const handleUploadComplete = () => {
    setCurrentContent('main');
    Alert.alert('Upload terminé', 'Votre image a été téléchargée avec succès !');
    fetchEvents();
  };

  // Met à jour la fonction pour récupérer les données jointes
  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Jointure des tables pour récupérer le nom de la ville et le type d'événement
      const { data, error } = await supabase
        .from('event')
        .select(`
          *,
          type_evenements ( nom_event ),
          ville ( nom_ville )
        `);
      
      if (error) {
        throw error;
      }
      
      setEvents(data);
    } catch (error) {
      setError(error.message);
      console.error('Erreur lors de la récupération des événements:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCardPress = (event) => {
    navigation.navigate('EventDetailsScreen', { event });
  };

  const renderMainContent = () => {
    if (currentContent === 'uploader') {
      return (
        <View style={styles.uploaderContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleHomePress}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ImageUploader onUploadComplete={handleUploadComplete} onClose={handleHomePress} />
        </View>
      );
    } else {
      return (
        <>
          <Header />
          <CategoryScroll />
          <Text style={styles.popularTitle}>Événements populaires</Text>
          <ScrollView
            horizontal={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#8A2BE2" />
            ) : error ? (
              <Text style={styles.errorText}>Erreur: {error}</Text>
            ) : events && events.length > 0 ? (
              events.map((event) => (
                // L'objet `event` contient maintenant les données de la jointure
                <EventCard
                  key={event.id_event}
                  event={{
                    ...event,
                    type_event_name: event.type_evenements.nom_event,
                    ville_name: event.ville.nom_ville,
                  }}
                  onPress={() => handleCardPress(event)}
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
  scrollViewContent: {
    paddingBottom: 20,
    paddingTop: 20,
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
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  noEventsText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
});
