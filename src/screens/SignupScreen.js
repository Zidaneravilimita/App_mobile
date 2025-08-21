// src/screens/SignupScreen.js

import React, { useEffect, useState } from 'react';
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

  // cooldown state to prevent rapid repeated signup/resend calls
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => {
      setCooldownSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

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
    if (cooldownSec > 0) {
      notify(`Veuillez attendre ${cooldownSec}s avant de réessayer.`, 'Trop de requêtes');
      return;
    }
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
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username, ville: city, role: 'visiteur' } },
      });

      if (error) {
        console.error('Supabase signUp error:', error);

        // gérer rate limit
        const messageLower = (error.message || '').toLowerCase();
        const status = error.status ?? null;

        if (status === 429 || messageLower.includes('rate limit') || messageLower.includes('rate')) {
          // appliquer un cooldown côté client (par défaut 1 heure)
          const defaultCooldown = 60 * 60; // 3600s = 1 heure
          setCooldownSec(defaultCooldown);
          notify(
            "Trop de demandes d'email. Attendez un moment avant de réessayer (ou utilisez une autre adresse).",
            'Limite atteinte'
          );
          // log pour debug
          console.warn('Email rate limit exceeded; cooldown started:', defaultCooldown);
          return;
        }

        // autres erreurs : afficher
        notify(error.message || "Échec de l'inscription.", 'Erreur');
        return;
      }

      console.log('DEBUG signUp result:', data);

      const confirmationSent = !!(data?.user?.confirmation_sent_at);
      if (confirmationSent && !data?.session) {
        notify(
          "Inscription réussie. Un email de confirmation a été envoyé. Vérifiez votre boîte mail.",
          'Succès'
        );
        // si tu veux être plus permissif côté client, tu peux configurer un petit cooldown pour éviter resends
        setCooldownSec(60); // bloquer 60s pour éviter re-request immédiate
        resetForm();
        navigation.navigate('Login');
        return;
      }

      notify('Inscription réussie.', 'Succès');
      resetForm();
      navigation.navigate('Login');
    } catch (err) {
      console.error('handleSignup unexpected error:', err);
      notify('Une erreur inattendue est survenue. Voir la console pour les détails.', 'Erreur');
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

        <TouchableOpacity
          style={[styles.button, (loading || cooldownSec > 0) && { opacity: 0.6 }]}
          onPress={handleSignup}
          disabled={loading || cooldownSec > 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {cooldownSec > 0 ? `Réessayer dans ${cooldownSec}s` : 'S\'inscrire'}
            </Text>
          )}
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