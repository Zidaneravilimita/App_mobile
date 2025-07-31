// src/components/BottomNavBar.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


export default function BottomNavBar({ onAddPress }) { // Reçoit onAddPress en prop
  return (
    <View style={styles.navBarContainer}>
      <TouchableOpacity style={styles.navItem}>
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
    marginTop: -20, // Pour le faire "sortir" de la barre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // Pour Android
  },
});
