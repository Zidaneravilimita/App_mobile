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

export default function ImageUploader({ onUploadComplete }) {
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
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([fetchVilles(), fetchCategories()]);
    } catch (error) {
      console.error("Erreur chargement initial:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from("ville")
        .select("id_ville, nom_ville")
        .order("nom_ville");

      if (error) throw error;
      setVilles(data || []);

      if (data && data.length > 0) {
        const antananarivo = data.find(v => v.nom_ville === "Antananarivo");
        setSelectedVilleId(antananarivo ? antananarivo.id_ville : data[0].id_ville);
      }
    } catch (err) {
      console.error("Erreur fetch villes:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("id_category, nom_category")
        .order("nom_category");

      if (error) throw error;
      setCategories(data || []);

      if (data && data.length > 0) {
        const activiteCulturelle = data.find(c => c.nom_category === "Activité Culturelle");
        setSelectedCategoryId(activiteCulturelle ? activiteCulturelle.id_category : data[0].id_category);
      }
    } catch (err) {
      console.error("Erreur fetch categories:", err);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la galerie nécessaire');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur sélection image:", error);
    }
  };

  // Nouvelle fonction pour uploader l'image vers Supabase Storage
  const uploadImageToStorage = async (imageUri, userId) => {
    try {
      // Convertir l'image en blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Créer un nom de fichier unique
      const timestamp = new Date().getTime();
      const fileExt = imageUri.split('.').pop();
      const fileName = `${userId}_${timestamp}.${fileExt}`;
      
      // Uploader le fichier
      const { data, error } = await supabase.storage
        .from('event-images') // Remplacez par le nom de votre bucket
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Erreur upload image:", error);
        return null;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(data.path);

      return publicUrl;

    } catch (error) {
      console.error("Erreur traitement image:", error);
      return null;
    }
  };

  const uploadEvent = async () => {
    // Validation des champs
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLieu.trim() || !imageUri) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setUploading(true);

    try {
      // Récupérer l'utilisateur
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Utilisateur non connecté");
      }

      console.log("Tentative d'upload avec utilisateur:", user.id);

      // 1. Uploader l'image vers Supabase Storage
      const imageUrl = await uploadImageToStorage(imageUri, user.id);
      
      if (!imageUrl) {
        throw new Error("Échec de l'upload de l'image");
      }

      console.log("Image uploadée avec succès:", imageUrl);

      // 2. Insérer l'événement avec l'URL de l'image
      const insertData = {
        titre: eventTitle.trim(),
        description: eventDescription.trim(),
        date_event: new Date(eventDate).toISOString(),
        lieu_detail: eventLieu.trim(),
        image_url: imageUrl, // Utiliser l'URL de Supabase Storage
        id_category: selectedCategoryId,
        id_ville: selectedVilleId,
        id_user: user.id
      };

      const { error: insertError } = await supabase
        .from("events")
        .insert(insertData);

      if (insertError) {
        console.error("Erreur insertion événement:", insertError);
        
        // Essayer sans id_user si erreur de politique RLS
        const insertDataWithoutUser = {
          titre: eventTitle.trim(),
          description: eventDescription.trim(),
          date_event: new Date(eventDate).toISOString(),
          lieu_detail: eventLieu.trim(),
          image_url: imageUrl,
          id_category: selectedCategoryId,
          id_ville: selectedVilleId
          // On retire id_user pour contourner l'erreur RLS
        };

        const { error: secondError } = await supabase
          .from("events")
          .insert(insertDataWithoutUser);

        if (secondError) {
          console.error("Deuxième tentative échouée:", secondError);
          throw new Error("Impossible de créer l'événement");
        }
      }

      Alert.alert("Succès", "Événement créé avec succès !", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("Home");
            onUploadComplete?.();
          }
        }
      ]);

    } catch (err) {
      console.error("❌ Erreur finale:", err);
      Alert.alert("Erreur", err.message || "Impossible de créer l'événement. Contactez l'administrateur.");
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

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Créer un événement</Text>

        <TextInput 
          style={styles.input} 
          placeholder="Titre de l'événement" 
          value={eventTitle} 
          onChangeText={setEventTitle} 
          placeholderTextColor="#aaa" 
        />
        
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Description" 
          value={eventDescription} 
          onChangeText={setEventDescription} 
          multiline 
          placeholderTextColor="#aaa" 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Lieu détaillé" 
          value={eventLieu} 
          onChangeText={setEventLieu} 
          placeholderTextColor="#aaa" 
        />

        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedVilleId} onValueChange={setSelectedVilleId} style={styles.picker}>
            {villes.map((ville) => (
              <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedCategoryId} onValueChange={setSelectedCategoryId} style={styles.picker}>
            {categories.map((category) => (
              <Picker.Item key={category.id_category} label={category.nom_category} value={category.id_category} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
          <Ionicons name="calendar-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.dateInputText}>
            {eventDate || "Sélectionner une date"}
          </Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" onChange={onDateChange} />
        )}

        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.pickImageButtonText}>
            {imageUri ? "Changer l'image" : "Sélectionner une image"}
          </Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}

        {uploading && <ActivityIndicator size="large" color="#8A2BE2" style={styles.loader} />}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={uploadEvent} disabled={uploading}>
            <Text style={styles.buttonText}>{uploading ? "Publication..." : "Publier"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#1a1a1a", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 14, borderRadius: 8, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: "#555" },
  textArea: { height: 100, textAlignVertical: "top" },
  pickerContainer: { backgroundColor: "#333", borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#555", height: 50, justifyContent: "center" },
  picker: { color: "#fff" },
  dateInputButton: { backgroundColor: "#333", padding: 14, borderRadius: 8, flexDirection: "row", alignItems: "center", marginBottom: 12, height: 50, borderWidth: 1, borderColor: "#555" },
  dateInputText: { color: "#fff", fontSize: 16 },
  pickImageButton: { backgroundColor: "#333", padding: 14, borderRadius: 8, flexDirection: "row", alignItems: "center", marginBottom: 12, height: 50, borderWidth: 1, borderColor: "#555" },
  pickImageButtonText: { color: "#fff", fontSize: 16 },
  imagePreview: { width: 200, height: 150, borderRadius: 8, marginBottom: 12, alignSelf: "center" },
  loader: { marginVertical: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 20 },
  button: { flex: 1, padding: 15, borderRadius: 8, alignItems: "center" },
  uploadButton: { backgroundColor: "#8A2BE2" },
  cancelButton: { backgroundColor: "#555" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a" },
  loadingText: { color: "#fff", marginTop: 10 }
});