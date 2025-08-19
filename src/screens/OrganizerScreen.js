// src/screens/OrganizerScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

/**
 * Composant de l'écran d'inscription pour les organisateurs.
 * Permet aux organisateurs de créer un compte avant de créer un événement.
 * @param {object} navigation - L'objet de navigation de React Navigation.
 */
export default function OrganizerScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Gère l'inscription du nouvel organisateur.
   */
  const handleSignup = async () => {
    setLoading(true);
    // TODO: Implémenter la logique d'inscription Supabase pour les organisateurs.
    // Par exemple, en ajoutant un champ 'role' dans la table 'profiles'.
    try {
      if (username && email && password) {
        console.log('Tentative d\'inscription pour un organisateur:', email);
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 2000));
        Alert.alert("Succès", "Compte d'organisateur créé ! Vous pouvez maintenant ajouter votre premier événement.");
        // Navigue directement vers l'écran de création d'événement
        navigation.navigate('EventCreator');
      } else {
        Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      }
    } catch (e) {
      console.error('Erreur d\'inscription:', e);
      Alert.alert("Erreur", "L'inscription a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.container}>
        <Text style={styles.title}>Devenir Organisateur</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Déjà un compte ? <Text style={styles.linkBold}>Se Connecter</Text></Text>
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
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: 20,
    color: '#ccc',
  },
  linkBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
