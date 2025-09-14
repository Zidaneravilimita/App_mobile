// src/screens/SignupScreen.js
import React, { useState, useEffect } from "react";
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
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  const [notification, setNotification] = useState({ message: "", type: "" });
  const [slideAnim] = useState(new Animated.Value(-80));

  useEffect(() => { loadCities(); }, []);

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const { data, error } = await supabase
        .from("ville")
        .select("id_ville, nom_ville")
        .order("nom_ville", { ascending: true });
      if (error) throw error;
      setCities(data || []);
    } catch (err) {
      console.error("Erreur chargement villes:", err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    Animated.timing(slideAnim, {
      toValue: 10,
      duration: 400,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }, 3000);
    });
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      showNotification("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }
    if (!isValidEmail(email)) {
      showNotification("Format d'email invalide.", "error");
      return;
    }
    if (password.length < 6) {
      showNotification("Le mot de passe doit contenir au moins 6 caractères.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showNotification("Les mots de passe ne correspondent pas.", "error");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Impossible de créer le compte utilisateur.");

      const { error: profileError } = await supabase.from("profiles").insert([{
        id: user.id,
        username: username.trim(),
        email: email.trim(),
        role: "visiteur",
        avatar_url: "https://i.ibb.co/2n9H0hZ/default-avatar.png",
        id_ville: selectedCityId ? parseInt(selectedCityId, 10) : null,
      }]);
      if (profileError) throw profileError;

      await AsyncStorage.setItem("user_profile", JSON.stringify({ ...user, username }));
      showNotification("Inscription réussie 🎉", "success");

      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }, 1500);

    } catch (err) {
      console.error("Erreur inscription:", err.message);
      showNotification(err.message || "Erreur inattendue lors de l'inscription.", "error");
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
          <Text style={styles.title}>Créer un compte</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur *"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Ville</Text>
            {loadingCities ? (
              <ActivityIndicator size="small" color="#8A2BE2" />
            ) : (
              <Picker
                selectedValue={selectedCityId}
                onValueChange={setSelectedCityId}
                style={styles.picker}
                dropdownIconColor="#fff"
                enabled={!loading}
              >
                <Picker.Item label="Choisissez votre ville" value="" />
                {cities.map((ville) => (
                  <Picker.Item
                    key={ville.id_ville}
                    label={ville.nom_ville}
                    value={String(ville.id_ville)}
                  />
                ))}
              </Picker>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Mot de passe *"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe *"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.buttonText}>S'inscrire</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a1a1a" },
  scrollContainer: { flexGrow: 1, paddingVertical: 20 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 20, textAlign: "center" },
  input: { width: "100%", height: 50, backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 15, fontSize: 16, color: "#fff", marginBottom: 12, borderWidth: 1, borderColor: "#555" },
  pickerContainer: { width: "100%", marginBottom: 12 },
  pickerLabel: { color: "#fff", marginBottom: 5, fontSize: 14, fontWeight: "500" },
  picker: { color: "#fff", backgroundColor: "#333" },
  button: { width: "100%", padding: 15, borderRadius: 10, backgroundColor: "#8A2BE2", alignItems: "center", marginTop: 8, flexDirection: "row", justifyContent: "center", gap: 8 },
  buttonDisabled: { backgroundColor: "#666", opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loginContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  loginText: { color: "#ccc", fontSize: 14 },
  loginLink: { color: "#8A2BE2", fontWeight: "700", fontSize: 14 },
  notificationContainer: { position: "absolute", left: 10, right: 10, padding: 12, borderRadius: 8, zIndex: 1000 },
  success: { backgroundColor: "#4BB543" },
  error: { backgroundColor: "#FF4C4C" },
  notificationText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
