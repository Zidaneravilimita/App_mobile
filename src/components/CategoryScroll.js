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
import { useTheme } from "../theme";
import { useI18n } from "../i18n";

export default function CategoryScroll({ onSelectCategory }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("category")
        .select("id_category, nom_category, description, photo")
        .order("nom_category", { ascending: true });

      if (fetchError) throw fetchError;

      const categoriesWithSafeImage = (data || []).map((cat) => ({
        ...cat,
        photo:
          cat.photo && cat.photo.startsWith("http")
            ? cat.photo
            : `https://placehold.co/100x100/222/fff?text=${encodeURIComponent(
                cat.nom_category?.substring(0, 3) || "CAT"
              )}`,
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
    console.log("Catégorie sélectionnée :", category.nom_category);
    setSelectedCategoryId(category.id_category);
    if (onSelectCategory) onSelectCategory(category.id_category);
  };

  const handleShowAllPress = () => {
    setSelectedCategoryId(null);
    if (onSelectCategory) onSelectCategory(null);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.activityIndicator}
        />
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.subtext }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchCategories}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (categories.length === 0) {
      return (
        <View style={styles.noCategoriesContainer}>
          <Text style={[styles.noCategoriesText, { color: colors.subtext }]}>Aucune catégorie trouvée.</Text>
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
        {/* Bouton "Tout afficher" */}
        <TouchableOpacity
          style={[
            styles.categoryCard,
            styles.showAllCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            selectedCategoryId === null && { borderColor: colors.primary, backgroundColor: colors.card },
          ]}
          onPress={handleShowAllPress}
        >
          <View style={styles.showAllIconContainer}>
            <Ionicons name="grid-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>{t('category_all')}</Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id_category}
            style={[
              styles.categoryCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedCategoryId === category.id_category && { borderColor: colors.primary, backgroundColor: colors.card },
            ]}
            onPress={() => handleCategoryPress(category)}
          >
            <Image
              source={{ uri: category.photo }}
              style={[styles.categoryImage, { backgroundColor: colors.border }]}
              onError={() =>
                console.log("Erreur image catégorie:", category.nom_category)
              }
            />
            <Text style={[styles.categoryTitle, { color: colors.text }]} numberOfLines={2}>
              {category.nom_category || "Nom inconnu"}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  categoryCard: {
    width: 100,
    height: 120,
    borderRadius: 12,
    marginHorizontal: 6,
    justifyContent: "flex-start",
    alignItems: "center",
    borderWidth: 2,
    // borderColor themed inline
    padding: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  showAllCard: {
    justifyContent: "center",
  },
  showAllIconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryImage: {
    width: "100%",
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryTitle: {
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
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
    paddingHorizontal: 20,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  noCategoriesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noCategoriesText: {
    fontSize: 14,
  },
});
