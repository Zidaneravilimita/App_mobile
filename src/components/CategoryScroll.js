import React from 'react';
import { ScrollView, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';

// 1. IMPORTEZ VOS IMAGES LOCALES ICI EN UTILISANT require()
import clubImage from "D:/MonApp/assets/images/Club/Club_73.jpg";
import djImage from "D:/MonApp/assets/images/Dj/DJ show img.jpg";
import bouffImage from "D:/MonApp/assets/images/Bouff/Bouff.jpg";
import colorImage from "D:/MonApp/assets/images/Color/Color_Party.jpg";
import concertImage from "D:/MonApp/assets/images/Concert/Concert_pub.jpg";
import festivalImage from "D:/MonApp/assets/images/Festival/festival somaroho 2025.jpg";

// Données pour les catégories
const categories = [
  // 2. UTILISEZ LES VARIABLES IMPORTÉES DIRECTEMENT DANS LE TABLEAU
  // N'utilisez PAS { uri: ... } pour les images locales
  { id: '1', name: 'Soirée night', type: 'Clube', image: clubImage },
  { id: '2', name: 'Soirée night', type: 'DJ', image: djImage },
  { id: '3', name: 'Soirée night', type: 'bouff', image: bouffImage },
  { id: '4', name: 'Soirée night', type: 'Color', image: colorImage },
  { id: '5', name: 'Soirée night', type: 'Concert', image: concertImage },
  { id: '6', name: 'Soirée night', type: 'Festival', image: festivalImage },
];

export default function CategoryScroll() {
  return (
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
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryCard: {
    width: 130,
    height: 180,
    borderRadius: 15,
    overflow: 'hidden', // Important pour que l'image respecte le borderRadius
    marginRight: 10,
  },
  categoryImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
    // Pour assombrir l'image et améliorer la lisibilité du texte
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imageStyle: {
    borderRadius: 15, // Assure que l'image elle-même a des coins arrondis
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