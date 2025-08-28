// src/screens/LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const notify = (message, title = 'Info') => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.LONG);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      notify('❌ Veuillez remplir tous les champs.', 'Erreur');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Erreur de connexion:', error);
        notify(`❌ ${error.message || 'La connexion a échoué.'}`, 'Erreur');
        return;
      }

      const user = data?.user;
      if (!user) {
        notify('❌ Impossible de récupérer l\'utilisateur après connexion.', 'Erreur');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Erreur récupération profile:', profileError);
        notify('Connexion réussie, mais impossible de charger le profil. Accès limité.', 'Info');
        navigation.navigate('Home'); // <- Redirection vers HomeScreen même si profile non récupéré
        return;
      }

      const username = profile?.username || 'Utilisateur';
      const role = profile?.role;

      if (role === 'organisateur' || role === 'organizer') {
        notify(`✅ Bienvenue ${username} (Organisateur)`, 'Connexion réussie');
        navigation.navigate('OrganizerScreen');
      } else {
        notify(`✅ Bienvenue ${username}`, 'Connexion réussie');
        navigation.navigate('Home'); // <- Modification ici
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      notify(`❌ ${err?.message || 'La connexion a échoué.'}`, 'Erreur');
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
          placeholder="Adresse e-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se Connecter</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>
            Pas encore de compte ? <Text style={styles.linkBold}>S'inscrire</Text>
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
