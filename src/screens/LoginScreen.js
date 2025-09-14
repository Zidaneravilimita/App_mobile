// src/screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState(route.params?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showNotification("Veuillez remplir tous les champs.", "error");
      return;
    }

    setLoading(true);

    try {
      console.log("Tentative de connexion avec:", email.trim());

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Impossible de récupérer l'utilisateur.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const userData = { ...user, ...profile };

      await AsyncStorage.setItem("current_user", JSON.stringify(userData));
      await AsyncStorage.setItem("last_login", new Date().toISOString());

      showNotification("Connexion réussie ✅", "success");

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }, 1000);

    } catch (err) {
      console.error("Erreur connexion:", err);
      showNotification(err.message || "Une erreur est survenue lors de la connexion.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail("demo@eventparty.com");
    setPassword("demo123");
    setTimeout(handleLogin, 200);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showNotification("Veuillez entrer votre email.", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      showNotification("Un email de réinitialisation a été envoyé.", "success");
    } catch (err) {
      console.error("Erreur reset password:", err);
      showNotification("Erreur lors de la réinitialisation.", "error");
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

          {notification.message ? (
            <View style={[
              styles.notificationContainer,
              notification.type === "success" ? styles.success : styles.error
            ]}>
              <Text style={styles.notificationText}>{notification.message}</Text>
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
          </View>

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
  scrollContainer: { flexGrow: 1, justifyContent: "center", paddingVertical: 20 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  backButton: { 
    position: "absolute", 
    top: Platform.OS === 'ios' ? 50 : 30, 
    left: 20, 
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 30, textAlign: "center" },
  notificationContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  success: { backgroundColor: "#4BB543" },
  error: { backgroundColor: "#FF4C4C" },
  notificationText: { color: "#fff", textAlign: "center", fontWeight: "600" },
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
  forgotPasswordButton: { alignSelf: "flex-end", marginBottom: 20 },
  forgotPasswordText: { color: "#8A2BE2", fontSize: 14, fontWeight: "500" },
  button: { width: "100%", padding: 15, borderRadius: 10, backgroundColor: "#8A2BE2", alignItems: "center", marginBottom: 15 },
  buttonDisabled: { backgroundColor: "#666", opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  buttonRow: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  demoButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FF6B6B", paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, gap: 8, flex: 1 },
  demoButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  signupContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  signupText: { color: "#ccc", fontSize: 14 },
  signupLink: { fontWeight: "700", color: "#8A2BE2", fontSize: 14 },
});
