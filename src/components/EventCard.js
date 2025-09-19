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

  // ✅ Champs selon la table events avec jointures
  const eventTitle = event.titre || "Titre non disponible";
  const eventDate = formatDate(event.date_event);
  
  // Récupérer la ville depuis la jointure ou directement
  const eventVille = event.ville?.nom_ville || event.nom_ville || "Ville non définie";

  // Récupérer la catégorie depuis la jointure ou directement
  const eventType = event.category?.nom_category || event.nom_category || "Catégorie inconnue";

  // ✅ Gestion améliorée des images
  const getEventImage = () => {
    // Si image_url est null ou vide
    if (!event.image_url) {
      return null;
    }
    
    // Si image_url est une URL valide, l'utiliser
    if (event.image_url.startsWith('http')) {
      return event.image_url;
    }
    
    return null;
  };

  const eventPhoto = !imageError ? getEventImage() : null;

  const handleImageError = () => {
    console.log("Erreur image");
    setImageError(true);
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Image + overlay - seulement si eventPhoto existe */}
      {eventPhoto ? (
        <>
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
        </>
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>📷</Text>
          <Text style={styles.noImageLabel}>Aucune image</Text>
        </View>
      )}

      {/* Badge Catégorie */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{eventType}</Text>
      </View>

      {/* Infos événement */}
      <View style={styles.textContainer}>
        <Text style={styles.eventTitle}>{eventTitle}</Text>
        <Text style={styles.eventDetails}>📅 {eventDate}</Text>
        <Text style={styles.eventDetails}>📍 {eventVille}</Text>
        {event.lieu_detail && (
          <Text style={styles.eventDetails}>🏛️ {event.lieu_detail}</Text>
        )}
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
  noImageContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 40,
    marginBottom: 10,
  },
  noImageLabel: {
    color: "#888",
    fontSize: 16,
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