// src/components/CategoryScroll.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { supabase } from '../config/supabase';
import { Ionicons } from '@expo/vector-icons';

// Ce composant récupère et affiche une liste de catégories d'événements avec des images dans un ScrollView horizontal.
// Il utilise la prop `onSelectCategory` pour gérer la sélection d'une catégorie.
export default function CategoryScroll({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupère les catégories de la base de données Supabase au montage du composant.
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('category').select('*');
      if (error) {
        throw error;
      }
      setCategories(data);
    } catch (e) {
      console.error('Erreur lors de la récupération des catégories :', e);
      setError('Impossible de charger les catégories.');
      Alert.alert('Erreur', 'Impossible de charger les catégories : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Gère l'appui sur une carte de catégorie.
  const handleCategoryPress = (category) => {
    console.log('Catégorie sélectionnée :', category.nom_category);
    if (onSelectCategory) {
      onSelectCategory(category.id_category);
    }
  };

  // Affiche le contenu du composant en fonction des états de chargement et d'erreur.
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#8A2BE2" style={styles.activityIndicator} />;
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
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id_category}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
          >
            {/* Affiche l'image de la catégorie si disponible */}
            {category.image ? (
              <Image source={{ uri: category.image }} style={styles.categoryImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={30} color="#fff" />
              </View>
            )}
            {/* Affiche le nom de la catégorie */}
            <Text style={styles.categoryTitle}>{category.nom_category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140, // Hauteur ajustée
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  categoryCard: {
    backgroundColor: '#333',
    width: 100, // Largeur fixe pour chaque carte
    height: 120, // Hauteur fixe pour chaque carte
    borderRadius: 10,
    marginHorizontal: 5,
    justifyContent: 'flex-start', // Alignement en haut
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    padding: 5,
  },
  categoryImage: {
    width: '100%', // Remplir la largeur du conteneur
    height: 80, // Hauteur fixe pour l'image
    borderRadius: 8, // Coins légèrement arrondis pour l'image
    marginBottom: 5,
  },
  imagePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  activityIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  noCategoriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCategoriesText: {
    color: '#aaa',
    fontSize: 16,
  },
});
