// src/screens/HomeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import CategoryScroll from "../components/CategoryScroll";
import EventCard from "../components/EventCard";
import BottomNavBar from "../components/BottomNavBar";
import { supabase } from "../config/supabase";

export default function HomeScreen({ navigation }) {
  const [currentContent, setCurrentContent] = useState("main");
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [villes, setVilles] = useState([]);
  const [selectedVilleName, setSelectedVilleName] = useState("all"); // filtrage par nom de ville

  const handleAddPress = () => setCurrentContent("uploader");
  const handleHomePress = () => {
    setCurrentContent("main");
    fetchEvents(); 
    setSelectedCategoryId(null);
    setSelectedVilleName("all");
  };

  // Charger les villes depuis Supabase
  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from("ville")
        .select("id_ville, nom_ville")
        .order("nom_ville", { ascending: true });
      if (error) throw error;
      setVilles(data);
    } catch (e) {
      console.error("Erreur chargement villes:", e);
      Alert.alert("Erreur", "Impossible de charger les villes.");
    }
  };

  // Charger les catégories depuis Supabase
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("id_category, nom_category, photo")
        .order("nom_category", { ascending: true });
      if (error) throw error;
      setCategories(data);
    } catch (e) {
      console.error("Erreur chargement categories:", e);
      Alert.alert("Erreur", "Impossible de charger les catégories.");
    }
  };

  // Charger les événements depuis Supabase
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      let query = supabase
        .from("events")
        .select(`
          id_event,
          titre,
          description,
          date_event,
          lieu,
          image_url,
          ville,
          id_category
        `);

      // Filtrage par ville (nom)
      if (selectedVilleName !== "all") {
        query = query.eq("ville", selectedVilleName);
      }

      // Filtrage par catégorie
      if (selectedCategoryId) {
        query = query.eq("id_category", selectedCategoryId);
      }

      const { data, error } = await query.order("date_event", { ascending: true });
      if (error) throw error;

      setEvents(data);
    } catch (e) {
      console.error("Erreur chargement événements:", e);
      Alert.alert("Erreur", "Impossible de charger les événements.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchVilles();
    fetchCategories();
    fetchEvents();
  }, []);

  // Recharger les événements à chaque filtre
  useEffect(() => {
    fetchEvents();
  }, [selectedVilleName, selectedCategoryId]);

  const handleEventPress = (event) => {
    navigation.navigate("EventDetails", { event });
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
              La création d'événements sera disponible ici.
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
          <Text style={styles.statusText}>Mode connecté - Données Supabase</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoryContainer}>
            <CategoryScroll
              categories={categories}
              onSelectCategory={(id) => setSelectedCategoryId(id)}
            />
          </View>

          <Text style={styles.sectionTitle}>Filtrer par ville</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedVilleName}
              onValueChange={(itemValue) => setSelectedVilleName(itemValue)}
              style={styles.pickerStyle}
            >
              <Picker.Item label="Toutes les villes" value="all" />
              {villes.map((ville) => (
                <Picker.Item
                  key={ville.id_ville}
                  label={ville.nom_ville}
                  value={ville.nom_ville} // filtrage par nom
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
                  setSelectedVilleName("all");
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
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    gap: 8,
  },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  uploaderContainer: { flex: 1, width: "100%", justifyContent: "center", alignItems: "center" },
  uploaderPlaceholder: { alignItems: "center", padding: 40 },
  placeholderTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 20, marginBottom: 10 },
  placeholderText: { fontSize: 16, color: "#ccc", textAlign: "center", marginBottom: 30, lineHeight: 22 },
  retryButton: { backgroundColor: "#8A2BE2", paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  pickerWrapper: { marginVertical: 10, borderWidth: 1, borderColor: "#555", borderRadius: 8, backgroundColor: "#333", justifyContent: "center", height: 40 },
  pickerStyle: { color: "#fff" },
  categoryContainer: { height: 140, marginVertical: 5, marginBottom: 20 },
  loader: { marginTop: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginTop: 15 },
  popularTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginTop: 15, marginBottom: 10 },
  noEventsContainer: { alignItems: "center", padding: 40 },
  noEventsText: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 15, marginBottom: 8 },
  noEventsSubtext: { fontSize: 14, color: "#ccc", textAlign: "center", marginBottom: 25 },
  resetButton: { backgroundColor: "#8A2BE2", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  resetButtonText: { color: "#fff", fontWeight: "bold" },
  backButton: { position: "absolute", top: 60, left: 20, zIndex: 10 },
});
