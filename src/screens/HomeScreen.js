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
import ImageUploader from "../components/ImageUploader";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [currentContent, setCurrentContent] = useState("main");
  const [rawEvents, setRawEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState("all");

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [dateFilter, setDateFilter] = useState("all");

  const handleAddPress = () => {
    setCurrentContent("uploader");
  };

  const handleHomePress = () => {
    setCurrentContent("main");
    fetchEvents();
    setSelectedCategoryId(null);
    setSelectedVilleId("all");
    setDateFilter("all");
  };

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

      if (selectedVilleId !== "all") {
        query = query.eq("id_ville", selectedVilleId);
      }
      if (selectedCategoryId) {
        query = query.eq("id_category", selectedCategoryId);
      }

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

  const renderMainContent = () => {
    if (currentContent === "uploader") {
      return (
        <View style={{ flex: 1 }}>
          <ImageUploader onUploadComplete={handleHomePress} onCancel={handleHomePress} />
        </View>
      );
    }

    return (
      <>
        <Header />

        {showNotification && (
          <View style={[styles.notification, { backgroundColor: colors.primary }]}>
            <Ionicons name="cloud-done" size={16} color="#fff" />
            <Text style={styles.notificationText}>Connecté à Supabase</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('categories')}</Text>
          <View style={styles.categoryContainer}>
            <CategoryScroll categories={categories} onSelectCategory={(id) => setSelectedCategoryId(id)} />
          </View>

          <View style={styles.rowFilters}>
            <View
              style={[
                styles.pickerPill,
                { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: '#000', overflow: 'hidden' },
              ]}
            >
              <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.pickerIcon} />
              <Picker
                selectedValue={selectedVilleId}
                onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
                mode="dropdown"
                dropdownIconColor={colors.muted}
                dropdownIconRippleColor="transparent"
                style={[styles.pickerFlex, { color: colors.text, backgroundColor: 'transparent' }]}
              >
                <Picker.Item label="Toutes les villes" value="all" />
                {villes.map((ville) => (
                  <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
                ))}
              </Picker>
            </View>

            <View
              style={[
                styles.pickerPill,
                { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: '#000', overflow: 'hidden' },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.pickerIcon} />
              <Picker
                selectedValue={dateFilter}
                onValueChange={(val) => setDateFilter(val)}
                mode="dropdown"
                dropdownIconColor={colors.muted}
                dropdownIconRippleColor="transparent"
                style={[styles.pickerFlex, { color: colors.text, backgroundColor: 'transparent' }]}
              >
                <Picker.Item label="Toutes les dates" value="all" />
                <Picker.Item label="À venir" value="upcoming" />
                <Picker.Item label="Passés" value="past" />
              </Picker>
            </View>
          </View>

          <Text style={{ color: colors.text, ...styles.popularTitle }}>{t('available_events')}</Text>
          {loadingEvents ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ ...styles.loader }} />
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard key={event.id_event} event={event} onPress={() => handleEventPress(event)} />
            ))
          ) : (
            <View style={{ ...styles.noEventsContainer }}>
              <Ionicons name="search" size={60} color={colors.muted} />
              <Text style={{ color: colors.text, ...styles.noEventsText }}>Aucun événement trouvé</Text>
              <Text style={{ color: colors.subtext, ...styles.noEventsSubtext }}>Essayez de changer les filtres ou revenez plus tard</Text>
              <TouchableOpacity style={{ ...styles.resetButton }} onPress={() => { setSelectedVilleId("all"); setSelectedCategoryId(null); setDateFilter("all"); }}>
                <Text style={{ color: "#fff", fontWeight: "bold", ...styles.resetButtonText }}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderMainContent()}
        <BottomNavBar onAddPress={handleAddPress} onHomePress={handleHomePress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollViewContent: { paddingBottom: 20, paddingHorizontal: 15 },
  notification: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  notificationText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  categoryContainer: { height: 140, marginVertical: 5, marginBottom: 20 },
  rowFilters: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  pickerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 10,
    // subtle shadow (Android + iOS)
    elevation: 1,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pickerIcon: { marginRight: 8 },
  pickerFlex: { flex: 1 },
  loader: { marginTop: 20 },
  popularTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  noEventsContainer: { alignItems: 'center', padding: 40 },
  noEventsText: { fontSize: 20, fontWeight: 'bold', marginTop: 15, marginBottom: 8 },
  noEventsSubtext: { fontSize: 14, textAlign: 'center', marginBottom: 25 },
  resetButton: { backgroundColor: '#8A2BE2', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  resetButtonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
});