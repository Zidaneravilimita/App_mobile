// src/screens/SearchScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import EventCard from "../components/EventCard";
import { supabase } from "../config/supabase";

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [villes, setVilles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVilles();
    fetchCategories();
    // initial load: show all events (sorted décroissant par date)
    performSearch();
  }, []);

  useEffect(() => {
    // auto search when filters change
    performSearch();
  }, [selectedVilleId, selectedCategoryId]);

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from("ville")
        .select("id_ville, nom_ville")
        .order("nom_ville", { ascending: true });
      if (error) throw error;
      setVilles(data || []);
    } catch (e) {
      console.error("fetchVilles", e);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("id_category, nom_category")
        .order("nom_category", { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      console.error("fetchCategories", e);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);

      let queryBuilder = supabase
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

      if (selectedVilleId !== "all") queryBuilder = queryBuilder.eq("id_ville", selectedVilleId);
      if (selectedCategoryId !== "all")
        queryBuilder = queryBuilder.eq("id_category", selectedCategoryId);

      const trimmed = (query || "").trim();
      if (trimmed.length > 0) {
        // recherche sur le titre (insensible casse)
        queryBuilder = queryBuilder.ilike("titre", `%${trimmed}%`);
      }

      // récupérer côté serveur tri décroissant (plus récent / à venir d'abord)
      const { data, error } = await queryBuilder.order("date_event", { ascending: false });
      if (error) throw error;

      setResults(data || []);
    } catch (e) {
      console.error("performSearch", e);
      Alert.alert("Erreur", "Impossible d'effectuer la recherche.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedVilleId("all");
    setSelectedCategoryId("all");
    performSearch();
  };

  const handleEventPress = (event) => {
    navigation.navigate("EventDetails", { event });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        <Header />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Recherche d'événements</Text>

          <View style={styles.searchRow}>
            <View style={styles.inputWrapper}>
              <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Rechercher par titre..."
                placeholderTextColor="#999"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={performSearch}
                style={styles.input}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={performSearch}>
              <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.rowFilters}>
            <View style={[styles.pickerWrapper, styles.sidePicker]}>
              <Picker
                selectedValue={selectedVilleId}
                onValueChange={(val) => setSelectedVilleId(val)}
                style={styles.picker}
              >
                <Picker.Item label="Toutes les villes" value="all" />
                {villes.map((v) => (
                  <Picker.Item key={v.id_ville} label={v.nom_ville} value={v.id_ville} />
                ))}
              </Picker>
            </View>

            <View style={[styles.pickerWrapper, styles.sidePicker]}>
              <Picker
                selectedValue={selectedCategoryId}
                onValueChange={(val) => setSelectedCategoryId(val)}
                style={styles.picker}
              >
                <Picker.Item label="Toutes les catégories" value="all" />
                {categories.map((c) => (
                  <Picker.Item key={c.id_category} label={c.nom_category} value={c.id_category} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={performSearch}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.refreshText}>Actualiser</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.resultsTitle}>Résultats ({results.length})</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#8A2BE2" style={{ marginTop: 24 }} />
          ) : results.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search" size={64} color="#666" />
              <Text style={styles.emptyText}>Aucun événement trouvé</Text>
              <Text style={styles.emptySub}>Essayez d'élargir vos filtres ou le titre.</Text>
            </View>
          ) : (
            results.map((ev) => (
              <EventCard key={ev.id_event} event={ev} onPress={() => handleEventPress(ev)} />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a1a1a" },
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 12, marginBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  searchButton: {
    marginLeft: 8,
    backgroundColor: "#8A2BE2",
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  rowFilters: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  pickerWrapper: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    backgroundColor: "#222",
    justifyContent: "center",
    height: 44,
  },
  sidePicker: { flex: 1, marginRight: 8 },
  picker: { color: "#fff" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  clearText: { color: "#fff", fontWeight: "600" },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8A2BE2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  refreshText: { color: "#fff", marginLeft: 8, fontWeight: "600" },
  resultsTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 14, marginBottom: 8 },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptySub: { color: "#999", marginTop: 6 },
});