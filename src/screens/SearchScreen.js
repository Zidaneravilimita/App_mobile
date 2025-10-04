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
import { useI18n } from "../i18n";

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
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

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from('ville')
        .select('id_ville, nom_ville')
        .order('nom_ville');
      
      if (error) throw error;
      setVilles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('category')
        .select('id_category, nom_category')
        .order('nom_category');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('events')
        .select('id_event, id_user, titre, description, date_event, image_url, id_ville, id_category, lieu_detail, category:category!events_id_category_fkey (nom_category)')
        .order('date_event', { ascending: true });

      // Filtre par titre
      if (query.trim()) {
        queryBuilder = queryBuilder.ilike('titre', `%${query.trim()}%`);
      }

      // Filtre par ville
      if (selectedVilleId !== 'all') {
        queryBuilder = queryBuilder.eq('id_ville', selectedVilleId);
      }

      // Filtre par catégorie
      if (selectedCategoryId !== 'all') {
        queryBuilder = queryBuilder.eq('id_category', selectedCategoryId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      Alert.alert('Erreur', 'Impossible de rechercher les événements');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedVilleId('all');
    setSelectedCategoryId('all');
  };

  const handleEventPress = (event) => {
    navigation.navigate("EventDetails", { event });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Search Events</Text>

          <View style={styles.searchRow}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
              <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search by title..."
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
                <Picker.Item label="All Cities" value="all" />
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
                <Picker.Item label="All Categories" value="all" />
                {categories.map((c) => (
                  <Picker.Item key={c.id_category} label={c.nom_category} value={c.id_category} />
                ))}
              </Picker>
            </View>
          </View>


          <Text style={[styles.resultsTitle, { color: colors.text }]}>Results ({results.length})</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
          ) : results.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search" size={64} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No Events Found</Text>
              <Text style={[styles.emptySub, { color: colors.subtext }]}>Try widening your filters or search terms.</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  searchButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowFilters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sidePicker: {
    height: 50,
  },
  picker: {
    height: 50,
    fontSize: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});