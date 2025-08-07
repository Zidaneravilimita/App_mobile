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

  const renderMainContent = () => {
    if (currentContent === 'uploader') {
      return (
        <ImageUploader onUploadComplete={handleUploadComplete} onClose={handleHomePress} />
      );
    } else {
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
                  // Mise à jour de la fonction onPress pour naviguer vers l'écran de détails
                  onPress={() => navigation.navigate('EventDetails', { event })}
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

  // Other components styles
  loadingIndicator: {
    marginTop: 20
  }
});
