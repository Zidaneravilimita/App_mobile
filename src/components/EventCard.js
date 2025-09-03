// src/components/EventCard.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
export default function EventCard({ event = {}, onPress }) {
  const [imageError, setImageError] = useState(false);
  const eventTitle = event.nom_event || "Titre non disponible";
  const eventDate = event.date || "Date inconnue";
  const eventVille = event.ville || "Lieu non défini";
  const eventType = event.type_event || "Type inconnu";

  // ✅ Si erreur de chargement, on bascule vers une image placeholder
  const eventPhoto =
    !imageError && event.photo && event.photo.startsWith("http")
      ? event.photo
      : "https://placehold.co/400x200/222/fff?text=No+Image";

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Image de l'événement */}
      <Image
        source={{ uri: eventPhoto }}
        style={styles.eventImage}
        resizeMode="cover"
        onError={() => {
          console.log("❌ Erreur de chargement image pour:", eventTitle);
          setImageError(true);
        }}
      />

      {/* Infos événement */}
      <View style={styles.textContainer}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>
        <Text style={styles.eventDetails}>📅 {eventDate}</Text>
        <Text style={styles.eventDetails}>📍 {eventVille}</Text>
        <Text style={styles.eventDetails}>🎭 {eventType}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#333",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  eventImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#555",
  },
  textContainer: {
    padding: 10,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  eventDetails: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 2,
  },
});
