// src/screens/WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Composant de l'écran d'accueil.
 * Permet à l'utilisateur de choisir entre le mode "ORGANISATEUR" et "VISITEUR".
 * @param {object} navigation - L'objet de navigation de React Navigation.
 */
export default function WelcomeScreen({ navigation }) {
  // Gère la navigation vers l'écran d'inscription organisateur
  const handleOrganizerPress = () => {
    navigation.navigate('OrganizerScreen');
  };

  // Gère la navigation vers l'écran de connexion/inscription pour les visiteurs
  const handleVisitorPress = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={40} color="#8A2BE2" />
          <Text style={styles.title}>Bienvenue sur LIBRE APP</Text>
        </View>

        <Text style={styles.subtitle}>
          Choisissez votre mode d'utilisation.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleOrganizerPress}>
          <Ionicons name="mic-circle-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>ORGANISATEUR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleVisitorPress}>
          <Ionicons name="eye-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>VISITEUR</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
