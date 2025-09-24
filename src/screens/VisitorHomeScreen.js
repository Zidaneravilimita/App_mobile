// src/screens/VisitorHomeScreen.js
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

export default function VisitorHomeScreen({ navigation }) {
  const [rawEvents, setRawEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState("all");

  // Seul filtre de date (all | upcoming | past)
  const [dateFilter, setDateFilter] = useState("all");

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from("ville")
        .select("id_ville, nom_ville")
        .order("nom_ville", { ascending: true });
      if (error) throw error;
      setVilles(data || []);
    } catch (e) {
      console.error("Erreur chargement villes:", e);
      Alert.alert("Erreur", "Impossible de charger les villes.");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("id_category, nom_category, photo")
        .order("nom_category", { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      console.error("Erreur chargement categories:", e);
      Alert.alert("Erreur", "Impossible de charger les catégories.");
    }
  };

  // Charger les événements (tri côté serveur : décroissant => plus récents / à venir d'abord)
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
          lieu_detail,
          image_url,
          id_category,
          id_ville,
          category!events_id_category_fkey (id_category, nom_category),
          ville (id_ville, nom_ville)
        `);

      if (selectedVilleId !== "all") query = query.eq("id_ville", selectedVilleId);
      if (selectedCategoryId) query = query.eq("id_category", selectedCategoryId);

      // Descendant : plus récent / à venir en tête
      const { data, error } = await query.order("date_event", { ascending: false });
      if (error) throw error;

      setRawEvents(data || []);
    } catch (e) {
      console.error("Erreur chargement événements:", e);
      Alert.alert("Erreur", "Impossible de charger les événements.");
      setRawEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Filtre de date (upcoming / past / all) et tri décroissant par date
  const filterAndSortEvents = () => {
    const now = Date.now();
    const toTs = (ev) => {
      const d = ev?.date_event;
      if (!d) return null;
      const t = Date.parse(d);
      return Number.isFinite(t) ? t : null;
    };

    let list = (rawEvents || []).slice();

    if (dateFilter === "upcoming") {
      list = list.filter((ev) => {
        const ts = toTs(ev);
        return ts !== null && ts >= now;
      });
    } else if (dateFilter === "past") {
      list = list.filter((ev) => {
        const ts = toTs(ev);
        return ts !== null && ts < now;
      });
    }

    // Tri décroissant : plus récent / à venir d'abord
    list.sort((a, b) => {
      const ta = toTs(a);
      const tb = toTs(b);
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return tb - ta;
    });

    setEvents(list);
  };

  useEffect(() => {
    fetchVilles();
    fetchCategories();
    fetchEvents();
    const timer = setTimeout(() => setShowNotification(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedVilleId, selectedCategoryId]);

  useEffect(() => {
    filterAndSortEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEvents, dateFilter]);

  const handleEventPress = (event) => {
    navigation.navigate("EventDetails", { event });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        <Header />

        {showNotification && (
          <View style={styles.notification}>
            <Ionicons name="cloud-done" size={16} color="#fff" />
            <Text style={styles.notificationText}>Connecté à Supabase</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoryContainer}>
            <CategoryScroll
              categories={categories}
              onSelectCategory={(id) => setSelectedCategoryId(id)}
            />
          </View>

          {/* Ville + Filtre de date côte à côte */}
          <View style={styles.rowFilters}>
            <View style={[styles.pickerWrapper, styles.sidePicker]}>
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
                    value={ville.id_ville}
                  />
                ))}
              </Picker>
            </View>

            <View style={[styles.pickerWrapper, styles.sidePicker]}>
              <Picker
                selectedValue={dateFilter}
                onValueChange={(val) => setDateFilter(val)}
                style={styles.pickerStyle}
              >
                <Picker.Item label="Toutes les dates" value="all" />
                <Picker.Item label="À venir" value="upcoming" />
                <Picker.Item label="Passés" value="past" />
              </Picker>
            </View>
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
                  setDateFilter("all");
                }}
              >
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <BottomNavBar onHomePress={() => fetchEvents()} hideAdd={true} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a1a1a" },
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  scrollViewContent: { paddingBottom: 20, paddingHorizontal: 15 },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 8,
    gap: 8,
  },
  notificationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  pickerWrapper: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    backgroundColor: "#333",
    justifyContent: "center",
    height: 40,
  },
  sidePicker: {
    flex: 1,
    marginRight: 8,
  },
  rowFilters: { flexDirection: "row", alignItems: "center" },
  pickerStyle: {
    color: "#fff",
  },
  categoryContainer: {
    height: 140,
    marginVertical: 5,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
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
});


