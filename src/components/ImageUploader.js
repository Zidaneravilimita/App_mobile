// src/components/ImageUploader.js
import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Alert,
  ActivityIndicator,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../config/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ImageUploader({ onUploadComplete, onClose }) {
  const navigation = useNavigation();

  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLieu, setEventLieu] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- charger villes + catégories + demander permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        try {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission requise",
              "Nous avons besoin d'accéder à votre galerie pour sélectionner une image."
            );
          }
        } catch (e) {
          console.warn("Erreur permission image picker:", e);
        }
      }
      fetchVilles();
      fetchCategories();
    })();
  }, []);

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from("ville")
        .select("*")
        .order("nom_ville", { ascending: true });
      if (error) throw error;
      setVilles(data || []);
    } catch (err) {
      console.error("Erreur chargement villes:", err);
      Alert.alert("Erreur", "Impossible de charger les villes.");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("*")
        .order("nom_category", { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
      Alert.alert("Erreur", "Impossible de charger les catégories.");
    }
  };

  // convertir uri en blob
  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    if (!response.ok) throw new Error("Impossible de récupérer le fichier local");
    return await response.blob();
  };

  // Sélection image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled) {
        console.log("Sélection annulée");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        console.log("Image sélectionnée:", uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection image:", error);
      Alert.alert(
        "Erreur",
        "Impossible de sélectionner l'image. Mets à jour expo-image-picker si nécessaire."
      );
    }
  };

  // Upload event
  const uploadEvent = async () => {
    if (
      !imageUri ||
      !eventTitle.trim() ||
      !eventDescription.trim() ||
      !selectedVilleId ||
      !selectedCategoryId ||
      !eventDate ||
      !eventLieu.trim()
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Erreur", "Vous devez être connecté.");
        setUploading(false);
        return;
      }

      const blob = await uriToBlob(imageUri);
      const ext = blob.type?.split("/")[1] || "jpg";
      const fileName = `${Date.now()}_${user.id}.${ext}`;
      const path = `public_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(path, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: blob.type || "image/jpeg",
        });

      if (uploadError) {
        console.error("Erreur upload:", uploadError);
        throw uploadError;
      }

      const { data: pubData } = supabase.storage
        .from("event-images")
        .getPublicUrl(path);
      const publicUrl = pubData?.publicUrl;

      const { error: insertError } = await supabase.from("events").insert({
        titre: eventTitle.trim(),
        description: eventDescription.trim(),
        date_event: eventDate,
        lieu: eventLieu.trim(),
        image_url: publicUrl,
        id_category: Number(selectedCategoryId),
        id_ville: Number(selectedVilleId),
        id_user: user.id,
      });

      if (insertError) throw insertError;

      Alert.alert("Succès", "Événement publié avec succès !");
      setImageUri(null);
      setEventTitle("");
      setEventDescription("");
      setEventLieu("");
      setEventDate("");
      setSelectedVilleId(null);
      setSelectedCategoryId(null);
      onUploadComplete?.();
    } catch (err) {
      console.error("Erreur upload ou insertion:", err);
      Alert.alert("Erreur", `Échec: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (event, date) => {
    const currentDate = date || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    setSelectedDate(currentDate);
    setEventDate(currentDate.toISOString().split("T")[0]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Créer un événement</Text>

        <TextInput
          style={styles.input}
          placeholder="Titre"
          placeholderTextColor="#aaa"
          value={eventTitle}
          onChangeText={setEventTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor="#aaa"
          value={eventDescription}
          onChangeText={setEventDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Lieu"
          placeholderTextColor="#aaa"
          value={eventLieu}
          onChangeText={setEventLieu}
        />

        {/* Picker ville */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVilleId}
            onValueChange={setSelectedVilleId}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionner une ville" value={null} />
            {villes.map((v) => (
              <Picker.Item key={v.id_ville} label={v.nom_ville} value={v.id_ville} />
            ))}
          </Picker>
        </View>

        {/* Picker catégorie */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionner une catégorie" value={null} />
            {categories.map((c) => (
              <Picker.Item key={c.id_category} label={c.nom_category} value={c.id_category} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateInputButton}
        >
          <Ionicons
            name="calendar-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.dateInputText}>
            {eventDate ? `Date : ${eventDate}` : "Sélectionner la date"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Ionicons
            name="image-outline"
            size={28}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.pickImageButtonText}>Ajouter une image</Text>
        </TouchableOpacity>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}

        {uploading && <ActivityIndicator size="large" color="#8A2BE2" style={styles.activityIndicator} />}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              if (onClose) {
                onClose();
              } else {
                navigation.navigate("Home");
              }
            }}
          >
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.uploadButton]}
            onPress={uploadEvent}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading ? "Envoi..." : "Publier"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#1a1a1a", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 16, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 14, borderRadius: 8, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: "#555" },
  textArea: { height: 100, textAlignVertical: "top" },
  pickerContainer: { backgroundColor: "#333", borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#555" },
  picker: { color: "#fff" },
  dateInputButton: { backgroundColor: "#333", padding: 14, borderRadius: 8, marginBottom: 12, flexDirection: "row", alignItems: "center" },
  dateInputText: { color: "#fff", fontSize: 15 },
  pickImageButton: { backgroundColor: "#333", padding: 12, borderRadius: 8, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  pickImageButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  imagePreview: { width: 260, height: 160, borderRadius: 10, marginVertical: 10, alignSelf: "center" },
  activityIndicator: { marginTop: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  button: { flex: 1, borderRadius: 8, alignItems: "center", marginHorizontal: 5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  uploadButton: { backgroundColor: "#8A2BE2", padding: 14 },
  cancelButton: { backgroundColor: "#555", padding: 14 },
});
