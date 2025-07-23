import React from 'react';
import { View, ScrollView, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';

// 1. IMPORTEZ VOS IMAGES LOCALES ICI EN UTILISANT require()
import clubImage from "D:/MonApp/assets/images/Club/Club_73.jpg";
import djImage from "D:/MonApp/assets/images/Dj/DJ show img.jpg";
import bouffImage from "D:/MonApp/assets/images/Bouff/Bouff.jpg";
import colorImage from "D:/MonApp/assets/images/Color/Color_Party.jpg";
import concertImage from "D:/MonApp/assets/images/Concert/Concert_pub.jpg";
import festivalImage from "D:/MonApp/assets/images/Festival/festival somaroho 2025.jpg";

// Données pour les catégories
const categories = [
  { id: '1', name: 'Soirée night', type: 'Clube', image: clubImage },
  { id: '2', name: 'Soirée night', type: 'DJ', image: djImage },
  { id: '3', name: 'Soirée night', type: 'bouff', image: bouffImage },
  { id: '4', name: 'Soirée night', type: 'Color', image: colorImage },
  { id: '5', name: 'Soirée night', type: 'Concert', image: concertImage },
  { id: '6', name: 'Soirée night', type: 'Festival', image: festivalImage },
];

export default function CategoryScroll() {
  return (
    // <View> englobant le titre et la ScrollView pour une meilleure organisation
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>Catégories</Text> {/* Le nouveau titre */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {categories.map((category) => (
          <TouchableOpacity key={category.id} style={styles.categoryCard}>
            <ImageBackground
              source={category.image}
              style={styles.categoryImage}
              imageStyle={styles.imageStyle} // Appliquer borderRadius à l'image
            >
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryType}>{category.type}</Text>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    paddingHorizontal: 15, // pour aligner le titre et le contenu du carrousel.
    marginBottom: 10, // Un peu d'espace sous toute la section des catégories si nécessaire
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10, // Espacement entre le titre et le début des cartes défilantes
  },
  scrollViewContent: {
    paddingVertical: 10,
    paddingBottom: 30,
  },
  categoryCard: {
    width: 90,
    height: 140,
    borderRadius: 15,
    overflow: 'hidden', 
    marginRight: 15,
  },
  categoryImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imageStyle: {
    borderRadius: 15, 
  },
  categoryName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryType: {
    color: '#fff',
    fontSize: 12,
  },
});