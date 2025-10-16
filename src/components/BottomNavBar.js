// src/components/BottomNavBar.js 
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { ms } from "../theme/responsive";

export default function BottomNavBar({ onHomePress, onAddPress, hideAdd = false }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.navBarContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {/* Bouton Accueil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (onHomePress) onHomePress();
          navigation.navigate("Home");
        }}
      >
        <Ionicons name="home-outline" size={ms(22)} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{t('home')}</Text>
      </TouchableOpacity>

      {/* Bouton Recherche */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          navigation.navigate("Search");
        }}
      >
        <Ionicons name="search-outline" size={ms(22)} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{t('search')}</Text>
      </TouchableOpacity>

      {/* Bouton Add (masqué pour les visiteurs) */}
      {!hideAdd ? (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary, borderColor: colors.border }]}
          onPress={() => {
            if (onAddPress) onAddPress();
            else navigation.navigate("Add");
          }}
        >
          <Ionicons name="add" size={ms(28)} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: ms(56) }} />
      )}

      {/* Bouton Chat (inversé avec Profil) */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Chat")}
      >
        <Ionicons name="chatbubble-outline" size={ms(22)} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{t('chat')}</Text>
      </TouchableOpacity>

      {/* Bouton Profil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons name="person-outline" size={ms(22)} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{t('profile')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    height: ms(72),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: ms(10),
    borderTopWidth: 1,
    paddingBottom: ms(16),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(6),
  },
  addButton: {
    borderRadius: ms(28),
    width: ms(56),
    height: ms(56),
    justifyContent: 'center',
    alignItems: 'center',
    bottom: ms(16),
    borderWidth: 4,
  },
  label: {
    fontSize: ms(11),
    marginTop: ms(4),
  },
});
