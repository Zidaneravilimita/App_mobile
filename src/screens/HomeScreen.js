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
  },
});