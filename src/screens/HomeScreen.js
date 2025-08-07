// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

// Import des composants
import Header from '../components/Header';
import CategoryScroll from '../components/CategoryScroll';
import EventCard from '../components/EventCard';
import BottomNavBar from '../components/BottomNavBar';
import ImageUploader from '../components/ImageUploader';

// Component pour afficher les détails d'un événement
// Ce composant est maintenant géré par l'état de HomeScreen
function EventDetailsScreen({ event, onGoBack }) {
  if (!event) {
    return (
      <View style={[styles.container, styles.centerText]}>
        <Text style={styles.errorText}>Aucun événement sélectionné.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.detailsContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Image source={{ uri: event.photo }} style={styles.eventImage} resizeMode="cover" />

        <View style={styles.contentContainer}>
          <Text style={styles.eventTitle}>{event.nom_event}</Text>
          <Text style={styles.eventDate}>Date : {event.date}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  // 'main' : écran principal, 'uploader' : formulaire d'upload, 'details' : détails de l'événement
  const [currentContent, setCurrentContent] = useState('main');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleAddPress = () => {
    setCurrentContent('uploader');
  };

  const handleHomePress = () => {
    setCurrentContent('main');
    setSelectedEvent(null); // Assure la réinitialisation de l'événement sélectionné
  };

  const handleEventCardPress = (event) => {
    setSelectedEvent(event);
    setCurrentContent('details');
  };

  const handleUploadComplete = () => {
    setCurrentContent('main');
    Alert.alert('Upload terminé', 'Votre image a été téléchargée avec succès !');
    fetchEvents();
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('event').select('*');
      if (error) throw error;
      setEvents(data);
    } catch (err) {
      console.error('Erreur de récupération des événements:', err.message);
      setError('Erreur: Impossible de récupérer les événements. Vérifiez votre connexion ou les RLS sur Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const renderContent = () => {
    if (currentContent === 'uploader') {
      return (
        <ImageUploader onUploadComplete={handleUploadComplete} onClose={handleHomePress} />
      );
    } else if (currentContent === 'details') {
      return (
        <EventDetailsScreen event={selectedEvent} onGoBack={handleHomePress} />
      );
    } else { // currentContent === 'main'
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <CategoryScroll />
            <Text style={styles.popularTitle}>Événements populaires</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#8A2BE2" style={styles.loadingIndicator} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : events.length > 0 ? (
              events.map((event) => (
                <EventCard
                  key={event.id_event}
                  title={event.nom_event}
                  participants={[]}
                  image={{ uri: event.photo }}
                  onPress={() => handleEventCardPress(event)}
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
        {renderContent()}
        <BottomNavBar onAddPress={handleAddPress} onHomePress={handleHomePress} />
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
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  noEventsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  loadingIndicator: {
    marginTop: 20
  },
  // Styles pour EventDetailsScreen
  detailsContainer: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  eventImage: {
    width: '100%',
    height: 300,
  },
  contentContainer: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  eventDate: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 15,
  },
  eventDescription: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 24,
  },
  centerText: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
