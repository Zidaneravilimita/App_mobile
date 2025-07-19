// src/components/CategoryScroll.js
import React from 'react';
import { ScrollView, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';

// Données fictives pour les catégories
const categories = [
  { id: '1', name: 'Soirée night', type: 'Clube', image: 'https://via.placeholder.com/150x180/663399/FFFFFF?text=Club' },
  { id: '2', name: 'Soirée night', type: 'DJ', image: 'https://via.placeholder.com/150x180/8A2BE2/FFFFFF?text=DJ' },
  { id: '3', name: 'Soirée night', type: 'bouff', image: 'https://via.placeholder.com/150x180/FF69B4/FFFFFF?text=Food' },
  { id: '4', name: 'Soirée night', type: 'Color', image: 'https://via.placeholder.com/150x180/00CED1/FFFFFF?text=Color' },
  { id: '5', name: 'Soirée night', type: 'Concert', image: 'https://via.placeholder.com/150x180/ADFF2F/FFFFFF?text=Concert' },
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
            source={{ uri: category.image }}
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