// src/screens/OrganizerScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

/**
 * Composant de l'écran d'inscription pour les organisateurs.
 * Permet aux organisateurs de créer un compte avant de créer un événement.
 * @param {object} navigation - L'objet de navigation de React Navigation.
 */
export default function OrganizerScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Gère l'inscription du nouvel organisateur.
   */
  const handleSignup = async () => {
    setLoading(true);
    try {
      if (username && email && password && confirmPassword) {
        if (password !== confirmPassword) {
          Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
          setLoading(false);
          return;
        }

        console.log('Tentative d\'inscription pour un organisateur:', email);

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              username: username.trim(),
              role: 'organisateur',
            },
          },
        });

        if (signUpError) {
          console.error('Erreur signUp:', signUpError);
          Alert.alert('Erreur', signUpError.message || "Inscription impossible");
          setLoading(false);
          return;
        }

        const userId = signUpData?.user?.id;
        if (userId) {
          // Créer/mettre à jour le profil avec le rôle organisateur
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              username: username.trim(),
              email: email.trim(),
              role: 'organisateur',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          if (profileError) {
            console.warn('Profil non créé, continuer quand même:', profileError);
          }
        }

        Alert.alert(
          "Succès",
          signUpData?.session
            ? "Compte organisateur créé et connecté !"
            : "Compte créé. Vérifiez votre email pour confirmer."
        );

        // Naviguer vers un écran existant pour créer un événement
        navigation.navigate('Add');
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
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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