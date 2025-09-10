// src/screens/HomeScreen.js - Version ultra-simplifiée pour démarrage rapide
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import CategoryScroll from "../components/CategoryScroll";
import EventCard from "../components/EventCard";
import BottomNavBar from "../components/BottomNavBar";
import ImageUploader from "../components/ImageUploader";

// Données statiques pour démarrage rapide
const STATIC_VILLES = [
  { id_ville: 1, nom_ville: "Paris" },
  { id_ville: 2, nom_ville: "Lyon" },
  { id_ville: 3, nom_ville: "Marseille" },
  { id_ville: 4, nom_ville: "Toulouse" },
  { id_ville: 5, nom_ville: "Nice" },
];

const STATIC_TYPES = [
  { id_type_event: 1, nom_event: "Concert", photo: "https://placehold.co/100x100/8A2BE2/fff?text=Concert" },
  { id_type_event: 2, nom_event: "Théâtre", photo: "https://placehold.co/100x100/FF6B6B/fff?text=Theatre" },
  { id_type_event: 3, nom_event: "Sport", photo: "https://placehold.co/100x100/4ECDC4/fff?text=Sport" },
  { id_type_event: 4, nom_event: "Festival", photo: "https://placehold.co/100x100/45B7D1/fff?text=Festival" },
  { id_type_event: 5, nom_event: "Conférence", photo: "https://placehold.co/100x100/96CEB4/fff?text=Conf" },
];

const STATIC_EVENTS = [
  {
    id_event: 1,
    nom_event: "Festival de Jazz de Montréal",
    description: "Le plus grand festival de jazz au monde revient pour une édition exceptionnelle avec des artistes internationaux.",
    date: "2024-07-15",
    photo: "https://placehold.co/400x200/8A2BE2/fff?text=Festival+Jazz",
    ville: "Paris",
    type_event: "Concert"
  },
  {
    id_event: 2,
    nom_event: "Pièce de Théâtre: Hamlet",
    description: "Une adaptation moderne du classique de Shakespeare par la compagnie théâtrale nationale.",
    date: "2024-06-20",
    photo: "https://placehold.co/400x200/FF6B6B/fff?text=Hamlet",
    ville: "Lyon",
    type_event: "Théâtre"
  },
  {
    id_event: 3,
    nom_event: "Match de Football PSG vs OM",
    description: "Le classique du football français dans une ambiance exceptionnelle.",
    date: "2024-05-25",
    photo: "https://placehold.co/400x200/4ECDC4/fff?text=Football",
    ville: "Marseille",
    type_event: "Sport"
  },
  {
    id_event: 4,
    nom_event: "Festival Électro Summer",
    description: "3 jours de musique électronique avec les meilleurs DJs internationaux.",
    date: "2024-08-10",
    photo: "https://placehold.co/400x200/45B7D1/fff?text=Electro",
    ville: "Nice",
    type_event: "Festival"
  },
  {
    id_event: 5,
    nom_event: "Conférence Tech Innovation",
    description: "Rencontrez les leaders de l'innovation technologique et découvrez les tendances de demain.",
    date: "2024-09-05",
    photo: "https://placehold.co/400x200/96CEB4/fff?text=Tech",
    ville: "Toulouse",
    type_event: "Conférence"
  }
];

export default function HomeScreen({ navigation }) {
  const [currentContent, setCurrentContent] = useState("main");
  const [events, setEvents] = useState(STATIC_EVENTS);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [villes, setVilles] = useState(STATIC_VILLES);
  const [types, setTypes] = useState(STATIC_TYPES);
  const [selectedVilleId, setSelectedVilleId] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleAddPress = () => setCurrentContent("uploader");
  const handleHomePress = () => {
    setCurrentContent("main");
    setEvents(STATIC_EVENTS); // Reset to all events
    setSelectedCategoryId(null);
    setSelectedVilleId("all");
  };

  // Filtrer les événements par ville
  useEffect(() => {
    let filteredEvents = STATIC_EVENTS;

    // Filtrer par ville
    if (selectedVilleId !== "all") {
      filteredEvents = filteredEvents.filter(event => {
        const ville = STATIC_VILLES.find(v => String(v.id_ville) === String(selectedVilleId));
        return ville && event.ville === ville.nom_ville;
      });
    }

    // Filtrer par catégorie
    if (selectedCategoryId) {
      filteredEvents = filteredEvents.filter(event => {
        const type = STATIC_TYPES.find(t => String(t.id_type_event) === String(selectedCategoryId));
        return type && event.type_event === type.nom_event;
      });
    }

    setEvents(filteredEvents);
  }, [selectedVilleId, selectedCategoryId]);

  const handleEventPress = (event) => {
    const eventWithDetails = {
      ...event,
      ville: { nom_ville: event.ville },
      type_evenements: { nom_event: event.type_event }
    };
    navigation.navigate("EventDetails", { event: eventWithDetails });
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const renderMainContent = () => {
    if (currentContent === "uploader") {
      return (
        <View style={styles.uploaderContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleHomePress}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.uploaderPlaceholder}>
            <Ionicons name="camera" size={80} color="#666" />
            <Text style={styles.placeholderTitle}>Créer un événement</Text>
            <Text style={styles.placeholderText}>
              La création d'événements sera disponible une fois la connexion Supabase établie.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleHomePress}>
              <Text style={styles.retryButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <>
        <Header />
        <View style={styles.statusBar}>
          <Ionicons name="information-circle" size={16} color="#fff" />
          <Text style={styles.statusText}>Mode démonstration - Données statiques</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoryContainer}>
            <CategoryScroll
              categories={types}
              onSelectCategory={handleCategorySelect}
            />
          </View>

          <Text style={styles.sectionTitle}>Filtrer par ville</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedVilleId}
              onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
              style={styles.pickerStyle}
            >
              <Picker.Item label="Toutes les villes" value="all" />
              {villes.map((ville) => (
                <Picker.Item
                  key={ville.id_ville}
                  label={ville.nom_ville}
                  value={String(ville.id_ville)}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.popularTitle}>Événements disponibles</Text>
          {loadingEvents ? (
            <ActivityIndicator size="large" color="#8A2BE2" style={styles.loader} />
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard
                key={event.id_event}
                event={event}
                onPress={() => handleEventPress(event)}
              />
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <Ionicons name="search" size={60} color="#666" />
              <Text style={styles.noEventsText}>Aucun événement trouvé</Text>
              <Text style={styles.noEventsSubtext}>
                Essayez de changer les filtres ou revenez plus tard
              </Text>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => {
                  setSelectedVilleId("all");
                  setSelectedCategoryId(null);
                }}
              >
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {renderMainContent()}
        <BottomNavBar onAddPress={handleAddPress} onHomePress={handleHomePress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a1a1a" },
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  scrollViewContent: { paddingBottom: 20, paddingHorizontal: 15 },

  // Status bar
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    gap: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },

  // Uploader placeholder
  uploaderContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  uploaderPlaceholder: {
    alignItems: "center",
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },

  // No events
  noEventsContainer: {
    alignItems: "center",
    padding: 40,
  },
  noEventsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 15,
    marginBottom: 8,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  resetButton: {
    backgroundColor: "#8A2BE2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Retry button
  retryButton: {
    backgroundColor: "#8A2BE2",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Existing styles
  pickerWrapper: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    backgroundColor: "#333",
    justifyContent: "center",
    height: 40,
  },
  pickerStyle: { color: "#fff" },
  categoryContainer: { height: 140, marginVertical: 5, marginBottom: 20 },
  backButton: { position: "absolute", top: 60, left: 20, zIndex: 10 },
  loader: { marginTop: 20 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 15,
  },
  popularTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 15,
    marginBottom: 10,
  },
});