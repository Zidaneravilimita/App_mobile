// src/components/EventCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function EventCard({ event, onPress }) {
  // Déconstruction des props avec des valeurs par défaut pour éviter les erreurs si les données sont manquantes
  // Nous utilisons l'opérateur de chaînage optionnel `?.` pour accéder en toute sécurité aux propriétés imbriquées
  const eventTitle = event.nom_event || 'Titre non disponible';
  const eventDate = event.date || 'Date non disponible';
  const eventPhoto = event.photo || 'https://placehold.co/400x200/222/fff?text=No+Image';
  const eventLocation = event.ville?.nom_ville || 'Lieu non spécifié';
  const eventType = event.type_evenements?.nom_event || 'Type non spécifié';

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <Image source={{ uri: eventPhoto }} style={styles.eventImage} />
      <View style={styles.textContainer}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>
        <Text style={styles.eventDetails}>🗓️ {eventDate}</Text>
        <Text style={styles.eventDetails}>📍 {eventLocation}</Text>
        <Text style={styles.eventDetails}>🏷️ {eventType}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#333',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  textContainer: {
    padding: 15,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  eventDetails: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
});
