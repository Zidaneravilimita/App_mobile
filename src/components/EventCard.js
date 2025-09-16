// src/components/EventCard.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function EventCard({ event = {}, onPress }) {
  const [imageError, setImageError] = useState(false);

  // ✅ Champs correspondant à ta table et jointure
  const eventTitle = event.titre || "Titre non disponible";
  const eventDate = event.date_event || "Date inconnue";
  const eventLieu = event.lieu || "Lieu non défini";
  const eventType = event.nom_category || "Catégorie inconnue"; // jointure avec `categories`

  // ✅ Image (colonne `image_url`)
  const eventPhoto =
    !imageError && event.image_url && event.image_url.startsWith("http")
      ? event.image_url
      : "https://placehold.co/400x200/222/fff?text=No+Image";

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Image + overlay */}
      <Image
        source={{ uri: eventPhoto }}
        style={styles.eventImage}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent"]}
        style={styles.gradientOverlay}
      />

      {/* Badge Catégorie */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{eventType}</Text>
      </View>

      {/* Infos événement */}
      <View style={styles.textContainer}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>
        <Text style={styles.eventDetails}>📅 {eventDate}</Text>
        <Text style={styles.eventDetails}>📍 {eventLieu}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#222",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  eventImage: {
    width: "100%",
    height: 220,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 220,
    borderRadius: 15,
  },
  textContainer: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  eventDetails: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "#FF6B6B",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
