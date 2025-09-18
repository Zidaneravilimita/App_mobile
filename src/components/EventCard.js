// src/components/EventCard.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function EventCard({ event = {}, onPress }) {
  const [imageError, setImageError] = useState(false);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // ✅ Champs selon la table events
  const eventTitle = event.titre || "Titre non disponible";
  const eventDate = formatDate(event.date_event);
  
  // Récupérer la ville
  const eventVille = event.id_ville || "Ville non définie";

  // Récupérer la catégorie
  const eventType = event.category || "Catégorie inconnue";

  // ✅ Gestion améliorée des images
  const getEventImage = () => {
    // Si image_url est null, vide, ou est un placeholder avec erreur
    if (!event.image_url || event.image_url.includes('placehold.co')) {
      // Utiliser un placeholder SIMPLE sans texte complexe
      return `https://placehold.co/600x400/8A2BE2/white?text=Event`;
    }
    
    // Si image_url est une URL valide, l'utiliser
    if (event.image_url.startsWith('http')) {
      return event.image_url;
    }
    
    // Fallback vers un placeholder simple
    return `https://placehold.co/600x400/8A2BE2/white?text=Event`;
  };

  const eventPhoto = !imageError ? getEventImage() : `https://placehold.co/600x400/8A2BE2/white?text=Event`;

  const handleImageError = () => {
    console.log("Erreur image, utilisation fallback");
    setImageError(true);
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Image + overlay */}
      <Image
        source={{ uri: eventPhoto }}
        style={styles.eventImage}
        resizeMode="cover"
        onError={handleImageError}
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
        <Text style={styles.eventDetails}>📍 {eventVille}</Text>
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
    backgroundColor: "#333",
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
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventDetails: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  badge: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "#8A2BE2",
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