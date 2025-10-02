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
import { useTheme } from "../theme";

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();
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
    performSearch();
  }, []);
  
  useEffect(() => {
    performSearch();
  }, [selectedVilleId, selectedCategoryId]);

  const handleEventPress = (event) => {
    navigation.navigate("EventDetails", { event });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Recherche d'événements</Text>

          <View style={styles.searchRow}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
              <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Rechercher par titre..."
                placeholderTextColor={colors.subtext}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={performSearch}
                style={[styles.input, { color: colors.text }]}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={performSearch}>
              <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.rowFilters}>
            <View style={[styles.pickerWrapper, styles.sidePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={selectedVilleId}
                onValueChange={(val) => setSelectedVilleId(val)}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Toutes les villes" value="all" />
                {villes.map((v) => (
                  <Picker.Item key={v.id_ville} label={v.nom_ville} value={v.id_ville} />
                ))}
              </Picker>
            </View>

            <View style={[styles.pickerWrapper, styles.sidePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={selectedCategoryId}
                onValueChange={(val) => setSelectedCategoryId(val)}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Toutes les catégories" value="all" />
                {categories.map((c) => (
                  <Picker.Item key={c.id_category} label={c.nom_category} value={c.id_category} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.clearBtn, { backgroundColor: colors.card }]} onPress={clearFilters}>
              <Text style={[styles.clearText, { color: colors.text }]}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: colors.primary }]} onPress={performSearch}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={[styles.refreshText, { color: '#fff' }]}>Actualiser</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.resultsTitle, { color: colors.text }]}>Résultats ({results.length})</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
          ) : results.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search" size={64} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>Aucun événement trouvé</Text>
              <Text style={[styles.emptySub, { color: colors.subtext }]}>Essayez d'élargir vos filtres ou le titre.</Text>
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