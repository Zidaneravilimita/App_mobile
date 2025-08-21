// src/components/EventCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function EventCard({ event = {}, onPress }) {
  const eventTitle = event.nom_event || 'Titre non disponible';
  const eventPhoto = event.photo || 'https://placehold.co/400x200/222/fff?text=No+Image';

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <Text style={styles.eventTitle}>{eventTitle}</Text>
      <Image source={{ uri: eventPhoto }} style={styles.eventImage} resizeMode="cover" />
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
    height: 150,
  },
  eventTitle: {
    fontSize: 20,
    padding: 5,
    fontWeight: 'bold',
    color: '#fff',
  },
});