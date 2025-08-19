// src/screens/EventCreatorScreen.js
import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageUploader from '../components/ImageUploader';

/**
 * Écran qui permet de créer un événement. Il encapsule le composant ImageUploader.
 * @param {object} navigation - L'objet de navigation de React Navigation.
 */
export default function EventCreatorScreen({ navigation }) {
  // Gère la navigation de retour.
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Gère la complétion du téléchargement et la navigation de retour.
  const handleUploadComplete = () => {
    Alert.alert("Succès", "Événement créé avec succès !");
    navigation.goBack(); // ou naviguer vers un autre écran pertinent
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.container}>
        <Text style={styles.title}>Créer un événement</Text>
        <ImageUploader onUploadComplete={handleUploadComplete} onClose={handleBackPress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    paddingTop: 80, // Espace pour le bouton de retour
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
});
