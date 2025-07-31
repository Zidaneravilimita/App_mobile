// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import CategoryScroll from '../components/CategoryScroll';
import EventCard from '../components/EventCard';
import BottomNavBar from '../components/BottomNavBar'; // Importez BottomNavBar ici
import ImageUploader from '../components/ImageUploader'; // Importez ImageUploader ici

export default function HomeScreen() {
  // Gère l'écran actuellement affiché DANS HomeScreen
  const [currentContent, setCurrentContent] = useState('main'); // 'main' ou 'uploader'

  // Fonction passée à BottomNavBar pour changer le contenu
  const handleAddPress = () => {
    setCurrentContent('uploader');
  };

  // Fonction appelée par ImageUploader après un upload réussi
  const handleUploadComplete = () => {
    setCurrentContent('main'); // Revenir à l'écran principal après l'upload
    Alert.alert('Upload terminé', 'Votre image a été téléchargée avec succès !');
  };

  const renderMainContent = () => {
    if (currentContent === 'uploader') {
      return (
        <View style={styles.uploaderContainer}>
          {/* Bouton de retour pour quitter l'uploader */}
          <TouchableOpacity onPress={() => setCurrentContent('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}> Retour</Text>
          </TouchableOpacity>
          <ImageUploader onUploadComplete={handleUploadComplete} />
        </View>
      );
    } else { // currentContent === 'main'
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {/* Section Catégories */}
            <CategoryScroll />
            
            {/* Nouveau titre "Populaire" */}
            <Text style={styles.popularTitle}>Populaire</Text>

            {/* Cartes d'événements populaires */}
            <EventCard
              title="Soirée à Club 73" 
              participants={6}
              image={require('../../assets/images/Club/Club_73.jpg')} 
              onPress={() => console.log('Événement Richmond pressé')}
            />
            <EventCard
              title="Festival de Music" 
              participants={6}
              image={require('../../assets/images/Event/event_1.jpg')} 
              onPress={() => console.log('Événement Michael pressé')}
            />
            <EventCard
              title="Spéctacle public de Hira Gasy" 
              participants={10}
              image={require('../../assets/images/Evenements Culturel/hira gasy.jpg')} 
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
    paddingBottom: 20, // Assurez-vous qu'il y a assez d'espace pour la nav bar
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
    paddingTop: 50, // Pour laisser de la place au bouton retour
  },
  backButton: {
    position: 'absolute',
    top: 10, // Ajustez selon votre Safe Area
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
});
