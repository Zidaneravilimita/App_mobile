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
          
          {/* Appel aux EventCard avec les props corrigées, incluant 'image' */}
          <EventCard
            title="Soirée Club de Richmond" 
            participants={6}
            image={require('../../assets/images/Club/Club_73.jpg')} // Chemin relatif correct pour l'image
            onPress={() => console.log('Événement Richmond pressé')}
          />
          <EventCard
            title="Festival de Michael Jean" 
            participants={6}
            image={require('../../assets/images/Event/event_1.jpg')} // Chemin relatif correct pour l'image
            onPress={() => console.log('Événement Michael pressé')}
          />
          <EventCard
            title="Festival EDM de Sarah" 
            participants={10}
            image={require('../../assets/images/Club/Club_73.jpg')} // Un autre chemin d'image d'exemple
            onPress={() => console.log('Événement Sarah pressé')}
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
  },
});