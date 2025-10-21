// src/screens/VisitorHomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
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
import * as Location from 'expo-location';
import Header from "../components/Header";
import CategoryScroll from "../components/CategoryScroll";
import EventCard from "../components/EventCard";
import BottomNavBar from "../components/BottomNavBar";
import { supabase } from "../config/supabase";
import { useI18n } from "../i18n";
import { ms, hp, wp } from "../theme/responsive";

export default function VisitorHomeScreen({ navigation }) {
  const { t } = useI18n();
  const [rawEvents, setRawEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState("all");
  const [autoLocating, setAutoLocating] = useState(false);

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

  const normalize = (s) =>
    (s || "")
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .toLowerCase()
      .trim();

  const autoSelectCityByLocation = useCallback(async () => {
    if (autoLocating) return;
    try {
      setAutoLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, maximumAge: 60000 });
      const geos = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const geo = geos && geos.length > 0 ? geos[0] : null;
      const cityName = geo?.city || geo?.region || geo?.subregion || '';
      const cityNorm = normalize(cityName);
      if (!cityNorm) return;
      const match = villes.find(v => {
        const nameNorm = normalize(v.nom_ville);
        const alt = Array.isArray(v.alternate_names) ? v.alternate_names.map(normalize) : [];
        return (
          (nameNorm && (nameNorm.includes(cityNorm) || cityNorm.includes(nameNorm))) ||
          alt.some(a => a && (a.includes(cityNorm) || cityNorm.includes(a)))
        );
      });
      if (match) setSelectedVilleId(match.id_ville);
    } catch {}
    finally {
      setAutoLocating(false);
    }
  }, [villes, autoLocating]);

  useEffect(() => {
    fetchVilles();
    fetchCategories();
    fetchEvents();
    const timer = setTimeout(() => setShowNotification(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (villes.length > 0 && selectedVilleId === 'all') {
      autoSelectCityByLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villes]);

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
            <Ionicons name="cloud-done" size={ms(16)} color="#fff" />
            <Text style={styles.notificationText}>Connecté à Supabase</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.sectionTitle}>{t('categories')}</Text>
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

          <Text style={styles.popularTitle}>{t('available_events')}</Text>
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
              <Ionicons name="search" size={ms(56)} color="#666" />
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
  scrollViewContent: { paddingBottom: ms(16), paddingHorizontal: ms(14) },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: ms(8),
    gap: ms(8),
  },
  notificationText: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "500",
  },
  pickerWrapper: {
    marginVertical: ms(10),
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: ms(8),
    backgroundColor: "#333",
    justifyContent: "center",
    height: ms(40),
  },
  sidePicker: {
    flex: 1,
    marginRight: ms(8),
  },
  rowFilters: { flexDirection: "row", alignItems: "center" },
  pickerStyle: {
    color: "#fff",
  },
  categoryContainer: {
    height: hp(18),
    marginVertical: ms(4),
    marginBottom: ms(16),
  },
  loader: {
    marginTop: ms(16),
  },
  sectionTitle: {
    fontSize: ms(20),
    fontWeight: "bold",
    color: "#fff",
    marginTop: ms(12),
  },
  popularTitle: {
    fontSize: ms(20),
    fontWeight: "bold",
    color: "#fff",
    marginTop: ms(12),
    marginBottom: ms(8),
  },
  noEventsContainer: {
    alignItems: "center",
    padding: ms(32),
  },
  noEventsText: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#fff",
    marginTop: ms(12),
    marginBottom: ms(6),
  },
  noEventsSubtext: {
    fontSize: ms(12),
    color: "#ccc",
    textAlign: "center",
    marginBottom: ms(20),
  },
  resetButton: {
    backgroundColor: "#8A2BE2",
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: ms(8),
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});


