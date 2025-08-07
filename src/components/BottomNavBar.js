// src/components/BottomNavBar.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Le composant accepte maintenant deux props : onAddPress et onHomePress
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', 
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  addButton: {
    backgroundColor: '#8A2BE2', 
    borderRadius: 30, 
    width: 60, 
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Soulève le bouton
  },
});
