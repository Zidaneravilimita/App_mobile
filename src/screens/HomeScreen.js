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
          {/* Le CategoryScroll aura son propre espacement interne si nécessaire,
              ou sera espacé par le paddingHorizontal du scrollViewContent */}
          <CategoryScroll />
          
          {/* Les EventCard ont déjà un marginHorizontal et marginBottom dans leur propre style */}
          <EventCard
            title="Soirée Club de Richmond" 
            participants={6}
            image={require('../../assets/images/Club/Club_73.jpg')} 
            onPress={() => console.log('Événement Richmond pressé')}
          />
          <EventCard
            title="Festival de Michael Jean" 
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
    paddingHorizontal: 10, //  pour un espacement latéral
  },
});