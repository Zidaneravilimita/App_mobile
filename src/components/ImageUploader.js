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
  const [bucketExists, setBucketExists] = useState(false);
  const [checkingBucket, setCheckingBucket] = useState(true);

  useEffect(() => {
    loadInitialData();
    checkBucketExists();
    testBucketConnection();
  }, []);

  const testBucketConnection = async () => {
    try {
      console.log("=== TEST DE CONNEXION BUCKET ===");
      
      // 1. Test de listBuckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log("Tous les buckets:", buckets);
      console.log("Erreur listBuckets:", bucketsError);
      
      // 2. Test direct d'accès au bucket 'images'
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from('images')
          .list();
        
        console.log("Contenu du bucket 'images':", files);
        console.log("Erreur list files:", filesError);
        
        if (filesError) {
          console.log("Code d'erreur:", filesError.code);
          console.log("Message d'erreur:", filesError.message);
        }
        
      } catch (directError) {
        console.error("Erreur accès direct:", directError);
      }
      
    } catch (error) {
      console.error("Erreur générale test:", error);
    }
  };

  const checkBucketExists = async () => {
    try {
      setCheckingBucket(true);
      console.log("Vérification de l'existence du bucket 'images'...");
      
      // Méthode 1: Utiliser listBuckets
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error("Erreur listBuckets:", error);
        
        // Si listBuckets échoue, essayer une méthode alternative
        try {
          // Essayer d'accéder directement au bucket
          const { data: files, error: listError } = await supabase.storage
            .from('images')
            .list('', { limit: 1 });
          
          if (listError) {
            console.log("Bucket inaccessible:", listError);
            setBucketExists(false);
          } else {
            console.log("Bucket accessible via list direct");
            setBucketExists(true);
          }
        } catch (directError) {
          console.error("Erreur accès direct:", directError);
          setBucketExists(false);
        }
      } else {
        const exists = buckets.some(bucket => bucket.name === 'images');
        console.log("Bucket 'images' existe (listBuckets):", exists);
        
        if (!exists) {
          // Double vérification avec une autre méthode
          try {
            const { error: testError } = await supabase.storage
              .from('images')
              .list('', { limit: 1 });
            
            setBucketExists(!testError);
            console.log("Double vérification - Bucket existe:", !testError);
          } catch (testError) {
            console.log("Double vérification - Bucket n'existe pas");
            setBucketExists(false);
          }
        } else {
          setBucketExists(true);
        }
      }
    } catch (error) {
      console.error("Erreur vérification bucket:", error);
      setBucketExists(false);
    } finally {
      setCheckingBucket(false);
    }
  };

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
        setSelectedVilleId(data[0].id_ville);
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
        setSelectedCategoryId(data[0].id_category);
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

  const uploadImageToStorage = async (imageUri, userId) => {
    try {
      console.log("Tentative d'upload vers le bucket 'images'...");
      
      // Essayer quand même même si le bucket n'est pas détecté
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const timestamp = new Date().getTime();
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${userId}_${timestamp}.${fileExt}`;
      
      console.log("Upload du fichier:", fileName);
      
      try {
        // Essayer l'upload malgré tout
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, blob, {
            contentType: blob.type || `image/${fileExt}`,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("Erreur upload:", error);
          return null;
        }

        console.log("Upload réussi!");
        
        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(data.path);

        console.log("URL publique générée:", publicUrl);
        return publicUrl;
        
      } catch (uploadError) {
        console.error("Erreur lors de l'upload:", uploadError);
        return null;
      }

    } catch (error) {
      console.error("Erreur détaillée traitement image:", error);
      return null;
    }
  };

  const ensureUserProfileExists = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Erreur vérification profil:", error);
        return false;
      }

      if (!profile) {
        console.log("Profil n'existe pas, tentative de création...");
        
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: userId }]);

          if (insertError) {
            console.error("Erreur création profil minimaliste:", insertError);
            return false;
          }
          
          console.log("Profil créé avec succès");
          return true;
        } catch (insertError) {
          console.error("Erreur création profil:", insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Erreur inattendue vérification profil:", error);
      return false;
    }
  };

  const uploadEvent = async () => {
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLieu.trim() || !imageUri) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Utilisateur non connecté");
      }

      console.log("Tentative d'upload avec utilisateur:", user.id);

      const profileExists = await ensureUserProfileExists(user.id);
      
      let imageUrl = null;

      // Essayer l'upload même si le bucket n'est pas détecté
      try {
        const uploadedUrl = await uploadImageToStorage(imageUri, user.id);
        if (uploadedUrl && uploadedUrl.startsWith('http')) {
          imageUrl = uploadedUrl;
          console.log("Image uploadée avec succès:", imageUrl);
        }
      } catch (uploadError) {
        console.warn("Échec upload image:", uploadError);
      }

      const insertData = {
        titre: eventTitle.trim(),
        description: eventDescription.trim(),
        date_event: new Date(eventDate).toISOString(),
        lieu_detail: eventLieu.trim(),
        image_url: imageUrl,
        id_category: selectedCategoryId,
        id_ville: selectedVilleId
      };

      if (profileExists) {
        insertData.id_user = user.id;
      }

      const { error: insertError } = await supabase
        .from("events")
        .insert(insertData);

      if (insertError) {
        console.error("Erreur insertion événement:", insertError);
        
        if (insertError.code === '23503') {
          console.log("Tentative sans id_user due à l'erreur de clé étrangère");
          delete insertData.id_user;
          
          const { error: secondError } = await supabase
            .from("events")
            .insert(insertData);

          if (secondError) {
            console.error("Deuxième tentative échouée:", secondError);
            throw new Error("Impossible de créer l'événement");
          }
        } else {
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

  const refreshBucketStatus = async () => {
    await checkBucketExists();
    Alert.alert("Statut actualisé", `Bucket 'images' existe: ${bucketExists ? 'OUI' : 'NON'}`);
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

        {checkingBucket ? (
          <View style={styles.infoContainer}>
            <ActivityIndicator size="small" color="#8A2BE2" />
            <Text style={styles.infoText}>Vérification du bucket...</Text>
          </View>
        ) : !bucketExists ? (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color="#ff9900" />
            <Text style={styles.warningText}>
              Le bucket 'images' n'est pas détecté
            </Text>
            <Text style={styles.warningSubtext}>
              L'application tentera quand même d'uploader les images
            </Text>
            <TouchableOpacity onPress={refreshBucketStatus} style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.refreshButtonText}>Actualiser le statut</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.successText}>
              Bucket 'images' détecté avec succès
            </Text>
          </View>
        )}

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
          
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton]} 
            onPress={uploadEvent} 
            disabled={uploading || checkingBucket}
          >
            <Text style={styles.buttonText}>
              {uploading ? "Publication..." : "Publier"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#1a1a1a", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 20, textAlign: "center" },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoText: {
    color: "#8A2BE2",
    marginLeft: 10,
    fontSize: 14,
  },
  warningContainer: {
    backgroundColor: "#332900",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ff9900",
  },
  warningText: {
    color: "#ff9900",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  warningSubtext: {
    color: "#cc9900",
    fontSize: 12,
    marginBottom: 10,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e3a1e",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  successText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8A2BE2",
    padding: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
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