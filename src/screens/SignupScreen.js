// src/screens/SignupScreen.js

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const notify = (message, title = 'Info') => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.LONG);
    else Alert.alert(title, message);
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setCity('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !city.trim() || !password || !confirmPassword) {
      notify('Veuillez remplir tous les champs.', 'Erreur');
      return;
    }
    if (!isValidEmail(email)) {
      notify("L'adresse e‑mail n'est pas valide.", 'Erreur');
      return;
    }
    if (password.length < 6) {
      notify('Le mot de passe doit contenir au moins 6 caractères.', 'Erreur');
      return;
    }
    if (password !== confirmPassword) {
      notify('Les mots de passe ne correspondent pas.', 'Erreur');
      return;
    }

    setLoading(true);

    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        attempt++;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        // 1️⃣ Création utilisateur Supabase Auth
        const { data: userData, error: signUpError } = await supabase.auth.signUp(
          {
            email: email.trim(),
            password,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeout);

        if (signUpError) throw signUpError;

        // 2️⃣ Mise à jour table profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username, ville: city, role: 'visiteur' })
          .eq('id', userData.user.id);

        if (profileError) throw profileError;

        notify('Inscription réussie !', 'Succès');
        resetForm();
        navigation.navigate('Home');
        break;

      } catch (err) {
        console.error(`Tentative ${attempt} - Erreur Supabase signUp:`, err);

        if (err.name === 'AbortError') {
          notify('La requête a dépassé le temps limite. Nouvelle tentative...', 'Attention');
        } else if (attempt > maxRetries) {
          notify(
            err.message || 'Une erreur réseau est survenue. Veuillez réessayer plus tard.',
            'Erreur'
          );
        } else {
          notify('Erreur réseau. Nouvelle tentative...', 'Attention');
        }
      }
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title}>S'inscrire</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
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
          placeholder="Ville"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>
            Déjà un compte ? <Text style={styles.linkBold}>Se Connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 30 },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkText: { marginTop: 18, color: '#ccc' },
  linkBold: { fontWeight: '700', color: '#fff' },
});