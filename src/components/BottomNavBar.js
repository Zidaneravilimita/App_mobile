// src/components/BottomNavBar.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


// Reçoit les props onAddPress ET onHomePress
export default function BottomNavBar({ onAddPress, onHomePress }) { 
  return (
    <View style={styles.navBarContainer}>
      {/* Le bouton "Home" appelle la fonction onHomePress passée en prop */}
      <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
        <Ionicons name="home" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
      {/* Le bouton "Add" appelle la fonction onAddPress passée en prop */}
      <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="person" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // Couleur de fond de la barre
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 20, // Pour gérer la safe area sur certains téléphones
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  addButton: {
    backgroundColor: '#8A2BE2', // Couleur violette du bouton "Add"
    borderRadius: 30, // Pour un bouton rond
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Pour le positionner plus haut
    elevation: 8, // Ombre pour Android
    shadowColor: '#8A2BE2', // Ombre pour iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
