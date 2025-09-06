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
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";

import Header from "../components/Header";
import CategoryScroll from "../components/CategoryScroll";
import EventCard from "../components/EventCard";
import BottomNavBar from "../components/BottomNavBar";
import ImageUploader from "../components/ImageUploader";

export default function HomeScreen({ navigation }) {
  const [currentContent, setCurrentContent] = useState("main");

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState(null);

  const [villes, setVilles] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState("all");

  const handleAddPress = () => setCurrentContent("uploader");
  const handleHomePress = () => setCurrentContent("main");

  // 🔹 Fetch événements
  const fetchEvents = async () => {
    setLoadingEvents(true);
    setErrorEvents(null);
    try {
      let query = supabase
        .from("event")
        .select(`
          id_event,
          nom_event,
          description,
          date,
          photo,
          id_ville,
          id_type_event,
          ville!left(nom_ville),
          type_evenements!left(nom_event)
        `)
        .order("date", { ascending: false });

      if (selectedVilleId !== "all") {
        query = query.eq("id_ville", selectedVilleId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const eventsWithPhoto = data.map((ev) => ({
        id_event: ev.id_event,
        nom_event: ev.nom_event || "Titre non disponible",
        description: ev.description || "",
        photo: ev.photo || "https://placehold.co/400x200/222/fff?text=No+Image",
        date: ev.date || "Date inconnue",
        ville: ev.ville?.nom_ville || "Ville inconnue",
        type_event: ev.type_evenements?.nom_event || "Type inconnu",
      }));

      setEvents(eventsWithPhoto);
    } catch (e) {
      console.error("Erreur lors de la récupération des événements :", e);
      setErrorEvents("Impossible de charger les événements.");
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // 🔹 Fetch villes
  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase.from("ville").select("*");
      if (error) throw error;
      setVilles(data || []);
    } catch (e) {
      console.error("Erreur lors de la récupération des villes :", e);
      Alert.alert("Erreur", "Impossible de charger les villes : " + e.message);
    }
  };

  // 🔹 Fetch types d'événements
  const fetchTypes = async () => {
    try {
      const { data, error } = await supabase.from("type_evenements").select("*");
      if (error) throw error;
      setTypes(data || []);
    } catch (e) {
      console.error("Erreur lors de la récupération des types :", e);
      Alert.alert("Erreur", "Impossible de charger les catégories : " + e.message);
    }
  };

  useEffect(() => {
    fetchVilles();
    fetchTypes();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedVilleId]);

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
          <ImageUploader
            onUploadComplete={() => {
              setCurrentContent("main");
              fetchEvents();
            }}
            onClose={handleHomePress}
          />
        </View>
      );
    }

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoryContainer}>
            <CategoryScroll
              categories={types}
              onSelectCategory={(id) => console.log("Catégorie sélectionnée:", id)}
            />
          </View>

          <Text style={styles.sectionTitle}>Filtrer par ville</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedVilleId}
              onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
              style={styles.pickerStyle}
              itemStyle={styles.pickerItemStyle}
            >
              <Picker.Item label="Toutes les villes" value="all" />
              {villes.map((ville) => (
                <Picker.Item
                  key={ville.id_ville}
                  label={ville.nom_ville}
                  value={ville.id_ville}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.popularTitle}>Événements populaires</Text>
          {loadingEvents ? (
            <ActivityIndicator size="large" color="#8A2BE2" style={styles.loader} />
          ) : errorEvents ? (
            <Text style={styles.noEventsText}>{errorEvents}</Text>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard
                key={event.id_event}
                event={event}
                onPress={() => handleEventPress(event)}
              />
            ))
          ) : (
            <Text style={styles.noEventsText}>Aucun événement trouvé.</Text>
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
  pickerItemStyle: { color: "#fff", backgroundColor: "#333" },
  categoryContainer: { height: 140, marginVertical: 5, marginBottom: 20 },
  uploaderContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
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
  noEventsText: { color: "#ccc", textAlign: "center", marginTop: 20, fontSize: 16 },
});
