// src/screens/LoginScreen.js
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";

export default function LoginScreen({ navigation, route }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [email, setEmail] = useState(route.params?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-80));
  const [notification, setNotification] = useState({ message: "", type: "" });

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    Animated.timing(slideAnim, { toValue: 10, duration: 400, useNativeDriver: false }).start(() => {
      setTimeout(() => {
        Animated.timing(slideAnim, { toValue: -80, duration: 400, useNativeDriver: false }).start();
      }, 3000);
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showNotification("Veuillez remplir tous les champs.", "error");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
        const mode = route.params?.mode;
        const target = mode === 'visitor' ? 'VisitorHome' : 'Home';
        navigation.reset({ index: 0, routes: [{ name: target }] });
      }, 1000);
    } catch (err) {
      console.error("Erreur connexion:", err);
      showNotification(err.message || "Email ou mot de passe incorrect", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          styles.notificationContainer,
          notification.type === "success" ? styles.success : styles.error,
          { top: slideAnim },
        ]}
      >
        <Text style={styles.notificationText}>{notification.message}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se Connecter</Text>}
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
  scrollContainer: { flexGrow: 1, justifyContent: "center", paddingVertical: 20 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 30, textAlign: "center" },
  input: { width: "100%", height: 50, backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 15, fontSize: 16, color: "#fff", marginBottom: 15, borderWidth: 1, borderColor: "#555" },
  button: { width: "100%", padding: 15, borderRadius: 10, backgroundColor: "#8A2BE2", alignItems: "center", marginBottom: 15 },
  buttonDisabled: { backgroundColor: "#666", opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  signupContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  signupText: { color: "#ccc", fontSize: 14 },
  signupLink: { fontWeight: "700", color: "#8A2BE2", fontSize: 14 },
  notificationContainer: { position: "absolute", left: 10, right: 10, padding: 12, borderRadius: 8, zIndex: 1000 },
  success: { backgroundColor: "#4BB543" },
  error: { backgroundColor: "#FF4C4C" },
  notificationText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
