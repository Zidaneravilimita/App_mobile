// src/screens/SignupScreen.js
import React, { useState, useEffect } from "react";
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
  ScrollView,
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

  useEffect(() => {
    loadCities();
  }, []);

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

  const notify = (message, title = "Info") => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      notify("Veuillez remplir tous les champs obligatoires.", "Erreur");
      return;
    }
    if (!isValidEmail(email)) {
      notify("Format d'email invalide.", "Erreur");
      return;
    }
    if (password.length < 6) {
      notify("Le mot de passe doit contenir au moins 6 caractères.", "Erreur");
      return;
    }
    if (password !== confirmPassword) {
      notify("Les mots de passe ne correspondent pas.", "Erreur");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Création du compte dans auth.users
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Erreur signup:", error.message);
        notify("Erreur lors de la création du compte.", "Erreur");
        return;
      }

      const user = data?.user;
      if (!user) {
        notify("Impossible de créer le compte utilisateur.", "Erreur");
        return;
      }

      // 2️⃣ Insertion dans la table profiles
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          username: username.trim(),
          email: email.trim(),
          role: "visiteur",
          avatar_url: "https://i.ibb.co/2n9H0hZ/default-avatar.png",
          id_ville: selectedCityId ? parseInt(selectedCityId, 10) : null,
        },
      ]);

      if (profileError) {
        console.error("Erreur insertion profile:", profileError.message);
        notify("Erreur lors de l'enregistrement du profil.", "Erreur");
        return;
      }

      // Sauvegarder localement
      await AsyncStorage.setItem("user_profile", JSON.stringify({ ...user, username }));

      notify("Inscription réussie 🎉", "Succès");

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }, 1500);
    } catch (err) {
      console.error("Erreur inscription:", err.message);
      notify("Erreur inattendue lors de l'inscription.", "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
                    key={ville.id_ville} // ✅ clé unique corrigée
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#555",
  },
  pickerContainer: { width: "100%", marginBottom: 12 },
  pickerLabel: { color: "#fff", marginBottom: 5, fontSize: 14, fontWeight: "500" },
  picker: { color: "#fff", backgroundColor: "#333" },
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#8A2BE2",
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: { backgroundColor: "#666", opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginText: { color: "#ccc", fontSize: 14 },
  loginLink: { color: "#8A2BE2", fontWeight: "700", fontSize: 14 },
});
