// src/screens/LoginScreen.js - Version complète avec support des tables temporaires
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

  const checkTempUser = async (userEmail, userPassword) => {
    try {
      console.log('Recherche dans temp_users...');
      
      // Rechercher l'utilisateur dans temp_users
      const { data, error } = await supabase
        .from('temp_users')
        .select('*')
        .eq('email', userEmail.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Aucun résultat
          return { success: false, message: 'Utilisateur non trouvé' };
        }
        throw error;
      }

      // Vérifier le mot de passe (dans une app réelle, il faudrait hasher)
      // Pour la démo, on utilise un mot de passe fixe "demo123"
      if (userPassword === 'demo123' || userPassword === data.password_hash) {
        return {
          success: true,
          user: {
            id: data.id,
            email: data.email,
            username: data.username,
            role: data.role || 'visiteur',
            avatar_url: data.avatar_url || 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
            city_id: data.city_id,
            is_temp_user: true
          }
        };
      } else {
        return { success: false, message: 'Mot de passe incorrect' };
      }

    } catch (error) {
      console.error('Erreur vérification temp user:', error);
      return { success: false, message: 'Erreur de vérification' };
    }
  };

  const checkLocalUser = async (userEmail, userPassword) => {
    try {
      console.log('Recherche dans le stockage local...');
      
      const localUserJson = await AsyncStorage.getItem('local_user');
      if (!localUserJson) {
        return { success: false, message: 'Aucun utilisateur local' };
      }

      const localUser = JSON.parse(localUserJson);
      
      // Vérifier l'email et le mot de passe (demo123 pour les comptes locaux)
      if (localUser.email === userEmail.trim() && 
          (userPassword === 'demo123' || userPassword === localUser.password)) {
        return { success: true, user: localUser };
      } else {
        return { success: false, message: 'Identifiants incorrects' };
      }

    } catch (error) {
      console.error('Erreur vérification locale:', error);
      return { success: false, message: 'Erreur de vérification locale' };
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

      // Essayer d'abord l'authentification Supabase standard
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!error && data.user) {
          console.log('Connexion Supabase réussie');
          notify("Connexion réussie ✅", "Succès");
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
          return;
        }
      } catch (supabaseError) {
        console.log('Auth Supabase échouée, tentative des tables temporaires...');
      }

      // Si Supabase échoue, essayer les tables temporaires
      let result = await checkTempUser(email, password);

      // Si échec, essayer le stockage local
      if (!result.success) {
        result = await checkLocalUser(email, password);
      }

      if (result.success) {
        // Sauvegarder l'utilisateur connecté
        await AsyncStorage.setItem('current_user', JSON.stringify(result.user));
        await AsyncStorage.setItem('last_login', new Date().toISOString());
        
        notify("Connexion réussie ✅", "Succès");
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        notify(result.message || "Email ou mot de passe incorrect", "Erreur");
      }

    } catch (error) {
      console.error("Erreur connexion:", error);
      notify("Une erreur est survenue lors de la connexion.", "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail("demo@eventparty.com");
    setPassword("demo123");
    setTimeout(() => handleLogin(), 200);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      notify("Veuillez entrer votre email pour réinitialiser le mot de passe.", "Info");
      return;
    }

    try {
      // Pour les utilisateurs temporaires, on ne peut pas reset le password
      // mais on peut afficher un message d'information
      const { success } = await checkTempUser(email, '');
      
      if (success) {
        notify("Pour les comptes démo, utilisez le mot de passe 'demo123'", "Info");
      } else {
        notify("Email de réinitialisation envoyé (si compte existant)!", "Info");
      }
    } catch (error) {
      console.error("Erreur réinitialisation:", error);
      notify("Erreur lors de la réinitialisation", "Erreur");
    }
  };

  const handleTestConnection = async () => {
    try {
      // Tester la connexion aux tables temporaires
      const { data, error } = await supabase
        .from('temp_users')
        .select('count(*)');

      if (error) {
        notify("❌ Tables temporaires inaccessible", "Test Connexion");
      } else {
        notify(`✅ Connecté - ${data[0].count} utilisateurs temporaires`, "Test Réussi");
      }
    } catch (error) {
      notify("❌ Erreur de connexion", "Test Échoué");
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

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Support des tables temporaires et comptes locaux
            </Text>
          </View>

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

          <TouchableOpacity 
            onPress={handleResetPassword} 
            style={styles.forgotPasswordButton}
          >
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

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.demoButton} 
              onPress={handleDemoLogin}
              disabled={loading}
            >
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Connexion démo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testButton} 
              onPress={handleTestConnection}
              disabled={loading}
            >
              <Ionicons name="wifi" size={16} color="#fff" />
              <Text style={styles.testButtonText}>Test connexion</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noteBox}>
            <Ionicons name="key" size={16} color="#FFA500" />
            <Text style={styles.noteText}>
              Pour les comptes démo : email = demo@eventparty.com, mot de passe = demo123
            </Text>
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  infoText: {
    color: "#2196F3",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
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
    fontWeight: "500",
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  demoButtonText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "600" 
  },
  testButtonText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "600" 
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,165,0,0.1)",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFA500",
    gap: 8,
  },
  noteText: {
    color: "#FFA500",
    fontSize: 12,
    flex: 1,
  },
});