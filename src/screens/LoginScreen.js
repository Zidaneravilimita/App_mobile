// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

/**
 * Composant de l'écran de connexion.
 * Permet aux utilisateurs existants de se connecter.
 * @param {object} navigation - L'objet de navigation de React Navigation.
 */
export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Gère la connexion de l'utilisateur.
   */
  const handleLogin = async () => {
    setLoading(true);
    // TODO: Implémenter la logique de connexion Supabase ici.
    // Exemple :
    // const { user, error } = await supabase.auth.signInWithPassword({
    //   email: username, // ou utiliser le nom d'utilisateur si votre modèle le supporte
    //   password: password,
    // });
    
    // Pour l'instant, on simule une connexion réussie.
    try {
      if (username && password) {
        console.log('Tentative de connexion pour :', username);
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        Alert.alert("Succès", "Vous êtes maintenant connecté !");
        navigation.navigate('MainApp'); // Navigue vers l'application principale
      } else {
        Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      }
    } catch (e) {
      console.error('Erreur de connexion:', e);
      Alert.alert("Erreur", "La connexion a échoué. Veuillez réessayer.");
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
        <Text style={styles.title}>Se Connecter</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se Connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Pas encore de compte ? <Text style={styles.linkBold}>S'inscrire</Text></Text>
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
