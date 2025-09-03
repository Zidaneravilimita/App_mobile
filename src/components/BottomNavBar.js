// src/components/BottomNavBar.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // ✅ Hook de navigation

export default function BottomNavBar({ onAddPress, onHomePress }) {
  const navigation = useNavigation(); // ✅ On récupère directement la navigation

  return (
    <View style={styles.navBarContainer}>
      {/* Bouton Accueil */}
      <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
        <Ionicons name="home" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Bouton Recherche (placeholder pour plus tard) */}
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Bouton Add */}
      <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Bouton Chat (désactivé tant qu’il n’y a pas de ChatScreen) */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Chat')}>
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </TouchableOpacity> 

      {/* Bouton Profil */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
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
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 20, // safe area bas
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
    bottom: 20,
    borderWidth: 4,
    borderColor: '#333',
  },
});
