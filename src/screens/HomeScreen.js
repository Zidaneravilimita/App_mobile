// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/Header';
import CategoryScroll from '../components/CategoryScroll';
import EventCard from '../components/EventCard';
import BottomNavBar from '../components/BottomNavBar';
import ImageUploader from '../components/ImageUploader';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [currentContent, setCurrentContent] = useState('main');

  const handleAddPress = () => {
    setCurrentContent('uploader');
  };
  
  // Nouvelle fonction pour naviguer vers l'écran de profil
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  // Nouvelle fonction pour naviguer vers l'écran d'accueil
  const handleHomePress = () => {
    navigation.navigate('Home');
  };

  const handleUploadComplete = () => {
    setCurrentContent('main');
    Alert.alert('Upload terminé', 'Votre image a été téléchargée avec succès !');
  };

  const renderMainContent = () => {
    if (currentContent === 'uploader') {
      return (
        <View style={styles.uploaderContainer}>
          <TouchableOpacity onPress={() => setCurrentContent('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          <ImageUploader onUploadComplete={handleUploadComplete} onClose={() => setCurrentContent('main')} />
        </View>
      );
    } else {
      const eventsData = [
        { id: '1', title: 'EXEMPLE', photo: 'https://kttziaqzsvtamgaijtzj.supabase.co/storage/v1/object/public/images/public_images/1754399043646.jpg', description: 'Teste', date: '2025-11-20' },
        { id: '2', title: 'Soirée', photo: 'https://kttziaqzsvtamgaijtzj.supabase.co/storage/v1/object/public/images/public_images/1754563337183.png', description: 'test1', date: '2025-08-11' },
      ];

      const handleEventCardPress = (event) => {
        navigation.navigate('EventDetails', { event });
      };

      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <CategoryScroll />
            <Text style={styles.popularTitle}>Événements à la une</Text>
            {eventsData.map(event => (
              <EventCard
                key={event.id}
                title={event.title}
                image={{ uri: event.photo }}
                onPress={() => handleEventCardPress(event)}
              />
            ))}
            <EventCard
              title="Événement culturel"
              image={{ uri: 'https://placehold.co/600x400/8A2BE2/ffffff?text=Culturel' }}
              onPress={() => console.log('Événement culturel')}
            />
            
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
        <BottomNavBar 
          onAddPress={handleAddPress} 
          onProfilePress={handleProfilePress}
          onHomePress={handleHomePress}
        />
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
    paddingHorizontal: 25,
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
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
});
