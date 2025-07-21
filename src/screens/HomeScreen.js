<<<<<<< HEAD
import EventCard from '../components/EventCard';
import { View, Text, StyleSheet } from 'react-native'; 


<View style={styles.section}>
  <Text style={styles.sectionTitle}>Les événements populaires</Text>

  <EventCard
    title="Summer Beach Party"
    participants={250}
    image={require('../../assets/images/event_1.jpg')}
    onPress={() => {}}
  />
  <EventCard
    title="Soirée VIP Black & Gold"
    participants={120}
    image={require('../../assets/images/event_1.jpg')} 
    onPress={() => {}}
  />
</View>


const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    // Add other styles for your section container
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    // Add other styles for your section title
=======
// src/screens/HomeScreen.js
import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

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
          <CategoryScroll />
          {/* Exemple de cartes d'événements - tu peux les rendre dynamiques plus tard */}
          <EventCard name="Richmond Tiano" eventType="Soirée Club" participants={6} />
          <EventCard name="Michael Jean" eventType="Soirée Club" participants={6} />
          <EventCard name="Sarah Dupont" eventType="Festival EDM" participants={10} />
          {/* Ajoute d'autres EventCard au besoin */}
        </ScrollView>
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a', // Couleur de fond générale de l'application
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollViewContent: {
    paddingBottom: 20, // Espace en bas pour ne pas que le contenu soit coupé par la navbar
>>>>>>> 75daf5e30bf511ea6061a2885e4bc5dea904c27e
  },
});