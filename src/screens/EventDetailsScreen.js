// src/screens/EventDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventDetailsScreen({ route, navigation }) {
  // Récupère les données de l'événement passées en paramètre de navigation
  const { event } = route.params;

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Extraire les informations avec fallbacks
  const eventTitle = event?.nom_event || "Titre non disponible";
  const eventDate = formatDate(event?.date);
  const eventDescription = event?.description || "Aucune description disponible";
  const eventPhoto = event?.photo || "https://placehold.co/400x300/222/fff?text=Pas+Image";
  
  // Gérer les cas où ville et type_evenements peuvent être des objets ou des strings
  const eventVille = event?.ville?.nom_ville || event?.ville || "Lieu non défini";
  const eventType = event?.type_evenements?.nom_event || event?.type_event || "Type inconnu";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Bouton de retour */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Image de l'événement */}
        <Image 
          source={{ uri: eventPhoto }} 
          style={styles.eventImage} 
          resizeMode="cover"
          onError={() => console.log("Erreur chargement image:", eventPhoto)}
        />

        {/* Contenu de la carte de l'événement */}
        <View style={styles.contentContainer}>
          <Text style={styles.eventTitle}>{eventTitle}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#8A2BE2" />
              <Text style={styles.eventDate}>{eventDate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#8A2BE2" />
              <Text style={styles.eventLocation}>{eventVille}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="pricetag-outline" size={20} color="#8A2BE2" />
              <Text style={styles.eventType}>{eventType}</Text>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.eventDescription}>{eventDescription}</Text>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Intéressé</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Participer</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  eventImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#333',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#222',
    borderRadius: 10,
  },
  eventDate: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  eventType: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    borderColor: '#8A2BE2',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});