// src/screens/HomeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useResponsive } from "../hooks/useResponsive";
import { ms, hp, wp } from "../theme/responsive";

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { spacing, isSmall } = useResponsive();
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
            <Ionicons name="cloud-done" size={ms(16)} color="#fff" />
            <Text style={[styles.notificationText, { fontSize: ms(12) }]}>Connecté à Supabase</Text>
          </View>
        )}

        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.scrollViewContent, { paddingBottom: spacing * 1.25, paddingHorizontal: spacing }]}>
          <View style={styles.categoryContainer}>
            <CategoryScroll categories={categories} onSelectCategory={(id) => setSelectedCategoryId(id)} />
          </View>

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

          <Text style={{ color: colors.text, ...styles.popularTitle, marginTop: spacing, marginBottom: spacing * 0.75 }}>{t('available_events')}</Text>
          {loadingEvents ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ ...styles.loader, marginTop: spacing }} />
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard key={event.id_event} event={event} onPress={() => handleEventPress(event)} />
            ))
          ) : (
            <View style={{ ...styles.noEventsContainer, padding: spacing * 2.5 }}>
              <Ionicons name="search" size={ms(56)} color={colors.muted} />
              <Text style={{ color: colors.text, ...styles.noEventsText }}>Aucun événement trouvé</Text>
              <Text style={{ color: colors.subtext, ...styles.noEventsSubtext, marginBottom: spacing * 1.5 }}>Essayez de changer les filtres ou revenez plus tard</Text>
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
  scrollViewContent: { paddingBottom: ms(16), paddingHorizontal: ms(14) },
  notification: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: ms(8), gap: ms(8) },
  notificationText: { color: '#fff', fontSize: ms(12), fontWeight: '500' },
  sectionTitle: { fontSize: ms(20), fontWeight: 'bold', marginTop: ms(12) },
  categoryContainer: { height: hp(18), marginVertical: ms(4), marginBottom: ms(16) },
  rowFilters: { flexDirection: "row", alignItems: "center" },
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
  pickerStyle: {
    color: "#fff",
  },
  loader: { marginTop: ms(16) },
  popularTitle: { fontSize: ms(20), fontWeight: 'bold', marginTop: ms(12), marginBottom: ms(8) },
  noEventsContainer: { alignItems: 'center', padding: ms(32) },
  noEventsText: { fontSize: ms(18), fontWeight: 'bold', marginTop: ms(12), marginBottom: ms(6) },
  noEventsSubtext: { fontSize: ms(12), textAlign: 'center', marginBottom: ms(20) },
  resetButton: { backgroundColor: '#8A2BE2', paddingHorizontal: ms(16), paddingVertical: ms(10), borderRadius: ms(8) },
  resetButtonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { position: 'absolute', top: ms(56), left: ms(16), zIndex: 10 },
});