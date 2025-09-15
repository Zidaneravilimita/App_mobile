// src/components/EventCard.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

export default function EventCard({ event = {}, onPress }) {
  const [imageError, setImageError] = useState(false);

  // ✅ Champs correspondant à ta table et jointure
  const eventTitle = event.titre || "Titre non disponible";
  const eventDate = event.date_event || "Date inconnue";
  const eventLieu = event.lieu || "Lieu non défini";
  const eventType = event.nom_category || "Catégorie inconnue"; // récupéré via jointure avec `categories`

  // ✅ Image (colonne `image_url`)
  const eventPhoto =
    !imageError && event.image_url && event.image_url.startsWith("http")
      ? event.image_url
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
        <Text style={styles.eventDetails}>📍 {eventLieu}</Text>
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
