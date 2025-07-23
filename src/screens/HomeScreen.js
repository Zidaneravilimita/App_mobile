// src/screens/HomeScreen.js
import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Text } from 'react-native'; // Assurez-vous que 'Text' est importé

import Header from '../components/Header';
import CategoryScroll from '../components/CategoryScroll';
import EventCard from '../components/EventCard';
import BottomNavBar from '../components/BottomNavBar';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
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
        <BottomNavBar />
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
    paddingHorizontal: 10, // Padding général du contenu de la ScrollView
  },
  popularTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20, // Espacement au-dessus du titre par rapport à la section des catégories
    marginBottom: 10, // Espacement en dessous du titre par rapport à la première carte d'événement
    paddingHorizontal: 25, // Aligne le titre avec le début réel des EventCard (10 padding de scrollViewContent + 15 margin de EventCard)
  },
});