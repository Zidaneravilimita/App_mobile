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
import { useOptimizedImage } from '../hooks/useOptimizedImage';



export default function EventCard({ event = {}, onPress }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Clé unique pour cet événement spécifique
  const eventKey = `${event.id_event || 'unknown'}-${event.image_url || 'no-image'}`;

  // Hook pour la conversion automatique en WebP avec cache
  const { 
    uri: optimizedUri, 
    isLoading: isImageOptimizing, 
    error: optimizationError,
    refresh: refreshImage 
  } = useOptimizedImage(event.image_url, {
    quality: 0.8,
    maxWidth: 800,
    autoConvert: true,
    fallbackToOriginal: true,
    retryOnError: true,
    maxRetries: 2
  });

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

  // Gestion des images avec conversion WebP
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [eventKey]); // Utilise eventKey au lieu de optimizedUri

  const handleImageError = () => {
    console.log("❌ Erreur image optimisée pour:", eventTitle, "URI:", optimizedUri);
    setImageError(true);
    
    // Tente de rafraîchir l'image si c'est une erreur de conversion
    if (optimizationError && !imageError) {
      refreshImage();
    }
  };

  const handleImageLoad = () => {
    console.log("✅ Image optimisée chargée:", eventTitle);
    setImageLoaded(true);
  };

  return (
    <TouchableOpacity 
      key={eventKey}
      style={styles.cardContainer} 
      onPress={onPress}
    >
      {/* Image + overlay */}
      {optimizedUri && !imageError ? (
        <>
          <Image
            source={{ uri: optimizedUri }}
            style={styles.eventImage}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            style={styles.gradientOverlay}
          />

          {/* Indicateur de chargement (optimisation en cours) */}
          {(!imageLoaded || isImageOptimizing) && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="small" color="#8A2BE2" />
              {isImageOptimizing && (
                <Text style={styles.optimizingText}>Optimisation...</Text>
              )}
            </View>
          )}
        </>
      ) : event.image_url && event.image_url !== optimizedUri ? (
        // Fallback vers l'image originale si l'optimisation échoue
        <>
          <Image
            source={{ uri: event.image_url }}
            style={styles.eventImage}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            style={styles.gradientOverlay}
          />
        </>
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>📷</Text>
          <Text style={styles.noImageLabel}>
            {imageError ? "Erreur de chargement" : "Aucune image"}
          </Text>
          {imageError && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={refreshImage}
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          )}
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
    resizeMode: "cover",
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
  retryButton: {
    marginTop: ms(8),
    backgroundColor: "#8A2BE2",
    paddingVertical: ms(6),
    paddingHorizontal: ms(12),
    borderRadius: ms(6),
  },
  retryText: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "500",
  },
  optimizingText: {
    color: "#fff",
    fontSize: ms(10),
    marginTop: ms(4),
    textAlign: "center",
  },
});