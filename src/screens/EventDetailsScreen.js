// src/screens/EventDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventDetailsScreen({ route, navigation }) {
  // Récupère les données de l'événement passées en paramètre de navigation
  const { event } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Bouton de retour */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Image de l'événement */}
        <Image source={{ uri: event.photo }} style={styles.eventImage} resizeMode="cover" />

        {/* Contenu de la carte de l'événement */}
        <View style={styles.contentContainer}>
          <Text style={styles.eventTitle}>{event.nom_event}</Text>
          <Text style={styles.eventDate}>Date : {event.date}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
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
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 16,
    color: '#eee',
    lineHeight: 24,
  },
});
