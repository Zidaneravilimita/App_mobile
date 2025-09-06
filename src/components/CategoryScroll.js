// src/components/CategoryScroll.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { supabase } from "../config/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function CategoryScroll({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Charger les catégories au montage
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("type_evenements") // <-- remplacer "category" par le nom correct de la table
        .select("id_type_event, nom_event, photo")
        .order("nom_event", { ascending: true });

      if (fetchError) throw fetchError;

      const categoriesWithSafeImage = (data || []).map((cat) => ({
        ...cat,
        photo:
          cat.photo && cat.photo.startsWith("http")
            ? cat.photo
            : "https://placehold.co/100x100/222/fff?text=No+Image",
      }));

      setCategories(categoriesWithSafeImage);
    } catch (e) {
      console.error("Erreur lors de la récupération des catégories :", e);
      setError("Impossible de charger les catégories.");
      Alert.alert(
        "Erreur",
        "Impossible de charger les catégories : " + (e.message || e)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category) => {
    console.log("Catégorie sélectionnée :", category.nom_event);
    if (onSelectCategory) onSelectCategory(category.id_type_event);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="large"
          color="#8A2BE2"
          style={styles.activityIndicator}
        />
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    if (categories.length === 0) {
      return (
        <View style={styles.noCategoriesContainer}>
          <Text style={styles.noCategoriesText}>Aucune catégorie trouvée.</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id_type_event}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
          >
            <Image
              source={{ uri: category.photo }}
              style={styles.categoryImage}
            />
            <Text style={styles.categoryTitle}>
              {category.nom_event || "Nom inconnu"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    backgroundColor: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  categoryCard: {
    backgroundColor: "#333",
    width: 100,
    height: 120,
    borderRadius: 10,
    marginHorizontal: 5,
    justifyContent: "flex-start",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#555",
    padding: 5,
  },
  categoryImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginBottom: 5,
  },
  categoryTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  noCategoriesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noCategoriesText: {
    color: "#aaa",
    fontSize: 16,
  },
});
