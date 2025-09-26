// src/components/BottomNavBar.js 
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function BottomNavBar({ onHomePress, onAddPress, hideAdd = false }) {
  const navigation = useNavigation();

  return (
    <View style={styles.navBarContainer}>
      {/* Bouton Accueil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (onHomePress) onHomePress();
          navigation.navigate("Home");
        }}
      >
        <Ionicons name="home-outline" size={24} color="#fff" />
        <Text style={styles.label}>Accueil</Text>
      </TouchableOpacity>

      {/* Bouton Recherche */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          navigation.navigate("Search");
        }}
      >
        <Ionicons name="search-outline" size={24} color="#fff" />
        <Text style={styles.label}>Recherche</Text>
      </TouchableOpacity>

      {/* Bouton Add (masqué pour les visiteurs) */}
      {!hideAdd ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (onAddPress) onAddPress();
            else navigation.navigate("Add");
          }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 60 }} />
      )}

      {/* Bouton Chat (inversé avec Profil) */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Chat")}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        <Text style={styles.label}>Chat</Text>
      </TouchableOpacity>

      {/* Bouton Profil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons name="person-outline" size={24} color="#fff" />
        <Text style={styles.label}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    height: 80,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
  },
  addButton: {
    backgroundColor: "#8A2BE2",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    bottom: 20,
    borderWidth: 4,
    borderColor: "#333",
  },
  label: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
});
