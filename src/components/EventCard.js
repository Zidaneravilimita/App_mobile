// src/components/EventCard.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ms, hp, wp } from '../theme/responsive';



export default function EventCard({ event = {}, onPress }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState(null);

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

  // Champs selon la table events avec jointures
  const eventTitle = event.titre || "Titre non disponible";
  const eventDate = formatDate(event.date_event);
  // Récupérer la ville
  const eventVille = event.ville?.nom_ville || event.nom_ville || "Ville non définie";
  // Récupérer la catégorie
  const eventType = event.category?.nom_category || event.nom_category || "Catégorie inconnue";

  // Gestion des images avec cache-busting
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    if (event.image_url && event.image_url.startsWith('http')) {
      const timestamp = new Date().getTime();
      const imageUrl = event.image_url.includes('?')
        ? `${event.image_url}&t=${timestamp}`
        : `${event.image_url}?t=${timestamp}`;
      setCurrentImageUri(imageUrl);
    } else {
      setCurrentImageUri(null);
    }
  }, [event.image_url]);

  const handleImageError = () => {
    console.log("❌ Erreur image pour:", eventTitle, "URL:", event.image_url);
    setImageError(true);
    setCurrentImageUri(null);
  };

  const handleImageLoad = () => {
    console.log("✅ Image chargée avec succès:", eventTitle);
    setImageLoaded(true);
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Image + overlay */}
      {currentImageUri && !imageError ? (
        <>
          <Image
            source={{ uri: currentImageUri }}
            style={styles.eventImage}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            style={styles.gradientOverlay}
          />

          {/* Indicateur de chargement */}
          {!imageLoaded && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="small" color="#8A2BE2" />
            </View>
          )}
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
    borderRadius: ms(12),
    overflow: "hidden",
    marginBottom: ms(16),
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  eventImage: {
    width: "100%",
    height: hp(22),
    backgroundColor: "#333",
  },
  imageLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  noImageContainer: {
    width: "100%",
    height: hp(22),
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: ms(36),
    marginBottom: ms(8),
  },
  noImageLabel: {
    color: "#888",
    fontSize: ms(14),
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: hp(22),
    borderRadius: ms(12),
  },
  textContainer: {
    position: "absolute",
    bottom: ms(12),
    left: ms(12),
    right: ms(12),
  },
  eventTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: ms(4),
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventDetails: {
    fontSize: ms(12),
    color: "#ddd",
    marginTop: ms(2),
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  badge: {
    position: "absolute",
    top: ms(10),
    left: ms(10),
    backgroundColor: "#8A2BE2",
    paddingVertical: ms(4),
    paddingHorizontal: ms(10),
    borderRadius: ms(10),
  },
  badgeText: {
    color: "#fff",
    fontSize: ms(10),
    fontWeight: "600",
  },
});