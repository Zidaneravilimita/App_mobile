// src/screens/LoginScreen.js - Version complète et à jour
import React, { useState } from "react";
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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState(route.params?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState("");

  const notify = (message, title = "Info") => {
    setErrorDetails(message);
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      notify("Veuillez remplir tous les champs.", "Erreur");
      return;
    }

    setLoading(true);
    setErrorDetails("");

    try {
      console.log("Tentative de connexion avec:", email.trim());

      // Essayer la connexion Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Erreur Supabase:", error);
        
        if (error.message?.includes('Invalid login credentials')) {
          notify("Email ou mot de passe incorrect.", "Erreur");
          return;
        }
        
        if (error.message?.includes('Email not confirmed')) {
          notify("Veuillez confirmer votre email avant de vous connecter.", "Info");
          return;
        }

        // Si erreur de serveur, essayer le mode local
        if (error.message?.includes('Failed to fetch') || error.status === 500) {
          notify("Serveur inaccessible. Vérification du mode local...", "Info");
          return handleLocalLogin();
        }

        throw error;
      }

      if (data.user) {
        // Vérifier/créer le profil
        await ensureUserProfile(data.user);
        
        notify("Connexion réussie ✅", "Succès");
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }

    } catch (error) {
      console.error("Erreur connexion:", error);
      notify("Une erreur est survenue lors de la connexion.", "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const ensureUserProfile = async (user) => {
    try {
      // Vérifier si le profil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Créer le profil s'il n'existe pas
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email.split('@')[0],
            role: 'visiteur',
            avatar_url: user.user_metadata?.avatar_url || 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
            bio: 'Nouveau utilisateur EventParty',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (insertError) {
          console.warn('Erreur création profil:', insertError);
        }
      }
    } catch (error) {
      console.warn('Erreur vérification profil:', error);
    }
  };

  const handleLocalLogin = async () => {
    try {
      // Vérifier si un utilisateur local existe
      const localUserJson = await AsyncStorage.getItem('local_user');
      if (!localUserJson) {
        notify("Aucun compte local trouvé. Veuillez vous inscrire.", "Info");
        return;
      }

      const localUser = JSON.parse(localUserJson);
      
      // Vérifier les identifiants
      if (localUser.email === email.trim() && password === 'demo123') {
        notify("Connexion mode démo réussie!", "Succès");
        
        // Sauvegarder la session locale
        await AsyncStorage.setItem('user_profile', JSON.stringify(localUser));
        await AsyncStorage.setItem('is_demo_mode', 'true');
        
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        notify("Identifiants locaux incorrects.", "Erreur");
      }
    } catch (error) {
      console.error('Erreur connexion locale:', error);
      notify("Erreur de connexion locale.", "Erreur");
    }
  };

  const handleDemoLogin = () => {
    setEmail("demo@example.com");
    setPassword("demo123");
    setTimeout(() => handleLogin(), 200);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      notify("Veuillez entrer votre email pour réinitialiser le mot de passe.", "Info");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'eventparty://reset-password',
      });

      if (error) throw error;

      notify("Email de réinitialisation envoyé !", "Succès");
    } catch (error) {
      console.error("Erreur réinitialisation:", error);
      notify("Erreur lors de l'envoi de l'email.", "Erreur");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Se Connecter</Text>

          {errorDetails ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
              <Text style={styles.errorText}>{errorDetails}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Adresse e-mail"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoComplete="current-password"
            editable={!loading}
          />

          <TouchableOpacity onPress={handleResetPassword} style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se Connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.demoButton} 
            onPress={handleDemoLogin}
            disabled={loading}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.demoButtonText}>Connexion rapide (Démo)</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a1a1a" },
  scrollContainer: { flexGrow: 1, justifyContent: "center" },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: { 
    position: "absolute", 
    top: Platform.OS === 'ios' ? 50 : 30, 
    left: 20, 
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#fff", 
    marginBottom: 30,
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,107,107,0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
  },
  errorText: {
    color: "#FF6B6B",
    marginLeft: 8,
    flex: 1,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#555",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#8A2BE2",
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#8A2BE2",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#666",
    opacity: 0.7,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FF6B6B",
    gap: 8,
    marginBottom: 20,
  },
  demoButtonText: { 
    color: "#fff", 
    fontSize: 14, 
    fontWeight: "600" 
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: { 
    color: "#ccc",
    fontSize: 14,
  },
  signupLink: { 
    fontWeight: "700", 
    color: "#8A2BE2",
    fontSize: 14,
  },
});